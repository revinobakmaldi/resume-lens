"use client";

import { motion } from "framer-motion";
import { FileText, Loader2, CheckCircle2, XCircle, Save } from "lucide-react";
import type { UploadItem } from "@/lib/types";

interface UploadProgressProps {
  items: UploadItem[];
}

const statusConfig = {
  pending: { icon: FileText, color: "text-zinc-400", label: "Pending" },
  parsing: { icon: Loader2, color: "text-secondary", label: "Parsing..." },
  parsed: { icon: CheckCircle2, color: "text-primary", label: "Parsed" },
  saving: { icon: Save, color: "text-secondary", label: "Saving..." },
  saved: { icon: CheckCircle2, color: "text-primary", label: "Saved" },
  error: { icon: XCircle, color: "text-red-400", label: "Error" },
};

export function UploadProgress({ items }: UploadProgressProps) {
  const completed = items.filter((i) => i.status === "saved").length;
  const errors = items.filter((i) => i.status === "error").length;
  const total = items.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">
          Progress: {completed}/{total} saved
          {errors > 0 && `, ${errors} errors`}
        </span>
        <span className="text-zinc-500">
          {Math.round(((completed + errors) / total) * 100)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${((completed + errors) / total) * 100}%`,
          }}
          className="h-full rounded-full bg-primary"
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* File list */}
      <div className="max-h-60 space-y-1 overflow-y-auto">
        {items.map((item, index) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          const isSpinning = item.status === "parsing" || item.status === "saving";

          return (
            <div
              key={index}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/30"
            >
              <span className="truncate text-foreground">{item.file.name}</span>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <Icon
                  className={`h-3.5 w-3.5 ${config.color} ${
                    isSpinning ? "animate-spin" : ""
                  }`}
                />
                <span className={`text-xs ${config.color}`}>
                  {item.status === "error" ? item.error : config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
