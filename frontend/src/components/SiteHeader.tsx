"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchExpand } from "@/components/SearchExpand";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}
function CaretIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Pill({
  href,
  label,
  icon,
  active,
  variant = "outline",
  onClick,
}: {
  href?: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  variant?: "outline" | "primary";
  onClick?: () => void;
}) {
  const base =
    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200";
  const styles =
    variant === "primary"
      ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white hover:-translate-y-px hover:bg-[color:var(--primary-hover)]"
      : active
      ? "border-[color:var(--text)] bg-[color:var(--surface-2)] text-[color:var(--text)]"
      : "border-[color:var(--border)] text-[color:var(--text)] hover:border-[color:var(--text)] hover:-translate-y-px";
  const className = cn(base, styles);
  if (href) {
    return (
      <Link href={href} className={className}>
        {icon}
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ProfileMenu({ pathname }: { pathname: string }) {
  const router = useRouter();
  const toast = useToast();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function handleSignOut() {
    const name = user?.displayName;
    setOpen(false);
    signOut();
    router.push("/");
    toast.success(name ? `Signed out. See you soon, ${name.split(" ")[0]}.` : "Signed out. See you soon.");
  }

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const initial = user.displayName.charAt(0).toUpperCase();
  const onYourPosts = pathname.startsWith("/admin/posts");
  const onBookmarks = pathname.startsWith("/bookmarks");
  const onAdmin = pathname.startsWith("/admin/users");
  const inUserSpace = onYourPosts || onBookmarks || onAdmin;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border bg-surface pl-1 pr-3 text-sm font-medium text-[color:var(--text)] transition-all hover:-translate-y-px",
          inUserSpace
            ? "border-[color:var(--primary)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
            : "border-token hover:border-[color:var(--text)]"
        )}
        aria-expanded={open}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--primary)] text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[10ch] truncate sm:inline">{user.displayName}</span>
        <CaretIcon open={open} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-2xl border animate-slide-up"
          style={{
            background: "var(--surface)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            borderColor: "color-mix(in srgb, var(--primary) 25%, var(--border))",
            boxShadow:
              "0 20px 50px -10px rgba(0,0,0,0.45), 0 0 0 1px color-mix(in srgb, var(--primary) 15%, transparent)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--primary)] text-sm font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.displayName}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <div className="mx-3 h-px" style={{ background: "color-mix(in srgb, var(--border) 80%, transparent)" }} />
          <Link
            href="/admin/posts"
            onClick={() => setOpen(false)}
            aria-current={onYourPosts ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[color:var(--surface-2)]/60",
              onYourPosts && "bg-[color:var(--accent-soft)] font-medium text-[color:var(--primary)]"
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", onYourPosts ? "text-[color:var(--primary)]" : "text-muted")} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
            </svg>
            Your posts
          </Link>
          <Link
            href="/bookmarks"
            onClick={() => setOpen(false)}
            aria-current={onBookmarks ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[color:var(--surface-2)]/60",
              onBookmarks && "bg-[color:var(--accent-soft)] font-medium text-[color:var(--primary)]"
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", onBookmarks ? "text-[color:var(--primary)]" : "text-muted")} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
            </svg>
            Bookmarks
          </Link>
          {user.role === "Admin" && (
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              aria-current={onAdmin ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[color:var(--primary)] transition-colors hover:bg-[color:var(--surface-2)]/60",
                onAdmin && "bg-[color:var(--accent-soft)]"
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              </svg>
              Admin panel
            </Link>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[color:var(--alarm)] transition-colors hover:bg-[color:var(--surface-2)]/60"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  function handleMobileSignOut() {
    const name = user?.displayName;
    setMobileOpen(false);
    signOut();
    router.push("/");
    toast.success(name ? `Signed out. See you soon, ${name.split(" ")[0]}.` : "Signed out. See you soon.");
  }

  const isHome = pathname === "/";

  // Close menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Track scroll for shadow border + hide-on-scroll-down behavior
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Hide once past 80px AND scrolling down; show on any upward movement.
      // Always show within the first 80px (no flicker near the top).
      if (mobileOpen) {
        setHidden(false);
      } else if (y > 80 && y > lastScrollY.current + 4) {
        setHidden(true);
      } else if (y < lastScrollY.current - 4 || y <= 80) {
        setHidden(false);
      }
      lastScrollY.current = y;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mobileOpen]);

  function onWriteClick() {
    if (user) router.push("/admin/posts?new=1");
    else router.push("/login");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-[color:var(--bg)]/85 backdrop-blur motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
        scrolled && "border-b border-token shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]",
        hidden && "-translate-y-full"
      )}
      aria-hidden={hidden ? "true" : undefined}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-2 sm:flex">
          <Pill href="/" label="Home" icon={<HomeIcon />} active={isHome} />
          <Pill onClick={onWriteClick} label="Write" icon={<PencilIcon />} variant="primary" />
        </nav>

        {/* Desktop right side */}
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <SearchExpand />
          {user ? (
            <ProfileMenu pathname={pathname} />
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center rounded-full border border-token px-4 text-sm font-medium text-[color:var(--text)] transition-all hover:-translate-y-px hover:border-[color:var(--text)]"
              >
                Register
              </Link>
            </div>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="ml-auto flex items-center gap-1 sm:hidden">
          <SearchExpand />
          <ThemeToggle />
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-token text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)]"
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden">
          <div
            className="mx-4 mb-4 rounded-2xl border bg-surface p-3 shadow-soft-lg animate-slide-up"
            style={{
              borderColor: "color-mix(in srgb, var(--primary) 25%, var(--border))",
            }}
          >
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[color:var(--surface-2)]"
            >
              <HomeIcon />
              Home
            </Link>
            <button
              type="button"
              onClick={onWriteClick}
              className="flex w-full items-center gap-2 rounded-xl bg-[color:var(--primary)] px-3 py-2 text-sm font-medium text-white"
            >
              <PencilIcon />
              Write
            </button>
            <div className="my-2 h-px bg-[color:var(--border)]" />
            {user ? (
              <>
                <Link
                  href="/admin/posts"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[color:var(--surface-2)]"
                >
                  Your posts
                </Link>
                <button
                  type="button"
                  onClick={handleMobileSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[color:var(--alarm)] transition-colors hover:bg-[color:var(--surface-2)]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[color:var(--surface-2)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[color:var(--surface-2)]"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
