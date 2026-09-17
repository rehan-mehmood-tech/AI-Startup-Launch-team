'use client'

import { useState } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { OTHER, isAnswerValid, type McqQuestion } from '@/lib/hitl/agents'
import type { Answers } from '@/lib/hitl/types'
import { cn } from '@/lib/utils'

/**
 * Structured intake for one agent: every question is multiple choice with an
 * "Other" option that reveals an inline text input. (The idea itself is the
 * only short free-text line — there is no sensible fixed list for it.)
 */
export default function McqStep({
  questions,
  initial,
  submitLabel = 'Run agent',
  busy = false,
  onSubmit,
  onCancel,
}: {
  questions: McqQuestion[]
  initial?: Answers
  submitLabel?: string
  busy?: boolean
  onSubmit: (answers: Answers) => void
  onCancel?: () => void
}) {
  const [answers, setAnswers] = useState<Answers>(initial ?? {})
  const allValid = questions.every(q => isAnswerValid(q, answers[q.id]))

  function set(id: string, patch: Partial<{ choice: string; other: string }>) {
    setAnswers(prev => ({ ...prev, [id]: { ...(prev[id] ?? { choice: '' }), ...patch } }))
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={e => {
        e.preventDefault()
        if (allValid && !busy) onSubmit(answers)
      }}
    >
      {questions.map((q, qi) => {
        const a = answers[q.id]
        return (
          <fieldset key={q.id} className="flex flex-col gap-2.5" disabled={busy}>
            <legend className="mb-2.5 text-[14px] font-medium text-[#F5F3EF]">
              <span className="mr-2 font-mono text-[12px] text-[#6E6B64]">{String(qi + 1).padStart(2, '0')}</span>
              {q.prompt}
            </legend>

            {q.kind === 'text' ? (
              <input
                value={a?.choice ?? ''}
                onChange={e => set(q.id, { choice: e.target.value })}
                placeholder={q.placeholder}
                maxLength={400}
                className="w-full rounded-lg border border-[#2A2722] bg-black/40 px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#6E6B64] outline-none focus:border-amber-400"
              />
            ) : (
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {q.options!.map(opt => {
                  const selected = a?.choice === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => set(q.id, { choice: opt })}
                      className={cn(
                        'flex max-w-full items-center gap-1.5 rounded-full border px-3.5 py-2 text-left text-[13px] transition-colors',
                        selected
                          ? 'border-amber-400 bg-amber-400 font-semibold text-[#050405]'
                          : opt === OTHER
                            ? 'border-dashed border-[#43443E] text-[#A8A49C] hover:border-[#6E6B64]'
                            : 'border-[#43443E] text-[#A8A49C] hover:border-[#6E6B64] hover:text-[#F5F3EF]'
                      )}
                    >
                      {selected && <Check size={13} strokeWidth={2.2} className="shrink-0" />}
                      <span className="line-clamp-2">{opt}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {q.kind === 'choice' && a?.choice === OTHER && (
              <input
                autoFocus
                value={a.other ?? ''}
                onChange={e => set(q.id, { other: e.target.value })}
                inputMode={q.numericOther ? 'decimal' : undefined}
                placeholder={q.numericOther ? 'Enter an amount in USD' : 'Type your answer'}
                maxLength={300}
                aria-label={`${q.prompt} (other)`}
                className="w-full rounded-lg border border-[#2A2722] bg-black/40 px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#6E6B64] outline-none focus:border-amber-400 sm:max-w-md"
              />
            )}
          </fieldset>
        )
      })}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} className="px-3 py-2 text-[13px] text-[#A8A49C] hover:text-white">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!allValid || busy}
          className="flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#050405] hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-[#1A1815] disabled:text-[#43443E]"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
