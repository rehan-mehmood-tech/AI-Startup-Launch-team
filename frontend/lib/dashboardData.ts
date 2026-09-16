import type { DashboardData } from '@/components/screens/Dashboard'
import type { OrchestratorOutput, ValidationStatus } from '@/lib/types'

// Status colours come straight from the design system spec
// (status/success, status/warning, status/danger).
const VERDICT: Record<ValidationStatus, { color: string; glow: string; border: string; suffix: string }> = {
  Green: { color: '#B9C99A', glow: 'rgba(185,201,154,0.14)', border: 'rgba(185,201,154,0.20)', suffix: '— Proceed' },
  Amber: { color: '#D9B36C', glow: 'rgba(217,179,108,0.14)', border: 'rgba(217,179,108,0.20)', suffix: '— Proceed with Caution' },
  Red: { color: '#C97A63', glow: 'rgba(201,122,99,0.14)', border: 'rgba(201,122,99,0.20)', suffix: '— Stop and Rethink' },
}

const SIGNAL_COLOR: Record<string, string> = { high: '#B9C99A', medium: '#D9B36C', low: '#C97A63' }

function rec(v: unknown): Record<string, any> {
  return (v && typeof v === 'object' ? v : {}) as Record<string, any>
}

function unavailable(stage: Record<string, any>): boolean {
  return stage.status === 'skipped' || stage.status === 'unavailable'
}

function clamp(text: string, max = 240): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function toDashboardData(output: OrchestratorOutput): DashboardData {
  const v = VERDICT[output.validation_status]
  const mr = rec(output.compiled_dashboard.market_research)
  const ps = rec(output.compiled_dashboard.product_strategy)
  const pr = rec(output.compiled_dashboard.pricing)
  const mk = rec(output.compiled_dashboard.marketing)

  // 01 — Market Research
  const trends = rec(mr.market_trends)
  const competitorCount = Array.isArray(mr.competitor_analysis) ? mr.competitor_analysis.length : 0
  const confidence = (mr.data_confidence as string) ?? 'low'
  const marketCard = unavailable(mr)
    ? { title: 'Market Research unavailable', body: 'This agent did not return a result for this run.', status: 'Unavailable', statusColor: '#C97A63', confidence: '—' }
    : {
        title: `Competitive Landscape: ${competitorCount} tracked`,
        body: clamp(trends.summary ?? 'No trend summary returned.'),
        status: `${confidence[0]?.toUpperCase()}${confidence.slice(1)} confidence`,
        statusColor: SIGNAL_COLOR[confidence] ?? '#A8A49C',
        confidence: confidence === 'high' ? '85%' : confidence === 'medium' ? '65%' : '40%',
      }

  // 02 — Product Focus
  const mvp = rec(ps.mvp_features)
  const mustHave = Array.isArray(mvp.must_have) ? mvp.must_have.length : 0
  const productCard = unavailable(ps)
    ? { title: 'Product Focus unavailable', body: 'This agent did not return a result for this run.', status: 'Unavailable', statusColor: '#C97A63', confidence: '—' }
    : {
        title: `MVP scope: ${mustHave} must-have ${mustHave === 1 ? 'feature' : 'features'}`,
        body: clamp(ps.value_proposition ?? 'No value proposition returned.'),
        status: ps.core_pain_point_anchor ? 'Anchored' : 'Needs Clarity',
        statusColor: ps.core_pain_point_anchor ? '#B9C99A' : '#A8A49C',
        confidence: '—',
      }

  // 03 — Unit Economics
  const econ = rec(pr.estimated_unit_economics)
  const passed = econ.ltv_cac_rule_passed === true
  const pricingCard = unavailable(pr)
    ? { title: 'Unit Economics unavailable', body: 'This agent did not return a result for this run.', status: 'Unavailable', statusColor: '#C97A63', confidence: '—' }
    : {
        title: `LTV:CAC ${econ.target_ltv_cac_ratio ?? '—'}x ${passed ? '(Healthy)' : '(Danger)'}`,
        body: clamp(
          `Per-user COGS $${econ.per_user_cogs ?? '—'} against estimated LTV $${econ.estimated_ltv ?? '—'} at a CAC of $${econ.estimated_cac ?? '—'}. ${
            passed ? 'Clears the 3:1 SaaS floor.' : 'Falls below the 3:1 floor — structural risk.'
          }`
        ),
        status: passed ? 'Healthy' : 'High Risk',
        statusColor: passed ? '#B9C99A' : '#C97A63',
        confidence: '—',
      }

  // 04 — Go-To-Market
  const channels = Array.isArray(mk.recommended_channels) ? mk.recommended_channels : []
  const top = rec(channels[0])
  const marketingCard = unavailable(mk)
    ? { title: 'Go-To-Market unavailable', body: 'This agent did not return a result for this run.', status: 'Unavailable', statusColor: '#C97A63', confidence: '—' }
    : {
        title: `Lead channel: ${top.channel ?? '—'}`,
        body: clamp(top.strategic_reasoning ?? 'No channel reasoning returned.'),
        status: `${channels.length} channels`,
        statusColor: '#D9B36C',
        confidence: '—',
      }

  const failure = output.failure_case_study[0]

  return {
    verdictWord: output.validation_status,
    verdictSuffix: v.suffix,
    verdictColor: v.color,
    verdictGlow: v.glow,
    verdictBorder: v.border,
    summary: output.executive_summary,
    failureCase: failure
      ? { company: failure.company, reason: failure.collapse_reason, pattern: failure.matched_risk_pattern }
      : null,
    cards: [marketCard, productCard, pricingCard, marketingCard],
    citations: output.verified_resources.map((r, i) => ({
      n: String(i + 1).padStart(2, '0'),
      title: r.description || r.url,
      url: r.url,
    })),
  }
}
