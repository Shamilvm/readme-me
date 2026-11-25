import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({ variable: "--font-sans-face", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"] });
const display = Inter_Tight({ variable: "--font-display-face", subsets: ["latin"], weight: ["600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "README.me",
  description: "Every project has a README. This one's yours.",
};

export const viewport: Viewport = { themeColor: "#efeee9" };

// Applies a saved dark-mode choice before first paint, so there's no flash.
const themeScript = `try{if(localStorage.getItem("readme-me:theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sans.variable} ${mono.variable} ${display.variable} min-h-dvh`}>{children}</body>
    </html>
  );
}
