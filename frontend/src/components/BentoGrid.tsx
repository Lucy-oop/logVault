import Link from "next/link";
import { estimateReadMinutes, formatCount, timeAgo } from "@/lib/utils";
import type { PostListItem } from "@/types/api";

type Props = {
  items: PostListItem[];
  heroBadge?: string;
  /**
   * Optional custom hero. When given, it replaces the default first-tile hero
   * and `items` is treated as the small-tile list (no item taken for the hero).
   */
  heroSlot?: React.ReactNode;
  /**
   * When true, the hero spans the full 6-col width (instead of the default
   * 4 cols with 2 stacked tiles to its right). Use this when tile count
   * is a multiple of 3 so the rows underneath stay clean.
   */
  heroFullWidth?: boolean;
};

export function BentoGrid({ items, heroBadge = "Featured", heroSlot, heroFullWidth = false }: Props) {
  if (items.length === 0 && !heroSlot) return null;

  const heroClass = heroFullWidth
    ? "sm:col-span-2 lg:col-span-6 lg:row-span-2"
    : "sm:col-span-2 lg:col-span-4 lg:row-span-2";

  // The top section (hero + right-stacked tiles) fills rows 1–2.
  // Below that, tiles flow 3-per-row on lg. If the last row would have
  // 1 or 2 tiles (ragged), make them wider so the row is clean.
  //   heroSlot + heroFullWidth → offset 0 (no right-stack)
  //   heroSlot (4-col hero)    → offset 2 (2 right-stacked tiles)
  //   no heroSlot              → offset 3 (1 hero + 2 right-stacked)
  const offsetForBelow = heroSlot ? (heroFullWidth ? 0 : 2) : 3;
  const tilesBelow = Math.max(0, items.length - offsetForBelow);
  const leftover = tilesBelow % 3;
  const widenFromIndex = leftover > 0 ? offsetForBelow + tilesBelow - leftover : -1;

  function tileSpan(i: number): string {
    if (widenFromIndex < 0 || i < widenFromIndex) return "lg:col-span-2";
    return leftover === 1 ? "lg:col-span-6" : "lg:col-span-3";
  }

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:auto-rows-[260px]">
      {heroSlot && (
        <div className={heroClass}>
          {heroSlot}
        </div>
      )}
      {items.map((post, i) => {
        const isHero = !heroSlot && i === 0;
        return (
          <BentoTile
            key={post.id}
            post={post}
            variant={isHero ? "hero" : "tile"}
            badge={isHero ? heroBadge : undefined}
            className={isHero ? heroClass : tileSpan(i)}
          />
        );
      })}
    </section>
  );
}

function BentoTile({
  post,
  variant,
  badge,
  className,
}: {
  post: PostListItem;
  variant: "hero" | "tile";
  badge?: string;
  className?: string;
}) {
  const minutes = estimateReadMinutes(post.wordCount);
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (variant === "hero") {
    return (
      <Link
        href={`/posts/${post.slug}`}
        className={`group relative block h-[420px] overflow-hidden rounded-3xl border border-token bg-[color:var(--surface-2)] shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg active:scale-[0.99] sm:h-[460px] lg:h-full ${className ?? ""}`}
      >
        {post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt=""
            loading="eager"
            // @ts-expect-error: fetchpriority is a valid HTML attribute, types lag
            fetchpriority="high"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted/40">
            <svg viewBox="0 0 24 24" fill="none" className="h-24 w-24" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />

        {badge && (
          <span className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)] shadow-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
              <path d="M12 2 14.4 8.4 21 9l-5 4.6L17.2 21 12 17.7 6.8 21 8 13.6 3 9l6.6-.6L12 2Z" />
            </svg>
            {badge}
          </span>
        )}

        <div className="absolute inset-x-6 bottom-6 text-white">
          {post.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
          <h2 className="font-display text-fluid-3xl font-bold leading-tight tracking-tight transition-colors duration-300 group-hover:text-[color:var(--accent)] lg:text-fluid-4xl">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/85 lg:text-base">
              {post.excerpt}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
            <span className="font-medium text-white">{post.authorName}</span>
            {date && (
              <>
                <span aria-hidden>·</span>
                <span>{date}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{minutes} min read</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
              </svg>
              {formatCount(post.reactionCount)}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
              </svg>
              {formatCount(post.commentCount)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-token bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg active:scale-[0.985] ${className ?? ""}`}
    >
      <div className="relative h-[140px] overflow-hidden bg-[color:var(--surface-2)]">
        {post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted/40">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        <h3 className="line-clamp-2 font-display text-base font-bold leading-snug tracking-tight transition-colors duration-300 group-hover:text-[color:var(--primary)]">
          {post.title}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
          <span className="font-medium text-[color:var(--text)]">{post.authorName}</span>
          {post.publishedAt && (
            <>
              <span aria-hidden>·</span>
              <span title={new Date(post.publishedAt).toLocaleString()}>
                {timeAgo(post.publishedAt)}
              </span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{minutes} min</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-0.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
              <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
            </svg>
            {formatCount(post.reactionCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}
