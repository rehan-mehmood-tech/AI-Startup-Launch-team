"""Request models and internal tool models (PRD §4.2 models/schemas.py).

Strict LLM *output* contracts live in agent_output_schemas.py.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.agent_output_schemas import (
    MarketingOutput,
    MarketResearchOutput,
    MvpFeatures,
    PricingOutput,
    ProductStrategyOutput,
)


# ---------------------------------------------------------------------------
# Human-in-the-loop context shared by every sub-agent input
# ---------------------------------------------------------------------------


class HitlContext(BaseModel):
    """Optional fields that let a founder steer one agent at a time.

    - founder_notes: free-text context from "Other" answers that don't fit an
      enum field (e.g. a delivery mechanism outside Web/Mobile/API/Hybrid).
    - revision_request: a counter-argument or refinement for a re-run.
    - previous_output: the output being revised, so the agent can change what
      was asked for and keep the rest.
    """

    model_config = ConfigDict(str_strip_whitespace=True)

    founder_notes: str | None = Field(default=None, max_length=2000)
    revision_request: str | None = Field(default=None, max_length=2000)
    previous_output: dict[str, Any] | None = None

# ---------------------------------------------------------------------------
# Agent 1 — Market Research: wizard inputs (Steps 1–2)
# ---------------------------------------------------------------------------


class AudienceDemographics(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    age_range: str | None = Field(default=None, max_length=40, examples=["22-35"])
    income_band: str | None = Field(default=None, max_length=60, examples=["$40k-$90k"])
    segment: str | None = Field(default=None, max_length=120, examples=["university students"])


class MarketResearchInput(HitlContext):
    model_config = ConfigDict(str_strip_whitespace=True)

    core_idea: str = Field(min_length=10, max_length=2000)
    target_industry: str = Field(min_length=2, max_length=120)
    target_location: str = Field(min_length=2, max_length=120, examples=["Lahore, Pakistan"])
    country_code: str | None = Field(
        default=None,
        pattern=r"^[A-Za-z]{2}$",
        description="ISO-3166 alpha-2 code; drives SerpApi `gl` and Google Trends `geo`.",
        examples=["pk"],
    )
    audience_demographics: AudienceDemographics = Field(default_factory=AudienceDemographics)
    known_competitors: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("country_code")
    @classmethod
    def _lower_country(cls, v: str | None) -> str | None:
        return v.lower() if v else v

    @field_validator("known_competitors")
    @classmethod
    def _clean_competitors(cls, v: list[str]) -> list[str]:
        seen: set[str] = set()
        cleaned: list[str] = []
        for name in v:
            name = name.strip()
            if name and name.lower() not in seen:
                seen.add(name.lower())
                cleaned.append(name)
        return cleaned


# ---------------------------------------------------------------------------
# SerpApi tool layer: normalized results handed to the Market Research LLM
# ---------------------------------------------------------------------------

DataConfidence = Literal["high", "medium", "low"]

QueryPurpose = Literal[
    "competitor_discovery",
    "competitor_pricing",
    "competitor_reviews",
    "market_size",
    "trends",
]


class SerpOrganicResult(BaseModel):
    query: str
    purpose: QueryPurpose
    position: int
    title: str
    url: str
    domain: str
    snippet: str = ""
    authority_score: float = Field(ge=0, le=1)


class SerpLocalResult(BaseModel):
    title: str
    rating: float | None = None
    reviews: int | None = None
    address: str | None = None
    place_type: str | None = None
    website: str | None = None


class TrendPoint(BaseModel):
    date: str
    value: int


class TrendSignal(BaseModel):
    keyword: str
    geo: str = Field(description="Empty string means worldwide.")
    direction: Literal["rising", "flat", "declining", "insufficient_data"]
    change_pct: float | None = Field(
        default=None, description="Mean of last quarter of the window vs first quarter."
    )
    points: list[TrendPoint] = Field(default_factory=list)


class SerpQueryRecord(BaseModel):
    query: str
    engine: str
    purpose: QueryPurpose
    status: Literal["ok", "empty", "failed"]
    result_count: int = 0
    error: str | None = None


class SerpIntelligenceBundle(BaseModel):
    """Everything Agent 1's LLM step is allowed to cite. `raw_sources` is the
    allow-list used by url_retention.py to reject hallucinated URLs."""

    generated_at: datetime
    organic_results: list[SerpOrganicResult] = Field(default_factory=list)
    local_results: list[SerpLocalResult] = Field(default_factory=list)
    trends: TrendSignal | None = None
    query_log: list[SerpQueryRecord] = Field(default_factory=list)
    raw_sources: list[str] = Field(default_factory=list)
    data_confidence: DataConfidence


# ---------------------------------------------------------------------------
# Agent 2 — Product Strategist: wizard inputs (PRD §3.3)
# ---------------------------------------------------------------------------

DeliveryMechanism = Literal["Web", "Mobile", "API", "Hybrid"]
VisualVibeMode = Literal["light", "dark", "auto"]


class VisualVibeColorPalette(BaseModel):
    """Free-form color tokens the founder supplies as a starting point — the
    agent's ui_vibe_specification.color_palette is the normalized #hex output."""

    model_config = ConfigDict(str_strip_whitespace=True)

    primary: str | None = Field(default=None, max_length=60, examples=["Finance Green"])
    secondary: str | None = Field(default=None, max_length=60)
    accent: str | None = Field(default=None, max_length=60)
    background: str | None = Field(default=None, max_length=60, examples=["near-black"])


class ProductStrategistInput(HitlContext):
    model_config = ConfigDict(str_strip_whitespace=True)

    market_research: MarketResearchOutput = Field(
        description="Full Agent 1 output — pain points and competitor analysis this agent anchors on."
    )
    core_feature: str = Field(min_length=5, max_length=1000)
    delivery_mechanism: DeliveryMechanism
    visual_vibe_style: str = Field(min_length=2, max_length=200, examples=["Minimalist Dark Mode"])
    visual_vibe_mode: VisualVibeMode = "auto"
    visual_vibe_color_palette: VisualVibeColorPalette = Field(default_factory=VisualVibeColorPalette)


# ---------------------------------------------------------------------------
# Agent 3 — Pricing: wizard inputs (PRD §3.4)
# ---------------------------------------------------------------------------

TargetCustomerSegment = Literal["B2C", "SMB", "Mid-Market", "Enterprise"]


class PricingAgentInput(HitlContext):
    model_config = ConfigDict(str_strip_whitespace=True)

    mvp_features: MvpFeatures = Field(
        description="Agent 2's mvp_features output — must_have/nice_to_have feature lists to bucket into tiers."
    )
    tech_stack_expectations: str = Field(
        min_length=2,
        max_length=1000,
        examples=["Next.js frontend, FastAPI backend, Groq LLM for tutoring, Postgres"],
    )
    target_customer_segment: TargetCustomerSegment
    customer_acquisition_cost: float = Field(
        gt=0, le=100_000, description="Estimated $ cost to acquire one paying customer."
    )
    minimum_profit_expectation: float = Field(
        gt=0,
        le=10_000_000,
        description="Minimum monthly recurring profit ($) the founder wants this product to reach.",
    )


# ---------------------------------------------------------------------------
# Agent 4 — Marketing: wizard inputs (PRD §3.5, Wizard Step 5)
# ---------------------------------------------------------------------------

ToneOfVoice = Literal["Professional", "Playful", "Bold", "Minimal"]


class MarketingBudgetRange(BaseModel):
    """Wizard Step 5's budget slider — a numeric range, not a single figure."""

    model_config = ConfigDict(str_strip_whitespace=True)

    min_monthly_usd: float = Field(ge=0, le=1_000_000, examples=[500])
    max_monthly_usd: float = Field(ge=0, le=1_000_000, examples=[2000])

    @field_validator("max_monthly_usd")
    @classmethod
    def _max_at_least_min(cls, v: float, info) -> float:
        min_v = info.data.get("min_monthly_usd")
        if min_v is not None and v < min_v:
            raise ValueError("max_monthly_usd must be >= min_monthly_usd")
        return v


class MarketingAgentInput(HitlContext):
    model_config = ConfigDict(str_strip_whitespace=True)

    mvp_strategy: ProductStrategyOutput = Field(
        description="Full Agent 2 output — value proposition and MVP features this campaign sells."
    )
    pricing: PricingOutput = Field(description="Full Agent 3 output — tiers/pricing referenced in campaign copy.")
    tone_of_voice: ToneOfVoice
    marketing_budget: MarketingBudgetRange
    launch_timeline: str = Field(
        min_length=2, max_length=200, examples=["6 weeks from today", "2026-11-01"]
    )


# ---------------------------------------------------------------------------
# Agent 5 — Chief AI Orchestrator (PRD §3.6)
# ---------------------------------------------------------------------------
#
# This is the full wizard's input matrix: everything a founder fills in across
# all 4 sub-agent steps, collected up front. The Pydantic model itself IS the
# "pre-flight gateway" the PRD asks for — FastAPI rejects an incomplete
# submission (422) before the orchestrator calls a single sub-agent, so no
# heavy pipeline work ever starts on a partially-filled wizard. A conversational
# multi-turn chat wizard (collecting these same fields turn by turn) belongs in
# the frontend / a separate stateful chat layer; this schema is its contract.


class OrchestratorInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    # The Supabase auth.users id that will own the resulting workspace row
    # (public.workspaces.owner_id has a NOT NULL FK to auth.users(id) — see
    # database_schema.sql). There is no session/auth middleware wired into
    # this backend yet, so the caller (frontend, once it has a signed-in
    # Supabase session) is responsible for supplying the real user id here.
    owner_id: str = Field(min_length=1, description="Supabase auth.users.id that owns this workspace.")

    # Step 1-2: Market Research
    market_research: MarketResearchInput

    # Step 3: Product Strategist
    core_feature: str = Field(min_length=5, max_length=1000)
    delivery_mechanism: DeliveryMechanism
    visual_vibe_style: str = Field(min_length=2, max_length=200, examples=["Minimalist Dark Mode"])
    visual_vibe_mode: VisualVibeMode = "auto"
    visual_vibe_color_palette: VisualVibeColorPalette = Field(default_factory=VisualVibeColorPalette)

    # Step 4: Pricing
    tech_stack_expectations: str = Field(min_length=2, max_length=1000)
    target_customer_segment: TargetCustomerSegment
    customer_acquisition_cost: float = Field(gt=0, le=100_000)
    minimum_profit_expectation: float = Field(gt=0, le=10_000_000)

    # Step 5: Marketing
    tone_of_voice: ToneOfVoice
    marketing_budget: MarketingBudgetRange
    launch_timeline: str = Field(min_length=2, max_length=200, examples=["6 weeks from today"])


class OrchestratorRerunInput(BaseModel):
    """Counter-questioning / re-routing (PRD §3.6): re-run the pipeline from one
    stage forward, reusing whatever upstream sub-agent outputs are still valid
    instead of paying for the whole pipeline again."""

    model_config = ConfigDict(str_strip_whitespace=True)

    workspace_id: str = Field(
        min_length=1, description="The existing public.workspaces.id from the original /orchestrator run."
    )
    original_input: OrchestratorInput = Field(
        description="The full original input, with any fields the founder wants to change already updated."
    )
    rerun_from: Literal["market_research", "product_strategist", "pricing", "marketing"]
    market_research_output: MarketResearchOutput | None = Field(
        default=None, description="Reuse this instead of re-calling Agent 1 (omit when rerun_from is market_research)."
    )
    product_strategy_output: ProductStrategyOutput | None = Field(
        default=None,
        description="Reuse this instead of re-calling Agent 2 (omit when rerun_from is market_research/product_strategist).",
    )
    pricing_output: PricingOutput | None = Field(
        default=None,
        description="Reuse this instead of re-calling Agent 3 (omit when rerun_from is market_research/product_strategist/pricing).",
    )


class OrchestratorSynthesizeInput(BaseModel):
    """Final step of the human-in-the-loop flow: synthesise a verdict from the
    four outputs the founder already approved, without re-running any agent."""

    intake: OrchestratorInput
    market_research_output: MarketResearchOutput
    product_strategy_output: ProductStrategyOutput
    pricing_output: PricingOutput
    marketing_output: MarketingOutput
