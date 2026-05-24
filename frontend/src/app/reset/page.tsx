"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/AuthShell";
import { PasswordInput } from "@/components/PasswordInput";
import type { AuthResponse } from "@/types/api";

function checks(p: string) {
  return [
    { label: "At least 8 characters", pass: p.length >= 8 },
    { label: "Contains a letter", pass: /[A-Za-z]/.test(p) },
    { label: "Contains a number", pass: /\d/.test(p) },
  ];
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuth } = useAuth();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = checks(password);
  const allOk = items.every((c) => c.pass);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!allOk) {
      setError("Please meet all password requirements.");
      return;
    }
    setBusy(true);
    try {
      const res = await api<AuthResponse>("/api/auth/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setAuth(res);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid reset link" subtitle="This link is missing its token.">
        <p className="text-center text-sm text-muted">
          Open the reset link from your email exactly as it was sent. The link is one-time use and
          expires in 1 hour.
        </p>
        <p className="mt-4 text-center">
          <Link href="/forgot" className="text-sm font-medium text-[color:var(--primary)] hover:underline">
            Request a new link
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Pick a strong one. You'll be signed in right after.">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            New password
          </span>
          <PasswordInput
            value={password}
            onChange={setPassword}
            onBlur={() => setTouched(true)}
            autoComplete="new-password"
          />
          {(password || touched) && (
            <ul className="mt-2 space-y-1">
              {items.map((c) => (
                <li
                  key={c.label}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    c.pass
                      ? "text-[color:var(--primary)]"
                      : touched && !password
                      ? "text-[color:var(--alarm)]"
                      : "text-muted"
                  }`}
                >
                  {c.pass ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5 9-12" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>
          )}
        </label>

        {error && (
          <p className="rounded-xl bg-[color:var(--alarm)]/10 px-3 py-2 text-sm text-[color:var(--alarm)]">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-[color:var(--primary)] hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
