"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Doodle } from "@/components/Doodles";
import type { Mood } from "@/lib/fun";

/** Bit — the line-art robot who keeps people company. */
export function Mascot({
  mood,
  line,
  onPoke,
  size = 88,
  inline,
  bubbleRight,
}: {
  mood: Mood;
  line: string | null;
  onPoke?: () => void;
  size?: number;
  inline?: boolean;
  bubbleRight?: boolean;
}) {
  return (
    <div
      className={`${
        inline
          ? `relative flex items-end gap-2 ${bubbleRight ? "flex-row-reverse" : ""}`
          : "pointer-events-none fixed bottom-3 right-3 z-30 flex flex-col items-end gap-1 sm:bottom-6 sm:right-6 sm:flex-row sm:gap-2"
      }`}
    >
      <AnimatePresence mode="wait">
        {line && (
          <motion.div
            key={line}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className={`ink relative max-w-[13rem] rounded-2xl ${inline ? "mb-10" : "sm:mb-10"} bg-panel px-3.5 py-2.5 text-sm font-medium leading-snug text-ink sm:max-w-[16rem] ${
              bubbleRight ? "rounded-bl-none" : "rounded-br-none"
            }`}
            role="status"
          >
            {line}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={onPoke}
        aria-label="Poke Bit for a joke"
        className="pointer-events-auto shrink-0 cursor-pointer rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ rotate: [0, -6, 6, 0], transition: { duration: 0.45 } }}
        whileTap={{ scale: 0.88 }}
      >
        <Doodle name="bit" mood={mood} size={size} className={inline ? "" : "h-auto w-16 sm:w-[88px]"} />
      </motion.button>
    </div>
  );
}
