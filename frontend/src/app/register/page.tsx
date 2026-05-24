"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/AuthShell";
import { PasswordInput } from "@/components/PasswordInput";
import type { AuthResponse } from "@/types/api";

type Step = "welcome" | "rules" | "form";

type PasswordCheck = { label: string; pass: boolean };

function checkPassword(p: string): PasswordCheck[] {
  return [
    { label: "At least 8 characters", pass: p.length >= 8 },
    { label: "Contains a letter", pass: /[A-Za-z]/.test(p) },
    { label: "Contains a number", pass: /\d/.test(p) },
  ];
}

const RULES: { title: string; body: string }[] = [
  {
    title: "Be respectful",
    body: "No harassment, hate speech, or personal attacks. Disagree with ideas, never people.",
  },
  {
    title: "Keep it legal",
    body: "Don't publish content that's illegal in your jurisdiction — including pirated material, stolen data, or anything tied to fraud.",
  },
  {
    title: "No dangerous content",
    body: "No instructions for weapons, self-harm, doxxing, or content that puts real people at risk.",
  },
  {
    title: "Own your words",
    body: "Only post writing and images you have the right to publish. Credit sources and quote responsibly.",
  },
  {
    title: "No spam or scams",
    body: "No SEO spam, affiliate-link dumps, phishing, or coordinated promotional posting.",
  },
  {
    title: "Admins can ban accounts",
    body: "Breaking these rules can get your account banned without warning. Severe violations may be reported to authorities.",
  },
];

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [agreed, setAgreed] = useState(false);

  return (
    <AuthShell
      title={
        step === "welcome"
          ? "Welcome to LogVault"
          : step === "rules"
          ? "Community rules"
          : "Create your account"
      }
      subtitle={
        step === "welcome"
          ? "Where anyone can share what they know."
          : step === "rules"
          ? "Read these before you join — they keep LogVault a place worth writing on."
          : "Almost there — just a few details and you're in."
      }
    >
      <StepIndicator current={step} />

      {step === "welcome" && <WelcomeStep onContinue={() => setStep("rules")} />}
      {step === "rules" && (
        <RulesStep
          agreed={agreed}
          setAgreed={setAgreed}
          onBack={() => setStep("welcome")}
          onContinue={() => setStep("form")}
        />
      )}
      {step === "form" && <FormStep onBack={() => setStep("rules")} />}

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[color:var(--primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ["welcome", "rules", "form"];
  const idx = steps.indexOf(current);
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === idx
              ? "w-8 bg-[color:var(--primary)]"
              : i < idx
              ? "w-5 bg-[color:var(--primary)]/60"
              : "w-5 bg-[color:var(--border)]"
          }`}
        />
      ))}
    </div>
  );
}

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          <span className="font-semibold text-[color:var(--text)]">LogVault</span> is a public
          self-publishing platform. Anyone can register, write articles, and reach readers without
          waiting for approval.
        </p>
        <p className="text-muted">
          Share what you know — travel notes, technical write-ups, essays, photo journals, anything
          you'd be proud to put your name on. Everything you publish goes live the moment you hit
          save.
        </p>
        <p className="text-muted">
          Before you join, please take 30 seconds to read our community rules.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2">
        <Highlight icon="pencil" label="Write freely" />
        <Highlight icon="users" label="Reach readers" />
        <Highlight icon="shield" label="Stay safe" />
      </div>

      <Button onClick={onContinue} size="lg" className="mt-4 w-full">
        Continue
      </Button>
    </div>
  );
}

function Highlight({ icon, label }: { icon: "pencil" | "users" | "shield"; label: string }) {
  return (
    <div className="rounded-2xl border border-token bg-surface px-3 py-3 text-center">
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--primary)]">
        {icon === "pencil" && (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
          </svg>
        )}
        {icon === "users" && (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )}
        {icon === "shield" && (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          </svg>
        )}
      </div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
    </div>
  );
}

function RulesStep({
  agreed,
  setAgreed,
  onBack,
  onContinue,
}: {
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {RULES.map((r, i) => (
          <li key={r.title} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--primary)] text-xs font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{r.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{r.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-token bg-surface px-4 py-3 transition-colors hover:bg-[color:var(--surface-2)]">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--primary)]"
        />
        <span className="text-sm leading-relaxed">
          I have read and agree to the rules above. I understand that breaking them can result in
          my account being banned without warning.
        </span>
      </label>

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          ← Back
        </Button>
        <Button onClick={onContinue} disabled={!agreed} size="lg" className="flex-[2]">
          I agree, continue
        </Button>
      </div>
    </div>
  );
}

function FormStep({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const checks = checkPassword(password);
  const allOk = checks.every((c) => c.pass);

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
      const res = await api<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ displayName, email, password, acceptedRules: true }),
      });
      setAuth(res);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Display name
        </span>
        <input
          required
          minLength={2}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="auth-input focus-quiet"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input focus-quiet"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Password
        </span>
        <PasswordInput
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched(true)}
          autoComplete="new-password"
        />
        {(password || touched) && (
          <ul className="mt-2 space-y-1">
            {checks.map((c) => (
              <li
                key={c.label}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  c.pass ? "text-[color:var(--primary)]" : touched && !password ? "text-[color:var(--alarm)]" : "text-muted"
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

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          ← Back
        </Button>
        <Button type="submit" size="lg" disabled={busy} className="flex-[2]">
          {busy ? "Creating…" : "Create account"}
        </Button>
      </div>
    </form>
  );
}
