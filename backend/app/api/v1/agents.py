"""Per-agent test routes — exercise each sub-agent standalone via Swagger."""
from fastapi import APIRouter

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


@router.post("/market-research", response_model=MarketResearchOutput | MarketResearchDegraded)
async def market_research(payload: MarketResearchInput) -> MarketResearchOutput | MarketResearchDegraded:
    return await run_market_research_agent(payload)


@router.post("/product-strategist", response_model=ProductStrategyOutput | ProductStrategistDegraded)
async def product_strategist(
    payload: ProductStrategistInput,
) -> ProductStrategyOutput | ProductStrategistDegraded:
    return await run_product_strategist_agent(payload)


@router.post("/pricing", response_model=PricingOutput | PricingDegraded)
async def pricing(payload: PricingAgentInput) -> PricingOutput | PricingDegraded:
    return await run_pricing_agent(payload)


@router.post("/marketing", response_model=MarketingOutput | MarketingDegraded)
async def marketing(payload: MarketingAgentInput) -> MarketingOutput | MarketingDegraded:
    return await run_marketing_agent(payload)
