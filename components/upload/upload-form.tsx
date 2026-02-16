"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { fadeInUp } from "@/lib/animations";
import { parseResume, createCandidate } from "@/lib/api";
import { SOURCE_OPTIONS } from "@/lib/constants";
import { PdfDropzone } from "./pdf-dropzone";
import { UploadProgress } from "./upload-progress";
import { ParseResultPreview } from "./parse-result-preview";
import type { UploadItem } from "@/lib/types";

interface UploadFormProps {
  jobId: string;
  onComplete?: () => void;
}

export function UploadForm({ jobId, onComplete }: UploadFormProps) {
  const [source, setSource] = useState("");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelect = useCallback((files: File[]) => {
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({ file, status: "pending" as const })),
    ]);
  }, []);

  const updateItem = (index: number, updates: Partial<UploadItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const processAll = async () => {
    setProcessing(true);
    setError(null);

    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "pending") continue;

      // Parse
      updateItem(i, { status: "parsing" });
      try {
        const parsed = await parseResume(items[i].file, jobId, source || undefined);
        updateItem(i, { status: "parsed", parsed });

        // Save
        updateItem(i, { status: "saving" });
        await createCandidate({
          job_id: jobId,
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone,
          gender: parsed.gender,
          age: parsed.age,
          last_education: parsed.last_education,
          last_company: parsed.last_company,
          total_experience: parsed.total_experience,
          related_experience: parsed.related_experience,
          source: source || null,
          raw_text: (parsed as unknown as Record<string, unknown>).raw_text as string | null,
          pdf_filename: (parsed as unknown as Record<string, unknown>).pdf_filename as string | null,
        });
        updateItem(i, { status: "saved" });
      } catch (err) {
        updateItem(i, {
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    setProcessing(false);
    onComplete?.();
  };

  const hasPending = items.some((i) => i.status === "pending");
  const allDone = items.length > 0 && items.every((i) => i.status === "saved" || i.status === "error");

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Source selector */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Source (optional)
        </label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select source...</option>
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <PdfDropzone
        onFilesSelect={handleFilesSelect}
        disabled={processing}
      />

      {/* Progress */}
      {items.length > 0 && <UploadProgress items={items} />}

      {/* Parsed previews */}
      {items
        .filter((i) => i.status === "saved" && i.parsed)
        .map((item, index) => (
          <ParseResultPreview
            key={index}
            parsed={item.parsed!}
            filename={item.file.name}
          />
        ))}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Process button */}
      {hasPending && (
        <button
          onClick={processAll}
          disabled={processing}
          className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing
            ? "Processing..."
            : `Parse & Save ${items.filter((i) => i.status === "pending").length} Resume(s)`}
        </button>
      )}

      {allDone && (
        <p className="text-center text-sm text-primary">
          All files processed. You can upload more or go back to the job.
        </p>
      )}
    </motion.div>
  );
}
