"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatCount, timeAgo } from "@/lib/utils";
import type { AdminUserDetail } from "@/types/api";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { token, user: me } = useAuth();
  const toast = useToast();

  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBootstrapped(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;
    if (!token) { router.replace("/login"); return; }
    if (me && me.role !== "Admin") { router.replace("/"); }
  }, [bootstrapped, token, me, router]);

  async function load() {
    if (!token || !params?.id) return;
    try {
      const d = await api<AdminUserDetail>(`/api/admin/users/${params.id}`, { token });
      setData(d);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load user");
    }
  }

  useEffect(() => { load(); }, [token, params?.id]);

  async function action(kind: "ban" | "unban" | "promote" | "demote") {
    if (!token || !data) return;
    const confirms: Record<typeof kind, string> = {
      ban: `Ban ${data.displayName}?`,
      unban: `Unban ${data.displayName}?`,
      promote: `Promote ${data.displayName} to Admin?`,
      demote: `Demote ${data.displayName} to Author?`,
    };
    const ok = await toast.confirm(confirms[kind]);
    if (!ok) return;
    try {
      await api(`/api/admin/users/${data.id}/${kind}`, { method: "POST", token });
      toast.success(`User ${kind}ned.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${kind}`);
    }
  }

  if (!token || (me && me.role !== "Admin")) return <p className="text-muted">Redirecting…</p>;

  return (
    <div>
      <Link
        href="/admin/users"
        className="group inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)] transition-colors hover:text-[color:var(--primary-hover)]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to users
      </Link>

      {!data && (
        <div className="mt-6 rounded-3xl border border-token bg-surface p-8">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-6 h-20 w-full" />
        </div>
      )}

      {data && (
        <>
          {/* Header card */}
          <header className="mt-6 rounded-3xl border border-token bg-surface p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-start gap-5">
              <span
                className={cn(
                  "grid h-20 w-20 shrink-0 place-items-center rounded-full text-3xl font-bold text-white",
                  data.isBanned
                    ? "bg-[color:var(--alarm)]"
                    : data.role === "Admin"
                    ? "bg-[color:var(--primary)]"
                    : "bg-[color:var(--text)]"
                )}
              >
                {data.displayName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  User profile
                </p>
                <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-fluid-3xl font-bold tracking-tight">
                  {data.displayName}
                  {data.role === "Admin" && (
                    <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--primary)]">
                      Admin
                    </span>
                  )}
                  {data.isBanned && (
                    <span className="rounded-full bg-[color:var(--alarm)]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--alarm)]">
                      Banned
                    </span>
                  )}
                </h1>
                <p className="mt-1 text-sm text-muted">{data.email}</p>
                <p className="mt-2 text-xs text-muted">
                  Joined {new Date(data.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  {data.acceptedRulesAt && ` · Accepted rules ${timeAgo(data.acceptedRulesAt)}`}
                </p>
              </div>

              {/* Action buttons */}
              {me?.id !== data.id && (
                <div className="flex flex-wrap gap-2">
                  {!data.isBanned && data.role !== "Admin" && (
                    <Button variant="danger" size="sm" onClick={() => action("ban")}>Ban</Button>
                  )}
                  {data.isBanned && (
                    <Button variant="primary" size="sm" onClick={() => action("unban")}>Unban</Button>
                  )}
                  {data.role === "Author" && !data.isBanned && (
                    <Button variant="outline" size="sm" onClick={() => action("promote")}>Promote</Button>
                  )}
                  {data.role === "Admin" && (
                    <Button variant="outline" size="sm" onClick={() => action("demote")}>Demote</Button>
                  )}
                </div>
              )}
            </div>

            {/* Stats strip */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              <MiniStat label="Published" value={data.publishedPostCount} accent />
              <MiniStat label="Drafts" value={data.draftPostCount} />
              <MiniStat label="Hidden" value={data.hiddenPostCount} tone={data.hiddenPostCount > 0 ? "alarm" : undefined} />
              <MiniStat label="Comments" value={data.commentCount} />
              <MiniStat label="Views" value={data.totalViewsReceived} />
              <MiniStat label="Reactions" value={data.totalReactionsReceived} />
              <MiniStat label="Reports" value={data.reportsAgainstCount} tone={data.reportsAgainstCount > 0 ? "alarm" : undefined} />
            </div>
          </header>

          {/* Posts section */}
          <section className="mt-8 overflow-hidden rounded-2xl border border-token bg-surface">
            <header className="border-b border-token px-5 py-4">
              <h2 className="font-display text-fluid-lg font-bold">
                Posts ({data.posts.length})
              </h2>
            </header>
            {data.posts.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm italic text-muted">No posts yet.</p>
            ) : (
              <ul className="divide-y divide-[color:var(--border)]">
                {data.posts.map((p) => (
                  <li key={p.id} className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill status={p.status} />
                      <Link
                        href={`/posts/${p.slug}`}
                        target="_blank"
                        className="min-w-0 flex-1 truncate text-sm font-medium hover:text-[color:var(--primary)]"
                      >
                        {p.title}
                      </Link>
                      <span className="text-xs text-muted">
                        {p.publishedAt ? timeAgo(p.publishedAt) : "—"}
                      </span>
                      <span className="text-xs text-muted">👁 {formatCount(p.viewCount)}</span>
                      <span className="text-xs text-muted">♥ {formatCount(p.reactionCount)}</span>
                      <span className="text-xs text-muted">💬 {formatCount(p.commentCount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Comments section */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-token bg-surface">
            <header className="border-b border-token px-5 py-4">
              <h2 className="font-display text-fluid-lg font-bold">
                Comments ({data.comments.length})
              </h2>
            </header>
            {data.comments.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm italic text-muted">No comments yet.</p>
            ) : (
              <ul className="divide-y divide-[color:var(--border)]">
                {data.comments.map((c) => (
                  <li key={c.id} className="px-5 py-3.5">
                    <p className="text-sm">{c.content}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{timeAgo(c.createdAt)}</span>
                      <span aria-hidden>·</span>
                      <span>on</span>
                      <Link
                        href={`/posts/${c.postSlug}`}
                        target="_blank"
                        className="truncate font-medium text-[color:var(--text)] hover:text-[color:var(--primary)]"
                      >
                        {c.postTitle}
                      </Link>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MiniStat({
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
    <div className="rounded-xl border border-token bg-[color:var(--bg)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className={cn(
        "mt-1 font-display text-fluid-lg font-bold",
        accent && "text-[color:var(--primary)]",
        tone === "alarm" && "text-[color:var(--alarm)]"
      )}>
        {formatCount(value)}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: "Pending" | "Published" | "Hidden" }) {
  if (status === "Hidden") {
    return (
      <span className="rounded-full bg-[color:var(--alarm)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--alarm)]">
        Hidden
      </span>
    );
  }
  if (status === "Pending") {
    return (
      <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--primary)]">
        Draft
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
      Published
    </span>
  );
}
