"""Historical startup-failure case matcher for the Orchestrator (PRD §3.6).

A curated, factually-checked static dataset stands in for the PRD's pgvector
"historical failure case matching via vector store" (no Supabase/pgvector is
wired up in this codebase yet — see app/services/run_state.py for the same
caveat on state persistence). Matching against risk *tags* the pipeline
already computed is deterministic Python, not an LLM guess, so the company
names and collapse reasons here can never be hallucinated — only which ones
get selected can vary, and that's driven by real signals (LTV:CAC failure,
low market/data confidence, oversaturated competition, vague low-info idea).
"""
from __future__ import annotations

from pydantic import BaseModel

RiskTag = str


class FailureCase(BaseModel):
    company: str
    collapse_reason: str
    risk_tags: list[RiskTag]


# Each risk_tag maps to a concrete, checkable signal computed elsewhere in the
# orchestrator (see _compute_risk_tags in orchestrator_agent.py).
FAILURE_CASE_LIBRARY: list[FailureCase] = [
    FailureCase(
        company="Kozmo.com",
        collapse_reason=(
            "Promised free 1-hour delivery of low-value items (a candy bar, a video) with no minimum "
            "order size — the delivery cost per order structurally exceeded the revenue per order, so "
            "the company burned cash faster the more it grew. Filed for bankruptcy in 2001."
        ),
        risk_tags=["unit_economics_failure", "negative_ltv_cac"],
    ),
    FailureCase(
        company="Fast (fast.co)",
        collapse_reason=(
            "Raised $124M for a one-click checkout button but never solved distribution — merchant "
            "adoption stayed tiny while burn stayed venture-scale, with no path to a sustainable "
            "customer-acquisition cost. Shut down in 2022 with weeks of runway left."
        ),
        risk_tags=["unit_economics_failure", "negative_ltv_cac", "no_differentiation"],
    ),
    FailureCase(
        company="Juicero",
        collapse_reason=(
            "Built a $400 Wi-Fi-connected juicer for pre-packaged juice packs that could be squeezed by "
            "hand just as fast — the core value proposition didn't survive contact with reality once "
            "press demonstrated the packs needed no machine at all. Shut down in 2017."
        ),
        risk_tags=["weak_value_proposition", "over_engineered_mvp"],
    ),
    FailureCase(
        company="WeWork",
        collapse_reason=(
            "Marketed itself as a high-growth tech platform while running a capital-intensive real-estate "
            "lease-arbitrage business — long-term lease liabilities against short-term membership revenue "
            "left it unable to survive a downturn. Its 2019 IPO collapsed under governance and "
            "unit-economics scrutiny."
        ),
        risk_tags=["unit_economics_failure", "unsustainable_growth", "governance_risk"],
    ),
    FailureCase(
        company="Quibi",
        collapse_reason=(
            "Raised $1.75B for short-form mobile video but launched with no free tier, no social/sharing "
            "features, and content people could already get elsewhere — a solution built for a problem "
            "that market research would have flagged as not validated. Shut down within 6 months in 2020."
        ),
        risk_tags=["weak_value_proposition", "no_differentiation", "vague_market_validation"],
    ),
    FailureCase(
        company="Theranos",
        collapse_reason=(
            "Claimed a proprietary blood-testing device could run hundreds of tests from a finger-prick "
            "sample — the underlying technology never worked as claimed, and the company operated on "
            "fabricated validation instead of verified evidence. Collapsed in 2018 amid fraud charges."
        ),
        risk_tags=["vague_market_validation", "unverified_claims"],
    ),
    FailureCase(
        company="Homejoy",
        collapse_reason=(
            "Subsidized home-cleaning bookings with heavy discounts to chase growth, but most discounted "
            "customers never converted to full-price repeat bookings — customer lifetime value never "
            "cleared acquisition cost. Shut down in 2015."
        ),
        risk_tags=["unit_economics_failure", "negative_ltv_cac"],
    ),
]


def compute_similarity_score(case: FailureCase, active_tags: set[str]) -> float:
    if not case.risk_tags:
        return 0.0
    matched = len(set(case.risk_tags) & active_tags)
    return round(matched / len(case.risk_tags), 2)


def match_failure_cases(active_tags: set[str], max_results: int = 3) -> list[tuple[FailureCase, float]]:
    """Return up to `max_results` cases with at least one matching risk tag,
    ranked by similarity score (highest first)."""
    scored = [(case, compute_similarity_score(case, active_tags)) for case in FAILURE_CASE_LIBRARY]
    scored = [(case, score) for case, score in scored if score > 0]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:max_results]
