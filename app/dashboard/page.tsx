"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Briefcase, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AuthGuard } from "@/components/shared/auth-guard";
import { JobList } from "@/components/jobs/job-list";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/animations";
import { getJobs, getCandidates } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jobsData, candidatesData] = await Promise.all([
          getJobs(),
          getCandidates(),
        ]);
        setJobs(jobsData);
        setTotalCandidates(candidatesData.length);
      } catch {
        // Silently handle — empty state will show
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage jobs and review candidate applications.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <motion.div
                variants={scaleIn}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {jobs.length}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Active Jobs
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={scaleIn}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-secondary/10 p-2.5">
                    <Users className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {totalCandidates}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Total Candidates
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Actions */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Jobs</h2>
              <Link
                href="/jobs/new"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" />
                New Job
              </Link>
            </div>

            {/* Job list */}
            <JobList jobs={jobs} />
          </>
        )}
      </main>
      <Footer />
    </AuthGuard>
  );
}
