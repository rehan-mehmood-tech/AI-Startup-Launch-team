"""Orchestrator run-state tracking (PRD §3.6), persisted in Supabase's
`workspaces` table (see database_schema.sql) — replaces the earlier
in-memory `_STORE` placeholder now that real Supabase credentials exist.

State machine, unchanged from before: draft -> pending_validation -> running
-> compiled -> delivered (plus `failed`). Every transition is now a real
UPDATE against Postgres, so state survives process restarts and is visible
across backend instances. `create_run`/`transition`/`get_run` are async now
(they weren't before) since they do real network I/O — callers already
`await` everything else in the pipeline, so this is a drop-in change at the
call sites in orchestrator_agent.py.
"""
from __future__ import annotations

import logging
from typing import Literal

from pydantic import BaseModel

from app.services.supabase_client import get_supabase, run_sync

logger = logging.getLogger(__name__)

RunState = Literal["draft", "pending_validation", "running", "compiled", "delivered", "failed"]
ValidationStatus = Literal["Green", "Amber", "Red"]

WORKSPACES_TABLE = "workspaces"


class RunRecord(BaseModel):
    run_id: str  # workspaces.id
    owner_id: str
    state: RunState
    title: str
    validation_status: ValidationStatus | None = None


def _row_to_record(row: dict) -> RunRecord:
    return RunRecord(
        run_id=row["id"],
        owner_id=row["owner_id"],
        state=row["status"],
        title=row.get("title") or "Untitled Idea",
        validation_status=row.get("validation_status"),
    )


async def create_run(owner_id: str, title: str = "Untitled Idea") -> RunRecord:
    """Insert a new workspace row. The wizard input has already passed strict
    Pydantic validation by the time this is called (FastAPI's own pre-flight
    gateway), so the state machine starts at `pending_validation` rather than
    `draft` — `draft` is for a workspace a frontend creates before the wizard
    is fully filled in, which this backend-only pipeline never does."""
    client = get_supabase()
    result = await run_sync(
        lambda: client.table(WORKSPACES_TABLE)
        .insert({"owner_id": owner_id, "title": title[:200], "status": "pending_validation"})
        .execute()
    )
    return _row_to_record(result.data[0])


async def transition(
    run_id: str, state: RunState, validation_status: ValidationStatus | None = None
) -> RunRecord:
    client = get_supabase()
    update: dict = {"status": state}
    if validation_status is not None:
        update["validation_status"] = validation_status
    result = await run_sync(
        lambda: client.table(WORKSPACES_TABLE).update(update).eq("id", run_id).execute()
    )
    if not result.data:
        # The workspace row must already exist (create_run always runs
        # first); a missing row means something else deleted it. State
        # tracking must never crash the pipeline over this — log and
        # return a synthetic record so the caller can keep going.
        logger.error("run_state: transition on missing workspace id=%s", run_id)
        return RunRecord(run_id=run_id, owner_id="", state=state, title="Untitled Idea", validation_status=validation_status)
    return _row_to_record(result.data[0])


async def get_run(run_id: str) -> RunRecord | None:
    client = get_supabase()
    result = await run_sync(
        lambda: client.table(WORKSPACES_TABLE).select("*").eq("id", run_id).limit(1).execute()
    )
    if not result.data:
        return None
    return _row_to_record(result.data[0])
