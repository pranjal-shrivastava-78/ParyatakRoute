"""Auth schemas for ParyatakRoute.

Defines request/response contracts for user registration, authentication,
token refresh, and user profile resolution.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="User's display name")
    email: EmailStr = Field(..., max_length=255, description="Valid user email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password with min 8 characters")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User's registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class RefreshTokenRequest(BaseModel):
    refreshToken: Optional[str] = Field(default=None, alias="refreshToken")
    refresh_token: Optional[str] = Field(default=None, alias="refresh_token")

    @property
    def token(self) -> str:
        t = self.refreshToken or self.refresh_token
        if not t:
            raise ValueError("Refresh token is required")
        return t


class SafeUser(BaseModel):
    id: str
    name: str
    email: str
    role: str = "user"
    status: str = "active"
    avatar_url: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class AuthTokens(BaseModel):
    accessToken: str
    refreshToken: str
    expiresIn: str = "1h"
    tokenType: str = "Bearer"


class AuthResponseData(BaseModel):
    user: SafeUser
    tokens: AuthTokens


class UserProfileResponse(BaseModel):
    id: str
    email: Optional[EmailStr] = None
    name: str
    role: str = "user"
    status: str = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
