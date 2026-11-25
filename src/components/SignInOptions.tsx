"use client";

import { useState } from "react";
import { PROVIDERS, type AuthProvider } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";

/** One button per sign-in method the admin turned on. */
export function SignInOptions({ providers, next = "/journey" }: { providers: AuthProvider[]; next?: string }) {
  const [busy, setBusy] = useState<AuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(providers.length === 1 && providers[0] === "email");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function oauth(provider: Exclude<AuthProvider, "email">) {
    setBusy(provider);
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
    if (error) {
      setError(error.message);
      setBusy(null);
    }
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo(), shouldCreateUser: true },
    });
    setBusy(null);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent)
    return (
      <div className="ink rounded-3xl bg-panel px-6 py-5 text-center">
        <p className="display text-2xl uppercase">Check your inbox</p>
        <p className="mt-2 text-sm text-muted">
          We sent a sign-in link to <b className="text-ink">{email}</b>. Open it on this device.
        </p>
        <button onClick={() => setSent(false)} className="label mt-3 text-muted underline underline-offset-4 hover:text-ink">
          Use a different email
        </button>
      </div>
    );

  return (
    <div className="flex w-full max-w-sm flex-col items-stretch gap-2.5">
      {providers.map((p) =>
        p === "email" ? (
          emailOpen ? (
            <form key={p} onSubmit={sendLink} className="ink flex items-center gap-2 rounded-full bg-panel py-1.5 pl-5 pr-1.5">
              <input
                type="email"
                required
                autoFocus={providers.length > 1}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="min-w-0 flex-1 bg-transparent py-2 outline-none focus-visible:outline-none"
              />
              <button
                disabled={busy === "email"}
                className="label shrink-0 rounded-full bg-ink px-4 py-2.5 text-bg disabled:opacity-60"
              >
                {busy === "email" ? "Sending…" : "Send link"}
              </button>
            </form>
          ) : (
            <ProviderButton key={p} id={p} onClick={() => setEmailOpen(true)} />
          )
        ) : (
          <ProviderButton key={p} id={p} busy={busy === p} onClick={() => oauth(p)} />
        )
      )}
      {error && <p className="text-center text-sm text-pink">{error}</p>}
    </div>
  );
}

function ProviderButton({ id, busy, onClick }: { id: AuthProvider; busy?: boolean; onClick: () => void }) {
  const label = PROVIDERS.find((x) => x.id === id)!.label;
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="ink-hover flex items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-6 text-bg disabled:opacity-60"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-bg text-ink">
        <ProviderIcon id={id} />
      </span>
      <span className="label flex-1 text-center text-[13px]">
        {busy ? "Opening…" : id === "email" ? "Sign in with email" : `Continue with ${label}`}
      </span>
    </button>
  );
}

export function ProviderIcon({ id }: { id: AuthProvider }) {
  switch (id) {
    case "discord":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.3 18.3 0 0 0-5.49 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-1.99a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08 0l.37.3a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.05.1c.36.7.78 1.36 1.23 1.99a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .04-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.22 0 2.18 1.1 2.16 2.42 0 1.34-.94 2.42-2.16 2.42Z" />
        </svg>
      );
    case "github":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
      );
    case "google":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.16 3.58-8.81Z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.92l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l3.99-3.1Z" />
          <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.62l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
        </svg>
      );
    case "email":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
  }
}
