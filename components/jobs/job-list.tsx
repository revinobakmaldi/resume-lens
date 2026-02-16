"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animations";
import { JobCard } from "./job-card";
import type { Job } from "@/lib/types";

interface JobListProps {
  jobs: Job[];
}

export function JobList({ jobs }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">
          No jobs yet. Create your first job to get started.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </motion.div>
  );
}
