import type { OrchestratorInput, TargetCustomerSegment } from "@/lib/types";

/** The six answers the onboarding wizard collects, in step order. */
export interface OnboardingAnswers {
  idea: string;
  industry: string;
  audience: string;
  stage: string;
  growthChannel: string;
  concern: string;
}

/**
 * The Figma wizard collects 5 answers; the backend's OrchestratorInput
 * requires 13 fields. This maps what we have and supplies documented
 * defaults for the rest.
 *
 * Nothing the founder typed is discarded: `stage`, `growthChannel` and
 * `concern` have no dedicated backend field, so they're appended to
 * `core_idea` as context — the Market Research agent reads that field, so
 * the signal reaches the pipeline rather than being dropped.
 *
 * `target_industry` is collected directly by wizard step 2 (with an
 * "Other…" free-text option), so SerpApi's competitor and market queries
 * are scoped to the founder's actual industry rather than a generic guess.
 * DEFAULT_INDUSTRY is only a fallback for a skipped/blank answer.
 */
export const DEFAULT_INDUSTRY = "technology";
export const DEFAULT_LOCATION = "Global";

const SEGMENT_BY_AUDIENCE: Record<string, TargetCustomerSegment> = {
  "B2C Consumers": "B2C",
  "SMB Operators": "SMB",
  "Enterprise Buyers": "Enterprise",
  "Developers / Technical": "SMB",
  Prosumers: "B2C",
};

/** Rough CAC/profit starting points by segment, so the deterministic pricing
 * engine has plausible inputs. These are assumptions, not founder data. */
const DEFAULTS_BY_SEGMENT: Record<TargetCustomerSegment, { cac: number; minProfit: number; budget: number }> = {
  B2C: { cac: 35, minProfit: 5000, budget: 1500 },
  SMB: { cac: 250, minProfit: 15000, budget: 4000 },
  "Mid-Market": { cac: 1200, minProfit: 40000, budget: 10000 },
  Enterprise: { cac: 5000, minProfit: 100000, budget: 20000 },
};

/** Stage answer → a plausible launch horizon for the marketing agent. */
const TIMELINE_BY_STAGE: Record<string, string> = {
  "Pre-idea / Exploring": "6 months from today",
  "Idea with research done": "4 months from today",
  "MVP in development": "8 weeks from today",
  "MVP live with early users": "4 weeks from today",
  "Revenue generating": "already launched — scaling now",
};

export function resolveSegment(audience: string): TargetCustomerSegment {
  return SEGMENT_BY_AUDIENCE[audience] ?? "B2C";
}

export function buildOrchestratorInput(ownerId: string, answers: OnboardingAnswers): OrchestratorInput {
  const segment = resolveSegment(answers.audience);
  const defaults = DEFAULTS_BY_SEGMENT[segment];

  // Fold the un-mapped wizard answers into the idea text so their signal
  // still reaches the agents.
  const contextLines = [
    answers.idea.trim(),
    answers.stage ? `Current stage: ${answers.stage}.` : "",
    answers.growthChannel ? `Primary intended growth channel: ${answers.growthChannel}.` : "",
    answers.concern ? `The founder's biggest concern is: ${answers.concern}.` : "",
  ].filter(Boolean);

  return {
    owner_id: ownerId,
    market_research: {
      core_idea: contextLines.join(" "),
      target_industry: answers.industry?.trim() || DEFAULT_INDUSTRY,
      target_location: DEFAULT_LOCATION,
      audience_demographics: { segment: answers.audience || null },
      known_competitors: [],
    },
    core_feature: answers.idea.trim(),
    delivery_mechanism: "Web",
    // Matches this product's own design system (Dark Obsidian + Champagne Gold).
    visual_vibe_style: "Dark obsidian minimalism with champagne gold accents",
    visual_vibe_mode: "dark",
    visual_vibe_color_palette: {
      primary: "#E7D296",
      secondary: "#C9B98A",
      accent: "#B9C99A",
      background: "#050405",
    },
    tech_stack_expectations: "Modern web stack — Next.js frontend, API backend, managed Postgres",
    target_customer_segment: segment,
    customer_acquisition_cost: defaults.cac,
    minimum_profit_expectation: defaults.minProfit,
    tone_of_voice: "Professional",
    marketing_budget: { min_monthly_usd: defaults.budget / 2, max_monthly_usd: defaults.budget },
    launch_timeline: TIMELINE_BY_STAGE[answers.stage] ?? "3 months from today",
  };
}
