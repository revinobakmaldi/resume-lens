"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { fadeInUp } from "@/lib/animations";
import { updateCandidate } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { CandidateWithScore } from "@/lib/types";

interface CandidateFormProps {
  candidate: CandidateWithScore;
}

export function CandidateForm({ candidate }: CandidateFormProps) {
  const [name, setName] = useState(candidate.name ?? "");
  const [email, setEmail] = useState(candidate.email ?? "");
  const [phone, setPhone] = useState(candidate.phone ?? "");
  const [gender, setGender] = useState(candidate.gender ?? "");
  const [age, setAge] = useState(candidate.age?.toString() ?? "");
  const [lastEducation, setLastEducation] = useState(candidate.last_education ?? "");
  const [lastCompany, setLastCompany] = useState(candidate.last_company ?? "");
  const [totalExperience, setTotalExperience] = useState(candidate.total_experience?.toString() ?? "");
  const [relatedExperience, setRelatedExperience] = useState(candidate.related_experience?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateCandidate(candidate.id, {
        name: name.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        gender: gender.trim() || null,
        age: age ? Number(age) : null,
        last_education: lastEducation.trim() || null,
        last_company: lastCompany.trim() || null,
        total_experience: totalExperience ? Number(totalExperience) : null,
        related_experience: relatedExperience ? Number(relatedExperience) : null,
      });
      router.push(`/candidates/${candidate.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update candidate");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-foreground placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <motion.form
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Phone</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
            <option value="">—</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Age</label>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Education</label>
          <input type="text" value={lastEducation} onChange={(e) => setLastEducation(e.target.value)} placeholder="e.g. Bachelor of Computer Science" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Last Company</label>
          <input type="text" value={lastCompany} onChange={(e) => setLastCompany(e.target.value)} placeholder="Company name" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Total Experience (years)</label>
          <input type="number" step="0.5" value={totalExperience} onChange={(e) => setTotalExperience(e.target.value)} placeholder="e.g. 3.5" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Related Experience (years)</label>
          <input type="number" step="0.5" value={relatedExperience} onChange={(e) => setRelatedExperience(e.target.value)} placeholder="e.g. 2" className={inputClass} />
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </span>
        ) : (
          "Update Candidate"
        )}
      </button>
    </motion.form>
  );
}
