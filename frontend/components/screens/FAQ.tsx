'use client'

import { useState } from 'react'
import { TriangleAlert, Plus, X } from 'lucide-react'
import type { Screen } from '@/lib/navigation'

const faqs = [
  {
    q: 'How does the five-agent pipeline actually work?',
    a: "Each agent is a specialized LLM-powered task runner with access to different data sources. Market Research hits live SERP and SEC APIs. Unit Economics runs bottom-up projections against comparable cohort data. The Orchestrator reads all sub-agent outputs and writes the final verdict — it never has access to your optimistic assumptions, only the evidence.",
  },
  {
    q: "What's the difference between a 'Green' and 'Amber' verdict?",
    a: "Green means the evidence supports moving forward: market size is defensible, unit economics model to sustainable margins within 18 months, and no structural failure-pattern matches. Amber means at least one material risk exists that could become fatal — proceed, but fix the flagged issue first. Red means a structural problem exists that typically precedes failure; a pivot is warranted before additional capital is deployed.",
  },
  {
    q: 'What data sources do the agents use?',
    a: "Live Google SERP data, SEC filings via EDGAR, Crunchbase funding records, Google Trends (5-year trajectories), IBIS World industry reports, CBInsights failure database, and patent filings via USPTO. All citations are included in the report — you can verify every claim against the primary source.",
  },
  {
    q: "What if I disagree with the verdict?",
    a: "The report is not a decision — it's evidence. You may have context the agents don't. The citation list lets you drill into every source. If you believe an agent made a factual error, the Re-run tier ($10) lets you correct input assumptions and get an updated analysis. We do not offer refunds based on disagreement with findings.",
  },
]

const warningItems = [
  "Your idea is pre-idea with no defined audience",
  "The market you're entering has fewer than 3 documented competitors",
  "You cannot describe your unit economics, even roughly",
]

export default function FAQ({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-12">
          <p className="text-[11px] font-medium text-zinc-300 uppercase tracking-[0.12em] mb-3">FAQ</p>
          <h2 className="text-[clamp(32px,4vw,44px)] font-semibold text-white leading-[104%] tracking-[-0.005em]">
            Common questions.
          </h2>
        </div>

        {/* Low-information warning banner */}
        <div
          className="rounded-xl mb-10 p-6"
          style={{ border: '1px solid rgba(217,179,108,0.35)', backgroundColor: 'rgba(217,179,108,0.04)' }}
        >
          <div className="flex items-start gap-4">
            <TriangleAlert size={18} strokeWidth={1.5} color="#D9B36C" className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold text-[#D9B36C] mb-2">Validation quality depends on input quality</p>
              <p className="text-[13px] text-zinc-200 leading-[145%] mb-4">
                Our pipeline is calibrated for ideas with at least minimal market research. Validation quality may be lower if:
              </p>
              <ul className="flex flex-col gap-2">
                {warningItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-zinc-200">
                    <span className="text-zinc-300 flex-shrink-0 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {String(i + 1).padStart(2, '0')} /
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 2x2 FAQ accordion grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden border border-zinc-700">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            const isRight = i % 2 === 1
            const isBottom = i >= 2
            return (
              <div
                key={i}
                className={`bg-zinc-950/90 ${!isRight ? 'md:border-r border-zinc-700' : ''} ${!isBottom ? 'border-b border-zinc-700' : ''}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full p-6 flex items-start justify-between gap-4 text-left group hover:bg-[#161412] transition-colors duration-150"
                >
                  <span className="text-[15px] text-white leading-[145%] font-medium">{faq.q}</span>
                  <div
                    className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'none', color: '#E7D296' }}
                  >
                    {isOpen
                      ? <X size={16} strokeWidth={1.5} color="#E7D296" />
                      : <Plus size={16} strokeWidth={1.5} color="#E7D296" />
                    }
                  </div>
                </button>
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: isOpen ? 400 : 0 }}
                >
                  <div className="px-6 pb-6">
                    <p className="text-[13px] text-zinc-200 leading-[145%]">{faq.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-12 pt-12 border-t border-zinc-700">
          <div>
            <p className="text-[22px] font-semibold text-white">Still have questions?</p>
            <p className="text-[13px] text-zinc-300 mt-1">Read the methodology or reach out directly.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('onboarding')}
              className="px-6 py-3 rounded-full bg-[#E7D296] text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-[#C9B98A] transition-colors"
            >
              Start Validation — $20
            </button>
            <a
              href="mailto:hello@example.com"
              className="px-6 py-3 rounded-full border border-[#43443E] text-white text-[13px] font-semibold uppercase tracking-[0.08em] hover:border-[#6E6B64] transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}