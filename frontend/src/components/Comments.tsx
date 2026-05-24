"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { cn, timeAgo } from "@/lib/utils";
import type { CommentResponse } from "@/types/api";

type Sort = "newest" | "oldest";

export function Comments({ slug }: { slug: string }) {
  const { user, token } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [sort, setSort] = useState<Sort>("oldest");
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await api<CommentResponse[]>(`/api/posts/${encodeURIComponent(slug)}/comments`);
        if (active) setComments(list);
      } catch { /* swallow */ }
    })();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!expanded) return;
    function onClick(e: MouseEvent) {
      if (!formRef.current?.contains(e.target as Node) && !content.trim()) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [expanded, content]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !content.trim()) return;
    setBusy(true); setError(null);
    try {
      const created = await api<CommentResponse>(`/api/posts/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: content.trim() }),
        token,
      });
      setComments((prev) => [...prev, created]);
      setContent("");
      setExpanded(false);
      toast.success("Comment posted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally { setBusy(false); }
  }

  function onEdited(updated: CommentResponse) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    toast.success("Comment updated.");
  }
  function onDeleted(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    toast.success("Comment deleted.");
  }

  const sortedComments = [...comments].sort((a, b) =>
    sort === "newest"
      ? +new Date(b.createdAt) - +new Date(a.createdAt)
      : +new Date(a.createdAt) - +new Date(b.createdAt)
  );

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-fluid-2xl font-bold">
          Discussion ({comments.length})
        </h2>
        {comments.length > 1 && (
          <div className="flex items-center gap-1 rounded-full border border-token p-1 text-xs">
            <button
              type="button"
              onClick={() => setSort("newest")}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                sort === "newest" ? "bg-[color:var(--primary)] text-white" : "text-muted hover:text-[color:var(--text)]"
              )}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSort("oldest")}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                sort === "oldest" ? "bg-[color:var(--primary)] text-white" : "text-muted hover:text-[color:var(--text)]"
              )}
            >
              Oldest
            </button>
          </div>
        )}
      </div>

      <div ref={formRef} className="mt-6">
        {!user ? (
          <div className="rounded-2xl border border-token bg-surface p-5 text-center text-sm text-muted">
            <Link href="/login" className="font-medium text-[color:var(--primary)] hover:underline">
              Sign in
            </Link>{" "}
            to join the discussion.
          </div>
        ) : !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-token bg-surface px-5 py-4 text-left text-sm text-muted transition-colors hover:border-[color:var(--text)] hover:bg-[color:var(--surface-2)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--primary)] text-xs font-bold text-white">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
            <span>Write a comment as {user.displayName}…</span>
          </button>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-3 rounded-2xl border border-token bg-surface p-5 shadow-card animate-slide-up"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--primary)] text-xs font-bold text-white">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium">{user.displayName}</span>
            </div>
            <textarea
              required
              autoFocus
              maxLength={2000}
              rows={4}
              placeholder="Share your thoughts…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-y rounded-xl border border-token bg-[color:var(--bg)] px-4 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--primary)]"
            />
            {error && (
              <p className="rounded-lg bg-[color:var(--alarm)]/10 px-3 py-2 text-sm text-[color:var(--alarm)]">
                {error}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setExpanded(false); setContent(""); setError(null); }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? "Posting…" : "Post comment"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <ul className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <li className="text-center text-sm italic text-muted">
            No comments yet. Be the first to share your thoughts.
          </li>
        ) : (
          sortedComments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              mine={user?.id === c.authorId}
              token={token}
              onEdited={onEdited}
              onDeleted={onDeleted}
            />
          ))
        )}
      </ul>
    </section>
  );
}

function CommentItem({
  comment,
  mine,
  token,
  onEdited,
  onDeleted,
}: {
  comment: CommentResponse;
  mine: boolean;
  token: string | null;
  onEdited: (c: CommentResponse) => void;
  onDeleted: (id: string) => void;
}) {
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function save() {
    if (!token || !draft.trim()) return;
    setBusy(true); setError(null);
    try {
      const updated = await api<CommentResponse>(`/api/comments/${comment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content: draft.trim() }),
        token,
      });
      onEdited(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally { setBusy(false); }
  }

  async function destroy() {
    if (!token) return;
    setMenuOpen(false);
    const ok = await toast.confirm("Delete this comment?");
    if (!ok) return;
    try {
      await api(`/api/comments/${comment.id}`, { method: "DELETE", token });
      onDeleted(comment.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <li className="rounded-2xl border border-token bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--accent-soft)] text-xs font-bold text-[color:var(--primary)]">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium">{comment.authorName}</span>
            <span className="text-xs text-muted">
              <span title={new Date(comment.createdAt).toLocaleString()}>
                {timeAgo(comment.createdAt)}
              </span>
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                <span
                  className="ml-1 italic"
                  title={`Edited ${new Date(comment.updatedAt).toLocaleString()}`}
                >
                  · edited
                </span>
              )}
            </span>
          </div>
        </div>

        {mine && !editing && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label="Comment actions"
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full text-muted transition-colors",
                menuOpen ? "bg-[color:var(--surface-2)] text-[color:var(--text)]" : "hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]"
              )}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                <circle cx="5" cy="12" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="19" cy="12" r="1.6" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-30 w-36 overflow-hidden border border-token bg-surface shadow-soft-lg animate-slide-up">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setEditing(true); setDraft(comment.content); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-[color:var(--surface-2)]"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={destroy}
                  className="flex w-full items-center gap-2 border-t border-token px-4 py-2 text-left text-sm text-[color:var(--alarm)] transition-colors hover:bg-[color:var(--surface-2)]"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6 17.5 21a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 6" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-y rounded-xl border border-token bg-[color:var(--bg)] px-4 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--primary)]"
          />
          {error && (
            <p className="rounded-lg bg-[color:var(--alarm)]/10 px-3 py-1.5 text-xs text-[color:var(--alarm)]">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setEditing(false); setDraft(comment.content); setError(null); }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy || !draft.trim() || draft.trim() === comment.content.trim()}
              onClick={save}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm">{comment.content}</p>
      )}
    </li>
  );
}
