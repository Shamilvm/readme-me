import "server-only";
import { DEMO_MODE } from "@/lib/config";
import type { FormDoc } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FORM } from "@/templates";

/** The form members see. Falls back to the built-in template until an admin publishes. */
export async function getPublishedForm(): Promise<FormDoc> {
  if (DEMO_MODE) return DEFAULT_FORM;
  const supabase = await createClient();
  const { data } = await supabase.from("form_published").select("doc").eq("id", "main").maybeSingle();
  return (data?.doc as FormDoc | undefined) ?? DEFAULT_FORM;
}

/** The admin's draft, or the published form if there's no draft. */
export async function getDraftForm(): Promise<FormDoc> {
  if (DEMO_MODE) return DEFAULT_FORM;
  const supabase = await createClient();
  const { data } = await supabase.from("form_drafts").select("doc").eq("id", "main").maybeSingle();
  return (data?.doc as FormDoc | undefined) ?? (await getPublishedForm());
}
