from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.parse


SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")


def supabase_request(path, method="GET", data=None, single=False, extra_headers=None):
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

    if extra_headers:
        headers.update(extra_headers)

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    with urllib.request.urlopen(req, timeout=10) as resp:
        resp_body = resp.read().decode("utf-8")
        if not resp_body:
            return None
        return json.loads(resp_body)


def get_scores_for_candidates(candidate_ids, job_id=None):
    """Fetch scores for a list of candidate IDs, optionally filtered by job."""
    if not candidate_ids:
        return {}
    ids_filter = ",".join(candidate_ids)
    path = f"scores?candidate_id=in.({ids_filter})"
    if job_id:
        path += f"&job_id=eq.{job_id}"
    scores = supabase_request(path)
    return {s["candidate_id"]: s for s in scores}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)

            candidate_id = params.get("id", [None])[0]
            job_id = params.get("job_id", [None])[0]

            if candidate_id:
                # Single candidate
                candidate = supabase_request(
                    f"candidates?id=eq.{candidate_id}", single=True
                )
                # Fetch all linked jobs
                links = supabase_request(
                    f"job_candidates?candidate_id=eq.{candidate_id}&select=job_id,source,pdf_filename"
                )
                candidate["job_ids"] = [l["job_id"] for l in links]
                # Attach source/pdf_filename from first link if available
                if links:
                    candidate["source"] = links[0].get("source")
                    candidate["pdf_filename"] = links[0].get("pdf_filename")
                # Attach score (latest)
                scores = get_scores_for_candidates([candidate_id])
                candidate["score"] = scores.get(candidate_id)
                self._send_json(200, candidate)

            elif job_id:
                # Candidates for a specific job via junction table
                links = supabase_request(
                    f"job_candidates?job_id=eq.{job_id}&select=candidate_id,source,pdf_filename,candidates(*)"
                )
                candidates = []
                for link in links:
                    c = link["candidates"]
                    c["job_id"] = job_id
                    c["source"] = link.get("source")
                    c["pdf_filename"] = link.get("pdf_filename")
                    candidates.append(c)

                # Sort by created_at desc
                candidates.sort(key=lambda x: x.get("created_at", ""), reverse=True)

                # Attach scores for this job
                ids = [c["id"] for c in candidates]
                scores = get_scores_for_candidates(ids, job_id=job_id)
                for c in candidates:
                    c["score"] = scores.get(c["id"])

                self._send_json(200, candidates)

            else:
                # All candidates (deduplicated — one row per person)
                candidates = supabase_request("candidates?order=created_at.desc")

                # Attach scores (latest per candidate)
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

            candidate_fields = {
                "name": data.get("name"),
                "email": email,
                "phone": data.get("phone"),
                "gender": data.get("gender"),
                "age": data.get("age"),
                "last_education": data.get("last_education"),
                "last_company": data.get("last_company"),
                "total_experience": data.get("total_experience"),
                "related_experience": data.get("related_experience"),
                "raw_text": data.get("raw_text"),
            }

            # Check for existing candidate by email
            existing = None
            if email:
                matches = supabase_request(
                    f"candidates?email=eq.{urllib.parse.quote(email)}"
                )
                if matches:
                    existing = matches[0]

            if existing:
                # Update existing candidate with latest info
                candidate_id = existing["id"]
                supabase_request(
                    f"candidates?id=eq.{candidate_id}",
                    method="PATCH",
                    data=candidate_fields,
                )
                candidate = {**existing, **candidate_fields}
            else:
                # Create new candidate
                result = supabase_request(
                    "candidates", method="POST", data=candidate_fields
                )
                candidate = result[0] if isinstance(result, list) else result
                candidate_id = candidate["id"]

            # Upsert into job_candidates (link candidate to job)
            link_data = {
                "job_id": job_id,
                "candidate_id": candidate_id,
                "source": data.get("source"),
                "pdf_filename": data.get("pdf_filename"),
            }
            supabase_request(
                "job_candidates?on_conflict=job_id,candidate_id",
                method="POST",
                data=link_data,
                extra_headers={"Prefer": "return=representation,resolution=merge-duplicates"},
            )

            # Return candidate with job context
            candidate["job_id"] = job_id
            candidate["source"] = data.get("source")
            candidate["pdf_filename"] = data.get("pdf_filename")
            self._send_json(201, candidate)

        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            self._send_error(e.code, error_body[:200])
        except Exception as e:
            self._send_error(500, str(e))

    def do_PATCH(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            candidate_id = params.get("id", [None])[0]

            if not candidate_id:
                self._send_error(400, "Missing candidate id")
                return

            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            allowed = {
                "name", "email", "phone", "gender", "age",
                "last_education", "last_company",
                "total_experience", "related_experience",
            }
            update_data = {k: v for k, v in data.items() if k in allowed}

            if not update_data:
                self._send_error(400, "No valid fields to update")
                return

            result = supabase_request(
                f"candidates?id=eq.{candidate_id}", method="PATCH", data=update_data
            )
            self._send_json(200, result[0] if isinstance(result, list) else result)

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
            job_id = params.get("job_id", [None])[0]

            if not candidate_id:
                self._send_error(400, "Missing candidate id")
                return

            if job_id:
                # Unlink candidate from specific job only
                supabase_request(
                    f"job_candidates?candidate_id=eq.{candidate_id}&job_id=eq.{job_id}",
                    method="DELETE",
                )
                # Also delete scores for this candidate+job
                supabase_request(
                    f"scores?candidate_id=eq.{candidate_id}&job_id=eq.{job_id}",
                    method="DELETE",
                )
                # Check if candidate has any remaining job links
                remaining = supabase_request(
                    f"job_candidates?candidate_id=eq.{candidate_id}"
                )
                if not remaining:
                    # No more links — delete candidate entirely
                    supabase_request(
                        f"candidates?id=eq.{candidate_id}", method="DELETE"
                    )
                self._send_json(200, {"success": True})
            else:
                # Delete candidate entirely (cascade removes links + scores)
                supabase_request(
                    f"candidates?id=eq.{candidate_id}", method="DELETE"
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
