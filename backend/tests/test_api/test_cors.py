"""Tests for CORS Middleware configuration."""
import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestCORS(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_cors_preflight_request(self):
        """Verify OPTIONS preflight request from Vercel deployment returns 200 with CORS headers."""
        response = self.client.options(
            "/health",
            headers={
                "Origin": "https://ai-startup-launch.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,authorization",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "https://ai-startup-launch.vercel.app")
        self.assertEqual(response.headers.get("access-control-allow-credentials"), "true")
        self.assertIn("POST", response.headers.get("access-control-allow-methods", ""))

    def test_cors_actual_request_vercel(self):
        """Verify actual request from Vercel domain contains Access-Control-Allow-Origin header."""
        response = self.client.get(
            "/health",
            headers={"Origin": "https://ai-startup-launch.vercel.app"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "https://ai-startup-launch.vercel.app")
        self.assertEqual(response.headers.get("access-control-allow-credentials"), "true")


if __name__ == "__main__":
    unittest.main()
