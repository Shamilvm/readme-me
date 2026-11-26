"use client";

import confetti from "canvas-confetti";

/** Ink + lime, read live so dark mode gets light ink. */
function palette() {
  const cs = getComputedStyle(document.documentElement);
  const ink = cs.getPropertyValue("--text").trim() || "#161616";
  const lime = cs.getPropertyValue("--sun").trim() || "#c8f04a";
  return [ink, lime, lime];
}

/** Kept for compatibility with option labels; bursts are ink + lime now. */
export function leadingEmoji(label: string): string | null {
  const m = label.match(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)/u);
  return m ? m[1] : null;
}

/** A small pop of ink and lime bits from a screen point. */
export function burstAt(x: number, y: number) {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 14,
    spread: 70,
    startVelocity: 16,
    gravity: 0.9,
    ticks: 60,
    scalar: 0.8,
    shapes: ["circle", "square"],
    colors: palette(),
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    disableForReducedMotion: true,
  });
}

export function burstFromElement(el: Element | null) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burstAt(r.left + r.width / 2, r.top + r.height / 2);
}

export function bigCelebration() {
  const colors = palette();
  const end = Date.now() + 1300;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0 }, colors, disableForReducedMotion: true });
    confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1 }, colors, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function smallPop() {
  confetti({ particleCount: 50, spread: 75, origin: { y: 0.6 }, colors: palette(), disableForReducedMotion: true });
}
