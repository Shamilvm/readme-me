"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorScreen, secondaryActionClass } from "@/components/ErrorScreen";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      code="500"
      zeros={[{ name: "bit", mood: "wow" }, { name: "laptop", mood: "wow" }]}
      eyebrow="Something broke"
      title={
        <>
          Well, that&apos;s a <span className="mark-lime">bug.</span>
        </>
      }
      body="Something went wrong on our side. Your saved answers are safe. Try again, and if it keeps happening, tell the team lead."
      terminal={{
        cmd: "npm run readme",
        out: error.digest ? `Error: unexpected crash (ref ${error.digest})` : "Error: unexpected crash",
      }}
      actions={
        <>
          <button type="button" onClick={reset} className="ink-hover inline-flex items-center gap-3 rounded-full bg-ink py-2.5 pl-7 pr-2.5 text-bg">
            <span className="label text-[13px]">Try again</span>
            <span className="grid size-10 place-items-center rounded-full bg-lime font-bold text-[#161616]">↻</span>
          </button>
          <Link href="/" className={secondaryActionClass}>
            Back home
          </Link>
        </>
      }
    />
  );
}
