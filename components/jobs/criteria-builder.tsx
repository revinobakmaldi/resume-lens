"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Criterion } from "@/lib/types";
import { CANDIDATE_FIELDS, OPERATORS } from "@/lib/constants";

interface CriteriaBuilderProps {
  criteria: Criterion[];
  onChange: (criteria: Criterion[]) => void;
}

const emptyCriterion: Criterion = {
  field: "total_experience",
  operator: "gte",
  value: "",
  weight: 0,
};

export function CriteriaBuilder({ criteria, onChange }: CriteriaBuilderProps) {
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  const addCriterion = () => {
    onChange([...criteria, { ...emptyCriterion }]);
  };

  const removeCriterion = (index: number) => {
    onChange(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, updates: Partial<Criterion>) => {
    onChange(criteria.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Scoring Criteria
        </label>
        <span
          className={`text-xs ${
            totalWeight === 100
              ? "text-primary"
              : "text-red-400"
          }`}
        >
          Total weight: {totalWeight}/100
        </span>
      </div>

      {criteria.map((criterion, index) => (
        <div
          key={index}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3"
        >
          <select
            value={criterion.field}
            onChange={(e) => updateCriterion(index, { field: e.target.value })}
            className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-foreground"
          >
            {CANDIDATE_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={criterion.operator}
            onChange={(e) =>
              updateCriterion(index, {
                operator: e.target.value as Criterion["operator"],
              })
            }
            className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-foreground"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={criterion.value}
            onChange={(e) => updateCriterion(index, { value: e.target.value })}
            placeholder="Value"
            className="w-24 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-foreground placeholder:text-zinc-400"
          />

          <div className="flex items-center gap-1">
            <input
              type="number"
              value={criterion.weight || ""}
              onChange={(e) =>
                updateCriterion(index, {
                  weight: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Wt"
              min={0}
              max={100}
              className="w-16 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-foreground placeholder:text-zinc-400"
            />
            <span className="text-xs text-zinc-400">%</span>
          </div>

          <button
            type="button"
            onClick={() => removeCriterion(index)}
            className="ml-auto rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addCriterion}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        Add Criterion
      </button>
    </div>
  );
}
