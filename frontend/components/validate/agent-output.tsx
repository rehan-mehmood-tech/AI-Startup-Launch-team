'use client'

import type {
  MarketResearchOutput,
  MarketingOutput,
  PricingOutput,
  ProductStrategyOutput,
  SubAgentId,
  AgentOutputs,
} from '@/lib/hitl/types'

/* Document-style renderers for each sub-agent's output. Plain typography,
   hairline rules, no cards and no motion — shared by the chat view and the
   final report so what the founder approved is exactly what the report shows. */

const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-7 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E7D296] first:mt-0">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] leading-[1.7] text-[#D6D2C9]">{children}</p>
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  if (!items.length) return <P>None reported.</P>
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-[1.65] text-[#D6D2C9] marker:text-[#6E6B64]">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  )
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-[#2A2722] border-y border-[#2A2722]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[200px_1fr] sm:gap-4">
          <dt className="text-[13px] text-[#8C887F]">{k}</dt>
          <dd className="break-words text-[14px] text-[#F5F3EF]">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function SourceLink({ url }: { url: string }) {
  let host = url
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    /* keep raw */
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#C9B98A] underline decoration-[#43443E] underline-offset-2 hover:text-[#E7D296]">
      {host}
    </a>
  )
}

export function MarketResearchSection({ o }: { o: MarketResearchOutput }) {
  return (
    <div>
      <H3>Market trends</H3>
      <P>{o.market_trends.summary}</P>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[13px] text-[#8C887F]">Tailwinds</p>
          <Bullets items={o.market_trends.tailwinds} />
        </div>
        <div>
          <p className="mb-1.5 text-[13px] text-[#8C887F]">Headwinds</p>
          <Bullets items={o.market_trends.headwinds} />
        </div>
      </div>

      <H3>Market size</H3>
      <Rows rows={[['TAM', o.market_size_estimate.tam], ['SAM', o.market_size_estimate.sam], ['SOM', o.market_size_estimate.som], ['Method', o.market_size_estimate.methodology_note], ['Data confidence', o.data_confidence]]} />

      <H3>Competitors</H3>
      <div className="flex flex-col divide-y divide-[#2A2722] border-y border-[#2A2722]">
        {o.competitor_analysis.map(c => (
          <div key={c.name + c.source_url} className="py-3">
            <p className="break-words text-[14px] font-medium text-[#F5F3EF]">
              {c.name} <span className="ml-1 text-[12px] font-normal text-[#8C887F]">{c.type}{c.pricing_snapshot ? ` · ${c.pricing_snapshot}` : ''}</span>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#B8B4AB]"><span className="text-[#8C887F]">Strengths:</span> {c.strengths.join('; ') || '—'}</p>
            <p className="text-[13px] leading-relaxed text-[#B8B4AB]"><span className="text-[#8C887F]">Weaknesses:</span> {c.weaknesses.join('; ') || '—'}</p>
            <p className="mt-1 text-[12px]"><SourceLink url={c.source_url} /></p>
          </div>
        ))}
      </div>

      <H3>Customer pain points</H3>
      <Bullets items={o.customer_pain_points.map(p => (
        <span key={p.pain_point}>{p.pain_point} <span className="text-[12px] text-[#8C887F]">({p.frequency_signal} signal · <SourceLink url={p.evidence_source_url} />)</span></span>
      ))} />
    </div>
  )
}

export function ProductStrategySection({ o }: { o: ProductStrategyOutput }) {
  const v = o.ui_vibe_specification
  return (
    <div>
      <H3>Value proposition</H3>
      <P>{o.value_proposition}</P>
      <H3>Pain point anchor</H3>
      <P>{o.core_pain_point_anchor}</P>
      <H3>MVP must-have features</H3>
      <Bullets items={o.mvp_features.must_have.map(f => <span key={f.feature}><span className="text-[#F5F3EF]">{f.feature}</span> — {f.justification}</span>)} />
      {o.mvp_features.nice_to_have.length > 0 && (
        <>
          <H3>Nice to have</H3>
          <Bullets items={o.mvp_features.nice_to_have.map(f => <span key={f.feature}><span className="text-[#F5F3EF]">{f.feature}</span> — {f.rationale}</span>)} />
        </>
      )}
      <H3>UI direction</H3>
      <Rows rows={[
        ['Style', `${v.style} (${v.mode})`],
        ['Palette', (
          <span className="flex flex-wrap items-center gap-3">
            {Object.entries(v.color_palette).map(([k, hex]) => (
              <span key={k} className="flex items-center gap-1.5 text-[13px]">
                <span className="inline-block size-3.5 rounded-sm border border-[#43443E]" style={{ backgroundColor: hex }} />
                {k} {hex}
              </span>
            ))}
          </span>
        )],
        ['Fonts', v.font_pairing_suggestion],
        ['Design tokens', v.design_tokens_note],
      ]} />
    </div>
  )
}

export function PricingSection({ o }: { o: PricingOutput }) {
  const e = o.estimated_unit_economics
  const t = o.pricing_tiers
  const r = o.roi_projection
  return (
    <div>
      <H3>Unit economics</H3>
      <Rows rows={[
        ['Per-user COGS', usd(e.per_user_cogs)],
        ['Estimated LTV', usd(e.estimated_ltv)],
        ['Estimated CAC', usd(e.estimated_cac)],
        ['LTV : CAC', `${e.target_ltv_cac_ratio.toFixed(2)} : 1 — ${e.ltv_cac_rule_passed ? 'passes' : 'fails'} the 3:1 rule`],
      ]} />
      <H3>Pricing tiers</H3>
      <Rows rows={[
        [`Starter · ${usd(t.starter.price)} / ${t.starter.billing_cycle}`, t.starter.included_features.join('; ')],
        [`Pro · ${usd(t.pro.price)} / ${t.pro.billing_cycle}`, `${t.pro.included_features.join('; ')} (target gross margin ${t.pro.target_gross_margin_pct}%)`],
        [`Enterprise · ${t.enterprise.pricing_model === 'custom_quote' ? 'custom quote' : 'flat rate'}`, t.enterprise.included_features.join('; ')],
      ]} />
      <H3>ROI projection</H3>
      <Rows rows={[
        ['Projected yield', `${r.projected_yield_pct}%`],
        ['Months to profit target', `${r.months_to_min_profit_target}`],
        ['Confidence range', `${r.confidence_range.low}% – ${r.confidence_range.high}%`],
      ]} />
    </div>
  )
}

export function MarketingSection({ o }: { o: MarketingOutput }) {
  let payload = o.automation_payload.payload_json_stringified
  try {
    payload = JSON.stringify(JSON.parse(payload), null, 2)
  } catch {
    /* show raw */
  }
  return (
    <div>
      <H3>Recommended channels</H3>
      <div className="flex flex-col divide-y divide-[#2A2722] border-y border-[#2A2722]">
        {[...o.recommended_channels].sort((a, b) => a.priority_rank - b.priority_rank).map(c => (
          <div key={c.channel} className="py-3">
            <p className="text-[14px] font-medium text-[#F5F3EF]">
              #{c.priority_rank} {c.channel} <span className="ml-1 text-[12px] font-normal text-[#8C887F]">~{usd(c.estimated_monthly_cost)}/mo</span>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#B8B4AB]">{c.strategic_reasoning}</p>
          </div>
        ))}
      </div>

      <H3>Brand taglines</H3>
      <Bullets items={o.brand_taglines.map(t => `“${t}”`)} />

      <H3>Campaign posts &amp; ad-creative prompts</H3>
      <div className="flex flex-col divide-y divide-[#2A2722] border-y border-[#2A2722]">
        {o.sample_campaign_posts.map(p => (
          <div key={p.channel_name} className="flex flex-col gap-2 py-3">
            <p className="text-[13px] font-medium text-[#F5F3EF]">{p.channel_name}</p>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#D6D2C9]">{p.post_content}</p>
            <p className="text-[12px] text-[#8C887F]">Visual asset prompt</p>
            <pre className="scroll-x whitespace-pre-wrap break-words rounded-md bg-[#0A0908] p-3 font-mono text-[12px] leading-relaxed text-[#C9B98A]">{p.visual_asset_prompt}</pre>
          </div>
        ))}
      </div>

      <H3>Automation payload (v{o.automation_payload.format_version})</H3>
      <pre className="scroll-x max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-[#0A0908] p-3 font-mono text-[11px] leading-relaxed text-[#A8A49C]">{payload}</pre>
    </div>
  )
}

export function AgentOutputView({ agent, output }: { agent: SubAgentId; output: AgentOutputs[SubAgentId] }) {
  switch (agent) {
    case 'market_research':
      return <MarketResearchSection o={output as MarketResearchOutput} />
    case 'product_strategist':
      return <ProductStrategySection o={output as ProductStrategyOutput} />
    case 'financial':
      return <PricingSection o={output as PricingOutput} />
    case 'marketing':
      return <MarketingSection o={output as MarketingOutput} />
  }
}
