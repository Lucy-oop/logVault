import Link from "next/link";
import { estimateReadMinutes, formatCount } from "@/lib/utils";
import type { PostListItem } from "@/types/api";

export function HeroPost({ post }: { post: PostListItem }) {
  const minutes = estimateReadMinutes(post.wordCount);
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block overflow-hidden rounded-3xl border border-token bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
    >
      <div className="grid gap-0 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden bg-[color:var(--surface-2)]">
          {post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted">
              <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
          <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--bg)]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)] backdrop-blur">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
              <path d="M12 2 14.4 8.4 21 9l-5 4.6L17.2 21 12 17.7 6.8 21 8 13.6 3 9l6.6-.6L12 2Z" />
            </svg>
            Featured
          </span>
        </div>

        <div className="flex flex-col justify-center gap-4 p-7 sm:p-9 lg:p-12">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--primary)]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <h2 className="font-display text-fluid-3xl font-bold leading-tight tracking-tight transition-colors duration-300 group-hover:text-[color:var(--primary)] lg:text-fluid-4xl">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="line-clamp-3 text-fluid-base leading-relaxed text-muted">
              {post.excerpt}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="font-medium text-[color:var(--text)]">{post.authorName}</span>
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

          <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--primary)]">
            Read story
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
