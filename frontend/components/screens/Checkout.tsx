'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Info, Lock } from 'lucide-react'
import type { Screen } from '@/lib/navigation'
import { findPlan, priceFor, type BillingCycle } from '@/lib/plans'

function Field({
  id,
  label,
  placeholder,
  type = 'text',
  autoComplete,
  inputMode,
}: {
  id: string
  label: string
  placeholder: string
  type?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-medium text-zinc-300 uppercase tracking-[0.12em]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-[15px] text-white placeholder:text-zinc-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
      />
    </div>
  )
}

/**
 * Dedicated checkout, reached from a plan's "Get Started" button as
 * /checkout?plan=<id>&billing=<monthly|yearly>.
 *
 * IMPORTANT: no payment processor is connected yet. Submitting validates the
 * form and says so honestly rather than pretending a charge succeeded. In
 * production these raw card inputs must be replaced by Stripe Elements /
 * Checkout — card numbers should never pass through this app's own inputs.
 */
export default function Checkout({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const params = useSearchParams()
  const plan = findPlan(params.get('plan'))
  const billing: BillingCycle = params.get('billing') === 'yearly' ? 'yearly' : 'monthly'
  const [submitted, setSubmitted] = useState(false)

  if (!plan) {
    return (
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 p-8 text-center">
          <h1 className="font-serif text-3xl text-white mb-3">Choose a plan first</h1>
          <p className="text-sm text-zinc-300 mb-6">We couldn&apos;t find the plan you selected.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-black hover:bg-amber-300"
          >
            View plans
          </Link>
        </div>
      </div>
    )
  }

  const amount = priceFor(plan, billing)
  const period = billing === 'yearly' ? 'year' : 'month'

  return (
    <div className="relative z-10 min-h-[calc(100vh-80px)] px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white mb-8">
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back to plans
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Order summary */}
          <aside className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 h-fit">
            <p className="text-[11px] font-medium text-zinc-300 uppercase tracking-[0.12em] mb-4">Order summary</p>
            <h2 className="font-serif text-3xl text-white">{plan.name}</h2>
            <p className="text-sm text-zinc-300 mt-2">{plan.description}</p>

            <ul className="mt-5 space-y-2 border-t border-zinc-800 pt-5">
              {plan.features.map(f => (
                <li key={f.text} className="text-sm text-zinc-200 flex gap-2">
                  <span className="text-amber-400">✓</span>
                  {f.text}
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-zinc-800 pt-5 flex items-baseline justify-between">
              <span className="text-sm text-zinc-300">
                Billed {billing}
                {billing === 'yearly' && <span className="ml-2 text-amber-300">(save 20%)</span>}
              </span>
              <span className="text-2xl font-semibold text-white">
                ${amount}
                <span className="text-sm font-normal text-zinc-400">/{period}</span>
              </span>
            </div>
          </aside>

          {/* Payment form */}
          <section className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 sm:p-8">
            <p className="text-[11px] font-medium text-zinc-300 uppercase tracking-[0.12em] mb-1">Checkout</p>
            <h1 className="text-2xl font-semibold text-white mb-6">Payment details</h1>

            {submitted ? (
              <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-5">
                <div className="flex items-start gap-3">
                  <Info size={18} strokeWidth={1.5} className="text-amber-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300 mb-1">Payments aren&apos;t live yet</p>
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      No charge was made and no card details were stored. Online payment for the {plan.name} plan is
                      coming soon — you can still run a validation now.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('onboarding')}
                      className="mt-4 rounded-full bg-amber-400 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-black hover:bg-amber-300"
                    >
                      Continue to validation
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={e => {
                  e.preventDefault()
                  setSubmitted(true)
                }}
              >
                <Field id="checkout-email" label="Email" placeholder="you@example.com" type="email" autoComplete="email" />
                <Field
                  id="checkout-card"
                  label="Card number"
                  placeholder="4242 4242 4242 4242"
                  autoComplete="cc-number"
                  inputMode="numeric"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field id="checkout-exp" label="Expiry" placeholder="MM / YY" autoComplete="cc-exp" inputMode="numeric" />
                  <Field id="checkout-cvc" label="CVC" placeholder="•••" autoComplete="cc-csc" inputMode="numeric" />
                </div>
                <Field id="checkout-name" label="Name on card" placeholder="Ada Lovelace" autoComplete="cc-name" />

                <button
                  type="submit"
                  className="mt-2 w-full rounded-full bg-amber-400 px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-black hover:bg-amber-300"
                >
                  Subscribe — ${amount}/{period}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 text-center">
                  <Lock size={12} strokeWidth={1.5} />
                  Cancel anytime. You won&apos;t be charged until payments go live.
                </p>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
