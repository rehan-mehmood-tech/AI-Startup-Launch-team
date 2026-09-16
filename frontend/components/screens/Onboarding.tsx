'use client'

import { useState } from 'react'
import { Bot, Send, Check, Plus, ArrowLeft, ArrowRight } from 'lucide-react'
import type { Screen } from '@/lib/navigation'

const steps = [
  {
    step: 1,
    eyebrow: 'STEP 1 OF 6 — IDEA',
    question: "Describe your startup idea in one or two sentences. Don't worry about being perfect — we'll extract what matters.",
    type: 'text' as const,
    placeholder: 'e.g. An AI-powered meal planning app that adapts to dietary restrictions and budget in real time.',
  },
  {
    step: 2,
    eyebrow: 'STEP 2 OF 6 — INDUSTRY',
    question: 'Which industry does this compete in? This scopes the live market and competitor searches, so the more precise the better.',
    type: 'chips' as const,
    options: ['SaaS / B2B Software', 'Consumer App', 'Fintech', 'Healthtech', 'Edtech', 'E-commerce / Retail', 'Marketplace', 'Other…'],
    customPlaceholder: 'Name your industry…',
  },
  {
    step: 3,
    eyebrow: 'STEP 3 OF 6 — AUDIENCE',
    question: 'Who is your primary target customer? Pick the group that represents at least 70% of your initial market.',
    type: 'chips' as const,
    options: ['B2C Consumers', 'SMB Operators', 'Enterprise Buyers', 'Developers / Technical', 'Prosumers', 'Other…'],
    customPlaceholder: 'Describe your audience…',
  },
  {
    step: 4,
    eyebrow: 'STEP 4 OF 6 — STAGE',
    question: 'What stage is your startup at right now? Be honest — the analysis is most useful when calibrated correctly.',
    type: 'chips' as const,
    options: ['Pre-idea / Exploring', 'Idea with research done', 'MVP in development', 'MVP live with early users', 'Revenue generating'],
  },
  {
    step: 5,
    eyebrow: 'STEP 5 OF 6 — GROWTH MODEL',
    question: 'What is your primary expected growth channel? Pick the one you\'re most confident you can execute against.',
    type: 'chips' as const,
    options: ['Content / SEO', 'Paid Acquisition', 'Product-Led Growth', 'Sales-Led / Outbound', 'Community / Referral', 'Partnerships / BD'],
  },
  {
    step: 6,
    eyebrow: 'STEP 6 OF 6 — CONCERN',
    question: "What's the single thing that worries you most about this idea? This helps us prioritize which findings to surface first.",
    type: 'chips' as const,
    options: ['Market size / TAM', 'Existing competition', 'Unit economics / margins', 'Team / execution capability', 'Timing / market readiness', 'Regulatory risk'],
  },
]

export default function Onboarding({
  onNavigate,
  onComplete,
}: {
  onNavigate: (s: Screen) => void
  /** Fires with all six answers, in step order, when the wizard finishes. */
  onComplete?: (answers: string[]) => void
}) {
  const [answers, setAnswers] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [textValue, setTextValue] = useState('')
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  function currentAnswer(): string {
    if (step.type === 'text') return textValue.trim()
    return selectedChip === 'Other…' ? customInput.trim() : (selectedChip ?? '')
  }

  function handleNext() {
    const next = [...answers, currentAnswer()]
    setAnswers(next)
    if (isLast) { onComplete?.(next); onNavigate('pipeline'); return }
    setCurrentStep(c => c + 1)
    setSelectedChip(null)
    setTextValue('')
    setShowCustom(false)
    setCustomInput('')
  }

  function handleBack() {
    if (currentStep === 0) return
    setAnswers(a => a.slice(0, -1))
    setCurrentStep(c => c - 1)
    setSelectedChip(null)
    setTextValue('')
    setShowCustom(false)
    setCustomInput('')
  }

  const canAdvance =
    step.type === 'text'
      ? textValue.trim().length > 10
      : selectedChip !== null && (selectedChip !== 'Other…' || customInput.trim().length > 0)

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[720px]">
        {/* Progress header */}
        <div className="mb-6">
          <span className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em]">
            {step.eyebrow}
          </span>
          <div className="mt-3 h-[3px] rounded-full bg-[#2A2722] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E7D296] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Chat card */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-950/90 p-8 flex flex-col gap-6">
          {/* Assistant message */}
          <div className="flex gap-3 items-start">
            {/* Gold-ring avatar with Bot icon */}
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ border: '1.5px solid #E7D296' }}
            >
              <Bot size={14} color="#E7D296" strokeWidth={1.5} />
            </div>
            <div className="bg-zinc-900/95 rounded-xl rounded-tl-none px-4 py-3 max-w-[85%]">
              <p className="text-[15px] text-white leading-[150%]">{step.question}</p>
            </div>
          </div>

          {/* Input area */}
          {step.type === 'text' ? (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canAdvance && handleNext()}
                placeholder={step.placeholder}
                className="flex-1 bg-[#0A0908] border border-zinc-700 rounded-lg px-4 py-3 text-[15px] text-white placeholder-zinc-300 outline-none transition-all duration-150"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onFocus={e => { e.currentTarget.style.borderColor = '#E7D296'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(231,210,150,0.08)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#2A2722'; e.currentTarget.style.boxShadow = 'none' }}
                autoFocus
              />
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
                style={{ backgroundColor: canAdvance ? '#E7D296' : '#1A1815', cursor: canAdvance ? 'pointer' : 'default' }}
              >
                <Send size={16} strokeWidth={1.5} color={canAdvance ? '#050405' : '#43443E'} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {step.options!.map(opt => {
                  const isOther = opt === 'Other…'
                  const selected = selectedChip === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        if (isOther) { setShowCustom(true); setSelectedChip('Other…') }
                        else { setSelectedChip(opt); setShowCustom(false) }
                      }}
                      className="flex items-center gap-1.5 px-[18px] py-[10px] rounded-full text-[13px] transition-all duration-[220ms]"
                      style={{
                        border: isOther
                          ? `1px dashed ${selected ? '#E7D296' : '#43443E'}`
                          : `1px solid ${selected ? 'transparent' : '#43443E'}`,
                        backgroundColor: selected ? '#E7D296' : 'transparent',
                        color: selected ? '#050405' : isOther ? '#6E6B64' : '#A8A49C',
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      {selected && !isOther && (
                        <Check size={14} strokeWidth={2} color="#050405" />
                      )}
                      {isOther && !selected && (
                        <Plus size={14} strokeWidth={1.5} color="#6E6B64" />
                      )}
                      {opt}
                    </button>
                  )
                })}
              </div>

              {showCustom && (
                <input
                  type="text"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder={step.customPlaceholder ?? "Type your answer…"}
                  className="bg-[#0A0908] border border-zinc-700 rounded-lg px-4 py-3 text-[15px] text-white placeholder-zinc-300 outline-none"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#E7D296'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(231,210,150,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#2A2722'; e.currentTarget.style.boxShadow = 'none' }}
                  autoFocus
                />
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1.5 text-[13px] text-[#6E6B64] hover:text-[#A8A49C] transition-colors disabled:opacity-30"
                >
                  <ArrowLeft size={16} strokeWidth={1.5} />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canAdvance}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold uppercase tracking-[0.08em] transition-all duration-150"
                  style={{
                    backgroundColor: canAdvance ? '#E7D296' : '#1A1815',
                    color: canAdvance ? '#050405' : '#43443E',
                    cursor: canAdvance ? 'pointer' : 'default',
                  }}
                >
                  {isLast ? 'Run validation' : 'Continue'}
                  <ArrowRight size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentStep ? 20 : 6,
                height: 6,
                backgroundColor: i === currentStep ? '#E7D296' : i < currentStep ? '#43443E' : '#2A2722',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}