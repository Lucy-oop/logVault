import Link from "next/link";
import { api } from "@/lib/api";
import type { PagedResult, PostListItem, TagResponse } from "@/types/api";
import { BentoGrid } from "@/components/BentoGrid";
import { HeroCarousel } from "@/components/HeroCarousel";
import { EmptyState } from "@/components/EmptyState";
import { HomeIntro } from "@/components/HomeIntro";

export const dynamic = "force-dynamic";

// 9 visible slots per page (1 hero + 2 right + 6 below). On page 1, the hero
// slot is the carousel cycling through 3 posts, so we fetch 11 total
// (3 carousel + 8 small tiles).
const PAGE_SIZE = 11;
const CAROUSEL_SIZE = 3;

type SortKey = "trending" | "newest" | "loved";

function parseSort(raw: string | undefined): SortKey {
  if (raw === "newest" || raw === "loved" || raw === "trending") return raw;
  return "trending";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { tag?: string; search?: string; page?: string; sort?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const sort = parseSort(searchParams.sort);
  const params = new URLSearchParams();
  if (searchParams.tag) params.set("tag", searchParams.tag);
  if (searchParams.search) params.set("search", searchParams.search);
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  if (!searchParams.search && !searchParams.tag) {
    params.set("sort", sort === "trending" ? "popular" : sort);
  }

  let posts: PagedResult<PostListItem> | null = null;
  let tags: TagResponse[] = [];
  let errorMsg: string | null = null;
  try {
    const [postsRes, tagsRes] = await Promise.all([
      api<PagedResult<PostListItem>>(`/api/posts?${params.toString()}`),
      api<TagResponse[]>("/api/tags"),
    ]);
    posts = postsRes;
    tags = tagsRes;
  } catch {
    errorMsg = "Could not reach the API. Make sure the backend is running on http://localhost:5046.";
  }

  const activeFilter = Boolean(searchParams.search || searchParams.tag);
  const items = posts?.items ?? [];
  const totalCount = posts?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const heroBadge = activeFilter
    ? searchParams.search
      ? "Top match"
      : `Top in #${searchParams.tag}`
    : page > 1
    ? "More stories"
    : sort === "newest"
    ? "Just published"
    : sort === "loved"
    ? "Most loved"
    : "Trending now";

  return (
    <div className="space-y-12">
      {activeFilter && (
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {searchParams.search ? "Search results" : "Filtered"}
          </p>
          <h1 className="font-display text-fluid-4xl font-bold tracking-tight">
            {searchParams.search && <>&ldquo;{searchParams.search}&rdquo;</>}
            {searchParams.tag && <>#{searchParams.tag}</>}
          </h1>
          <p>
            <Link href="/" className="text-sm font-medium text-[color:var(--primary)] hover:underline">
              ← Back to home
            </Link>
          </p>
        </header>
      )}

      {!activeFilter && page === 1 && <HomeIntro currentSort={sort} tags={tags} />}

      {errorMsg && (
        <p className="rounded-2xl border border-token bg-surface p-6 text-muted">{errorMsg}</p>
      )}

      {posts && items.length === 0 && (
        activeFilter ? (
          <EmptyState
            icon="noresults"
            title="No matches"
            body={
              searchParams.search
                ? `Nothing matches "${searchParams.search}". Try a different keyword.`
                : `No posts tagged #${searchParams.tag} yet.`
            }
            action={{ label: "Back to home", href: "/" }}
          />
        ) : (
          <EmptyState
            icon="write"
            title="Nothing here yet"
            body="Be the first to publish a post on LogVault."
            action={{ label: "Sign in to write", href: "/login" }}
          />
        )
      )}

      {items.length > 0 && (
        !activeFilter && page === 1 && items.length > CAROUSEL_SIZE ? (
          <BentoGrid
            items={items.slice(CAROUSEL_SIZE)}
            heroSlot={
              <HeroCarousel
                posts={items.slice(0, CAROUSEL_SIZE)}
                badge={heroBadge}
              />
            }
          />
        ) : (
          <BentoGrid items={items} heroBadge={heroBadge} />
        )
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          buildHref={(p) => {
            const next = new URLSearchParams();
            if (searchParams.tag) next.set("tag", searchParams.tag);
            if (searchParams.search) next.set("search", searchParams.search);
            if (sort !== "trending") next.set("sort", sort);
            if (p > 1) next.set("page", String(p));
            const q = next.toString();
            return q ? `/?${q}` : "/";
          }}
        />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  const pageNums = pageWindow(page, totalPages);
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 border-t border-token pt-8"
    >
      <PageLink
        href={buildHref(Math.max(1, page - 1))}
        disabled={page === 1}
        ariaLabel="Previous page"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </PageLink>
      {pageNums.map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-muted">
            …
          </span>
        ) : (
          <PageLink
            key={n}
            href={buildHref(n)}
            active={n === page}
          >
            {n}
          </PageLink>
        )
      )}
      <PageLink
        href={buildHref(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        ariaLabel="Next page"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const cls = `grid h-9 min-w-9 place-items-center rounded-full px-3 text-sm font-medium transition-colors ${
    active
      ? "bg-[color:var(--primary)] text-white"
      : disabled
      ? "cursor-not-allowed text-muted/40"
      : "text-[color:var(--text)] hover:bg-[color:var(--surface-2)]"
  }`;
  if (disabled) {
    return (
      <span aria-disabled className={cls}>
        {children}
      </span>
    );
  }
  return (
    <Link aria-label={ariaLabel} aria-current={active ? "page" : undefined} href={href} className={cls}>
      {children}
    </Link>
  );
}

function pageWindow(page: number, total: number): (number | "…")[] {
  const window: (number | "…")[] = [];
  const push = (n: number | "…") => window.push(n);
  const limit = 7;
  if (total <= limit) {
    for (let i = 1; i <= total; i++) push(i);
    return window;
  }
  push(1);
  if (page > 3) push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) push(i);
  if (page < total - 2) push("…");
  push(total);
  return window;
}
