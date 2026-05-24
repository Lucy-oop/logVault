"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EditArticleModal } from "@/components/EditArticleModal";
import { EmptyState } from "@/components/EmptyState";
import { estimateReadMinutes, formatCount, cn } from "@/lib/utils";
import type { CreatePostRequest, PagedResult, PostDetail, PostListItem } from "@/types/api";

type SortMode = "recent" | "viewed" | "reacted";

export default function AdminPostsPage() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState<PostListItem[] | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const [filter, setFilter] = useState<SortMode>("recent");
  const [statusFilter, setStatusFilter] = useState<"all" | "drafts" | "published">("all");
  const [query, setQuery] = useState("");

  const [modal, setModal] = useState<{ open: boolean; mode: "new" | "edit"; post: PostDetail | null }>({
    open: false,
    mode: "new",
    post: null,
  });
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBootstrapped(true), 100);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (bootstrapped && !token) router.replace("/login");
  }, [bootstrapped, token, router]);

  async function loadPosts() {
    if (!token) return;
    try {
      const res = await api<PagedResult<PostListItem>>("/api/posts?mine=true&pageSize=200", { token });
      setPosts(res.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load posts");
    }
  }

  useEffect(() => { loadPosts(); }, [token]);

  useEffect(() => {
    if (!token) return;
    if (searchParams.get("new") === "1") {
      setModal({ open: true, mode: "new", post: null });
      return;
    }
    const editSlug = searchParams.get("edit");
    if (editSlug) {
      (async () => {
        try {
          const full = await api<PostDetail>(`/api/posts/${encodeURIComponent(editSlug)}`, { token });
          setModal({ open: true, mode: "edit", post: full });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to open post");
        }
      })();
    }
  }, [token, searchParams]);

  async function openEdit(item: PostListItem) {
    if (!token) return;
    setModalError(null);
    try {
      const full = await api<PostDetail>(`/api/posts/${encodeURIComponent(item.slug)}`, { token });
      setModal({ open: true, mode: "edit", post: full });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open post");
    }
  }

  async function deletePost(item: PostListItem) {
    if (!token) return;
    const ok = await toast.confirm(`Delete "${item.title}"?`);
    if (!ok) return;
    try {
      await api(`/api/posts/${item.id}`, { method: "DELETE", token });
      toast.success("Post deleted.");
      await loadPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleSubmit(data: CreatePostRequest) {
    if (!token) return;
    setBusy(true); setModalError(null);
    const isDraft = data.status === "Pending";
    const wasDraft = modal.post?.status === "Pending";
    try {
      if (modal.mode === "new") {
        await api<PostDetail>("/api/posts", { method: "POST", body: JSON.stringify(data), token });
        toast.success(isDraft ? "Draft saved." : "Post published.");
      } else if (modal.post) {
        await api<PostDetail>(`/api/posts/${modal.post.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
          token,
        });
        toast.success(
          wasDraft && !isDraft
            ? "Draft published."
            : isDraft
            ? "Draft saved."
            : "Changes saved."
        );
      }
      setModal({ open: false, mode: "new", post: null });
      await loadPosts();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to save");
    } finally { setBusy(false); }
  }

  const stats = useMemo(() => {
    const p = posts ?? [];
    return {
      posts: p.length,
      drafts: p.filter((x) => x.status === "Pending").length,
      views: p.reduce((a, b) => a + b.viewCount, 0),
      reactions: p.reduce((a, b) => a + b.reactionCount, 0),
      comments: p.reduce((a, b) => a + b.commentCount, 0),
    };
  }, [posts]);

  const visible = useMemo(() => {
    if (!posts) return [];
    let list = posts;
    if (statusFilter === "drafts") list = list.filter((p) => p.status === "Pending");
    else if (statusFilter === "published") list = list.filter((p) => p.status === "Published");
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q));
    const sorted = [...list];
    if (filter === "viewed") sorted.sort((a, b) => b.viewCount - a.viewCount);
    else if (filter === "reacted") sorted.sort((a, b) => b.reactionCount - a.reactionCount);
    else sorted.sort((a, b) => +new Date(b.publishedAt ?? b.updatedAt) - +new Date(a.publishedAt ?? a.updatedAt));
    return sorted;
  }, [posts, query, filter, statusFilter]);

  if (!token) return <p className="text-muted">Redirecting…</p>;

  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
          </p>
          <h1 className="mt-1 font-display text-fluid-4xl font-bold tracking-tight">Your posts</h1>
        </div>
        <Button onClick={() => { setModalError(null); setModal({ open: true, mode: "new", post: null }); }}>
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New post
        </Button>
      </header>

      {/* Stats bar */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Posts" value={stats.posts} accent />
        <Stat label="Readers" value={stats.views} icon="eye" />
        <Stat label="Reactions" value={stats.reactions} icon="heart" />
        <Stat label="Comments" value={stats.comments} icon="comment" />
      </section>

      {/* Filter pills + local search */}
      {posts && posts.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Pill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            All ({posts.length})
          </Pill>
          <Pill active={statusFilter === "published"} onClick={() => setStatusFilter("published")}>
            Published ({posts.length - stats.drafts})
          </Pill>
          <Pill active={statusFilter === "drafts"} onClick={() => setStatusFilter("drafts")}>
            Drafts ({stats.drafts})
          </Pill>
          <span className="mx-1 hidden h-5 w-px bg-[color:var(--border)] sm:block" />
          <Pill active={filter === "recent"} onClick={() => setFilter("recent")}>Recent</Pill>
          <Pill active={filter === "viewed"} onClick={() => setFilter("viewed")}>Most viewed</Pill>
          <Pill active={filter === "reacted"} onClick={() => setFilter("reacted")}>Most reacted</Pill>
          <div className="relative ml-auto w-full max-w-xs sm:w-auto">
            <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter your posts…"
              className="focus-quiet h-9 w-full rounded-full border border-token bg-surface pl-9 pr-3 text-sm outline-none"
            />
          </div>
        </div>
      )}

      {!posts && (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="rounded-2xl border border-token bg-surface p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </li>
          ))}
        </ul>
      )}

      {posts && posts.length === 0 && (
        <EmptyState
          icon="write"
          title="No posts yet"
          body="Publish your first article. It'll appear here and on the home page right away."
          action={{
            label: "Write your first post",
            onClick: () => { setModalError(null); setModal({ open: true, mode: "new", post: null }); },
          }}
        />
      )}

      {posts && posts.length > 0 && visible.length === 0 && (
        <EmptyState icon="noresults" title="No matches" body={`Nothing matches "${query}". Try a different filter.`} />
      )}

      {visible.length > 0 && (
        <ul className="space-y-3">
          {visible.map((p) => {
            const isDraft = p.status === "Pending";
            return (
            <li
              key={p.id}
              className={cn(
                "group flex items-center justify-between gap-4 rounded-2xl border bg-surface p-5 transition-all duration-200 hover:border-[color:var(--text)]",
                isDraft ? "border-dashed border-[color:var(--primary)]/40" : "border-token"
              )}
            >
              <button onClick={() => openEdit(p)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                  {isDraft && (
                    <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--primary)]">
                      Draft
                    </span>
                  )}
                  <span className="truncate font-display text-fluid-lg font-semibold transition-colors group-hover:text-[color:var(--primary)]">
                    {p.title}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span>⏱️ {estimateReadMinutes(p.wordCount)} min</span>
                  {!isDraft && <span>👁 {formatCount(p.viewCount)}</span>}
                  {!isDraft && <span>❤️ {formatCount(p.reactionCount)}</span>}
                  {!isDraft && <span>💬 {formatCount(p.commentCount)}</span>}
                  {p.publishedAt && (
                    <span>{new Date(p.publishedAt).toLocaleDateString()}</span>
                  )}
                  {isDraft && (
                    <span className="italic text-muted/80">Not yet published</span>
                  )}
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-1 text-sm">
                {!isDraft && (
                  <Link
                    href={`/posts/${p.slug}`}
                    className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]"
                  >
                    View
                  </Link>
                )}
                <button
                  onClick={() => openEdit(p)}
                  className="rounded-full px-3 py-1.5 font-medium text-[color:var(--primary)] transition-colors hover:bg-[color:var(--primary)]/10"
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePost(p)}
                  className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-[color:var(--alarm)]/10 hover:text-[color:var(--alarm)]"
                >
                  Delete
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      <EditArticleModal
        open={modal.open}
        mode={modal.mode}
        initial={modal.post}
        busy={busy}
        error={modalError}
        onClose={() => setModal({ open: false, mode: "new", post: null })}
        onSubmit={handleSubmit}
      />
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
    <div className="rounded-2xl border border-token bg-surface p-4">
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
      <p className={cn("mt-2 font-display text-fluid-2xl font-bold", accent && "text-[color:var(--primary)]")}>
        {formatCount(value)}
      </p>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-all",
        active
          ? "bg-[color:var(--primary)] text-white shadow-soft"
          : "border border-token text-[color:var(--text)] hover:border-[color:var(--text)]"
      )}
    >
      {children}
    </button>
  );
}
