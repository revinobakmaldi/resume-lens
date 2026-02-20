"use client";

import { useState } from "react";
import { Share2, Copy, Check, Link2, Link2Off, Loader2, X } from "lucide-react";
import { generateShareToken, revokeShareToken } from "@/lib/api";

interface ShareButtonProps {
  jobId: string;
  initialToken: string | null;
}

export function ShareButton({ jobId, initialToken }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareUrl =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/share/${token}`
      : "";

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateShareToken(jobId);
      setToken(result.share_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Revoke this share link? Anyone with the current link will lose access.")) return;
    setLoading(true);
    setError(null);
    try {
      await revokeShareToken(jobId);
      setToken(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
        title="Share job"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Share Job</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              Generate a read-only link to share this job posting and its candidate rankings with anyone — no login required.
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {token ? (
              <div className="space-y-3">
                {/* Share URL field */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 font-mono truncate">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Regenerate */}
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    New link
                  </button>

                  {/* Revoke */}
                  <button
                    onClick={handleRevoke}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:border-red-300 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2Off className="h-4 w-4" />
                    )}
                    Revoke link
                  </button>
                </div>

                <p className="text-xs text-zinc-400 text-center">
                  Anyone with this link can view the job and candidate rankings.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Link2 className="h-6 w-6 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No share link yet</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Generate a link to share a read-only view with stakeholders.
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Generate Share Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
