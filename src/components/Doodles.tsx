"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Mood } from "@/lib/fun";

/*
  The README.me cast — hand-coded line-art characters.
  Everything is drawn in a 120×120 box with ink strokes on paper fill,
  so they flip automatically with dark mode. Eyes follow the pointer and blink.

  Want real illustrations instead? Replace any drawing below with an <image>
  or swap the <Doodle> for an <img src="/doodles/mug.svg">.
*/

import type { DoodleName } from "@/lib/doodles";

export type { DoodleName };

const INK = "var(--text)";
const PAPER = "var(--bg)";
const LIME = "var(--sun)";
const PUPIL = "var(--pupil)";
const S = 3; // stroke width

const line = { stroke: INK, strokeWidth: S, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const shape = { ...line, fill: PAPER };
const open = { ...line, fill: "none" };

/* ── Pointer tracking & blinking ──────────────────────── */

function useLook(ref: RefObject<SVGSVGElement | null>) {
  const [look, setLook] = useState({ x: 0, y: 0 });
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 200);
        setLook({ x: (dx / d) * k, y: (dy / d) * k });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
  return look;
}

function useBlink() {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    let u: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setClosed(true);
        u = setTimeout(() => setClosed(false), 140);
        loop();
      }, 2200 + Math.random() * 3800);
    };
    loop();
    return () => {
      clearTimeout(t);
      clearTimeout(u);
    };
  }, []);
  return closed;
}

type Look = { x: number; y: number };

function makeEye(look: Look, closed: boolean) {
  return function Eye(cx: number, cy: number, r: number) {
    if (closed)
      return <path key={`${cx}-${cy}`} d={`M${cx - r} ${cy}q${r} ${r * 0.8} ${r * 2} 0`} {...open} />;
    return (
      <g key={`${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={INK} strokeWidth={S} />
        <circle cx={cx + look.x * r * 0.42} cy={cy + look.y * r * 0.42} r={r * 0.5} fill={PUPIL} />
        <circle cx={cx + look.x * r * 0.42 + r * 0.15} cy={cy + look.y * r * 0.42 - r * 0.18} r={r * 0.14} fill="#fff" />
      </g>
    );
  };
}

/* ── Public component ─────────────────────────────────── */

export function Doodle({
  name,
  size = 120,
  mood = "happy",
  className = "",
  title,
}: {
  name: DoodleName;
  size?: number;
  mood?: Mood;
  className?: string;
  title?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const look = useLook(ref);
  const blink = useBlink();
  const sleepy = mood === "sleepy";
  const thinking = mood === "thinking";
  const eye = makeEye(thinking ? { x: 0.6, y: -0.8 } : look, blink || sleepy);
  const draw = DRAWINGS[name];
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      overflow="visible"
    >
      {draw({ eye, mood, look })}
    </svg>
  );
}

type DrawProps = { eye: ReturnType<typeof makeEye>; mood: Mood; look: Look };

const smile = (x: number, y: number, w = 12) => <path d={`M${x} ${y}q${w / 2} ${w * 0.45} ${w} 0`} {...open} />;

/* ── The drawings ─────────────────────────────────────── */

const DRAWINGS: Record<DoodleName, (p: DrawProps) => ReactNode> = {
  mug: ({ eye }) => (
    <>
      <path d="M46 10c-5 6 5 10 0 17M60 6c-5 6 5 10 0 17M74 10c-5 6 5 10 0 17" {...open} />
      <path d="M86 50c16-2 20 28 0 30" {...open} />
      <path d="M26 36h62v52c0 12-8 20-20 20H46c-12 0-20-8-20-20Z" {...shape} />
      <path d="M26 46h62" {...open} />
      {eye(46, 66, 8)}
      {eye(68, 66, 8)}
      {smile(51, 84, 12)}
      <path d="M36 98c4 2 8 2 12 0" {...open} opacity={0.35} />
    </>
  ),

  rocket: ({ eye }) => (
    <g transform="rotate(18 60 60)">
      <path d="M48 84c-2 14 6 22 12 32 6-10 14-18 12-32Z" fill={LIME} {...{ stroke: INK, strokeWidth: S, strokeLinejoin: "round" }} />
      <path d="M40 66 26 86l16-4M80 66l14 20-16-4" {...shape} />
      <path d="M60 6c18 14 24 40 18 78H42C36 46 42 20 60 6Z" {...shape} />
      <path d="M46 26h28" {...open} />
      {eye(51, 46, 7)}
      {eye(69, 46, 7)}
      {smile(54, 62, 12)}
    </g>
  ),

  laptop: ({ eye, mood }) => (
    <>
      <rect x="18" y="18" width="84" height="62" rx="7" {...shape} />
      <rect x="26" y="26" width="68" height="46" rx="3" {...open} />
      {eye(48, 46, 9)}
      {eye(72, 46, 9)}
      {mood === "wow" ? <circle cx="60" cy="63" r="4" {...open} /> : smile(53, 60, 14)}
      <path d="M8 88h104l-9 14H17Z" {...shape} />
      <path d="M50 95h20" {...open} />
    </>
  ),

  duck: ({ eye }) => (
    <>
      <path d="M14 86c0-16 14-26 34-26h10c-8-6-10-16-6-26 6-14 26-16 36-4 8 10 4 24-6 30 16 2 26 12 24 26-2 16-18 22-40 22H40c-16 0-26-8-26-22Z" {...shape} />
      <path d="M94 38l18 4-16 8Z" fill={LIME} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M38 84c8 10 22 10 30 0" {...open} />
      {eye(72, 36, 6)}
      {eye(86, 34, 6)}
      <path d="M22 112c10 3 26 3 36 0" {...open} opacity={0.35} />
    </>
  ),

  pencil: ({ eye }) => (
    <>
      <path d="M46 62c-10 4-16 12-14 22" {...open} />
      <path d="M74 58c10 0 14-6 12-14" {...open} />
      <path d="M84 46c-4-8 4-14 10-8 6 6 0 14-6 12" {...shape} />
      <rect x="46" y="10" width="28" height="16" rx="4" fill={LIME} stroke={INK} strokeWidth={S} />
      <path d="M46 24h28v62H46Z" {...shape} />
      <path d="M56 24v62M64 24v62" {...open} opacity={0.25} />
      <path d="M46 86l14 26 14-26Z" {...shape} />
      <path d="M56 104l4 8 4-8Z" fill={INK} />
      {eye(54, 44, 6)}
      {eye(67, 44, 6)}
      {smile(55, 58, 10)}
    </>
  ),

  cursor: ({ eye }) => (
    <>
      <path d="M92 28l12-7M96 44h14M92 60l12 7" {...open} />
      <path d="M26 10v88l20-18 14 32 14-6-14-30h28Z" {...shape} />
      {eye(38, 52, 7)}
      {eye(54, 60, 7)}
      {smile(38, 72, 10)}
    </>
  ),

  chat: ({ eye }) => (
    <>
      <path d="M12 12h56a9 9 0 0 1 9 9v30a9 9 0 0 1-9 9H34L20 74V60h-8a9 9 0 0 1-9-9V21a9 9 0 0 1 9-9Z" {...shape} />
      {eye(30, 34, 6)}
      {eye(48, 34, 6)}
      {smile(33, 46, 12)}
      <path d="M52 52h56a9 9 0 0 1 9 9v28a9 9 0 0 1-9 9h-6v14L88 98H52a9 9 0 0 1-9-9V61a9 9 0 0 1 9-9Z" fill={LIME} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {eye(72, 72, 6)}
      {eye(90, 72, 6)}
      <path d="M74 84q7 7 14 0Z" fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </>
  ),

  keycap: ({ eye }) => (
    <>
      <path d="M12 44 60 20l48 24v38L60 106 12 82Z" {...shape} />
      <path d="M24 44 60 26l36 18-36 20Z" {...shape} />
      <path d="M12 44l12 0M108 44H96M60 64v42" {...open} />
      {eye(52, 44, 6)}
      {eye(68, 44, 6)}
      {smile(55, 53, 10)}
      <text x="30" y="86" fontSize="14" fontWeight="800" fill={INK} fontFamily="var(--font-mono-face)">
        ⌘
      </text>
    </>
  ),

  telescope: ({ eye }) => (
    <>
      <path d="M58 70 34 112M62 70l24 42M60 70v42" {...open} />
      <g transform="rotate(-24 60 56)">
        <rect x="12" y="50" width="12" height="14" rx="3" {...shape} />
        <rect x="22" y="44" width="70" height="26" rx="5" {...shape} />
        <rect x="90" y="38" width="16" height="38" rx="4" fill={LIME} stroke={INK} strokeWidth={S} />
        {eye(46, 57, 7)}
        {eye(64, 57, 7)}
      </g>
      <circle cx="60" cy="68" r="4" fill={INK} />
      <path d="M104 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill={INK} />
    </>
  ),

  cat: () => (
    <>
      <path d="M22 50 26 12l24 20c7-2 13-2 20 0l24-20 4 38c4 34-14 54-38 54S18 84 22 50Z" {...shape} />
      <path d="M30 26l8 8M90 26l-8 8" {...open} />
      <path d="M26 54h28v8c0 7-5 12-12 12h-4c-7 0-12-5-12-12Z" fill={INK} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M66 54h28v8c0 7-5 12-12 12h-4c-7 0-12-5-12-12Z" fill={INK} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M54 58h12" {...open} />
      <path d="M32 60l6-3M72 60l6-3" stroke={LIME} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M57 80h6l-3 4Z" fill={INK} />
      <path d="M52 90q8 5 16-2" {...open} />
      <path d="M8 78l20 2M8 88l20-2M112 78l-20 2M112 88l-20-2" {...open} strokeWidth={2} />
    </>
  ),

  bit: ({ eye, mood }) => (
    <>
      <path d="M60 22V10" {...open} />
      <circle cx="60" cy="8" r="6" fill={LIME} stroke={INK} strokeWidth={S} />
      <rect x="10" y="48" width="10" height="20" rx="4" {...shape} />
      <rect x="100" y="48" width="10" height="20" rx="4" {...shape} />
      <path d="M42 88h36v14a8 8 0 0 1-8 8H50a8 8 0 0 1-8-8Z" {...shape} />
      <rect x="18" y="22" width="84" height="68" rx="24" {...shape} />
      {mood === "love" ? (
        <>
          <Heart x={44} y={52} />
          <Heart x={76} y={52} />
        </>
      ) : (
        <>
          {eye(44, 52, mood === "wow" ? 12 : 10)}
          {eye(76, 52, mood === "wow" ? 12 : 10)}
        </>
      )}
      {mood === "happy" && smile(52, 72, 16)}
      {mood === "love" && smile(52, 72, 16)}
      {mood === "excited" && <path d="M48 70h24q-2 12-12 12t-12-12Z" fill={INK} stroke={INK} strokeWidth={S} strokeLinejoin="round" />}
      {mood === "wow" && <ellipse cx="60" cy="76" rx="5" ry="6" {...open} />}
      {mood === "thinking" && <path d="M52 76h14" {...open} />}
      {mood === "sleepy" && <path d="M54 76q6 3 12 0" {...open} />}
      {mood === "thinking" && <path d="M98 20q8-2 10 6" {...open} />}
      {mood === "sleepy" && (
        <text x="96" y="22" fontSize="14" fontWeight="800" fill={INK}>
          z
        </text>
      )}
    </>
  ),
};

function Heart({ x, y }: { x: number; y: number }) {
  return (
    <path
      transform={`translate(${x - 11} ${y - 10})`}
      d="M11 20S1 13.5 1 7.5A5 5 0 0 1 11 5a5 5 0 0 1 10 2.5C21 13.5 11 20 11 20Z"
      fill={LIME}
      stroke={INK}
      strokeWidth={S}
      strokeLinejoin="round"
    />
  );
}
