import Link from "next/link";
import { api } from "@/lib/api";
import { BentoGrid } from "@/components/BentoGrid";
import { EmptyState } from "@/components/EmptyState";
import { RelatedPosts } from "@/components/RelatedPosts";
import type { PagedResult, PostListItem, TagResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export default async function TagPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug).toLowerCase();

  let posts: PagedResult<PostListItem> | null = null;
  let tagMeta: TagResponse | null = null;

  try {
    const [postsRes, tags] = await Promise.all([
      api<PagedResult<PostListItem>>(`/api/posts?tag=${encodeURIComponent(slug)}&pageSize=24`),
      api<TagResponse[]>("/api/tags"),
    ]);
    posts = postsRes;
    tagMeta = tags.find((t) => t.slug === slug) ?? null;
  } catch { /* swallow */ }

  const tagName = tagMeta?.name ?? slug;
  const items = posts?.items ?? [];

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-token bg-surface px-8 py-10 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Tag</p>
        <h1 className="mt-2 font-display text-fluid-5xl font-bold tracking-tight">
          <span className="text-[color:var(--primary)]">#</span>{tagName}
        </h1>
        <p className="mt-3 text-fluid-base text-muted">
          {posts ? (
            <>
              {posts.totalCount} {posts.totalCount === 1 ? "post" : "posts"} tagged{" "}
              <span className="font-medium text-[color:var(--text)]">{tagName}</span>.
            </>
          ) : (
            "Loading posts in this tag…"
          )}
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-full border border-token px-4 text-xs font-medium uppercase tracking-[0.16em] text-muted transition-colors hover:border-[color:var(--text)] hover:text-[color:var(--text)]"
          >
            ← All posts
          </Link>
        </div>
      </header>

      {items.length === 0 && (
        <EmptyState
          icon="noresults"
          title="No posts yet"
          body={`Nothing tagged #${tagName} has been published yet.`}
          action={{ label: "Browse all posts", href: "/" }}
        />
      )}

      {items.length > 0 && (
        <BentoGrid items={items} heroBadge={`Top in #${tagName}`} />
      )}

      {items.length > 0 && (
        <RelatedPosts
          endpoint={`/api/tags/${encodeURIComponent(slug)}/related`}
          heading="You might also like"
          subtitle="From adjacent tags"
        />
      )}
    </div>
  );
}
