"""Chief AI Orchestrator Agent (PRD §3.6): pre-flight guard -> sequential
sub-agent chaining -> deterministic risk/status computation -> LLM narrative
synthesis -> unified executive dashboard.

Split of responsibility (same principle as Agents 3-4): validation_status,
low_information_warning, failure_case_study, compiled_dashboard, and
verified_resources are ALL computed deterministically in Python from the
sub-agents' real, already-validated output — never asserted by the LLM. The
LLM only writes the executive_summary narrative and explains the reasoning
signals in plain language, grounded in that computed data.

Pipeline is a hard dependency chain (Market Research -> Product Strategist ->
Pricing -> Marketing): each stage needs the previous stage's *typed* output,
so if a stage degrades, every downstream stage is skipped rather than fed
malformed input — the orchestrator still returns a full OrchestratorOutput
(never a bare DegradedAgentOutput) with validation_status forced to "Red" and
compiled_dashboard showing exactly which stage broke.
"""
from __future__ import annotations

import json
import logging
from typing import Literal

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.agents.base_agent import get_llm
from app.agents.market_research_agent import run_market_research_agent
from app.agents.marketing_agent import run_marketing_agent
from app.agents.pricing_agent import run_pricing_agent
from app.agents.product_strategist_agent import run_product_strategist_agent
from app.agents.prompts.orchestrator_prompt import CORRECTIVE_RETRY_TEMPLATE, SYSTEM_PROMPT
from app.config import get_settings
from app.models.agent_output_schemas import (
    CompiledDashboard,
    FailureCaseStudyEntry,
    LowInformationWarning,
    MarketingOutput,
    MarketResearchOutput,
    OrchestratorOutput,
    PricingOutput,
    ProductStrategyOutput,
    ValidationReasoningSignal,
    ValidationStatus,
    VerifiedResource,
)
from app.models.schemas import (
    MarketingAgentInput,
    OrchestratorInput,
    OrchestratorRerunInput,
    OrchestratorSynthesizeInput,
    PricingAgentInput,
    ProductStrategistInput,
)
from app.services import agent_persistence, run_state
from app.tools.failure_case_matcher import match_failure_cases
from app.tools.preflight_guard import PreflightResult, run_preflight_guard

logger = logging.getLogger(__name__)

Stage = Literal["market_research", "product_strategist", "pricing", "marketing"]

_LTV_CAC_TAGS = {"unit_economics_failure", "negative_ltv_cac"}


class _ValidationSignalQualitative(BaseModel):
    model_config = ConfigDict(extra="forbid")

    signal: str = Field(min_length=1)
    source_agent: Literal["market_research", "product_strategist", "pricing", "marketing"]
    weight: Literal["high", "medium", "low"]


class _OrchestratorQualitative(BaseModel):
    model_config = ConfigDict(extra="forbid")

    executive_summary: str = Field(min_length=1)
    validation_reasoning: list[_ValidationSignalQualitative] = Field(min_length=1, max_length=6)
    strategic_recommendations: list[str] = Field(min_length=2, max_length=5)


class _StageResults(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    market_research: object = None
    product_strategist: object = None
    pricing: object = None
    marketing: object = None


async def _persist_stage(
    workspace_id: str, agent_name: agent_persistence.AgentName, input_model: BaseModel, result: object
) -> None:
    """Best-effort agent_runs row for one stage. Never raises — a DB hiccup
    here must not take down the validation pipeline itself."""
    output_payload = result.model_dump(mode="json") if isinstance(result, BaseModel) else None
    error_message = getattr(result, "error", None) if isinstance(result, BaseModel) else None
    await agent_persistence.record_agent_run(
        workspace_id=workspace_id,
        agent_name=agent_name,
        input_payload=input_model.model_dump(mode="json"),
        output_payload=output_payload,
        status=agent_persistence.status_for_result(result),
        error_message=error_message,
    )


async def _run_stages(
    req: OrchestratorInput,
    start_stage: Stage,
    workspace_id: str,
    market_research_output: MarketResearchOutput | None = None,
    product_strategy_output: ProductStrategyOutput | None = None,
    pricing_output: PricingOutput | None = None,
) -> _StageResults:
    """Run the pipeline forward from `start_stage`, reusing any already-known
    upstream outputs passed in (used by the re-route/counter-question path).
    Every stage actually executed here is logged to `agent_runs`."""
    results = _StageResults(
        market_research=market_research_output,
        product_strategist=product_strategy_output,
        pricing=pricing_output,
    )

    if start_stage == "market_research":
        mr_result = await run_market_research_agent(req.market_research)
        await _persist_stage(workspace_id, "market_research", req.market_research, mr_result)
        results.market_research = mr_result
        market_research_output = mr_result if isinstance(mr_result, MarketResearchOutput) else None

    if market_research_output is not None and start_stage in ("market_research", "product_strategist"):
        ps_input = ProductStrategistInput(
            market_research=market_research_output,
            core_feature=req.core_feature,
            delivery_mechanism=req.delivery_mechanism,
            visual_vibe_style=req.visual_vibe_style,
            visual_vibe_mode=req.visual_vibe_mode,
            visual_vibe_color_palette=req.visual_vibe_color_palette,
        )
        ps_result = await run_product_strategist_agent(ps_input)
        await _persist_stage(workspace_id, "product_strategist", ps_input, ps_result)
        results.product_strategist = ps_result
        product_strategy_output = ps_result if isinstance(ps_result, ProductStrategyOutput) else None

    if product_strategy_output is not None and start_stage in ("market_research", "product_strategist", "pricing"):
        pricing_input = PricingAgentInput(
            mvp_features=product_strategy_output.mvp_features,
            tech_stack_expectations=req.tech_stack_expectations,
            target_customer_segment=req.target_customer_segment,
            customer_acquisition_cost=req.customer_acquisition_cost,
            minimum_profit_expectation=req.minimum_profit_expectation,
        )
        pricing_result = await run_pricing_agent(pricing_input)
        await _persist_stage(workspace_id, "pricing", pricing_input, pricing_result)
        results.pricing = pricing_result
        pricing_output = pricing_result if isinstance(pricing_result, PricingOutput) else None

    if product_strategy_output is not None and pricing_output is not None:
        marketing_input = MarketingAgentInput(
            mvp_strategy=product_strategy_output,
            pricing=pricing_output,
            tone_of_voice=req.tone_of_voice,
            marketing_budget=req.marketing_budget,
            launch_timeline=req.launch_timeline,
        )
        marketing_result = await run_marketing_agent(marketing_input)
        await _persist_stage(workspace_id, "marketing", marketing_input, marketing_result)
        results.marketing = marketing_result

    return results


def _dump_stage(result: object, stage_name: str) -> dict:
    if result is None:
        return {"status": "skipped", "reason": f"a required upstream stage before {stage_name} was unavailable"}
    if isinstance(result, BaseModel):
        return result.model_dump(mode="json")
    return {"status": "unknown"}


def _compute_risk_tags(
    preflight: PreflightResult,
    mr_output: MarketResearchOutput | None,
    pricing_output: PricingOutput | None,
    pipeline_incomplete: bool,
) -> set[str]:
    tags: set[str] = set()
    if preflight.triggered:
        tags.add("vague_market_validation")
    if mr_output is not None:
        if mr_output.data_confidence == "low":
            tags.add("vague_market_validation")
        if len(mr_output.competitor_analysis) >= 6:
            tags.add("no_differentiation")
    if pricing_output is not None and not pricing_output.estimated_unit_economics.ltv_cac_rule_passed:
        tags |= _LTV_CAC_TAGS
    if pipeline_incomplete:
        tags.add("unit_economics_failure")  # a broken pipeline is itself a structural red flag
    return tags


def _compute_validation_status(
    pipeline_incomplete: bool,
    preflight: PreflightResult,
    mr_output: MarketResearchOutput | None,
    pricing_output: PricingOutput | None,
) -> ValidationStatus:
    if pipeline_incomplete:
        return "Red"
    if pricing_output is not None and not pricing_output.estimated_unit_economics.ltv_cac_rule_passed:
        return "Red"
    confidence = mr_output.data_confidence if mr_output is not None else "low"
    if confidence == "low":
        return "Red" if preflight.triggered else "Amber"
    if preflight.triggered or confidence == "medium":
        return "Amber"
    return "Green"


def _build_verified_resources(mr_output: MarketResearchOutput | None) -> list[VerifiedResource]:
    if mr_output is None:
        return []
    competitor_by_url = {c.source_url: c.name for c in mr_output.competitor_analysis}
    pain_by_url = {p.evidence_source_url: p.pain_point for p in mr_output.customer_pain_points}
    resources: list[VerifiedResource] = []
    for url in mr_output.raw_sources:
        if url in competitor_by_url:
            description = f"Competitor evidence for {competitor_by_url[url]}"
        elif url in pain_by_url:
            description = f"Evidence for customer pain point: {pain_by_url[url][:80]}"
        else:
            description = "Market research source referenced during analysis"
        resources.append(VerifiedResource(url=url, source_agent="market_research", description=description))
    return resources


def _build_failure_case_study(status: ValidationStatus, risk_tags: set[str]) -> list[FailureCaseStudyEntry]:
    if status == "Green" or not risk_tags:
        return []
    matches = match_failure_cases(risk_tags)
    return [
        FailureCaseStudyEntry(
            company=case.company,
            collapse_reason=case.collapse_reason,
            matched_risk_pattern=", ".join(sorted(set(case.risk_tags) & risk_tags)),
            similarity_score=score,
        )
        for case, score in matches
    ]


def _fallback_qualitative(
    status: ValidationStatus, preflight: PreflightResult, pipeline_incomplete: bool
) -> _OrchestratorQualitative:
    """Used only if the LLM narrative call fails both attempts — the
    orchestrator still returns a complete, useful response built from the
    same deterministic data, just without the LLM's prose polish."""
    if pipeline_incomplete:
        summary = (
            "This validation run could not complete: one of the sub-agents in the pipeline was unavailable, "
            "so downstream stages were skipped. Re-run once the underlying issue (rate limits or an API "
            "outage) clears — a partial pipeline cannot produce a trustworthy go/no-go verdict."
        )
    elif status == "Red":
        summary = (
            "This idea has a structural red flag: the unit economics and/or market signal do not currently "
            "support a viable launch. See validation_reasoning and failure_case_study below for specifics "
            "before committing further resources."
        )
    elif status == "Amber":
        summary = (
            "This idea is directionally plausible but under-supported by the data collected — treat the "
            "compiled dashboard as a first pass, not a green light, until the flagged gaps are addressed."
        )
    else:
        summary = (
            "This idea clears the unit-economics and market-confidence bar on the data collected. That is "
            "not a guarantee of success — validate the riskiest assumption with real customers next."
        )
    if pipeline_incomplete:
        recommendations = [
            "Re-run the unavailable stage before acting on any part of this report.",
            "Treat every downstream figure as provisional until the full pipeline completes.",
        ]
    elif status == "Red":
        recommendations = [
            "Fix the flagged unit economics or market-signal gaps before spending on acquisition.",
            "Re-check pricing and customer acquisition cost assumptions against real customer conversations.",
        ]
    else:
        recommendations = [
            "Interview target customers to confirm the top pain point before building beyond the MVP.",
            "Launch on the highest-priority marketing channel first and measure real CAC against the estimate.",
        ]
    reasoning = [
        _ValidationSignalQualitative(
            signal=f"Deterministic status computation returned '{status}' from sub-agent signals"
            + (" (low-information input detected)" if preflight.triggered else ""),
            source_agent="market_research",
            weight="high",
        )
    ]
    return _OrchestratorQualitative(
        executive_summary=summary, validation_reasoning=reasoning, strategic_recommendations=recommendations
    )


def _build_calculated_data(
    status: ValidationStatus,
    preflight: PreflightResult,
    pipeline_incomplete: bool,
    mr_output: MarketResearchOutput | None,
    pricing_output: PricingOutput | None,
    marketing_output: MarketingOutput | None,
    failure_cases: list[FailureCaseStudyEntry],
    ps_output: ProductStrategyOutput | None = None,
) -> dict:
    # Compact digests of the approved outputs: recommendations may only cite
    # what is in here, which keeps them grounded without spending the
    # orchestrator key's TPM budget on the full outputs.
    return {
        "market_digest": (
            {
                "top_pain_points": [p.pain_point for p in mr_output.customer_pain_points[:3]],
                "competitors": [c.name for c in mr_output.competitor_analysis[:5]],
            }
            if mr_output
            else None
        ),
        "product_digest": (
            {
                "value_proposition": ps_output.value_proposition,
                "must_have_features": [f.feature for f in ps_output.mvp_features.must_have],
            }
            if ps_output
            else None
        ),
        "pricing_digest": (
            {
                "starter_price": pricing_output.pricing_tiers.starter.price,
                "pro_price": pricing_output.pricing_tiers.pro.price,
                "months_to_min_profit_target": pricing_output.roi_projection.months_to_min_profit_target,
            }
            if pricing_output
            else None
        ),
        "marketing_digest": (
            {"channels": [c.channel for c in marketing_output.recommended_channels]} if marketing_output else None
        ),
        "validation_status": status,
        "pipeline_incomplete": pipeline_incomplete,
        "low_information_warning": preflight.model_dump(),
        "market_research_data_confidence": mr_output.data_confidence if mr_output else None,
        "competitor_count": len(mr_output.competitor_analysis) if mr_output else None,
        "pricing_ltv_cac_ratio": pricing_output.estimated_unit_economics.target_ltv_cac_ratio if pricing_output else None,
        "pricing_ltv_cac_rule_passed": (
            pricing_output.estimated_unit_economics.ltv_cac_rule_passed if pricing_output else None
        ),
        "marketing_total_channel_cost": (
            sum(c.estimated_monthly_cost for c in marketing_output.recommended_channels) if marketing_output else None
        ),
        "failure_case_study": [f.model_dump() for f in failure_cases],
    }


async def _synthesize_narrative(
    req: OrchestratorInput, calculated_data: dict, status: ValidationStatus, preflight: PreflightResult, pipeline_incomplete: bool
) -> _OrchestratorQualitative:
    settings = get_settings()
    try:
        llm = get_llm(
            temperature=0.1,
            max_tokens=1400,
            api_key=settings.groq_orchestrator_agent_api_key or None,
        )
        structured_llm = llm.with_structured_output(_OrchestratorQualitative, method="json_schema", strict=True)
        messages: list[SystemMessage | HumanMessage] = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    "CALCULATED_DATA (final and authoritative):\n"
                    f"{json.dumps(calculated_data, ensure_ascii=False)}\n\n"
                    f"FOUNDER'S CORE IDEA: {req.market_research.core_idea}\n\n"
                    "Return the executive_summary/validation_reasoning/strategic_recommendations JSON now. "
                    "Recommendations must reference only facts present in CALCULATED_DATA."
                )
            ),
        ]
        for attempt in range(1, 3):
            try:
                qualitative = await structured_llm.ainvoke(messages)
                if isinstance(qualitative, _OrchestratorQualitative):
                    return qualitative
                raise ValueError(f"unexpected structured output type: {type(qualitative)}")
            except (ValidationError, ValueError) as exc:
                if attempt == 1:
                    messages.append(
                        HumanMessage(content=CORRECTIVE_RETRY_TEMPLATE.format(validation_error=str(exc)))
                    )
                    continue
                raise
    except Exception as exc:  # noqa: BLE001 - narrative LLM failure must never crash the orchestrator.
        logger.warning("orchestrator: narrative synthesis failed, using deterministic fallback: %s", exc)

    return _fallback_qualitative(status, preflight, pipeline_incomplete)


async def _compose_output(req: OrchestratorInput, results: _StageResults) -> OrchestratorOutput:
    """Pure synthesis: deterministic status/risk computation + LLM narrative.
    No persistence, so the HITL synthesize path can reuse it."""
    mr_output = results.market_research if isinstance(results.market_research, MarketResearchOutput) else None
    ps_output = results.product_strategist if isinstance(results.product_strategist, ProductStrategyOutput) else None
    pricing_output = results.pricing if isinstance(results.pricing, PricingOutput) else None
    marketing_output = results.marketing if isinstance(results.marketing, MarketingOutput) else None

    pipeline_incomplete = any(x is None for x in (mr_output, ps_output, pricing_output, marketing_output))

    preflight = run_preflight_guard(req)
    status = _compute_validation_status(pipeline_incomplete, preflight, mr_output, pricing_output)
    risk_tags = _compute_risk_tags(preflight, mr_output, pricing_output, pipeline_incomplete)
    failure_cases = _build_failure_case_study(status, risk_tags)
    verified_resources = _build_verified_resources(mr_output)
    calculated_data = _build_calculated_data(
        status, preflight, pipeline_incomplete, mr_output, pricing_output, marketing_output, failure_cases, ps_output
    )

    qualitative = await _synthesize_narrative(req, calculated_data, status, preflight, pipeline_incomplete)

    output = OrchestratorOutput(
        executive_summary=qualitative.executive_summary,
        validation_status=status,
        validation_reasoning=[
            ValidationReasoningSignal(signal=s.signal, source_agent=s.source_agent, weight=s.weight)
            for s in qualitative.validation_reasoning
        ],
        low_information_warning=LowInformationWarning(
            triggered=preflight.triggered,
            affected_fields=preflight.affected_fields,
            confidence_penalty=preflight.confidence_penalty,
        ),
        failure_case_study=failure_cases,
        compiled_dashboard=CompiledDashboard(
            market_research=_dump_stage(results.market_research, "product_strategist"),
            product_strategy=_dump_stage(results.product_strategist, "pricing"),
            pricing=_dump_stage(results.pricing, "marketing"),
            marketing=_dump_stage(results.marketing, "final synthesis"),
        ),
        verified_resources=verified_resources,
        strategic_recommendations=qualitative.strategic_recommendations,
    )
    return output


async def _finalize(req: OrchestratorInput, results: _StageResults, run_id: str) -> OrchestratorOutput:
    output = await _compose_output(req, results)
    pipeline_incomplete = not all(
        isinstance(x, (MarketResearchOutput, ProductStrategyOutput, PricingOutput, MarketingOutput))
        for x in (results.market_research, results.product_strategist, results.pricing, results.marketing)
    )
    status = output.validation_status

    # Persist the orchestrator's own synthesis as its own agent_runs row, the
    # verified_resources into resource_links, then close out the workspace's
    # state machine with the final Green/Amber/Red verdict attached.
    await agent_persistence.record_agent_run(
        workspace_id=run_id,
        agent_name="orchestrator",
        input_payload=None,
        output_payload=output.model_dump(mode="json"),
        status="degraded" if pipeline_incomplete else "succeeded",
    )
    await agent_persistence.record_verified_resources(
        run_id, [r.model_dump(mode="json") for r in output.verified_resources]
    )
    await run_state.transition(run_id, "compiled", validation_status=status)
    await run_state.transition(run_id, "delivered", validation_status=status)
    return output


async def run_orchestrator_pipeline(req: OrchestratorInput) -> OrchestratorOutput:
    """PRD §3.6 main entry point: full sequential pipeline from a freshly
    collected wizard submission. State: pending_validation -> running ->
    compiled -> delivered, persisted in Supabase's `workspaces` table (see
    app/services/run_state.py)."""
    # Step 1: Create a new workspace run in Supabase database
    run = await run_state.create_run(owner_id=req.owner_id, title=req.market_research.core_idea[:120])
    
    # Step 2: Persist founder onboarding inputs for auditing and history
    await agent_persistence.save_onboarding_inputs(run.run_id, req)
    
    # Step 3: Transition workspace state machine to 'running'
    await run_state.transition(run.run_id, "running")
    
    # Step 4: Run the 4 autonomous sub-agent stages (Market -> Strategy -> Pricing -> Marketing)
    results = await _run_stages(req, start_stage="market_research", workspace_id=run.run_id)
    
    # Step 5: Synthesize executive summary, compute risk tags, and finalize report delivery
    return await _finalize(req, results, run.run_id)


async def run_orchestrator_rerun(req: OrchestratorRerunInput) -> OrchestratorOutput:
    """Counter-questioning / re-routing (PRD §3.6): re-run from the disputed
    stage forward within the SAME workspace, reusing whatever upstream
    outputs are still valid — new agent_runs rows are appended, not
    overwritten, so the full retry history is preserved."""
    await agent_persistence.save_onboarding_inputs(req.workspace_id, req.original_input)
    await run_state.transition(req.workspace_id, "running")
    results = await _run_stages(
        req.original_input,
        start_stage=req.rerun_from,
        workspace_id=req.workspace_id,
        market_research_output=req.market_research_output,
        product_strategy_output=req.product_strategy_output,
        pricing_output=req.pricing_output,
    )
    return await _finalize(req.original_input, results, req.workspace_id)


async def synthesize_from_approved(req: OrchestratorSynthesizeInput) -> OrchestratorOutput:
    """HITL path: the founder already approved each sub-agent's output one by
    one, so no agent is re-run -- the orchestrator only aggregates the four
    approved outputs into the verdict, summary and recommendations."""
    results = _StageResults(
        market_research=req.market_research_output,
        product_strategist=req.product_strategy_output,
        pricing=req.pricing_output,
        marketing=req.marketing_output,
    )
    return await _compose_output(req.intake, results)
