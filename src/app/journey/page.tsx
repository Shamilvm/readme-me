import { redirect } from "next/navigation";
import { DEMO_MODE } from "@/lib/config";
import { getDraftForm, getPublishedForm } from "@/lib/form-server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FORM } from "@/templates";
import { Journey } from "./Journey";

export const dynamic = "force-dynamic";

export default async function JourneyPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  const wantsPreview = preview === "1";

  if (DEMO_MODE) {
    // The demo swaps in the browser's saved form on the client.
    return <Journey me={{ id: "demo", name: "You" }} isAdmin demo preview={wantsPreview} form={DEFAULT_FORM} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: isAdmin }] = await Promise.all([
    supabase.from("profiles").select("display_name, username, avatar_url").eq("id", user.id).single(),
    supabase.rpc("is_admin"),
  ]);
  await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);

  const showDraft = wantsPreview && !!isAdmin;
  const form = showDraft ? await getDraftForm() : await getPublishedForm();

  const name =
    profile?.display_name ?? profile?.username ?? (user.user_metadata?.full_name as string | undefined) ?? "friend";

  return (
    <Journey
      me={{ id: user.id, name, avatarUrl: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) }}
      isAdmin={!!isAdmin}
      form={form}
      preview={showDraft}
    />
  );
}
