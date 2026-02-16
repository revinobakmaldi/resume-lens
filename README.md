# ResumeLens

AI-powered resume parser and candidate scorer. Upload PDF resumes, extract structured candidate data via LLM, and score candidates against weighted job criteria.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4)
![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

## Features

### Resume Parsing
- **PDF Upload** — Upload single or multiple PDF resumes with real-time progress tracking
- **LLM Extraction** — Extracts structured fields (name, email, phone, gender, age, education, experience, company) via LLM
- **Bilingual Support** — Handles both Indonesian and English resumes
- **Name Normalization** — Automatically converts extracted names to Proper Case
- **Age Estimation** — Estimates age from education start year when not explicitly stated
- **Duplicate Detection** — Deduplicates candidates by email when uploading to the same job

### Job Management
- **Create & Edit Jobs** — Define positions with technical requirements and customizable scoring criteria
- **Scoring Criteria Builder** — Configure weighted criteria with field comparisons (e.g., "Total Experience >= 3 years, weight 40%") and education ranking via dropdown
- **Delete Jobs** — Remove jobs and their associated candidate links

### Scoring Engine
- **Hybrid Scoring** — 60% user-defined criteria (numeric comparisons, education ranking, string matching) + 40% AI relevance (LLM evaluates resume against technical requirements)
- **Selective Scoring** — Select specific candidates to score instead of scoring all at once
- **Scoring Progress** — Per-candidate progress bar with name display during batch scoring
- **Rate Limit Handling** — Automatic retry with exponential backoff for API rate limits (429)
- **Navigation Guard** — Warns before page refresh/close while scoring is in progress

### Candidate Management
- **Normalized Data Model** — One candidate per person (deduplicated by email), linked to multiple jobs via a junction table
- **Edit Candidates** — Update candidate details from a dedicated edit page
- **Candidate Detail** — View full parsed data, linked jobs, and scores per job
- **Cross-Job Visibility** — Candidates appear across all linked jobs; All Candidates view shows highest score and associated job title

### Filtering & Sorting
- **Text Search** — Search candidates by name, email, or company
- **Query Filters** — Advanced filters on any field (score, experience, education, source, etc.) with operators (>=, <=, equals, contains)
- **Column Sorting** — Click any column header to sort (name, email, education, experience, company, score); defaults to score descending
- **Combined Filtering** — Filters and sort work together — filter first, then sort the results

### UI/UX
- **Dark Mode** — Automatic dark/light theme based on system preference
- **Animations** — Framer Motion transitions throughout the interface
- **Password Protected** — Simple password gate for access control

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4, Geist font, Framer Motion, Lucide React |
| Backend | Python serverless functions (Vercel) |
| LLM | OpenRouter API (Qwen3 VL 235B Thinking) |
| Database | Supabase Postgres |
| Auth | Password gate via environment variable |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenRouter](https://openrouter.ai) API key

### 1. Clone and install

```bash
git clone https://github.com/revinobakmaldi/resume-lens.git
cd resume-lens
npm install
```

### 2. Set up Supabase

Run the following SQL in your Supabase SQL Editor to create the required tables:

```sql
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT, email TEXT, phone TEXT, gender TEXT,
  age INTEGER, last_education TEXT, last_company TEXT,
  total_experience NUMERIC(4,1), related_experience NUMERIC(4,1),
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX candidates_email_unique ON candidates (email) WHERE email IS NOT NULL;

CREATE TABLE job_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  source TEXT,
  pdf_filename TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  total_score NUMERIC(5,1) NOT NULL,
  breakdown JSONB NOT NULL DEFAULT '{}',
  scored_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);
CREATE INDEX idx_scores_job_id ON scores(job_id);
```

### 3. Configure environment variables

Create a `.env.local` file:

```
OPENROUTER_API_KEY=sk-or-...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
APP_PASSWORD=your-chosen-password
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your password to access the dashboard.

## Project Structure

```
resumelens/
├── api/                    # Python serverless functions
│   ├── auth.py             # Password validation
│   ├── parse.py            # PDF extraction + LLM parsing
│   ├── candidates.py       # CRUD candidates + junction table management
│   ├── jobs.py             # CRUD jobs
│   └── score.py            # Weighted scoring engine + AI relevance
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Login
│   ├── dashboard/          # Job list + stats
│   ├── jobs/               # Job create, edit, detail, upload
│   └── candidates/         # Candidate list, detail, edit
├── components/             # React components
│   ├── shared/             # Navbar, footer, auth, background
│   ├── jobs/               # Job form, cards, criteria builder
│   ├── candidates/         # Table, detail, filters, score badge
│   └── upload/             # PDF dropzone, progress, preview
└── lib/                    # Utilities, types, API wrappers
```

## How It Works

1. **Create a Job** — Define a position with technical requirements (e.g., "Proficient in Python, SQL, Tableau") and scoring criteria (e.g., "Total Experience >= 3 years, weight 40%")
2. **Upload Resumes** — Drop PDF files; each is parsed by PyPDF2 for text extraction, then sent to an LLM to extract structured fields. Duplicate candidates (by email) are detected and linked rather than duplicated
3. **Review Candidates** — Browse parsed candidate data in sortable, filterable tables. Use query filters to narrow results by score, experience, education, or any field
4. **Calculate Scores** — Score all candidates or select specific ones. The engine combines user-defined criteria (60%) with AI relevance matching against technical requirements (40%)
5. **Compare** — View ranked candidates with score breakdowns per criterion plus AI relevance score. Sort by any column to compare different attributes

## Deployment

Deploy to Vercel and set the four environment variables (`OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_PASSWORD`) in the Vercel project settings.

## License

MIT

---

Built by Revino B Akmaldi
