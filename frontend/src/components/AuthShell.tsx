export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="aurora-mesh relative isolate flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div
        className="relative w-full max-w-md rounded-3xl border p-8 shadow-soft-lg animate-slide-up"
        style={{
          background: "color-mix(in srgb, var(--surface) 70%, transparent)",
          backdropFilter: "saturate(160%) blur(20px)",
          WebkitBackdropFilter: "saturate(160%) blur(20px)",
          borderColor: "color-mix(in srgb, var(--primary) 30%, var(--border))",
        }}
      >
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--primary)]">
            LogVault
          </span>
          <h1 className="mt-4 font-display text-fluid-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
      </div>

      <style jsx global>{`
        .auth-input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--bg) 80%, transparent);
          padding: 0.7rem 0.875rem;
          color: var(--text);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 200ms ease;
        }
        .auth-input:focus {
          border-color: color-mix(in srgb, var(--text) 35%, transparent);
        }

        /* Animated radial mesh — painted directly on the wrapper.
           No positioned children, no overflow clipping, no edges. */
        .aurora-mesh {
          background-color: var(--bg);
          background-image:
            radial-gradient(circle at center,
              color-mix(in srgb, var(--primary) 50%, transparent),
              transparent 55%),
            radial-gradient(circle at center,
              color-mix(in srgb, var(--accent) 55%, transparent),
              transparent 55%),
            radial-gradient(circle at center,
              color-mix(in srgb, var(--primary-hover) 40%, transparent),
              transparent 60%);
          background-size: 95% 95%, 85% 85%, 70% 70%;
          background-repeat: no-repeat;
          background-position: 5% 15%, 90% 85%, 50% 55%;
          animation: aurora-drift 22s ease-in-out infinite alternate;
        }
        @keyframes aurora-drift {
          0% {
            background-position: 5% 15%, 90% 85%, 50% 55%;
          }
          50% {
            background-position: 40% 50%, 55% 25%, 75% 75%;
          }
          100% {
            background-position: 65% 10%, 25% 70%, 30% 30%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-mesh { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
