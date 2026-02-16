"use client";

import { motion } from "framer-motion";
import { Briefcase, Users, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fadeInUp } from "@/lib/animations";
import { formatDate } from "@/lib/utils";
import type { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
  candidateCount?: number;
}

export function JobCard({ job, candidateCount }: JobCardProps) {
  const router = useRouter();

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/jobs/${job.id}/edit`);
  };

  return (
    <motion.div variants={fadeInUp}>
      <Link
        href={`/jobs/${job.id}`}
        className="group flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 transition-all hover:border-primary/30 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            {job.description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1">
                {job.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{formatDate(job.created_at)}</span>
              <span>{job.criteria.length} criteria</span>
              {candidateCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {candidateCount} candidates
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ChevronRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </Link>
    </motion.div>
  );
}
