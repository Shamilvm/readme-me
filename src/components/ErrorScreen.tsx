import Link from "next/link";
import type { ReactNode } from "react";
import { Doodle, type DoodleName } from "@/components/Doodles";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Mood } from "@/lib/fun";

type Zero = { name: DoodleName; mood?: Mood };

/**
 * Shared layout for 404 / 403 / 500. The big status code is drawn in display
 * type, and every "0" in it is swapped for one of the cast. Below it, a tiny
 * terminal shows what "went wrong", README-style.
 */
export function ErrorScreen({
  code,
  zeros,
  eyebrow,
  title,
  body,
  terminal,
  actions,
}: {
  code: string;
  zeros: Zero[];
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
  terminal: { cmd: string; out: string };
  actions: ReactNode;
}) {
  let z = 0;
  return (
    <main className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-6 text-center sm:px-8">
        <p className="label text-muted">{eyebrow}</p>

        <h1
          aria-label={`Error ${code}`}
          className="display mt-4 flex items-center justify-center text-[38vw] leading-[0.8] sm:text-[200px] lg:text-[230px]"
        >
          {code.split("").map((ch, i) => {
            if (ch !== "0") return <span key={i}>{ch}</span>;
            const zero = zeros[z++ % zeros.length];
            return (
              <span
                key={i}
                className="bob mx-[0.04em] inline-block"
                style={{ animationDelay: `${i * 0.4}s`, ["--r" as string]: `${i % 2 ? 3 : -3}deg` }}
              >
                <Doodle name={zero.name} mood={zero.mood} className="wiggle h-[0.78em] w-[0.78em]" />
              </span>
            );
          })}
        </h1>

        <h2 className="display mt-5 text-4xl uppercase sm:text-5xl">{title}</h2>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">{body}</p>

        <div className="ink mt-6 w-full max-w-md rounded-2xl bg-panel px-4 py-3 text-left font-mono text-[13px] leading-relaxed">
          <p>
            <span className="text-muted">$</span> {terminal.cmd}
          </p>
          <p className="text-pink">{terminal.out}</p>
          <p className="cursor text-muted">$</p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t-[1.5px] border-edge px-4 py-6 sm:px-8">
        <Logo />
        <p className="label text-muted">Error {code}</p>
      </footer>
    </main>
  );
}

/** Solid ink pill with the lime arrow, same as the landing page's main button. */
export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="ink-hover inline-flex items-center gap-3 rounded-full bg-ink py-2.5 pl-7 pr-2.5 text-bg">
      <span className="label text-[13px]">{children}</span>
      <span className="grid size-10 place-items-center rounded-full bg-lime font-bold text-[#161616]">→</span>
    </Link>
  );
}

export const secondaryActionClass = "ink ink-hover label rounded-full px-6 py-3.5 text-[13px]";
