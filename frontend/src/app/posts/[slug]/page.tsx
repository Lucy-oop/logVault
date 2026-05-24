import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import type { PostDetail } from "@/types/api";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { ReadingTimeLeft } from "@/components/ReadingTimeLeft";
import { Comments } from "@/components/Comments";
import { ReactionBar } from "@/components/ReactionBar";
import { EyeReaders } from "@/components/EyeReaders";
import { AuthorBio } from "@/components/AuthorBio";
import { AuthorByline } from "@/components/AuthorByline";
import { OwnerActions } from "@/components/OwnerActions";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ReportButton } from "@/components/ReportButton";
import { AdminActions } from "@/components/AdminActions";
import { TableOfContents } from "@/components/TableOfContents";
import { extractToc } from "@/lib/toc";
import { CodeBlock } from "@/components/CodeBlock";
import { MermaidBlock } from "@/components/MermaidBlock";
import { RelatedPosts } from "@/components/RelatedPosts";
import { BookmarkButton } from "@/components/BookmarkButton";
import { estimateReadMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

function slugifyHeading(s: string): string {
  return s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
}

async function fetchPost(slug: string, token: string | null): Promise<PostDetail | null> {
  try {
    return await api<PostDetail>(`/api/posts/${encodeURIComponent(slug)}`, { token });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

function authTokenFromCookies(): string | null {
  // Read the lv_auth cookie set by client-side login. Lets server components
  // forward the user's JWT to the API so admins/owners can SSR Hidden/Pending
  // posts that would otherwise 404 to anonymous callers.
  return cookies().get("lv_auth")?.value ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPost(params.slug, authTokenFromCookies());
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      authors: [post.authorName],
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug, authTokenFromCookies());
  if (!post) notFound();

  const words = post.contentMarkdown.split(/\s+/).filter(Boolean).length;
  const minutes = estimateReadMinutes(words);
  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toISOString().slice(0, 10)
    : null;
  const toc = extractToc(post.contentMarkdown);

  return (
    <>
      <ReadingProgressBar />
      <ReadingTimeLeft totalMinutes={minutes} />
      <TableOfContents items={toc} />

      <article className="mx-auto max-w-prose animate-fade-in">
        {post.status === "Hidden" && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--alarm) 35%, transparent)",
              background: "color-mix(in srgb, var(--alarm) 8%, transparent)",
              color: "var(--alarm)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
            <span>
              <strong>This post is hidden.</strong> It's invisible on the public site. Only the
              author and admins can read it. Restore it from the action bar above when you're
              ready to make it public again.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)] transition-colors hover:text-[color:var(--primary-hover)]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Go back
          </Link>
          <OwnerActions
            postId={post.id}
            postSlug={post.slug}
            authorId={post.authorId}
            title={post.title}
          />
          <AdminActions
            postId={post.id}
            postTitle={post.title}
            postStatus={post.status}
            authorId={post.authorId}
          />
        </div>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--primary)]">
            {dateLabel && <span>{dateLabel}</span>}
            <span aria-hidden className="text-[color:var(--primary)]/50">·</span>
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {minutes} min read
            </span>
            <span aria-hidden className="text-[color:var(--primary)]/50">·</span>
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {post.viewCount}
            </span>
            <span aria-hidden className="text-[color:var(--primary)]/50">·</span>
            <a
              href="#comments"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[color:var(--primary-hover)] hover:underline underline-offset-4"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
              </svg>
              Comments
            </a>
            {post.tags.length > 0 && (
              <>
                <span aria-hidden className="text-[color:var(--primary)]/50">·</span>
                {post.tags.map((t, i) => (
                  <span key={t} className="inline-flex items-center gap-x-3">
                    <Link
                      href={`/tag/${encodeURIComponent(t.toLowerCase())}`}
                      className="transition-colors hover:text-[color:var(--primary-hover)] hover:underline underline-offset-4"
                    >
                      #{t}
                    </Link>
                    {i < post.tags.length - 1 && (
                      <span aria-hidden className="text-[color:var(--primary)]/50">·</span>
                    )}
                  </span>
                ))}
              </>
            )}
          </div>

          <h1 className="mt-5 font-display text-fluid-5xl font-bold tracking-tight">
            {post.title}
          </h1>

          <div className="mt-5">
            <AuthorByline authorName={post.authorName} publishedAt={post.publishedAt} />
          </div>

          {post.excerpt && (
            <p className="mt-5 text-fluid-lg text-muted">{post.excerpt}</p>
          )}

          {post.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt=""
              loading="lazy"
              className="mt-8 w-full rounded-3xl border border-token object-cover shadow-soft"
            />
          )}
        </header>

        <div className="prose-blog mt-10">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 id={slugifyHeading(String(children))}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 id={slugifyHeading(String(children))}>{children}</h3>
              ),
              code(props) {
                const { className, children } = props as { className?: string; children?: React.ReactNode };
                const text = String(children ?? "").replace(/\n$/, "");
                const m = /language-(\w+)/.exec(className ?? "");
                const lang = m?.[1];
                // Inline code (no language fence) → keep default styling
                if (!lang) {
                  return <code className={className}>{children}</code>;
                }
                if (lang === "mermaid") {
                  return <MermaidBlock code={text} />;
                }
                return <CodeBlock code={text} lang={lang} />;
              },
              // Suppress default <pre> wrapper because CodeBlock provides its own
              pre({ children }) {
                return <>{children}</>;
              },
            }}
          >
            {post.contentMarkdown}
          </ReactMarkdown>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-token pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <ReactionBar slug={post.slug} />
            <BookmarkButton slug={post.slug} />
            <CopyLinkButton />
            <ReportButton postId={post.id} postTitle={post.title} authorId={post.authorId} />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>{minutes} min read</span>
            <span aria-hidden>·</span>
            <EyeReaders count={post.viewCount} size="sm" />
          </div>
        </div>

        <AuthorBio authorName={post.authorName} publishedAt={post.publishedAt} />

        <RelatedPosts endpoint={`/api/posts/${encodeURIComponent(post.slug)}/related`} />

        <div id="comments" className="scroll-mt-24">
          <Comments slug={post.slug} />
        </div>
      </article>
    </>
  );
}
