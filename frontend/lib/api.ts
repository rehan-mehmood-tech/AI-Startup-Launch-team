import { supabase } from "@/lib/supabase/client";
import type { OrchestratorInput, OrchestratorOutput } from "@/lib/types";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Attaches the current Supabase session's access token as a Bearer header.
 * The FastAPI backend does not verify this token yet (no auth middleware is
 * wired in there — see backend/app/agents/orchestrator_agent.py, which takes
 * `owner_id` directly on the request body instead). Sending it anyway means
 * nothing on the frontend has to change once backend-side JWT verification
 * is added.
 */
async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new ApiError(res.status, detail || `Request to ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<TResponse>;
}

/** Human-in-the-loop: one agent per request, plus a synthesize-only
 * orchestrator call over the founder-approved outputs. */
export const hitlApi = {
  marketResearch: (body: unknown) => postJson<unknown>("/api/v1/agents/market-research", body),
  productStrategist: (body: unknown) => postJson<unknown>("/api/v1/agents/product-strategist", body),
  pricing: (body: unknown) => postJson<unknown>("/api/v1/agents/pricing", body),
  marketing: (body: unknown) => postJson<unknown>("/api/v1/agents/marketing", body),
  synthesize: <T,>(body: unknown) => postJson<T>("/api/v1/agents/orchestrator/synthesize", body),
};

/** Turns an ApiError body (often FastAPI's JSON `detail`) into one readable line. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.message) as { detail?: unknown };
      if (typeof parsed.detail === "string") return parsed.detail;
      if (Array.isArray(parsed.detail)) {
        return parsed.detail
          .map(d => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : String(d)))
          .join("; ");
      }
    } catch {
      /* not JSON */
    }
    return err.message || `Request failed (${err.status})`;
  }
  if (err instanceof TypeError) return "Can't reach the validation server. Check that the backend is running.";
  return err instanceof Error ? err.message : "Something went wrong.";
}

/** Runs the full 4-agent pipeline + orchestrator synthesis. Can take a couple
 * of minutes — the caller is expected to show a loading state. */
export function runOrchestratorPipeline(input: OrchestratorInput): Promise<OrchestratorOutput> {
  return postJson<OrchestratorOutput>("/api/v1/agents/orchestrator", input);
}
