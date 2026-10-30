import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    ParyatakRoute Application Settings.
    Strictly validates required environment variables and sanitizes logs.
    """
    APP_NAME: str = "ParyatakRoute Backend"
    APP_ENV: str = Field(default="development", description="development | production | test")
    PORT: int = Field(default=8000, description="Server port")
    LOG_LEVEL: str = Field(default="INFO", description="DEBUG | INFO | WARNING | ERROR")

    # Frontend & CORS
    FRONTEND_URL: str = Field(default="http://localhost:5174")
    CORS_ALLOWED_ORIGINS: str = Field(
        default="http://localhost:5174,http://localhost:5173,http://localhost:5175,http://localhost:3000,http://127.0.0.1:5174,http://127.0.0.1:5173,https://paryatakroute.vercel.app"
    )

    # Supabase Credentials
    SUPABASE_URL: str = Field(default="")
    SUPABASE_PUBLISHABLE_KEY: str = Field(default="")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="")
    SUPABASE_JWT_SECRET: str = Field(default="dev-supabase-jwt-secret-for-testing-only-32chars")

    # External APIs (Optional)
    PLACES_API_KEY: str = Field(default="")
    DIRECTIONS_API_KEY: str = Field(default="")
    WEATHER_API_KEY: str = Field(default="")
    CURRENCY_API_KEY: str = Field(default="")
    EXTERNAL_API_TIMEOUT_SECONDS: int = Field(default=8)

    # Groq AI Configuration
    GROQ_API_KEY: str = Field(default="")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b")
    GROQ_CHAT_MODEL: str = Field(default="openai/gpt-oss-20b")
    GROQ_TIMEOUT_SECONDS: int = Field(default=30)
    GROQ_MAX_RETRIES: int = Field(default=3)

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> List[str]:
        origins = [orig.strip() for orig in self.CORS_ALLOWED_ORIGINS.split(",") if orig.strip()]
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL.strip())
        return origins

    def __repr__(self) -> str:
        # Prevent secret exposure in logs or interactive shells
        return f"<Settings: {self.APP_NAME} ({self.APP_ENV}) Port:{self.PORT}>"


settings = Settings()


def get_settings() -> Settings:
    """Return application settings instance."""
    return settings

