"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/toc";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(items[0]?.slug ?? null);

  useEffect(() => {
    if (items.length === 0 || typeof window === "undefined") return;
    const nodes = items
      .map((i) => document.getElementById(i.slug))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSlug(visible.target.id);
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <aside
      aria-label="Table of contents"
      className="pointer-events-none fixed right-6 top-32 z-20 hidden w-56 xl:block"
    >
      <div className="pointer-events-auto">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
          On this page
        </p>
        <ul className="space-y-1.5 border-l border-token pl-3">
          {items.map((item) => {
            const active = item.slug === activeSlug;
            return (
              <li key={item.slug} className={cn(item.level === 3 && "pl-3")}>
                <a
                  href={`#${item.slug}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "block truncate py-0.5 text-xs transition-colors",
                    active
                      ? "font-semibold text-[color:var(--primary)]"
                      : "text-muted hover:text-[color:var(--text)]"
                  )}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
