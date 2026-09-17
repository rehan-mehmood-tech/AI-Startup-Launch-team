"""Marketing Agent (PRD §3.5): MVP Strategy + Pricing -> Groq GTM copy -> strict schema.

Split of responsibilities (same "don't let the LLM own hard rules" principle
as pricing_agent.py):
  1. The LLM (Groq, strict json_schema structured-output mode) picks the top 3
     channels + reasoning + cost estimate, writes 3 taglines, and writes one
     sample post per channel (with a /adcreative-prefixed image prompt).
  2. app/tools/campaign_formatter.py deterministically enforces X/Twitter's
     280-character constraint on whatever the LLM wrote — never trusted to
     the model's own character counting.
  3. automation_payload is built deterministically in Python from the final,
     validated campaign data — never asked of the LLM, so it can never be
     malformed JSON (PRD's own instruction: it must be "clean, standardized
     JSON... ready for webhook shipping").
On failure (bad JSON, schema violation) do ONE corrective retry; on a second
failure, degrade instead of crashing the pipeline (PRD §2.3).
"""
from __future__ import annotations

import json
import logging
from typing import Literal

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.agents.base_agent import get_llm
from app.agents.hitl_context import hitl_context_block
from app.agents.prompts.marketing_prompt import CORRECTIVE_RETRY_TEMPLATE, SYSTEM_PROMPT
from app.config import get_settings
from app.models.agent_output_schemas import (
    AutomationPayload,
    MarketingOutput,
    RecommendedChannel,
    SampleCampaignPost,
)
from app.models.schemas import MarketingAgentInput
from app.tools.campaign_formatter import apply_platform_formatting

logger = logging.getLogger(__name__)

AUTOMATION_PAYLOAD_FORMAT_VERSION = "1.0"


class DegradedAgentOutput(BaseModel):
    """PRD §2.3 degraded-mode placeholder so the pipeline never fully collapses."""

    status: Literal["unavailable"] = "unavailable"
    agent: Literal["marketing"] = "marketing"
    error: str
    attempts: int


class _ChannelQualitative(BaseModel):
    model_config = ConfigDict(extra="forbid")

    channel: str = Field(min_length=1)
    priority_rank: int = Field(ge=1, le=3)
    strategic_reasoning: str = Field(min_length=1)
    estimated_monthly_cost: float = Field(ge=0)


class _PostQualitative(BaseModel):
    model_config = ConfigDict(extra="forbid")

    channel_name: str = Field(min_length=1)
    post_content: str = Field(min_length=1)
    visual_asset_prompt: str = Field(min_length=1)


class _LlmMarketingQualitative(BaseModel):
    """Everything the LLM is asked to produce. automation_payload is
    deliberately excluded — that's assembled deterministically afterward."""

    model_config = ConfigDict(extra="forbid")

    recommended_channels: list[_ChannelQualitative] = Field(min_length=3, max_length=3)
    brand_taglines: list[str] = Field(min_length=3, max_length=3)
    sample_campaign_posts: list[_PostQualitative] = Field(min_length=3, max_length=3)
    reply_to_founder: str = Field(max_length=700)


def _build_user_prompt(req: MarketingAgentInput) -> str:
    mvp_strategy = req.mvp_strategy.model_dump(mode="json")
    pricing = req.pricing.model_dump(mode="json")
    user_input = {
        "tone_of_voice": req.tone_of_voice,
        "marketing_budget_monthly_usd": {
            "min": req.marketing_budget.min_monthly_usd,
            "max": req.marketing_budget.max_monthly_usd,
        },
        "launch_timeline": req.launch_timeline,
    }
    return (
        "MVP_STRATEGY (Agent 2's validated output — value prop and features this campaign sells):\n"
        f"{json.dumps(mvp_strategy, ensure_ascii=False)}\n\n"
        "PRICING (Agent 3's validated output — tiers to reference in campaign copy):\n"
        f"{json.dumps(pricing, ensure_ascii=False)}\n\n"
        "USER_INPUT (tone, budget, launch timeline):\n"
        f"{json.dumps(user_input, ensure_ascii=False)}\n\n"
        f"{hitl_context_block(req)}\n\n"
        "Using only the above, return the recommended_channels/brand_taglines/sample_campaign_posts JSON now."
    )


def _build_automation_payload(
    channels: list[RecommendedChannel], taglines: list[str], posts: list[SampleCampaignPost], req: MarketingAgentInput
) -> AutomationPayload:
    payload = {
        "value_proposition": req.mvp_strategy.value_proposition,
        "tone_of_voice": req.tone_of_voice,
        "launch_timeline": req.launch_timeline,
        "recommended_channels": [c.model_dump(mode="json") for c in channels],
        "brand_taglines": taglines,
        "sample_campaign_posts": [p.model_dump(mode="json") for p in posts],
        "pricing_snapshot": {
            "starter_price": req.pricing.pricing_tiers.starter.price,
            "pro_price": req.pricing.pricing_tiers.pro.price,
            "enterprise_pricing_model": req.pricing.pricing_tiers.enterprise.pricing_model,
        },
    }
    return AutomationPayload(
        format_version=AUTOMATION_PAYLOAD_FORMAT_VERSION,
        payload_json_stringified=json.dumps(payload, ensure_ascii=False),
        webhook_ready=True,
    )


def _assemble_output(qualitative: _LlmMarketingQualitative, req: MarketingAgentInput) -> MarketingOutput:
    channels = [
        RecommendedChannel(
            channel=c.channel,
            priority_rank=c.priority_rank,
            strategic_reasoning=c.strategic_reasoning,
            estimated_monthly_cost=c.estimated_monthly_cost,
        )
        for c in qualitative.recommended_channels
    ]
    posts = [
        SampleCampaignPost(
            channel_name=p.channel_name,
            # Deterministic platform-format enforcement (e.g. X/Twitter's
            # 280-char limit) — never trusted to the LLM's own copy.
            post_content=apply_platform_formatting(p.channel_name, p.post_content),
            visual_asset_prompt=p.visual_asset_prompt,
        )
        for p in qualitative.sample_campaign_posts
    ]
    automation_payload = _build_automation_payload(channels, qualitative.brand_taglines, posts, req)
    return MarketingOutput(
        recommended_channels=channels,
        brand_taglines=qualitative.brand_taglines,
        sample_campaign_posts=posts,
        automation_payload=automation_payload,
    )


def _budget_sum_ok(qualitative: _LlmMarketingQualitative, req: MarketingAgentInput) -> None:
    total = sum(c.estimated_monthly_cost for c in qualitative.recommended_channels)
    # Generous slack (25%) over the stated max — this is a sanity guard
    # against wildly unrealistic estimates, not a strict budget enforcer.
    ceiling = req.marketing_budget.max_monthly_usd * 1.25
    if total > ceiling:
        raise ValueError(
            f"sum of estimated_monthly_cost ({total}) exceeds the founder's budget "
            f"(max {req.marketing_budget.max_monthly_usd}, allowed ceiling {ceiling}) by too much"
        )


async def run_marketing_agent(req: MarketingAgentInput) -> MarketingOutput | DegradedAgentOutput:
    settings = get_settings()
    # Dedicated key: distributes this agent's Groq TPM usage away from the
    # other three agents' buckets. Falls back to GROQ_API_KEY when unset.
    llm = get_llm(
        temperature=0.1,  # low + deterministic per PRD, for strict JSON compliance
        max_tokens=2800,  # 3 channels + 3 taglines + 3 art-directed image briefs + founder reply
        api_key=settings.groq_marketing_agent_api_key or None,
    )
    structured_llm = llm.with_structured_output(_LlmMarketingQualitative, method="json_schema", strict=True)

    messages: list[SystemMessage | HumanMessage] = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=_build_user_prompt(req)),
    ]

    last_error: Exception | None = None
    attempts_made = 0
    for attempt in range(1, 3):  # PRD §2.3: one automatic corrective retry
        attempts_made = attempt
        try:
            qualitative = await structured_llm.ainvoke(messages)
            if not isinstance(qualitative, _LlmMarketingQualitative):
                raise ValueError(f"structured output returned unexpected type: {type(qualitative)}")
            _budget_sum_ok(qualitative, req)
            result = _assemble_output(qualitative, req)
            result._founder_reply = qualitative.reply_to_founder.strip() or None
            return result
        except (ValidationError, ValueError) as exc:
            last_error = exc
            logger.warning("marketing: attempt %s failed schema/business-rule check: %s", attempt, exc)
            if attempt == 1:
                messages.append(
                    HumanMessage(content=CORRECTIVE_RETRY_TEMPLATE.format(validation_error=str(exc)))
                )
        except Exception as exc:  # noqa: BLE001 - Groq/network errors must degrade, not 500.
            last_error = exc
            logger.warning("marketing: attempt %s failed calling the LLM: %s", attempt, exc)
            if "rate_limit" in str(exc).lower():
                # Retrying immediately just re-hits the same per-minute cap — burn
                # zero extra quota and degrade straight away instead of looping.
                break

    logger.error("marketing: all attempts failed", exc_info=last_error)
    return DegradedAgentOutput(error=str(last_error), attempts=attempts_made)
