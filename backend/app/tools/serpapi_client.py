"""SerpApi execution layer for the Market Research Agent (PRD §3.2, §2.3).

Built on the official SDK (`pip install serpapi`):

    client = serpapi.Client(api_key=..., timeout=...)
    results = client.search({"engine": "google", "q": "..."})

Adds: exponential backoff on timeouts / 429 / 5xx, normalization of Organic,
Local Pack and Google Trends payloads, URL dedup + domain-authority ranking,
and degraded-mode partial bundles (data_confidence="low") instead of crashing.
"""
from __future__ import annotations

import asyncio
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from statistics import mean
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import serpapi

from app.config import get_settings
from app.models.schemas import (
    DataConfidence,
    MarketResearchInput,
    QueryPurpose,
    SerpIntelligenceBundle,
    SerpLocalResult,
    SerpOrganicResult,
    SerpQueryRecord,
    TrendPoint,
    TrendSignal,
)

logger = logging.getLogger(__name__)

RETRYABLE_STATUS = {408, 429, 500, 502, 503, 504}
NO_RESULTS_MARKER = "hasn't returned any results"
MAX_COMPETITOR_PROBES = 5
REVIEW_SITES = "(site:reddit.com OR site:g2.com OR site:trustpilot.com OR site:capterra.com)"

# Heuristic authority weights (suffix match on registrable domain).
DOMAIN_AUTHORITY: dict[str, float] = {
    "statista.com": 0.95, "gartner.com": 0.95, "mckinsey.com": 0.95,
    "grandviewresearch.com": 0.85, "fortunebusinessinsights.com": 0.8,
    "techcrunch.com": 0.9, "reuters.com": 0.9, "bloomberg.com": 0.9,
    "forbes.com": 0.8, "crunchbase.com": 0.85, "cbinsights.com": 0.85,
    "g2.com": 0.85, "capterra.com": 0.8, "trustpilot.com": 0.8,
    "producthunt.com": 0.75, "reddit.com": 0.7, "news.ycombinator.com": 0.75,
    "wikipedia.org": 0.7, "linkedin.com": 0.6, "medium.com": 0.45,
}
TLD_AUTHORITY = {".gov": 0.9, ".edu": 0.85, ".org": 0.55}
DEFAULT_AUTHORITY = 0.4

TRACKING_PARAMS = ("utm_", "gclid", "fbclid", "ref", "srsltid")


class SerpToolError(RuntimeError):
    """Non-recoverable SerpApi failure (bad key, exhausted retries, bad params)."""


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------


def normalize_url(url: str) -> str:
    parts = urlsplit(url.strip())
    query = urlencode(
        [(k, v) for k, v in parse_qsl(parts.query) if not k.lower().startswith(TRACKING_PARAMS)]
    )
    path = parts.path.rstrip("/") or ""
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, query, ""))


def domain_of(url: str) -> str:
    netloc = urlsplit(url).netloc.lower()
    return netloc[4:] if netloc.startswith("www.") else netloc


def authority_score(domain: str) -> float:
    for known, score in DOMAIN_AUTHORITY.items():
        if domain == known or domain.endswith("." + known):
            return score
    for tld, score in TLD_AUTHORITY.items():
        if domain.endswith(tld):
            return score
    return DEFAULT_AUTHORITY


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


class SerpApiClient:
    def __init__(
        self,
        api_key: str | None = None,
        *,
        timeout: float | None = None,
        max_attempts: int | None = None,
        backoff_base: float | None = None,
        max_workers: int | None = None,
    ) -> None:
        settings = get_settings()
        key = api_key or settings.serpapi_api_key
        if not key:
            raise SerpToolError("SERPAPI_API_KEY is not configured")
        self._client = serpapi.Client(
            api_key=key, timeout=timeout or settings.serpapi_timeout_seconds
        )
        self.max_attempts = max_attempts or settings.serpapi_max_attempts
        self.backoff_base = backoff_base or settings.serpapi_backoff_base_seconds
        self.max_workers = max_workers or settings.serpapi_max_workers

    # -- transport ----------------------------------------------------------

    def _search(self, params: dict[str, Any]) -> dict[str, Any]:
        """Single SerpApi call with exponential backoff (2s, 4s, 8s, ...)."""
        for attempt in range(1, self.max_attempts + 1):
            try:
                data = dict(self._client.search(params))
            except (serpapi.TimeoutError, serpapi.HTTPConnectionError) as exc:
                reason = f"{type(exc).__name__}: {exc}"
            except serpapi.HTTPError as exc:
                status = getattr(exc, "status_code", None) or getattr(
                    getattr(exc, "response", None), "status_code", None
                )
                body_error = getattr(exc, "error", None)
                if body_error and NO_RESULTS_MARKER in str(body_error):
                    return {}
                if status not in RETRYABLE_STATUS:
                    raise SerpToolError(f"SerpApi HTTP {status}: {body_error or exc}") from exc
                reason = f"HTTP {status}"
            else:
                error = data.get("error")
                if not error:
                    return data
                if NO_RESULTS_MARKER in error:
                    return {}
                raise SerpToolError(f"SerpApi error: {error}")

            if attempt == self.max_attempts:
                raise SerpToolError(f"SerpApi retries exhausted after {attempt} attempts ({reason})")
            delay = self.backoff_base * 2 ** (attempt - 1)
            logger.warning(
                "serpapi retry", extra={"attempt": attempt, "delay_s": delay, "reason": reason}
            )
            time.sleep(delay)
        raise AssertionError("unreachable")

    # -- endpoints ----------------------------------------------------------

    def google_search(
        self,
        query: str,
        purpose: QueryPurpose,
        *,
        country_code: str | None = None,
        num: int = 10,
    ) -> tuple[list[SerpOrganicResult], list[SerpLocalResult]]:
        params: dict[str, Any] = {"engine": "google", "q": query, "num": num, "hl": "en"}
        if country_code:
            params["gl"] = country_code
        data = self._search(params)
        return self._parse_organic(data, query, purpose), self._parse_local(data)

    def google_trends(self, keyword: str, *, country_code: str | None = None) -> TrendSignal:
        geo = (country_code or "").upper()
        data = self._search(
            {
                "engine": "google_trends",
                "q": keyword[:100],
                "geo": geo,
                "date": "today 12-m",
                "data_type": "TIMESERIES",
            }
        )
        return self._parse_trends(data, keyword, geo)

    # -- parsers ------------------------------------------------------------

    @staticmethod
    def _parse_organic(
        data: dict[str, Any], query: str, purpose: QueryPurpose
    ) -> list[SerpOrganicResult]:
        out: list[SerpOrganicResult] = []
        for item in data.get("organic_results", []) or []:
            link = item.get("link")
            if not link or not link.startswith(("http://", "https://")):
                continue
            domain = domain_of(link)
            out.append(
                SerpOrganicResult(
                    query=query,
                    purpose=purpose,
                    position=int(item.get("position") or len(out) + 1),
                    title=item.get("title") or domain,
                    url=normalize_url(link),
                    domain=domain,
                    snippet=item.get("snippet") or "",
                    authority_score=authority_score(domain),
                )
            )
        return out

    @staticmethod
    def _parse_local(data: dict[str, Any]) -> list[SerpLocalResult]:
        local = data.get("local_results")
        places = local.get("places", []) if isinstance(local, dict) else (local or [])
        out: list[SerpLocalResult] = []
        for p in places:
            if not isinstance(p, dict) or not p.get("title"):
                continue
            links = p.get("links") or {}
            out.append(
                SerpLocalResult(
                    title=p["title"],
                    rating=p.get("rating"),
                    reviews=p.get("reviews"),
                    address=p.get("address"),
                    place_type=p.get("type"),
                    website=links.get("website") if isinstance(links, dict) else None,
                )
            )
        return out

    @staticmethod
    def _parse_trends(data: dict[str, Any], keyword: str, geo: str) -> TrendSignal:
        timeline = (data.get("interest_over_time") or {}).get("timeline_data") or []
        points: list[TrendPoint] = []
        for row in timeline:
            values = row.get("values") or []
            if values:
                points.append(
                    TrendPoint(date=row.get("date", ""), value=int(values[0].get("extracted_value") or 0))
                )
        window = len(points) // 4
        if window < 2 or not any(p.value for p in points):
            return TrendSignal(keyword=keyword, geo=geo, direction="insufficient_data", points=points)

        start = mean(p.value for p in points[:window])
        end = mean(p.value for p in points[-window:])
        change = round((end - start) / start * 100, 1) if start else None
        if change is None:
            direction = "rising" if end > 0 else "flat"
        elif change >= 15:
            direction = "rising"
        elif change <= -15:
            direction = "declining"
        else:
            direction = "flat"
        return TrendSignal(keyword=keyword, geo=geo, direction=direction, change_pct=change, points=points)

    # -- Agent 1 composite scan --------------------------------------------

    def build_query_plan(self, req: MarketResearchInput) -> list[tuple[str, QueryPurpose]]:
        year = datetime.now(timezone.utc).year
        plan: list[tuple[str, QueryPurpose]] = [
            (f"{req.core_idea[:120]} {req.target_industry} {req.target_location}", "competitor_discovery"),
            (f"best {req.target_industry} apps alternatives {req.target_location}", "competitor_discovery"),
            (f"{req.target_industry} {req.target_location} complaints {REVIEW_SITES}", "competitor_reviews"),
            (f"{req.target_industry} market size {year} report {req.target_location}", "market_size"),
        ]
        for name in req.known_competitors[:MAX_COMPETITOR_PROBES]:
            plan.append((f"{name} pricing plans", "competitor_pricing"))
            plan.append((f"{name} reviews complaints {REVIEW_SITES}", "competitor_reviews"))
        return plan

    def market_scan(self, req: MarketResearchInput) -> SerpIntelligenceBundle:
        """Fan out all SERP queries concurrently; never raises on per-query failure."""
        plan = self.build_query_plan(req)
        query_log: list[SerpQueryRecord] = []
        organic: list[SerpOrganicResult] = []
        local: list[SerpLocalResult] = []
        trends: TrendSignal | None = None

        with ThreadPoolExecutor(max_workers=self.max_workers) as pool:
            search_futures = {
                pool.submit(self.google_search, q, purpose, country_code=req.country_code): (q, purpose)
                for q, purpose in plan
            }
            trends_future = pool.submit(
                self.google_trends, req.target_industry, country_code=req.country_code
            )

            for future, (q, purpose) in search_futures.items():
                try:
                    o, l = future.result()
                except SerpToolError as exc:
                    query_log.append(SerpQueryRecord(query=q, engine="google", purpose=purpose, status="failed", error=str(exc)))
                    continue
                organic.extend(o)
                local.extend(l)
                query_log.append(
                    SerpQueryRecord(
                        query=q, engine="google", purpose=purpose,
                        status="ok" if o else "empty", result_count=len(o),
                    )
                )

            try:
                trends = trends_future.result()
                query_log.append(
                    SerpQueryRecord(
                        query=req.target_industry, engine="google_trends", purpose="trends",
                        status="empty" if trends.direction == "insufficient_data" else "ok",
                        result_count=len(trends.points),
                    )
                )
            except SerpToolError as exc:
                query_log.append(
                    SerpQueryRecord(query=req.target_industry, engine="google_trends", purpose="trends", status="failed", error=str(exc))
                )

        organic = self._dedupe_and_rank(organic)
        local = list({p.title.lower(): p for p in local}.values())
        return SerpIntelligenceBundle(
            generated_at=datetime.now(timezone.utc),
            organic_results=organic,
            local_results=local,
            trends=trends,
            query_log=query_log,
            raw_sources=[r.url for r in organic],
            data_confidence=self._confidence(query_log, organic),
        )

    async def amarket_scan(self, req: MarketResearchInput) -> SerpIntelligenceBundle:
        return await asyncio.to_thread(self.market_scan, req)

    @staticmethod
    def _dedupe_and_rank(results: list[SerpOrganicResult]) -> list[SerpOrganicResult]:
        best: dict[str, SerpOrganicResult] = {}
        for r in results:
            current = best.get(r.url)
            if current is None or r.position < current.position:
                best[r.url] = r
        # Authority first, then SERP position (lower is better).
        return sorted(best.values(), key=lambda r: (-r.authority_score, r.position))

    @staticmethod
    def _confidence(log: list[SerpQueryRecord], organic: list[SerpOrganicResult]) -> DataConfidence:
        if not log:
            return "low"
        ok_ratio = sum(r.status == "ok" for r in log) / len(log)
        if ok_ratio >= 0.8 and len(organic) >= 15:
            return "high"
        if ok_ratio >= 0.5 and len(organic) >= 6:
            return "medium"
        return "low"
