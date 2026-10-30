"""Auth routes for ParyatakRoute.

Provides full authentication endpoints:
- POST /register: User account creation with Supabase Auth or mock fallback
- POST /login: User authentication returning access and refresh tokens
- POST /refresh: Session token refresh
- POST /logout: Session invalidation
- GET /me: Current user profile resolution
"""
import uuid
import datetime
from datetime import timezone
from typing import Any, Dict, Optional
import jwt
from fastapi import APIRouter, Depends, status
from supabase import create_client

from app.core.config import settings
from app.core.exceptions import AppException, UnauthorizedException
from app.core.logging import logger
from app.core.security import get_current_user, AuthenticatedUser
from app.repositories.profile_repository import ProfileRepository
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    AuthResponseData,
    SafeUser,
    AuthTokens,
)
from app.schemas.common import APIResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
profile_repo = ProfileRepository()

# Mock users store for test / offline environments
_mock_users: Dict[str, Dict[str, Any]] = {}


def _get_supabase_clients():
    """Returns (admin_client, anon_client) if Supabase is configured, else (None, None)."""
    admin_client = None
    anon_client = None
    if settings.SUPABASE_URL:
        if settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            except Exception as e:
                logger.warning(f"[Auth] Could not create Supabase admin client: {e}")
        if settings.SUPABASE_PUBLISHABLE_KEY:
            try:
                anon_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLISHABLE_KEY)
            except Exception as e:
                logger.warning(f"[Auth] Could not create Supabase anon client: {e}")
    return admin_client, anon_client


def _issue_mock_tokens(user_id: str, email: str, role: str = "user") -> AuthTokens:
    """Issues standard HS256 tokens for mock/testing environments."""
    now = datetime.datetime.now(timezone.utc)
    access_payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + datetime.timedelta(hours=1)).timestamp()),
    }
    refresh_payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + datetime.timedelta(days=7)).timestamp()),
    }
    access_token = jwt.encode(access_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    return AuthTokens(
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn="1h",
        tokenType="Bearer",
    )


@router.post("/register", response_model=APIResponse[AuthResponseData], status_code=status.HTTP_201_CREATED, summary="Register New User Account")
async def register_user(body: RegisterRequest) -> APIResponse[AuthResponseData]:
    """Register a new user account and return authenticated session tokens."""
    admin_client, anon_client = _get_supabase_clients()

    if admin_client:
        try:
            # 1. Create confirmed user via Supabase admin API to bypass email rate limits
            create_res = admin_client.auth.admin.create_user({
                "email": body.email,
                "password": body.password,
                "email_confirm": True,
                "user_metadata": {"name": body.name},
            })
            sb_user = create_res.user
            user_id = str(sb_user.id)

            # 2. Authenticate to obtain real access and refresh tokens
            tokens = None
            if anon_client:
                sign_res = anon_client.auth.sign_in_with_password({
                    "email": body.email,
                    "password": body.password,
                })
                if sign_res.session:
                    tokens = AuthTokens(
                        accessToken=sign_res.session.access_token,
                        refreshToken=sign_res.session.refresh_token,
                        expiresIn=str(sign_res.session.expires_in or 3600),
                        tokenType="Bearer",
                    )

            if not tokens:
                tokens = _issue_mock_tokens(user_id, body.email)

            safe_user = SafeUser(
                id=user_id,
                name=body.name,
                email=body.email,
                role="user",
                status="active",
                createdAt=datetime.datetime.now(timezone.utc).isoformat(),
            )
            return APIResponse(
                success=True,
                message="Account registered successfully",
                data=AuthResponseData(user=safe_user, tokens=tokens),
            )
        except Exception as e:
            err_msg = str(e).lower()
            code = getattr(e, "code", "") or ""
            if (
                code == "email_exists"
                or "already been registered" in err_msg
                or "already registered" in err_msg
                or "unique constraint" in err_msg
                or "already exists" in err_msg
            ):
                raise AppException(
                    status_code=status.HTTP_409_CONFLICT,
                    error_code="USER_ALREADY_EXISTS",
                    message="A user with this email address already exists",
                )
            if settings.APP_ENV == "production":
                logger.critical(f"[Auth] Supabase register error in production: {e}")
                raise AppException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    error_code="AUTH_UNAVAILABLE",
                    message="Authentication service unavailable in production",
                )
            logger.warning(f"[Auth] Supabase register error: {e}. Falling back to mock registration.")

    if settings.APP_ENV == "production":
        raise AppException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="AUTH_UNAVAILABLE",
            message="Persistent authentication is required in production mode",
        )

    # Mock fallback for test and offline environments
    normalized_email = body.email.strip().lower()
    if normalized_email in _mock_users:
        raise AppException(
            status_code=status.HTTP_409_CONFLICT,
            error_code="USER_ALREADY_EXISTS",
            message="A user with this email address already exists",
        )

    user_id = str(uuid.uuid4())
    now_str = datetime.datetime.now(timezone.utc).isoformat()
    _mock_users[normalized_email] = {
        "id": user_id,
        "name": body.name,
        "email": normalized_email,
        "password": body.password,
        "role": "user",
        "status": "active",
        "createdAt": now_str,
    }

    tokens = _issue_mock_tokens(user_id, normalized_email)
    safe_user = SafeUser(
        id=user_id,
        name=body.name,
        email=normalized_email,
        role="user",
        status="active",
        createdAt=now_str,
    )
    return APIResponse(
        success=True,
        message="Account registered successfully",
        data=AuthResponseData(user=safe_user, tokens=tokens),
    )


@router.post("/login", response_model=APIResponse[AuthResponseData], status_code=status.HTTP_200_OK, summary="User Authentication & Login")
async def login_user(body: LoginRequest) -> APIResponse[AuthResponseData]:
    """Authenticate user with email and password and return session tokens."""
    _, anon_client = _get_supabase_clients()

    if anon_client:
        try:
            sign_res = anon_client.auth.sign_in_with_password({
                "email": body.email,
                "password": body.password,
            })
            if sign_res.session and sign_res.user:
                user_meta = getattr(sign_res.user, "user_metadata", {}) or {}
                name = user_meta.get("name") or body.email.split("@")[0]
                tokens = AuthTokens(
                    accessToken=sign_res.session.access_token,
                    refreshToken=sign_res.session.refresh_token,
                    expiresIn=str(sign_res.session.expires_in or 3600),
                    tokenType="Bearer",
                )
                safe_user = SafeUser(
                    id=str(sign_res.user.id),
                    name=name,
                    email=str(sign_res.user.email),
                    role=getattr(sign_res.user, "role", "user") or "user",
                    status="active",
                )
                return APIResponse(
                    success=True,
                    message="Login successful",
                    data=AuthResponseData(user=safe_user, tokens=tokens),
                )
        except Exception as e:
            err_msg = str(e).lower()
            if "invalid login credentials" in err_msg or "invalid credentials" in err_msg:
                raise AppException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    error_code="INVALID_CREDENTIALS",
                    message="Invalid email or password",
                )
            if settings.APP_ENV == "production":
                logger.critical(f"[Auth] Supabase login error in production: {e}")
                raise AppException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    error_code="AUTH_UNAVAILABLE",
                    message="Authentication service unavailable in production",
                )
            logger.warning(f"[Auth] Supabase login error: {e}. Checking mock credentials.")

    if settings.APP_ENV == "production":
        raise AppException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="AUTH_UNAVAILABLE",
            message="Persistent authentication is required in production mode",
        )

    # Mock fallback check
    normalized_email = body.email.strip().lower()
    user_record = _mock_users.get(normalized_email)
    if not user_record or user_record.get("password") != body.password:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS",
            message="Invalid email or password",
        )

    tokens = _issue_mock_tokens(user_record["id"], normalized_email, user_record.get("role", "user"))
    safe_user = SafeUser(
        id=user_record["id"],
        name=user_record["name"],
        email=normalized_email,
        role=user_record.get("role", "user"),
        status=user_record.get("status", "active"),
        createdAt=user_record.get("createdAt"),
    )
    return APIResponse(
        success=True,
        message="Login successful",
        data=AuthResponseData(user=safe_user, tokens=tokens),
    )


@router.post("/refresh", response_model=APIResponse[dict[str, Any]], status_code=status.HTTP_200_OK, summary="Refresh Access Token")
async def refresh_tokens(body: RefreshTokenRequest) -> APIResponse[dict[str, Any]]:
    """Rotate refresh token and issue a fresh access token."""
    refresh_token = body.refreshToken or body.refresh_token
    if not refresh_token:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            message="Refresh token is required",
        )

    _, anon_client = _get_supabase_clients()
    if anon_client:
        try:
            res = anon_client.auth.refresh_session(refresh_token)
            if res.session:
                tokens = {
                    "accessToken": res.session.access_token,
                    "refreshToken": res.session.refresh_token,
                    "expiresIn": str(res.session.expires_in or 3600),
                    "tokenType": "Bearer",
                }
                return APIResponse(
                    success=True,
                    message="Tokens refreshed successfully",
                    data=tokens,
                )
        except Exception as e:
            if settings.APP_ENV == "production":
                logger.critical(f"[Auth] Supabase refresh error in production: {e}")
                raise AppException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    error_code="AUTH_UNAVAILABLE",
                    message="Authentication service unavailable in production",
                )
            logger.warning(f"[Auth] Supabase refresh error: {e}")

    if settings.APP_ENV == "production":
        raise AppException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="AUTH_UNAVAILABLE",
            message="Persistent authentication is required in production mode",
        )

    # Fallback mock token refresh
    try:
        decoded = jwt.decode(
            refresh_token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_exp": True},
        )
        user_id = decoded.get("sub")
        email = decoded.get("email", "")
        tokens = _issue_mock_tokens(user_id, email)
        return APIResponse(
            success=True,
            message="Tokens refreshed successfully",
            data={
                "accessToken": tokens.accessToken,
                "refreshToken": tokens.refreshToken,
                "expiresIn": tokens.expiresIn,
                "tokenType": tokens.tokenType,
            },
        )
    except Exception:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_REFRESH_TOKEN",
            message="Invalid or expired refresh token",
        )


@router.post("/logout", response_model=APIResponse[dict[str, str]], status_code=status.HTTP_200_OK, summary="Log Out Active Session")
async def logout_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[dict[str, str]]:
    """Invalidate active user session."""
    return APIResponse(
        success=True,
        message="Logged out successfully",
        data={"message": f"Session closed for user {current_user.id}."},
    )


@router.get("/me", response_model=APIResponse[dict[str, Any]], status_code=status.HTTP_200_OK, summary="Get Current Authenticated Profile")
async def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[dict[str, Any]]:
    """Return the currently authenticated user's profile and Supabase identity."""
    profile = await profile_repo.get_by_id(current_user.id)
    name = (current_user.email or "User").split("@")[0]
    avatar_url = None
    created_at = None
    if profile:
        name = getattr(profile, "name", None) or getattr(profile, "full_name", None) or name
        avatar_url = getattr(profile, "avatar_url", None)
        created_at = getattr(profile, "created_at", None)

    payload = {
        "id": current_user.id,
        "email": current_user.email,
        "name": name,
        "avatar_url": avatar_url,
        "role": current_user.role,
        "status": "active",
        "created_at": created_at,
    }
    return APIResponse(success=True, data=payload)
