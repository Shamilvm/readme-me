"use client";

import { useEffect, useState } from "react";
import { liveQuestions, liveSections } from "@/lib/form";
import { readDemoPublished } from "@/lib/store";

/** "85 questions / 10 short sections". In demo mode, reads the form published in this browser. */
export function FormCounts({ questions, sections, demo }: { questions: number; sections: number; demo?: boolean }) {
  const [counts, setCounts] = useState({ questions, sections });
  useEffect(() => {
    if (!demo) return;
    const f = readDemoPublished();
    if (f) setCounts({ questions: liveQuestions(f).length, sections: liveSections(f).length });
  }, [demo]);
  return (
    <>
      {counts.questions} questions
      <br />
      {counts.sections} short sections
    </>
  );
}
