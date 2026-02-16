# ResumeLens

AI-powered resume parser and candidate scorer. Upload PDF resumes, extract structured candidate data via LLM, and score candidates against weighted job criteria.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4)
![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

## Features

- **PDF Resume Parsing** — Upload PDF resumes and extract structured candidate data (name, email, education, experience, etc.) using LLM
- **Bilingual Support** — Handles both Indonesian and English resumes
- **Job Management** — Create job positions with technical requirements and customizable scoring criteria
- **Hybrid Scoring** — 60% user-defined criteria (numeric comparisons, education ranking, string matching) + 40% AI relevance (LLM evaluates resume against technical requirements)
- **Candidate Search** — Browse, search, and filter candidates across all jobs
- **Bulk Upload** — Upload multiple PDFs at once with real-time progress tracking
- **Dark Mode** — Automatic dark/light theme based on system preference
- **Password Protected** — Simple password gate for access control

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4, Geist font, Framer Motion, Lucide React |
| Backend | Python serverless functions (Vercel) |
| LLM | OpenRouter API |
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
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT, email TEXT, phone TEXT, gender TEXT,
  age INTEGER, last_education TEXT, last_company TEXT,
  total_experience NUMERIC(4,1), related_experience NUMERIC(4,1),
  source TEXT, raw_text TEXT, pdf_filename TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_candidates_job_id ON candidates(job_id);

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
│   ├── candidates.py       # CRUD candidates (Supabase REST)
│   ├── jobs.py             # CRUD jobs (Supabase REST)
│   └── score.py            # Weighted scoring engine
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Login
│   ├── dashboard/          # Job list + stats
│   ├── jobs/               # Job create, detail, upload
│   └── candidates/         # Candidate list + detail
├── components/             # React components
│   ├── shared/             # Navbar, footer, auth, background
│   ├── jobs/               # Job form, cards, criteria builder
│   ├── candidates/         # Table, detail, filters, score badge
│   └── upload/             # PDF dropzone, progress, preview
└── lib/                    # Utilities, types, API wrappers
```

## How It Works

1. **Create a Job** — Define a position with technical requirements (e.g., "Proficient in Python, SQL, Tableau") and scoring criteria (e.g., "Total Experience >= 3 years, weight 40%")
2. **Upload Resumes** — Drop PDF files; each is parsed by PyPDF2 for text extraction, then sent to an LLM to extract structured fields
3. **Review Candidates** — Browse parsed candidate data in a searchable table
4. **Calculate Scores** — Run the scoring engine which combines user-defined criteria (60%) with AI relevance matching against technical requirements (40%)
5. **Compare** — View ranked candidates with score breakdowns per criterion plus AI relevance score

## Deployment

Deploy to Vercel and set the four environment variables (`OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_PASSWORD`) in the Vercel project settings.

## License

MIT

---

Built by Revino B Akmaldi
