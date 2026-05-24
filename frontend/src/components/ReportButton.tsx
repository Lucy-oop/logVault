"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ReportReason } from "@/types/api";

const REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "Spam", label: "Spam or scam", hint: "SEO spam, affiliate dumps, phishing." },
  { value: "Harassment", label: "Harassment or hate", hint: "Targeted attacks, slurs, threats." },
  { value: "Illegal", label: "Illegal content", hint: "Weapons, CSAM, doxxing, fraud." },
  { value: "Misinformation", label: "Misinformation", hint: "Knowingly false or dangerous claims." },
  { value: "Other", label: "Other", hint: "Tell us more in the details below." },
];

export function ReportButton({
  postId,
  postTitle,
  authorId,
}: {
  postId: string;
  postTitle: string;
  authorId: string;
}) {
  const { user, token } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("Spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!user || user.id === authorId) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (reason === "Other" && !details.trim()) {
      toast.error("Please add a short note explaining the issue.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/reports", {
        method: "POST",
        body: JSON.stringify({ postId, reason, details: details.trim() }),
        token,
      });
      toast.success("Report submitted. An admin will review shortly.");
      setOpen(false);
      setReason("Spam");
      setDetails("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report this post"
        title="Report this post"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-token bg-surface px-3.5 text-xs font-semibold text-muted transition-all hover:-translate-y-px hover:border-[color:var(--alarm)] hover:text-[color:var(--alarm)]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 21V4h12l-2 4 2 4H4" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 animate-fade-in">
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-transparent"
          />
          <div
            className="relative w-full max-w-md rounded-3xl border bg-surface p-6 shadow-soft-lg animate-slide-up"
            style={{
              borderColor: "color-mix(in srgb, var(--alarm) 25%, var(--border))",
            }}
          >
            <header className="mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--alarm)]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--alarm)]">
                Report
              </span>
              <h3 className="mt-2 font-display text-fluid-xl font-bold leading-tight">
                What's wrong with this post?
              </h3>
              <p className="mt-1 truncate text-xs text-muted">"{postTitle}"</p>
            </header>

            <form onSubmit={submit} className="space-y-4">
              <fieldset className="space-y-2">
                {REASONS.map((r) => {
                  const active = reason === r.value;
                  return (
                    <label
                      key={r.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors",
                        active
                          ? "border-[color:var(--alarm)] bg-[color:var(--alarm)]/5"
                          : "border-token hover:bg-[color:var(--surface-2)]"
                      )}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={active}
                        onChange={() => setReason(r.value)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--alarm)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{r.label}</span>
                        <span className="block text-xs text-muted">{r.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Details {reason === "Other" ? "(required)" : "(optional)"}
                </span>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Add anything the admin should know."
                  className="w-full resize-y rounded-xl border border-token bg-[color:var(--bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--alarm)]"
                />
                <span className="mt-1 block text-[10px] text-muted">{details.length}/500</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={busy}>
                  {busy ? "Submitting…" : "Submit report"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
