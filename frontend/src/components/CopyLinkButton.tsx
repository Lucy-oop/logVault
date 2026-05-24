"use client";

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Older browsers or denied permission: silently no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label="Copy link to this post"
      className="inline-flex h-9 items-center gap-2 rounded-full border border-token bg-surface px-3.5 text-xs font-semibold text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[color:var(--primary)]" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5 9-12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Copy link
        </>
      )}
    </button>
  );
}
