"""Build script to compile docs_template.html + docs_data.json + brand assets into docs_portal.py.
"""
import json
from pathlib import Path
import sys

# Ensure backend-fastapi directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.brand import (
    EMBLEM_DARK_DATA_URI,
    EMBLEM_LIGHT_DATA_URI,
    PARYATAK_FAVICON_DATA_URI,
    MAIN_WEBSITE_URL,
)

template_path = backend_dir / "app" / "core" / "docs_template.html"
data_path = backend_dir / "app" / "core" / "docs_data.json"
output_path = backend_dir / "app" / "core" / "docs_portal.py"

with open(template_path, "r", encoding="utf-8") as f:
    template_content = f.read()

with open(data_path, "r", encoding="utf-8") as f:
    docs_data_str = f.read()

# Replace placeholders
compiled_html = template_content.replace("{{DOCS_DATA_JSON}}", docs_data_str)
compiled_html = compiled_html.replace("{{EMBLEM_DARK_DATA_URI}}", EMBLEM_DARK_DATA_URI)
compiled_html = compiled_html.replace("{{EMBLEM_LIGHT_DATA_URI}}", EMBLEM_LIGHT_DATA_URI)
compiled_html = compiled_html.replace("{{PARYATAK_FAVICON_DATA_URI}}", PARYATAK_FAVICON_DATA_URI)
compiled_html = compiled_html.replace("{{MAIN_WEBSITE_URL}}", MAIN_WEBSITE_URL)

# Safety check: ensure no raw vercel redirect URLs remain
assert "paryatakroute.vercel.app" not in compiled_html, "Found outdated paryatakroute.vercel.app in compiled HTML!"

# Write out docs_portal.py as a clean Python module with HTML_PAGE repr
portal_py_content = f'''"""ParyatakRoute Premium Developer Documentation Portal.

Visually matches the ParyatakRoute website branding (Forest Green #183D32, Terracotta #D97745,
Warm Ivory #F7F5EF) with interactive API explorer, live health status, code snippet generators,
and real-time endpoint execution.
"""
from fastapi.responses import HTMLResponse

HTML_PAGE = {repr(compiled_html)}


def get_paryatak_docs_portal_html() -> HTMLResponse:
    """Generates the premium ParyatakRoute Developer Documentation Portal HTML."""
    response = HTMLResponse(content=HTML_PAGE)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response
'''

with open(output_path, "w", encoding="utf-8") as f:
    f.write(portal_py_content)

print(f"Successfully compiled {output_path} ({len(portal_py_content)} bytes).")

