import { formatCount } from "@/lib/utils";

export function EyeReaders({ count, size = "md" }: { count: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const text = size === "sm" ? "text-xs" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 ${text} text-muted`}>
      <svg viewBox="0 0 24 24" fill="none" className={cls} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span>{formatCount(count)}</span>
    </span>
  );
}
