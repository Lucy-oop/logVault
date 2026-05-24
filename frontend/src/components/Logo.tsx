import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight"
      aria-label="LogVault home"
    >
      <span
        aria-hidden
        className="relative grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--primary)] text-white transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-105"
      >
        {/* Vault dial: ring + 4 cardinal ticks + indicator dot */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ height: 20, width: 20 }}
        >
          {/* Dial face */}
          <circle cx="12" cy="12" r="5.5" />
          {/* Cardinal ticks just outside the ring */}
          <path d="M12 3v1.5" />
          <path d="M12 19.5v1.5" />
          <path d="M3 12h1.5" />
          <path d="M19.5 12h1.5" />
          {/* Indicator dot at the top of the dial */}
          <circle cx="12" cy="9.2" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="text-[color:var(--text)]">Log</span>
        <span className="text-[color:var(--primary)]">Vault</span>
      </span>
    </Link>
  );
}
