"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useContext } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Doodle } from "@/components/Doodles";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { QuestionInput, type Reaction } from "@/components/QuestionInput";
import { ReadmeCard } from "@/components/ReadmeCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastStack, useToasts } from "@/components/Toasts";
import {
  BADGES,
  SECTION_LINES,
  JOKES,
  PICK_LINES,
  SCALE_LINES,
  SKIP_LINES,
  TYPE_LINES,
  WELCOME_LINES,
  earnedBadges,
  lengthLine,
  levelFor,
  pick,
  xpFor,
  type Mood,
} from "@/lib/fun";
import { bigCelebration, smallPop } from "@/lib/fx";
import {
  hasContent,
  isDone,
  liveQuestions,
  liveSections,
  type Answer,
  type FormDoc,
  type NumberedQuestion,
  type Section,
} from "@/lib/form";
import { demoReset, loadAnswers, markCompleted, readDemoDraft, readDemoPublished, saveAnswer, type Me } from "@/lib/store";

type Step =
  | { kind: "welcome" }
  | { kind: "chapter"; ci: number }
  | { kind: "question"; ci: number; qi: number }
  | { kind: "finale" };

function buildSteps(sections: Section[]): Step[] {
  return [
    { kind: "welcome" },
    ...sections.flatMap((c, ci): Step[] => [
      { kind: "chapter", ci },
      ...c.questions.map((_, qi): Step => ({ kind: "question", ci, qi })),
    ]),
    { kind: "finale" },
  ];
}

const sectionStep = (steps: Step[], ci: number) => steps.findIndex((s) => s.kind === "chapter" && s.ci === ci);
const sectionDone = (sections: Section[], ci: number, answers: Record<string, Answer>) =>
  sections[ci].questions.every((q) => isDone(answers[q.id]));

type JourneyData = { form: FormDoc; sections: Section[]; all: NumberedQuestion[]; total: number; steps: Step[] };
const JourneyCtx = createContext<JourneyData | null>(null);
const useJourney = () => useContext(JourneyCtx)!;
const pad = (n: number) => String(n).padStart(2, "0");

type SaveState = "idle" | "saving" | "saved" | "error";

function isTyping(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  // Option buttons (data-option) let Enter move forward; other buttons keep their own Enter.
  if (el.tagName === "BUTTON") return !el.hasAttribute("data-option");
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}

export function Journey({
  me,
  isAdmin,
  demo,
  form: initialForm,
  preview,
}: {
  me: Me;
  isAdmin: boolean;
  demo?: boolean;
  form: FormDoc;
  preview?: boolean;
}) {
  const [form, setForm] = useState<FormDoc>(initialForm);
  const sections = useMemo(() => liveSections(form), [form]);
  const all = useMemo(() => liveQuestions(form), [form]);
  const total = all.length;
  const steps = useMemo(() => buildSteps(sections), [sections]);
  const ctx = useMemo(() => ({ form, sections, all, total, steps }), [form, sections, all, total, steps]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [navOpen, setNavOpen] = useState(false);
  const [bit, setBit] = useState<{ mood: Mood; line: string | null }>({ mood: "happy", line: null });
  const { toasts, push } = useToasts();
  const pending = useRef(new Map<string, Answer>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pokes = useRef(0);
  const posKey = `readme-me:pos:${me.id}`;
  const badgeKey = `readme-me:badges:${me.id}`;

  const say = useCallback((line: string, mood: Mood = "happy") => setBit({ line, mood }), []);

  // Load saved answers and resume where the person left off.
  useEffect(() => {
    let f = initialForm;
    if (demo) {
      f = (preview ? readDemoDraft() ?? readDemoPublished() : readDemoPublished()) ?? initialForm;
      setForm(f);
    }
    const stepCount = buildSteps(liveSections(f)).length;
    loadAnswers(me.id)
      .then((a) => {
        setAnswers(a);
        let start = 0;
        try {
          const saved = Number(localStorage.getItem(posKey));
          if (saved > 0 && saved < stepCount) start = saved;
        } catch {}
        setIdx(start);
        setLoaded(true);
      })
      .catch((e) => setLoadError(e?.message ?? "Couldn't load your answers."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id, posKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(posKey, String(idx));
    } catch {}
  }, [idx, loaded, posKey]);

  /* ── Saving ─────────────────────────────────────────── */

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const items = [...pending.current.entries()];
    pending.current.clear();
    if (!items.length) return;
    setSaveState("saving");
    try {
      await Promise.all(items.map(([q, v]) => saveAnswer(me.id, q, v)));
      setSaveState(pending.current.size ? "saving" : "saved");
    } catch {
      items.forEach(([q, v]) => {
        if (!pending.current.has(q)) pending.current.set(q, v);
      });
      setSaveState("error");
    }
  }, [me.id]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    const onUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size) {
        flush();
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [flush]);

  const update = useCallback(
    (qid: string, a: Answer) => {
      setAnswers((prev) => ({ ...prev, [qid]: a }));
      pending.current.set(qid, a);
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 700);
    },
    [flush]
  );

  /* ── Navigation ─────────────────────────────────────── */

  const step = steps[Math.min(idx, steps.length - 1)];

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= steps.length) return;
      flush();
      setDir(to > idx ? 1 : -1);
      setIdx(to);
      setNavOpen(false);
      window.scrollTo({ top: 0 });
    },
    [flush, idx, steps.length]
  );

  const next = useCallback(() => {
    if (step.kind === "question") {
      const q = sections[step.ci].questions[step.qi];
      if (!hasContent(answers[q.id])) {
        update(q.id, { skipped: true });
        say(pick(SKIP_LINES), "happy");
      }
      const last = step.qi === sections[step.ci].questions.length - 1;
      if (last) {
        const after = { ...answers };
        if (!hasContent(after[q.id])) after[q.id] = { skipped: true };
        if (sectionDone(sections, step.ci, after)) smallPop();
      }
    }
    go(idx + 1);
  }, [step, answers, update, go, idx, say, sections]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setNavOpen(false);
      if (e.key === "Enter" && !isTyping(e) && step.kind !== "finale" && !navOpen) {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, step.kind, navOpen]);

  /* ── Bit's reactions ────────────────────────────────── */

  useEffect(() => {
    if (!loaded) return;
    if (step.kind === "welcome") say(WELCOME_LINES[0], "happy");
    else if (step.kind === "chapter") say(sections[step.ci].bitLine || pick(SECTION_LINES), "excited");
    else if (step.kind === "question") {
      const q = sections[step.ci].questions[step.qi];
      say(pick(TYPE_LINES[q.type]), q.type === "longtext" ? "thinking" : "happy");
    } else say("You did it! I'm so proud 🥹", "love");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, loaded]);

  const lengthTier = useRef<Record<string, number>>({});
  const currentQ = step.kind === "question" ? sections[step.ci].questions[step.qi] : null;
  const currentText = currentQ ? answers[currentQ.id]?.text ?? "" : "";
  useEffect(() => {
    if (!currentQ || currentQ.type !== "longtext") return;
    const r = lengthLine(currentText.length);
    const tier = currentText.length > 600 ? 3 : currentText.length > 250 ? 2 : currentText.length > 80 ? 1 : 0;
    if (r && tier > (lengthTier.current[currentQ.id] ?? 0)) {
      lengthTier.current[currentQ.id] = tier;
      say(r.line, r.mood);
    }
  }, [currentText, currentQ, say]);

  useEffect(() => {
    if (step.kind !== "question") return;
    const t = setTimeout(() => say("Still there? Take your time…", "sleepy"), 40000);
    return () => clearTimeout(t);
  }, [answers, idx, step.kind, say]);

  const onReact = useCallback(
    (r: Reaction) => {
      if (r.kind === "pick") say(pick(PICK_LINES), "excited");
      else {
        const five = Math.round(1 + ((r.value - 1) / Math.max(1, r.max - 1)) * 4);
        say(SCALE_LINES[five], five >= 4 ? "love" : five <= 2 ? "thinking" : "happy");
      }
    },
    [say]
  );

  const poke = useCallback(() => {
    pokes.current += 1;
    if (pokes.current % 6 === 0) say("Okay okay, I'm ticklish! 😆", "love");
    else say(pick(JOKES), "excited");
  }, [say]);

  /* ── XP, levels, badges ─────────────────────────────── */

  const xp = useMemo(() => xpFor(form, answers), [form, answers]);
  const level = levelFor(xp);
  const prevLevel = useRef<number | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (prevLevel.current !== null && level.index > prevLevel.current) {
      push({ emoji: level.emoji, title: `Level up: ${level.title}`, body: `${xp} XP and counting`, tone: "sun" });
      smallPop();
      say(`Promoted to ${level.title}! ${level.emoji}`, "wow");
    }
    prevLevel.current = level.index;
  }, [level.index, level.emoji, level.title, loaded, push, say, xp]);

  const [badges, setBadges] = useState<Set<string>>(new Set());
  const badgesReady = useRef(false);
  const badgesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!loaded) return;
    const now = earnedBadges(form, answers);
    if (!badgesReady.current) {
      let stored: string[] = [];
      try {
        stored = JSON.parse(localStorage.getItem(badgeKey) ?? "[]");
      } catch {}
      badgesRef.current = new Set([...stored, ...now]);
      setBadges(badgesRef.current);
      badgesReady.current = true;
      return;
    }
    const prev = badgesRef.current;
    const fresh = [...now].filter((b) => !prev.has(b));
    if (!fresh.length) return;
    fresh.forEach((id) => {
      const b = BADGES.find((x) => x.id === id)!;
      push({ emoji: b.emoji, title: `Badge unlocked: ${b.title}`, body: b.how });
    });
    const merged = new Set([...prev, ...fresh]);
    badgesRef.current = merged;
    setBadges(merged);
    try {
      localStorage.setItem(badgeKey, JSON.stringify([...merged]));
    } catch {}
  }, [answers, loaded, badgeKey, push, form]);

  /* ── The end ────────────────────────────────────────── */

  const allDone = all.every((q) => isDone(answers[q.id]));
  useEffect(() => {
    if (step.kind === "finale" && allDone) markCompleted(me.id).catch(() => {});
  }, [step.kind, allDone, me.id]);
  useEffect(() => {
    if (step.kind === "finale") bigCelebration();
  }, [step.kind]);

  const doneCount = useMemo(() => all.filter((q) => isDone(answers[q.id])).length, [answers, all]);
  const answeredCount = useMemo(() => all.filter((q) => hasContent(answers[q.id])).length, [answers, all]);
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const currentCi = step.kind === "chapter" || step.kind === "question" ? step.ci : -1;

  if (loadError)
    return (
      <Centered>
        <Doodle name="bit" mood="sleepy" size={120} />
        <p className="mt-4 font-semibold text-pink">{loadError}</p>
        <button onClick={() => location.reload()} className="ink ink-hover label mt-6 rounded-full px-5 py-2.5">
          Try again
        </button>
      </Centered>
    );
  if (!loaded)
    return (
      <Centered>
        <Doodle name="bit" mood="thinking" size={120} />
        <p className="label cursor mt-4 text-muted">Loading your README</p>
      </Centered>
    );

  const sectionNav = (
    <SectionNav answers={answers} step={step} currentCi={currentCi} go={go} />
  );

  return (
    <JourneyCtx.Provider value={ctx}>
    <div className="flex min-h-dvh flex-col">
      <ToastStack toasts={toasts} />
      {preview && (
        <div className="bg-lime px-4 py-2 text-center text-sm font-semibold text-[#161616]">
          Previewing your draft. Members still see the published version.{" "}
          <Link href="/admin?tab=editor" className="underline underline-offset-2">
            Back to the editor
          </Link>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5 sm:px-6">
          <Logo />
          <p className="label hidden text-muted md:block">
            {currentCi >= 0 ? `Section ${pad(currentCi + 1)} · ${sections[currentCi].heading}` : step.kind === "finale" ? "Release" : "Intro"}
          </p>
          <div className="ml-auto flex items-center gap-2.5">
            <SaveIndicator state={saveState} demo={demo} />
            <LevelPill xp={xp} />
            {isAdmin && (
              <Link href="/admin" className="ink ink-hover label hidden rounded-full px-3 py-1.5 sm:inline-block">
                Dashboard
              </Link>
            )}
            <ThemeToggle />
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.avatarUrl} alt={me.name} title={me.name} className="ink size-8 rounded-full" />
            ) : null}
            {demo ? (
              <button
                onClick={() => {
                  demoReset();
                  try {
                    localStorage.removeItem(posKey);
                    localStorage.removeItem(badgeKey);
                  } catch {}
                  location.reload();
                }}
                className="label text-muted hover:text-pink"
              >
                Reset
              </button>
            ) : (
              <form action="/auth/signout" method="post">
                <button className="label text-muted hover:text-pink">Sign out</button>
              </form>
            )}
          </div>
        </div>
        <div className="h-[3px] bg-line">
          <motion.div
            className="h-full bg-ink"
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-12 px-4 sm:px-6">
        <aside className="sticky top-24 hidden h-fit w-56 shrink-0 py-10 lg:block">{sectionNav}</aside>

        <main className="min-w-0 flex-1 pb-48 pt-10 sm:pt-16">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              initial={{ opacity: 0, y: dir * 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: dir * -28 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="mx-auto max-w-2xl"
            >
              {step.kind === "welcome" && <Welcome name={me.name} onStart={next} resumed={doneCount > 0} />}
              {step.kind === "chapter" && (
                <ChapterIntro
                  ci={step.ci}
                  prevDone={step.ci > 0 && sectionDone(sections, step.ci - 1, answers)}
                  onStart={next}
                  onBack={() => go(idx - 1)}
                />
              )}
              {step.kind === "question" && (
                <QuestionStep
                  ci={step.ci}
                  qi={step.qi}
                  answer={answers[sections[step.ci].questions[step.qi].id]}
                  onChange={(a) => update(sections[step.ci].questions[step.qi].id, a)}
                  onNext={next}
                  onBack={() => go(idx - 1)}
                  onReact={onReact}
                />
              )}
              {step.kind === "finale" && (
                <Finale
                  me={me}
                  answers={answers}
                  answered={answeredCount}
                  skipped={doneCount - answeredCount}
                  xp={xp}
                  badges={badges}
                  onEdit={() => go(sectionStep(steps, 0))}
                  firstOpen={() => {
                    const q = all.find((x) => !isDone(answers[x.id]));
                    return q
                      ? steps.findIndex((s) => s.kind === "question" && sections[s.ci].questions[s.qi].id === q.id)
                      : -1;
                  }}
                  go={go}
                  isAdmin={isAdmin}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Round progress button (opens the section list) */}
      <ProgressOrb pct={pct} onClick={() => setNavOpen(true)} />

      <AnimatePresence>
        {navOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end bg-ink/30 p-3 sm:items-center sm:justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNavOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="ink max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-bg p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="label">Your README</p>
                <button onClick={() => setNavOpen(false)} className="ink grid size-8 place-items-center rounded-full" aria-label="Close">
                  ✕
                </button>
              </div>
              {sectionNav}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Mascot mood={bit.mood} line={bit.line} onPoke={poke} />
    </div>
    </JourneyCtx.Provider>
  );
}

/* ───────────────────────── Section list ───────────────────────── */

function SectionNav({
  answers,
  step,
  currentCi,
  go,
}: {
  answers: Record<string, Answer>;
  step: Step;
  currentCi: number;
  go: (i: number) => void;
}) {
  const { sections, all, total, steps } = useJourney();
  const answered = all.filter((q) => hasContent(answers[q.id])).length;
  const done = all.filter((q) => isDone(answers[q.id])).length;
  return (
    <nav aria-label="Sections">
      <button
        onClick={() => go(0)}
        className={`label mb-3 block ${step.kind === "welcome" ? "text-ink" : "text-muted hover:text-ink"}`}
      >
        ↳ Intro
      </button>
      <ol>
        {sections.map((c, ci) => {
          const total = c.questions.length;
          const d = c.questions.filter((q) => isDone(answers[q.id])).length;
          const complete = d === total;
          const active = ci === currentCi;
          return (
            <li key={c.id}>
              <button onClick={() => go(sectionStep(steps, ci))} className="group flex w-full items-center gap-3 text-left">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                    active ? "bg-ink text-bg" : complete ? "bg-lime text-[#161616]" : "ink text-ink group-hover:bg-accent-soft"
                  }`}
                >
                  {complete && !active ? "✓" : ci + 1}
                </span>
                <span className={`label truncate ${active ? "text-ink" : "text-muted group-hover:text-ink"}`}>{c.heading}</span>
                <span className="ml-auto text-xs tabular-nums text-muted">
                  {d}/{total}
                </span>
              </button>
              {ci < sections.length - 1 && <div className="dotted-v ml-[15px] h-4 w-[2px]" aria-hidden />}
            </li>
          );
        })}
      </ol>
      <button
        onClick={() => go(steps.length - 1)}
        className={`label mt-3 block ${step.kind === "finale" ? "text-ink" : "text-muted hover:text-ink"}`}
      >
        ↳ Release
      </button>
      <p className="mt-6 text-xs leading-relaxed text-muted">
        <span className="font-bold text-ink">{answered}</span> answered · {done - answered} skipped ·{" "}
        {total - done} left
      </p>
    </nav>
  );
}

/* ───────────────────────── Steps ───────────────────────── */

function Welcome({ name, onStart, resumed }: { name: string; onStart: () => void; resumed: boolean }) {
  const { form } = useJourney();
  return (
    <div>
      <div className="-ml-2 mb-6 flex items-end gap-1 sm:gap-3">
        {(["mug", "laptop", "duck", "cat"] as const).map((d, i) => (
          <motion.div
            key={d}
            initial={{ y: 30, opacity: 0, rotate: -8 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.08 * i, type: "spring", stiffness: 260, damping: 16 }}
          >
            <Doodle name={d} size={72} className="wiggle sm:h-[92px] sm:w-[92px]" />
          </motion.div>
        ))}
      </div>
      <p className="label text-muted">A little about you</p>
      <h1 className="display mt-3 text-[56px] uppercase sm:text-[84px]">
        Hey,
        <br />
        <span className="mark-lime">{name}.</span>
      </h1>
      <div className="mt-8 space-y-4 text-lg leading-relaxed">
        {form.welcome.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <NumberedList title="I want to understand" items={form.welcome.wantToUnderstand} />
        <NumberedList title="Before you start" items={form.welcome.beforeYouStart} />
      </div>

      <div className="mt-10 rounded-3xl bg-ink p-6 text-bg">
        <p className="label text-lime">Only for me</p>
        <p className="mt-2 leading-relaxed">{form.welcome.privacy}</p>
      </div>

      <div className="mt-10 flex items-center gap-4">
        <PrimaryButton onClick={onStart}>{resumed ? "Continue" : "Let's begin"}</PrimaryButton>
        <Kbd>Enter ↵</Kbd>
      </div>
    </div>
  );
}

function NumberedList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="label mb-4">{title}</p>
      <ul className="space-y-2.5">
        {items.map((t, i) => (
          <li key={t} className="flex items-start gap-3 text-[15px] leading-snug">
            <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-bg">
              {i + 1}
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChapterIntro({
  ci,
  prevDone,
  onStart,
  onBack,
}: {
  ci: number;
  prevDone: boolean;
  onStart: () => void;
  onBack: () => void;
}) {
  const { sections } = useJourney();
  const c = sections[ci];
  const prev = sections[ci - 1];
  return (
    <div className="pt-2 sm:pt-6">
      {prev && prevDone && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full bg-ink py-1.5 pl-1.5 pr-4 text-sm text-bg"
        >
          <span className="grid size-6 place-items-center rounded-full bg-lime text-xs font-bold text-[#161616]">✓</span>
          <span className="font-mono text-xs">git commit -m &quot;{prev.commit}&quot;</span>
          <span className="label text-lime">+{prev.questions.length * 10} XP</span>
        </motion.p>
      )}

      <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label text-muted">
            Section {pad(ci + 1)} / {pad(sections.length)} · {c.questions.length} questions
          </p>
          <h2 className="display mt-4 text-[54px] uppercase sm:text-[88px]">
            <span className="mark-lime">{c.heading}</span>
          </h2>
        </div>
        <motion.div
          initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 12 }}
          className="bob shrink-0 self-start sm:self-auto"
        >
          <Doodle name={c.doodle} size={150} />
        </motion.div>
      </div>
      <p className="display mt-6 text-3xl uppercase sm:text-4xl">{c.title}</p>
      <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">{c.intro}</p>
      <div className="mt-10 flex items-center gap-3">
        <CircleButton onClick={onBack} label="Back">
          ←
        </CircleButton>
        <PrimaryButton onClick={onStart}>Start section</PrimaryButton>
        <Kbd>Enter ↵</Kbd>
      </div>
    </div>
  );
}

function QuestionStep({
  ci,
  qi,
  answer,
  onChange,
  onNext,
  onBack,
  onReact,
}: {
  ci: number;
  qi: number;
  answer: Answer | undefined;
  onChange: (a: Answer) => void;
  onNext: () => void;
  onBack: () => void;
  onReact: (r: Reaction) => void;
}) {
  const { sections, all, total } = useJourney();
  const c = sections[ci];
  const q = c.questions[qi];
  const number = all.find((x) => x.id === q.id)!.number;
  const filled = hasContent(answer);
  const hint =
    q.type === "longtext"
      ? "Ctrl + Enter ↵"
      : q.type === "single" || q.type === "multi"
        ? "A–Z to pick · Enter ↵"
        : q.type === "scale"
          ? `${q.scale?.min}–${q.scale?.max} to pick · Enter ↵`
          : "Enter ↵";

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold tabular-nums text-bg">
          Q{pad(number)} <span className="opacity-60">/ {total}</span>
        </span>
        <span className="label text-muted">
          {c.heading} · {qi + 1} of {c.questions.length}
        </span>
        <span className="ml-auto hidden gap-1.5 sm:flex" aria-hidden>
          {c.questions.map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full ${i < qi ? "bg-ink" : i === qi ? "bg-lime ring-[1.5px] ring-edge" : "ring-[1.5px] ring-line"}`}
            />
          ))}
        </span>
      </div>

      <div className="mt-6 flex items-start gap-4">
        <h2 className="display min-w-0 flex-1 text-[34px] sm:text-[46px]">{q.prompt}</h2>
        <div className="hidden shrink-0 sm:block">
          <Doodle name={c.doodle} size={76} className="wiggle" />
        </div>
      </div>
      {q.hint && <p className="mt-3 text-muted">{q.hint}</p>}

      <div className="mt-9">
        <QuestionInput question={q} value={answer} onChange={onChange} onSubmit={onNext} onReact={onReact} />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <CircleButton onClick={onBack} label="Back">
          ←
        </CircleButton>
        {filled ? (
          <PrimaryButton onClick={onNext}>Next</PrimaryButton>
        ) : (
          <SecondaryButton onClick={onNext}>Skip for now</SecondaryButton>
        )}
        <Kbd>{hint}</Kbd>
      </div>
      {answer?.skipped && (
        <p className="mt-4 text-sm text-muted">You skipped this one earlier. Totally fine. Answer it if you like.</p>
      )}
    </div>
  );
}

function Finale({
  me,
  answers,
  answered,
  skipped,
  xp,
  badges,
  onEdit,
  firstOpen,
  go,
  isAdmin,
}: {
  me: Me;
  answers: Record<string, Answer>;
  answered: number;
  skipped: number;
  xp: number;
  badges: Set<string>;
  onEdit: () => void;
  firstOpen: () => number;
  go: (i: number) => void;
  isAdmin: boolean;
}) {
  const { total, form } = useJourney();
  const open = firstOpen();
  const level = levelFor(xp);
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label text-muted">
            {open < 0 ? "v1.0 released" : `Draft · ${total - answered - skipped} questions still open`}
          </p>
          <h1 className="display mt-4 text-[64px] uppercase sm:text-[104px]">
            That&apos;s
            <br />
            <span className="mark-lime">it.</span>
          </h1>
        </div>
        <div className="bob shrink-0">
          <Doodle name="cat" size={150} />
        </div>
      </div>
      <div className="mt-8 space-y-3 text-lg leading-relaxed">
        {form.finale.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 border-y-[1.5px] border-edge sm:grid-cols-4">
        <Stat label="Answered" value={answered} />
        <Stat label="Skipped" value={skipped} />
        <Stat label="XP" value={xp} />
        <Stat label="Level" value={level.title} small />
      </div>

      <p className="label mb-4 mt-12">Badges · {badges.size}/{BADGES.length}</p>
      <div className="flex flex-wrap gap-2">
        {BADGES.map((b, i) => {
          const got = badges.has(b.id);
          return (
            <motion.span
              key={b.id}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.05, type: "spring", stiffness: 380, damping: 18 }}
              title={b.how}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-sm font-semibold ${
                got ? "bg-ink text-bg" : "border-[1.5px] border-dashed border-line text-muted"
              }`}
            >
              <span className={`grid size-7 place-items-center rounded-full ${got ? "bg-lime" : ""}`}>
                {got ? b.emoji : "·"}
              </span>
              {b.title}
            </motion.span>
          );
        })}
      </div>

      <p className="label mb-4 mt-12">A peek at your README</p>
      <ReadmeCard form={form} name={me.name} avatarUrl={me.avatarUrl} answers={answers} />

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {open >= 0 && <PrimaryButton onClick={() => go(open)}>Answer what&apos;s left</PrimaryButton>}
        <SecondaryButton onClick={onEdit}>Review my answers</SecondaryButton>
        {isAdmin && (
          <Link href="/admin" className="ink ink-hover label rounded-full px-5 py-3.5">
            Open dashboard
          </Link>
        )}
      </div>
      <p className="mt-6 text-sm text-muted">You can come back and change anything, anytime.</p>
    </div>
  );
}

/* ───────────────────────── Bits ───────────────────────── */

function ProgressOrb({ pct, onClick }: { pct: number; onClick: () => void }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <button
      onClick={onClick}
      aria-label={`${pct}% done. Open section list`}
      className="ink-hover fixed bottom-4 left-4 z-30 grid size-[76px] lg:hidden place-items-center rounded-full bg-ink text-bg sm:bottom-6 sm:left-6"
    >
      <svg width="76" height="76" viewBox="0 0 76 76" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="38" cy="38" r={r} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="4" />
        <motion.circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="var(--sun)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
      </svg>
      <span className="relative text-center leading-none">
        <span className="display block text-xl">{pct}%</span>
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">done</span>
      </span>
    </button>
  );
}

function LevelPill({ xp }: { xp: number }) {
  const l = levelFor(xp);
  return (
    <div
      className="ink hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 sm:flex"
      title={l.next ? `${l.next.xp - xp} XP to ${l.next.title}` : "Max level!"}
    >
      <motion.span key={l.title} initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid size-6 place-items-center rounded-full bg-lime text-sm">
        {l.emoji}
      </motion.span>
      <span className="label">{l.title}</span>
      <span className="text-xs tabular-nums text-muted">{xp} XP</span>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="border-edge p-4 [&:not(:first-child)]:border-l-[1.5px] max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(n+3)]:border-t-[1.5px]">
      <p className={`display ${small ? "text-2xl" : "text-5xl"}`}>{value}</p>
      <p className="label mt-2 text-muted">{label}</p>
    </div>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="ink-hover group inline-flex items-center gap-3 rounded-full bg-ink py-2 pl-6 pr-2 text-bg"
    >
      <span className="label text-[13px]">{children}</span>
      <span className="grid size-9 place-items-center rounded-full bg-lime font-bold text-[#161616] transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </button>
  );
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="ink ink-hover label rounded-full px-6 py-3.5 text-[13px] hover:bg-accent-soft">
      {children}
    </button>
  );
}

function CircleButton({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="ink ink-hover grid size-[52px] place-items-center rounded-full text-lg hover:bg-accent-soft"
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <span className="hidden text-xs text-muted sm:inline">{children}</span>;
}

function SaveIndicator({ state, demo }: { state: SaveState; demo?: boolean }) {
  const map: Record<SaveState, [string, string]> = {
    idle: ["", ""],
    saving: ["Saving…", "text-muted"],
    saved: [demo ? "Saved locally" : "Saved", "text-ok"],
    error: ["Couldn't save, will retry", "text-pink"],
  };
  const [text, tone] = map[state];
  return <span className={`label hidden lg:inline ${tone}`}>{text}</span>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-dvh place-items-center p-6 text-center"><div className="flex flex-col items-center">{children}</div></div>;
}
