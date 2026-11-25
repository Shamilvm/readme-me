"use client";

import { useEffect, useState } from "react";
import { ProviderIcon } from "@/components/SignInOptions";
import { PROVIDERS, isDiscordInvite, type AuthProvider, type SiteSettings } from "@/lib/settings";
import { loadSettings, saveSettings } from "@/lib/store";

export function SettingsPanel() {
  const [saved, setSaved] = useState<SiteSettings | null>(null);
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings()
      .then((s) => {
        setSaved(s);
        setDraft(s);
      })
      .catch((e) => setError(e?.message ?? "Couldn't load settings."));
  }, []);

  if (!draft || !saved) return <p className="label cursor text-muted">{error ?? "Loading settings"}</p>;

  const toggle = (id: AuthProvider) =>
    setDraft((d) =>
      d ? { ...d, signIn: d.signIn.includes(id) ? d.signIn.filter((p) => p !== id) : [...d.signIn, id] } : d
    );
  const invite = draft.discordInvite?.trim() ?? "";
  const inviteOk = !invite || isDiscordInvite(invite);
  const changed = JSON.stringify(draft) !== JSON.stringify(saved);
  const canSave = changed && draft.signIn.length > 0 && inviteOk && status !== "saving";

  async function save() {
    if (!draft) return;
    setStatus("saving");
    setError(null);
    try {
      const doc = { ...draft, discordInvite: invite };
      await saveSettings(doc);
      setSaved(doc);
      setDraft(doc);
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      setError((e as Error)?.message ?? "Couldn't save.");
    }
  }

  return (
    <div className="max-w-3xl space-y-14">
      {/* Sign-in */}
      <section>
        <h2 className="display text-4xl uppercase">
          <span className="mark-lime">Sign-in</span>
        </h2>
        <p className="mt-3 text-muted">
          Choose how members sign in. The landing page shows a button for each method you turn on.
        </p>
        <ul className="mt-6 space-y-3">
          {PROVIDERS.map((p) => {
            const on = draft.signIn.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  onClick={() => toggle(p.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-4 rounded-3xl p-4 text-left transition ${
                    on ? "bg-ink text-bg" : "ink bg-panel hover:bg-accent-soft"
                  }`}
                >
                  <span className={`grid size-11 shrink-0 place-items-center rounded-full ${on ? "bg-bg text-ink" : "bg-panel-2"}`}>
                    <ProviderIcon id={p.id} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="label block">{p.label}</span>
                    <span className={`mt-0.5 block text-sm ${on ? "opacity-75" : "text-muted"}`}>{p.hint}</span>
                  </span>
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      on ? "bg-lime text-[#161616]" : "ink"
                    }`}
                    aria-hidden
                  >
                    {on ? "✓" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {draft.signIn.length === 0 && <p className="mt-3 text-sm text-pink">Turn on at least one sign-in method.</p>}
        <p className="mt-4 rounded-2xl bg-panel-2 p-4 text-sm leading-relaxed">
          <b>Also turn the method on in Supabase</b> (Authentication → Sign In / Providers). Discord, GitHub and Google
          need their own app keys there; the email link works without extra setup. See the README for step-by-step help.
        </p>
      </section>

      {/* Community */}
      <section>
        <h2 className="display text-4xl uppercase">
          <span className="mark-ink">Community</span>
        </h2>
        <p className="mt-3 text-muted">Optional. Give members a link to your Discord server.</p>
        <label className="mt-6 block">
          <span className="label mb-1.5 block text-muted">Discord invite link</span>
          <input
            value={draft.discordInvite ?? ""}
            onChange={(e) => setDraft({ ...draft, discordInvite: e.target.value })}
            placeholder="https://discord.gg/your-invite"
            className="w-full border-b-[1.5px] border-edge bg-transparent py-2 text-lg outline-none focus-visible:outline-none"
          />
        </label>
        {!inviteOk && <p className="mt-2 text-sm text-pink">That doesn&apos;t look like a Discord invite (discord.gg/… or discord.com/invite/…).</p>}
        <p className="mt-2 text-sm text-muted">Shown as a “Join the Discord” button on the finishing screen. Leave empty to hide it.</p>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t-[1.5px] border-edge pt-6">
        <button
          onClick={save}
          disabled={!canSave}
          className="ink-hover inline-flex items-center gap-2 rounded-full bg-ink py-2 pl-6 pr-2 text-bg disabled:opacity-40"
        >
          <span className="label">{status === "saving" ? "Saving…" : "Save settings"}</span>
          <span className="grid size-8 place-items-center rounded-full bg-lime font-bold text-[#161616]">✓</span>
        </button>
        {changed && (
          <button onClick={() => setDraft(saved)} className="label rounded-full px-4 py-2 text-muted hover:text-ink">
            Undo changes
          </button>
        )}
        <span className="label text-muted">
          {status === "saved" && !changed ? "Saved. Changes are live." : changed ? "Unsaved changes" : ""}
        </span>
        {error && <p className="w-full text-sm text-pink">{error}</p>}
      </div>
    </div>
  );
}
