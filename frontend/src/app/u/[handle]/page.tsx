import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { BentoGrid } from "@/components/BentoGrid";
import { EmptyState } from "@/components/EmptyState";
import { formatCount } from "@/lib/utils";
import type { PostListItem } from "@/types/api";

export const dynamic = "force-dynamic";

type AuthorProfile = {
  id: string;
  displayName: string;
  handle: string;
  joinedAt: string;
  postCount: number;
  totalViews: number;
  totalReactions: number;
  totalComments: number;
  posts: PostListItem[];
};

async function fetchAuthor(handle: string): Promise<AuthorProfile | null> {
  try {
    return await api<AuthorProfile>(`/api/authors/${encodeURIComponent(handle)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export default async function AuthorPage({ params }: { params: { handle: string } }) {
  const author = await fetchAuthor(params.handle);
  if (!author) notFound();

  const joined = new Date(author.joinedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
  const initial = author.displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-token bg-surface px-8 py-10 shadow-card">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[color:var(--primary)] text-3xl font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Writer</p>
            <h1 className="mt-1 font-display text-fluid-4xl font-bold tracking-tight">{author.displayName}</h1>
            <p className="mt-1 text-sm text-muted">Joined {joined}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Posts" value={author.postCount} accent />
          <Stat label="Readers" value={author.totalViews} icon="eye" />
          <Stat label="Reactions" value={author.totalReactions} icon="heart" />
          <Stat label="Comments" value={author.totalComments} icon="comment" />
        </div>

        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-full border border-token px-4 text-xs font-medium uppercase tracking-[0.16em] text-muted transition-colors hover:border-[color:var(--text)] hover:text-[color:var(--text)]"
          >
            ← All posts
          </Link>
        </div>
      </header>

      {author.posts.length === 0 ? (
        <EmptyState
          icon="default"
          title="No published posts yet"
          body={`${author.displayName} hasn't published anything yet.`}
          action={{ label: "Browse all posts", href: "/" }}
        />
      ) : (
        <BentoGrid items={author.posts} heroBadge={`Top by ${author.displayName}`} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon?: "eye" | "heart" | "comment";
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-token bg-[color:var(--bg)] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {icon === "eye" && (
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
        {icon === "heart" && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
          </svg>
        )}
        {icon === "comment" && (
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
          </svg>
        )}
        {label}
      </p>
      <p className={`mt-2 font-display text-fluid-2xl font-bold ${accent ? "text-[color:var(--primary)]" : ""}`}>
        {formatCount(value)}
      </p>
    </div>
  );
}
