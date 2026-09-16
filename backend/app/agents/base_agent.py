"""Shared LLM client for every agent. The model is pinned via settings.groq_model."""
from langchain_groq import ChatGroq

from app.config import get_settings


def get_llm(
    temperature: float | None = None, max_tokens: int = 1400, api_key: str | None = None
) -> ChatGroq:
    """Shared ChatGroq factory. Pass `api_key` to give an agent its own dedicated
    key (e.g. settings.groq_product_strategist_api_key) so it draws from a
    separate 8000 TPM bucket instead of sharing GROQ_API_KEY with every other
    agent; omit it (or leave the agent-specific setting blank) to fall back to
    the shared GROQ_API_KEY.
    """
    settings = get_settings()
    resolved_key = api_key or settings.groq_api_key
    if not resolved_key:
        raise RuntimeError("GROQ_API_KEY is not configured")
    return ChatGroq(
        model=settings.groq_model,
        api_key=resolved_key,
        temperature=settings.groq_temperature if temperature is None else temperature,
        # Groq's TPM rate limit counts requested completion tokens up front, not just
        # what's actually generated. Leaving this unset asks for the model's full
        # default output allowance and blows the account's 8000 TPM cap even on a
        # small prompt — always cap it explicitly.
        max_tokens=max_tokens,
        # gpt-oss-120b is a reasoning model: Groq reserves a large hidden
        # reasoning-token budget on top of max_tokens unless this is capped,
        # which is what was blowing the 8000 TPM preflight check.
        reasoning_effort="low",
        max_retries=2,
    )
