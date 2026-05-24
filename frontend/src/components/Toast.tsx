"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  confirm: (msg: string) => Promise<boolean>;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

type ConfirmRequest = {
  id: number;
  message: string;
  resolve: (ok: boolean) => void;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmRequest | null>(null);
  const idRef = useRef(1);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
      confirm: (m) =>
        new Promise<boolean>((resolve) => {
          setPendingConfirm({ id: idRef.current++, message: m, resolve });
        }),
    }),
    [push]
  );

  function resolveConfirm(ok: boolean) {
    if (!pendingConfirm) return;
    pendingConfirm.resolve(ok);
    setPendingConfirm(null);
  }

  useEffect(() => {
    if (!pendingConfirm) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") resolveConfirm(false);
      if (e.key === "Enter") resolveConfirm(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pendingConfirm]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toasts (bottom-right) */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-soft-lg animate-slide-up",
              "bg-[color:var(--surface)]",
              t.kind === "success" && "border-[color:var(--primary)]/50",
              t.kind === "error" && "border-[color:var(--alarm)]/50",
              t.kind === "info" && "border-token"
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                t.kind === "success" && "bg-[color:var(--primary)]/15 text-[color:var(--primary)]",
                t.kind === "error" && "bg-[color:var(--alarm)]/15 text-[color:var(--alarm)]",
                t.kind === "info" && "bg-[color:var(--surface-2)] text-muted"
              )}
            >
              {t.kind === "success" ? "✓" : t.kind === "error" ? "!" : "i"}
            </span>
            <p className="flex-1 leading-snug text-[color:var(--text)]">{t.message}</p>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => resolveConfirm(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          />
          <div
            className="relative w-full max-w-sm rounded-3xl border p-6 shadow-soft-lg animate-slide-up"
            style={{
              background: "var(--surface)",
              borderColor: "color-mix(in srgb, var(--alarm) 35%, var(--border))",
            }}
          >
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-[color:var(--alarm)]/15 text-[color:var(--alarm)]">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <p className="font-display text-fluid-lg font-bold leading-snug">{pendingConfirm.message}</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => resolveConfirm(false)}
                className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => resolveConfirm(true)}
                className="inline-flex h-10 items-center rounded-full bg-[color:var(--alarm)] px-4 text-sm font-medium text-white transition-all hover:-translate-y-px"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
