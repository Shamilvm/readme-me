import Link from "next/link";
import { ErrorScreen, PrimaryAction, secondaryActionClass } from "@/components/ErrorScreen";

export const metadata = { title: "Page not found · README.me" };

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      zeros={[{ name: "telescope" }]}
      eyebrow="Page not found"
      title={
        <>
          Nothing <span className="mark-lime">here.</span>
        </>
      }
      body="We looked everywhere, telescope and all. This page doesn't exist, or it moved."
      terminal={{ cmd: "cat this-page.md", out: "cat: this-page.md: No such file or directory" }}
      actions={
        <>
          <PrimaryAction href="/">Back home</PrimaryAction>
          <Link href="/journey" className={secondaryActionClass}>
            My README
          </Link>
        </>
      }
    />
  );
}
