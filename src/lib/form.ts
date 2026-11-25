// The questionnaire ("form") model. A form is one JSON document: welcome text,
// sections with their questions, and the finishing text. Admins edit a draft
// copy and publish it; members only ever see the published form.
//
// Shared by server and client code — no React or browser APIs here.

import type { DoodleName } from "@/lib/doodles";

export type QuestionType = "text" | "longtext" | "single" | "multi" | "scale" | "fields";

export const QUESTION_TYPES: { type: QuestionType; label: string; hint: string }[] = [
  { type: "longtext", label: "Long answer", hint: "A big text box for stories and thoughts" },
  { type: "text", label: "Short answer", hint: "One line" },
  { type: "single", label: "Pick one", hint: "A list of options, one choice" },
  { type: "multi", label: "Pick many", hint: "A list of options, several choices" },
  { type: "scale", label: "Scale", hint: "A row of numbers, e.g. 1 to 5" },
  { type: "fields", label: "Several small boxes", hint: "e.g. three words, or links" },
];

/** A choice option. `other: true` reveals a "Tell me more…" box when picked. */
export type Option = { id: string; label: string; other?: boolean };

/** Questions can feed the profile card at the end. */
export type CardRole = "words" | "enjoy" | "dream" | "explore" | "languages" | "device" | "os" | "links";

export const CARD_ROLES: { role: CardRole; label: string }[] = [
  { role: "words", label: "Three words about me" },
  { role: "enjoy", label: "Things I enjoy" },
  { role: "dream", label: "Biggest dream" },
  { role: "explore", label: "Want to explore" },
  { role: "languages", label: "Languages" },
  { role: "device", label: "Setup: device" },
  { role: "os", label: "Setup: operating system" },
  { role: "links", label: "Links" },
];

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  hint?: string;
  placeholder?: string;
  options?: Option[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string };
  fields?: { key: string; label: string; placeholder?: string }[];
  card?: CardRole;
  archived?: boolean;
};

export type Section = {
  id: string;
  heading: string; // short, shown huge (e.g. "Dreams")
  title: string; // longer subtitle
  intro: string;
  commit: string; // fake commit message when the section is finished
  doodle: DoodleName;
  bitLine?: string; // what Bit says on the section intro
  questions: Question[];
  archived?: boolean;
};

export type FormDoc = {
  version: 1;
  welcome: {
    title: string;
    paragraphs: string[];
    wantToUnderstand: string[];
    beforeYouStart: string[];
    privacy: string;
  };
  finale: { title: string; paragraphs: string[] };
  sections: Section[];
};

export type Answer = {
  text?: string;
  /** Option id (single choice) */
  choice?: string;
  /** Option ids (multi choice) */
  choices?: string[];
  other?: string;
  scale?: number;
  fields?: Record<string, string>;
  skipped?: boolean;
};

export type NumberedQuestion = Question & { number: number; sectionId: string };

/* ── Reading a form ───────────────────────────────────── */

/** Sections members see: not archived, with at least one live question. */
export function liveSections(form: FormDoc): Section[] {
  return form.sections
    .filter((s) => !s.archived)
    .map((s) => ({ ...s, questions: s.questions.filter((q) => !q.archived) }))
    .filter((s) => s.questions.length > 0);
}

/** Live questions in order, numbered 1…n. */
export function liveQuestions(form: FormDoc): NumberedQuestion[] {
  let n = 0;
  return liveSections(form).flatMap((s) => s.questions.map((q) => ({ ...q, number: ++n, sectionId: s.id })));
}

/** Every question including archived ones (for the dashboard and CSV). */
export function everyQuestion(form: FormDoc): (Question & { sectionId: string; sectionHeading: string })[] {
  return form.sections.flatMap((s) =>
    s.questions.map((q) => ({ ...q, archived: q.archived || s.archived, sectionId: s.id, sectionHeading: s.heading }))
  );
}

export function cardQuestion(form: FormDoc, role: CardRole): Question | undefined {
  return liveSections(form)
    .flatMap((s) => s.questions)
    .find((q) => q.card === role);
}

/* ── Answers ──────────────────────────────────────────── */

export function hasContent(a: Answer | undefined): boolean {
  if (!a || a.skipped) return false;
  if (a.text?.trim()) return true;
  if (a.choice) return true;
  if (a.choices?.length) return true;
  if (typeof a.scale === "number") return true;
  if (a.fields && Object.values(a.fields).some((v) => v?.trim())) return true;
  return false;
}

export function isDone(a: Answer | undefined): boolean {
  return !!a && (!!a.skipped || hasContent(a));
}

export function optionLabel(q: Question, id: string): string {
  return q.options?.find((o) => o.id === id)?.label ?? id;
}

/** Plain-text rendering of an answer, used by the dashboard and CSV export. */
export function formatAnswer(q: Question, a: Answer | undefined): string {
  if (!a) return "";
  if (a.skipped) return "(skipped)";
  const parts: string[] = [];
  switch (q.type) {
    case "single":
      if (a.choice) parts.push(optionLabel(q, a.choice));
      break;
    case "multi":
      if (a.choices?.length) parts.push(a.choices.map((c) => optionLabel(q, c)).join(", "));
      break;
    case "scale":
      if (typeof a.scale === "number" && q.scale)
        parts.push(`${a.scale}/${q.scale.max} (${q.scale.minLabel} → ${q.scale.maxLabel})`);
      break;
    case "fields": {
      const numbered = (q.fields ?? []).every((f) => /^\d+$/.test(f.label));
      if (a.fields)
        parts.push(
          (q.fields ?? [])
            .filter((f) => a.fields?.[f.key]?.trim())
            .map((f) => (numbered ? a.fields![f.key] : `${f.label}: ${a.fields![f.key]}`))
            .join(numbered ? ", " : " · ")
        );
      break;
    }
  }
  if (a.other?.trim()) parts.push(`(${a.other.trim()})`);
  if (a.text?.trim()) parts.push(a.text.trim());
  return parts.filter(Boolean).join(" — ");
}

/* ── Editing helpers ──────────────────────────────────── */

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 32) || newId("opt")
  );
}

export function blankQuestion(type: QuestionType = "longtext"): Question {
  const q: Question = { id: newId("q"), type, prompt: "" };
  return withTypeDefaults(q, type);
}

/** When the type changes, make sure the type-specific bits exist. */
export function withTypeDefaults(q: Question, type: QuestionType): Question {
  const next: Question = { ...q, type };
  if ((type === "single" || type === "multi") && !next.options?.length)
    next.options = [
      { id: newId("o"), label: "Option 1" },
      { id: newId("o"), label: "Option 2" },
    ];
  if (type === "scale" && !next.scale) next.scale = { min: 1, max: 5, minLabel: "Not at all", maxLabel: "Very much" };
  if (type === "fields" && !next.fields?.length)
    next.fields = [
      { key: "1", label: "1" },
      { key: "2", label: "2" },
      { key: "3", label: "3" },
    ];
  return next;
}

export function blankSection(): Section {
  return {
    id: newId("s"),
    heading: "New section",
    title: "A new set of questions",
    intro: "A line about what this section is for.",
    commit: "add: new section",
    doodle: "bit",
    questions: [blankQuestion()],
  };
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** Copy a section into a form, renaming ids that already exist there. */
export function importSection(form: FormDoc, section: Section): Section {
  const taken = new Set(form.sections.flatMap((s) => [s.id, ...s.questions.map((q) => q.id)]));
  const s = clone(section);
  if (taken.has(s.id)) s.id = newId("s");
  s.archived = false;
  s.questions = s.questions.map((q) => (taken.has(q.id) ? { ...q, id: newId("q") } : q));
  return s;
}

/**
 * Replace the form with a template. Questions from the old form that aren't in
 * the template are kept as an archived section, so existing answers still show
 * on the dashboard.
 */
export function applyTemplate(current: FormDoc, template: FormDoc): FormDoc {
  const next = clone(template);
  const ids = new Set(next.sections.flatMap((s) => s.questions.map((q) => q.id)));
  const leftovers = current.sections
    .map((s) => ({ ...s, archived: true, questions: s.questions.filter((q) => !ids.has(q.id)) }))
    .filter((s) => s.questions.length > 0);
  const sectionIds = new Set(next.sections.map((s) => s.id));
  next.sections.push(...leftovers.map((s) => (sectionIds.has(s.id) ? { ...s, id: newId("s") } : s)));
  return next;
}

/** Light validation so a broken draft can't be published. */
export function problems(form: FormDoc): string[] {
  const out: string[] = [];
  const live = liveSections(form);
  if (!live.length) out.push("The form needs at least one section with a question.");
  for (const s of live) {
    if (!s.heading.trim()) out.push("A section is missing its name.");
    for (const q of s.questions) {
      const where = `“${s.heading}”`;
      if (!q.prompt.trim()) out.push(`A question in ${where} has no text.`);
      if ((q.type === "single" || q.type === "multi") && (q.options?.filter((o) => o.label.trim()).length ?? 0) < 2)
        out.push(`“${q.prompt || "Untitled"}” needs at least two options.`);
      if (q.type === "fields" && !q.fields?.length) out.push(`“${q.prompt || "Untitled"}” needs at least one box.`);
    }
  }
  return [...new Set(out)];
}
