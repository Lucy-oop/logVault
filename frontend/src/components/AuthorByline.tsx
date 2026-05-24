import Link from "next/link";
import { slugify } from "@/lib/utils";

export function AuthorByline({
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
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={`/u/${handle}`}
      className="group inline-flex items-center gap-2.5 rounded-full text-sm text-[color:var(--text)] transition-colors hover:text-[color:var(--primary)]"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--primary)] text-xs font-bold text-white">
        {initial}
      </span>
      <span className="leading-tight">
        <span className="block font-semibold">{authorName}</span>
        {date && (
          <span className="block text-xs text-muted group-hover:text-[color:var(--primary)]/70">
            {date}
          </span>
        )}
      </span>
    </Link>
  );
}
