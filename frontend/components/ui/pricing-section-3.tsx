'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import NumberFlow from '@number-flow/react'
import { Briefcase, CheckCheck, Database, Server, ShieldCheck, UserCheck, Zap } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { TimelineContent } from '@/components/ui/timeline-animation'
import { VerticalCutReveal } from '@/components/ui/vertical-cut-reveal'
import { PLANS, type PlanFeatureIcon } from '@/lib/plans'
import { cn } from '@/lib/utils'

const FEATURE_ICONS: Record<PlanFeatureIcon, React.ReactNode> = {
  briefcase: <Briefcase size={18} />,
  database: <Database size={18} />,
  server: <Server size={18} />,
  userCheck: <UserCheck size={18} />,
  zap: <Zap size={18} />,
  shieldCheck: <ShieldCheck size={18} />,
}

const PricingSwitch = ({ onSwitch, className }: { onSwitch: (value: string) => void; className?: string }) => {
  const [selected, setSelected] = useState('0')

  const handleSwitch = (value: string) => {
    setSelected(value)
    onSwitch(value)
  }

  const indicator = (
    <motion.span
      layoutId="pricing-switch"
      className="absolute inset-0 rounded-full bg-amber-400 shadow-md shadow-amber-500/20"
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
    />
  )

  return (
    <div className={cn('flex justify-center', className)}>
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-zinc-900 border border-zinc-800 p-1">
        <button
          type="button"
          onClick={() => handleSwitch('0')}
          aria-pressed={selected === '0'}
          className={cn(
            'relative z-10 h-10 sm:h-11 rounded-full px-4 sm:px-6 text-sm font-medium transition-colors',
            selected === '0' ? 'text-black' : 'text-zinc-300 hover:text-white'
          )}
        >
          {selected === '0' && indicator}
          <span className="relative">Monthly</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitch('1')}
          aria-pressed={selected === '1'}
          className={cn(
            'relative z-10 h-10 sm:h-11 flex-shrink-0 rounded-full px-4 sm:px-6 text-sm font-medium transition-colors',
            selected === '1' ? 'text-black' : 'text-zinc-300 hover:text-white'
          )}
        >
          {selected === '1' && indicator}
          <span className="relative flex items-center gap-2">
            Yearly
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                selected === '1' ? 'bg-black/15 text-black' : 'bg-amber-400/10 text-amber-300'
              )}
            >
              Save 20%
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default function PricingSection3() {
  const [isYearly, setIsYearly] = useState(false)
  const pricingRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handlePlanSelect = (planId: string) => {
    router.push(`/checkout?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`)
  }

  // Short delays + durations so the page settles almost immediately.
  const revealVariants: Variants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: { delay: i * 0.06, duration: 0.3 },
    }),
    hidden: { filter: 'blur(8px)', y: -16, opacity: 0 },
  }

  const togglePricingPeriod = (value: string) => setIsYearly(Number.parseInt(value) === 1)

  return (
    <div className="relative z-10 px-4 pt-12 pb-20 min-h-screen max-w-7xl mx-auto" ref={pricingRef}>
      <article className="flex sm:flex-row flex-col sm:pb-0 pb-4 sm:items-center items-start justify-between gap-6 mb-8">
        <div className="text-left">
          <h2 className="font-serif text-4xl sm:text-5xl font-normal leading-[120%] text-white mb-4">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.04}
              staggerFrom="first"
              reverse
              containerClassName="justify-start"
              transition={{ type: 'spring', stiffness: 320, damping: 32, delay: 0 }}
            >
              Plans & Pricing
            </VerticalCutReveal>
          </h2>

          <TimelineContent
            as="p"
            animationNum={0}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="text-zinc-300 sm:w-[80%]"
          >
            Validate your SaaS ideas effortlessly with full AI agent pipelines and Human-in-the-loop validation.
          </TimelineContent>
        </div>

        <TimelineContent as="div" animationNum={1} timelineRef={pricingRef} customVariants={revealVariants}>
          <PricingSwitch onSwitch={togglePricingPeriod} className="shrink-0" />
        </TimelineContent>
      </article>

      <TimelineContent
        as="div"
        animationNum={2}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="grid md:grid-cols-3 gap-4 mx-auto rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60 p-3 sm:p-4"
      >
        {PLANS.map((plan, index) => (
          <TimelineContent
            as="div"
            key={plan.id}
            animationNum={index + 3}
            timelineRef={pricingRef}
            customVariants={revealVariants}
          >
            <Card
              className={cn(
                'relative h-full flex flex-col justify-between',
                plan.popular
                  ? 'md:scale-105 ring-2 ring-amber-400 border-transparent bg-gradient-to-t from-zinc-950 to-zinc-900 shadow-xl shadow-amber-500/10'
                  : 'border-zinc-800 bg-zinc-950/80'
              )}
            >
              <CardContent className="pt-6">
                <div className="space-y-2 pb-3">
                  {plan.popular && (
                    <span className="inline-block bg-amber-400 text-black px-3 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </span>
                  )}

                  <div className="flex items-baseline">
                    <span className="text-4xl font-semibold text-white">
                      $
                      <NumberFlow value={isYearly ? plan.yearlyPrice : plan.price} className="text-4xl font-semibold" />
                    </span>
                    <span className="text-zinc-400 ml-1">/{isYearly ? 'year' : 'month'}</span>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-zinc-300 mb-5">{plan.description}</p>

                <ul className="space-y-2.5 mb-5">
                  {plan.features.map(f => (
                    <li key={f.text} className="flex items-start gap-3 text-sm text-white">
                      <span className={cn('mt-0.5 flex-shrink-0', plan.popular ? 'text-amber-400' : 'text-zinc-400')}>
                        {FEATURE_ICONS[f.icon]}
                      </span>
                      {f.text}
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <h4 className="font-medium text-sm text-zinc-200">{plan.includes[0]}</h4>
                  <ul className="space-y-2">
                    {plan.includes.slice(1).map(item => (
                      <li key={item} className="flex items-center">
                        <span
                          className={cn(
                            'h-6 w-6 rounded-full grid place-content-center mr-3 flex-shrink-0 border',
                            plan.popular
                              ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                          )}
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm text-zinc-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter>
                <button
                  type="button"
                  onClick={() => handlePlanSelect(plan.id)}
                  className={cn(
                    'w-full mt-2 py-3.5 text-base font-semibold rounded-xl transition-transform hover:scale-[1.02]',
                    plan.popular
                      ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-lg shadow-amber-500/20'
                      : 'bg-zinc-900 text-white border border-zinc-700 hover:border-zinc-500'
                  )}
                >
                  {plan.buttonText}
                </button>
              </CardFooter>
            </Card>
          </TimelineContent>
        ))}
      </TimelineContent>
    </div>
  )
}
