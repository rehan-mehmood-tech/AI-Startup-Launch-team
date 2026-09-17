'use client'

import { useState } from 'react'
import { Check, Download, Link2, Loader2 } from 'lucide-react'
import type { ReportBundle } from '@/lib/hitl/types'
import { downloadReportPdf } from '@/lib/pdf-generator'
import { AGENTS } from '@/lib/hitl/agents'
import { DISCLAIMER } from '@/components/ui/logo'
import {
  H3,
  MarketResearchSection,
  MarketingSection,
  PricingSection,
  ProductStrategySection,
} from '@/components/validate/agent-output'

const VERDICT_COLOR: Record<string, string> = { Green: '#B9C99A', Amber: '#D9B36C', Red: '#C97A63' }

function Actions({ report, shareUrl, authorName }: { report: ReportBundle; shareUrl: string | null; authorName?: string | null }) {
  const [pdfBusy, setPdfBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pdf() {
    setPdfBusy(true)
    setError(null)
    try {
      await downloadReportPdf(report, authorName)
    } catch (e) {
      setError(e instanceof Error ? `PDF failed: ${e.message}` : 'PDF failed.')
    } finally {
      setPdfBusy(false)
    }
  }

  async function copy() {
    if (!shareUrl) return
    setError(null)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(`Couldn't access the clipboard. Link: ${shareUrl}`)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={pdf}
          disabled={pdfBusy}
          className="flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-[13px] font-semibold text-[#050405] hover:bg-amber-300 disabled:opacity-60"
        >
          {pdfBusy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Download PDF
        </button>
        {shareUrl && (
          <button
            onClick={copy}
            className="flex items-center gap-2 rounded-full border border-[#43443E] px-4 py-2 text-[13px] font-medium text-[#F5F3EF] hover:border-[#6E6B64]"
          >
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            {copied ? 'Link copied' : 'Copy Link'}
          </button>
        )}
      </div>
      {error && <p role="alert" className="break-all text-[12px] text-[#C97A63]">{error}</p>}
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#2A2722] py-10">
      <p className="font-mono text-[12px] text-[#6E6B64]">{n}</p>
      <h2 className="mt-1 mb-6 break-words font-serif text-[24px] leading-tight sm:text-[30px] text-[#F5F3EF]">{title}</h2>
      {children}
    </section>
  )
}

/** The final, document-style report: no cards, no animation. */
export default function ReportView({
  report,
  shareUrl,
  authorName,
}: {
  report: ReportBundle
  shareUrl: string | null
  authorName?: string | null
}) {
  const orc = report.orchestrator
  const color = VERDICT_COLOR[orc.validation_status] ?? '#E7D296'
  const date = new Date(report.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <article className="mx-auto w-full max-w-[820px] px-4 py-10 sm:px-8">
      <header className="pb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#6E6B64]">Startup validation report · {date}</p>
        <h1 className="mt-3 break-words font-serif text-[28px] leading-[1.1] text-[#F5F3EF] sm:text-[36px] lg:text-[44px]">{report.title}</h1>
        <p className="mt-4 text-[15px] text-[#A8A49C]">
          Verdict: <span className="font-semibold" style={{ color }}>{orc.validation_status}</span>
        </p>
        <div className="mt-6">
          <Actions report={report} shareUrl={shareUrl} authorName={authorName} />
        </div>
      </header>

      <Section n="00" title="Executive summary">
        <p className="whitespace-pre-line text-[15px] leading-[1.75] text-[#D6D2C9]">{orc.executive_summary}</p>

        {orc.strategic_recommendations && orc.strategic_recommendations.length > 0 && (
          <>
            <H3>Strategic recommendations</H3>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-[1.65] text-[#D6D2C9] marker:text-[#6E6B64]">
              {orc.strategic_recommendations.map(r => <li key={r}>{r}</li>)}
            </ol>
          </>
        )}

        <H3>Why this verdict</H3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-[1.65] text-[#D6D2C9] marker:text-[#6E6B64]">
          {orc.validation_reasoning.map(s => (
            <li key={s.signal}>{s.signal} <span className="text-[12px] text-[#8C887F]">({s.source_agent}, {s.weight} weight)</span></li>
          ))}
        </ul>

        {orc.low_information_warning.triggered && (
          <p className="mt-4 text-[13px] text-[#D9B36C]">
            Low-information warning: {orc.low_information_warning.affected_fields.join(', ')} were too vague; confidence was reduced accordingly.
          </p>
        )}

        {orc.failure_case_study.length > 0 && (
          <>
            <H3>Comparable failures</H3>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-[1.65] text-[#D6D2C9] marker:text-[#6E6B64]">
              {orc.failure_case_study.map(f => (
                <li key={f.company}><span className="text-[#F5F3EF]">{f.company}</span> — {f.collapse_reason}</li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section n="01" title={AGENTS[0].name}><MarketResearchSection o={report.outputs.market_research} /></Section>
      <Section n="02" title={AGENTS[1].name}><ProductStrategySection o={report.outputs.product_strategist} /></Section>
      <Section n="03" title={AGENTS[2].name}><PricingSection o={report.outputs.financial} /></Section>
      <Section n="04" title={AGENTS[3].name}><MarketingSection o={report.outputs.marketing} /></Section>

      <footer className="border-t border-[#2A2722] pt-8">
        <Actions report={report} shareUrl={shareUrl} authorName={authorName} />
        <p className="mt-8 border-t border-[#2A2722] pt-5 text-[12px] italic leading-relaxed text-[#8C887F]">{DISCLAIMER}</p>
      </footer>
    </article>
  )
}
