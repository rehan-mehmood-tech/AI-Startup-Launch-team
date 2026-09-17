"""Pricing Agent (PRD §3.4): deterministic unit-economics engine -> Groq
feature-bucketing overlay -> strict schema.

PRD §3.4 is explicit that this agent must not let the LLM invent numbers, so
the split is:
  1. app/tools/pricing_calculator.py computes every numeric field (COGS, LTV,
     CAC ratio, tier prices, ROI + Monte-Carlo-style sensitivity) — pure,
     deterministic, reproducible.
  2. The LLM (via Groq's strict json_schema structured-output mode) only
     buckets the given MVP features into starter/pro/enterprise and picks
     billing-cycle copy — a much smaller, much more reliable task than asking
     it to also get the math right.
  3. The two are assembled in Python into the full PricingOutput and validated
     against the hard-coded 3:1 LTV/CAC rule before returning.
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
from app.agents.prompts.pricing_prompt import CORRECTIVE_RETRY_TEMPLATE, SYSTEM_PROMPT
from app.config import get_settings
from app.models.agent_output_schemas import (
    ConfidenceRange,
    EnterpriseTier,
    EstimatedUnitEconomics,
    PricingOutput,
    PricingTiers,
    ProTier,
    RoiProjection,
    StarterTier,
)
from app.models.schemas import PricingAgentInput
from app.tools.pricing_calculator import PricingCalculationResult, run_pricing_engine

logger = logging.getLogger(__name__)


class DegradedAgentOutput(BaseModel):
    """PRD §2.3 degraded-mode placeholder so the pipeline never fully collapses."""

    status: Literal["unavailable"] = "unavailable"
    agent: Literal["pricing"] = "pricing"
    error: str
    attempts: int


class _TierQualitative(BaseModel):
    model_config = ConfigDict(extra="forbid")

    billing_cycle: str = Field(min_length=1)
    included_features: list[str] = Field(min_length=1)


class _EnterpriseQualitative(BaseModel):
    model_config = ConfigDict(extra="forbid")

    included_features: list[str] = Field(min_length=1)


class _LlmPricingQualitative(BaseModel):
    """The ONLY thing the LLM is asked to produce — no numbers, just feature
    bucketing and billing-cycle copy. Kept separate from PricingOutput so the
    LLM's schema surface (and failure surface) stays as small as possible."""

    model_config = ConfigDict(extra="forbid")

    starter: _TierQualitative
    pro: _TierQualitative
    enterprise: _EnterpriseQualitative
    reply_to_founder: str = Field(max_length=700)


def _build_user_prompt(req: PricingAgentInput, calc: PricingCalculationResult) -> str:
    mvp_features = req.mvp_features.model_dump(mode="json")
    calculated_data = {
        "per_user_cogs": calc.unit_economics.per_user_cogs,
        "estimated_ltv": calc.unit_economics.estimated_ltv,
        "estimated_cac": calc.unit_economics.estimated_cac,
        "target_ltv_cac_ratio": calc.unit_economics.target_ltv_cac_ratio,
        "ltv_cac_rule_passed": calc.unit_economics.ltv_cac_rule_passed,
        "starter_price": calc.tiers.starter_price,
        "pro_price": calc.tiers.pro_price,
        "pro_gross_margin_pct": calc.tiers.pro_gross_margin_pct,
        "enterprise_pricing_model": calc.tiers.enterprise_pricing_model,
        "roi_projection": calc.roi_projection.model_dump(mode="json"),
    }
    return (
        "CALCULATED_DATA (final and authoritative — computed by the Python engine, not you):\n"
        f"{json.dumps(calculated_data, ensure_ascii=False)}\n\n"
        "MVP_FEATURES (bucket these across tiers using the exact names given):\n"
        f"{json.dumps(mvp_features, ensure_ascii=False)}\n\n"
        f"TARGET_CUSTOMER_SEGMENT: {req.target_customer_segment}\n\n"
        f"{hitl_context_block(req)}\n\n"
        "Return the feature-bucketing/billing-cycle JSON object now."
    )


def _assemble_output(
    calc: PricingCalculationResult, qualitative: _LlmPricingQualitative
) -> PricingOutput:
    """Merge the engine's authoritative numbers with the LLM's feature
    bucketing/copy. Numeric fields never pass through the LLM at all."""
    return PricingOutput(
        estimated_unit_economics=EstimatedUnitEconomics(
            per_user_cogs=calc.unit_economics.per_user_cogs,
            estimated_ltv=calc.unit_economics.estimated_ltv,
            estimated_cac=calc.unit_economics.estimated_cac,
            target_ltv_cac_ratio=calc.unit_economics.target_ltv_cac_ratio,
            ltv_cac_rule_passed=calc.unit_economics.ltv_cac_rule_passed,
        ),
        pricing_tiers=PricingTiers(
            starter=StarterTier(
                price=calc.tiers.starter_price,
                billing_cycle=qualitative.starter.billing_cycle,
                included_features=qualitative.starter.included_features,
            ),
            pro=ProTier(
                price=calc.tiers.pro_price,
                billing_cycle=qualitative.pro.billing_cycle,
                included_features=qualitative.pro.included_features,
                target_gross_margin_pct=calc.tiers.pro_gross_margin_pct,
            ),
            enterprise=EnterpriseTier(
                pricing_model=calc.tiers.enterprise_pricing_model,  # type: ignore[arg-type]
                included_features=qualitative.enterprise.included_features,
            ),
        ),
        roi_projection=RoiProjection(
            projected_yield_pct=calc.roi_projection.projected_yield_pct,
            months_to_min_profit_target=calc.roi_projection.months_to_min_profit_target,
            confidence_range=ConfidenceRange(
                low=calc.roi_projection.confidence_range.low,
                high=calc.roi_projection.confidence_range.high,
            ),
        ),
    )


async def run_pricing_agent(req: PricingAgentInput) -> PricingOutput | DegradedAgentOutput:
    must_have_count = len(req.mvp_features.must_have)
    calc = run_pricing_engine(
        tech_stack_expectations=req.tech_stack_expectations,
        target_customer_segment=req.target_customer_segment,
        customer_acquisition_cost=req.customer_acquisition_cost,
        minimum_profit_expectation=req.minimum_profit_expectation,
        must_have_count=must_have_count,
    )

    settings = get_settings()
    # Dedicated key: distributes this agent's Groq TPM usage away from the
    # Market Research / Product Strategist agents' buckets. Falls back to
    # GROQ_API_KEY when unset.
    llm = get_llm(
        temperature=0.1,  # deterministic, low-variance feature bucketing/copy
        max_tokens=1200,
        api_key=settings.groq_pricing_agent_api_key or None,
    )
    structured_llm = llm.with_structured_output(_LlmPricingQualitative, method="json_schema", strict=True)

    messages: list[SystemMessage | HumanMessage] = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=_build_user_prompt(req, calc)),
    ]

    last_error: Exception | None = None
    attempts_made = 0
    for attempt in range(1, 3):  # PRD §2.3: one automatic corrective retry
        attempts_made = attempt
        try:
            qualitative = await structured_llm.ainvoke(messages)
            if not isinstance(qualitative, _LlmPricingQualitative):
                raise ValueError(f"structured output returned unexpected type: {type(qualitative)}")
            result = _assemble_output(calc, qualitative)
            result._founder_reply = qualitative.reply_to_founder.strip() or None
            return result
        except (ValidationError, ValueError) as exc:
            last_error = exc
            logger.warning("pricing: attempt %s failed schema check: %s", attempt, exc)
            if attempt == 1:
                messages.append(
                    HumanMessage(content=CORRECTIVE_RETRY_TEMPLATE.format(validation_error=str(exc)))
                )
        except Exception as exc:  # noqa: BLE001 - Groq/network errors must degrade, not 500.
            last_error = exc
            logger.warning("pricing: attempt %s failed calling the LLM: %s", attempt, exc)
            if "rate_limit" in str(exc).lower():
                # Retrying immediately just re-hits the same per-minute cap — burn
                # zero extra quota and degrade straight away instead of looping.
                break

    logger.error("pricing: all attempts failed", exc_info=last_error)
    return DegradedAgentOutput(error=str(last_error), attempts=attempts_made)
