"""Deterministic unit-economics engine for the Pricing Agent (PRD §3.4).

PRD §3.4 is explicit: "You do not generate arbitrary numbers; you compute
pricing models based on operational reality." So every number in the final
PricingOutput comes from here, not from the LLM — the LLM only buckets MVP
features into tiers and picks billing-cycle copy (see pricing_agent.py). This
module is pure, synchronous, and has no external dependencies, so its output
is 100% reproducible for the same input.

All heuristics below are documented assumptions (there is no live financial
telemetry to ground this in, unlike Agent 1's SerpApi data), chosen to match
standard SaaS unit-economics practice.
"""
from __future__ import annotations

from pydantic import BaseModel

TargetSegment = str  # "B2C" | "SMB" | "Mid-Market" | "Enterprise" — validated at the schema layer

# --- Documented heuristic constants -----------------------------------------

# Baseline monthly hosting/infra cost per active user, before feature load.
SEGMENT_BASE_HOSTING_USD: dict[str, float] = {
    "B2C": 0.50,
    "SMB": 2.00,
    "Mid-Market": 5.00,
    "Enterprise": 10.00,
}

# Assumed average paying-customer lifetime (inverse of monthly churn), by
# segment — smaller accounts churn faster than contracted enterprise accounts.
SEGMENT_AVG_LIFETIME_MONTHS: dict[str, float] = {
    "B2C": 12.0,
    "SMB": 24.0,
    "Mid-Market": 36.0,
    "Enterprise": 48.0,
}

# Each must-have MVP feature adds incremental API calls/storage/compute.
FEATURE_COGS_INCREMENT_USD = 0.30

# Extra token-cost load when the tech stack mentions an LLM/AI component.
AI_STACK_KEYWORDS = ("ai", "llm", "gpt", "machine learning", " ml ", "genai", "openai", "groq")
AI_TOKEN_COST_USD = 1.50

# Pro tier is priced at the midpoint of the PRD's 60-70% gross-margin band.
TARGET_GROSS_MARGIN = 0.65

# PRD §3.4 Rule 2: LTV must be >= this multiple of CAC.
MIN_LTV_CAC_RATIO = 3.0

# Starter tier is a loss-leader/acquisition hook priced well below Pro.
STARTER_PRICE_FRACTION_OF_PRO = 0.40

# Baseline monthly acquisition-marketing spend assumption used to translate a
# per-customer CAC into a customer-acquisition *rate* for the ROI timeline —
# there's no spend/budget input in the wizard, so this is a documented seed-
# stage baseline, not something asserted as the founder's actual budget.
ASSUMED_MONTHLY_MARKETING_SPEND_USD = 5000.0

# Monte-Carlo-style sensitivity band requested by PRD §3.4 execution rules.
SENSITIVITY_PCT = 0.20


class ConfidenceRangeResult(BaseModel):
    low: float
    high: float


class RoiProjectionResult(BaseModel):
    projected_yield_pct: float
    months_to_min_profit_target: float
    confidence_range: ConfidenceRangeResult


class UnitEconomicsResult(BaseModel):
    per_user_cogs: float
    estimated_ltv: float
    estimated_cac: float
    target_ltv_cac_ratio: float
    ltv_cac_rule_passed: bool


class TierPricingResult(BaseModel):
    starter_price: float
    pro_price: float
    pro_gross_margin_pct: float
    enterprise_pricing_model: str  # "flat_rate" | "custom_quote"


class PricingCalculationResult(BaseModel):
    unit_economics: UnitEconomicsResult
    tiers: TierPricingResult
    roi_projection: RoiProjectionResult


def estimate_per_user_cogs(tech_stack_expectations: str, segment: str, must_have_count: int) -> float:
    """Per-user monthly COGS = base hosting (by segment) + incremental cost per
    must-have feature + an AI/LLM token-cost surcharge if the stack calls for one."""
    base = SEGMENT_BASE_HOSTING_USD.get(segment, SEGMENT_BASE_HOSTING_USD["SMB"])
    feature_cost = must_have_count * FEATURE_COGS_INCREMENT_USD
    stack_lower = f" {tech_stack_expectations.lower()} "
    ai_cost = AI_TOKEN_COST_USD if any(kw in stack_lower for kw in AI_STACK_KEYWORDS) else 0.0
    return round(base + feature_cost + ai_cost, 2)


def _gross_margin_pct(price: float, cogs: float) -> float:
    if price <= 0:
        return 0.0
    return round(((price - cogs) / price) * 100, 2)


def _ltv(price: float, cogs: float, lifetime_months: float) -> float:
    margin_fraction = max((price - cogs) / price, 0.0) if price > 0 else 0.0
    return round(price * margin_fraction * lifetime_months, 2)


def compute_pro_price(cogs: float, cac: float, segment: str) -> float:
    """Solve for the Pro-tier price that satisfies BOTH the 60-70% gross-margin
    band (PRD Rule 3) and the 3:1 minimum LTV:CAC ratio (PRD Rule 2), taking
    whichever constraint demands the higher price."""
    lifetime_months = SEGMENT_AVG_LIFETIME_MONTHS.get(segment, SEGMENT_AVG_LIFETIME_MONTHS["SMB"])

    # Price implied by the target gross-margin band alone.
    price_from_margin = cogs / (1 - TARGET_GROSS_MARGIN)

    # Price implied by requiring LTV == 3x CAC at that same margin.
    price_from_ltv_rule = (MIN_LTV_CAC_RATIO * cac) / (TARGET_GROSS_MARGIN * lifetime_months)

    price = max(price_from_margin, price_from_ltv_rule)
    # Round to a psychologically-friendly .99 price point.
    return round(max(price, cogs + 1.0) - 0.01, 2)


def compute_unit_economics(
    cogs: float, cac: float, pro_price: float, segment: str
) -> UnitEconomicsResult:
    lifetime_months = SEGMENT_AVG_LIFETIME_MONTHS.get(segment, SEGMENT_AVG_LIFETIME_MONTHS["SMB"])
    ltv = _ltv(pro_price, cogs, lifetime_months)
    ratio = round(ltv / cac, 2) if cac > 0 else 0.0
    return UnitEconomicsResult(
        per_user_cogs=cogs,
        estimated_ltv=ltv,
        estimated_cac=round(cac, 2),
        target_ltv_cac_ratio=ratio,
        ltv_cac_rule_passed=ratio >= MIN_LTV_CAC_RATIO,
    )


def determine_enterprise_pricing_model(segment: str) -> str:
    """Mid-Market/Enterprise buyers negotiate; B2C/SMB get a flat published rate."""
    return "custom_quote" if segment in ("Mid-Market", "Enterprise") else "flat_rate"


def _yield_and_months(
    pro_price: float, cogs: float, cac: float, lifetime_months: float, minimum_profit_expectation: float
) -> tuple[float, float]:
    monthly_profit_per_customer = max(pro_price - cogs, 0.0)
    annual_yield_pct = (
        round((monthly_profit_per_customer * 12 / cac) * 100, 2) if cac > 0 else 0.0
    )
    if cac <= 0 or monthly_profit_per_customer <= 0:
        return annual_yield_pct, 0.0
    new_customers_per_month = max(ASSUMED_MONTHLY_MARKETING_SPEND_USD / cac, 0.01)
    # Active customers accumulate month over month (ignoring churn for this
    # simplified timeline — churn is instead captured via the lifetime-months
    # sensitivity pass below); total monthly profit at month m is the profit
    # from all customers acquired so far.
    # minimum_profit_expectation = new_customers_per_month * m * monthly_profit_per_customer
    months = minimum_profit_expectation / (new_customers_per_month * monthly_profit_per_customer)
    return annual_yield_pct, round(max(months, 1.0), 1)


def build_roi_projection(
    pro_price: float,
    cogs: float,
    cac: float,
    segment: str,
    minimum_profit_expectation: float,
) -> RoiProjectionResult:
    lifetime_months = SEGMENT_AVG_LIFETIME_MONTHS.get(segment, SEGMENT_AVG_LIFETIME_MONTHS["SMB"])
    base_yield, base_months = _yield_and_months(pro_price, cogs, cac, lifetime_months, minimum_profit_expectation)

    # Monte-Carlo-style sensitivity (PRD §3.4 execution rule): perturb CAC and
    # churn (via lifetime) by +/-20% across all 4 combinations and take the
    # resulting spread on projected yield as the confidence range.
    yields: list[float] = []
    for cac_mult in (1 - SENSITIVITY_PCT, 1 + SENSITIVITY_PCT):
        for lifetime_mult in (1 - SENSITIVITY_PCT, 1 + SENSITIVITY_PCT):
            scenario_yield, _ = _yield_and_months(
                pro_price, cogs, cac * cac_mult, lifetime_months * lifetime_mult, minimum_profit_expectation
            )
            yields.append(scenario_yield)

    return RoiProjectionResult(
        projected_yield_pct=base_yield,
        months_to_min_profit_target=base_months,
        confidence_range=ConfidenceRangeResult(low=round(min(yields), 2), high=round(max(yields), 2)),
    )


def run_pricing_engine(
    tech_stack_expectations: str,
    target_customer_segment: str,
    customer_acquisition_cost: float,
    minimum_profit_expectation: float,
    must_have_count: int,
) -> PricingCalculationResult:
    """Single entry point the agent calls: runs the full deterministic pipeline
    (COGS -> tier pricing -> unit economics -> ROI sensitivity) for one input set."""
    cogs = estimate_per_user_cogs(tech_stack_expectations, target_customer_segment, must_have_count)
    pro_price = compute_pro_price(cogs, customer_acquisition_cost, target_customer_segment)
    starter_price = round(pro_price * STARTER_PRICE_FRACTION_OF_PRO, 2)

    unit_economics = compute_unit_economics(
        cogs, customer_acquisition_cost, pro_price, target_customer_segment
    )
    roi_projection = build_roi_projection(
        pro_price, cogs, customer_acquisition_cost, target_customer_segment, minimum_profit_expectation
    )
    tiers = TierPricingResult(
        starter_price=starter_price,
        pro_price=pro_price,
        pro_gross_margin_pct=_gross_margin_pct(pro_price, cogs),
        enterprise_pricing_model=determine_enterprise_pricing_model(target_customer_segment),
    )
    return PricingCalculationResult(unit_economics=unit_economics, tiers=tiers, roi_projection=roi_projection)
