import type { ReportBundle } from "@/lib/hitl/types";

/**
 * White-background PDF of a finished report. jsPDF is loaded on demand so it
 * never ships in the initial bundle. The built-in Helvetica font only covers
 * WinAnsi, so text is normalized first (LLM output often contains non-breaking
 * hyphens, narrow spaces, etc. that would otherwise render as garbage).
 */

function clean(text: unknown): string {
  return String(text ?? "")
    .replace(/[‐-―−]/g, "-")
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/…/g, "...")
    .replace(/[  -​  　]/g, " ")
    .replace(/•/g, "-")
    .replace(/[←-⇿]/g, "->")
    .replace(/[^\x09\x0A\x0D\x20-\x7E¡-ÿ]/g, "");
}

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export async function downloadReportPdf(report: ReportBundle, authorName?: string | null): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;
  let y = 0;

  const ink = () => doc.setTextColor(28, 26, 23);
  const muted = () => doc.setTextColor(110, 107, 100);
  const gold = () => doc.setTextColor(150, 118, 40);

  function header() {
    // Platform mark: gold rounded square with a spark.
    doc.setFillColor(231, 210, 150);
    doc.roundedRect(M, 30, 18, 18, 4, 4, "F");
    doc.setFillColor(28, 26, 23);
    doc.triangle(M + 9, 34, M + 12, 39, M + 6, 39, "F");
    doc.triangle(M + 9, 44, M + 12, 39, M + 6, 39, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    ink();
    doc.text("AI Startup Launch Team", M + 26, 43);
    if (authorName) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      muted();
      doc.text(clean(authorName), W - M, 43, { align: "right" });
    }
    doc.setDrawColor(225, 222, 215);
    doc.line(M, 58, W - M, 58);
    y = 84;
  }

  function ensure(space: number) {
    if (y + space > H - 48) {
      doc.addPage();
      header();
    }
  }

  function para(text: unknown, size = 10, style: "normal" | "bold" = "normal", color = ink, indent = 0) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    color();
    const lines = doc.splitTextToSize(clean(text), CW - indent) as string[];
    const lh = size * 1.45;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, M + indent, y);
      y += lh;
    }
  }

  function gap(n = 8) {
    y += n;
  }

  function sectionTitle(text: string) {
    ensure(48);
    gap(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    ink();
    doc.text(clean(text), M, y);
    y += 8;
    doc.setDrawColor(231, 210, 150);
    doc.setLineWidth(1.2);
    doc.line(M, y, M + 40, y);
    doc.setLineWidth(0.5);
    y += 18;
  }

  function sub(text: string) {
    ensure(30);
    gap(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    gold();
    doc.text(clean(text).toUpperCase(), M, y);
    y += 14;
  }

  function bullets(items: unknown[]) {
    if (!items.length) return para("None reported.", 10, "normal", muted);
    for (const it of items) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      ink();
      ensure(14);
      doc.text("-", M + 4, y);
      para(it, 10, "normal", ink, 14);
      gap(2);
    }
  }

  function kv(key: string, value: unknown) {
    para(`${key}: ${clean(value)}`, 10);
  }

  const { outputs: o, orchestrator: orc } = report;

  header();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  muted();
  doc.text(`STARTUP VALIDATION REPORT · ${new Date(report.generated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`.replace("·", "-"), M, y);
  y += 22;
  para(report.title, 20, "bold");
  gap(4);
  para(`Verdict: ${orc.validation_status}`, 11, "bold", gold);
  gap(6);

  // Agent 1
  const mr = o.market_research;
  sectionTitle("1. Market Research");
  sub("Market trends");
  para(mr.market_trends.summary);
  gap(4);
  para("Tailwinds", 10, "bold");
  bullets(mr.market_trends.tailwinds);
  para("Headwinds", 10, "bold");
  bullets(mr.market_trends.headwinds);
  sub("Market size");
  kv("TAM", mr.market_size_estimate.tam);
  kv("SAM", mr.market_size_estimate.sam);
  kv("SOM", mr.market_size_estimate.som);
  kv("Method", mr.market_size_estimate.methodology_note);
  kv("Data confidence", mr.data_confidence);
  sub("Competitors");
  for (const c of mr.competitor_analysis) {
    para(`${c.name} (${c.type})${c.pricing_snapshot ? ` - ${c.pricing_snapshot}` : ""}`, 10, "bold");
    para(`Strengths: ${c.strengths.join("; ") || "-"}`, 9.5, "normal", ink, 10);
    para(`Weaknesses: ${c.weaknesses.join("; ") || "-"}`, 9.5, "normal", ink, 10);
    para(c.source_url, 8.5, "normal", muted, 10);
    gap(4);
  }
  sub("Customer pain points");
  bullets(mr.customer_pain_points.map(p => `${p.pain_point} (${p.frequency_signal} signal)`));

  // Agent 2
  const ps = o.product_strategist;
  sectionTitle("2. Product Strategy");
  sub("Value proposition");
  para(ps.value_proposition);
  sub("Pain point anchor");
  para(ps.core_pain_point_anchor);
  sub("MVP must-have features");
  bullets(ps.mvp_features.must_have.map(f => `${f.feature} - ${f.justification}`));
  if (ps.mvp_features.nice_to_have.length) {
    sub("Nice to have");
    bullets(ps.mvp_features.nice_to_have.map(f => `${f.feature} - ${f.rationale}`));
  }
  sub("UI direction");
  kv("Style", `${ps.ui_vibe_specification.style} (${ps.ui_vibe_specification.mode})`);
  kv("Palette", Object.entries(ps.ui_vibe_specification.color_palette).map(([k, v]) => `${k} ${v}`).join(", "));
  kv("Fonts", ps.ui_vibe_specification.font_pairing_suggestion);
  kv("Design tokens", ps.ui_vibe_specification.design_tokens_note);

  // Agent 3
  const pr = o.financial;
  const e = pr.estimated_unit_economics;
  sectionTitle("3. Financial & Business Model");
  sub("Unit economics");
  kv("Per-user COGS", usd(e.per_user_cogs));
  kv("Estimated LTV", usd(e.estimated_ltv));
  kv("Estimated CAC", usd(e.estimated_cac));
  kv("LTV:CAC", `${e.target_ltv_cac_ratio.toFixed(2)} : 1 (${e.ltv_cac_rule_passed ? "passes" : "fails"} the 3:1 rule)`);
  sub("Pricing tiers");
  const t = pr.pricing_tiers;
  para(`Starter - ${usd(t.starter.price)} / ${t.starter.billing_cycle}`, 10, "bold");
  para(t.starter.included_features.join("; "), 9.5, "normal", ink, 10);
  para(`Pro - ${usd(t.pro.price)} / ${t.pro.billing_cycle} (target margin ${t.pro.target_gross_margin_pct}%)`, 10, "bold");
  para(t.pro.included_features.join("; "), 9.5, "normal", ink, 10);
  para(`Enterprise - ${t.enterprise.pricing_model === "custom_quote" ? "custom quote" : "flat rate"}`, 10, "bold");
  para(t.enterprise.included_features.join("; "), 9.5, "normal", ink, 10);
  sub("ROI projection");
  kv("Projected yield", `${pr.roi_projection.projected_yield_pct}%`);
  kv("Months to profit target", pr.roi_projection.months_to_min_profit_target);
  kv("Confidence range", `${pr.roi_projection.confidence_range.low}% to ${pr.roi_projection.confidence_range.high}%`);

  // Agent 4
  const mk = o.marketing;
  sectionTitle("4. Go-To-Market & Marketing");
  sub("Recommended channels");
  for (const c of [...mk.recommended_channels].sort((a, b) => a.priority_rank - b.priority_rank)) {
    para(`#${c.priority_rank} ${c.channel} - approx. ${usd(c.estimated_monthly_cost)}/mo`, 10, "bold");
    para(c.strategic_reasoning, 9.5, "normal", ink, 10);
    gap(3);
  }
  sub("Brand taglines");
  bullets(mk.brand_taglines.map(x => `"${x}"`));
  sub("Campaign posts & ad-creative prompts");
  for (const p of mk.sample_campaign_posts) {
    para(p.channel_name, 10, "bold");
    para(p.post_content, 9.5, "normal", ink, 10);
    gap(2);
    para("Visual asset prompt:", 9, "bold", muted, 10);
    para(p.visual_asset_prompt, 9, "normal", gold, 10);
    gap(6);
  }

  // Orchestrator — closing section
  sectionTitle("Orchestrator Verdict & Recommendations");
  sub("Final verdict");
  para(orc.validation_status, 12, "bold", gold);
  sub("Executive summary");
  para(orc.executive_summary);
  if (orc.validation_reasoning.length) {
    sub("Reasoning signals");
    bullets(orc.validation_reasoning.map(s => `${s.signal} (${s.source_agent}, ${s.weight} weight)`));
  }
  if (orc.strategic_recommendations?.length) {
    sub("Strategic recommendations");
    bullets(orc.strategic_recommendations);
  }
  if (orc.failure_case_study.length) {
    sub("Comparable failures");
    bullets(orc.failure_case_study.map(f => `${f.company}: ${f.collapse_reason}`));
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    muted();
    doc.text(`${i} / ${pages}`, W - M, H - 24, { align: "right" });
  }

  const slug = clean(report.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "report";
  doc.save(`${slug}-validation-report.pdf`);
}
