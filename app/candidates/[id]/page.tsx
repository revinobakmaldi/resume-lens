"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, Pencil, Trash2, Briefcase } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AuthGuard } from "@/components/shared/auth-guard";
import { CandidateDetail } from "@/components/candidates/candidate-detail";
import { fadeInUp } from "@/lib/animations";
import { getCandidate, getJob, deleteCandidate } from "@/lib/api";
import type { CandidateWithScore, Job } from "@/lib/types";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<CandidateWithScore | null>(null);
  const [linkedJobs, setLinkedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCandidate(candidateId);
        setCandidate(data);
        // Fetch job details for all linked jobs
        if (data.job_ids && data.job_ids.length > 0) {
          const jobs = await Promise.all(
            data.job_ids.map((jid) => getJob(jid).catch(() => null))
          );
          setLinkedJobs(jobs.filter((j): j is Job => j !== null));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load candidate"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [candidateId]);

  const handleDelete = async () => {
    if (!confirm("Delete this candidate?")) return;
    setDeleting(true);
    try {
      await deleteCandidate(candidateId);
      const jobIds = candidate?.job_ids;
      if (jobIds && jobIds.length === 1) {
        router.push(`/jobs/${jobIds[0]}`);
      } else {
        router.push("/candidates");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete candidate"
      );
      setDeleting(false);
    }
  };

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

  if (error || !candidate) {
    return (
      <AuthGuard>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            {error || "Candidate not found"}
          </div>
        </main>
        <Footer />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Link
            href={
              candidate.job_ids && candidate.job_ids.length === 1
                ? `/jobs/${candidate.job_ids[0]}`
                : "/candidates"
            }
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
                  {candidate.name || "Unknown Candidate"}
                </span>
              </h1>
              {candidate.email && (
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {candidate.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/candidates/${candidateId}/edit`}
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

        {/* Linked Jobs */}
        {linkedJobs.length > 0 && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5"
          >
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Linked Jobs
              <span className="ml-2 text-xs font-normal text-zinc-500">
                ({linkedJobs.length})
              </span>
            </h3>
            <div className="space-y-2">
              {linkedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                >
                  <Briefcase className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {job.title}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        <CandidateDetail candidate={candidate} />
      </main>
      <Footer />
    </AuthGuard>
  );
}
