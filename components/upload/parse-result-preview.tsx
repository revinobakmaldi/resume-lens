"use client";

import { motion } from "framer-motion";
import { CheckCircle2, User, Mail, Phone, GraduationCap, Building2, Clock } from "lucide-react";
import { fadeInUp } from "@/lib/animations";
import type { ParsedCandidate } from "@/lib/types";

interface ParseResultPreviewProps {
  parsed: ParsedCandidate;
  filename: string;
}

export function ParseResultPreview({ parsed, filename }: ParseResultPreviewProps) {
  const fields = [
    { icon: User, label: "Name", value: parsed.name },
    { icon: Mail, label: "Email", value: parsed.email },
    { icon: Phone, label: "Phone", value: parsed.phone },
    { icon: User, label: "Gender", value: parsed.gender },
    { icon: User, label: "Age", value: parsed.age },
    { icon: GraduationCap, label: "Education", value: parsed.last_education },
    { icon: Building2, label: "Company", value: parsed.last_company },
    { icon: Clock, label: "Total Exp", value: parsed.total_experience != null ? `${parsed.total_experience}y` : null },
    { icon: Clock, label: "Related Exp", value: parsed.related_experience != null ? `${parsed.related_experience}y` : null },
  ];

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-lg border border-primary/20 bg-primary/5 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">{filename}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs">
            <Icon className="h-3 w-3 text-zinc-400" />
            <span className="text-zinc-500 dark:text-zinc-400">{label}:</span>
            <span className="text-foreground truncate">{value ?? "—"}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
