"use client";

import { useEffect, useState } from "react";

export function ReadingTimeLeft({ totalMinutes }: { totalMinutes: number }) {
  const [minutesLeft, setMinutesLeft] = useState(totalMinutes);

  useEffect(() => {
    setMinutesLeft(totalMinutes);
    function onScroll() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const progress = max > 0 ? h.scrollTop / max : 0;
      const remaining = totalMinutes * (1 - progress);
      setMinutesLeft(Math.max(0, Math.round(remaining)));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [totalMinutes]);

  const label =
    minutesLeft <= 0 ? "Finished" :
    minutesLeft === 1 ? "1 min left" :
    `${minutesLeft} min left`;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-6 right-6 z-20 hidden items-center gap-2 rounded-full border border-token bg-[color:var(--surface)]/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted shadow-soft backdrop-blur lg:inline-flex"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-[color:var(--primary)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
