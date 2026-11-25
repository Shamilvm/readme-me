import { cardQuestion, optionLabel, type Answer, type CardRole, type FormDoc } from "@/lib/form";

/** A profile-style summary built from the questions tagged for the card. */
export function ReadmeCard({
  form,
  name,
  avatarUrl,
  answers,
}: {
  form: FormDoc;
  name: string;
  avatarUrl?: string | null;
  answers: Record<string, Answer>;
}) {
  const get = (role: CardRole) => {
    const q = cardQuestion(form, role);
    const a = q ? answers[q.id] : undefined;
    return q && a && !a.skipped ? { q, a } : undefined;
  };
  const list = (role: CardRole) =>
    Object.values(get(role)?.a.fields ?? {})
      .map((v) => v?.trim())
      .filter(Boolean) as string[];
  const label = (role: CardRole) => {
    const g = get(role);
    if (!g) return undefined;
    if (g.a.choice) return optionLabel(g.q, g.a.choice);
    return g.a.text?.trim() || undefined;
  };

  const words = list("words");
  const enjoy = list("enjoy");
  const dream = get("dream")?.a.text?.trim();
  const ex = get("explore");
  const explore = (ex?.a.choices ?? []).filter((c) => !ex?.q.options?.find((o) => o.id === c)?.other).map((c) => optionLabel(ex!.q, c));
  const languages = get("languages")?.a.text?.trim();
  const device = [label("device"), label("os")].filter(Boolean).join(" · ");
  const linkEntries = Object.entries(get("links")?.a.fields ?? {}).filter(([, v]) => v?.trim());

  return (
    <article className="ink overflow-hidden rounded-3xl bg-panel text-left">
      <div className="flex items-center justify-between bg-ink px-5 py-2.5 text-bg">
        <span className="label">README.md</span>
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-lime" />
          <span className="size-2.5 rounded-full border border-bg" />
          <span className="size-2.5 rounded-full border border-bg" />
        </span>
      </div>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="ink size-14 rounded-full" />
          ) : (
            <div className="display grid size-14 place-items-center rounded-full bg-lime text-2xl text-[#161616]">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="display text-3xl uppercase">Hi, I&apos;m {name}</h3>
            {words.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {words.map((w) => (
                  <span key={w} className="ink rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {enjoy.length > 0 && (
          <Section title="Things I enjoy">
            <ol className="space-y-1">
              {enjoy.map((e, i) => (
                <li key={e} className="flex gap-2">
                  <span className="font-bold">{i + 1}.</span>
                  {e}
                </li>
              ))}
            </ol>
          </Section>
        )}
        {dream && (
          <Section title="Biggest dream">
            <p className="line-clamp-4">{dream}</p>
          </Section>
        )}
        {(explore.length > 0 || languages) && (
          <Section title="Want to explore">
            <div className="flex flex-wrap gap-1.5">
              {explore.map((e) => (
                <span key={e} className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-bg">
                  {e}
                </span>
              ))}
            </div>
            {languages && <p className="mt-2 text-sm text-muted">Languages: {languages}</p>}
          </Section>
        )}
        {device && (
          <Section title="Setup">
            <p>{device}</p>
          </Section>
        )}
        {linkEntries.length > 0 && (
          <Section title="Links">
            <ul className="space-y-1 text-sm">
              {linkEntries.map(([k, v]) => (
                <li key={k} className="truncate">
                  <span className="label mr-2 text-muted">{k}</span>
                  <a
                    className="font-semibold underline decoration-lime decoration-2 underline-offset-4"
                    href={/^https?:\/\//.test(v) ? v : `https://${v}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {v}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="label mb-2">
        <span className="mark-lime">{title}</span>
      </h4>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}
