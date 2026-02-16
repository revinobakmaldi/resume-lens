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
import type { CandidateWithScore, QueryFilter } from "@/lib/types";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateWithScore[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<QueryFilter[]>([]);
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
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch =
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.last_company?.toLowerCase().includes(q) ||
        c.last_education?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    for (const f of filters) {
      if (!f.value) continue;

      let fieldValue: string | number | null | undefined;
      if (f.field === "score") {
        fieldValue = c.score?.total_score ?? null;
      } else if (f.field === "source") {
        fieldValue = c.source;
      } else {
        fieldValue = (c as unknown as Record<string, unknown>)[f.field] as string | number | null;
      }

      if (fieldValue == null) return false;

      if (f.operator === "gte") {
        if (Number(fieldValue) < Number(f.value)) return false;
      } else if (f.operator === "lte") {
        if (Number(fieldValue) > Number(f.value)) return false;
      } else if (f.operator === "eq") {
        if (String(fieldValue).toLowerCase() !== String(f.value).toLowerCase()) return false;
      } else if (f.operator === "contains") {
        if (!String(fieldValue).toLowerCase().includes(String(f.value).toLowerCase())) return false;
      }
    }

    return true;
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
            <CandidateFilters
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              onFiltersChange={setFilters}
            />
            <CandidateTable candidates={filtered} showJobLink />
          </div>
        )}
      </main>
      <Footer />
    </AuthGuard>
  );
}
