"""Deterministic platform-formatting wrappers for the Marketing Agent (PRD §3.5).

The LLM writes the copy, but algorithm-specific hard constraints (X/Twitter's
280-character limit, in particular) are enforced here in Python rather than
trusted to the model — the same "don't let the LLM own the math/format rules"
principle used in pricing_calculator.py.
"""
from __future__ import annotations

TWITTER_CHAR_LIMIT = 280
_THREAD_INDEX_RESERVE = 10  # room for "(12/12) " prefixes


def _is_twitter(channel_name: str) -> bool:
    name = channel_name.strip().lower()
    return name in ("x", "twitter", "x (twitter)", "twitter/x") or "twitter" in name or name == "x"


def format_twitter_thread(text: str, limit: int = TWITTER_CHAR_LIMIT) -> str:
    """Split oversized copy into a numbered thread instead of silently
    truncating it — each tweet (including its "(n/N) " prefix) fits the limit."""
    text = " ".join(text.split())  # normalize whitespace
    if len(text) <= limit:
        return text

    budget = limit - _THREAD_INDEX_RESERVE
    words = text.split(" ")
    chunks: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) > budget:
            if current:
                chunks.append(current)
            current = word
        else:
            current = candidate
    if current:
        chunks.append(current)

    total = len(chunks)
    return "\n\n".join(f"({i + 1}/{total}) {chunk}" for i, chunk in enumerate(chunks))


def apply_platform_formatting(channel_name: str, post_content: str) -> str:
    """Route to the right deterministic formatter for the given channel's
    algorithm rules. Currently only X/Twitter has a hard length constraint;
    other channels pass through the LLM's copy as-is."""
    if _is_twitter(channel_name):
        return format_twitter_thread(post_content)
    return post_content
