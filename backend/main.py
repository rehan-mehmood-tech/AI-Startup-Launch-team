"""Top-level ASGI entry point for deployment platforms (Render, Railway, Heroku).

Allows both `uvicorn main:app` (Render default) and `uvicorn app.main:app`
to locate and import the FastAPI application instance without import errors.
"""
import sys
from pathlib import Path

# Ensure the backend directory is on the Python path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app  # noqa: E402

__all__ = ["app"]
