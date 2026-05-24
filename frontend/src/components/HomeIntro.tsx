import Link from "next/link";
import type { TagResponse } from "@/types/api";

type SortKey = "trending" | "newest" | "loved";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "newest", label: "Newest" },
  { key: "loved", label: "Most loved" },
];

export function HomeIntro({
  currentSort,
  tags,
}: {
  currentSort: SortKey;
  tags: TagResponse[];
}) {
  const trendingTags = [...tags]
    .filter((t) => t.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--primary)]">
          LogVault
        </p>
        <h1 className="mt-2 font-display text-fluid-4xl font-bold tracking-tight">
          Stories from writers around the world.
        </h1>
        <p className="mt-2 max-w-2xl text-fluid-base text-muted">
          Anyone can publish. Anyone can read. Pick a feed below or follow a tag to find your next
          read.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Sort posts" className="flex items-center gap-1.5">
          {SORTS.map((s) => {
            const active = s.key === currentSort;
            const href = s.key === "trending" ? "/" : `/?sort=${s.key}`;
            return (
              <Link
                key={s.key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "inline-flex h-9 items-center rounded-full bg-[color:var(--primary)] px-4 text-sm font-medium text-white shadow-soft"
                    : "inline-flex h-9 items-center rounded-full border border-token px-4 text-sm font-medium text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--text)]"
                }
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {trendingTags.length > 0 && (
        <div className="-mx-2 overflow-x-auto px-2 pb-1">
          <ul className="flex items-center gap-2 whitespace-nowrap">
            <li className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Trending tags
            </li>
            {trendingTags.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tag/${t.slug}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-token bg-surface px-3 text-xs font-medium text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
                >
                  <span className="text-[color:var(--primary)]">#</span>
                  {t.name}
                  <span className="text-[10px] font-semibold text-muted">{t.postCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
