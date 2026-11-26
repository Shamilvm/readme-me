"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { vibeFor } from "@/lib/fun";
import { burstAt, burstFromElement } from "@/lib/fx";
import type { Answer, Option, Question } from "@/lib/form";

export type Reaction = { kind: "pick"; label: string } | { kind: "scale"; value: number; max: number };

type Props = {
  question: Question;
  value: Answer | undefined;
  onChange: (a: Answer) => void;
  onSubmit: () => void;
  onReact?: (r: Reaction) => void;
};

const LETTERS = "ABCDEFGHIJKLMNOP";
const NO_OPTIONS: Option[] = [];

/** Strip the skipped flag whenever the person edits an answer. */
function edit(value: Answer | undefined, patch: Partial<Answer>): Answer {
  const next = { ...(value ?? {}), ...patch };
  delete next.skipped;
  return next;
}

function isTyping(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

export function QuestionInput({ question: q, value, onChange, onSubmit, onReact }: Props) {
  switch (q.type) {
    case "text":
      return (
        <input
          autoFocus
          type="text"
          value={value?.text ?? ""}
          placeholder={q.placeholder ?? "Type your answer…"}
          onChange={(e) => onChange(edit(value, { text: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          className="w-full border-b-2 border-edge bg-transparent py-3 text-2xl font-medium outline-none placeholder:text-muted/60 focus-visible:outline-none"
        />
      );
    case "longtext":
      return (
        <div>
          <LongText
            autoFocus
            value={value?.text ?? ""}
            placeholder={q.placeholder ?? "Write as much or as little as you like…"}
            onChange={(text) => onChange(edit(value, { text }))}
            onSubmit={onSubmit}
          />
          <VibeMeter text={value?.text ?? ""} />
        </div>
      );
    case "single":
    case "multi":
      return <Choices q={q} value={value} onChange={onChange} onReact={onReact} />;
    case "scale":
      return <Scale q={q} value={value} onChange={onChange} onReact={onReact} />;
    case "fields":
      return <Fields q={q} value={value} onChange={onChange} onSubmit={onSubmit} />;
  }
}

function LongText({
  value,
  onChange,
  onSubmit,
  placeholder,
  autoFocus,
  small,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  autoFocus?: boolean;
  small?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus && ref.current) {
      const el = ref.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [autoFocus]);
  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={small ? 2 : 4}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && onSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }}
      className={`ink w-full resize-none rounded-3xl bg-panel px-5 py-4 leading-relaxed outline-none transition placeholder:text-muted/60 focus:bg-bg focus-visible:outline-none ${
        small ? "min-h-20 text-base" : "min-h-40 text-lg"
      }`}
    />
  );
}

function VibeMeter({ text }: { text: string }) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const pct = Math.min(100, words);
  return (
    <div className="mt-3 flex items-center gap-3 text-xs text-muted">
      <span className="label shrink-0 text-ink">
        {words} {words === 1 ? "word" : "words"}
      </span>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-ink"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={vibeFor(words)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="shrink-0 rounded-full bg-lime px-2 py-0.5 font-semibold text-[#161616]"
        >
          {vibeFor(words)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function Choices({
  q,
  value,
  onChange,
  onReact,
}: {
  q: Question;
  value: Answer | undefined;
  onChange: (a: Answer) => void;
  onReact?: (r: Reaction) => void;
}) {
  const multi = q.type === "multi";
  const options = q.options ?? NO_OPTIONS;
  const selected = multi ? value?.choices ?? [] : value?.choice ? [value.choice] : [];
  const showOther = selected.some((id) => options.find((o) => o.id === id)?.other);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function toggle(opt: Option, point?: { x: number; y: number }) {
    const turningOn = !selected.includes(opt.id);
    if (multi) {
      onChange(edit(value, { choices: turningOn ? [...selected, opt.id] : selected.filter((s) => s !== opt.id) }));
    } else {
      onChange(edit(value, { choice: turningOn ? opt.id : undefined }));
    }
    if (turningOn) {
      if (point) burstAt(point.x, point.y);
      else burstFromElement(refs.current[options.indexOf(opt)]);
      onReact?.({ kind: "pick", label: opt.label });
    }
  }

  // Letter shortcuts: press A, B, C… to pick an option.
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (i >= 0 && i < options.length) {
        e.preventDefault();
        toggleRef.current(options[i]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options]);

  return (
    <div className="space-y-4">
      {multi && (
        <p className="label text-muted">
          Pick as many as you like · <span className="text-ink">{selected.length} picked</span>
        </p>
      )}
      <div className={`grid gap-2.5 ${options.length > 6 ? "sm:grid-cols-2" : ""}`}>
        {options.map((opt, i) => {
          const on = selected.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              data-option
              onClick={(e) => toggle(opt, e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : undefined)}
              aria-pressed={on}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025, type: "spring", stiffness: 420, damping: 28 }}
              className={`ink ink-hover group flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-left font-medium ${
                on ? "bg-ink text-bg" : "bg-transparent hover:bg-accent-soft"
              }`}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                  on ? "bg-lime text-[#161616]" : "ink text-ink"
                }`}
              >
                {on ? "✓" : LETTERS[i]}
              </span>
              <span className="leading-snug">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {showOther && (
          <motion.input
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            autoFocus
            value={value?.other ?? ""}
            placeholder="Tell me more…"
            onChange={(e) => onChange(edit(value, { other: e.target.value }))}
            className="w-full border-b-2 border-edge bg-transparent py-2 text-lg outline-none focus-visible:outline-none"
          />
        )}
      </AnimatePresence>
      <OptionalNote value={value} onChange={onChange} />
    </div>
  );
}

function Scale({
  q,
  value,
  onChange,
  onReact,
}: {
  q: Question;
  value: Answer | undefined;
  onChange: (a: Answer) => void;
  onReact?: (r: Reaction) => void;
}) {
  const s = q.scale ?? { min: 1, max: 5, minLabel: "", maxLabel: "" };
  const nums = Array.from({ length: s.max - s.min + 1 }, (_, i) => s.min + i);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const setRef = useRef<(n: number) => void>(() => {});
  setRef.current = (n: number) => {
    onChange(edit(value, { scale: n }));
    burstFromElement(refs.current[n - s.min]);
    onReact?.({ kind: "scale", value: n, max: s.max });
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e)) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= s.min && n <= s.max) setRef.current(n);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s.min, s.max]);

  const current = value?.scale;
  return (
    <div className="space-y-5">
      <div className="relative flex items-center justify-between gap-2">
        <div className="absolute inset-x-6 top-1/2 h-[1.5px] -translate-y-1/2 bg-edge" aria-hidden />
        {nums.map((n, i) => {
          const on = current === n;
          return (
            <motion.button
              key={n}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              data-option
              onClick={() => setRef.current(n)}
              aria-pressed={on}
              animate={{ scale: on ? 1.18 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className={`ink display relative grid size-14 place-items-center rounded-full text-2xl sm:size-16 ${
                on ? "bg-lime text-[#161616]" : "bg-bg hover:bg-accent-soft"
              }`}
            >
              {n}
            </motion.button>
          );
        })}
      </div>
      <div className="label flex justify-between gap-4 text-muted">
        <span>{s.minLabel}</span>
        <span className="text-right">{s.maxLabel}</span>
      </div>
      <OptionalNote value={value} onChange={onChange} />
    </div>
  );
}

function Fields({
  q,
  value,
  onChange,
  onSubmit,
}: {
  q: Question;
  value: Answer | undefined;
  onChange: (a: Answer) => void;
  onSubmit: () => void;
}) {
  const fields = q.fields ?? [];
  const numbered = fields.every((f) => /^\d+$/.test(f.label));
  const box = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className="space-y-4">
      {fields.map((f, i) => {
        const filled = !!value?.fields?.[f.key]?.trim();
        return (
          <motion.label
            key={f.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4"
          >
            <span
              className={`shrink-0 transition-colors ${
                numbered
                  ? `grid size-9 place-items-center rounded-full text-sm font-bold ${filled ? "bg-lime text-[#161616]" : "bg-ink text-bg"}`
                  : "label w-32 text-muted sm:w-40"
              }`}
            >
              {numbered ? (filled ? "✓" : f.label) : f.label}
            </span>
            <input
              autoFocus={i === 0}
              value={value?.fields?.[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => onChange(edit(value, { fields: { ...(value?.fields ?? {}), [f.key]: e.target.value } }))}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const inputs = box.current?.querySelectorAll("input");
                const nextInput = inputs?.[i + 1];
                if (nextInput) nextInput.focus();
                else onSubmit();
              }}
              className="min-w-0 flex-1 border-b-2 border-edge bg-transparent py-2 text-xl font-medium outline-none placeholder:text-muted/50 focus-visible:outline-none"
            />
          </motion.label>
        );
      })}
    </div>
  );
}

function OptionalNote({ value, onChange }: { value: Answer | undefined; onChange: (a: Answer) => void }) {
  const [open, setOpen] = useState(!!value?.text);
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label text-muted underline decoration-dotted underline-offset-4 hover:text-ink"
      >
        + add a note
      </button>
    );
  return (
    <LongText
      small
      autoFocus={!value?.text}
      value={value?.text ?? ""}
      placeholder="Anything you want to add or explain…"
      onChange={(text) => onChange(edit(value, { text }))}
    />
  );
}
