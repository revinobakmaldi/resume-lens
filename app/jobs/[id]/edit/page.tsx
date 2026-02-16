"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AuthGuard } from "@/components/shared/auth-guard";
import { JobForm } from "@/components/jobs/job-form";
import { fadeInUp } from "@/lib/animations";
import { getJob } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function EditJobPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getJob(jobId);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

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

  if (error || !job) {
    return (
      <AuthGuard>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            {error || "Job not found"}
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
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Link
            href={`/jobs/${jobId}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Job
          </Link>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
              Edit Job
            </span>
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Update job details and scoring criteria.
          </p>
        </motion.div>

        <JobForm initialData={job} jobId={jobId} />
      </main>
      <Footer />
    </AuthGuard>
  );
}
