"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { ScoreBadge } from "./score-badge";
import type { CandidateWithScore } from "@/lib/types";

interface CandidateTableProps {
  candidates: CandidateWithScore[];
  showJobLink?: boolean;
}

export function CandidateTable({ candidates, showJobLink }: CandidateTableProps) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">No candidates found.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Name
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Email
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Education
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Experience
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Company
            </th>
            {showJobLink && (
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                Job
              </th>
            )}
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Score
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate, index) => (
            <motion.tr
              key={candidate.id}
              variants={fadeInUp}
              className="border-b border-zinc-100 dark:border-zinc-800/50 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/candidates/${candidate.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  {candidate.name || "—"}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {candidate.email || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {candidate.last_education || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {candidate.total_experience != null
                  ? `${candidate.total_experience}y`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {candidate.last_company || "—"}
              </td>
              {showJobLink && (
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {candidate.score_job_title ? (
                    <Link
                      href={`/jobs/${candidate.score?.job_id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {candidate.score_job_title}
                    </Link>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
              )}
              <td className="px-4 py-3">
                {candidate.score ? (
                  <ScoreBadge score={candidate.score.total_score} size="sm" />
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/candidates/${candidate.id}/edit`}
                  className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
