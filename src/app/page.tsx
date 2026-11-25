import Link from "next/link";
import { DEMO_MODE } from "@/lib/config";
import { liveQuestions, liveSections } from "@/lib/form";
import { getPublishedForm } from "@/lib/form-server";
import { createClient } from "@/lib/supabase/server";
import { Doodle } from "@/components/Doodles";
import { FormCounts } from "@/components/FormCounts";
import { DiscordButton } from "@/components/DiscordButton";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const HERO_CAST = ["mug", "rocket", "laptop", "duck", "telescope", "cat"] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  let signedIn = false;
  if (!DEMO_MODE) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = !!data.user;
  }

  const form = await getPublishedForm();
  const questionCount = liveQuestions(form).length;
  const sectionCount = liveSections(form).length;

  const cta = signedIn ? "Continue your README" : "Try the demo";

  return (
    <main className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          {DEMO_MODE && <span className="label rounded-full bg-lime px-3 py-1 text-[#161616]">Demo</span>}
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-8">
        <div className="flex items-end justify-between gap-2">
          {HERO_CAST.map((d, i) => (
            <div
              key={d}
              className={`bob ${i > 3 ? "hidden sm:block" : ""}`}
              style={{ animationDelay: `${i * 0.35}s`, ["--r" as string]: `${i % 2 ? 3 : -3}deg` }}
            >
              <Doodle name={d} size={120} className="wiggle h-auto w-[72px] sm:w-[110px] lg:w-[140px]" />
            </div>
          ))}
        </div>
        <div className="label mt-6 grid grid-cols-3 items-start gap-4 text-[10px] sm:text-xs">
          <p>No right answers</p>
          <p className="text-center">
            <FormCounts questions={questionCount} sections={sectionCount} demo={DEMO_MODE} />
          </p>
          <p className="text-right">Only the team lead reads it</p>
        </div>
        <h1 className="display mt-4 whitespace-nowrap text-center text-[15vw] uppercase leading-[0.85] xl:text-[172px]">
          README<span className="mark-lime">.me</span>
        </h1>
        <div className="mt-10 flex flex-col items-center gap-3">
          {signedIn || DEMO_MODE ? (
            <Link
              href="/journey"
              className="ink-hover group inline-flex items-center gap-3 rounded-full bg-ink py-2.5 pl-7 pr-2.5 text-bg"
            >
              <span className="label text-[13px]">{cta}</span>
              <span className="grid size-10 place-items-center rounded-full bg-lime font-bold text-[#161616]">→</span>
            </Link>
          ) : (
            <DiscordButton next={next ?? "/journey"} />
          )}
          {error && <p className="text-sm text-pink">Sign-in didn&apos;t go through. Please try again.</p>}
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t-[1.5px] border-edge px-4 py-6 sm:px-8">
        <Logo />
        <p className="label text-muted">Made with ❤ for the team</p>
      </footer>
    </main>
  );
}
