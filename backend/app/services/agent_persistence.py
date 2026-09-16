"""Persistence for `onboarding_inputs`, `agent_runs`, and `resource_links`
(see database_schema.sql). All writes go through the service_role client
(get_supabase()), which bypasses RLS by design — those tables' RLS policies
only grant `select` to the owning client, so the backend is meant to be the
sole writer.

Note on naming: the PRD/task refer to "verified_resources" — that's the
OrchestratorOutput JSON field name. The actual Postgres table it's persisted
into is `resource_links` (defined in database_schema.sql); this module's
`record_verified_resources` writes there.
"""
from __future__ import annotations

import logging
from typing import Any, Literal

from pydantic import BaseModel

from app.models.schemas import OrchestratorInput
from app.services.supabase_client import get_supabase, run_sync

logger = logging.getLogger(__name__)

AgentName = Literal["orchestrator", "market_research", "product_strategist", "pricing", "marketing"]
AgentRunStatus = Literal["queued", "running", "succeeded", "failed", "degraded"]


async def save_onboarding_inputs(workspace_id: str, req: OrchestratorInput) -> None:
    """Upsert the full wizard submission — one row per workspace (schema has
    a UNIQUE(workspace_id) constraint), so a re-route/rerun overwrites it if
    the founder changed an input rather than creating a duplicate."""
    client = get_supabase()
    row = {
        "workspace_id": workspace_id,
        "core_idea": req.market_research.core_idea,
        "target_industry": req.market_research.target_industry,
        "target_location": req.market_research.target_location,
        "country_code": req.market_research.country_code,
        "audience_demographics": req.market_research.audience_demographics.model_dump(mode="json"),
        "known_competitors": req.market_research.known_competitors,
        "core_feature": req.core_feature,
        "delivery_mechanism": req.delivery_mechanism,
        "visual_vibe": {
            "style": req.visual_vibe_style,
            "mode": req.visual_vibe_mode,
            "color_palette": req.visual_vibe_color_palette.model_dump(mode="json"),
        },
        "tech_stack_expectations": req.tech_stack_expectations,
        "target_customer_segment": req.target_customer_segment,
        "customer_acquisition_cost": req.customer_acquisition_cost,
        "minimum_profit_expectation": req.minimum_profit_expectation,
        "tone_of_voice": req.tone_of_voice,
        "marketing_budget_min_usd": req.marketing_budget.min_monthly_usd,
        "marketing_budget_max_usd": req.marketing_budget.max_monthly_usd,
        "launch_timeline": req.launch_timeline,
    }
    try:
        await run_sync(
            lambda: client.table("onboarding_inputs").upsert(row, on_conflict="workspace_id").execute()
        )
    except Exception:
        # Persistence is best-effort support infrastructure, not part of the
        # validation logic itself — never let a DB hiccup break the pipeline.
        logger.exception("agent_persistence: failed to save onboarding_inputs for workspace %s", workspace_id)


def status_for_result(result: Any) -> AgentRunStatus:
    """A sub-agent function always returns its strict output model OR a
    DegradedAgentOutput (status == 'unavailable') — it never raises. Map that
    to the agent_runs status enum."""
    if isinstance(result, BaseModel) and getattr(result, "status", None) == "unavailable":
        return "degraded"
    return "succeeded"


async def record_agent_run(
    workspace_id: str,
    agent_name: AgentName,
    input_payload: dict | None,
    output_payload: dict | None,
    status: AgentRunStatus,
    error_message: str | None = None,
) -> None:
    client = get_supabase()
    row = {
        "workspace_id": workspace_id,
        "agent_name": agent_name,
        "status": status,
        "input_payload": input_payload,
        "output_payload": output_payload,
        "error_message": error_message,
    }
    try:
        await run_sync(lambda: client.table("agent_runs").insert(row).execute())
    except Exception:
        logger.exception(
            "agent_persistence: failed to record agent_run agent=%s workspace=%s", agent_name, workspace_id
        )


async def record_verified_resources(workspace_id: str, resources: list[dict]) -> None:
    """Writes into `resource_links` — see module docstring for the naming note."""
    if not resources:
        return
    client = get_supabase()
    rows = [
        {
            "workspace_id": workspace_id,
            "url": r["url"],
            "source_agent": r["source_agent"],
            "description": r["description"],
        }
        for r in resources
    ]
    try:
        await run_sync(lambda: client.table("resource_links").insert(rows).execute())
    except Exception:
        logger.exception("agent_persistence: failed to record resource_links for workspace %s", workspace_id)
