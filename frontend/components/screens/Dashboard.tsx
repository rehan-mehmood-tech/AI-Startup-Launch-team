'use client'

import { AlertTriangle, History, ChevronRight, ExternalLink, FileDown, RotateCcw } from 'lucide-react'
import type { Screen } from '@/lib/navigation'

function NumericTag({ n, label }: { n: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-[#6E6B64] tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
        {n} /
      </span>
      {label && <span className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em]">{label}</span>}
    </div>
  )
}

const resultCards = [
  {
    n: '01', category: 'Market Research',
    title: 'Competitive Landscape: Amber',
    body: '14 direct competitors identified; 3 VC-backed with >$40M raised. TAM ~$8.4B. Ingredient-level personalization gap is real but contested by Noom and Cronometer at lower price points.',
    status: 'Amber Risk', statusColor: '#D9B36C', confidence: '74%', confidenceLevel: 'medium',
    motif: (
      <>
        <line x1="12" y1="90" x2="12" y2="40" stroke="#E7D296" strokeWidth="2" />
        <line x1="36" y1="90" x2="36" y2="15" stroke="#E7D296" strokeWidth="2" />
        <line x1="60" y1="90" x2="60" y2="55" stroke="#E7D296" strokeWidth="2" />
        <line x1="84" y1="90" x2="84" y2="28" stroke="#E7D296" strokeWidth="2" />
        <line x1="108" y1="90" x2="108" y2="68" stroke="#E7D296" strokeWidth="2" />
        <line x1="6" y1="93" x2="114" y2="93" stroke="#E7D296" strokeWidth="1.2" />
      </>
    ),
  },
  {
    n: '02', category: 'Product Focus',
    title: 'Differentiation Depth: Low',
    body: "Core JTBD maps to 3 existing solutions at price parity. Unique value claim requires a proprietary dietary-restriction data moat that doesn't exist in the current MVP scope.",
    status: 'Needs Clarity', statusColor: '#A8A49C', confidence: '81%', confidenceLevel: 'medium',
    motif: (
      <>
        <circle cx="50" cy="50" r="34" stroke="#E7D296" strokeWidth="1.5" />
        <circle cx="82" cy="50" r="34" stroke="#E7D296" strokeWidth="1.5" />
        <line x1="66" y1="18" x2="66" y2="82" stroke="#E7D296" strokeWidth="0.8" strokeDasharray="4 3" />
      </>
    ),
  },
  {
    n: '03', category: 'Unit Economics',
    title: 'CAC/LTV Ratio: 1:1.8 (Danger)',
    body: 'Blended CAC of $62 against 6-month LTV of $114 at current churn. Payback period of 8.2 months exceeds median. Requires 40% churn reduction before the model is defensible.',
    status: 'High Risk', statusColor: '#C97A63', confidence: '88%', confidenceLevel: 'high',
    motif: (
      <>
        <polyline points="8,85 28,70 48,75 68,42 88,52 108,18 118,22" stroke="#E7D296" strokeWidth="1.8" fill="none" />
        <line x1="8" y1="88" x2="118" y2="88" stroke="#E7D296" strokeWidth="1" />
        <line x1="8" y1="10" x2="8" y2="88" stroke="#E7D296" strokeWidth="1" />
      </>
    ),
  },
  {
    n: '04', category: 'Go-To-Market',
    title: 'Distribution Strategy: Narrow',
    body: 'Content/SEO channel scores 6.2/10 — achievable but slow. Paid acquisition unfeasible at current unit economics. Influencer-led community path has precedent (Forks Over Knives playbook).',
    status: 'Amber Risk', statusColor: '#D9B36C', confidence: '69%', confidenceLevel: 'low',
    motif: (
      <>
        <circle cx="64" cy="50" r="8" stroke="#E7D296" strokeWidth="1.5" />
        <circle cx="28" cy="25" r="5" stroke="#E7D296" strokeWidth="1.2" />
        <circle cx="100" cy="25" r="5" stroke="#E7D296" strokeWidth="1.2" />
        <circle cx="22" cy="72" r="5" stroke="#E7D296" strokeWidth="1.2" />
        <circle cx="106" cy="72" r="5" stroke="#E7D296" strokeWidth="1.2" />
        <line x1="56" y1="44" x2="33" y2="29" stroke="#E7D296" strokeWidth="1" />
        <line x1="72" y1="44" x2="97" y2="29" stroke="#E7D296" strokeWidth="1" />
        <line x1="57" y1="56" x2="27" y2="69" stroke="#E7D296" strokeWidth="1" />
        <line x1="71" y1="56" x2="103" y2="69" stroke="#E7D296" strokeWidth="1" />
      </>
    ),
  },
]

const citations = [
  { n: '01', title: 'IBIS World — Meal Kit & Subscription Box Services, US 2024' },
  { n: '02', title: 'Noom S-1 Filing — Unit Economics and Churn Analysis, 2021' },
  { n: '03', title: 'CBInsights — Startup Failure Post-Mortem Database (Q3 2024)' },
  { n: '04', title: 'Google Trends — "meal planning app" 5-year trajectory, US' },
  { n: '05', title: 'Kozmo.com: The $280M Cautionary Tale of Last-Mile Convenience' },
]

/** Real-data overrides. Anything omitted falls back to the design's own
 * sample content, so the screen still renders standalone. */
export interface DashboardData {
  verdictWord: string
  verdictSuffix: string
  verdictColor: string
  verdictGlow: string
  verdictBorder: string
  summary: string
  failureCase: { company: string; reason: string; pattern: string } | null
  cards: { title: string; body: string; status: string; statusColor: string; confidence: string }[]
  citations: { n: string; title: string; url?: string }[]
}

export default function Dashboard({
  onNavigate,
  data,
}: {
  onNavigate: (s: Screen) => void
  data?: DashboardData
}) {
  const cards = data
    ? resultCards.map((tpl, i) => ({ ...tpl, ...(data.cards[i] ?? {}) }))
    : resultCards
  const citationRows = data && data.citations.length > 0 ? data.citations : citations
  const verdictWord = data?.verdictWord ?? 'Amber'
  const verdictSuffix = data?.verdictSuffix ?? '— Proceed with Caution'
  const verdictColor = data?.verdictColor ?? '#D9B36C'
  const verdictGlow = data?.verdictGlow ?? 'rgba(217,179,108,0.14)'
  const verdictBorder = data?.verdictBorder ?? 'rgba(217,179,108,0.20)'
  const summary =
    data?.summary ??
    'The market opportunity is real and the timing is reasonable, but the unit economics and differentiation story require significant work before this is fundable or scalable. Three agents flagged material risk. One flagged existential risk at current assumptions.'
  const failureCase = data
    ? data.failureCase
    : {
        company: 'Kozmo.com (1999–2001)',
        reason:
          'rapid expansion into a real consumer need with insufficient unit economics. Kozmo raised $280M before shutdown. The failure driver was CAC that scaled faster than LTV — identical to your current 1:1.8 ratio trajectory. The fix was either radical churn reduction or a price increase of ≥30%, neither of which Kozmo executed in time.',
        pattern: '',
      }

  return (
    <div className="min-h-screen bg-[#050405]">

      {/* ── Reality Check Banner ── */}
      {/* Photographic/scrim treatment reserved exclusively for this verdict moment */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: 320 }}
      >
        {/* Textured dark ground */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0A0806 0%, #111008 45%, #0C0A07 100%)' }}
        />
        {/* Flat status tint — no pulsing/blur, so figures stay crisp */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: verdictGlow }} />
        {/* Scrim */}
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }} />
        {/* Status border */}
        <div className="absolute inset-0 border pointer-events-none" style={{ borderColor: verdictBorder }} />

        <div className="relative z-10 max-w-[1280px] mx-auto px-8 py-14 flex flex-col gap-5">
          {/* Eyebrow */}
          <span
            className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em]"
          >
            Validation Verdict
          </span>

          {/* Verdict line */}
          <div
            className="flex items-center gap-4"
          >
            {/* AlertTriangle icon — spring-in, 100ms delay */}
            <div>
              <AlertTriangle size={28} strokeWidth={1.75} color={verdictColor} />
            </div>
            <div>
              <span className="text-[48px] font-bold leading-none tracking-[-0.01em]" style={{ color: verdictColor }}>
                {verdictWord}
              </span>
              <span className="text-[48px] font-bold leading-none tracking-[-0.01em] text-[#F5F3EF]">
                {' '}{verdictSuffix}
              </span>
            </div>
          </div>

          <p
            className="text-[15px] text-[#A8A49C] leading-[150%] max-w-[600px]"
          >
            {summary}
          </p>

          {/* Failure case study inset — slides up 300ms after banner */}
          {failureCase && (
            <div
              className="mt-2 p-5 rounded-lg max-w-[600px]"
              style={{
                border: '1px solid rgba(231,210,150,0.14)',
                backgroundColor: 'rgba(10,9,8,0.65)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <History size={16} strokeWidth={1.5} color="#6E6B64" />
                <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.08em]">Historical Pattern Match</p>
              </div>
              <p className="text-[13px] text-[#A8A49C] leading-[145%]">
                Pattern matches <strong className="text-[#F5F3EF] font-medium">{failureCase.company}</strong>: {failureCase.reason}
                {failureCase.pattern && (
                  <span className="text-[#6E6B64]"> Matched risk pattern: {failureCase.pattern}.</span>
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Sub-agent result cards ── */}
      <section className="max-w-[1280px] mx-auto px-8 py-16">
        <div className="mb-8">
          <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em] mb-2">Agent Findings</p>
          <h2 className="text-[32px] font-semibold text-[#F5F3EF] leading-[120%]">Full sub-agent payloads</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(card => (
            <div
              key={card.n}
              className="rounded-xl border border-[#2A2722] bg-[#121110] overflow-hidden flex flex-col"
              style={{ transition: 'border-color 150ms ease-out' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#43443E' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2722' }}
            >
              {/* Visual area */}
              <div className="h-[140px] bg-[#0A0908] flex items-center justify-center">
                <svg width="130" height="100" viewBox="0 0 130 100" fill="none" className="opacity-[0.30]">
                  {card.motif}
                </svg>
              </div>
              {/* Content */}
              <div className="p-6 flex flex-col gap-2 flex-1">
                <NumericTag n={card.n} label={card.category} />
                <h3 className="text-[20px] font-semibold text-[#F5F3EF] leading-[120%] mt-1">{card.title}</h3>
                <p className="text-[13px] text-[#A8A49C] leading-[145%] flex-1">{card.body}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2A2722]">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-[0.08em]"
                      style={{ border: `1px solid ${card.statusColor}55`, color: card.statusColor }}
                    >
                      {card.confidenceLevel === 'low' && <AlertTriangle size={10} strokeWidth={2} />}
                      {card.status}
                    </span>
                    <span className="text-[11px] text-[#6E6B64]">{card.confidence} confidence</span>
                  </div>
                  <button className="flex items-center gap-1 text-[13px] text-[#6E6B64] hover:text-[#E7D296] transition-colors">
                    Full payload
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Citation list ── */}
      <section className="max-w-[1280px] mx-auto px-8 pb-16">
        <div className="mb-6">
          <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em]">Sources & Citations</p>
        </div>
        <div className="border-t border-[#2A2722]">
          {citationRows.map(c => (
            <div
              key={c.n}
              className="flex items-center justify-between py-5 border-b border-[#2A2722] group"
            >
              <div className="flex items-center gap-4">
                <span
                  className="text-[11px] font-medium text-[#6E6B64] tabular-nums flex-shrink-0"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {c.n} /
                </span>
                <span className="text-[15px] text-[#F5F3EF] break-all">{c.title}</span>
              </div>
              <a
                href={(c as { url?: string }).url ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[13px] text-[#6E6B64] group-hover:text-[#E7D296] transition-colors flex-shrink-0 ml-4"
              >
                Open source
                <ExternalLink size={14} strokeWidth={1.5} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── PDF & Re-run CTAs ── */}
      <section className="max-w-[1280px] mx-auto px-8 pb-20">
        <div className="rounded-xl border border-[#2A2722] bg-[#121110] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em] mb-2">Export</p>
            <h3 className="text-[22px] font-semibold text-[#F5F3EF]">Download the full validation report</h3>
            <p className="text-[13px] text-[#A8A49C] mt-1">
              PDF with all agent payloads, citations, failure case study, and next-step recommendations.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate('checkout')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#E7D296] text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-[#C9B98A] transition-colors"
            >
              <FileDown size={16} strokeWidth={1.5} />
              Unlock PDF — $20
            </button>
            <button
              onClick={() => onNavigate('onboarding')}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#43443E] text-[#F5F3EF] text-[13px] font-semibold uppercase tracking-[0.08em] hover:border-[#6E6B64] transition-colors"
            >
              <RotateCcw size={16} strokeWidth={1.5} />
              Re-run — $10
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}