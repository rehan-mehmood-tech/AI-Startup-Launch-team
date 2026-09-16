from fastapi import APIRouter

from app.api.v1 import agents, diagnostics, orchestrator

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(diagnostics.router)
api_router.include_router(agents.router)
api_router.include_router(orchestrator.router)
