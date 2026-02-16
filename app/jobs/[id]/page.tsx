"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Calculator,
  Loader2,
  Trash2,
  Pencil,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AuthGuard } from "@/components/shared/auth-guard";
import { CandidateTable } from "@/components/candidates/candidate-table";
import { CandidateFilters } from "@/components/candidates/candidate-filters";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/animations";
import { getJob, getCandidates, scoreCandidate, deleteJob } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { CANDIDATE_FIELDS, OPERATORS } from "@/lib/constants";
import type { Job, CandidateWithScore, QueryFilter } from "@/lib/types";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<CandidateWithScore[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [scoreProgress, setScoreProgress] = useState({ current: 0, total: 0, name: "" });
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const [jobData, candidatesData] = await Promise.all([
          getJob(jobId),
          getCandidates(jobId),
        ]);
        setJob(jobData);
        setCandidates(candidatesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  // Warn before refresh/close while scoring is in progress
  useEffect(() => {
    if (!scoring) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [scoring]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === sortedCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedCandidates.map((c) => c.id)));
    }
  };

  const handleScore = async () => {
    const toScore = selectedIds.size > 0
      ? candidates.filter((c) => selectedIds.has(c.id))
      : candidates;

    setScoring(true);
    setError(null);
    const total = toScore.length;
    setScoreProgress({ current: 0, total, name: "" });

    try {
      for (let i = 0; i < toScore.length; i++) {
        const c = toScore[i];
        setScoreProgress({ current: i + 1, total, name: c.name || "Unknown" });
        await scoreCandidate(jobId, c.id);
      }
      // Reload candidates with new scores
      const updated = await getCandidates(jobId);
      setCandidates(updated);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate scores");
    } finally {
      setScoring(false);
      setScoreProgress({ current: 0, total: 0, name: "" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job and all its candidates?")) return;
    setDeleting(true);
    try {
      await deleteJob(jobId);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
      setDeleting(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    // Text search
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch =
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.last_company?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Query filters
    for (const f of filters) {
      if (!f.value) continue; // skip empty filters

      let fieldValue: string | number | null | undefined;
      if (f.field === "score") {
        fieldValue = c.score?.total_score ?? null;
      } else if (f.field === "source") {
        fieldValue = c.source;
      } else {
        fieldValue = (c as unknown as Record<string, unknown>)[f.field] as string | number | null;
      }

      if (fieldValue == null) return false;

      if (f.operator === "gte") {
        if (Number(fieldValue) < Number(f.value)) return false;
      } else if (f.operator === "lte") {
        if (Number(fieldValue) > Number(f.value)) return false;
      } else if (f.operator === "eq") {
        if (String(fieldValue).toLowerCase() !== String(f.value).toLowerCase()) return false;
      } else if (f.operator === "contains") {
        if (!String(fieldValue).toLowerCase().includes(String(f.value).toLowerCase())) return false;
      }
    }

    return true;
  });

  // Sort by score descending if scores exist
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    const scoreA = a.score?.total_score ?? -1;
    const scoreB = b.score?.total_score ?? -1;
    return scoreB - scoreA;
  });

  const getFieldLabel = (field: string) =>
    CANDIDATE_FIELDS.find((f) => f.value === field)?.label || field;
  const getOperatorLabel = (op: string) =>
    OPERATORS.find((o) => o.value === op)?.label || op;

  if (loading) {
    return (
      <AuthGuard>
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </AuthGuard>
    );
  }

  if (!job) {
    return (
      <AuthGuard>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            Job not found
          </div>
        </main>
        <Footer />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
                  {job.title}
                </span>
              </h1>
              {job.description && (
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {job.description}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Created {formatDate(job.created_at)} · Scoring: 60% criteria + 40% AI relevance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/jobs/${jobId}/edit`}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:border-red-300 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Requirements */}
        {job.requirements && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5"
          >
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Technical Requirements
              <span className="ml-2 text-xs font-normal text-zinc-500">
                (40% of score — AI-evaluated)
              </span>
            </h3>
            <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
              {job.requirements}
            </p>
          </motion.div>
        )}

        {/* Criteria */}
        {job.criteria.length > 0 && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5"
          >
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Scoring Criteria
              <span className="ml-2 text-xs font-normal text-zinc-500">
                (60% of score)
              </span>
            </h3>
            <div className="space-y-2">
              {job.criteria.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2 text-sm"
                >
                  <span className="text-foreground">
                    {getFieldLabel(c.field)} {getOperatorLabel(c.operator)}{" "}
                    <span className="font-medium">{c.value}</span>
                  </span>
                  <span className="text-xs text-zinc-500">{c.weight}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <motion.div variants={scaleIn}>
            <Link
              href={`/jobs/${jobId}/upload`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              <Upload className="h-4 w-4" />
              Upload CVs
            </Link>
          </motion.div>

          {selectedIds.size > 0 && (
            <motion.div variants={scaleIn}>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-500 transition-all hover:border-red-300 hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
                Clear selection ({selectedIds.size})
              </button>
            </motion.div>
          )}

          <motion.div variants={scaleIn}>
            <button
              onClick={handleScore}
              disabled={scoring || candidates.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-secondary/30 hover:bg-secondary/10 hover:text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              {selectedIds.size > 0
                ? `Score Selected (${selectedIds.size})`
                : "Calculate All Scores"}
            </button>
          </motion.div>
        </motion.div>

        {/* Scoring Progress */}
        {scoring && scoreProgress.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground">
                Scoring <span className="font-medium">{scoreProgress.name}</span>
              </p>
              <p className="text-xs text-zinc-500">
                {scoreProgress.current} / {scoreProgress.total}
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(scoreProgress.current / scoreProgress.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Candidates */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Candidates ({sortedCandidates.length !== candidates.length
                ? `${sortedCandidates.length} / ${candidates.length}`
                : candidates.length})
            </h2>
          </div>

          {candidates.length > 0 && (
            <CandidateFilters
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              onFiltersChange={setFilters}
            />
          )}

          <CandidateTable
            candidates={sortedCandidates}
            experienceField="related_experience"
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleAll={handleToggleAll}
          />
        </div>
      </main>
      <Footer />
    </AuthGuard>
  );
}
