import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-[calc(100vh-12rem)] items-center justify-center overflow-hidden px-4 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundColor: "var(--bg)",
          backgroundImage: `
            radial-gradient(circle at center, color-mix(in srgb, var(--primary) 40%, transparent), transparent 55%),
            radial-gradient(circle at center, color-mix(in srgb, var(--accent) 45%, transparent), transparent 55%)
          `,
          backgroundSize: "70% 70%, 60% 60%",
          backgroundPosition: "20% 20%, 80% 80%",
          backgroundRepeat: "no-repeat",
          filter: "blur(2px)",
        }}
      />
      <div className="relative max-w-md animate-slide-up">
        <p className="font-display text-[clamp(5rem,12vw,9rem)] font-bold leading-none text-[color:var(--primary)]">
          404
        </p>
        <h1 className="mt-2 font-display text-fluid-3xl font-bold tracking-tight">
          Lost the trail
        </h1>
        <p className="mt-3 text-muted">
          We can&rsquo;t find the page you&rsquo;re looking for. Maybe it was hidden, deleted, or you followed an old link.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-[color:var(--primary-hover)]"
          >
            Take me home
          </Link>
          <Link
            href="/admin/posts"
            className="inline-flex h-10 items-center rounded-full border border-token px-5 text-sm font-medium text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--text)]"
          >
            Your posts
          </Link>
        </div>
      </div>
    </div>
  );
}
