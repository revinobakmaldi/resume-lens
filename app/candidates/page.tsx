"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AuthGuard } from "@/components/shared/auth-guard";
import { CandidateTable } from "@/components/candidates/candidate-table";
import { CandidateFilters } from "@/components/candidates/candidate-filters";
import { fadeInUp } from "@/lib/animations";
import { getCandidates } from "@/lib/api";
import type { CandidateWithScore } from "@/lib/types";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateWithScore[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCandidates();
        setCandidates(data);
      } catch {
        // empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = candidates.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.last_company?.toLowerCase().includes(q) ||
      c.last_education?.toLowerCase().includes(q)
    );
  });

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
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
              All Candidates
            </span>
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Browse and search across all parsed candidates.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <CandidateFilters search={search} onSearchChange={setSearch} />
            <CandidateTable candidates={filtered} showJobLink />
          </div>
        )}
      </main>
      <Footer />
    </AuthGuard>
  );
}
