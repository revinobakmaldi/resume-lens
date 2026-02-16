"use client";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const color =
    score >= 80
      ? "bg-primary/10 text-primary border-primary/20"
      : score >= 60
        ? "bg-secondary/10 text-secondary border-secondary/20"
        : score >= 40
          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20";

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1.5 text-base font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${color} ${sizeClasses[size]}`}
    >
      {score.toFixed(1)}
    </span>
  );
}
