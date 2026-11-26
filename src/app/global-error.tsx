"use client";

import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { ErrorScreen } from "@/components/ErrorScreen";
import "./globals.css";

const sans = Inter({ variable: "--font-sans-face", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"] });
const display = Inter_Tight({ variable: "--font-display-face", subsets: ["latin"], weight: ["800"] });

// Only shown if the root layout itself crashes, so it brings its own <html>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${display.variable} min-h-dvh`}>
        <ErrorScreen
          code="500"
          zeros={[{ name: "bit", mood: "sleepy" }, { name: "keycap" }]}
          eyebrow="Something broke"
          title={
            <>
              Rebooting <span className="mark-lime">Bit.</span>
            </>
          }
          body="The whole app tripped over. Your saved answers are safe. Give it another go."
          terminal={{
            cmd: "npm start",
            out: error.digest ? `Error: app crashed (ref ${error.digest})` : "Error: app crashed",
          }}
          actions={
            <button type="button" onClick={reset} className="ink-hover inline-flex items-center gap-3 rounded-full bg-ink py-2.5 pl-7 pr-2.5 text-bg">
              <span className="label text-[13px]">Try again</span>
              <span className="grid size-10 place-items-center rounded-full bg-lime font-bold text-[#161616]">↻</span>
            </button>
          }
        />
      </body>
    </html>
  );
}
