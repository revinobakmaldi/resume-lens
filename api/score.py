from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.parse


SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

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
            return 50  # Can't evaluate
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


def calculate_candidate_score(candidate, criteria):
    """Calculate weighted score for a candidate against job criteria."""
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


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            job_id = data.get("job_id")
            if not job_id:
                self._send_error(400, "job_id is required")
                return

            # Fetch job criteria
            job = supabase_request(f"jobs?id=eq.{job_id}", single=True)
            criteria = job.get("criteria", [])

            if not criteria:
                self._send_error(400, "Job has no scoring criteria defined")
                return

            # Fetch candidates for this job
            candidates = supabase_request(f"candidates?job_id=eq.{job_id}")

            if not candidates:
                self._send_error(400, "No candidates found for this job")
                return

            # Delete existing scores for this job
            supabase_request(f"scores?job_id=eq.{job_id}", method="DELETE")

            # Calculate and insert scores
            scores = []
            for candidate in candidates:
                total_score, breakdown = calculate_candidate_score(candidate, criteria)
                score_data = {
                    "candidate_id": candidate["id"],
                    "job_id": job_id,
                    "total_score": total_score,
                    "breakdown": breakdown,
                }
                result = supabase_request("scores", method="POST", data=score_data)
                if isinstance(result, list):
                    scores.append(result[0])
                else:
                    scores.append(result)

            # Sort by total_score descending
            scores.sort(key=lambda s: s.get("total_score", 0), reverse=True)
            self._send_json(200, scores)

        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            self._send_error(e.code, error_body[:200])
        except Exception as e:
            self._send_error(500, str(e))

    def _send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, status, message):
        self._send_json(status, {"error": message})
