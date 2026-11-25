// All the playful bits: mascot lines, XP levels and badges.
// Edit freely — nothing here affects stored answers.

import { cardQuestion, hasContent, isDone, liveQuestions, liveSections, type Answer, type FormDoc, type QuestionType } from "@/lib/form";

export type Mood = "happy" | "thinking" | "excited" | "wow" | "sleepy" | "love";

export const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/* ── Mascot lines ─────────────────────────────────────── */

export const MASCOT_NAME = "Bit";

export const WELCOME_LINES = [
  `Hi! I'm ${MASCOT_NAME} 👋 I'll keep you company.`,
  "Grab a chai ☕ and get comfy.",
  "No wrong answers. I checked. Twice.",
];

/** Fallback when a section has no line of its own. */
export const SECTION_LINES = ["New section! Let's go 🚀", "Ooh, a fresh page ✨", "Here we go again 😄"];

export const TYPE_LINES: Record<QuestionType, string[]> = {
  longtext: [
    "Take your time. I'll wait here, blinking 👀",
    "No word limit. Go wild 🖊️",
    "Typos are welcome here. Promise.",
    "Write like you're texting a friend 💬",
  ],
  text: ["Short answer is fine!", "One line, no pressure ✌️"],
  single: ["Psst… press A, B or C 🤫", "Pick with your heart ❤️"],
  multi: ["Pick as many as you like 🍬", "Greedy is good here. Pick lots!"],
  scale: ["Be honest, nobody's grading this 📏", "Press 1 to 5. Quick and easy."],
  fields: ["Press Enter to hop to the next box ⏎", "Fill what you can, skip the rest."],
};

export const SKIP_LINES = [
  "Skipped! That's a feature, not a bug 🐛",
  "Totally fine. Moving on 🏃",
  "We'll pretend that never happened 🙈",
];

export const PICK_LINES = ["Nice pick! 👌", "Ooh, interesting 👀", "Noted ✍️", "Good taste 😎"];

export const SCALE_LINES: Record<number, string> = {
  1: "Fair! Honesty is cool 🫶",
  2: "Got it. Room to grow 🌱",
  3: "Right in the middle. Balanced ⚖️",
  4: "Nice, pretty solid 💪",
  5: "Love the energy 🔥",
};

export function lengthLine(chars: number): { line: string; mood: Mood } | null {
  if (chars > 600) return { line: "This is basically a novel. I love it 📚", mood: "love" };
  if (chars > 250) return { line: "Look at you go! ✍️", mood: "wow" };
  if (chars > 80) return { line: "Ooh, tell me more…", mood: "excited" };
  return null;
}

export const JOKES = [
  "Why do programmers prefer dark mode? Light attracts bugs 🐛",
  "It works on my machine 🤷",
  "I'd tell you a UDP joke, but you might not get it.",
  "There are 10 types of people: those who get binary and those who don't.",
  "A SQL query walks into a bar, sees two tables and asks: may I join you?",
  "I'm not lazy, I'm in energy-saving mode 🔋",
  "git commit -m \"fixed it\" … (it was not fixed)",
  "Hey, that tickles! 😆",
];

export const VIBES: [number, string][] = [
  [0, "blank page"],
  [1, "short & sweet"],
  [12, "warming up"],
  [40, "storyteller"],
  [100, "novelist"],
];

export const vibeFor = (words: number) => [...VIBES].reverse().find(([min]) => words >= min)![1];

/* ── XP & levels ──────────────────────────────────────── */

export const LEVELS = [
  { xp: 0, title: "Intern", emoji: "🐣" },
  { xp: 60, title: "Junior Dev", emoji: "🌱" },
  { xp: 200, title: "Mid-level Dev", emoji: "⚡" },
  { xp: 380, title: "Senior Dev", emoji: "🔥" },
  { xp: 580, title: "Staff Engineer", emoji: "🚀" },
  { xp: 780, title: "Legend", emoji: "👑" },
];

export function xpFor(form: FormDoc, answers: Record<string, Answer>) {
  let xp = 0;
  for (const q of liveQuestions(form)) {
    const a = answers[q.id];
    if (hasContent(a)) xp += 10;
    else if (a?.skipped) xp += 2;
  }
  return xp;
}

export function levelFor(xp: number) {
  let i = 0;
  LEVELS.forEach((l, idx) => {
    if (xp >= l.xp) i = idx;
  });
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { index: i, ...cur, next, progress };
}

/* ── Badges ───────────────────────────────────────────── */

export type Badge = { id: string; emoji: string; title: string; how: string };

export const BADGES: Badge[] = [
  { id: "first", emoji: "🌱", title: "First Commit", how: "Answer your first question" },
  { id: "roll", emoji: "🔥", title: "On a Roll", how: "Answer 10 questions" },
  { id: "half", emoji: "⛰️", title: "Halfway There", how: "Reach 50%" },
  { id: "novel", emoji: "📚", title: "Novelist", how: "Write a 300+ character answer" },
  { id: "open", emoji: "🫶", title: "Open Book", how: "Answer every question in a section" },
  { id: "explorer", emoji: "🧭", title: "Explorer", how: "Pick 4+ areas to explore" },
  { id: "linked", emoji: "🔗", title: "Connected", how: "Share a profile link" },
  { id: "owl", emoji: "🦉", title: "Night Owl", how: "Answer something after 11 pm" },
  { id: "shipped", emoji: "🚀", title: "Shipped It", how: "Finish every section" },
];

export function earnedBadges(form: FormDoc, answers: Record<string, Answer>): Set<string> {
  const got = new Set<string>();
  const qs = liveQuestions(form);
  const answered = qs.filter((q) => hasContent(answers[q.id])).length;
  const done = qs.filter((q) => isDone(answers[q.id])).length;
  if (answered >= 1) got.add("first");
  if (answered >= 10) got.add("roll");
  if (qs.length && done >= qs.length / 2) got.add("half");
  if (qs.some((q) => (answers[q.id]?.text?.length ?? 0) >= 300)) got.add("novel");
  if (liveSections(form).some((s) => s.questions.every((q) => hasContent(answers[q.id])))) got.add("open");
  const explore = cardQuestion(form, "explore");
  if (explore && (answers[explore.id]?.choices?.length ?? 0) >= 4) got.add("explorer");
  const links = cardQuestion(form, "links");
  if (links && Object.values(answers[links.id]?.fields ?? {}).some((v) => v?.trim())) got.add("linked");
  if (qs.length && done === qs.length) got.add("shipped");
  const h = new Date().getHours();
  if (answered >= 1 && (h >= 23 || h < 5)) got.add("owl");
  return got;
}
