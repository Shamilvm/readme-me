"use client";

import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Doodle } from "@/components/Doodles";
import type { DoodleName } from "@/lib/doodles";
import {
  CARD_ROLES,
  QUESTION_TYPES,
  applyTemplate,
  blankQuestion,
  blankSection,
  importSection,
  liveQuestions,
  newId,
  problems,
  withTypeDefaults,
  type CardRole,
  type FormDoc,
  type Option,
  type Question,
  type QuestionType,
  type Section,
} from "@/lib/form";
import { discardDraft, loadDraft, publishForm, saveDraft } from "@/lib/store";
import { TEMPLATES, countQuestions } from "@/templates";

const DOODLES: DoodleName[] = ["bit", "mug", "rocket", "laptop", "duck", "pencil", "cursor", "chat", "keycap", "telescope", "cat"];
type SaveState = "idle" | "saving" | "saved" | "error";

/* ═══════════════════════ Workspace (draft state) ═══════════════════════ */

export function FormWorkspace({
  mode,
  published,
  onPublished,
}: {
  mode: "questions" | "texts";
  published: FormDoc;
  onPublished: (doc: FormDoc) => void;
}) {
  const [draft, setDraft] = useState<FormDoc | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<FormDoc | null>(null);

  useEffect(() => {
    loadDraft()
      .then(({ doc, hasDraft }) => {
        setDraft(doc);
        setHasDraft(hasDraft);
      })
      .catch((e) => setError(e?.message ?? "Couldn't load the form."));
  }, []);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!latest.current) return;
    const doc = latest.current;
    latest.current = null;
    setSave("saving");
    try {
      await saveDraft(doc);
      setSave("saved");
      setHasDraft(true);
    } catch (e) {
      latest.current = latest.current ?? doc;
      setSave("error");
      setError((e as Error)?.message ?? "Couldn't save.");
    }
  }, []);

  /** Every edit goes through here: update state, autosave shortly after. */
  const change = useCallback(
    (fn: (d: FormDoc) => FormDoc) => {
      setDraft((d) => {
        if (!d) return d;
        const next = fn(d);
        latest.current = next;
        return next;
      });
      setSave("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 800);
    },
    [flush]
  );

  useEffect(() => () => void flush(), [flush]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  if (error && !draft) return <p className="text-pink">{error}</p>;
  if (!draft) return <p className="label cursor text-muted">Loading the form</p>;

  const issues = problems(draft);
  const publishedIds = new Set(published.sections.flatMap((s) => [s.id, ...s.questions.map((q) => q.id)]));

  return (
    <div>
      {/* Status bar */}
      <div className="ink mb-8 flex flex-wrap items-center gap-3 rounded-full bg-panel py-2 pl-5 pr-2">
        <span className="flex items-center gap-2 text-sm">
          <span className={`size-2.5 rounded-full ${hasDraft ? "bg-amber" : "bg-ok"}`} />
          <span className="font-semibold">{hasDraft ? "Draft has unpublished changes" : "Matches what members see"}</span>
          <span className="text-muted">
            · {save === "saving" ? "Saving…" : save === "error" ? "Couldn't save" : save === "saved" ? "Saved" : ""}
          </span>
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button onClick={() => setLibraryOpen(true)} className="ink ink-hover label rounded-full px-4 py-2 hover:bg-accent-soft">
            Templates
          </button>
          <button
            onClick={async () => {
              await flush();
              window.open("/journey?preview=1", "_blank");
            }}
            className="ink ink-hover label rounded-full px-4 py-2 hover:bg-accent-soft"
          >
            Preview ↗
          </button>
          {hasDraft && (
            <button
              onClick={async () => {
                if (!confirm("Throw away all draft changes and go back to the published form?")) return;
                await flush();
                const doc = await discardDraft();
                setDraft(doc);
                setHasDraft(false);
                setSave("idle");
                flash("Draft discarded");
              }}
              className="label rounded-full px-4 py-2 text-muted hover:text-pink"
            >
              Discard
            </button>
          )}
          <button
            onClick={async () => {
              await flush();
              setPublishOpen(true);
            }}
            disabled={!hasDraft}
            className="ink-hover inline-flex items-center gap-2 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-bg disabled:opacity-40"
          >
            <span className="label">Publish</span>
            <span className="grid size-7 place-items-center rounded-full bg-lime font-bold text-[#161616]">↑</span>
          </button>
        </div>
      </div>

      {mode === "questions" ? (
        <QuestionsEditor draft={draft} change={change} publishedIds={publishedIds} />
      ) : (
        <TextsEditor draft={draft} change={change} />
      )}

      {/* Template library */}
      <Modal open={libraryOpen} onClose={() => setLibraryOpen(false)} title="Template library">
        <TemplateLibrary
          onUse={(t) => {
            if (!confirm(`Replace your draft with “${t.name}”? Answers people already gave are kept on the dashboard.`))
              return;
            change((d) => applyTemplate(d, t.doc));
            setLibraryOpen(false);
            flash(`Draft now uses “${t.name}”`);
          }}
          onAddSection={(s) => {
            change((d) => ({ ...d, sections: [...d.sections, importSection(d, s)] }));
            flash(`Added “${s.heading}” to the end`);
          }}
        />
      </Modal>

      {/* Publish confirmation */}
      <Modal open={publishOpen} onClose={() => setPublishOpen(false)} title="Publish changes?">
        {issues.length ? (
          <div>
            <p>Fix these first:</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-pink">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <p className="leading-relaxed">
              Members will see the new version right away:{" "}
              <b>{liveQuestions(draft).length} questions</b> in{" "}
              <b>{draft.sections.filter((s) => !s.archived).length} sections</b>. Answers already given stay saved.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await publishForm(draft);
                    onPublished(draft);
                    setHasDraft(false);
                    setPublishOpen(false);
                    flash("Published! Members now see the new version.");
                  } catch (e) {
                    setError((e as Error)?.message ?? "Couldn't publish.");
                  }
                }}
                className="ink-hover inline-flex items-center gap-2 rounded-full bg-ink py-2 pl-5 pr-2 text-bg"
              >
                <span className="label">Yes, publish</span>
                <span className="grid size-7 place-items-center rounded-full bg-lime font-bold text-[#161616]">↑</span>
              </button>
              <button onClick={() => setPublishOpen(false)} className="ink label rounded-full px-5 py-2">
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-pink">{error}</p>}
      </Modal>

      <AnimatePresence>
        {toast && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-bg"
            role="status"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════ Questions editor ═══════════════════════ */

type Change = (fn: (d: FormDoc) => FormDoc) => void;

function QuestionsEditor({ draft, change, publishedIds }: { draft: FormDoc; change: Change; publishedIds: Set<string> }) {
  const [showArchived, setShowArchived] = useState(false);
  const visibleSections = draft.sections.filter((s) => showArchived || !s.archived);
  const [selId, setSelId] = useState<string>(visibleSections[0]?.id ?? "");
  const section = draft.sections.find((s) => s.id === selId) ?? visibleSections[0];
  const numbers = useMemo(() => new Map(liveQuestions(draft).map((q) => [q.id, q.number])), [draft]);

  const setSections = (sections: Section[]) => change((d) => ({ ...d, sections }));
  const patchSection = (id: string, patch: Partial<Section>) =>
    change((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* Sections */}
      <aside className="lg:sticky lg:top-32 lg:h-fit">
        <div className="mb-3 flex items-center justify-between">
          <p className="label">Sections</p>
          <label className="label flex items-center gap-1.5 text-muted">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
        </div>
        <Reorder.Group
          axis="y"
          values={draft.sections}
          onReorder={setSections}
          className="space-y-2"
        >
          {draft.sections.map((s) =>
            !showArchived && s.archived ? null : (
              <DragRow key={s.id} value={s}>
                {(handle) => (
                  <button
                    onClick={() => setSelId(s.id)}
                    className={`flex w-full items-center gap-2 rounded-2xl py-2 pl-1 pr-3 text-left transition ${
                      s.id === section?.id ? "bg-ink text-bg" : "ink bg-panel hover:bg-accent-soft"
                    } ${s.archived ? "opacity-60" : ""}`}
                  >
                    {handle}
                    <Doodle name={s.doodle} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="label block truncate">{s.heading || "Untitled"}</span>
                      <span className="block text-xs opacity-70">
                        {s.archived ? "Archived" : `${s.questions.filter((q) => !q.archived).length} questions`}
                      </span>
                    </span>
                  </button>
                )}
              </DragRow>
            )
          )}
        </Reorder.Group>
        <button
          onClick={() => {
            const s = blankSection();
            change((d) => ({ ...d, sections: [...d.sections, s] }));
            setSelId(s.id);
          }}
          className="label mt-3 w-full rounded-2xl border-[1.5px] border-dashed border-edge py-3 hover:bg-accent-soft"
        >
          + Add section
        </button>
        <p className="mt-3 text-xs text-muted">Drag ⠿ to reorder.</p>
      </aside>

      {/* Selected section */}
      {section ? (
        <SectionEditor
          key={section.id}
          section={section}
          sections={draft.sections}
          numbers={numbers}
          showArchived={showArchived}
          isNew={!publishedIds.has(section.id)}
          publishedIds={publishedIds}
          patch={(p) => patchSection(section.id, p)}
          change={change}
          onDeleted={() => setSelId(draft.sections.find((s) => s.id !== section.id)?.id ?? "")}
        />
      ) : (
        <p className="text-muted">Add a section to get started.</p>
      )}
    </div>
  );
}

function SectionEditor({
  section: s,
  sections,
  numbers,
  showArchived,
  isNew,
  publishedIds,
  patch,
  change,
  onDeleted,
}: {
  section: Section;
  sections: Section[];
  numbers: Map<string, number>;
  showArchived: boolean;
  isNew: boolean;
  publishedIds: Set<string>;
  patch: (p: Partial<Section>) => void;
  change: Change;
  onDeleted: () => void;
}) {
  const [openQ, setOpenQ] = useState<string | null>(null);
  const setQuestions = (questions: Question[]) => patch({ questions });
  const patchQ = (qid: string, fn: (q: Question) => Question) =>
    patch({ questions: s.questions.map((q) => (q.id === qid ? fn(q) : q)) });

  return (
    <div>
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <input
            value={s.heading}
            onChange={(e) => patch({ heading: e.target.value })}
            placeholder="Section name"
            className="display w-full bg-transparent text-5xl uppercase outline-none focus-visible:outline-none"
            aria-label="Section name"
          />
          {s.archived && <p className="label mt-2 text-amber">Archived. Members don&apos;t see this section.</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => patch({ archived: !s.archived })}
            className="ink label rounded-full px-4 py-2 hover:bg-accent-soft"
          >
            {s.archived ? "Restore" : "Archive"}
          </button>
          {isNew && (
            <button
              onClick={() => {
                if (!confirm(`Delete “${s.heading}” and its questions? It was never published.`)) return;
                change((d) => ({ ...d, sections: d.sections.filter((x) => x.id !== s.id) }));
                onDeleted();
              }}
              className="label rounded-full px-4 py-2 text-muted hover:text-pink"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Subtitle" value={s.title} onChange={(v) => patch({ title: v })} />
        <Field label="Commit message when finished" value={s.commit} onChange={(v) => patch({ commit: v })} mono />
        <Area label="Intro line" value={s.intro} onChange={(v) => patch({ intro: v })} />
        <Area label="What Bit says here (optional)" value={s.bitLine ?? ""} onChange={(v) => patch({ bitLine: v })} />
      </div>

      <p className="label mb-3 mt-8">Character</p>
      <div className="flex flex-wrap gap-2">
        {DOODLES.map((d) => (
          <button
            key={d}
            onClick={() => patch({ doodle: d })}
            aria-label={d}
            aria-pressed={s.doodle === d}
            className={`grid size-16 place-items-center rounded-2xl transition ${
              s.doodle === d ? "bg-lime ring-[1.5px] ring-edge" : "ink hover:bg-accent-soft"
            }`}
          >
            <Doodle name={d} size={44} />
          </button>
        ))}
      </div>

      <div className="mb-3 mt-10 flex items-center justify-between">
        <p className="label">Questions</p>
        <p className="text-xs text-muted">Drag ⠿ to reorder · click to edit</p>
      </div>
      <Reorder.Group axis="y" values={s.questions} onReorder={setQuestions} className="space-y-2">
        {s.questions.map((q) =>
          !showArchived && q.archived ? null : (
            <DragRow key={q.id} value={q}>
              {(handle) => (
                <div className={`ink rounded-3xl bg-panel ${q.archived ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2 py-2 pl-1 pr-3">
                    {handle}
                    <button onClick={() => setOpenQ(openQ === q.id ? null : q.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-bg">
                        {q.archived ? "ARCH" : numbers.has(q.id) ? `Q${numbers.get(q.id)}` : "—"}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{q.prompt || <i className="text-muted">Untitled question</i>}</span>
                      <span className="label hidden shrink-0 text-[10px] text-muted sm:inline">
                        {QUESTION_TYPES.find((t) => t.type === q.type)?.label}
                      </span>
                      {q.card && <span className="hidden shrink-0 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-[#161616] sm:inline">CARD</span>}
                      <span className={`shrink-0 transition ${openQ === q.id ? "rotate-180" : ""}`}>▾</span>
                    </button>
                  </div>
                  <AnimatePresence initial={false}>
                    {openQ === q.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <QuestionEditor
                          q={q}
                          sections={sections}
                          sectionId={s.id}
                          isNew={!publishedIds.has(q.id)}
                          onChange={(fn) => patchQ(q.id, fn)}
                          onSetCard={(role) =>
                            change((d) => ({
                              ...d,
                              sections: d.sections.map((sec) => ({
                                ...sec,
                                questions: sec.questions.map((x) =>
                                  x.id === q.id ? { ...x, card: role } : role && x.card === role ? { ...x, card: undefined } : x
                                ),
                              })),
                            }))
                          }
                          onDuplicate={() => {
                            const copy = { ...JSON.parse(JSON.stringify(q)), id: newId("q"), card: undefined, prompt: `${q.prompt} (copy)` };
                            const i = s.questions.findIndex((x) => x.id === q.id);
                            setQuestions([...s.questions.slice(0, i + 1), copy, ...s.questions.slice(i + 1)]);
                            setOpenQ(copy.id);
                          }}
                          onMove={(toId) =>
                            change((d) => ({
                              ...d,
                              sections: d.sections.map((sec) =>
                                sec.id === s.id
                                  ? { ...sec, questions: sec.questions.filter((x) => x.id !== q.id) }
                                  : sec.id === toId
                                    ? { ...sec, questions: [...sec.questions, q] }
                                    : sec
                              ),
                            }))
                          }
                          onDelete={() => setQuestions(s.questions.filter((x) => x.id !== q.id))}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </DragRow>
          )
        )}
      </Reorder.Group>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUESTION_TYPES.map((t) => (
          <button
            key={t.type}
            onClick={() => {
              const q = blankQuestion(t.type);
              patch({ questions: [...s.questions, q] });
              setOpenQ(q.id);
            }}
            title={t.hint}
            className="label rounded-full border-[1.5px] border-dashed border-edge px-4 py-2 hover:bg-accent-soft"
          >
            + {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionEditor({
  q,
  sections,
  sectionId,
  isNew,
  onChange,
  onSetCard,
  onDuplicate,
  onMove,
  onDelete,
}: {
  q: Question;
  sections: Section[];
  sectionId: string;
  isNew: boolean;
  onChange: (fn: (q: Question) => Question) => void;
  onSetCard: (role: CardRole | undefined) => void;
  onDuplicate: () => void;
  onMove: (sectionId: string) => void;
  onDelete: () => void;
}) {
  const set = (patch: Partial<Question>) => onChange((x) => ({ ...x, ...patch }));
  return (
    <div className="space-y-6 border-t-[1.5px] border-line px-5 pb-5 pt-5">
      <div>
        <p className="label mb-2 text-muted">Type</p>
        <div className="flex flex-wrap gap-1.5">
          {QUESTION_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => onChange((x) => withTypeDefaults(x, t.type as QuestionType))}
              className={`label rounded-full px-3 py-1.5 text-[11px] ${q.type === t.type ? "bg-ink text-bg" : "ink hover:bg-accent-soft"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Area label="Question" value={q.prompt} onChange={(v) => set({ prompt: v })} big />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Hint below the question (optional)" value={q.hint ?? ""} onChange={(v) => set({ hint: v || undefined })} />
        {(q.type === "text" || q.type === "longtext") && (
          <Field label="Placeholder (optional)" value={q.placeholder ?? ""} onChange={(v) => set({ placeholder: v || undefined })} />
        )}
      </div>

      {(q.type === "single" || q.type === "multi") && <OptionsEditor q={q} onChange={onChange} />}

      {q.type === "scale" && q.scale && (
        <div className="grid gap-5 sm:grid-cols-4">
          <NumberField label="From" value={q.scale.min} min={0} max={1} onChange={(v) => set({ scale: { ...q.scale!, min: v } })} />
          <NumberField label="To" value={q.scale.max} min={3} max={10} onChange={(v) => set({ scale: { ...q.scale!, max: v } })} />
          <Field label="Low end label" value={q.scale.minLabel} onChange={(v) => set({ scale: { ...q.scale!, minLabel: v } })} />
          <Field label="High end label" value={q.scale.maxLabel} onChange={(v) => set({ scale: { ...q.scale!, maxLabel: v } })} />
        </div>
      )}

      {q.type === "fields" && <FieldsEditor q={q} onChange={onChange} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="label mb-1.5 block text-muted">Show on the profile card as</span>
          <select
            value={q.card ?? ""}
            onChange={(e) => onSetCard((e.target.value || undefined) as CardRole | undefined)}
            className="ink w-full rounded-full bg-panel px-4 py-2.5 text-sm"
          >
            <option value="">Not on the card</option>
            {CARD_ROLES.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label mb-1.5 block text-muted">Move to section</span>
          <select
            value={sectionId}
            onChange={(e) => e.target.value !== sectionId && onMove(e.target.value)}
            className="ink w-full rounded-full bg-panel px-4 py-2.5 text-sm"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.heading || "Untitled"}
                {s.archived ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 border-t-[1.5px] border-line pt-4">
        <button onClick={onDuplicate} className="ink label rounded-full px-4 py-2 hover:bg-accent-soft">
          Duplicate
        </button>
        <button onClick={() => set({ archived: !q.archived })} className="ink label rounded-full px-4 py-2 hover:bg-accent-soft">
          {q.archived ? "Restore" : "Archive"}
        </button>
        {isNew && (
          <button onClick={onDelete} className="label rounded-full px-4 py-2 text-muted hover:text-pink">
            Delete
          </button>
        )}
        <p className="ml-auto self-center text-xs text-muted">
          {isNew ? "New in this draft." : "Archive keeps answers already given."}
        </p>
      </div>
    </div>
  );
}

function OptionsEditor({ q, onChange }: { q: Question; onChange: (fn: (q: Question) => Question) => void }) {
  const options = q.options ?? [];
  const setOptions = (fn: (o: Option[]) => Option[]) => onChange((x) => ({ ...x, options: fn(x.options ?? []) }));
  return (
    <div>
      <p className="label mb-2 text-muted">Options</p>
      <Reorder.Group axis="y" values={options} onReorder={(o) => setOptions(() => o)} className="space-y-2">
        {options.map((o, i) => (
          <DragRow key={o.id} value={o}>
            {(handle) => (
              <div className="flex items-center gap-2">
                {handle}
                <span className="ink grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  value={o.label}
                  onChange={(e) => setOptions((all) => all.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)))}
                  className="min-w-0 flex-1 border-b-[1.5px] border-edge bg-transparent py-1.5 outline-none focus-visible:outline-none"
                  aria-label={`Option ${i + 1}`}
                />
                <label className="label flex shrink-0 items-center gap-1 text-[10px] text-muted" title="Picking this shows a “Tell me more” box">
                  <input
                    type="checkbox"
                    checked={!!o.other}
                    onChange={(e) =>
                      setOptions((all) => all.map((x) => (x.id === o.id ? { ...x, other: e.target.checked || undefined } : x)))
                    }
                  />
                  Ask more
                </label>
                <button
                  onClick={() => setOptions((all) => all.filter((x) => x.id !== o.id))}
                  aria-label="Remove option"
                  className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-pink"
                >
                  ✕
                </button>
              </div>
            )}
          </DragRow>
        ))}
      </Reorder.Group>
      <button
        onClick={() => setOptions((all) => [...all, { id: newId("o"), label: `Option ${all.length + 1}` }])}
        className="label mt-3 rounded-full border-[1.5px] border-dashed border-edge px-4 py-2 hover:bg-accent-soft"
      >
        + Add option
      </button>
    </div>
  );
}

function FieldsEditor({ q, onChange }: { q: Question; onChange: (fn: (q: Question) => Question) => void }) {
  const fields = q.fields ?? [];
  const setFields = (fn: (f: NonNullable<Question["fields"]>) => NonNullable<Question["fields"]>) =>
    onChange((x) => ({ ...x, fields: fn(x.fields ?? []) }));
  return (
    <div>
      <p className="label mb-2 text-muted">Boxes</p>
      <p className="mb-3 text-xs text-muted">Use numbers (1, 2, 3) as labels to show numbered circles, or words like “GitHub”.</p>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.key} className="flex items-center gap-2">
            <input
              value={f.label}
              onChange={(e) => setFields((all) => all.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              placeholder="Label"
              className="w-36 border-b-[1.5px] border-edge bg-transparent py-1.5 outline-none focus-visible:outline-none"
            />
            <input
              value={f.placeholder ?? ""}
              onChange={(e) => setFields((all) => all.map((x, j) => (j === i ? { ...x, placeholder: e.target.value || undefined } : x)))}
              placeholder="Placeholder (optional)"
              className="min-w-0 flex-1 border-b-[1.5px] border-line bg-transparent py-1.5 outline-none focus-visible:outline-none"
            />
            <button
              onClick={() => setFields((all) => all.filter((_, j) => j !== i))}
              aria-label="Remove box"
              className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-pink"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => setFields((all) => [...all, { key: newId("f"), label: String(all.length + 1) }])}
        className="label mt-3 rounded-full border-[1.5px] border-dashed border-edge px-4 py-2 hover:bg-accent-soft"
      >
        + Add box
      </button>
    </div>
  );
}

/* ═══════════════════════ Texts editor ═══════════════════════ */

const toLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
const toParas = (v: string) => v.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

function TextsEditor({ draft, change }: { draft: FormDoc; change: Change }) {
  const w = draft.welcome;
  const f = draft.finale;
  const setW = (patch: Partial<FormDoc["welcome"]>) => change((d) => ({ ...d, welcome: { ...d.welcome, ...patch } }));
  const setF = (patch: Partial<FormDoc["finale"]>) => change((d) => ({ ...d, finale: { ...d.finale, ...patch } }));
  return (
    <div className="max-w-3xl space-y-12">
      <section>
        <h2 className="display text-4xl uppercase">
          <span className="mark-lime">Welcome</span>
        </h2>
        <p className="mt-2 text-sm text-muted">The first screen members see.</p>
        <div className="mt-6 space-y-6">
          <Field label="Title" value={w.title} onChange={(v) => setW({ title: v })} />
          <ParaArea label="Intro (leave a blank line between paragraphs)" value={w.paragraphs} onChange={(v) => setW({ paragraphs: v })} />
          <div className="grid gap-6 sm:grid-cols-2">
            <LinesArea label="“I want to understand” list (one per line)" value={w.wantToUnderstand} onChange={(v) => setW({ wantToUnderstand: v })} />
            <LinesArea label="“Before you start” list (one per line)" value={w.beforeYouStart} onChange={(v) => setW({ beforeYouStart: v })} />
          </div>
          <Area label="Privacy note" value={w.privacy} onChange={(v) => setW({ privacy: v })} />
        </div>
      </section>
      <section>
        <h2 className="display text-4xl uppercase">
          <span className="mark-ink">Finish</span>
        </h2>
        <p className="mt-2 text-sm text-muted">Shown after the last question.</p>
        <div className="mt-6 space-y-6">
          <Field label="Title" value={f.title} onChange={(v) => setF({ title: v })} />
          <ParaArea label="Message (blank line between paragraphs)" value={f.paragraphs} onChange={(v) => setF({ paragraphs: v })} />
        </div>
      </section>
    </div>
  );
}

/** Keeps the raw text while typing so blank lines aren't eaten mid-edit. */
function ParaArea({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [raw, setRaw] = useState(value.join("\n\n"));
  return <Area label={label} value={raw} onChange={(v) => (setRaw(v), onChange(toParas(v)))} big />;
}
function LinesArea({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [raw, setRaw] = useState(value.join("\n"));
  return <Area label={label} value={raw} onChange={(v) => (setRaw(v), onChange(toLines(v)))} />;
}

/* ═══════════════════════ Template library ═══════════════════════ */

function TemplateLibrary({
  onUse,
  onAddSection,
}: {
  onUse: (t: (typeof TEMPLATES)[number]) => void;
  onAddSection: (s: Section) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Start from a whole template, or add single sections to what you have.</p>
      {TEMPLATES.map((t) => (
        <div key={t.id} className="ink rounded-3xl bg-panel p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="display text-2xl uppercase">{t.name}</p>
              <p className="mt-1 text-sm text-muted">{t.description}</p>
              <p className="label mt-2 text-[11px]">
                {t.doc.sections.length} sections · {countQuestions(t.doc)} questions
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpen(open === t.id ? null : t.id)} className="ink label rounded-full px-4 py-2 hover:bg-accent-soft">
                {open === t.id ? "Hide sections" : "Pick sections"}
              </button>
              <button onClick={() => onUse(t)} className="label rounded-full bg-ink px-4 py-2 text-bg">
                Use template
              </button>
            </div>
          </div>
          {open === t.id && (
            <ul className="mt-4 space-y-2 border-t-[1.5px] border-line pt-4">
              {t.doc.sections.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <Doodle name={s.doodle} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="label block">{s.heading}</span>
                    <span className="block truncate text-xs text-muted">
                      {s.questions.length} questions · {s.questions.slice(0, 2).map((q) => q.prompt).join(" · ")}
                    </span>
                  </span>
                  <button onClick={() => onAddSection(s)} className="ink label shrink-0 rounded-full px-3 py-1.5 text-[11px] hover:bg-accent-soft">
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════ Small building blocks ═══════════════════════ */

/** A reorderable row with a ⠿ drag handle (so inputs inside still work). */
function DragRow<T>({ value, children }: { value: T; children: (handle: React.ReactNode) => React.ReactNode }) {
  const controls = useDragControls();
  const handle = (
    <span
      onPointerDown={(e) => controls.start(e)}
      className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-full text-lg text-muted active:cursor-grabbing"
      aria-label="Drag to reorder"
      role="button"
      tabIndex={-1}
    >
      ⠿
    </span>
  );
  return (
    <Reorder.Item value={value} dragListener={false} dragControls={controls} className="list-none">
      {children(handle)}
    </Reorder.Item>
  );
}

function Field({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="label mb-1.5 block text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border-b-[1.5px] border-edge bg-transparent py-2 outline-none focus-visible:outline-none ${mono ? "font-mono text-sm" : ""}`}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="label mb-1.5 block text-muted">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="w-full border-b-[1.5px] border-edge bg-transparent py-2 outline-none focus-visible:outline-none"
      />
    </label>
  );
}

function Area({ label, value, onChange, big }: { label: string; value: string; onChange: (v: string) => void; big?: boolean }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={big ? 3 : 2}
        className="ink w-full resize-none rounded-2xl bg-panel px-4 py-3 leading-relaxed outline-none focus:bg-bg focus-visible:outline-none"
      />
    </label>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 p-3 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="ink max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-bg p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="display text-3xl uppercase">{title}</h3>
              <button onClick={onClose} className="ink grid size-9 shrink-0 place-items-center rounded-full" aria-label="Close">
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
