import Link from "next/link";
import { estimateReadMinutes, formatCount } from "@/lib/utils";
import type { PostListItem } from "@/types/api";

type Size = "regular" | "large" | "small";

export function PostCard({ post, size = "regular" }: { post: PostListItem; size?: Size }) {
  const minutes = estimateReadMinutes(post.wordCount);
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const titleClass =
    size === "large"
      ? "text-fluid-2xl"
      : size === "small"
      ? "text-fluid-base"
      : "text-fluid-lg";

  const imageAspect = size === "small" ? "aspect-[16/10]" : "aspect-[16/9]";

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col gap-4 transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      <div className={`relative overflow-hidden rounded-2xl bg-[color:var(--surface-2)] shadow-card transition-shadow duration-300 group-hover:shadow-soft-lg ${imageAspect}`}>
        {post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      <div className="px-1">
        <h3 className={`font-display ${titleClass} font-bold leading-snug tracking-tight transition-colors duration-300 group-hover:text-[color:var(--primary)]`}>
          {post.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {date && <span>{date}</span>}
          {date && <span aria-hidden>·</span>}
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
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {minutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}
