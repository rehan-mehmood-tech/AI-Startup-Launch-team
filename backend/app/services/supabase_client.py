"""Supabase client factory (see database_schema.sql for the schema).

Uses the service_role key, which bypasses Row Level Security entirely — that
is intentional and matches the schema's own design: `agent_runs` and
`resource_links` are read-only to authenticated clients (their RLS policies
only define `select`), so the backend is the *only* writer for those tables,
and it authenticates to Postgres as service_role to do it. Never expose this
key outside the backend process.

supabase-py's `Client` is synchronous (backed by httpx under the hood, not
asyncio), so every call is dispatched through `run_sync` (asyncio.to_thread)
to avoid blocking the event loop inside our async FastAPI routes/agents.
"""
from __future__ import annotations

import asyncio
from functools import lru_cache
from typing import Any, Callable, TypeVar

from supabase import Client, create_client

from app.config import get_settings

T = TypeVar("T")


class SupabaseNotConfiguredError(RuntimeError):
    """Raised when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing."""


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SupabaseNotConfiguredError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured — "
            "set them in backend/.env (see .env.example)."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def run_sync(fn: Callable[[], T]) -> T:
    """Run a blocking supabase-py call (a `client.table(...)....execute()`
    thunk) off the event loop."""
    return await asyncio.to_thread(fn)
