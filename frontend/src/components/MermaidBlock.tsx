"use client";

import { useEffect, useRef, useState } from "react";

let initialized = false;

export function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;
        if (!initialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
            securityLevel: "strict",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          });
          initialized = true;
        }
        const id = `m-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mermaid render error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre className="my-6 rounded-2xl border border-[color:var(--alarm)]/40 bg-[color:var(--alarm)]/10 p-4 text-xs text-[color:var(--alarm)]">
        Mermaid error: {error}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto rounded-2xl border border-token bg-surface p-6"
    />
  );
}
