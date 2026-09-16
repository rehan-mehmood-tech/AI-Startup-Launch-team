"""Chief AI Orchestrator routes (PRD §3.6) — full pipeline synthesis plus the
counter-questioning/re-routing endpoint."""
from fastapi import APIRouter

from app.agents.orchestrator_agent import run_orchestrator_pipeline, run_orchestrator_rerun
from app.models.agent_output_schemas import OrchestratorOutput
from app.models.schemas import OrchestratorInput, OrchestratorRerunInput

router = APIRouter(prefix="/agents", tags=["orchestrator"])


@router.post("/orchestrator", response_model=OrchestratorOutput)
async def orchestrator(payload: OrchestratorInput) -> OrchestratorOutput:
    """Full end-to-end run: Market Research -> Product Strategist -> Pricing ->
    Marketing, then the executive dashboard synthesis. This single strict
    input schema IS the pre-flight gateway — an incomplete wizard submission
    is rejected with a 422 before any sub-agent is ever called."""
    return await run_orchestrator_pipeline(payload)


@router.post("/orchestrator/rerun-stage", response_model=OrchestratorOutput)
async def orchestrator_rerun(payload: OrchestratorRerunInput) -> OrchestratorOutput:
    """Counter-questioning / re-routing: re-run the pipeline from one disputed
    stage forward, reusing whatever upstream sub-agent outputs are passed in
    instead of paying for the whole pipeline again."""
    return await run_orchestrator_rerun(payload)
