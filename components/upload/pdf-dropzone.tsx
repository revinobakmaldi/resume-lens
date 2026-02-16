"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { fadeInUp } from "@/lib/animations";
import { formatBytes } from "@/lib/utils";

interface PdfDropzoneProps {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file

export function PdfDropzone({ onFilesSelect, disabled }: PdfDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const valid: File[] = [];

      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          setError("Only PDF files are supported.");
          return;
        }
        if (file.size > MAX_SIZE) {
          setError(`${file.name} is too large (${formatBytes(file.size)}). Max 10MB.`);
          return;
        }
        if (file.size === 0) {
          setError(`${file.name} is empty.`);
          return;
        }
        valid.push(file);
      }

      if (valid.length > 0) onFilesSelect(valid);
    },
    [onFilesSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      validateAndSelect(e.dataTransfer.files);
    },
    [disabled, validateAndSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) validateAndSelect(files);
    };
    input.click();
  }, [disabled, validateAndSelect]);

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-zinc-300 dark:border-zinc-700 hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={`rounded-2xl p-4 transition-colors ${
              isDragging
                ? "bg-primary/20"
                : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary/10"
            }`}
          >
            {isDragging ? (
              <FileText className="h-10 w-10 text-primary" />
            ) : (
              <Upload className="h-10 w-10 text-zinc-400 dark:text-zinc-500 group-hover:text-primary" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              {isDragging
                ? "Drop your PDFs here"
                : "Drop PDF resumes here or click to browse"}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              PDF files up to 10MB each. Multiple files supported.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}
    </motion.div>
  );
}
