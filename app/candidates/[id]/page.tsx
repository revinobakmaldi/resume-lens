"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AuthGuard } from "@/components/shared/auth-guard";
import { CandidateDetail } from "@/components/candidates/candidate-detail";
import { fadeInUp } from "@/lib/animations";
import { getCandidate, deleteCandidate } from "@/lib/api";
import type { CandidateWithScore } from "@/lib/types";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<CandidateWithScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCandidate(candidateId);
        setCandidate(data);
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
      if (candidate?.job_id) {
        router.push(`/jobs/${candidate.job_id}`);
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
              candidate.job_id
                ? `/jobs/${candidate.job_id}`
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
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:border-red-300 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        <CandidateDetail candidate={candidate} />
      </main>
      <Footer />
    </AuthGuard>
  );
}
