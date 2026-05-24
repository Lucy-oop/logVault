import Link from "next/link";
import { slugify } from "@/lib/utils";

export function AuthorBio({
  authorName,
  publishedAt,
}: {
  authorName: string;
  publishedAt?: string | null;
}) {
  const initial = authorName.charAt(0).toUpperCase();
  const handle = slugify(authorName);
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <section className="mt-12 rounded-3xl border border-token bg-surface p-6 shadow-card">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/u/${handle}`}
          className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--primary)] text-lg font-bold text-white transition-transform hover:-rotate-3 hover:scale-105"
        >
          {initial}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Written by
          </p>
          <Link
            href={`/u/${handle}`}
            className="font-display text-fluid-lg font-bold leading-tight hover:text-[color:var(--primary)]"
          >
            {authorName}
          </Link>
          {date && (
            <p className="text-xs text-muted">Published on {date}</p>
          )}
        </div>
        <Link
          href={`/u/${handle}`}
          className="inline-flex h-10 items-center rounded-full border border-token px-4 text-sm font-medium text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--text)]"
        >
          More by {authorName.split(" ")[0]} →
        </Link>
      </div>
    </section>
  );
}
