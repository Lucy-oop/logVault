"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

export function BookmarkButton({ slug }: { slug: string }) {
  const { user, token } = useAuth();
  const toast = useToast();
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setBookmarked(false); return; }
    let active = true;
    (async () => {
      try {
        const res = await api<{ bookmarked: boolean }>(
          `/api/posts/${encodeURIComponent(slug)}/bookmark`,
          { token }
        );
        if (active) setBookmarked(res.bookmarked);
      } catch { /* swallow */ }
    })();
    return () => { active = false; };
  }, [slug, token]);

  async function toggle() {
    if (!token) return;
    setBusy(true);
    try {
      if (bookmarked) {
        await api(`/api/posts/${encodeURIComponent(slug)}/bookmark`, { method: "DELETE", token });
        setBookmarked(false);
        toast.success("Removed from bookmarks.");
      } else {
        await api(`/api/posts/${encodeURIComponent(slug)}/bookmark`, { method: "POST", token });
        setBookmarked(true);
        toast.success("Saved to bookmarks.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to bookmark");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-token px-4 text-sm font-medium text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--text)]"
      >
        <BookmarkIcon filled={false} />
        Sign in to save
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={bookmarked}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all",
        bookmarked
          ? "border-[color:var(--primary)] bg-[color:var(--accent-soft)] text-[color:var(--primary)]"
          : "border-token text-[color:var(--text)] hover:-translate-y-px hover:border-[color:var(--text)]"
      )}
    >
      <BookmarkIcon filled={bookmarked} />
      {bookmarked ? "Saved" : "Save"}
    </button>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M6 3a2 2 0 0 0-2 2v16l8-4 8 4V5a2 2 0 0 0-2-2H6Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
    </svg>
  );
}
