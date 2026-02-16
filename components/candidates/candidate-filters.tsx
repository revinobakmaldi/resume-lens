"use client";

import { Search } from "lucide-react";

interface CandidateFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function CandidateFilters({
  search,
  onSearchChange,
}: CandidateFiltersProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name, email, or company..."
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
