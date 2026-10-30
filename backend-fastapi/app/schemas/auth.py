"""Auth schemas for ParyatakRoute.

Defines request/response contracts for user registration, authentication,
token refresh, and user profile resolution.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="User's full display name", examples=["Pranjal Shrivastava"])
    email: EmailStr = Field(..., max_length=255, description="Valid email address for login and notifications", examples=["traveler@paryatakroute.org"])
    password: str = Field(..., min_length=8, max_length=128, description="Strong account password (minimum 8 characters)", examples=["SecurePassword123!"])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Pranjal Shrivastava",
                "email": "traveler@paryatakroute.org",
                "password": "SecurePassword123!",
            }
        }
    )


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered user email", examples=["traveler@paryatakroute.org"])
    password: str = Field(..., min_length=1, description="Account password", examples=["SecurePassword123!"])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "traveler@paryatakroute.org",
                "password": "SecurePassword123!",
            }
        }
    )


class RefreshTokenRequest(BaseModel):
    refreshToken: Optional[str] = Field(default=None, alias="refreshToken", description="Refresh token string", examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."])
    refresh_token: Optional[str] = Field(default=None, alias="refresh_token", description="Alternative snake_case refresh token alias")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
    )

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


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    avatar_url: Optional[str] = Field(default=None)
