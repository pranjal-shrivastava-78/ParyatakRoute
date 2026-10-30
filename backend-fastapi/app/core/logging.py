"""Structured secret-safe logging for ParyatakRoute.

Provides sanitized log output ensuring credentials, tokens, and database passwords
are never leaked in stdout or platform log collectors.
"""
import logging
import re
import sys
from typing import Any
from app.core.config import settings

# Patterns for sensitive data sanitization
SENSITIVE_PATTERNS = [
    re.compile(r"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE),
    re.compile(r"(ey[A-Za-z0-9\-_=]+\.ey[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_.+/=]+)", re.IGNORECASE),  # JWT
    re.compile(r"(password|secret|apikey|api_key|token)[\"']?\s*[:=]\s*[\"']?([^\"'\s,]+)", re.IGNORECASE),
]


class SecretSanitizingFilter(logging.Filter):
    """Filter that strips out sensitive authentication secrets, JWTs, and passwords."""
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            sanitized = record.msg
            for pattern in SENSITIVE_PATTERNS:
                sanitized = pattern.sub(r"\1***REDACTED***", sanitized)
            record.msg = sanitized
        return True


def setup_logging() -> None:
    """Initialize root logging with standard format and secret sanitizer."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    root = logging.getLogger()
    root.setLevel(log_level)

    # Avoid adding duplicate handlers if already configured
    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                "[%(asctime)s] [%(levelname)s] [%(name)s] [ParyatakRoute] %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )
        handler.addFilter(SecretSanitizingFilter())
        root.addHandler(handler)


def get_logger(name: str = "paryatakroute") -> logging.Logger:
    """Get a named logger with secret sanitization enabled."""
    return logging.getLogger(name)


logger = get_logger("paryatakroute")
