// The template library. Admins can start from a whole template or pull single
// sections from any of them. To add your own, create a FormDoc and list it here.

import type { FormDoc, Section } from "@/lib/form";
import { teamDeepDive } from "./team-deep-dive";

export type Template = {
  id: string;
  name: string;
  description: string;
  doc: FormDoc;
};

const pickSection = (id: string, questionIds: string[], overrides: Partial<Section> = {}): Section => {
  const s = teamDeepDive.sections.find((x) => x.id === id)!;
  return {
    ...s,
    ...overrides,
    questions: questionIds.map((qid) => s.questions.find((q) => q.id === qid)!),
  };
};

const quickHello: FormDoc = {
  version: 1,
  welcome: {
    title: "Quick hello 👋",
    paragraphs: [
      "Hey! A few quick questions so we can get to know each other a little.",
      "No right or wrong answers, and you can skip anything.",
    ],
    wantToUnderstand: ["Who you are", "What you dream about", "How you like to work"],
    beforeYouStart: ["Be honest", "Write casually", "Skip anything you like"],
    privacy: "Your answers are only for the team lead. They save automatically, so you can stop and come back anytime.",
  },
  finale: {
    title: "That's it! ❤️",
    paragraphs: ["Thanks for sharing. Looking forward to working together!"],
  },
  sections: [
    pickSection("about", ["about_self", "three_words", "three_enjoy", "planner"]),
    pickSection("dreams", ["biggest_dream", "five_years"]),
    pickSection("work", ["stuck", "try_new", "team_size"], { heading: "How I Work" }),
    pickSection("setup", ["device", "os", "dev_tools"]),
    pickSection("final", ["six_months", "anything_else"]),
  ],
};

const blank: FormDoc = {
  version: 1,
  welcome: {
    title: "Welcome!",
    paragraphs: ["Write a short welcome note here."],
    wantToUnderstand: [],
    beforeYouStart: ["Be honest", "Skip anything you like"],
    privacy: "Your answers are private and save automatically.",
  },
  finale: { title: "That's it!", paragraphs: ["Thanks for taking the time."] },
  sections: [
    {
      id: "intro",
      heading: "Intro",
      title: "Let's start",
      intro: "A first question to warm up.",
      commit: "add: intro",
      doodle: "bit",
      questions: [{ id: "intro_1", type: "longtext", prompt: "Tell us a little about yourself." }],
    },
  ],
};

export const TEMPLATES: Template[] = [
  {
    id: "team-deep-dive",
    name: "Team deep-dive",
    description: "The full get-to-know-you: dreams, tech, how you work, strengths, setup and more.",
    doc: teamDeepDive,
  },
  {
    id: "quick-hello",
    name: "Quick hello",
    description: "14 light questions for a fast first introduction.",
    doc: quickHello,
  },
  {
    id: "blank",
    name: "Blank",
    description: "One section, one question. Build your own from scratch.",
    doc: blank,
  },
];

export const DEFAULT_FORM: FormDoc = teamDeepDive;

export function countQuestions(doc: FormDoc) {
  return doc.sections.filter((s) => !s.archived).reduce((n, s) => n + s.questions.filter((q) => !q.archived).length, 0);
}
