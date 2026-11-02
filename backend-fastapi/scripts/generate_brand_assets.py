import base64
from pathlib import Path

repo_root = Path(__file__).resolve().parent.parent.parent
dark_path = repo_root / "frontend" / "public" / "emblem-dark.png"
light_path = repo_root / "frontend" / "public" / "emblem-light.png"

with open(dark_path, "rb") as f:
    dark_b64 = base64.b64encode(f.read()).decode("ascii")

with open(light_path, "rb") as f:
    light_b64 = base64.b64encode(f.read()).decode("ascii")

brand_py_path = repo_root / "backend-fastapi" / "app" / "core" / "brand.py"

brand_content = f'''"""Official brand assets and identity constants for ParyatakRoute.

Provides high-resolution, embedded PNG data URIs of the authentic ParyatakRoute
compass pin emblem (dark and light variants) directly extracted from the frontend assets,
along with official brand metadata, color tokens, and domain URLs.
"""

BRAND_NAME = "ParyatakRoute"
BRAND_TAGLINE = "Your Journey, Intelligently Planned."
MAIN_WEBSITE_URL = "https://paryatakroute.itspranjal.in/"
API_BASE_URL = "https://paryatakrouteapi.itspranjal.in/api/v1"

# Official Compass Pin Emblem (Dark variant - optimized for dark Forest Green #183D32 surfaces)
EMBLEM_DARK_PNG_BASE64 = "{dark_b64}"
EMBLEM_DARK_DATA_URI = "data:image/png;base64," + EMBLEM_DARK_PNG_BASE64

# Official Compass Pin Emblem (Light variant - optimized for light Warm Ivory #F7F5EF surfaces & browser favicon)
EMBLEM_LIGHT_PNG_BASE64 = "{light_b64}"
EMBLEM_LIGHT_DATA_URI = "data:image/png;base64," + EMBLEM_LIGHT_PNG_BASE64

# Official Browser Favicon (uses light-contrast emblem matching frontend/index.html)
PARYATAK_FAVICON_DATA_URI = EMBLEM_LIGHT_DATA_URI
PARYATAK_FAVICON_SVG = PARYATAK_FAVICON_DATA_URI  # Backwards compatibility alias
'''

with open(brand_py_path, "w", encoding="utf-8") as f:
    f.write(brand_content)

print(f"Generated {brand_py_path} successfully. Dark b64: {len(dark_b64)}, Light b64: {len(light_b64)}")

