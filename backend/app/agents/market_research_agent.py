"""Market Research Agent (PRD §3.2): SerpApi grounding -> Groq -> strict schema.

Flow: run the SerpApi market scan -> prompt the LLM with only the grounded
SERP data -> validate against MarketResearchOutput -> on failure (bad JSON,
Pydantic error, or a hallucinated citation) do ONE corrective retry that
appends the exact validation error -> on a second failure, degrade instead
of crashing the pipeline (PRD §2.3).
"""
from __future__ import annotations

import json
import logging
from typing import Literal

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, ValidationError

from app.agents.base_agent import get_llm
from app.agents.prompts.market_research_prompt import CORRECTIVE_RETRY_TEMPLATE, SYSTEM_PROMPT
from app.models.agent_output_schemas import MarketResearchOutput
from app.models.schemas import MarketResearchInput, SerpIntelligenceBundle
from app.tools.serpapi_client import SerpApiClient, SerpToolError
from app.tools.url_retention import UnverifiedCitationError, verify_citations

logger = logging.getLogger(__name__)

MAX_ORGANIC_FOR_PROMPT = 12
MAX_LOCAL_FOR_PROMPT = 5
MAX_SNIPPET_CHARS = 160
MAX_TREND_POINTS = 12


class MarketResearchAgentError(RuntimeError):
    """Raised when both the primary attempt and the corrective retry fail."""


class DegradedAgentOutput(BaseModel):
    """PRD §2.3 degraded-mode placeholder so the pipeline never fully collapses."""

    status: Literal["unavailable"] = "unavailable"
    agent: Literal["market_research"] = "market_research"
    error: str
    attempts: int


def _bundle_to_prompt_json(bundle: SerpIntelligenceBundle) -> str:
    """Truncate/serialize the SERP bundle into the exact JSON the LLM may cite from."""
    top_organic = bundle.organic_results[:MAX_ORGANIC_FOR_PROMPT]
    trimmed = {
        "data_confidence": bundle.data_confidence,
        "organic_results": [
            {
                "purpose": r.purpose,
                "title": r.title,
                "url": r.url,
                "domain": r.domain,
                "snippet": r.snippet[:MAX_SNIPPET_CHARS],
            }
            for r in top_organic
        ],
        "local_results": [
            {"title": r.title, "rating": r.rating, "reviews": r.reviews}
            for r in bundle.local_results[:MAX_LOCAL_FOR_PROMPT]
        ],
        "trends": (
            {
                "keyword": bundle.trends.keyword,
                "geo": bundle.trends.geo,
                "direction": bundle.trends.direction,
                "change_pct": bundle.trends.change_pct,
                "sample_points": [p.model_dump() for p in bundle.trends.points[-MAX_TREND_POINTS:]],
            }
            if bundle.trends
            else None
        ),
        # Only the URLs actually shown above are citable — keeps the allow-list
        # aligned with what the model can see while staying under the token budget.
        "raw_sources": [r.url for r in top_organic],
    }
    return json.dumps(trimmed, ensure_ascii=False)


def _build_user_prompt(req: MarketResearchInput, bundle: SerpIntelligenceBundle) -> str:
    onboarding = req.model_dump(mode="json")
    return (
        "ONBOARDING_INPUT (founder-provided wizard fields):\n"
        f"{json.dumps(onboarding, ensure_ascii=False)}\n\n"
        "SERP_DATA (verified live search intelligence — the ONLY source of truth for "
        "competitors, URLs, and trend direction):\n"
        f"{_bundle_to_prompt_json(bundle)}\n\n"
        "Using only the above, return the MarketResearchOutput JSON object now."
    )


async def run_market_research_agent(
    req: MarketResearchInput,
) -> MarketResearchOutput | DegradedAgentOutput:
    try:
        bundle = await SerpApiClient().amarket_scan(req)
    except SerpToolError as exc:
        logger.error("market_research: SerpApi scan failed", exc_info=exc)
        return DegradedAgentOutput(error=f"SerpApi scan failed: {exc}", attempts=0)

    # Strict json_schema mode spells out every field (including nulls) for every
    # array item, so it needs more headroom than the 1400-token default before
    # it starts truncating the competitor/pain-point arrays short.
    llm = get_llm(temperature=0.2, max_tokens=2000)
    # Force schema compliance via Groq's function-calling interface instead of
    # trusting free-form JSON: at low reasoning effort the model reliably drifts
    # on exact field names ("status" for "type", "TAM" for "tam", strings for
    # lists) no matter how the prompt is worded. Binding MarketResearchOutput as
    # a tool schema makes the field names/types part of the call contract itself.
    # method="json_schema" + strict=True uses Groq's native structured-outputs mode
    # (constrained decoding against the schema), not just a tool-call suggestion the
    # model can still drift away from — function_calling alone was not enough.
    structured_llm = llm.with_structured_output(MarketResearchOutput, method="json_schema", strict=True)

    messages: list[SystemMessage | HumanMessage] = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=_build_user_prompt(req, bundle)),
    ]

    last_error: Exception | None = None
    attempts_made = 0
    for attempt in range(1, 3):  # PRD §2.3: one automatic corrective retry
        attempts_made = attempt
        try:
            output = await structured_llm.ainvoke(messages)
            if not isinstance(output, MarketResearchOutput):
                raise ValueError(f"structured output returned unexpected type: {type(output)}")
            verify_citations(output, bundle.raw_sources)
            return output
        except (ValidationError, ValueError, UnverifiedCitationError) as exc:
            last_error = exc
            logger.warning("market_research: attempt %s failed schema/citation check: %s", attempt, exc)
            if attempt == 1:
                messages.append(
                    HumanMessage(
                        content=CORRECTIVE_RETRY_TEMPLATE.format(
                            validation_error=str(exc), previous_output="(see tool call above)"
                        )
                    )
                )
        except Exception as exc:  # noqa: BLE001 - Groq/network errors must degrade, not 500.
            last_error = exc
            logger.warning("market_research: attempt %s failed calling the LLM: %s", attempt, exc)
            if "rate_limit" in str(exc).lower():
                # Retrying immediately just re-hits the same per-minute cap — burn
                # zero extra quota and degrade straight away instead of looping.
                break

    logger.error("market_research: all attempts failed", exc_info=last_error)
    return DegradedAgentOutput(error=str(last_error), attempts=attempts_made)
