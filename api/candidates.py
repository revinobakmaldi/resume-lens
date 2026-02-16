from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.parse


SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")


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

    if method in ("POST", "PATCH"):
        headers["Prefer"] = "return=representation"

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_scores_for_candidates(candidate_ids):
    """Fetch scores for a list of candidate IDs."""
    if not candidate_ids:
        return {}
    ids_filter = ",".join(candidate_ids)
    scores = supabase_request(f"scores?candidate_id=in.({ids_filter})")
    return {s["candidate_id"]: s for s in scores}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)

            candidate_id = params.get("id", [None])[0]
            job_id = params.get("job_id", [None])[0]

            if candidate_id:
                candidate = supabase_request(
                    f"candidates?id=eq.{candidate_id}", single=True
                )
                # Attach score if exists
                scores = get_scores_for_candidates([candidate_id])
                candidate["score"] = scores.get(candidate_id)
                self._send_json(200, candidate)
            else:
                path = "candidates?order=created_at.desc"
                if job_id:
                    path = f"candidates?job_id=eq.{job_id}&order=created_at.desc"
                candidates = supabase_request(path)

                # Attach scores
                ids = [c["id"] for c in candidates]
                scores = get_scores_for_candidates(ids)
                for c in candidates:
                    c["score"] = scores.get(c["id"])

                self._send_json(200, candidates)

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            self._send_error(e.code, error_body[:200])
        except Exception as e:
            self._send_error(500, str(e))

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            job_id = data.get("job_id")
            if not job_id:
                self._send_error(400, "job_id is required")
                return

            email = data.get("email")

            candidate_data = {
                "job_id": job_id,
                "name": data.get("name"),
                "email": email,
                "phone": data.get("phone"),
                "gender": data.get("gender"),
                "age": data.get("age"),
                "last_education": data.get("last_education"),
                "last_company": data.get("last_company"),
                "total_experience": data.get("total_experience"),
                "related_experience": data.get("related_experience"),
                "source": data.get("source"),
                "raw_text": data.get("raw_text"),
                "pdf_filename": data.get("pdf_filename"),
            }

            # Check for existing candidate with same email in the same job
            existing = None
            if email:
                matches = supabase_request(
                    f"candidates?job_id=eq.{job_id}&email=eq.{urllib.parse.quote(email)}"
                )
                if matches:
                    existing = matches[0]

            if existing:
                # Update existing candidate with latest info
                update_fields = {k: v for k, v in candidate_data.items() if k != "job_id"}
                result = supabase_request(
                    f"candidates?id=eq.{existing['id']}", method="PATCH", data=update_fields
                )
                self._send_json(200, result[0] if isinstance(result, list) else result)
            else:
                result = supabase_request("candidates", method="POST", data=candidate_data)
                self._send_json(201, result[0] if isinstance(result, list) else result)

        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            self._send_error(e.code, error_body[:200])
        except Exception as e:
            self._send_error(500, str(e))

    def do_DELETE(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            candidate_id = params.get("id", [None])[0]

            if not candidate_id:
                self._send_error(400, "Missing candidate id")
                return

            supabase_request(f"candidates?id=eq.{candidate_id}", method="DELETE")
            self._send_json(200, {"success": True})

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
