"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AuthGuard } from "@/components/shared/auth-guard";
import { UploadForm } from "@/components/upload/upload-form";
import { fadeInUp } from "@/lib/animations";
import { getJob } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function UploadPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const jobData = await getJob(jobId);
        setJob(jobData);
      } catch {
        // handled by empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  if (loading) {
    return (
      <AuthGuard>
        <AnimatedBackground />
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
        <AnimatedBackground />
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
      <AnimatedBackground />
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
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
            Back to {job.title}
          </Link>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
              Upload Resumes
            </span>
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Upload PDF resumes for <span className="font-medium text-foreground">{job.title}</span>. Each file will be parsed by AI to extract candidate data.
          </p>
        </motion.div>

        <UploadForm jobId={jobId} />
      </main>
      <Footer />
    </AuthGuard>
  );
}
