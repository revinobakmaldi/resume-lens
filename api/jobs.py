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


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)

            job_id = params.get("id", [None])[0]

            if job_id:
                result = supabase_request(
                    f"jobs?id=eq.{job_id}", single=True
                )
                self._send_json(200, result)
            else:
                result = supabase_request("jobs?order=created_at.desc")
                self._send_json(200, result)

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

            title = data.get("title")
            if not title:
                self._send_error(400, "Title is required")
                return

            requirements = data.get("requirements", "")
            if not requirements:
                self._send_error(400, "Technical requirements are required")
                return

            job_data = {
                "title": title,
                "description": data.get("description", ""),
                "requirements": requirements,
                "criteria": data.get("criteria", []),
            }

            result = supabase_request("jobs", method="POST", data=job_data)
            self._send_json(201, result[0] if isinstance(result, list) else result)

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
            job_id = params.get("id", [None])[0]

            if not job_id:
                self._send_error(400, "Missing job id")
                return

            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            allowed = {"title", "description", "requirements", "criteria", "share_token"}
            update_data = {k: v for k, v in data.items() if k in allowed}

            if not update_data:
                self._send_error(400, "No valid fields to update")
                return

            result = supabase_request(
                f"jobs?id=eq.{job_id}", method="PATCH", data=update_data
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
            job_id = params.get("id", [None])[0]

            if not job_id:
                self._send_error(400, "Missing job id")
                return

            supabase_request(f"jobs?id=eq.{job_id}", method="DELETE")
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
