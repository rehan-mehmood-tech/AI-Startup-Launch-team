'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import type { Screen } from '@/lib/navigation'

function NumericTag({ n, label }: { n: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-[#6E6B64] tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
        {n} /
      </span>
      {label && (
        <span className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em]">
          {label}
        </span>
      )}
    </div>
  )
}

const tiers = [
  {
    n: '01', tier: 'Preview', name: 'Free Preview',
    price: '$0', sub: 'No card required',
    description: 'Market research summary, top competitor list, and positioning gap analysis. Start validating immediately.',
    cta: 'Start free →',
    features: ['Market research summary', 'Top 5 competitors', 'Positioning gap score', 'No payment required'],
    highlight: false,
  },
  {
    n: '02', tier: 'Full Unlock', name: 'Full Validation',
    price: '$20', sub: 'One-time payment',
    description: 'All five agents, complete unit economics model, failure case study, go-to-market scorecard, and downloadable PDF report with primary sources.',
    cta: 'Unlock full report →',
    features: ['All 5 agent payloads', 'Unit economics model', 'Failure pattern match', 'Go-to-market scorecard', 'PDF with citations', '30-day access'],
    highlight: true,
  },
  {
    n: '03', tier: 'Re-run', name: 'Updated Analysis',
    price: '$10', sub: 'Per re-run',
    description: 'Changed your model, pricing, or positioning? Re-run the full pipeline against updated assumptions for half the price.',
    cta: 'Re-run existing →',
    features: ['Full pipeline re-run', 'Updated unit economics', 'Revised verdict', 'Delta comparison vs. original'],
    highlight: false,
  },
]

function InputField({
  label,
  placeholder,
  type = 'text',
}: {
  label: string
  placeholder: string
  type?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.08em]">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="bg-[#0A0908] border rounded-lg px-4 py-3 text-[15px] text-white placeholder-[#43443E] outline-none transition-all duration-150"
        style={{
          borderColor: focused ? '#E7D296' : '#2A2722',
          boxShadow: focused ? '0 0 0 3px rgba(231,210,150,0.08)' : 'none',
          fontFamily: "'DM Sans', sans-serif",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

export default function Checkout({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [selected, setSelected] = useState(1) // default: Full Unlock

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em] mb-3">Pricing</p>
          <h2 className="text-[clamp(32px,4vw,44px)] font-semibold text-white leading-[104%] tracking-[-0.005em]">
            Pay for what you actually need.
          </h2>
          <p className="text-[15px] text-zinc-200 mt-3 max-w-[480px] mx-auto leading-[150%]">
            No subscription. No recurring charges. A one-time payment for a complete, evidence-anchored validation.
          </p>
        </div>

        {/* Pricing bento — 3-column seamless */}
        <div className="rounded-xl overflow-hidden border border-zinc-700 flex flex-col md:flex-row mb-12">
          {tiers.map((t, i) => (
            <button
              key={t.n}
              onClick={() => setSelected(i)}
              className={`flex-1 p-8 flex flex-col gap-4 text-left transition-colors duration-150 ${
                i < tiers.length - 1 ? 'border-b md:border-b-0 md:border-r border-zinc-700' : ''
              } ${selected === i ? 'bg-[#1A1815]' : 'bg-zinc-950/90 hover:bg-[#161412]'}`}
            >
              <NumericTag n={t.n} label={t.tier} />
              <div>
                <h3 className="text-[22px] font-semibold text-white">{t.name}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[28px] font-semibold text-white">{t.price}</span>
                  <span className="text-[13px] text-[#6E6B64]">{t.sub}</span>
                </div>
              </div>
              <p className="text-[13px] text-zinc-200 leading-[145%]">{t.description}</p>
              <ul className="flex flex-col gap-1.5 mt-auto">
                {t.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-[#6E6B64]">
                    <span style={{ color: selected === i ? '#B9C99A' : '#43443E' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <span
                className="mt-2 text-[13px] font-semibold transition-colors"
                style={{ color: selected === i ? '#E7D296' : '#6E6B64' }}
              >
                {t.cta}
              </span>
            </button>
          ))}
        </div>

        {/* Payment form — only for paid tiers */}
        {selected > 0 && (
          <div className="max-w-[520px] mx-auto rounded-xl border border-zinc-700 bg-zinc-950/90 p-8">
            <div className="mb-6">
              <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em] mb-1">Checkout</p>
              <h3 className="text-[22px] font-semibold text-white">
                {tiers[selected].name} — {tiers[selected].price}
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <InputField label="Email" placeholder="you@example.com" type="email" />
              <InputField label="Card number" placeholder="4242 4242 4242 4242" />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Expiry" placeholder="MM / YY" />
                <InputField label="CVC" placeholder="•••" />
              </div>
              <InputField label="Name on card" placeholder="Ada Lovelace" />

              <button
                onClick={() => onNavigate('pipeline')}
                className="mt-2 w-full px-6 py-4 rounded-full bg-[#E7D296] text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-[#C9B98A] transition-all duration-150"
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(231,210,150,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                Pay {tiers[selected].price} and run validation
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#6E6B64] text-center leading-[145%]">
                <Lock size={12} strokeWidth={1.5} />
                Secured by Stripe. No subscription — single charge only. Report delivered within 4 minutes.
              </p>
            </div>
          </div>
        )}

        {selected === 0 && (
          <div className="text-center">
            <button
              onClick={() => onNavigate('onboarding')}
              className="px-8 py-4 rounded-full bg-[#E7D296] text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-[#C9B98A] transition-colors"
            >
              Start free — no card required
            </button>
          </div>
        )}
      </div>
    </div>
  )
}