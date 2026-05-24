"use client";

import { useEffect, useState } from "react";

const btn =
  "grid h-9 w-9 place-items-center rounded-full border border-token text-muted " +
  "transition-colors hover:text-[color:var(--text)] hover:border-[color:var(--text)] " +
  "focus-visible:outline-none";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M13 9h3V6h-3a3 3 0 0 0-3 3v2H8v3h2v7h3v-7h2.5l.5-3H13V9.5a.5.5 0 0 1 .5-.5H13Z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M17.5 3h3.2l-7 8 8.3 10h-6.5l-5-6.4L4.7 21H1.5l7.5-8.6L1 3h6.6l4.6 5.9L17.5 3Zm-1.1 16h1.8L7.7 5H5.8l10.6 14Z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5 9-12" />
    </svg>
  );
}

export function SocialRail({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch { /* swallow */ }
  }

  return (
    <aside
      aria-label="Share this post"
      className="fixed left-4 top-1/3 z-20 hidden flex-col gap-3 lg:flex"
    >
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className={btn}
      >
        <FacebookIcon />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className={btn}
      >
        <XIcon />
      </a>
      <a
        href={`mailto:?subject=${enc(title)}&body=${enc(url)}`}
        aria-label="Share by email"
        className={btn}
      >
        <MailIcon />
      </a>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Link copied" : "Copy link"}
        className={btn}
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
      </button>
    </aside>
  );
}
