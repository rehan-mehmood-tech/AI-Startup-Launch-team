"""Product Strategist Agent (PRD §3.3): Market Research output -> Groq -> strict schema.

Flow: take Agent 1's validated output plus the founder's core-feature/delivery/
visual-vibe inputs -> prompt the LLM -> validate against ProductStrategyOutput
via Groq's strict json_schema structured-output mode -> on failure do ONE
corrective retry -> on a second failure, degrade instead of crashing the
pipeline (PRD §2.3), same contract as the Market Research Agent.
"""
from __future__ import annotations

import json
import logging
from typing import Literal

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field, ValidationError

from app.agents.base_agent import get_llm
from app.agents.hitl_context import hitl_context_block
from app.agents.prompts.product_strategist_prompt import CORRECTIVE_RETRY_TEMPLATE, SYSTEM_PROMPT
from app.config import get_settings
from app.models.agent_output_schemas import ProductStrategyOutput
from app.models.schemas import ProductStrategistInput

logger = logging.getLogger(__name__)


class DegradedAgentOutput(BaseModel):
    """PRD §2.3 degraded-mode placeholder so the pipeline never fully collapses."""

    status: Literal["unavailable"] = "unavailable"
    agent: Literal["product_strategist"] = "product_strategist"
    error: str
    attempts: int


class _ProductStrategyLlm(ProductStrategyOutput):
    """What the LLM returns: the output plus a short reply to the founder."""

    reply_to_founder: str = Field(max_length=700)


def _build_user_prompt(req: ProductStrategistInput) -> str:
    market_research = req.market_research.model_dump(mode="json")
    user_input = {
        "core_feature": req.core_feature,
        "delivery_mechanism": req.delivery_mechanism,
        "visual_vibe_style": req.visual_vibe_style,
        "visual_vibe_mode": req.visual_vibe_mode,
        "visual_vibe_color_palette": req.visual_vibe_color_palette.model_dump(mode="json"),
    }
    return (
        "MARKET_RESEARCH_DATA (Agent 1's validated output — pain points and competitors "
        "to anchor on):\n"
        f"{json.dumps(market_research, ensure_ascii=False)}\n\n"
        "USER_INPUT (founder-provided core feature, delivery mechanism, visual vibe):\n"
        f"{json.dumps(user_input, ensure_ascii=False)}\n\n"
        f"{hitl_context_block(req)}\n\n"
        "Using only the above, return the ProductStrategyOutput JSON object now."
    )


async def run_product_strategist_agent(
    req: ProductStrategistInput,
) -> ProductStrategyOutput | DegradedAgentOutput:
    settings = get_settings()
    # Dedicated key: distributes this agent's Groq TPM usage away from the
    # Market Research Agent's shared bucket instead of fighting over one 8000
    # TPM account. Falls back to GROQ_API_KEY when unset.
    llm = get_llm(
        temperature=0.3,
        max_tokens=1600,
        api_key=settings.groq_product_strategist_api_key or None,
    )
    structured_llm = llm.with_structured_output(_ProductStrategyLlm, method="json_schema", strict=True)

    messages: list[SystemMessage | HumanMessage] = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=_build_user_prompt(req)),
    ]

    last_error: Exception | None = None
    attempts_made = 0
    for attempt in range(1, 3):  # PRD §2.3: one automatic corrective retry
        attempts_made = attempt
        try:
            output = await structured_llm.ainvoke(messages)
            if not isinstance(output, _ProductStrategyLlm):
                raise ValueError(f"structured output returned unexpected type: {type(output)}")
            result = ProductStrategyOutput.model_validate(output.model_dump(exclude={"reply_to_founder"}))
            result._founder_reply = output.reply_to_founder.strip() or None
            return result
        except (ValidationError, ValueError) as exc:
            last_error = exc
            logger.warning("product_strategist: attempt %s failed schema check: %s", attempt, exc)
            if attempt == 1:
                messages.append(
                    HumanMessage(content=CORRECTIVE_RETRY_TEMPLATE.format(validation_error=str(exc)))
                )
        except Exception as exc:  # noqa: BLE001 - Groq/network errors must degrade, not 500.
            last_error = exc
            logger.warning("product_strategist: attempt %s failed calling the LLM: %s", attempt, exc)
            if "rate_limit" in str(exc).lower():
                # Retrying immediately just re-hits the same per-minute cap — burn
                # zero extra quota and degrade straight away instead of looping.
                break

    logger.error("product_strategist: all attempts failed", exc_info=last_error)
    return DegradedAgentOutput(error=str(last_error), attempts=attempts_made)
