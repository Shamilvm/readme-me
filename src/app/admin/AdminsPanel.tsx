"use client";

import { useEffect, useState } from "react";
import { listPeopleWithRoles, setAdmin, type AdminRow } from "@/lib/store";

export function AdminsPanel({ meId, demo }: { meId: string; demo?: boolean }) {
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    listPeopleWithRoles()
      .then(setRows)
      .catch((e) => setError(e?.message ?? "Couldn't load people."));
  }, []);

  async function toggle(r: AdminRow) {
    setBusy(r.id);
    setError(null);
    try {
      await setAdmin(r.id, !r.isAdmin);
      setRows((prev) => prev?.map((x) => (x.id === r.id ? { ...x, isAdmin: !r.isAdmin } : x)) ?? null);
    } catch (e) {
      setError((e as Error)?.message ?? "Couldn't change that.");
    } finally {
      setBusy(null);
    }
  }

  const shown = (rows ?? []).filter((r) =>
    `${r.name} ${r.username ?? ""}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-2xl">
      <h2 className="display text-4xl uppercase">
        <span className="mark-lime">Admins</span>
      </h2>
      <p className="mt-4 text-muted">
        Admins can read everyone&apos;s answers and edit the questions. People appear here after they sign in once.
      </p>
      {demo && (
        <p className="mt-4 rounded-2xl bg-panel-2 p-4 text-sm">
          In demo mode there&apos;s no sign-in, so there&apos;s only you. Connect Supabase to manage admins.
        </p>
      )}

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search by name or Discord username…"
        className="mt-8 w-full border-b-2 border-edge bg-transparent py-2 text-lg outline-none focus-visible:outline-none"
      />
      {error && <p className="mt-4 text-sm text-pink">{error}</p>}

      <ul className="mt-6 space-y-2">
        {rows === null && <li className="label text-muted">Loading…</li>}
        {shown.map((r) => (
          <li key={r.id} className="ink flex items-center gap-3 rounded-full bg-panel py-2 pl-2 pr-2">
            {r.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.avatarUrl} alt="" className="ink size-9 rounded-full" />
            ) : (
              <span className="grid size-9 place-items-center rounded-full bg-lime text-sm font-bold text-[#161616]">
                {r.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {r.name} {r.id === meId && <span className="text-muted">(you)</span>}
              </p>
              {r.username && <p className="truncate text-xs text-muted">@{r.username}</p>}
            </div>
            <button
              onClick={() => toggle(r)}
              disabled={busy === r.id || r.id === meId || demo}
              title={r.id === meId ? "You can't remove yourself" : undefined}
              className={`label ml-auto rounded-full px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                r.isAdmin ? "bg-ink text-bg" : "ink hover:bg-accent-soft"
              }`}
            >
              {busy === r.id ? "…" : r.isAdmin ? "Admin ✓" : "Make admin"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
