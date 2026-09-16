"""Dev-only endpoints for exercising tools in isolation via Swagger (/docs)."""
from fastapi import APIRouter, HTTPException, status

from app.models.schemas import MarketResearchInput, SerpIntelligenceBundle, TrendSignal
from app.tools.serpapi_client import SerpApiClient, SerpToolError

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])


def _client() -> SerpApiClient:
    try:
        return SerpApiClient()
    except SerpToolError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc


@router.post("/serp/market-scan", response_model=SerpIntelligenceBundle)
async def serp_market_scan(payload: MarketResearchInput) -> SerpIntelligenceBundle:
    return await _client().amarket_scan(payload)


@router.get("/serp/trends", response_model=TrendSignal)
async def serp_trends(keyword: str, country_code: str | None = None) -> TrendSignal:
    import asyncio

    try:
        return await asyncio.to_thread(_client().google_trends, keyword, country_code=country_code)
    except SerpToolError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc
