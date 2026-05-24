"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { estimateReadMinutes } from "@/lib/utils";
import type { CreatePostRequest, PostDetail, TagResponse, UploadResponse } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5046";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type EditArticleModalProps = {
  open: boolean;
  mode: "new" | "edit";
  initial?: PostDetail | null;
  busy?: boolean;
  error?: string | null;
  onSubmit: (data: CreatePostRequest) => void | Promise<void>;
  onClose: () => void;
};

export function EditArticleModal({
  open,
  mode,
  initial,
  busy,
  error,
  onSubmit,
  onClose,
}: EditArticleModalProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [knownTags, setKnownTags] = useState<TagResponse[]>([]);
  const [tagSuggestionsOpen, setTagSuggestionsOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saved" | "saving">("idle");
  const initialSnapshotRef = useRef<string>("");

  const draftKey = mode === "new" ? "blogfox.draft.new" : initial?.id ? `blogfox.draft.${initial.id}` : null;

  // Stats
  const wordCount = useMemo(() => content.trim() ? content.trim().split(/\s+/).length : 0, [content]);
  const readMinutes = estimateReadMinutes(wordCount);

  // Tag suggestions
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const tags = await api<TagResponse[]>("/api/tags");
        setKnownTags(tags);
      } catch { /* swallow */ }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setSlug(initial?.slug ?? "");
    setExcerpt(initial?.excerpt ?? "");
    setCoverImageUrl(initial?.coverImageUrl ?? "");
    setContent(initial?.contentMarkdown ?? "");
    setTagsInput(initial?.tags?.join(", ") ?? "");
    initialSnapshotRef.current = JSON.stringify({
      t: initial?.title ?? "",
      s: initial?.slug ?? "",
      e: initial?.excerpt ?? "",
      c: initial?.contentMarkdown ?? "",
      ci: initial?.coverImageUrl ?? "",
      tg: initial?.tags?.join(", ") ?? "",
    });
    setDraftStatus("idle");

    // Restore a saved draft if one exists for this key
    if (draftKey) {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const d = JSON.parse(raw);
          if (typeof d.title === "string" && d.title) setTitle(d.title);
          if (typeof d.slug === "string") setSlug(d.slug);
          if (typeof d.excerpt === "string") setExcerpt(d.excerpt);
          if (typeof d.coverImageUrl === "string") setCoverImageUrl(d.coverImageUrl);
          if (typeof d.content === "string") setContent(d.content);
          if (typeof d.tagsInput === "string") setTagsInput(d.tagsInput);
          setDraftStatus("saved");
        }
      } catch { /* swallow */ }
    }
  }, [open, initial, draftKey]);

  // Auto-save to localStorage (debounced 500ms)
  useEffect(() => {
    if (!open || !draftKey) return;
    const snap = JSON.stringify({ t: title, s: slug, e: excerpt, c: content, ci: coverImageUrl, tg: tagsInput });
    if (snap === initialSnapshotRef.current) return;
    setDraftStatus("saving");
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, slug, excerpt, coverImageUrl, content, tagsInput, at: Date.now() }));
        setDraftStatus("saved");
      } catch { /* swallow */ }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [open, draftKey, title, slug, excerpt, coverImageUrl, content, tagsInput]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleUpload(file: File) {
    setUploadError(null);
    if (!token) {
      setUploadError("Sign in required to upload.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Please pick an image file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(`File too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB).`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/uploads`, {
        method: "POST",
        body: fd,
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as UploadResponse;
      setCoverImageUrl(`${API_BASE}${data.url}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function submitWith(status: "Published" | "Pending") {
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    if (draftKey) {
      try { localStorage.removeItem(draftKey); } catch { /* swallow */ }
    }
    onSubmit({
      title,
      slug: slug.trim() || undefined,
      excerpt: excerpt || undefined,
      contentMarkdown: content,
      coverImageUrl: coverImageUrl || null,
      status,
      publishedAt: null,
      tags,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Default Enter-key submit is "Publish" for new posts and "Save changes" for edits.
    submitWith("Published");
  }

  return (
    <div className="modal-aurora fixed inset-0 z-50 animate-fade-in">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-transparent"
      />

      <div
        className="relative mx-auto mt-[5vh] flex max-h-[90vh] w-[min(960px,calc(100%-2rem))] flex-col overflow-hidden rounded-3xl border animate-slide-up"
        style={{
          background: "color-mix(in srgb, var(--surface) 88%, transparent)",
          backdropFilter: "saturate(180%) blur(22px)",
          WebkitBackdropFilter: "saturate(180%) blur(22px)",
          borderColor: "color-mix(in srgb, var(--primary) 30%, var(--border))",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.55), 0 0 0 1px color-mix(in srgb, var(--primary) 18%, transparent)",
        }}
      >
        <header className="flex items-center justify-between border-b px-7 py-5"
          style={{ borderColor: "color-mix(in srgb, var(--border) 70%, transparent)" }}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">
              LogVault
            </span>
            <h2 className="mt-2 font-display text-fluid-2xl font-bold leading-tight">
              {mode === "new" ? "New article" : "Edit article"}
            </h2>
            {draftStatus !== "idle" && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted">
                {draftStatus === "saving" ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--primary)]" />
                    Saving draft…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-[color:var(--primary)]" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5 9-12" />
                    </svg>
                    Draft saved locally
                  </>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-full border border-token text-muted transition-all hover:-translate-y-px hover:border-[color:var(--text)] hover:text-[color:var(--text)]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <Field label="Title">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="URL slug" hint="Leave blank to auto-generate from title.">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-post-title"
                className="input"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Short summary">
                <input
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="input"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Cover image">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://… or upload below"
                      className="input flex-1"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading…" : "Choose file"}
                    </Button>
                  </div>
                  {uploadError && (
                    <p className="rounded-lg bg-[color:var(--alarm)]/10 px-3 py-1.5 text-xs text-[color:var(--alarm)]">
                      {uploadError}
                    </p>
                  )}
                  {coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImageUrl}
                      alt=""
                      className="mt-1 max-h-40 w-full rounded-xl border border-token object-cover"
                    />
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div className="border-t border-token px-6 py-5">
            <Field label="Article content">
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder="Write your post here. Markdown supported (## heading, **bold**, [links](#), `code`)."
                className="input min-h-[280px] resize-y leading-relaxed"
                style={{ fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif" }}
              />
            </Field>
            <p className="mt-1.5 text-[11px] text-muted">
              {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"} · ~{readMinutes} min read
            </p>
            <div className="mt-4">
              <TagInput
                value={tagsInput}
                onChange={setTagsInput}
                knownTags={knownTags}
                open={tagSuggestionsOpen}
                setOpen={setTagSuggestionsOpen}
              />
            </div>
          </div>

          {error && (
            <p className="mx-6 mb-4 rounded-xl bg-[color:var(--alarm)]/10 px-4 py-3 text-sm text-[color:var(--alarm)]">
              {error}
            </p>
          )}

          <footer
            className="flex flex-wrap items-center justify-end gap-2 border-t px-7 py-4"
            style={{
              borderColor: "color-mix(in srgb, var(--border) 70%, transparent)",
              background: "color-mix(in srgb, var(--surface) 50%, transparent)",
            }}
          >
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {mode === "new" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => submitWith("Pending")}
                >
                  Save as draft
                </Button>
                <Button type="submit" variant="primary" disabled={busy}>
                  {busy ? "Saving…" : "Publish post"}
                </Button>
              </>
            ) : initial?.status === "Pending" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => submitWith("Pending")}
                >
                  Save draft
                </Button>
                <Button type="submit" variant="primary" disabled={busy}>
                  {busy ? "Saving…" : "Publish now"}
                </Button>
              </>
            ) : (
              <Button type="submit" variant="primary" disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </Button>
            )}
          </footer>
        </form>
      </div>

      <style jsx global>{`
        /* Inputs inside the article modal */
        .modal-aurora .input {
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
        .modal-aurora .input:focus {
          border-color: color-mix(in srgb, var(--text) 35%, transparent);
        }

        /* Aurora background for the modal backdrop */
        .modal-aurora::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background-color: var(--bg);
          background-image:
            radial-gradient(circle at center,
              color-mix(in srgb, var(--primary) 45%, transparent),
              transparent 55%),
            radial-gradient(circle at center,
              color-mix(in srgb, var(--accent) 50%, transparent),
              transparent 55%),
            radial-gradient(circle at center,
              color-mix(in srgb, var(--primary-hover) 35%, transparent),
              transparent 60%);
          background-size: 90% 90%, 80% 80%, 65% 65%;
          background-repeat: no-repeat;
          background-position: 5% 15%, 90% 85%, 50% 55%;
          animation: modal-aurora-drift 22s ease-in-out infinite alternate;
        }
        @keyframes modal-aurora-drift {
          0%   { background-position: 5% 15%, 90% 85%, 50% 55%; }
          50%  { background-position: 40% 50%, 55% 25%, 75% 75%; }
          100% { background-position: 65% 10%, 25% 70%, 30% 30%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .modal-aurora::before { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--primary)]">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function TagInput({
  value,
  onChange,
  knownTags,
  open,
  setOpen,
}: {
  value: string;
  onChange: (v: string) => void;
  knownTags: TagResponse[];
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Active token = whatever's between the last comma and the cursor end
  const tokens = value.split(",");
  const last = (tokens[tokens.length - 1] ?? "").trim().toLowerCase();
  const usedSet = new Set(
    tokens
      .slice(0, -1)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  );

  const suggestions = knownTags
    .filter(
      (t) =>
        t.name.toLowerCase() !== last &&
        !usedSet.has(t.name.toLowerCase()) &&
        (last === "" || t.name.toLowerCase().startsWith(last))
    )
    .slice(0, 6);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, setOpen]);

  function pick(tagName: string) {
    const parts = value.split(",");
    parts[parts.length - 1] = ` ${tagName}`;
    const next = parts.join(",").replace(/^,\s*/, "").replace(/\s+,/g, ",");
    onChange(next.trim() ? `${next.trim()}, ` : "");
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Field label="Tags (comma separated)">
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="travel, photography"
          className="input"
          autoComplete="off"
        />
      </Field>
      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-44 overflow-y-auto rounded-2xl border border-token bg-surface shadow-soft-lg"
        >
          <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Suggestions
          </p>
          <ul className="py-1">
            {suggestions.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => pick(t.name)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[color:var(--surface-2)]"
                >
                  <span>#{t.name}</span>
                  <span className="text-xs text-muted">{t.postCount} {t.postCount === 1 ? "post" : "posts"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
