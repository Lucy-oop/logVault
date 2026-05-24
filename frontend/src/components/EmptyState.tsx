import Link from "next/link";

export type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export function EmptyState({
  icon = "default",
  title,
  body,
  action,
}: {
  icon?: "default" | "search" | "write" | "noresults";
  title: string;
  body?: string;
  action?: EmptyStateAction;
}) {
  return (
    <div className="rounded-3xl border border-token bg-surface p-10 text-center">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[color:var(--accent-soft)]">
        <Icon name={icon} />
      </div>
      <h3 className="font-display text-fluid-xl font-bold">{title}</h3>
      {body && <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex h-10 items-center rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-[color:var(--primary-hover)]"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex h-10 items-center rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-[color:var(--primary-hover)]"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Icon({ name }: { name: "default" | "search" | "write" | "noresults" }) {
  const cls = "h-7 w-7 text-[color:var(--primary)]";
  switch (name) {
    case "search":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "write":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      );
    case "noresults":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
          <path d="m8 8 6 6M14 8l-6 6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18M9 4v16" />
        </svg>
      );
  }
}
