// Typed mirrors of backend/app/models/agent_output_schemas.py for the
// human-in-the-loop flow. Keep in sync by hand.

import type { OrchestratorOutput } from "@/lib/types";

export type Signal = "high" | "medium" | "low";

export interface MarketResearchOutput {
  market_trends: { summary: string; tailwinds: string[]; headwinds: string[] };
  market_size_estimate: { tam: string; sam: string; som: string; methodology_note: string };
  competitor_analysis: {
    name: string;
    type: "direct" | "indirect";
    strengths: string[];
    weaknesses: string[];
    pricing_snapshot?: string | null;
    source_url: string;
  }[];
  customer_pain_points: { pain_point: string; frequency_signal: Signal; evidence_source_url: string }[];
  data_confidence: Signal;
  raw_sources: string[];
}

export interface ProductStrategyOutput {
  core_pain_point_anchor: string;
  value_proposition: string;
  mvp_features: {
    must_have: { feature: string; justification: string }[];
    nice_to_have: { feature: string; rationale: string }[];
  };
  ui_vibe_specification: {
    style: string;
    mode: "light" | "dark" | "auto";
    color_palette: { primary: string; secondary: string; accent: string; background: string };
    font_pairing_suggestion: string;
    design_tokens_note: string;
  };
}

export interface PricingOutput {
  estimated_unit_economics: {
    per_user_cogs: number;
    estimated_ltv: number;
    estimated_cac: number;
    target_ltv_cac_ratio: number;
    ltv_cac_rule_passed: boolean;
  };
  pricing_tiers: {
    starter: { price: number; billing_cycle: string; included_features: string[] };
    pro: { price: number; billing_cycle: string; included_features: string[]; target_gross_margin_pct: number };
    enterprise: { pricing_model: "flat_rate" | "custom_quote"; included_features: string[] };
  };
  roi_projection: {
    projected_yield_pct: number;
    months_to_min_profit_target: number;
    confidence_range: { low: number; high: number };
  };
}

export interface MarketingOutput {
  recommended_channels: {
    channel: string;
    priority_rank: number;
    strategic_reasoning: string;
    estimated_monthly_cost: number;
  }[];
  brand_taglines: string[];
  sample_campaign_posts: { channel_name: string; post_content: string; visual_asset_prompt: string }[];
  automation_payload: { format_version: string; payload_json_stringified: string; webhook_ready: boolean };
}

export interface DegradedOutput {
  status: "unavailable";
  agent: string;
  error: string;
  attempts: number;
}

export type HitlOrchestratorOutput = OrchestratorOutput & { strategic_recommendations?: string[] };

export type AgentId = "market_research" | "product_strategist" | "financial" | "marketing" | "orchestrator";
export type SubAgentId = Exclude<AgentId, "orchestrator">;

export interface AgentOutputs {
  market_research: MarketResearchOutput;
  product_strategist: ProductStrategyOutput;
  financial: PricingOutput;
  marketing: MarketingOutput;
}

/** One answered MCQ question: the picked option, or "Other" plus typed text. */
export interface Answer {
  choice: string;
  other?: string;
}
export type Answers = Record<string, Answer>;

export interface ChatRow {
  id: string;
  user_id: string;
  title: string;
  status: "in_progress" | "completed";
  current_agent_index: number;
  intake: Partial<Record<SubAgentId, Answers>>;
  approved_outputs: Partial<AgentOutputs>;
  report: ReportBundle | null;
  share_id: string;
  created_at: string;
  updated_at: string;
}

export type MessagePayload =
  | { kind: "intake"; answers: Answers }
  | { kind: "revision" }
  | { kind: "output"; output: AgentOutputs[SubAgentId] | DegradedOutput }
  | { kind: "approved" }
  | { kind: "reset" };

export interface MessageRow {
  id: string;
  chat_id: string;
  agent_id: AgentId;
  sender: "agent" | "user" | "system";
  content: string;
  options: unknown;
  payload: MessagePayload | null;
  created_at: string;
}

/** Everything the report (in-app, shared link and PDF) renders from. */
export interface ReportBundle {
  title: string;
  generated_at: string;
  orchestrator: HitlOrchestratorOutput;
  outputs: AgentOutputs;
}

export function isDegraded(value: unknown): value is DegradedOutput {
  return !!value && typeof value === "object" && (value as { status?: unknown }).status === "unavailable";
}
