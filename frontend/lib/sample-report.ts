import type { ReportBundle } from "@/lib/hitl/types";

/** Illustrative data for the navbar's "Sample Report" PDF. Every company,
 * figure and URL below is fictional and exists only to show the format. */

export const SAMPLE_AUTHOR = "Sample User";

export const SAMPLE_INTRO =
  "This is a sample report. AI Startup Launch Team validates a startup idea with five AI agents: Market Research, " +
  "Product Strategy, Financial & Business Model, Go-To-Market & Marketing, and an Orchestrator that combines them. " +
  "The founder reviews, challenges and approves each agent's output before the next one starts. The idea, companies " +
  "and numbers below are fictional and only illustrate the format.";

export const SAMPLE_REPORT: ReportBundle = {
  title: "MealMap - AI meal planning for busy families on a budget",
  generated_at: "2026-09-01T10:00:00.000Z",
  outputs: {
    market_research: {
      market_trends: {
        summary:
          "Demand for grocery-budget and meal-planning tools is rising as food inflation stays above general inflation; families increasingly plan meals around weekly store deals.",
        tailwinds: [
          "Search interest for 'cheap family meal plan' up 38% year over year",
          "Grocery retailers now publish weekly deal data through public APIs",
          "Households using at least one budgeting app grew to 46%",
        ],
        headwinds: [
          "Recipe content is abundant and free, which lowers willingness to pay",
          "Meal-kit services have trained users to expect high marketing spend and discounts",
        ],
      },
      market_size_estimate: {
        tam: "$4.1B global digital meal-planning and recipe subscription market",
        sam: "$620M English-speaking families with children using grocery apps",
        som: "$6M reachable in 3 years via content and grocery-partner channels",
        methodology_note: "Top-down from category reports, narrowed by household and app-usage share; illustrative only.",
      },
      competitor_analysis: [
        {
          name: "PlateWise (sample)",
          type: "direct",
          strengths: ["Large recipe library", "Polished mobile app"],
          weaknesses: ["Plans ignore local grocery prices", "Premium tier required for shopping lists"],
          pricing_snapshot: "$8.99/month",
          source_url: "https://example.com/platewise-pricing",
        },
        {
          name: "BudgetBite (sample)",
          type: "direct",
          strengths: ["Strong budgeting focus"],
          weaknesses: ["Manual price entry", "Limited recipe variety"],
          pricing_snapshot: "Free with ads",
          source_url: "https://example.com/budgetbite-review",
        },
        {
          name: "Generic recipe sites",
          type: "indirect",
          strengths: ["Free", "Huge SEO footprint"],
          weaknesses: ["No planning or cost optimization"],
          pricing_snapshot: null,
          source_url: "https://example.com/recipe-market-overview",
        },
      ],
      customer_pain_points: [
        { pain_point: "Meal plans don't account for what is actually on sale this week", frequency_signal: "high", evidence_source_url: "https://example.com/platewise-pricing" },
        { pain_point: "Planning a week of meals takes 1-2 hours", frequency_signal: "high", evidence_source_url: "https://example.com/budgetbite-review" },
        { pain_point: "Kids reject new recipes, causing food waste", frequency_signal: "medium", evidence_source_url: "https://example.com/recipe-market-overview" },
      ],
      data_confidence: "medium",
      raw_sources: [
        "https://example.com/platewise-pricing",
        "https://example.com/budgetbite-review",
        "https://example.com/recipe-market-overview",
      ],
    },
    product_strategist: {
      core_pain_point_anchor: "Meal plans don't account for what is actually on sale this week",
      value_proposition:
        "MealMap builds your family's weekly meal plan around this week's deals at your own grocery store, so you spend 20 minutes planning instead of two hours.",
      mvp_features: {
        must_have: [
          { feature: "Deal-aware weekly plan generator", justification: "Directly solves the core pain of plans ignoring local prices." },
          { feature: "Auto-built shopping list with cost total", justification: "Turns the plan into a single, budgeted store trip." },
          { feature: "Picky-eater preferences", justification: "Reduces food waste from rejected meals." },
        ],
        nice_to_have: [
          { feature: "Leftover remix suggestions", rationale: "Extra savings, but not needed to prove the core value." },
          { feature: "Grocery delivery checkout", rationale: "Requires partner integrations after launch." },
        ],
      },
      ui_vibe_specification: {
        style: "Warm, friendly and uncluttered",
        mode: "light",
        color_palette: { primary: "#16A34A", secondary: "#334155", accent: "#F59E0B", background: "#FFFFFF" },
        font_pairing_suggestion: "Inter for UI, Fraunces for headings",
        design_tokens_note: "8px spacing grid, 12px card radius, green reserved for savings indicators.",
      },
    },
    financial: {
      estimated_unit_economics: {
        per_user_cogs: 0.62,
        estimated_ltv: 71.4,
        estimated_cac: 18,
        target_ltv_cac_ratio: 3.97,
        ltv_cac_rule_passed: true,
      },
      pricing_tiers: {
        starter: { price: 0, billing_cycle: "monthly", included_features: ["Deal-aware weekly plan generator"] },
        pro: {
          price: 6.99,
          billing_cycle: "monthly",
          included_features: ["Deal-aware weekly plan generator", "Auto-built shopping list with cost total", "Picky-eater preferences"],
          target_gross_margin_pct: 68,
        },
        enterprise: {
          pricing_model: "custom_quote",
          included_features: ["Everything in Pro", "Leftover remix suggestions", "Grocery delivery checkout"],
        },
      },
      roi_projection: { projected_yield_pct: 142, months_to_min_profit_target: 9.5, confidence_range: { low: 88, high: 190 } },
    },
    marketing: {
      recommended_channels: [
        { channel: "Instagram", priority_rank: 1, strategic_reasoning: "Parents discover recipes and budgeting tips visually; Reels showing a real weekly shop perform well.", estimated_monthly_cost: 600 },
        { channel: "Pinterest", priority_rank: 2, strategic_reasoning: "Meal-plan pins have long search shelf-life and low cost per click.", estimated_monthly_cost: 250 },
        { channel: "Reddit", priority_rank: 3, strategic_reasoning: "Budget-cooking communities reward genuinely useful, non-salesy tools.", estimated_monthly_cost: 0 },
      ],
      brand_taglines: ["This week's deals, tonight's dinner.", "Plan less. Save more. Eat together.", "Your store's sales, planned for you."],
      sample_campaign_posts: [
        {
          channel_name: "Instagram",
          post_content:
            "We planned a family of four's week around this week's sales at one local store. Total: $96. Planning time: 18 minutes. MealMap builds the plan and the shopping list for you. Join the waitlist - link in bio.",
          visual_asset_prompt:
            "/adcreative 1080x1350 4:5 Instagram feed ad. A parent at a sunlit kitchen counter unpacking one grocery bag while a phone propped against a fruit bowl shows MealMap's weekly plan with a green '$96 this week' total. Palette: #FFFFFF background, #16A34A savings highlights, #F59E0B accent on the price tag. Headline overlay \"Plan less. Save more.\" top-left in Fraunces bold with generous margins. Soft window light, 35mm lens, shallow depth of field, negative space on the right. Avoid: stock-photo smiles, cluttered UI, extra text, watermarks.",
        },
        {
          channel_name: "Pinterest",
          post_content: "A $96 family meal plan built around this week's grocery deals: 7 dinners, 1 shopping list, zero guesswork. Save this pin and get your own plan with MealMap.",
          visual_asset_prompt:
            "/adcreative 1000x1500 2:3 Pinterest pin. Flat-lay of seven labelled dinner containers arranged in a grid on a white marble surface, a printed shopping list with circled prices beside them. Palette: #FFFFFF, #16A34A labels, #334155 text. Headline \"7 dinners for $96\" in Fraunces at the top third. Even overhead softbox lighting, crisp focus. Avoid: blurry food, dark shadows, extra logos.",
        },
        {
          channel_name: "Reddit",
          post_content:
            "I got tired of meal plans that ignore what's actually on sale, so I'm building a tool that plans around your store's weekly deals. Happy to share the plan it made for my family this week and hear what would make it useful for you.",
          visual_asset_prompt:
            "/adcreative 1200x628 simple screenshot-style image. A clean MealMap web view showing a weekly plan table next to a store-deals column, with the savings total highlighted in #16A34A. Neutral #FFFFFF background, #334155 text, no marketing headline. Flat, honest product-screenshot style. Avoid: hype text, stock photos, emojis.",
        },
      ],
      automation_payload: {
        format_version: "1.0",
        payload_json_stringified: "{\"sample\":true}",
        webhook_ready: true,
      },
    },
  },
  orchestrator: {
    executive_summary:
      "Verdict: Green - LTV:CAC of 3.97 clears the 3:1 benchmark with a 68% Pro margin.\n" +
      "Biggest risk: medium data confidence and free recipe alternatives may suppress conversion to the $6.99 Pro tier.\n" +
      "Next move: validate deal-aware plans with 30 families before building grocery integrations.",
    validation_status: "Green",
    validation_reasoning: [
      { signal: "Unit economics pass the 3:1 LTV:CAC rule at 3.97.", source_agent: "pricing", weight: "high" },
      { signal: "The core pain point appears with a high frequency signal across sources.", source_agent: "market_research", weight: "medium" },
      { signal: "Planned channel spend of $850/month fits the stated budget.", source_agent: "marketing", weight: "low" },
    ],
    low_information_warning: { triggered: false, affected_fields: [], confidence_penalty: 0 },
    failure_case_study: [],
    compiled_dashboard: { market_research: {}, product_strategy: {}, pricing: {}, marketing: {} },
    verified_resources: [],
    strategic_recommendations: [
      "Run a two-week concierge test with 30 families to confirm deal-aware plans cut planning time.",
      "Launch with one regional grocery chain's deal data before expanding coverage.",
      "Lead Instagram creative with real weekly totals rather than generic recipe imagery.",
      "Track free-to-Pro conversion weekly; revisit the $6.99 price if it stays below 4%.",
    ],
  },
};
