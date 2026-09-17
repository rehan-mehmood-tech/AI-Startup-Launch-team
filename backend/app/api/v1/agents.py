"""Per-agent test routes — exercise each sub-agent standalone via Swagger."""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.agents.market_research_agent import (
    DegradedAgentOutput as MarketResearchDegraded,
    run_market_research_agent,
)
from app.agents.marketing_agent import DegradedAgentOutput as MarketingDegraded, run_marketing_agent
from app.agents.pricing_agent import DegradedAgentOutput as PricingDegraded, run_pricing_agent
from app.agents.product_strategist_agent import (
    DegradedAgentOutput as ProductStrategistDegraded,
    run_product_strategist_agent,
)
from app.models.agent_output_schemas import (
    MarketingOutput,
    MarketResearchOutput,
    PricingOutput,
    ProductStrategyOutput,
)
from app.models.schemas import (
    MarketingAgentInput,
    MarketResearchInput,
    PricingAgentInput,
    ProductStrategistInput,
)

router = APIRouter(prefix="/agents", tags=["agents"])


def _respond(result: BaseModel) -> JSONResponse:
    """Serialize an agent result, adding the founder reply (if any) as
    `reply_to_founder` next to the output fields. The frontend strips it off
    before storing the output, so approved outputs stay schema-exact."""
    body = result.model_dump(mode="json")
    reply = getattr(result, "_founder_reply", None)
    if reply:
        body["reply_to_founder"] = reply
    return JSONResponse(body)


@router.post("/market-research", response_model=MarketResearchOutput | MarketResearchDegraded)
async def market_research(payload: MarketResearchInput) -> JSONResponse:
    return _respond(await run_market_research_agent(payload))


@router.post("/product-strategist", response_model=ProductStrategyOutput | ProductStrategistDegraded)
async def product_strategist(
    payload: ProductStrategistInput,
) -> JSONResponse:
    return _respond(await run_product_strategist_agent(payload))


@router.post("/pricing", response_model=PricingOutput | PricingDegraded)
async def pricing(payload: PricingAgentInput) -> JSONResponse:
    return _respond(await run_pricing_agent(payload))


@router.post("/marketing", response_model=MarketingOutput | MarketingDegraded)
async def marketing(payload: MarketingAgentInput) -> JSONResponse:
    return _respond(await run_marketing_agent(payload))
