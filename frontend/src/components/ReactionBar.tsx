"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn, formatCount } from "@/lib/utils";
import type { ReactionsResponse } from "@/types/api";

export function ReactionBar({ slug }: { slug: string }) {
  const { user, token } = useAuth();
  const [state, setState] = useState<ReactionsResponse | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await api<ReactionsResponse>(`/api/posts/${encodeURIComponent(slug)}/reactions`, { token });
        if (active) setState(r);
      } catch { /* swallow */ }
    })();
    return () => { active = false; };
  }, [slug, token]);

  const mine = state?.mine ?? null;
  // Treat any non-Heart legacy reaction as "not yet liked" — first click upgrades it to Heart.
  const liked = mine === "Heart";
  const total = state?.total ?? 0;

  async function toggle() {
    if (!token || busy) return;
    setBusy(true);
    try {
      if (liked) {
        const r = await api<ReactionsResponse>(`/api/posts/${encodeURIComponent(slug)}/reactions`, {
          method: "DELETE",
          token,
        });
        setState(r);
      } else {
        const r = await api<ReactionsResponse>(`/api/posts/${encodeURIComponent(slug)}/reactions`, {
          method: "PUT",
          body: JSON.stringify({ kind: "Heart" }),
          token,
        });
        setState(r);
        setBurstKey((k) => k + 1);
      }
    } catch { /* swallow */ }
    finally { setBusy(false); }
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full border border-token px-4 py-2 text-sm font-medium text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--alarm)] hover:text-[color:var(--alarm)]"
      >
        <HeartIcon filled={false} />
        <span>Sign in to like</span>
        {total > 0 && (
          <span className="ml-1 text-xs text-muted">· {formatCount(total)}</span>
        )}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this post" : "Like this post"}
      className={cn(
        "relative inline-flex items-center gap-2 overflow-visible rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
        liked
          ? "border-[color:var(--alarm)] bg-[color:var(--alarm)]/10 text-[color:var(--alarm)]"
          : "border-token text-[color:var(--text)] hover:-translate-y-px hover:border-[color:var(--alarm)] hover:text-[color:var(--alarm)]",
        busy && "opacity-70"
      )}
    >
      <HeartIcon filled={liked} />
      <span>{liked ? "Liked" : "Like"}</span>
      {total > 0 && (
        <span className="text-xs text-muted">· {formatCount(total)}</span>
      )}

      {burstKey > 0 && (
        <span
          key={burstKey}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 animate-heart-burst text-[color:var(--alarm)]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
          </svg>
        </span>
      )}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
    </svg>
  );
}
