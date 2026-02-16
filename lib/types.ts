export interface Job {
  id: string;
  title: string;
  description: string | null;
  requirements: string;
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
  name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  age: number | null;
  last_education: string | null;
  last_company: string | null;
  total_experience: number | null;
  related_experience: number | null;
  raw_text: string | null;
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
  // From junction table — present when fetched by job_id
  job_id?: string;
  source?: string | null;
  pdf_filename?: string | null;
  // Present when fetching single candidate
  job_ids?: string[];
  // Present on all-candidates view — job title of the highest score
  score_job_title?: string;
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
