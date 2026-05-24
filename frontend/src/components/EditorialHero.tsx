import Link from "next/link";
import type { PostListItem } from "@/types/api";

export function EditorialHero({ post }: { post: PostListItem }) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <section className="pt-4 animate-fade-in">
      <Link href={`/posts/${post.slug}`} className="group block">
        <h1
          className="font-display font-bold leading-[1.04] tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 1.8rem + 4.2vw, 5.5rem)" }}
        >
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="mt-8 max-w-2xl text-fluid-base text-muted">
            {post.excerpt}
          </p>
        )}

        {date && (
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-muted">
            {date}
          </p>
        )}

        {post.coverImageUrl && (
          <div className="mt-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImageUrl}
              alt=""
              loading="lazy"
              className="aspect-[16/8] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>
        )}
      </Link>
    </section>
  );
}
