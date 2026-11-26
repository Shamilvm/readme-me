import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="display wiggle inline-flex items-baseline text-[22px] tracking-tight text-ink">
      README<span className="mark-lime ml-0.5 text-[18px]">.me</span>
    </Link>
  );
}
