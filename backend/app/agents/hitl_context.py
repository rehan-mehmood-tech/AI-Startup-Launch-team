"""Human-in-the-loop prompt context shared by all four sub-agents.

Appended to an agent's user prompt when the founder supplied free-text notes
or asked for a revision of a previous output. Kept deliberately compact:
each agent runs against an 8000 tokens-per-minute Groq budget, so the
previous output is truncated rather than sent whole.
"""
from __future__ import annotations

import json

from app.models.schemas import HitlContext


def hitl_context_block(req: HitlContext, max_previous_chars: int = 1500) -> str:
    parts: list[str] = []

    if req.founder_notes:
        parts.append(
            "FOUNDER_NOTES (extra context the founder typed that didn't fit a structured field — "
            "treat as authoritative input):\n"
            f"{req.founder_notes}"
        )

    if req.revision_request:
        previous = ""
        if req.previous_output:
            raw = json.dumps(req.previous_output, ensure_ascii=False)
            if len(raw) > max_previous_chars:
                raw = raw[:max_previous_chars] + "…(truncated)"
            previous = f"\nYOUR_PREVIOUS_OUTPUT (the version being revised):\n{raw}\n"
        parts.append(
            "REVISION_REQUEST — the founder reviewed your previous output and asked for changes. "
            "Apply the request below. Keep everything they didn't object to consistent with your "
            "previous output. The grounding rules still apply: never invent sources, competitors, or "
            "numbers the input data doesn't support; if the request asks for something the data "
            "can't back up, say so in the relevant field instead of fabricating it."
            f"{previous}\n"
            f"FOUNDER'S REQUEST:\n{req.revision_request}"
        )

    return ("\n\n" + "\n\n".join(parts)) if parts else ""
