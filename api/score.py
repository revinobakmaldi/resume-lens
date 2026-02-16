from http.server import BaseHTTPRequestHandler
import json
import os
import time
import urllib.request
import urllib.parse


SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

CRITERIA_WEIGHT = 60  # 60% from user-defined criteria
AI_WEIGHT = 40        # 40% from LLM relevance match

EDUCATION_RANK = {
    "high school": 1,
    "diploma": 2,
    "bachelor": 3,
    "master": 4,
    "phd": 5,
}


def supabase_request(path, method="GET", data=None, single=False):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if single:
        headers["Accept"] = "application/vnd.pgrst.object+json"
    else:
        headers["Accept"] = "application/json"

    if method in ("POST", "PUT", "PATCH"):
        headers["Prefer"] = "return=representation"

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    with urllib.request.urlopen(req, timeout=10) as resp:
        resp_body = resp.read().decode("utf-8")
        if not resp_body:
            return None
        return json.loads(resp_body)


def get_education_rank(education_str):
    """Convert education string to numeric rank for comparison."""
    if not education_str:
        return 0
    edu_lower = education_str.lower()
    for key, rank in EDUCATION_RANK.items():
        if key in edu_lower:
            return rank
    return 0


def evaluate_criterion(candidate, criterion):
    """Evaluate a single criterion against a candidate. Returns 0-100."""
    field = criterion["field"]
    operator = criterion["operator"]
    target = criterion["value"]
    candidate_value = candidate.get(field)

    if candidate_value is None:
        return 0

    # Handle education field specially
    if field == "last_education":
        cand_rank = get_education_rank(str(candidate_value))
        target_rank = get_education_rank(str(target))
        if target_rank == 0:
            return 50
        if operator == "gte":
            return 100 if cand_rank >= target_rank else max(0, (cand_rank / target_rank) * 100)
        elif operator == "lte":
            return 100 if cand_rank <= target_rank else max(0, (target_rank / cand_rank) * 100)
        elif operator == "eq":
            return 100 if cand_rank == target_rank else 0
        elif operator == "contains":
            return 100 if str(target).lower() in str(candidate_value).lower() else 0

    # Handle string fields
    if operator == "contains":
        return 100 if str(target).lower() in str(candidate_value).lower() else 0

    if operator == "eq":
        if str(candidate_value).lower() == str(target).lower():
            return 100
        return 0

    # Numeric comparison
    try:
        cand_num = float(candidate_value)
        target_num = float(target)
    except (ValueError, TypeError):
        return 0

    if target_num == 0:
        return 100 if cand_num >= 0 else 0

    if operator == "gte":
        if cand_num >= target_num:
            return 100
        return max(0, (cand_num / target_num) * 100)
    elif operator == "lte":
        if cand_num <= target_num:
            return 100
        return max(0, (target_num / cand_num) * 100)

    return 0


def calculate_criteria_score(candidate, criteria):
    """Calculate weighted score for a candidate against user-defined criteria."""
    if not criteria:
        return 0, {}

    total_weight = sum(c.get("weight", 0) for c in criteria)
    if total_weight == 0:
        return 0, {}

    breakdown = {}
    weighted_sum = 0

    for criterion in criteria:
        field = criterion["field"]
        weight = criterion.get("weight", 0)
        raw_score = evaluate_criterion(candidate, criterion)
        weighted_score = (raw_score * weight) / total_weight
        weighted_sum += weighted_score
        breakdown[field] = round(raw_score, 1)

    return round(weighted_sum, 1), breakdown


def call_llm_relevance(resume_text, job_description, requirements):
    """Ask LLM to score how well a candidate matches the job requirements. Returns 0-100."""
    if not OPENROUTER_API_KEY:
        return 0

    if not resume_text:
        return 0

    system_prompt = """Return ONLY a JSON object: {"score": <0-100>, "reasoning": "<1 sentence>"}
No thinking, no explanation, no markdown. Just the JSON."""

    user_prompt = f"""Score 0-100 how well this resume matches the requirements. Be direct.

Requirements: {requirements}
Job: {job_description or "N/A"}

Resume:
{resume_text[:6000]}"""

    payload = json.dumps({
        "model": "qwen/qwen3-vl-235b-a22b-thinking",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 256,
    }).encode("utf-8")

    # Retry with backoff for rate limiting (429)
    last_err = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as e:
            last_err = e
            if e.code == 429 and attempt < 2:
                time.sleep(3 * (attempt + 1))
                continue
            raise
    else:
        raise last_err

    content = data["choices"][0]["message"]["content"].strip()

    # Strip markdown code fences if present
    if content.startswith("```"):
        lines = content.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines).strip()

    # Extract JSON object if surrounded by extra text
    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1:
        content = content[start:end + 1]

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        # Try to repair truncated JSON
        repaired = content
        if repaired.count('"') % 2 != 0:
            repaired += '"'
        if repaired.rstrip().endswith(":"):
            repaired += " 0"
        open_braces = repaired.count("{") - repaired.count("}")
        repaired += "}" * open_braces
        result = json.loads(repaired)

    score = int(result.get("score", 0))
    return max(0, min(100, score))


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            job_id = data.get("job_id")
            candidate_id = data.get("candidate_id")

            if not job_id:
                self._send_error(400, "job_id is required")
                return

            # Fetch job
            job = supabase_request(f"jobs?id=eq.{job_id}", single=True)
            criteria = job.get("criteria", [])
            requirements = job.get("requirements", "")
            description = job.get("description", "")

            if not criteria and not requirements:
                self._send_error(400, "Job has no scoring criteria or requirements defined")
                return

            if candidate_id:
                # Single candidate scoring
                candidate = supabase_request(
                    f"candidates?id=eq.{candidate_id}", single=True
                )

                # Delete existing score for this candidate + job
                supabase_request(
                    f"scores?job_id=eq.{job_id}&candidate_id=eq.{candidate_id}",
                    method="DELETE",
                )

                score = self._score_candidate(
                    candidate, criteria, requirements, description, job_id
                )
                self._send_json(200, score)
            else:
                # Bulk scoring — all candidates for this job
                links = supabase_request(
                    f"job_candidates?job_id=eq.{job_id}&select=candidate_id,candidates(*)"
                )
                candidates = [link["candidates"] for link in (links or [])]

                if not candidates:
                    self._send_error(400, "No candidates found for this job")
                    return

                # Delete existing scores for this job
                supabase_request(f"scores?job_id=eq.{job_id}", method="DELETE")

                scores = []
                for candidate in candidates:
                    score = self._score_candidate(
                        candidate, criteria, requirements, description, job_id
                    )
                    scores.append(score)

                scores.sort(key=lambda s: s.get("total_score", 0), reverse=True)
                self._send_json(200, scores)

        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            self._send_error(e.code, error_body[:200])
        except Exception as e:
            self._send_error(500, str(e))

    def _score_candidate(self, candidate, criteria, requirements, description, job_id):
        """Score a single candidate and save to DB. Returns the score record."""
        criteria_score, breakdown = calculate_criteria_score(candidate, criteria)

        ai_score = 0
        if requirements:
            try:
                ai_score = call_llm_relevance(
                    candidate.get("raw_text", ""),
                    description,
                    requirements,
                )
            except Exception as e:
                ai_score = 0
                breakdown["ai_error"] = str(e)[:100]

        breakdown["ai_relevance"] = ai_score

        if criteria and requirements:
            total_score = round(
                (criteria_score * CRITERIA_WEIGHT + ai_score * AI_WEIGHT) / 100, 1
            )
        elif criteria:
            total_score = criteria_score
        else:
            total_score = float(ai_score)

        score_data = {
            "candidate_id": candidate["id"],
            "job_id": job_id,
            "total_score": total_score,
            "breakdown": breakdown,
        }
        result = supabase_request("scores", method="POST", data=score_data)
        return result[0] if isinstance(result, list) else result

    def _send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, status, message):
        self._send_json(status, {"error": message})
