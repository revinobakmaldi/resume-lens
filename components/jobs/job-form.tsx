"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { fadeInUp } from "@/lib/animations";
import { createJob } from "@/lib/api";
import { CriteriaBuilder } from "./criteria-builder";
import { useRouter } from "next/navigation";
import type { Criterion } from "@/lib/types";

export function JobForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isValid = title.trim() && requirements.trim() && criteria.length > 0 && totalWeight === 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);

    try {
      const job = await createJob({
        title: title.trim(),
        description: description.trim() || undefined,
        requirements: requirements.trim(),
        criteria,
      });
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Job Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Data Analyst"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-foreground placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief job description..."
          rows={3}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-foreground placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Technical Requirements
        </label>
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="e.g. Proficient in Python and SQL, experience with data visualization tools (Tableau/Power BI), knowledge of statistical modeling, familiarity with cloud platforms (AWS/GCP)..."
          rows={5}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-foreground placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          AI will evaluate each candidate&apos;s resume against these requirements (40% of total score).
        </p>
      </div>

      <CriteriaBuilder criteria={criteria} onChange={setCriteria} />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      <button
        type="submit"
        disabled={loading || !isValid}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating...
          </span>
        ) : (
          "Create Job"
        )}
      </button>
    </motion.form>
  );
}
