"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { ReadmeCard } from "@/components/ReadmeCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  everyQuestion,
  formatAnswer,
  hasContent,
  isDone,
  liveQuestions,
  type Answer,
  type FormDoc,
  type Question,
} from "@/lib/form";
import { readDemoAnswers, readDemoCompletedAt, readDemoPublished } from "@/lib/store";
import { AdminsPanel } from "./AdminsPanel";
import { FormWorkspace } from "./FormWorkspace";

export type Person = {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  completedAt?: string | null;
  lastActive?: string | null;
  answers: Record<string, Answer>;
};

type Tab = "responses" | "questions" | "texts" | "admins";
const TABS: { id: Tab; label: string }[] = [
  { id: "responses", label: "Responses" },
  { id: "questions", label: "Questions" },
  { id: "texts", label: "Texts" },
  { id: "admins", label: "Admins" },
];

export function AdminDashboard({
  people: initial,
  form: initialForm,
  meId,
  demo,
}: {
  people: Person[];
  form: FormDoc;
  meId: string;
  demo?: boolean;
}) {
  const [people, setPeople] = useState(initial);
  const [form, setForm] = useState(initialForm);
  const [tab, setTab] = useState<Tab>("responses");

  // Remember the tab in the URL (?tab=questions) so preview links can come back.
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("tab");
    if (t === "editor") setTab("questions");
    else if (TABS.some((x) => x.id === t)) setTab(t as Tab);
  }, []);
  function choose(t: Tab) {
    setTab(t);
    const url = new URL(location.href);
    url.searchParams.set("tab", t);
    history.replaceState(null, "", url);
  }

  // Demo mode: this browser's answers and form.
  useEffect(() => {
    if (!demo) return;
    setForm(readDemoPublished() ?? initialForm);
    setPeople([
      {
        id: "demo",
        name: "You (demo)",
        answers: readDemoAnswers(),
        completedAt: readDemoCompletedAt(),
        lastActive: new Date().toISOString(),
      },
    ]);
  }, [demo, initialForm]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b-[1.5px] border-edge bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 pt-3 sm:px-6">
          <Logo href="/admin" />
          <span className="label rounded-full bg-lime px-2.5 py-1 text-[#161616]">Admin</span>
          {demo && <span className="label hidden text-muted sm:inline">Demo mode</span>}
          <div className="ml-auto flex items-center gap-2.5 sm:gap-4">
            <Link href="/journey" className="label hidden text-muted hover:text-ink sm:inline">
              My README →
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => choose(t.id)}
              className={`label -mb-[1.5px] shrink-0 border-b-[3px] px-3 py-3 transition ${
                tab === t.id ? "border-edge text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {tab === "responses" && <Responses people={people} form={form} />}
        {(tab === "questions" || tab === "texts") && (
          <FormWorkspace mode={tab} published={form} onPublished={setForm} />
        )}
        {tab === "admins" && <AdminsPanel meId={meId} demo={demo} />}
      </main>
    </div>
  );
}

/* ───────────────────────── Responses ───────────────────────── */

function Responses({ people, form }: { people: Person[]; form: FormDoc }) {
  const [view, setView] = useState<"people" | "questions">("people");
  const [selected, setSelected] = useState<string | null>(null);
  const live = useMemo(() => liveQuestions(form), [form]);

  const stats = useMemo(() => {
    const progress = people.map((p) =>
      live.length ? live.filter((q) => isDone(p.answers[q.id])).length / live.length : 0
    );
    return {
      members: people.length,
      completed: people.filter((p) => p.completedAt).length,
      started: people.filter((p) => Object.keys(p.answers).length > 0).length,
      avg: progress.length ? Math.round((progress.reduce((a, b) => a + b, 0) / progress.length) * 100) : 0,
    };
  }, [people, live]);

  const person = people.find((p) => p.id === selected);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Members signed in" value={stats.members} />
        <Stat label="Started" value={stats.started} />
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Avg progress" value={`${stats.avg}%`} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["people", "questions"] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              setSelected(null);
            }}
            className={`label rounded-full px-4 py-2 ${view === v ? "bg-ink text-bg" : "ink hover:bg-accent-soft"}`}
          >
            {v === "people" ? "People" : "By question"}
          </button>
        ))}
        <button
          onClick={() => downloadCsv(people, form)}
          disabled={!people.length}
          className="ink ink-hover label ml-auto whitespace-nowrap rounded-full px-4 py-2 hover:bg-accent-soft disabled:opacity-50"
        >
          ⬇ Export CSV
        </button>
      </div>

      <div className="py-6">
        {people.length === 0 ? (
          <Empty />
        ) : view === "people" ? (
          person ? (
            <PersonDetail person={person} form={form} onBack={() => setSelected(null)} />
          ) : (
            <PeopleGrid people={people} form={form} onOpen={setSelected} />
          )
        ) : (
          <ByQuestion people={people} form={form} />
        )}
      </div>
    </div>
  );
}

function PeopleGrid({ people, form, onOpen }: { people: Person[]; form: FormDoc; onOpen: (id: string) => void }) {
  const live = liveQuestions(form);
  const sorted = [...people].sort((a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? ""));
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((p) => {
        const done = live.filter((q) => isDone(p.answers[q.id])).length;
        const answered = live.filter((q) => hasContent(p.answers[q.id])).length;
        const pct = live.length ? Math.round((done / live.length) * 100) : 0;
        return (
          <button key={p.id} onClick={() => onOpen(p.id)} className="ink ink-hover rounded-3xl bg-panel p-5 text-left">
            <div className="flex items-center gap-3">
              <Avatar url={p.avatarUrl} name={p.name} size="size-11" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name}</p>
                {p.username && <p className="truncate text-xs text-muted">@{p.username}</p>}
              </div>
              <span
                className={`label ml-auto rounded-full px-2 py-0.5 text-[10px] ${
                  p.completedAt ? "bg-lime text-[#161616]" : "ink text-muted"
                }`}
              >
                {p.completedAt ? "v1.0" : "Draft"}
              </span>
            </div>
            <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>
                {answered} answered · {done - answered} skipped
              </span>
              <span className="font-bold text-ink">{pct}%</span>
            </div>
            {p.lastActive && <p className="mt-1 text-[11px] text-muted">Active {timeAgo(p.lastActive)}</p>}
          </button>
        );
      })}
    </div>
  );
}

function numberOf(form: FormDoc) {
  const map = new Map(liveQuestions(form).map((q) => [q.id, q.number]));
  return (q: Question) => (map.has(q.id) ? `Q${map.get(q.id)}` : "Archived");
}

function PersonDetail({ person, form, onBack }: { person: Person; form: FormDoc; onBack: () => void }) {
  const [hideEmpty, setHideEmpty] = useState(false);
  const num = numberOf(form);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="label text-muted hover:text-ink">
          ← All people
        </button>
        <label className="label ml-auto flex items-center gap-2 text-muted">
          <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} />
          Hide unanswered
        </label>
      </div>
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <ReadmeCard form={form} name={person.name} avatarUrl={person.avatarUrl} answers={person.answers} />
        </div>
        <div className="space-y-10">
          {form.sections.map((s) => {
            const qs = s.questions
              .filter((q) => (!q.archived && !s.archived) || hasContent(person.answers[q.id]))
              .filter((q) => !hideEmpty || hasContent(person.answers[q.id]));
            if (!qs.length) return null;
            return (
              <section key={s.id}>
                <h3 className="display mb-4 text-3xl uppercase">
                  <span className={s.archived ? "mark-ink" : "mark-lime"}>{s.heading}</span>
                  {s.archived && <span className="label ml-3 align-middle text-muted">Archived</span>}
                </h3>
                <div className="space-y-3">
                  {qs.map((q) => {
                    const a = person.answers[q.id];
                    return (
                      <div key={q.id} className="ink rounded-2xl bg-panel p-4">
                        <p className="text-sm text-muted">
                          <span className="font-bold text-ink">{num(q)}</span> · {q.prompt}
                        </p>
                        <p
                          className={`mt-2 whitespace-pre-wrap leading-relaxed ${hasContent(a) ? "" : "text-sm text-muted/70"}`}
                        >
                          {hasContent(a) ? formatAnswer(q, a) : a?.skipped ? "Skipped" : "Not answered yet"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ByQuestion({ people, form }: { people: Person[]; form: FormDoc }) {
  const all = useMemo(() => everyQuestion(form), [form]);
  const num = numberOf(form);
  const [qid, setQid] = useState(all[0]?.id ?? "");
  const q = all.find((x) => x.id === qid) ?? all[0];
  const withAnswer = q ? people.filter((p) => hasContent(p.answers[q.id])) : [];

  const counts = useMemo(() => {
    if (!q) return null;
    if (q.type === "single" || q.type === "multi") {
      return (q.options ?? []).map((opt) => ({
        label: opt.label,
        n: people.filter((p) => {
          const a = p.answers[q.id];
          return a?.choice === opt.id || a?.choices?.includes(opt.id);
        }).length,
      }));
    }
    if (q.type === "scale" && q.scale) {
      const out = [];
      for (let v = q.scale.min; v <= q.scale.max; v++)
        out.push({ label: String(v), n: people.filter((p) => p.answers[q.id]?.scale === v).length });
      return out;
    }
    return null;
  }, [q, people]);
  const max = Math.max(1, ...(counts?.map((c) => c.n) ?? [1]));
  if (!q) return <Empty />;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <nav className="ink max-h-[70vh] space-y-4 overflow-y-auto rounded-3xl bg-panel p-3 lg:sticky lg:top-32">
        {form.sections.map((s) => (
          <div key={s.id}>
            <p className="label px-2 pb-1">
              <span className={s.archived ? "mark-ink" : "mark-lime"}>{s.heading}</span>
            </p>
            {s.questions.map((cq) => (
              <button
                key={cq.id}
                onClick={() => setQid(cq.id)}
                className={`block w-full truncate rounded-lg px-2 py-1 text-left text-sm ${
                  cq.id === q.id ? "bg-ink text-bg" : "text-muted hover:text-ink"
                } ${cq.archived || s.archived ? "italic" : ""}`}
              >
                <span className="text-xs font-bold">{num(cq)}</span> {cq.prompt}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div>
        <p className="label text-muted">
          {num(q)} · {withAnswer.length}/{people.length} answered
        </p>
        <h2 className="display mt-3 text-3xl sm:text-4xl">{q.prompt}</h2>

        {counts && (
          <div className="ink mt-6 space-y-2 rounded-3xl bg-panel p-5">
            {q.type === "scale" && q.scale && (
              <p className="label mb-2 flex justify-between text-muted">
                <span>
                  {q.scale.min} = {q.scale.minLabel}
                </span>
                <span>
                  {q.scale.max} = {q.scale.maxLabel}
                </span>
              </p>
            )}
            {counts.map((c) => (
              <div key={c.label} className="grid grid-cols-[minmax(0,1fr)_2fr_auto] items-center gap-3 text-sm">
                <span className="truncate" title={c.label}>
                  {c.label}
                </span>
                <div className="h-5 overflow-hidden rounded-full bg-panel-2">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(c.n / max) * 100}%` }} />
                </div>
                <span className="w-6 text-right font-bold">{c.n}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {people.map((p) => {
            const a = p.answers[q.id];
            return (
              <div key={p.id} className="ink flex gap-3 rounded-2xl bg-panel p-4">
                <Avatar url={p.avatarUrl} name={p.name} size="size-9" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p
                    className={`mt-1 whitespace-pre-wrap leading-relaxed ${hasContent(a) ? "" : "text-sm text-muted/70"}`}
                  >
                    {hasContent(a) ? formatAnswer(q, a) : a?.skipped ? "Skipped" : "Not answered yet"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Bits ───────────────────────── */

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="ink rounded-3xl bg-panel p-5">
      <p className="display text-5xl">{value}</p>
      <p className="label mt-2 text-muted">{label}</p>
    </div>
  );
}

function Avatar({ url, name, size }: { url?: string | null; name: string; size: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`${size} ink shrink-0 rounded-full`} />
  ) : (
    <div className={`${size} grid shrink-0 place-items-center rounded-full bg-lime text-sm font-bold text-[#161616]`}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-3xl border-[1.5px] border-dashed border-line p-12 text-center">
      <p className="display text-3xl uppercase">No one yet</p>
      <p className="mt-2 text-muted">Share the site link with your team to get started.</p>
    </div>
  );
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function downloadCsv(people: Person[], form: FormDoc) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const qs = everyQuestion(form);
  const num = numberOf(form);
  const header = ["Name", "Discord", "Completed", ...qs.map((q) => `${num(q)}. ${q.prompt}`)];
  const rows = people.map((p) => [
    p.name,
    p.username ?? "",
    p.completedAt ? new Date(p.completedAt).toLocaleDateString() : "",
    ...qs.map((q) => formatAnswer(q, p.answers[q.id])),
  ]);
  const csv = "﻿" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `readme-me-answers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
