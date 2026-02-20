"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { ScoreBadge } from "./score-badge";
import type { CandidateWithScore } from "@/lib/types";

type SortField = "name" | "email" | "education" | "experience" | "company" | "score";
type SortDirection = "asc" | "desc";

interface CandidateTableProps {
  candidates: CandidateWithScore[];
  showJobLink?: boolean;
  experienceField?: "total_experience" | "related_experience";
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleAll?: () => void;
  readOnly?: boolean;
}

export function CandidateTable({ candidates, showJobLink, experienceField = "total_experience", selectedIds, onToggleSelect, onToggleAll, readOnly }: CandidateTableProps) {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const selectable = !!selectedIds && !!onToggleSelect && !!onToggleAll;

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      let valA: string | number | null | undefined;
      let valB: string | number | null | undefined;

      switch (sortField) {
        case "name":
          valA = a.name?.toLowerCase();
          valB = b.name?.toLowerCase();
          break;
        case "email":
          valA = a.email?.toLowerCase();
          valB = b.email?.toLowerCase();
          break;
        case "education":
          valA = a.last_education?.toLowerCase();
          valB = b.last_education?.toLowerCase();
          break;
        case "experience":
          valA = a[experienceField];
          valB = b[experienceField];
          break;
        case "company":
          valA = a.last_company?.toLowerCase();
          valB = b.last_company?.toLowerCase();
          break;
        case "score":
          valA = a.score?.total_score;
          valB = b.score?.total_score;
          break;
      }

      // Nulls always go to the bottom
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let cmp: number;
      if (typeof valA === "number" && typeof valB === "number") {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [candidates, sortField, sortDirection, experienceField]);

  const allSelected = selectable && sortedCandidates.length > 0 && sortedCandidates.every((c) => selectedIds!.has(c.id));

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">No candidates found.</p>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="inline h-3.5 w-3.5 ml-0.5" />
    ) : (
      <ChevronDown className="inline h-3.5 w-3.5 ml-0.5" />
    );
  };

  const thClass = "px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none hover:text-foreground transition-colors";

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
            {selectable && (
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-primary focus:ring-primary/50 cursor-pointer accent-[hsl(var(--primary))]"
                />
              </th>
            )}
            <th className={thClass} onClick={() => handleSort("name")}>
              Name<SortIcon field="name" />
            </th>
            <th className={thClass} onClick={() => handleSort("email")}>
              Email<SortIcon field="email" />
            </th>
            <th className={thClass} onClick={() => handleSort("education")}>
              Education<SortIcon field="education" />
            </th>
            <th className={thClass} onClick={() => handleSort("experience")}>
              {experienceField === "related_experience" ? "Related Exp." : "Experience"}<SortIcon field="experience" />
            </th>
            <th className={thClass} onClick={() => handleSort("company")}>
              Company<SortIcon field="company" />
            </th>
            {showJobLink && (
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                Job
              </th>
            )}
            <th className={thClass} onClick={() => handleSort("score")}>
              Score<SortIcon field="score" />
            </th>
            {!readOnly && (
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedCandidates.map((candidate) => (
            <motion.tr
              key={candidate.id}
              variants={fadeInUp}
              className={`border-b border-zinc-100 dark:border-zinc-800/50 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${selectable && selectedIds!.has(candidate.id) ? "bg-primary/5 dark:bg-primary/10" : ""}`}
            >
              {selectable && (
                <td className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds!.has(candidate.id)}
                    onChange={() => onToggleSelect!(candidate.id)}
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-primary focus:ring-primary/50 cursor-pointer accent-[hsl(var(--primary))]"
                  />
                </td>
              )}
              <td className="px-4 py-3">
                <Link
                  href={`/candidates/${candidate.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  {candidate.name || "\u2014"}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {candidate.email || "\u2014"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {candidate.last_education || "\u2014"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {candidate[experienceField] != null
                  ? `${candidate[experienceField]}y`
                  : "\u2014"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {candidate.last_company || "\u2014"}
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
                    <span className="text-zinc-400">{"\u2014"}</span>
                  )}
                </td>
              )}
              <td className="px-4 py-3">
                {candidate.score ? (
                  <ScoreBadge score={candidate.score.total_score} size="sm" />
                ) : (
                  <span className="text-zinc-400">{"\u2014"}</span>
                )}
              </td>
              {!readOnly && (
                <td className="px-4 py-3">
                  <Link
                    href={`/candidates/${candidate.id}/edit`}
                    className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
