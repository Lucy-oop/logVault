"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api("/api/auth/forgot", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email — we'll send a one-time link to set a new password."
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[color:var(--accent-soft)]">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[color:var(--primary)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>
          <p className="text-sm">
            If <span className="font-medium">{email}</span> is registered, a reset link is on its way.
          </p>
          <p className="text-xs text-muted">
            The link expires in 1 hour. Check your inbox (and spam folder).
          </p>
          <p className="pt-3">
            <Link href="/login" className="text-sm font-medium text-[color:var(--primary)] hover:underline">
              ← Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Email
              </span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input focus-quiet"
              />
            </label>
            {error && (
              <p className="rounded-xl bg-[color:var(--alarm)]/10 px-3 py-2 text-sm text-[color:var(--alarm)]">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-[color:var(--primary)] hover:underline">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
