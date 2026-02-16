from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import cgi
import io

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None


OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

SYSTEM_PROMPT = """You are a resume/CV parser. Extract structured information from the resume text below.

Return ONLY valid JSON with these exact keys:
{
  "name": "Full name or null",
  "email": "Email address or null",
  "phone": "Phone number or null",
  "gender": "Male/Female or null if not determinable",
  "age": null or integer,
  "last_education": "Highest education level (e.g. Bachelor of Computer Science) or null",
  "last_company": "Most recent company name or null",
  "total_experience": null or number (total years of work experience, as decimal e.g. 2.5),
  "related_experience": null or number (years of experience relevant to the role, as decimal)
}

RULES:
1. Return ONLY raw JSON — no markdown, no code fences, no explanation
2. The resume may be in Indonesian or English — handle both
3. For experience, calculate from work history dates if available
4. For related_experience, estimate based on job titles and descriptions relevance
5. If a field cannot be determined, use null
6. For age, calculate from birth date if available, otherwise null
7. Gender can sometimes be inferred from Indonesian names or pronouns, but use null if uncertain"""


def extract_pdf_text(file_bytes):
    """Extract text from PDF bytes using PyPDF2."""
    if PdfReader is None:
        raise ValueError("PyPDF2 not available")

    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)

    full_text = "\n".join(text_parts).strip()
    if not full_text:
        raise ValueError(
            "Could not extract text from PDF. This may be a scanned/image-based PDF which is not supported."
        )
    return full_text


def call_llm(resume_text):
    """Send resume text to LLM for structured extraction."""
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not configured")

    payload = json.dumps({
        "model": "openai/gpt-4.1-nano:free",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Parse this resume:\n\n{resume_text[:8000]}"},
        ],
        "temperature": 0.1,
        "max_tokens": 1024,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    content = data["choices"][0]["message"]["content"].strip()

    # Strip markdown code fences if present
    if content.startswith("```"):
        lines = content.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines).strip()

    return json.loads(content)


def parse_multipart(headers, body):
    """Parse multipart form data manually."""
    content_type = headers.get("Content-Type", "")
    if "boundary=" not in content_type:
        raise ValueError("No boundary in content type")

    # Use cgi module for parsing
    environ = {
        "REQUEST_METHOD": "POST",
        "CONTENT_TYPE": content_type,
        "CONTENT_LENGTH": str(len(body)),
    }
    fs = cgi.FieldStorage(
        fp=io.BytesIO(body),
        environ=environ,
        keep_blank_values=True,
    )

    result = {}
    for key in fs.keys():
        item = fs[key]
        if hasattr(item, "file") and item.filename:
            result[key] = {
                "filename": item.filename,
                "data": item.file.read(),
            }
        else:
            result[key] = item.value
    return result


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            # Parse multipart form data
            form = parse_multipart(self.headers, body)

            file_info = form.get("file")
            if not file_info or not isinstance(file_info, dict):
                self._send_error(400, "No PDF file uploaded")
                return

            filename = file_info["filename"]
            file_bytes = file_info["data"]

            if not filename.lower().endswith(".pdf"):
                self._send_error(400, "Only PDF files are supported")
                return

            # Extract text from PDF
            raw_text = extract_pdf_text(file_bytes)

            # Parse with LLM
            parsed = call_llm(raw_text)

            # Include raw text and filename in response
            parsed["raw_text"] = raw_text
            parsed["pdf_filename"] = filename

            self._send_json(200, parsed)

        except ValueError as e:
            self._send_error(400, str(e))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            self._send_error(502, f"LLM API error ({e.code}): {error_body[:200]}")
        except Exception as e:
            self._send_error(500, f"Parse error: {str(e)}")

    def _send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, status, message):
        self._send_json(status, {"error": message})
