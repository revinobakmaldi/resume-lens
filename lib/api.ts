import type { Job, Candidate, Score, CandidateWithScore, ParsedCandidate } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

// Auth
export async function verifyPassword(password: string): Promise<{ success: boolean }> {
  return request("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

// Jobs
export async function getJobs(): Promise<Job[]> {
  return request("/api/jobs");
}

export async function getJob(id: string): Promise<Job> {
  return request(`/api/jobs?id=${id}`);
}

export async function createJob(job: { title: string; description?: string; requirements: string; criteria: Job["criteria"] }): Promise<Job> {
  return request("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
}

export async function updateJob(id: string, data: { title?: string; description?: string; requirements?: string; criteria?: Job["criteria"] }): Promise<Job> {
  return request(`/api/jobs?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteJob(id: string): Promise<{ success: boolean }> {
  return request(`/api/jobs?id=${id}`, { method: "DELETE" });
}

// Candidates
export async function getCandidates(jobId?: string): Promise<CandidateWithScore[]> {
  const url = jobId ? `/api/candidates?job_id=${jobId}` : "/api/candidates";
  return request(url);
}

export async function getCandidate(id: string): Promise<CandidateWithScore> {
  return request(`/api/candidates?id=${id}`);
}

export async function createCandidate(candidate: Partial<Candidate> & { job_id: string; source?: string | null; pdf_filename?: string | null }): Promise<CandidateWithScore> {
  return request("/api/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(candidate),
  });
}

export async function updateCandidate(id: string, data: Partial<Candidate>): Promise<Candidate> {
  return request(`/api/candidates?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCandidate(id: string): Promise<{ success: boolean }> {
  return request(`/api/candidates?id=${id}`, { method: "DELETE" });
}

// Parse
export async function parseResume(file: File, jobId: string, source?: string): Promise<ParsedCandidate> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_id", jobId);
  if (source) formData.append("source", source);
  return request("/api/parse", {
    method: "POST",
    body: formData,
  });
}

// Scores
export async function calculateScores(jobId: string): Promise<Score[]> {
  return request("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId }),
  });
}

export async function scoreCandidate(jobId: string, candidateId: string): Promise<Score> {
  return request("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, candidate_id: candidateId }),
  });
}
