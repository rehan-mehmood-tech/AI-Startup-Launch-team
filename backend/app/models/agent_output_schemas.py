"""Strict per-agent output contracts (PRD §3). Any LLM output is validated here
before the Orchestrator trusts it or it is persisted to agent_runs."""
from __future__ import annotations

import json
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

HttpUrlStr = Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^https?://\S+$")]
NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Signal = Literal["high", "medium", "low"]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# Agent 1 — Market Research (PRD §3.2)
# ---------------------------------------------------------------------------


class MarketTrends(_Strict):
    summary: NonEmptyStr
    tailwinds: list[NonEmptyStr]
    headwinds: list[NonEmptyStr]


class MarketSizeEstimate(_Strict):
    tam: NonEmptyStr
    sam: NonEmptyStr
    som: NonEmptyStr
    methodology_note: NonEmptyStr


class CompetitorEntry(_Strict):
    name: NonEmptyStr
    type: Literal["direct", "indirect"]
    strengths: list[NonEmptyStr]
    weaknesses: list[NonEmptyStr]
    pricing_snapshot: str | None = None
    source_url: HttpUrlStr

    @model_validator(mode="before")
    @classmethod
    def _normalize_synonyms(cls, data: object) -> object:
        # Small, fast, low-reasoning-effort LLM calls occasionally drift to a
        # near-miss key name (e.g. "status" for "type"). Normalize the common
        # synonyms here instead of burning a corrective retry on it.
        if isinstance(data, dict) and "type" not in data:
            for alt in ("status", "competitor_type", "relationship"):
                if alt in data:
                    data["type"] = data.pop(alt)
                    break
        return data


class CustomerPainPoint(_Strict):
    pain_point: NonEmptyStr
    frequency_signal: Signal
    evidence_source_url: HttpUrlStr

    @model_validator(mode="before")
    @classmethod
    def _normalize_synonyms(cls, data: object) -> object:
        if isinstance(data, dict) and "frequency_signal" not in data:
            for alt in ("frequency", "signal", "confidence"):
                if alt in data:
                    data["frequency_signal"] = data.pop(alt)
                    break
        return data


class MarketResearchOutput(_Strict):
    market_trends: MarketTrends
    market_size_estimate: MarketSizeEstimate
    competitor_analysis: list[CompetitorEntry]
    customer_pain_points: list[CustomerPainPoint]
    data_confidence: Signal
    raw_sources: list[HttpUrlStr]

    @model_validator(mode="after")
    def _enforce_rules(self) -> "MarketResearchOutput":
        # Rule 2: >= 3 competitors, unless SerpApi degraded and confidence is already low.
        if self.data_confidence != "low" and len(self.competitor_analysis) < 3:
            raise ValueError(
                "competitor_analysis must contain at least 3 competitors "
                "unless data_confidence is 'low'"
            )
        # Rule 3: every cited URL must be retained in raw_sources.
        self.raw_sources = list(dict.fromkeys(self.raw_sources))
        retained = set(self.raw_sources)
        cited = {c.source_url for c in self.competitor_analysis} | {
            p.evidence_source_url for p in self.customer_pain_points
        }
        missing = sorted(cited - retained)
        if missing:
            raise ValueError(f"cited URLs missing from raw_sources: {missing}")
        return self


# ---------------------------------------------------------------------------
# Agent 2 — Product Strategist (PRD §3.3)
# ---------------------------------------------------------------------------

HexColor = Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^#(?:[0-9a-fA-F]{3}){1,2}$")]


class MustHaveFeature(_Strict):
    feature: NonEmptyStr
    justification: NonEmptyStr


class NiceToHaveFeature(_Strict):
    feature: NonEmptyStr
    rationale: NonEmptyStr


class MvpFeatures(_Strict):
    must_have: list[MustHaveFeature] = Field(max_length=5)
    nice_to_have: list[NiceToHaveFeature] = Field(default_factory=list)


class ColorPalette(_Strict):
    primary: HexColor
    secondary: HexColor
    accent: HexColor
    background: HexColor


class UiVibeSpecification(_Strict):
    style: NonEmptyStr
    mode: Literal["light", "dark", "auto"]
    color_palette: ColorPalette
    font_pairing_suggestion: NonEmptyStr
    design_tokens_note: NonEmptyStr


class ProductStrategyOutput(_Strict):
    core_pain_point_anchor: NonEmptyStr
    value_proposition: NonEmptyStr
    mvp_features: MvpFeatures
    ui_vibe_specification: UiVibeSpecification

    @model_validator(mode="after")
    def _enforce_rules(self) -> "ProductStrategyOutput":
        # Rule 3: hard cap of 5 must-have features — Field(max_length=5) already
        # rejects a longer list, but guard against an empty list too (a product
        # with zero must-have features isn't a constrained MVP, it's nothing).
        if not self.mvp_features.must_have:
            raise ValueError("mvp_features.must_have must contain at least 1 feature")
        return self


# ---------------------------------------------------------------------------
# Agent 3 — Pricing (PRD §3.4)
# ---------------------------------------------------------------------------

PricingModel = Literal["flat_rate", "custom_quote"]


class EstimatedUnitEconomics(_Strict):
    per_user_cogs: float = Field(ge=0)
    estimated_ltv: float = Field(ge=0)
    estimated_cac: float = Field(gt=0)
    target_ltv_cac_ratio: float = Field(ge=0)
    ltv_cac_rule_passed: bool


class StarterTier(_Strict):
    price: float = Field(ge=0)
    billing_cycle: NonEmptyStr
    included_features: list[NonEmptyStr]


class ProTier(_Strict):
    price: float = Field(gt=0)
    billing_cycle: NonEmptyStr
    included_features: list[NonEmptyStr]
    target_gross_margin_pct: float = Field(ge=0, le=100)


class EnterpriseTier(_Strict):
    pricing_model: PricingModel
    included_features: list[NonEmptyStr]


class PricingTiers(_Strict):
    starter: StarterTier
    pro: ProTier
    enterprise: EnterpriseTier


class ConfidenceRange(_Strict):
    low: float
    high: float


class RoiProjection(_Strict):
    projected_yield_pct: float
    months_to_min_profit_target: float = Field(ge=0)
    confidence_range: ConfidenceRange


class PricingOutput(_Strict):
    estimated_unit_economics: EstimatedUnitEconomics
    pricing_tiers: PricingTiers
    roi_projection: RoiProjection

    @model_validator(mode="after")
    def _enforce_rules(self) -> "PricingOutput":
        econ = self.estimated_unit_economics
        # Rule 2 (SaaS 3:1 LTV/CAC Rule Checking Engine): the flag must agree
        # with the actual ratio — this is a hard-coded business-rule check,
        # never something the LLM gets to assert independently.
        if econ.ltv_cac_rule_passed != (econ.target_ltv_cac_ratio >= 3.0):
            raise ValueError(
                "ltv_cac_rule_passed must equal (target_ltv_cac_ratio >= 3.0); "
                f"got passed={econ.ltv_cac_rule_passed} ratio={econ.target_ltv_cac_ratio}"
            )
        if self.pricing_tiers.starter.price >= self.pricing_tiers.pro.price:
            raise ValueError("pricing_tiers.starter.price must be lower than pricing_tiers.pro.price")
        return self


# ---------------------------------------------------------------------------
# Agent 4 — Marketing (PRD §3.5)
# ---------------------------------------------------------------------------

AD_CREATIVE_PREFIX = "/adcreative"


class RecommendedChannel(_Strict):
    channel: NonEmptyStr
    priority_rank: int = Field(ge=1, le=3)
    strategic_reasoning: NonEmptyStr
    estimated_monthly_cost: float = Field(ge=0)


class SampleCampaignPost(_Strict):
    channel_name: NonEmptyStr
    post_content: NonEmptyStr
    visual_asset_prompt: NonEmptyStr

    @model_validator(mode="before")
    @classmethod
    def _ensure_adcreative_prefix(cls, data: object) -> object:
        # Belt-and-suspenders: the prompt instructs the model to prepend this
        # itself, but the prefix requirement is a hard contract (it's what
        # tells the founder to paste the prompt into an image tool), so
        # normalize it here rather than trust the model never drops it.
        if isinstance(data, dict) and isinstance(data.get("visual_asset_prompt"), str):
            prompt = data["visual_asset_prompt"].strip()
            if not prompt.startswith(AD_CREATIVE_PREFIX):
                prompt = f"{AD_CREATIVE_PREFIX} {prompt}"
            data["visual_asset_prompt"] = prompt
        return data


class AutomationPayload(_Strict):
    format_version: NonEmptyStr
    payload_json_stringified: NonEmptyStr
    webhook_ready: bool

    @field_validator("payload_json_stringified")
    @classmethod
    def _must_be_valid_json(cls, v: str) -> str:
        try:
            json.loads(v)
        except json.JSONDecodeError as exc:
            raise ValueError(f"payload_json_stringified is not valid JSON: {exc}") from exc
        return v


class MarketingOutput(_Strict):
    recommended_channels: list[RecommendedChannel] = Field(min_length=3, max_length=3)
    brand_taglines: list[NonEmptyStr] = Field(min_length=3, max_length=3)
    sample_campaign_posts: list[SampleCampaignPost] = Field(min_length=3, max_length=3)
    automation_payload: AutomationPayload

    @model_validator(mode="after")
    def _enforce_rules(self) -> "MarketingOutput":
        # Rule 1: exactly the top 3 channels, ranked 1-3 with no gaps/dupes.
        ranks = sorted(c.priority_rank for c in self.recommended_channels)
        if ranks != [1, 2, 3]:
            raise ValueError(f"recommended_channels.priority_rank must be a permutation of [1,2,3], got {ranks}")
        # Rule 3: every visual_asset_prompt must carry the /adcreative prefix
        # (the before-validator above normalizes this, so this is a guard
        # against that normalization somehow being bypassed).
        bad = [
            p.channel_name for p in self.sample_campaign_posts if not p.visual_asset_prompt.startswith(AD_CREATIVE_PREFIX)
        ]
        if bad:
            raise ValueError(f"visual_asset_prompt missing '{AD_CREATIVE_PREFIX}' prefix for channels: {bad}")
        # Each recommended channel should have a matching sample post — keeps
        # the two arrays from drifting apart (e.g. 3 channels but posts for a
        # different set of platforms).
        channel_names = {c.channel.strip().lower() for c in self.recommended_channels}
        post_names = {p.channel_name.strip().lower() for p in self.sample_campaign_posts}
        if channel_names != post_names:
            raise ValueError(
                f"sample_campaign_posts channels {sorted(post_names)} must match "
                f"recommended_channels {sorted(channel_names)}"
            )
        return self


# ---------------------------------------------------------------------------
# Agent 5 — Chief AI Orchestrator (PRD §3.6)
# ---------------------------------------------------------------------------

ValidationStatus = Literal["Green", "Amber", "Red"]


class ValidationReasoningSignal(_Strict):
    signal: NonEmptyStr
    source_agent: NonEmptyStr
    weight: Signal


class LowInformationWarning(_Strict):
    triggered: bool
    affected_fields: list[NonEmptyStr] = Field(default_factory=list)
    confidence_penalty: float = Field(ge=0, le=1)


class FailureCaseStudyEntry(_Strict):
    company: NonEmptyStr
    collapse_reason: NonEmptyStr
    matched_risk_pattern: NonEmptyStr
    similarity_score: float = Field(ge=0, le=1)


class CompiledDashboard(_Strict):
    # Deliberately loose (plain dict, not nested strict models): each slot is
    # either a full, already-validated sub-agent output dump or a degraded/
    # skipped placeholder — re-validating that shape here would just be
    # re-checking work the sub-agent's own strict schema already did.
    market_research: dict
    product_strategy: dict
    pricing: dict
    marketing: dict


class VerifiedResource(_Strict):
    url: HttpUrlStr
    source_agent: NonEmptyStr
    description: NonEmptyStr


class OrchestratorOutput(_Strict):
    executive_summary: NonEmptyStr
    validation_status: ValidationStatus
    validation_reasoning: list[ValidationReasoningSignal]
    low_information_warning: LowInformationWarning
    failure_case_study: list[FailureCaseStudyEntry] = Field(default_factory=list)
    compiled_dashboard: CompiledDashboard
    verified_resources: list[VerifiedResource] = Field(default_factory=list)

    @model_validator(mode="after")
    def _enforce_rules(self) -> "OrchestratorOutput":
        # Rule 2 (Historical Reality Check): "Red" is the PRD's own definition
        # of high risk, so a Red verdict must come with matched failure
        # precedent, not just an assertion.
        if self.validation_status == "Red" and not self.failure_case_study:
            raise ValueError("validation_status 'Red' requires at least one failure_case_study entry")
        return self
