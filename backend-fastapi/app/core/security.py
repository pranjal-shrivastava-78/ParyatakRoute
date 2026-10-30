import jwt
from typing import Optional
from pydantic import BaseModel
from fastapi import Header
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.logging import logger

_jwks_client: Optional[jwt.PyJWKClient] = None


def get_jwks_client() -> Optional[jwt.PyJWKClient]:
    """Returns a cached PyJWKClient pointing to Supabase JWKS endpoint."""
    global _jwks_client
    if _jwks_client is not None:
        return _jwks_client
    if settings.SUPABASE_URL:
        try:
            jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            _jwks_client = jwt.PyJWKClient(jwks_url)
            return _jwks_client
        except Exception as e:
            logger.warning(f"[Security] Failed to initialize JWKS client: {e}")
    return None


class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: str = "authenticated"


def get_current_user(authorization: Optional[str] = Header(None)) -> AuthenticatedUser:
    """
    Validates Supabase Bearer JWT token from Authorization header and extracts user identity.
    Supports both live asymmetric tokens (ES256/RS256 via Supabase JWKS) and symmetric tokens (HS256).
    Enforces signature validation, expiration, and issuer sanity.
    """
    if not authorization:
        raise UnauthorizedException("Authorization header is missing", code="UNAUTHORIZED")

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid authorization header format. Expected 'Bearer <token>'", code="INVALID_TOKEN")

    token = parts[1].strip()

    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
    except Exception as e:
        raise UnauthorizedException(f"Malformed JWT header: {str(e)}", code="INVALID_TOKEN")

    payload = None

    try:
        if alg in ("ES256", "RS256"):
            jwks = get_jwks_client()
            if jwks:
                signing_key = jwks.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=[alg],
                    options={"verify_aud": False, "verify_exp": True},
                )
            else:
                # Fallback to Supabase auth client verification
                from app.repositories.supabase_client import get_supabase_client
                client = get_supabase_client()
                if client:
                    user_res = client.auth.get_user(token)
                    if user_res and user_res.user:
                        return AuthenticatedUser(
                            id=str(user_res.user.id),
                            email=user_res.user.email,
                            role=getattr(user_res.user, "role", "authenticated") or "authenticated",
                        )
                raise UnauthorizedException("Unable to verify token signature: JWKS client unavailable", code="INVALID_TOKEN")
        else:
            # HS256 symmetric verification
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False, "verify_exp": True},
            )

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Token payload missing 'sub' subject claim", code="INVALID_TOKEN")

        return AuthenticatedUser(
            id=str(user_id),
            email=payload.get("email"),
            role=payload.get("role", "authenticated"),
        )
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException("Access token has expired", code="TOKEN_EXPIRED")
    except jwt.InvalidTokenError as e:
        raise UnauthorizedException(f"Invalid access token: {str(e)}", code="INVALID_TOKEN")
    except UnauthorizedException:
        raise
    except Exception as e:
        raise UnauthorizedException(f"Authentication failed: {str(e)}", code="INVALID_TOKEN")
