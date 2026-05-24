"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PagedResult, PostListItem } from "@/types/api";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className ?? "h-4 w-4"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark
        key={key++}
        className="bg-transparent font-semibold text-[color:var(--primary)]"
      >
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

export function SearchExpand() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (expanded) setTimeout(() => inputRef.current?.focus(), 80);
  }, [expanded]);

  // Global ⌘K / Ctrl+K to open the search
  useEffect(() => {
    function onShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setExpanded(true);
      }
    }
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) collapse();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") collapse();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  // Reset selection when results change
  useEffect(() => {
    setSelected(0);
  }, [results]);

  useEffect(() => {
    if (!expanded) return;
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); return; }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await api<PagedResult<PostListItem>>(
          `/api/posts?search=${encodeURIComponent(trimmed)}&pageSize=5`
        );
        setResults(res.items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, expanded]);

  function collapse() {
    setExpanded(false);
    setQ("");
    setResults([]);
    setSelected(0);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (results.length > 0) {
      const target = results[Math.min(selected, results.length - 1)];
      collapse();
      router.push(`/posts/${target.slug}`);
      return;
    }
    const v = q.trim();
    collapse();
    router.push(v ? `/?search=${encodeURIComponent(v)}` : "/");
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (s + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (s - 1 + results.length) % results.length);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-full border bg-surface transition-[width,border-color,padding] duration-300 ease-out",
          expanded
            ? "w-64 border-token pl-3 pr-1 sm:w-72"
            : "w-10 border-transparent sm:w-[88px] sm:border-token"
        )}
      >
        {expanded ? (
          <>
            <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
            <form onSubmit={submit} className="flex-1">
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search posts…"
                aria-label="Search posts"
                className="focus-quiet h-10 w-full bg-transparent px-2 text-sm text-[color:var(--text)] placeholder:text-muted outline-none"
              />
            </form>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Open search (Cmd+K)"
            title="Search (⌘K)"
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)] sm:justify-start sm:px-3"
          >
            <SearchIcon className="h-5 w-5 sm:h-4 sm:w-4" />
            <kbd
              aria-hidden
              className="hidden h-5 items-center rounded-md border border-token bg-[color:var(--bg)] px-1.5 text-[10px] font-semibold tracking-wide text-muted sm:inline-flex"
            >
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {expanded && q.trim() && (
        <div
          className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border animate-slide-up"
          style={{
            background: "color-mix(in srgb, var(--surface) 80%, transparent)",
            backdropFilter: "saturate(180%) blur(22px)",
            WebkitBackdropFilter: "saturate(180%) blur(22px)",
            borderColor: "color-mix(in srgb, var(--primary) 25%, var(--border))",
            boxShadow:
              "0 20px 50px -10px rgba(0,0,0,0.45), 0 0 0 1px color-mix(in srgb, var(--primary) 15%, transparent)",
          }}
        >
          {loading && results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">No matches.</p>
          ) : (
            <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
              {results.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/posts/${p.slug}`}
                    onClick={collapse}
                    onMouseEnter={() => setSelected(i)}
                    role="option"
                    aria-selected={i === selected}
                    className={cn(
                      "row-hover block px-4 py-2.5 text-sm text-[color:var(--text)]",
                      i === selected && "is-selected"
                    )}
                  >
                    <span className="block truncate">
                      <Highlight text={p.title} query={q.trim()} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

        </div>
      )}
    </div>
  );
}
