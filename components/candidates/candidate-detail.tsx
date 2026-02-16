"use client";

import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  Clock,
  FileText,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { ScoreBadge } from "./score-badge";
import type { CandidateWithScore } from "@/lib/types";

interface CandidateDetailProps {
  candidate: CandidateWithScore;
}

export function CandidateDetail({ candidate }: CandidateDetailProps) {
  const fields = [
    { icon: User, label: "Name", value: candidate.name },
    { icon: Mail, label: "Email", value: candidate.email },
    { icon: Phone, label: "Phone", value: candidate.phone },
    { icon: User, label: "Gender", value: candidate.gender },
    { icon: User, label: "Age", value: candidate.age ? `${candidate.age} years` : null },
    { icon: GraduationCap, label: "Education", value: candidate.last_education },
    { icon: Building2, label: "Last Company", value: candidate.last_company },
    {
      icon: Clock,
      label: "Total Experience",
      value: candidate.total_experience != null ? `${candidate.total_experience} years` : null,
    },
    {
      icon: Clock,
      label: "Related Experience",
      value: candidate.related_experience != null ? `${candidate.related_experience} years` : null,
    },
    { icon: FileText, label: "Source", value: candidate.source ?? null },
    { icon: FileText, label: "PDF File", value: candidate.pdf_filename ?? null },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Scores by Job */}
      {candidate.job_scores && candidate.job_scores.length > 0 && (
        <motion.div
          variants={fadeInUp}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6"
        >
          <h3 className="mb-4 font-semibold text-foreground">Scores by Job</h3>
          <div className="space-y-4">
            {candidate.job_scores.map((js) => (
              <div
                key={js.id}
                className="rounded-lg bg-zinc-50 dark:bg-zinc-800/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/jobs/${js.job_id}`}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                    {js.job_title || "Unknown Job"}
                  </Link>
                  <ScoreBadge score={js.total_score} size="lg" />
                </div>
                {js.breakdown && Object.keys(js.breakdown).length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {Object.entries(js.breakdown).map(([field, score]) => (
                      <div
                        key={field}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-zinc-600 dark:text-zinc-400 capitalize">
                          {field.replace(/_/g, " ")}
                        </span>
                        <ScoreBadge score={score as number} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info */}
      <motion.div
        variants={fadeInUp}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6"
      >
        <h3 className="mb-4 font-semibold text-foreground">
          Candidate Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {label}
                </p>
                <p className="text-sm text-foreground">{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Raw text */}
      {candidate.raw_text && (
        <motion.div
          variants={fadeInUp}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6"
        >
          <h3 className="mb-4 font-semibold text-foreground">
            Extracted Text
          </h3>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {candidate.raw_text}
          </pre>
        </motion.div>
      )}
    </motion.div>
  );
}
