'use client'

import { useState } from 'react'
import { ArrowRight, Plus, TriangleAlert } from 'lucide-react'
import type { Screen } from '@/lib/navigation'
import { PLANS } from '@/lib/plans'

const faqs = [
  {
    q: 'How does the Human-in-the-Loop (HITL) feature work?',
    a: "On Pro Validator and Venture Studio, the pipeline pauses after each agent finishes. You can inspect that agent's output, adjust its instructions, and regenerate just that stage before its result is passed to the next agent — so a weak market-research pass never quietly flows into your pricing and go-to-market analysis. Starter runs the full pipeline end-to-end without pausing.",
  },
  {
    q: "What happens when an agent output isn't accurate?",
    a: "Every agent's output is checked against a strict schema before it's accepted, and a malformed result is automatically retried once. If a stage still can't produce a trustworthy result, it's marked unavailable rather than filled with a guess, and the final verdict reflects that gap. With HITL you can also regenerate a single stage yourself instead of re-running the whole pipeline.",
  },
  {
    q: 'How are idea validations calculated each month?',
    a: 'One validation is one complete pipeline run, from market research through to the final verdict. Regenerating an individual agent stage inside a run does not use up another validation. Your allowance resets at the start of each billing cycle.',
  },
  {
    q: 'Can I change or upgrade my plan anytime?',
    a: 'Yes. You can move between Starter, Pro Validator and Venture Studio at any time, and switch between monthly and yearly billing. Yearly billing is 20% cheaper than paying monthly for twelve months.',
  },
  {
    q: 'What kind of data do the AI agents analyze?',
    a: "Market Research pulls live Google search results, local listings and Google Trends through SerpApi, and every competitor or pain point it cites links back to a crawled source URL. Unit economics are computed by a deterministic Python engine rather than an LLM, and the orchestrator matches your risk profile against a curated set of documented startup failures. Every claim in the report carries its source.",
  },
]

const warningItems = [
  'Your idea is pre-idea with no defined audience',
  "The market you're entering has fewer than 3 documented competitors",
  'You cannot describe your unit economics, even roughly',
]

const lowestMonthlyPrice = Math.min(...PLANS.map(p => p.price))

export default function FAQ({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="relative z-10 min-h-screen px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-[11px] font-medium text-amber-400 uppercase tracking-[0.12em] mb-3">[ FAQ ]</p>
          <h1 className="font-serif text-[clamp(36px,4.6vw,56px)] font-normal text-white leading-[104%]">
            Common questions.
          </h1>
          <p className="text-zinc-300 mt-3 max-w-2xl">
            How the pipeline works, what counts toward your plan, and where the evidence comes from.
          </p>
        </div>

        {/* Low-information warning banner */}
        <div className="rounded-2xl mb-10 p-6 border border-amber-400/30 bg-amber-400/[0.04]">
          <div className="flex items-start gap-4">
            <TriangleAlert size={18} strokeWidth={1.5} className="text-amber-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold text-amber-300 mb-2">Validation quality depends on input quality</p>
              <p className="text-[13px] text-zinc-200 leading-[145%] mb-4">
                The pipeline is calibrated for ideas with at least minimal market research. Results may be weaker if:
              </p>
              <ul className="flex flex-col gap-2">
                {warningItems.map((item, i) => (
                  <li key={item} className="flex items-start gap-3 text-[13px] text-zinc-200">
                    <span className="text-zinc-400 flex-shrink-0 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {String(i + 1).padStart(2, '0')} /
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Accordion cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            const isLastOdd = i === faqs.length - 1 && faqs.length % 2 === 1
            const panelId = `faq-panel-${i}`
            return (
              <div
                key={faq.q}
                className={`rounded-2xl border bg-zinc-950/90 transition-colors duration-200 ${
                  isOpen ? 'border-amber-400/40' : 'border-zinc-800 hover:border-zinc-700'
                } ${isLastOdd ? 'md:col-span-2' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full p-6 flex items-start justify-between gap-4 text-left"
                >
                  <span className="text-[15px] text-white leading-[145%] font-medium">{faq.q}</span>
                  <span
                    className="w-7 h-7 rounded-full border border-zinc-700 flex items-center justify-center flex-shrink-0 transition-transform duration-200 text-amber-300"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                  >
                    <Plus size={15} strokeWidth={1.75} />
                  </span>
                </button>
                <div
                  id={panelId}
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{ maxHeight: isOpen ? 400 : 0, opacity: isOpen ? 1 : 0 }}
                >
                  <p className="px-6 pb-6 text-[14px] text-zinc-300 leading-[160%]">{faq.a}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA banner */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-serif text-3xl text-white">Ready to validate your next idea?</p>
            <p className="text-sm text-zinc-300 mt-2">
              Plans start at <span className="text-amber-300 font-semibold">${lowestMonthlyPrice}/month</span> — save 20%
              with yearly billing.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-black text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-amber-300"
            >
              View Pricing
              <ArrowRight size={15} strokeWidth={1.75} />
            </button>
            <a
              href="mailto:hello@example.com"
              className="px-6 py-3 rounded-full border border-zinc-700 text-white text-[13px] font-semibold uppercase tracking-[0.08em] hover:border-zinc-500"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
