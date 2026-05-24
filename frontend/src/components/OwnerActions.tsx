"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

export function OwnerActions({
  postId,
  postSlug,
  authorId,
  title,
}: {
  postId: string;
  postSlug: string;
  authorId: string;
  title: string;
}) {
  const router = useRouter();
  const { user, token } = useAuth();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  if (!user || user.id !== authorId) return null;

  async function onDelete() {
    if (!token) return;
    const ok = await toast.confirm(`Delete "${title}"?`);
    if (!ok) return;
    setDeleting(true);
    try {
      await api(`/api/posts/${postId}`, { method: "DELETE", token });
      toast.success("Post deleted.");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <div className="ml-auto flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => router.push(`/admin/posts?edit=${encodeURIComponent(postSlug)}`)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-token bg-surface px-3 text-xs font-semibold text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-token bg-surface px-3 text-xs font-semibold text-muted transition-all hover:-translate-y-px hover:border-[color:var(--alarm)] hover:text-[color:var(--alarm)] disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6 17.5 21a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 6" />
        </svg>
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
