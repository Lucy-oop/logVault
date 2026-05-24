"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn, estimateReadMinutes, formatCount } from "@/lib/utils";
import type { PostListItem } from "@/types/api";

const DWELL_MS = 4000;

export function HeroCarousel({
  posts,
  badge = "Trending now",
}: {
  posts: PostListItem[];
  badge?: string;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    function onChange() { setReducedMotion(mq.matches); }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || posts.length < 2) return;
    const id = window.setInterval(() => {
      setCurrent((c) => (c + 1) % posts.length);
    }, DWELL_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, posts.length]);

  function go(i: number) {
    if (posts.length === 0) return;
    const next = ((i % posts.length) + posts.length) % posts.length;
    setCurrent(next);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") { go(current + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { go(current - 1); e.preventDefault(); }
  }

  if (posts.length === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Trending posts"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative block h-[420px] overflow-hidden rounded-3xl border border-token bg-[color:var(--surface-2)] shadow-card sm:h-[460px] lg:h-full",
        (paused || posts.length < 2) && "carousel-paused"
      )}
    >
      {posts.map((post, i) => (
        <Slide
          key={post.id}
          post={post}
          badge={badge}
          active={i === current}
          reducedMotion={reducedMotion}
          slideLabel={`${i + 1} of ${posts.length}`}
          isFirst={i === 0}
        />
      ))}

      {/* Bottom-bar controls */}
      <div className="pointer-events-none absolute inset-x-6 bottom-5 z-10 flex items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Choose a trending post"
          className="pointer-events-auto flex items-center gap-1.5"
        >
          {posts.map((p, i) => {
            const isActive = i === current;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show post ${i + 1} of ${posts.length}: ${p.title}`}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 rounded-full bg-white",
                  isActive
                    ? "opacity-100 dot-grow"
                    : "w-3 opacity-50 transition-opacity duration-300 hover:opacity-90"
                )}
              />
            );
          })}
        </div>
        {paused && posts.length > 1 && !reducedMotion && (
          <span
            aria-hidden
            className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur"
          >
            Paused
          </span>
        )}
      </div>
    </div>
  );
}

function Slide({
  post,
  badge,
  active,
  reducedMotion,
  slideLabel,
  isFirst,
}: {
  post: PostListItem;
  badge: string;
  active: boolean;
  reducedMotion: boolean;
  slideLabel: string;
  isFirst: boolean;
}) {
  const minutes = estimateReadMinutes(post.wordCount);
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/posts/${post.slug}`}
      aria-hidden={!active}
      tabIndex={active ? 0 : -1}
      aria-label={`${slideLabel}: ${post.title}`}
      className={cn(
        "absolute inset-0 block",
        reducedMotion ? "" : "transition-opacity duration-700 ease-out",
        active ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      {post.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImageUrl}
          alt=""
          loading={isFirst ? "eager" : "lazy"}
          // @ts-expect-error: fetchpriority is a valid HTML attribute, types lag
          fetchpriority={isFirst ? "high" : undefined}
          className="absolute inset-0 h-full w-full object-cover"
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

      <span className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)] shadow-sm">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
          <path d="M12 2 14.4 8.4 21 9l-5 4.6L17.2 21 12 17.7 6.8 21 8 13.6 3 9l6.6-.6L12 2Z" />
        </svg>
        {badge}
      </span>

      <div className="absolute inset-x-6 bottom-16 text-white">
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
          {date && (<><span aria-hidden>·</span><span>{date}</span></>)}
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
