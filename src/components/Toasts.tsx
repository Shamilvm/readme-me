"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";

export type Toast = { id: number; emoji: string; title: string; body?: string; tone?: "accent" | "sun" | "ok" };

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const n = useRef(0);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++n.current;
    setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3800);
  }, []);
  return { toasts, push };
}

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-20 z-40 flex w-[min(92vw,24rem)] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="flex items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-5 text-bg"
            role="status"
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-full text-xl ${
                t.tone === "sun" ? "bg-lime" : "bg-bg"
              }`}
              aria-hidden
            >
              {t.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold leading-tight">{t.title}</p>
              {t.body && <p className="text-xs opacity-70">{t.body}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
