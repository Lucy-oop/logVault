"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn, formatCount, slugify } from "@/lib/utils";
import type { AdminPostItem, AdminReportItem, AdminStats, AdminUserItem } from "@/types/api";

export default function AdminUsersPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[] | null>(null);
  const [posts, setPosts] = useState<AdminPostItem[] | null>(null);
  const [reports, setReports] = useState<AdminReportItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [postQuery, setPostQuery] = useState("");
  const [postFilter, setPostFilter] = useState<"all" | "hidden">("all");
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBootstrapped(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Gate: must be logged in, must be admin
  useEffect(() => {
    if (!bootstrapped) return;
    if (!token) { router.replace("/login"); return; }
    if (user && user.role !== "Admin") { router.replace("/"); }
  }, [bootstrapped, token, user, router]);

  async function loadAll() {
    if (!token) return;
    try {
      const [s, u, p, r] = await Promise.all([
        api<AdminStats>("/api/admin/stats", { token }),
        api<AdminUserItem[]>("/api/admin/users", { token }),
        api<AdminPostItem[]>("/api/admin/posts", { token }),
        api<AdminReportItem[]>("/api/admin/reports", { token }),
      ]);
      setStats(s);
      setUsers(u);
      setPosts(p);
      setReports(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load admin data");
    }
  }

  async function reportAction(r: AdminReportItem, kind: "resolve" | "resolve-hide" | "dismiss") {
    if (!token) return;
    const messages: Record<typeof kind, string> = {
      resolve: `Mark this report as resolved (no action on the post)?`,
      "resolve-hide": `Hide "${r.postTitle}" and mark this report resolved?`,
      dismiss: `Dismiss this report? No action will be taken.`,
    };
    const ok = await toast.confirm(messages[kind]);
    if (!ok) return;

    try {
      if (kind === "dismiss") {
        await api(`/api/admin/reports/${r.id}/dismiss`, { method: "POST", token });
      } else {
        const url = kind === "resolve-hide"
          ? `/api/admin/reports/${r.id}/resolve?hide=true`
          : `/api/admin/reports/${r.id}/resolve`;
        await api(url, { method: "POST", token });
      }
      toast.success(kind === "dismiss" ? "Report dismissed." : "Report resolved.");
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  useEffect(() => { loadAll(); }, [token]);

  const visible = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  async function action(
    u: AdminUserItem,
    kind: "ban" | "unban" | "promote" | "demote"
  ) {
    if (!token) return;
    const confirms: Record<typeof kind, string> = {
      ban: `Ban ${u.displayName}? They won't be able to log in or post.`,
      unban: `Unban ${u.displayName}?`,
      promote: `Promote ${u.displayName} to Admin? They will be able to ban other users.`,
      demote: `Demote ${u.displayName} to Author?`,
    };
    const ok = await toast.confirm(confirms[kind]);
    if (!ok) return;

    try {
      await api(`/api/admin/users/${u.id}/${kind}`, { method: "POST", token });
      toast.success(`User ${kind}ned.`);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${kind}`);
    }
  }

  async function postAction(p: AdminPostItem, kind: "hide" | "restore") {
    if (!token) return;
    const ok = await toast.confirm(
      kind === "hide"
        ? `Hide "${p.title}"? It will be removed from public view but kept in the database.`
        : `Restore "${p.title}"? It will be published again.`
    );
    if (!ok) return;

    try {
      await api(`/api/admin/posts/${p.id}/${kind}`, { method: "POST", token });
      toast.success(kind === "hide" ? "Post hidden." : "Post restored.");
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${kind}`);
    }
  }

  const visiblePosts = useMemo(() => {
    if (!posts) return [];
    let list = posts;
    if (postFilter === "hidden") list = list.filter((p) => p.status === "Hidden");
    const q = postQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, postFilter, postQuery]);

  if (!token || (user && user.role !== "Admin")) {
    return <p className="text-muted">Redirecting…</p>;
  }

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">
          Admin
        </p>
        <h1 className="mt-1 font-display text-fluid-4xl font-bold tracking-tight">
          Command Center
        </h1>
        <p className="mt-2 text-muted">Site-wide statistics, user moderation, and account management.</p>
      </header>

      {/* Stats */}
      {stats ? (
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Users" value={stats.totalUsers} accent />
          <Stat label="Admins" value={stats.admins} />
          <Stat label="Banned" value={stats.bannedUsers} tone={stats.bannedUsers > 0 ? "alarm" : undefined} />
          <Stat label="Posts" value={stats.totalPosts} />
          {stats.openReports > 0 && (
            <Stat label="Open reports" value={stats.openReports} tone="alarm" />
          )}
          {stats.hiddenPosts > 0 && (
            <Stat label="Hidden posts" value={stats.hiddenPosts} tone="alarm" />
          )}
        </section>
      ) : (
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-token bg-surface p-4">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-3 h-6 w-2/3" />
            </div>
          ))}
        </section>
      )}

      {/* Reports moderation */}
      {reports && reports.length > 0 && (
        <section className="mb-8 overflow-hidden rounded-2xl border bg-surface" style={{ borderColor: "color-mix(in srgb, var(--alarm) 30%, var(--border))" }}>
          <header className="flex items-center gap-3 border-b border-token p-4">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[color:var(--alarm)]/10 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--alarm)]">
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 21V4h12l-2 4 2 4H4" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              {reports.length} open
            </span>
            <h2 className="font-display text-fluid-lg font-bold">Reports</h2>
          </header>

          <ul className="divide-y divide-[color:var(--border)]">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReasonBadge reason={r.reason} />
                    <span className="text-xs text-muted">
                      Reported by <span className="font-medium text-[color:var(--text)]">{r.reporterName}</span>
                    </span>
                    <span className="text-xs text-muted">· {new Date(r.createdAt).toLocaleString()}</span>
                    {r.postStatus === "Hidden" && (
                      <span className="rounded-full bg-[color:var(--alarm)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--alarm)]">
                        Already hidden
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/posts/${r.postSlug}`}
                    target="_blank"
                    className="mt-2 block truncate text-sm font-semibold hover:text-[color:var(--primary)]"
                  >
                    {r.postTitle}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    by{" "}
                    <Link
                      href={`/u/${slugify(r.postAuthorName)}`}
                      className="hover:text-[color:var(--primary)]"
                    >
                      {r.postAuthorName}
                    </Link>
                  </p>
                  {r.details && (
                    <p className="mt-2 rounded-xl border border-token bg-[color:var(--bg)] px-3 py-2 text-xs italic text-muted">
                      "{r.details}"
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:flex-col sm:items-stretch">
                  {r.postStatus !== "Hidden" && (
                    <Button variant="danger" size="sm" onClick={() => reportAction(r, "resolve-hide")}>
                      Hide post
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => reportAction(r, "resolve")}>
                    Resolve
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => reportAction(r, "dismiss")}>
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Users table */}
      <section className="overflow-hidden rounded-2xl border border-token bg-surface">
        <header className="flex flex-col gap-3 border-b border-token p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-fluid-lg font-bold">Users</h2>
          <div className="relative w-full max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="focus-quiet h-9 w-full rounded-full border border-token bg-[color:var(--bg)] pl-9 pr-3 text-sm outline-none"
            />
          </div>
        </header>

        {!users && (
          <ul className="divide-y divide-[color:var(--border)]">
            {[0, 1, 2].map((i) => (
              <li key={i} className="p-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-2 h-3 w-1/4" />
              </li>
            ))}
          </ul>
        )}

        {users && visible.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-muted">
            {query ? `No users match "${query}".` : "No users yet."}
          </p>
        )}

        {visible.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-token text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                <th className="px-4 py-3">User</th>
                <th className="hidden px-4 py-3 sm:table-cell">Activity</th>
                <th className="hidden px-4 py-3 lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {visible.map((u) => {
                const isMe = user?.id === u.id;
                return (
                  <tr key={u.id} className={cn(u.isBanned && "bg-[color:var(--alarm)]/5")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white",
                            u.isBanned
                              ? "bg-[color:var(--alarm)]"
                              : u.role === "Admin"
                              ? "bg-[color:var(--primary)]"
                              : "bg-[color:var(--text)]"
                          )}
                        >
                          {u.displayName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-sm font-medium">
                            {u.displayName}
                            {u.role === "Admin" && (
                              <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--primary)]">
                                Admin
                              </span>
                            )}
                            {u.isBanned && (
                              <span className="rounded-full bg-[color:var(--alarm)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--alarm)]">
                                Banned
                              </span>
                            )}
                            {isMe && (
                              <span className="rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                                You
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted sm:table-cell">
                      {formatCount(u.postCount)} {u.postCount === 1 ? "post" : "posts"} · {formatCount(u.commentCount)} {u.commentCount === 1 ? "comment" : "comments"}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted lg:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {!isMe && u.role !== "Admin" && !u.isBanned && (
                          <Button variant="danger" size="sm" onClick={() => action(u, "ban")}>
                            Ban
                          </Button>
                        )}
                        {!isMe && u.isBanned && (
                          <Button variant="primary" size="sm" onClick={() => action(u, "unban")}>
                            Unban
                          </Button>
                        )}
                        {!isMe && u.role === "Author" && !u.isBanned && (
                          <Button variant="outline" size="sm" onClick={() => action(u, "promote")}>
                            Promote
                          </Button>
                        )}
                        {!isMe && u.role === "Admin" && (
                          <Button variant="outline" size="sm" onClick={() => action(u, "demote")}>
                            Demote
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Posts moderation */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-token bg-surface">
        <header className="flex flex-col gap-3 border-b border-token p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-fluid-lg font-bold">Posts</h2>
            <div className="flex items-center gap-1 rounded-full border border-token p-1 text-xs">
              <button
                type="button"
                onClick={() => setPostFilter("all")}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors",
                  postFilter === "all"
                    ? "bg-[color:var(--primary)] text-white"
                    : "text-muted hover:text-[color:var(--text)]"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPostFilter("hidden")}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors",
                  postFilter === "hidden"
                    ? "bg-[color:var(--alarm)] text-white"
                    : "text-muted hover:text-[color:var(--text)]"
                )}
              >
                Hidden only
              </button>
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={postQuery}
              onChange={(e) => setPostQuery(e.target.value)}
              placeholder="Search by title or author…"
              className="focus-quiet h-9 w-full rounded-full border border-token bg-[color:var(--bg)] pl-9 pr-3 text-sm outline-none"
            />
          </div>
        </header>

        {!posts && (
          <ul className="divide-y divide-[color:var(--border)]">
            {[0, 1, 2].map((i) => (
              <li key={i} className="p-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="mt-2 h-3 w-1/4" />
              </li>
            ))}
          </ul>
        )}

        {posts && visiblePosts.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-muted">
            {postQuery
              ? `No posts match "${postQuery}".`
              : postFilter === "hidden"
              ? "No hidden posts."
              : "No posts yet."}
          </p>
        )}

        {visiblePosts.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-token text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                <th className="px-4 py-3">Post</th>
                <th className="hidden px-4 py-3 sm:table-cell">Stats</th>
                <th className="hidden px-4 py-3 lg:table-cell">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {visiblePosts.map((p) => {
                const isHidden = p.status === "Hidden";
                return (
                  <tr key={p.id} className={cn(isHidden && "bg-[color:var(--alarm)]/5")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.coverImageUrl}
                            alt=""
                            className="h-10 w-14 shrink-0 rounded-md border border-token object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-14 shrink-0 place-items-center rounded-md border border-token bg-[color:var(--surface-2)] text-muted">
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-5-5L5 21" />
                            </svg>
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/posts/${p.slug}`}
                            className="block truncate text-sm font-medium hover:text-[color:var(--primary)]"
                          >
                            {p.title}
                          </Link>
                          <p className="flex items-center gap-2 truncate text-xs text-muted">
                            <Link
                              href={`/u/${slugify(p.authorName)}`}
                              className="hover:text-[color:var(--primary)]"
                            >
                              {p.authorName}
                            </Link>
                            {isHidden && (
                              <span className="rounded-full bg-[color:var(--alarm)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--alarm)]">
                                Hidden
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted sm:table-cell">
                      <div className="flex gap-3">
                        <span>👁 {formatCount(p.viewCount)}</span>
                        <span>♥ {formatCount(p.reactionCount)}</span>
                        <span>💬 {formatCount(p.commentCount)}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted lg:table-cell">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {isHidden ? (
                          <Button variant="primary" size="sm" onClick={() => postAction(p, "restore")}>
                            Restore
                          </Button>
                        ) : (
                          <Button variant="danger" size="sm" onClick={() => postAction(p, "hide")}>
                            Hide
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function ReasonBadge({ reason }: { reason: AdminReportItem["reason"] }) {
  const label =
    reason === "Spam"
      ? "Spam"
      : reason === "Harassment"
      ? "Harassment"
      : reason === "Illegal"
      ? "Illegal"
      : reason === "Misinformation"
      ? "Misinformation"
      : "Other";
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-[color:var(--alarm)]/12 px-2.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--alarm)]">
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: number;
  accent?: boolean;
  tone?: "alarm";
}) {
  return (
    <div className="rounded-2xl border border-token bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-fluid-2xl font-bold",
          accent && "text-[color:var(--primary)]",
          tone === "alarm" && "text-[color:var(--alarm)]"
        )}
      >
        {formatCount(value)}
      </p>
    </div>
  );
}
