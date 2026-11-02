"""Builder script to generate app/core/docs_portal.py and app/core/docs_data.json."""
import json
import re
from app.main import app

PARYATAK_FAVICON_SVG = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0 0 32 32'%20fill='none'%3E%3Crect%20width='32'%20height='32'%20rx='8'%20fill='%23183D32'/%3E%3Cpath%20d='M16%205L19%2013L27%2016L19%2019L16%2027L13%2019L5%2016L13%2013L16%205Z'%20fill='%23D97745'/%3E%3Ccircle%20cx='16'%20cy='16'%20r='3.5'%20fill='%23F7F5EF'/%3E%3C/svg%3E"

def resolve_ref(ref_str, schemas):
    if not ref_str or not ref_str.startswith("#/components/schemas/"):
        return {}
    name = ref_str.split("/")[-1]
    return schemas.get(name, {})

def generate_sample_from_schema(schema, schemas, depth=0):
    if depth > 4:
        return {}
    if "$ref" in schema:
        resolved = resolve_ref(schema["$ref"], schemas)
        return generate_sample_from_schema(resolved, schemas, depth + 1)
    
    t = schema.get("type", "object")
    if t == "string":
        if "example" in schema:
            return schema["example"]
        fmt = schema.get("format", "")
        if fmt == "date":
            return "2026-11-15"
        if fmt == "date-time":
            return "2026-11-15T10:00:00Z"
        if fmt == "uuid":
            return "a1111111-2222-3333-4444-555555555551"
        if "enum" in schema:
            return schema["enum"][0]
        title = schema.get("title", "").lower()
        if "email" in title:
            return "traveler@paryatakroute.in"
        if "password" in title:
            return "ParyatakPass123!"
        if "name" in title:
            return "Aarav Sharma"
        if "destination" in title:
            return "Jaipur, Rajasthan"
        if "currency" in title:
            return "INR"
        return schema.get("title", "sample_string").lower()
    elif t in ("integer", "number"):
        return schema.get("example", 1)
    elif t == "boolean":
        return schema.get("example", True)
    elif t == "array":
        items = schema.get("items", {})
        return [generate_sample_from_schema(items, schemas, depth + 1)]
    elif t == "object":
        props = schema.get("properties", {})
        out = {}
        for k, v in props.items():
            out[k] = generate_sample_from_schema(v, schemas, depth + 1)
        return out
    return {}

def build_portal():
    schema = app.openapi()
    paths = schema.get("paths", {})
    schemas = schema.get("components", {}).get("schemas", {})

    categories = [
        {
            "id": "authentication",
            "title": "Authentication",
            "badge": "Auth",
            "description": "User registration, session login, JWT Bearer token refresh, session revocation, and profile management.",
            "patterns": [r"^/api/v1/auth/"]
        },
        {
            "id": "itineraries",
            "title": "Travel & Itinerary",
            "badge": "AI & Itinerary",
            "description": "AI-powered itinerary generation via Groq LLM, multi-day chunking, surgical day regeneration, budget analytics, and high-resolution PDF compilation.",
            "patterns": [r"^/api/v1/itineraries"]
        },
        {
            "id": "trips",
            "title": "Trips",
            "badge": "Trips CRUD",
            "description": "Trip lifecycle management: create, inspect, update, and delete trip records with user tenant isolation (BOLA protection).",
            "patterns": [r"^/api/v1/trips"]
        },
        {
            "id": "explore",
            "title": "Explore & Geospatial",
            "badge": "Geospatial",
            "description": "OpenStreetMap Nominatim geocoding, OSRM driving route calculations, Open-Meteo weather forecasts, and currency exchange rates.",
            "patterns": [r"^/api/v1/destinations", r"^/api/v1/directions", r"^/api/v1/weather", r"^/api/v1/currency"]
        },
        {
            "id": "chat",
            "title": "AI Assistant",
            "badge": "AI Assistant",
            "description": "Context-aware conversational travel assistant powered by Groq AI, leveraging user trip and itinerary context.",
            "patterns": [r"^/api/v1/chat"]
        },
        {
            "id": "favourites",
            "title": "Saved Items",
            "badge": "Bookmarks",
            "description": "Destination bookmarks and saved places with user-specific duplicate protection and ownership enforcement.",
            "patterns": [r"^/api/v1/favourites"]
        },
        {
            "id": "system",
            "title": "System & Health",
            "badge": "Probes",
            "description": "Application root index, liveness health probes, Supabase PostgreSQL database readiness checks, and error responses.",
            "patterns": [r"^/$", r"^/health", r"^/api/v1/health"]
        }
    ]

    endpoints_by_cat = {c["id"]: [] for c in categories}

    for path, methods in sorted(paths.items()):
        for method, op in sorted(methods.items()):
            matched_cat = None
            for cat in categories:
                for pattern in cat["patterns"]:
                    if re.search(pattern, path):
                        matched_cat = cat["id"]
                        break
                if matched_cat:
                    break
            
            if not matched_cat:
                matched_cat = "system"

            slug = f"{method.lower()}-{re.sub(r'[^a-zA-Z0-9]+', '-', path).strip('-')}"
            summary = op.get("summary", path)
            desc = op.get("description", "")
            tags = op.get("tags", [])
            auth_required = bool(op.get("security")) or any(p.get("name") == "authorization" for p in op.get("parameters", []))

            # Parameters
            params = []
            for p in op.get("parameters", []):
                p_name = p.get("name")
                if p_name.lower() == "authorization":
                    continue
                p_in = p.get("in", "query")
                p_req = p.get("required", False)
                p_desc = p.get("description", "")
                p_schema = p.get("schema", {})
                p_type = p_schema.get("type", "string")
                p_def = p_schema.get("default", "")
                params.append({
                    "name": p_name,
                    "in": p_in,
                    "required": p_req,
                    "type": p_type,
                    "description": p_desc,
                    "default": p_def
                })

            # Request Body
            req_body = None
            if "requestBody" in op:
                rb_content = op["requestBody"].get("content", {})
                if "application/json" in rb_content:
                    rb_schema = rb_content["application/json"].get("schema", {})
                    rb_example = generate_sample_from_schema(rb_schema, schemas)
                    req_body = {
                        "required": op["requestBody"].get("required", False),
                        "example": rb_example,
                        "schema_title": rb_schema.get("title", "RequestBody")
                    }

            # Responses
            responses = []
            for status_code, resp_obj in op.get("responses", {}).items():
                r_desc = resp_obj.get("description", "")
                r_content = resp_obj.get("content", {})
                r_example = None
                if "application/json" in r_content:
                    r_schema = r_content["application/json"].get("schema", {})
                    r_example = generate_sample_from_schema(r_schema, schemas)
                responses.append({
                    "status": status_code,
                    "description": r_desc,
                    "example": r_example
                })

            endpoint_data = {
                "id": slug,
                "path": path,
                "method": method.upper(),
                "summary": summary,
                "description": desc,
                "tags": tags,
                "auth": auth_required,
                "parameters": params,
                "requestBody": req_body,
                "responses": responses
            }
            endpoints_by_cat[matched_cat].append(endpoint_data)

    portal_data = {"categories": categories, "endpoints": endpoints_by_cat}

    # Save docs_data.json
    with open("app/core/docs_data.json", "w", encoding="utf-8") as f:
        json.dump(portal_data, f, indent=2)
    print("Saved app/core/docs_data.json")

    # Read HTML template
    with open("app/core/docs_template.html", "r", encoding="utf-8") as f:
        html_template = f.read()

    rendered_html = html_template.replace("{{FAVICON_SVG}}", PARYATAK_FAVICON_SVG)
    rendered_html = rendered_html.replace("{{DOCS_DATA_JSON}}", json.dumps(portal_data))

    # Write docs_portal.py
    portal_py = f'''"""ParyatakRoute Premium Developer Documentation Portal.

Visually matches the ParyatakRoute website branding (Forest Green #183D32, Terracotta #D97745,
Warm Ivory #F7F5EF) with interactive API explorer, live health status, code snippet generators,
and real-time endpoint execution.
"""
from fastapi.responses import HTMLResponse

HTML_PAGE = {repr(rendered_html)}

def get_paryatak_docs_portal_html() -> HTMLResponse:
    """Generates the premium ParyatakRoute Developer Documentation Portal HTML."""
    response = HTMLResponse(content=HTML_PAGE)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response
'''
    with open("app/core/docs_portal.py", "w", encoding="utf-8") as f:
        f.write(portal_py)
    print("app/core/docs_portal.py generated successfully!")

if __name__ == "__main__":
    build_portal()
