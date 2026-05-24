"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PostCard } from "@/components/PostCard";
import type { PostListItem } from "@/types/api";

type Props = {
  endpoint: string;
  heading?: string;
  subtitle?: string;
};

export function RelatedPosts({
  endpoint,
  heading = "Related posts",
  subtitle = "Based on shared tags",
}: Props) {
  const [items, setItems] = useState<PostListItem[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await api<PostListItem[]>(endpoint);
        if (active) setItems(list);
      } catch { /* swallow */ }
    })();
    return () => { active = false; };
  }, [endpoint]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <header className="mb-6 flex items-baseline justify-between border-t border-token pt-8">
        <h2 className="font-display text-fluid-2xl font-bold">{heading}</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {subtitle}
        </span>
      </header>
      <div className="stagger grid gap-6 md:grid-cols-3">
        {items.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}
