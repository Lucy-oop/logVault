"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BentoGrid } from "@/components/BentoGrid";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PostListItem } from "@/types/api";

export default function BookmarksPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [items, setItems] = useState<PostListItem[] | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBootstrapped(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (bootstrapped && !token) router.replace("/login");
  }, [bootstrapped, token, router]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        const list = await api<PostListItem[]>("/api/me/bookmarks", { token });
        if (active) setItems(list);
      } catch {
        if (active) setItems([]);
      }
    })();
    return () => { active = false; };
  }, [token]);

  if (!token) return <p className="text-muted">Redirecting…</p>;

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {user?.displayName ?? "You"}
        </p>
        <h1 className="mt-1 font-display text-fluid-4xl font-bold tracking-tight">
          Bookmarks
        </h1>
        <p className="mt-2 text-muted">Posts you've saved to read later.</p>
      </header>

      {!items && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-token bg-surface p-5">
              <Skeleton className="aspect-[16/9]" />
              <Skeleton className="mt-4 h-5 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <EmptyState
          icon="default"
          title="No bookmarks yet"
          body="Browse posts and tap the Save button on anything you want to read later."
          action={{ label: "Browse posts", href: "/" }}
        />
      )}

      {items && items.length > 0 && (
        <BentoGrid items={items} heroBadge="Saved" />
      )}
    </div>
  );
}
