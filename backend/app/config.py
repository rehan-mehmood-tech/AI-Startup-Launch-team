"""Application settings loaded from environment / backend/.env."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AI Startup Launch Team API"

    serpapi_api_key: str = ""
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    groq_temperature: float = 0.2

    # Per-agent Groq keys let each agent draw from its own 8000 TPM bucket
    # instead of all agents fighting over one account's rate limit. Falls back
    # to groq_api_key when an agent-specific key isn't set.
    groq_product_strategist_api_key: str = ""
    groq_pricing_agent_api_key: str = ""
    groq_marketing_agent_api_key: str = ""
    groq_orchestrator_agent_api_key: str = ""

    serpapi_timeout_seconds: float = 20.0
    serpapi_max_attempts: int = 3
    serpapi_backoff_base_seconds: float = 2.0
    serpapi_max_workers: int = 6

    # Supabase: Postgres persistence + auth for workspaces/agent_runs (see
    # database_schema.sql). service_role bypasses RLS — backend-only, never
    # ship it to a client; anon_key is safe for a browser/frontend context.
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
