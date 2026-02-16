export interface Job {
  id: string;
  title: string;
  description: string | null;
  criteria: Criterion[];
  created_at: string;
  updated_at: string;
}

export interface Criterion {
  field: string;
  operator: "gte" | "lte" | "eq" | "contains";
  value: string | number;
  weight: number;
}

export interface Candidate {
  id: string;
  job_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  age: number | null;
  last_education: string | null;
  last_company: string | null;
  total_experience: number | null;
  related_experience: number | null;
  source: string | null;
  raw_text: string | null;
  pdf_filename: string | null;
  created_at: string;
}

export interface Score {
  id: string;
  candidate_id: string;
  job_id: string;
  total_score: number;
  breakdown: Record<string, number>;
  scored_at: string;
}

export interface CandidateWithScore extends Candidate {
  score?: Score;
}

export interface ParsedCandidate {
  name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  age: number | null;
  last_education: string | null;
  last_company: string | null;
  total_experience: number | null;
  related_experience: number | null;
}

export interface UploadItem {
  file: File;
  status: "pending" | "parsing" | "parsed" | "saving" | "saved" | "error";
  parsed?: ParsedCandidate;
  error?: string;
}

export interface DashboardStats {
  total_jobs: number;
  total_candidates: number;
  recent_jobs: Job[];
}
