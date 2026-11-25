import Link from "next/link";
import { redirect } from "next/navigation";
import { SUPABASE_CONFIGURED } from "@/lib/config";
import { SetupRequired } from "@/components/SetupRequired";
import type { Answer } from "@/lib/form";
import { getPublishedForm } from "@/lib/form-server";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard, type Person } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  if (!SUPABASE_CONFIGURED) return <SetupRequired />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="display text-7xl">403</p>
          <p className="mt-4 text-lg">This page is only for the team lead.</p>
          <Link href="/journey" className="label mt-6 inline-block underline underline-offset-4">
            ← back to your README
          </Link>
        </div>
      </main>
    );
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at, last_seen_at, completed_at")
    .order("created_at");

  // Supabase returns at most 1000 rows per request, so page through responses.
  const responses: { user_id: string; question_id: string; value: Answer; updated_at: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("responses")
      .select("user_id, question_id, value, updated_at")
      .range(from, from + 999);
    if (error || !data?.length) break;
    responses.push(...(data as typeof responses));
    if (data.length < 1000) break;
  }

  const people: Person[] = (profiles ?? []).map((p) => {
    const mine = responses.filter((r) => r.user_id === p.id);
    return {
      id: p.id,
      name: p.display_name ?? p.username ?? "Unnamed",
      username: p.username,
      avatarUrl: p.avatar_url,
      completedAt: p.completed_at,
      lastActive: mine.reduce((max, r) => (r.updated_at > max ? r.updated_at : max), p.last_seen_at ?? p.created_at),
      answers: Object.fromEntries(mine.map((r) => [r.question_id, r.value])),
    };
  });

  const form = await getPublishedForm();
  return <AdminDashboard people={people} form={form} meId={user.id} initialTab={tab} />;
}
