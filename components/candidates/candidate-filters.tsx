"use client";

import { Search, Plus, X } from "lucide-react";
import { FILTER_FIELDS, FILTER_OPERATORS } from "@/lib/constants";
import type { QueryFilter } from "@/lib/types";

interface CandidateFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters?: QueryFilter[];
  onFiltersChange?: (filters: QueryFilter[]) => void;
}

let filterId = 0;

function getFieldConfig(field: string) {
  return FILTER_FIELDS.find((f) => f.value === field);
}

function getOperators(field: string) {
  const config = getFieldConfig(field);
  if (!config) return FILTER_OPERATORS.text;
  return FILTER_OPERATORS[config.type as keyof typeof FILTER_OPERATORS] ?? FILTER_OPERATORS.text;
}

export function CandidateFilters({
  search,
  onSearchChange,
  filters = [],
  onFiltersChange,
}: CandidateFiltersProps) {
  const addFilter = () => {
    const first = FILTER_FIELDS[0];
    const ops = getOperators(first.value);
    onFiltersChange?.([
      ...filters,
      { id: `f-${++filterId}`, field: first.value, operator: ops[0].value, value: "" },
    ]);
  };

  const updateFilter = (id: string, patch: Partial<QueryFilter>) => {
    onFiltersChange?.(
      filters.map((f) => {
        if (f.id !== id) return f;
        const updated = { ...f, ...patch };
        // Reset operator & value when field changes
        if (patch.field && patch.field !== f.field) {
          const ops = getOperators(patch.field);
          updated.operator = ops[0].value;
          updated.value = "";
        }
        return updated;
      })
    );
  };

  const removeFilter = (id: string) => {
    onFiltersChange?.(filters.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Search bar + add filter button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {onFiltersChange && (
          <button
            onClick={addFilter}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Filter
          </button>
        )}
      </div>

      {/* Filter rows */}
      {filters.length > 0 && (
        <div className="space-y-2">
          {filters.map((filter) => {
            const fieldConfig = getFieldConfig(filter.field);
            const operators = getOperators(filter.field);
            const hasOptions = fieldConfig && "options" in fieldConfig;

            return (
              <div key={filter.id} className="flex items-center gap-2">
                {/* Field select */}
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {FILTER_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                {/* Operator select */}
                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value input */}
                {hasOptions ? (
                  <select
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    {(fieldConfig as { options: readonly string[] }).options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={fieldConfig?.type === "number" ? "number" : "text"}
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="Value..."
                    className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-foreground placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-red-300 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
