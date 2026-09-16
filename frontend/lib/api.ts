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

/** Runs the full 4-agent pipeline + orchestrator synthesis. Can take a couple
 * of minutes — the caller is expected to show a loading state. */
export function runOrchestratorPipeline(input: OrchestratorInput): Promise<OrchestratorOutput> {
  return postJson<OrchestratorOutput>("/api/v1/agents/orchestrator", input);
}
