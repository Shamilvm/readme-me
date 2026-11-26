"use client";

// Browser-side data access. Everything goes through Supabase, and Row Level
// Security decides what each person may read or write.

import type { Answer, FormDoc } from "@/lib/form";
import { normalizeSettings, type SiteSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_FORM } from "@/templates";

export type Me = { id: string; name: string; avatarUrl?: string | null };

/* ── Answers ──────────────────────────────────────────── */

export async function loadAnswers(userId: string): Promise<Record<string, Answer>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("responses").select("question_id, value").eq("user_id", userId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.question_id, r.value as Answer]));
}

export async function saveAnswer(userId: string, questionId: string, value: Answer): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("responses").upsert(
    { user_id: userId, question_id: questionId, value, updated_at: new Date().toISOString() },
    { onConflict: "user_id,question_id" }
  );
  if (error) throw error;
}

/** Final submission: locks the member's answers (enforced by the database). */
export async function submitReadme(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_readme");
  if (error) throw error;
  return (data as string | null) ?? new Date().toISOString();
}

/** Admin only: unlock someone's submitted README so they can edit again. */
export async function reopenReadme(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("reopen_readme", { target: userId });
  if (error) throw error;
}

/* ── Forms (draft / published) ────────────────────────── */

export async function loadDraft(): Promise<{ doc: FormDoc; hasDraft: boolean }> {
  const supabase = createClient();
  const { data: draft } = await supabase.from("form_drafts").select("doc").eq("id", "main").maybeSingle();
  if (draft?.doc) return { doc: draft.doc as FormDoc, hasDraft: true };
  return { doc: await loadPublished(), hasDraft: false };
}

export async function loadPublished(): Promise<FormDoc> {
  const supabase = createClient();
  const { data } = await supabase.from("form_published").select("doc").eq("id", "main").maybeSingle();
  return (data?.doc as FormDoc | undefined) ?? DEFAULT_FORM;
}

export async function saveDraft(doc: FormDoc): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("form_drafts")
    .upsert({ id: "main", doc, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw error;
}

export async function publishForm(doc: FormDoc): Promise<void> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from("form_published").upsert(
    { id: "main", doc, published_at: new Date().toISOString(), published_by: user.user?.id ?? null },
    { onConflict: "id" }
  );
  if (error) throw error;
  await supabase.from("form_drafts").delete().eq("id", "main");
}

export async function discardDraft(): Promise<FormDoc> {
  const supabase = createClient();
  await supabase.from("form_drafts").delete().eq("id", "main");
  return loadPublished();
}

/* ── Admins ───────────────────────────────────────────── */

export type AdminRow = { id: string; name: string; username?: string | null; avatarUrl?: string | null; isAdmin: boolean };

export async function listPeopleWithRoles(): Promise<AdminRow[]> {
  const supabase = createClient();
  const [{ data: people }, { data: admins }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, username, avatar_url").order("created_at"),
    supabase.from("admins").select("user_id"),
  ]);
  const set = new Set((admins ?? []).map((a) => a.user_id));
  return (people ?? []).map((p) => ({
    id: p.id,
    name: p.display_name ?? p.username ?? "Unnamed",
    username: p.username,
    avatarUrl: p.avatar_url,
    isAdmin: set.has(p.id),
  }));
}

export async function setAdmin(userId: string, admin: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = admin
    ? await supabase.from("admins").insert({ user_id: userId })
    : await supabase.from("admins").delete().eq("user_id", userId);
  if (error) throw error;
}

/* ── Site settings ────────────────────────────────────── */

export async function loadSettings(): Promise<SiteSettings> {
  const supabase = createClient();
  const { data } = await supabase.from("site_settings").select("doc").eq("id", "main").maybeSingle();
  return normalizeSettings(data?.doc as Partial<SiteSettings> | undefined);
}

export async function saveSettings(doc: SiteSettings): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "main", doc, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw error;
}
