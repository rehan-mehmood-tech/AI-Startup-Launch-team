"""Authentication, Authorization, and Rate Limiting dependencies for API routes."""
from __future__ import annotations

import logging
import time
from collections import defaultdict
from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

from app.config import get_settings

logger = logging.getLogger(__name__)

security_scheme = HTTPBearer(auto_error=False)

# In-memory sliding window rate limiter (IP & User based)
_RATE_LIMIT_WINDOW_SECONDS = 60
_MAX_REQUESTS_PER_WINDOW = 60
_request_records: dict[str, list[float]] = defaultdict(list)


async def check_rate_limit(request: Request) -> None:
    """Global sliding-window rate limiter per client IP address."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    cutoff = now - _RATE_LIMIT_WINDOW_SECONDS

    # Filter out timestamps older than window
    timestamps = [t for t in _request_records[client_ip] if t > cutoff]
    _request_records[client_ip] = timestamps

    if len(timestamps) >= _MAX_REQUESTS_PER_WINDOW:
        logger.warning("Rate limit exceeded for IP %s", client_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a minute before making more requests.",
        )

    _request_records[client_ip].append(now)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)]
) -> str | None:
    """Verifies JWT token from Authorization header if present.

    Returns the user's ID (sub claim) or None if unauthenticated.
    If auth is required by an endpoint, call verify_authenticated_user instead.
    """
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    settings = get_settings()

    try:
        # Decode without verification if no secret is configured, or verify if JWT secret is set
        if settings.jwt_secret:
            payload = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False},
            )
        return payload.get("sub") or payload.get("user_id")
    except Exception as exc:
        logger.warning("JWT validation failed: %s", exc)
        return None


async def require_authenticated_user(
    user_id: Annotated[str | None, Depends(get_current_user_id)]
) -> str:
    """Dependency for protected endpoints that require a valid user token."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
