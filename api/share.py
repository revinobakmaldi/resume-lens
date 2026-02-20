from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.parse
import uuid


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


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Public endpoint: fetch job + candidates by share token (no auth required)."""
        try:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)

            token = params.get("token", [None])[0]
            if not token:
                self._send_error(400, "Missing token")
                return

            # Fetch job by share_token (only public-safe fields)
            try:
                job = supabase_request(
                    f"jobs?share_token=eq.{urllib.parse.quote(token)}"
                    "&select=id,title,description,requirements,criteria,created_at",
                    single=True,
                )
            except urllib.error.HTTPError as e:
                if e.code in (406, 404):
                    self._send_error(404, "Share link is invalid or has been revoked")
                    return
                raise

            job_id = job["id"]

            # Fetch candidate IDs linked to this job
            job_candidates = supabase_request(
                f"job_candidates?job_id=eq.{job_id}&select=candidate_id"
            )
            candidate_ids = [jc["candidate_id"] for jc in job_candidates]

            candidates = []
            if candidate_ids:
                ids_filter = ",".join(candidate_ids)

                # Fetch candidates (omit raw_text from public view)
                all_candidates = supabase_request(
                    f"candidates?id=in.({ids_filter})"
                    "&select=id,name,email,age,gender,last_education,last_company,"
                    "total_experience,related_experience,created_at"
                )

                # Fetch scores for these candidates under this job
                scores = supabase_request(
                    f"scores?job_id=eq.{job_id}&candidate_id=in.({ids_filter})"
                )
                score_map = {s["candidate_id"]: s for s in scores}

                for c in all_candidates:
                    c["score"] = score_map.get(c["id"])
                    candidates.append(c)

            self._send_json(200, {"job": job, "candidates": candidates})

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            self._send_error(e.code, error_body[:200])
        except Exception as e:
            self._send_error(500, str(e))

    def do_POST(self):
        """Generate (or regenerate) a share token for a job."""
        try:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)

            job_id = params.get("job_id", [None])[0]
            if not job_id:
                self._send_error(400, "Missing job_id")
                return

            token = str(uuid.uuid4())
            result = supabase_request(
                f"jobs?id=eq.{job_id}",
                method="PATCH",
                data={"share_token": token},
            )
            job = result[0] if isinstance(result, list) else result
            self._send_json(200, {"share_token": job.get("share_token", token)})

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            self._send_error(e.code, error_body[:200])
        except Exception as e:
            self._send_error(500, str(e))

    def do_DELETE(self):
        """Revoke the share token for a job (sets share_token to NULL)."""
        try:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)

            job_id = params.get("job_id", [None])[0]
            if not job_id:
                self._send_error(400, "Missing job_id")
                return

            supabase_request(
                f"jobs?id=eq.{job_id}",
                method="PATCH",
                data={"share_token": None},
            )
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
