import type {
  AgentId,
  AgentOutputs,
  Answer,
  Answers,
  MarketResearchOutput,
  SubAgentId,
} from "@/lib/hitl/types";

export const OTHER = "Other";

export interface McqQuestion {
  id: string;
  prompt: string;
  /** "text" = one required short line (used only for the idea itself). */
  kind: "choice" | "text";
  options?: string[];
  placeholder?: string;
  /** Other text must parse as a positive number. */
  numericOther?: boolean;
  minLength?: number;
}

export interface AgentDef {
  id: AgentId;
  index: number;
  name: string;
  short: string;
  blurb: string;
}

export const AGENTS: AgentDef[] = [
  { id: "market_research", index: 0, name: "Market Research", short: "Research", blurb: "Live competitor, trend and pain-point scan grounded in search data." },
  { id: "product_strategist", index: 1, name: "Product Strategist", short: "Product", blurb: "Value proposition, MVP scope and UI direction anchored on the research." },
  { id: "financial", index: 2, name: "Financial & Business Model", short: "Financial", blurb: "Deterministic unit economics, pricing tiers and ROI projection." },
  { id: "marketing", index: 3, name: "Go-To-Market & Marketing", short: "Marketing", blurb: "Channels, taglines, campaign posts and ad-creative prompts." },
  { id: "orchestrator", index: 4, name: "Orchestrator", short: "Verdict", blurb: "Aggregates the four approved outputs into the final verdict." },
];

export const SUB_AGENT_IDS: SubAgentId[] = ["market_research", "product_strategist", "financial", "marketing"];

// ── Question sets ─────────────────────────────────────────────────────

const LOCATIONS: Record<string, { location: string; code: string | null }> = {
  Global: { location: "Global", code: null },
  "United States": { location: "United States", code: "US" },
  "United Kingdom": { location: "United Kingdom", code: "GB" },
  Pakistan: { location: "Pakistan", code: "PK" },
  India: { location: "India", code: "IN" },
  "European Union": { location: "European Union", code: null },
};

export function questionsFor(agent: SubAgentId, approved: Partial<AgentOutputs>): McqQuestion[] {
  switch (agent) {
    case "market_research":
      return [
        { id: "idea", kind: "text", prompt: "In one sentence, what are you building and for whom?", placeholder: "e.g. An AI study planner for university entrance-exam students", minLength: 10 },
        { id: "industry", kind: "choice", prompt: "Which industry does it compete in?", options: ["SaaS / B2B Software", "Consumer App", "Fintech", "Healthtech", "Edtech", "E-commerce / Retail", "Marketplace", OTHER] },
        { id: "location", kind: "choice", prompt: "Which market should the research focus on?", options: [...Object.keys(LOCATIONS), OTHER] },
        { id: "segment", kind: "choice", prompt: "Who is the primary customer?", options: ["Consumers", "Students", "Small businesses", "Enterprise teams", "Developers", OTHER] },
        { id: "age", kind: "choice", prompt: "Typical customer age range?", options: ["18-24", "25-34", "35-49", "50+", "Mixed / not age-specific", OTHER] },
        { id: "income", kind: "choice", prompt: "Typical customer income or budget level?", options: ["Low / price-sensitive", "Middle", "High / premium", "Company budget", OTHER] },
      ];
    case "product_strategist": {
      const pains = (approved.market_research as MarketResearchOutput | undefined)?.customer_pain_points ?? [];
      const painOptions = pains.slice(0, 4).map(p => p.pain_point);
      return [
        { id: "core_feature", kind: "choice", prompt: "Which pain point should the core feature solve first?", options: [...painOptions, OTHER] },
        { id: "delivery", kind: "choice", prompt: "How will customers use the product?", options: ["Web", "Mobile", "API", "Hybrid", OTHER] },
        { id: "vibe", kind: "choice", prompt: "What visual direction fits the brand?", options: ["Minimal dark", "Clean light corporate", "Playful and colorful", "Bold high-contrast", OTHER] },
      ];
    }
    case "financial":
      return [
        { id: "segment", kind: "choice", prompt: "Which customer segment will pay?", options: ["B2C", "SMB", "Mid-Market", "Enterprise", OTHER] },
        { id: "cac", kind: "choice", prompt: "Expected cost to acquire one paying customer (USD)?", options: ["$10", "$50", "$250", "$1,000", OTHER], numericOther: true },
        { id: "profit", kind: "choice", prompt: "Minimum monthly profit that makes this worth it (USD)?", options: ["$2,000", "$10,000", "$50,000", "$100,000", OTHER], numericOther: true },
        { id: "stack", kind: "choice", prompt: "What will it run on?", options: ["Web app (Next.js + Postgres)", "Mobile app (React Native + Firebase)", "AI-heavy (LLM APIs + vector database)", "No-code tools", OTHER] },
      ];
    case "marketing":
      return [
        { id: "tone", kind: "choice", prompt: "Tone of voice for launch copy?", options: ["Professional", "Playful", "Bold", "Minimal", OTHER] },
        { id: "budget", kind: "choice", prompt: "Monthly marketing budget?", options: ["$0 - $500", "$500 - $2,000", "$2,000 - $10,000", "$10,000 - $50,000", OTHER] },
        { id: "timeline", kind: "choice", prompt: "When do you plan to launch?", options: ["In 4 weeks", "In 8 weeks", "In 3 months", "In 6 months", "Already launched", OTHER] },
      ];
  }
}

// ── Answer helpers ────────────────────────────────────────────────────

export function answerText(a: Answer | undefined): string {
  if (!a) return "";
  return a.choice === OTHER ? (a.other ?? "").trim() : a.choice;
}

export function parseMoney(text: string): number | null {
  const n = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isAnswerValid(q: McqQuestion, a: Answer | undefined): boolean {
  if (!a) return false;
  if (q.kind === "text") return a.choice.trim().length >= (q.minLength ?? 1);
  if (a.choice !== OTHER) return !!a.choice;
  const text = (a.other ?? "").trim();
  if (!text) return false;
  return q.numericOther ? parseMoney(text) !== null : true;
}

export function summarizeAnswers(questions: McqQuestion[], answers: Answers): string {
  return questions.map(q => `${q.prompt} ${answerText(answers[q.id])}`).join("\n");
}

/** Maps an answer onto a backend enum. A free-text "Other" answer can't be an
 * enum value, so it falls back to `fallback` and the text travels as a note. */
function enumAnswer<T extends string>(a: Answer | undefined, allowed: readonly T[], fallback: T, label: string, notes: string[]): T {
  const text = answerText(a);
  const hit = allowed.find(v => v.toLowerCase() === text.toLowerCase());
  if (hit) return hit;
  if (text) notes.push(`${label}: ${text}`);
  return fallback;
}

function notesField(notes: string[]): string | null {
  return notes.length ? notes.join("\n").slice(0, 2000) : null;
}

export interface Steering {
  revision_request?: string | null;
  previous_output?: unknown;
}

// ── Per-agent input builders ─────────────────────────────────────────

export function buildMarketResearchInput(a: Answers, steer: Steering = {}) {
  const loc = a.location?.choice === OTHER ? null : LOCATIONS[a.location?.choice ?? ""];
  return {
    core_idea: answerText(a.idea),
    target_industry: answerText(a.industry),
    target_location: loc ? loc.location : answerText(a.location) || "Global",
    country_code: loc?.code ?? null,
    audience_demographics: {
      segment: answerText(a.segment).slice(0, 120) || null,
      age_range: answerText(a.age).slice(0, 40) || null,
      income_band: answerText(a.income).slice(0, 60) || null,
    },
    known_competitors: [],
    ...steer,
  };
}

const VIBES: Record<string, { mode: "light" | "dark" | "auto"; palette: Record<string, string> }> = {
  "Minimal dark": { mode: "dark", palette: { primary: "#E7D296", secondary: "#A8A49C", accent: "#B9C99A", background: "#050405" } },
  "Clean light corporate": { mode: "light", palette: { primary: "#1D4ED8", secondary: "#475569", accent: "#0EA5E9", background: "#FFFFFF" } },
  "Playful and colorful": { mode: "light", palette: { primary: "#F97316", secondary: "#8B5CF6", accent: "#22C55E", background: "#FFF7ED" } },
  "Bold high-contrast": { mode: "dark", palette: { primary: "#FACC15", secondary: "#FFFFFF", accent: "#EF4444", background: "#000000" } },
};

export function buildProductStrategistInput(a: Answers, approved: Partial<AgentOutputs>, steer: Steering = {}) {
  const notes: string[] = [];
  const vibeText = answerText(a.vibe);
  const vibe = VIBES[vibeText];
  const delivery = enumAnswer(a.delivery, ["Web", "Mobile", "API", "Hybrid"] as const, "Web", "Delivery preference", notes);
  return {
    market_research: approved.market_research,
    core_feature: answerText(a.core_feature).slice(0, 1000),
    delivery_mechanism: delivery,
    visual_vibe_style: vibeText.slice(0, 200) || "Minimal dark",
    visual_vibe_mode: vibe?.mode ?? "auto",
    visual_vibe_color_palette: vibe?.palette ?? {},
    founder_notes: notesField(notes),
    ...steer,
  };
}

export function buildPricingInput(a: Answers, approved: Partial<AgentOutputs>, steer: Steering = {}) {
  const notes: string[] = [];
  const segment = enumAnswer(a.segment, ["B2C", "SMB", "Mid-Market", "Enterprise"] as const, "SMB", "Customer segment", notes);
  return {
    mvp_features: approved.product_strategist?.mvp_features,
    tech_stack_expectations: answerText(a.stack).slice(0, 1000),
    target_customer_segment: segment,
    customer_acquisition_cost: Math.min(parseMoney(answerText(a.cac)) ?? 50, 100000),
    minimum_profit_expectation: parseMoney(answerText(a.profit)) ?? 10000,
    founder_notes: notesField(notes),
    ...steer,
  };
}

function parseBudget(text: string): { min_monthly_usd: number; max_monthly_usd: number } | null {
  const nums = (text.replace(/,/g, "").match(/\d+(\.\d+)?/g) ?? []).map(Number);
  if (!nums.length) return null;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return { min_monthly_usd: nums.length > 1 ? lo : hi / 2, max_monthly_usd: hi };
}

export function buildMarketingInput(a: Answers, approved: Partial<AgentOutputs>, steer: Steering = {}) {
  const notes: string[] = [];
  const tone = enumAnswer(a.tone, ["Professional", "Playful", "Bold", "Minimal"] as const, "Professional", "Tone of voice", notes);
  const budgetText = answerText(a.budget);
  const budget = parseBudget(budgetText);
  if (!budget && budgetText) notes.push(`Marketing budget: ${budgetText}`);
  return {
    mvp_strategy: approved.product_strategist,
    pricing: approved.financial,
    tone_of_voice: tone,
    marketing_budget: budget ?? { min_monthly_usd: 250, max_monthly_usd: 1000 },
    launch_timeline: answerText(a.timeline).slice(0, 200) || "3 months from today",
    founder_notes: notesField(notes),
    ...steer,
  };
}

/** Full OrchestratorInput for the synthesize step, rebuilt from the approved intakes. */
export function buildOrchestratorIntake(ownerId: string, intake: Partial<Record<SubAgentId, Answers>>, approved: Partial<AgentOutputs>) {
  const mr = buildMarketResearchInput(intake.market_research ?? {});
  const ps = buildProductStrategistInput(intake.product_strategist ?? {}, approved);
  const pr = buildPricingInput(intake.financial ?? {}, approved);
  const mk = buildMarketingInput(intake.marketing ?? {}, approved);
  return {
    owner_id: ownerId,
    market_research: mr,
    core_feature: ps.core_feature.length >= 5 ? ps.core_feature : mr.core_idea,
    delivery_mechanism: ps.delivery_mechanism,
    visual_vibe_style: ps.visual_vibe_style,
    visual_vibe_mode: ps.visual_vibe_mode,
    visual_vibe_color_palette: ps.visual_vibe_color_palette,
    tech_stack_expectations: pr.tech_stack_expectations.length >= 2 ? pr.tech_stack_expectations : "Modern web stack",
    target_customer_segment: pr.target_customer_segment,
    customer_acquisition_cost: pr.customer_acquisition_cost,
    minimum_profit_expectation: pr.minimum_profit_expectation,
    tone_of_voice: mk.tone_of_voice,
    marketing_budget: mk.marketing_budget,
    launch_timeline: mk.launch_timeline.length >= 2 ? mk.launch_timeline : "3 months from today",
  };
}
