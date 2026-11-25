// Site-wide settings that admins change from the Settings tab.
// Shared by server and client code.

export type AuthProvider = "discord" | "github" | "google" | "email";

export const PROVIDERS: { id: AuthProvider; label: string; hint: string }[] = [
  { id: "discord", label: "Discord", hint: "Great if your team already lives on Discord. Needs a Discord app." },
  { id: "github", label: "GitHub", hint: "Handy for developer teams. Needs a GitHub OAuth app." },
  { id: "google", label: "Google", hint: "Works with any Google or Workspace account. Needs a Google OAuth client." },
  { id: "email", label: "Email link", hint: "A one-time sign-in link by email. Works out of the box, no setup." },
];

export type SiteSettings = {
  version: 1;
  /** Sign-in methods shown on the landing page, in this order. At least one. */
  signIn: AuthProvider[];
  /** Optional Discord invite, shown to members as "Join the Discord". */
  discordInvite?: string;
};

export const DEFAULT_SETTINGS: SiteSettings = { version: 1, signIn: ["email"], discordInvite: "" };

/** Fill in anything missing from older saved settings. */
export function normalizeSettings(s: Partial<SiteSettings> | null | undefined): SiteSettings {
  const valid = (s?.signIn ?? []).filter((p): p is AuthProvider => PROVIDERS.some((x) => x.id === p));
  return {
    version: 1,
    signIn: valid.length ? valid : DEFAULT_SETTINGS.signIn,
    discordInvite: s?.discordInvite?.trim() ?? "",
  };
}

export function isDiscordInvite(url: string) {
  return /^https:\/\/(www\.)?(discord\.gg|discord\.com\/invite)\/[\w-]+\/?$/i.test(url.trim());
}
