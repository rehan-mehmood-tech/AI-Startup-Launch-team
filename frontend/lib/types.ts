// Mirrors app/models/schemas.py::OrchestratorInput and
// app/models/agent_output_schemas.py::OrchestratorOutput on the backend.
// Keep these in sync by hand for now — there's no shared codegen yet.

export type DeliveryMechanism = "Web" | "Mobile" | "API" | "Hybrid";
export type VisualVibeMode = "light" | "dark" | "auto";
export type TargetCustomerSegment = "B2C" | "SMB" | "Mid-Market" | "Enterprise";
export type ToneOfVoice = "Professional" | "Playful" | "Bold" | "Minimal";
export type ValidationStatus = "Green" | "Amber" | "Red";

export interface AudienceDemographics {
  age_range?: string | null;
  income_band?: string | null;
  segment?: string | null;
}

export interface MarketResearchInput {
  core_idea: string;
  target_industry: string;
  target_location: string;
  country_code?: string | null;
  audience_demographics?: AudienceDemographics;
  known_competitors?: string[];
}

export interface VisualVibeColorPalette {
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
  background?: string | null;
}

export interface MarketingBudgetRange {
  min_monthly_usd: number;
  max_monthly_usd: number;
}

export interface OrchestratorInput {
  owner_id: string;
  market_research: MarketResearchInput;
  core_feature: string;
  delivery_mechanism: DeliveryMechanism;
  visual_vibe_style: string;
  visual_vibe_mode: VisualVibeMode;
  visual_vibe_color_palette: VisualVibeColorPalette;
  tech_stack_expectations: string;
  target_customer_segment: TargetCustomerSegment;
  customer_acquisition_cost: number;
  minimum_profit_expectation: number;
  tone_of_voice: ToneOfVoice;
  marketing_budget: MarketingBudgetRange;
  launch_timeline: string;
}

export interface ValidationReasoningSignal {
  signal: string;
  source_agent: string;
  weight: "high" | "medium" | "low";
}

export interface LowInformationWarning {
  triggered: boolean;
  affected_fields: string[];
  confidence_penalty: number;
}

export interface FailureCaseStudyEntry {
  company: string;
  collapse_reason: string;
  matched_risk_pattern: string;
  similarity_score: number;
}

export interface VerifiedResource {
  url: string;
  source_agent: string;
  description: string;
}

export interface OrchestratorOutput {
  executive_summary: string;
  validation_status: ValidationStatus;
  validation_reasoning: ValidationReasoningSignal[];
  low_information_warning: LowInformationWarning;
  failure_case_study: FailureCaseStudyEntry[];
  compiled_dashboard: {
    market_research: Record<string, unknown>;
    product_strategy: Record<string, unknown>;
    pricing: Record<string, unknown>;
    marketing: Record<string, unknown>;
  };
  verified_resources: VerifiedResource[];
}
