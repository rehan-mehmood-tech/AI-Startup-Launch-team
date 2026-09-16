"""Post-processing citation guard (PRD §3.2 'Structured URL Retention Script').

Walks every URL the LLM cited and verifies it actually appeared in the raw
SerpApi response set, preventing hallucinated citations from reaching the
Orchestrator's `verified_resources`.
"""
from __future__ import annotations

from app.models.agent_output_schemas import MarketResearchOutput
from app.tools.serpapi_client import normalize_url


class UnverifiedCitationError(ValueError):
    """Raised when the LLM cites a URL that never appeared in raw_sources."""

    def __init__(self, bad_urls: list[str]):
        self.bad_urls = bad_urls
        super().__init__(f"Cited URL(s) not present in verified raw_sources: {bad_urls}")


def verify_citations(output: MarketResearchOutput, allowed_sources: list[str]) -> None:
    """Raise UnverifiedCitationError if any cited URL is not in allowed_sources."""
    allowed = {normalize_url(u) for u in allowed_sources}
    cited = {c.source_url for c in output.competitor_analysis} | {
        p.evidence_source_url for p in output.customer_pain_points
    }
    bad = sorted(u for u in cited if normalize_url(u) not in allowed)
    if bad:
        raise UnverifiedCitationError(bad)
