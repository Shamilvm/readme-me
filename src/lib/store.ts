"use client";

import { DEMO_MODE } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import type { Answer, FormDoc } from "@/lib/form";
import { DEFAULT_FORM } from "@/templates";

const DEMO_KEY = "readme-me:demo-answers";
const DEMO_DONE_KEY = "readme-me:demo-completed";

export type Me = { id: string; name: string; avatarUrl?: string | null };

function readDemo(): Record<string, Answer> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export async function loadAnswers(userId: string): Promise<Record<string, Answer>> {
  if (DEMO_MODE) return readDemo();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("responses")
    .select("question_id, value")
    .eq("user_id", userId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.question_id, r.value as Answer]));
}

export async function saveAnswer(userId: string, questionId: string, value: Answer): Promise<void> {
  if (DEMO_MODE) {
    try {
      const all = readDemo();
      all[questionId] = value;
      localStorage.setItem(DEMO_KEY, JSON.stringify(all));
    } catch {
      /* storage unavailable — demo only */
    }
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("responses").upsert(
    { user_id: userId, question_id: questionId, value, updated_at: new Date().toISOString() },
    { onConflict: "user_id,question_id" }
  );
  if (error) throw error;
}

export async function markCompleted(userId: string): Promise<void> {
  if (DEMO_MODE) {
    try {
      localStorage.setItem(DEMO_DONE_KEY, new Date().toISOString());
    } catch {}
    return;
  }
  const supabase = createClient();
  await supabase.from("profiles").update({ completed_at: new Date().toISOString() }).eq("id", userId);
}

export function demoReset() {
  try {
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(DEMO_DONE_KEY);
  } catch {}
}

export function readDemoAnswers() {
  return readDemo();
}

export function readDemoCompletedAt(): string | null {
  try {
    return localStorage.getItem(DEMO_DONE_KEY);
  } catch {
    return null;
  }
}

/* ── Forms (draft / published) ────────────────────────── */

const DEMO_DRAFT_KEY = "readme-me:demo-draft";
const DEMO_PUBLISHED_KEY = "readme-me:demo-published";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Demo mode only: the form "published" in this browser. */
export function readDemoPublished(): FormDoc | null {
  return readJson<FormDoc>(DEMO_PUBLISHED_KEY);
}
export function readDemoDraft(): FormDoc | null {
  return readJson<FormDoc>(DEMO_DRAFT_KEY);
}

export async function loadDraft(): Promise<{ doc: FormDoc; hasDraft: boolean }> {
  if (DEMO_MODE) {
    const d = readJson<FormDoc>(DEMO_DRAFT_KEY);
    return { doc: d ?? readDemoPublished() ?? DEFAULT_FORM, hasDraft: !!d };
  }
  const supabase = createClient();
  const { data: draft } = await supabase.from("form_drafts").select("doc").eq("id", "main").maybeSingle();
  if (draft?.doc) return { doc: draft.doc as FormDoc, hasDraft: true };
  const { data: pub } = await supabase.from("form_published").select("doc").eq("id", "main").maybeSingle();
  return { doc: (pub?.doc as FormDoc | undefined) ?? DEFAULT_FORM, hasDraft: false };
}

export async function loadPublished(): Promise<FormDoc> {
  if (DEMO_MODE) return readDemoPublished() ?? DEFAULT_FORM;
  const supabase = createClient();
  const { data } = await supabase.from("form_published").select("doc").eq("id", "main").maybeSingle();
  return (data?.doc as FormDoc | undefined) ?? DEFAULT_FORM;
}

export async function saveDraft(doc: FormDoc): Promise<void> {
  if (DEMO_MODE) return writeJson(DEMO_DRAFT_KEY, doc);
  const supabase = createClient();
  const { error } = await supabase
    .from("form_drafts")
    .upsert({ id: "main", doc, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw error;
}

export async function publishForm(doc: FormDoc): Promise<void> {
  if (DEMO_MODE) {
    writeJson(DEMO_PUBLISHED_KEY, doc);
    try {
      localStorage.removeItem(DEMO_DRAFT_KEY);
    } catch {}
    return;
  }
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
  if (DEMO_MODE) {
    try {
      localStorage.removeItem(DEMO_DRAFT_KEY);
    } catch {}
    return readDemoPublished() ?? DEFAULT_FORM;
  }
  const supabase = createClient();
  await supabase.from("form_drafts").delete().eq("id", "main");
  return loadPublished();
}

/* ── Admins ───────────────────────────────────────────── */

export type AdminRow = { id: string; name: string; username?: string | null; avatarUrl?: string | null; isAdmin: boolean };

export async function listPeopleWithRoles(): Promise<AdminRow[]> {
  if (DEMO_MODE) return [{ id: "demo", name: "You (demo)", isAdmin: true }];
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
  if (DEMO_MODE) return;
  const supabase = createClient();
  const { error } = admin
    ? await supabase.from("admins").insert({ user_id: userId })
    : await supabase.from("admins").delete().eq("user_id", userId);
  if (error) throw error;
}
