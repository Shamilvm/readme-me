import "server-only";
import { normalizeSettings, type SiteSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export async function getSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("doc").eq("id", "main").maybeSingle();
  return normalizeSettings(data?.doc as Partial<SiteSettings> | undefined);
}
