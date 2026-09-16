"""Deterministic low-information pre-flight guard for the Orchestrator (PRD §3.6).

A wizard field can be technically present (passes Pydantic's min_length) and
still be vague, low-effort input ("I want to build a new Instagram"). This
heuristic — not the LLM — decides whether to raise the Low-Information
Warning, so the flag can't be argued away by a confident-sounding LLM.
"""
from __future__ import annotations

from pydantic import BaseModel

from app.models.schemas import OrchestratorInput

MIN_CORE_IDEA_WORDS = 8
MIN_CORE_FEATURE_WORDS = 4

# Generic "X for Y" / copycat phrasing with no specifics is the PRD's own
# example of a low-information idea.
GENERIC_COPYCAT_PATTERNS = (
    "new instagram",
    "new facebook",
    "new tiktok",
    "new uber",
    "next facebook",
    "next instagram",
    "next tiktok",
    "next uber",
    "like uber but",
    "like airbnb but",
    "another social media app",
    "just an app",
)

# Per-field penalty applied when that field trips the guard; capped at 1.0 total.
FIELD_PENALTY = 0.2


class PreflightResult(BaseModel):
    triggered: bool
    affected_fields: list[str]
    confidence_penalty: float


def _word_count(text: str) -> int:
    return len([w for w in text.strip().split() if w])


def _is_generic_copycat(text: str) -> bool:
    lowered = text.lower()
    return any(pattern in lowered for pattern in GENERIC_COPYCAT_PATTERNS)


def run_preflight_guard(req: OrchestratorInput) -> PreflightResult:
    affected: list[str] = []

    core_idea = req.market_research.core_idea
    if _word_count(core_idea) < MIN_CORE_IDEA_WORDS or _is_generic_copycat(core_idea):
        affected.append("market_research.core_idea")

    if not req.market_research.known_competitors:
        affected.append("market_research.known_competitors")

    demo = req.market_research.audience_demographics
    if not any([demo.age_range, demo.income_band, demo.segment]):
        affected.append("market_research.audience_demographics")

    if _word_count(req.core_feature) < MIN_CORE_FEATURE_WORDS or _is_generic_copycat(req.core_feature):
        affected.append("core_feature")

    triggered = bool(affected)
    penalty = round(min(len(affected) * FIELD_PENALTY, 1.0), 2)
    return PreflightResult(triggered=triggered, affected_fields=affected, confidence_penalty=penalty)
