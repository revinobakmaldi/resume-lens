"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ScanSearch, AlertCircle, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { CandidateTable } from "@/components/candidates/candidate-table";
import { fadeInUp } from "@/lib/animations";
import { getSharedJob } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { CANDIDATE_FIELDS, OPERATORS } from "@/lib/constants";
import type { SharedJobData } from "@/lib/api";

export default function ShareJobPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<SharedJobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getSharedJob(token);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const getFieldLabel = (field: string) =>
    CANDIDATE_FIELDS.find((f) => f.value === field)?.label || field;
  const getOperatorLabel = (op: string) =>
    OPERATORS.find((o) => o.value === op)?.label || op;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Minimal Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">ResumeLens</span>
          </Link>
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-500">
            <Lock className="h-3 w-3" />
            Read-only view
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {loading && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && error && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Link unavailable</h1>
              <p className="mt-1 text-sm text-zinc-500">{error}</p>
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Job Header */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mb-6"
            >
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
                  {data.job.title}
                </span>
              </h1>
              {data.job.description && (
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {data.job.description}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Posted {formatDate(data.job.created_at)} · Scoring: 60% criteria + 40% AI relevance
              </p>
            </motion.div>

            {/* Requirements */}
            {data.job.requirements && (
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
                  {data.job.requirements}
                </p>
              </motion.div>
            )}

            {/* Criteria */}
            {data.job.criteria.length > 0 && (
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
                  {data.job.criteria.map((c, i) => (
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

            {/* Candidates */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Candidates ({data.candidates.length})
              </h2>

              <CandidateTable
                candidates={data.candidates}
                experienceField="related_experience"
                readOnly
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800 py-6 text-center">
        <p className="text-xs text-zinc-400">
          Powered by{" "}
          <Link href="/" className="text-primary hover:underline">
            ResumeLens
          </Link>
        </p>
      </footer>
    </div>
  );
}
