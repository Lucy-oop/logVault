"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

export function AdminActions({
  postId,
  postTitle,
  postStatus,
  authorId,
}: {
  postId: string;
  postTitle: string;
  postStatus: "Pending" | "Published" | "Hidden";
  authorId: string;
}) {
  const router = useRouter();
  const { user, token } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState<"hide" | "restore" | null>(null);

  if (!user || user.role !== "Admin") return null;

  async function act(kind: "hide" | "restore") {
    if (!token) return;
    const ok = await toast.confirm(
      kind === "hide"
        ? `Hide "${postTitle}" from the public? Only admins and the author will be able to see it.`
        : `Restore "${postTitle}" to public view?`
    );
    if (!ok) return;
    setBusy(kind);
    try {
      await api(`/api/admin/posts/${postId}/${kind}`, { method: "POST", token });
      toast.success(kind === "hide" ? "Post hidden." : "Post restored.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${kind}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="ml-auto flex items-center gap-1.5">
      <span className="rounded-full bg-[color:var(--primary)]/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--primary)]">
        Admin
      </span>
      {postStatus !== "Hidden" ? (
        <button
          type="button"
          onClick={() => act("hide")}
          disabled={busy !== null}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-token bg-surface px-3 text-xs font-semibold text-muted transition-all hover:-translate-y-px hover:border-[color:var(--alarm)] hover:text-[color:var(--alarm)] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
          {busy === "hide" ? "Hiding…" : "Hide"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => act("restore")}
          disabled={busy !== null}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[color:var(--primary)] bg-[color:var(--accent-soft)] px-3 text-xs font-semibold text-[color:var(--primary)] transition-all hover:-translate-y-px disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {busy === "restore" ? "Restoring…" : "Restore"}
        </button>
      )}
      <Link
        href={`/admin/users/${authorId}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-token bg-surface px-3 text-xs font-semibold text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        View author
      </Link>
    </div>
  );
}
