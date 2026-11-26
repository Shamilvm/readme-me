import { Doodle } from "@/components/Doodles";
import { Logo } from "@/components/Logo";

/** Shown on every page until the Supabase keys are configured. */
export function SetupRequired() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-6 sm:px-8">
      <header>
        <Logo />
      </header>
      <section className="flex flex-1 flex-col justify-center py-12">
        <Doodle name="bit" mood="sleepy" size={110} />
        <p className="label mt-6 text-muted">Setup needed</p>
        <h1 className="display mt-3 text-5xl uppercase sm:text-6xl">
          Almost <span className="mark-lime">there.</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          README.me needs a Supabase project to store answers and handle sign-in. Three steps:
        </p>
        <ol className="mt-8 space-y-5">
          {[
            ["Create a Supabase project", "Free tier is fine. Then run supabase/schema.sql in its SQL Editor."],
            [
              "Add your keys",
              "Copy .env.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (on Vercel: Project → Settings → Environment Variables).",
            ],
            ["Restart the app", "Run npm run dev again, or redeploy. This page will turn into the sign-in page."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-bg">
                {i + 1}
              </span>
              <div>
                <p className="display text-xl uppercase">{title}</p>
                <p className="mt-1 text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-sm text-muted">The full step-by-step guide is in README.md.</p>
      </section>
    </main>
  );
}
