/**
 * Single source of truth for plan tiers, shared by the pricing section and
 * the checkout page so the two can never show different prices.
 */

export type BillingCycle = 'monthly' | 'yearly'
export type PlanFeatureIcon = 'briefcase' | 'database' | 'server' | 'userCheck' | 'zap' | 'shieldCheck'

export interface Plan {
  id: 'starter' | 'pro' | 'venture'
  name: string
  description: string
  /** Monthly price, USD. */
  price: number
  /** Yearly price, USD (20% off twelve monthly payments). */
  yearlyPrice: number
  popular?: boolean
  buttonText: string
  features: { text: string; icon: PlanFeatureIcon }[]
  /** First entry is the heading, the rest are list items. */
  includes: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for solo builders looking to quickly validate early-stage ideas.',
    price: 5,
    yearlyPrice: 48,
    buttonText: 'Get Started',
    features: [
      { text: '2 Idea Validation Reports / month', icon: 'briefcase' },
      { text: 'Standard Multi-Agent Pipeline', icon: 'database' },
      { text: 'Competitor & Market Size Analysis', icon: 'server' },
    ],
    includes: ['Starter includes:', 'Standard Execution Speed', 'Community Support'],
  },
  {
    id: 'pro',
    name: 'Pro Validator',
    description: 'Best value for active creators who want full control over AI agent outputs.',
    price: 10,
    yearlyPrice: 96,
    popular: true,
    buttonText: 'Get Started',
    features: [
      { text: '5 Idea Validation Reports / month', icon: 'briefcase' },
      { text: 'Human-in-the-Loop (HITL) Agent Control', icon: 'userCheck' },
      { text: 'Priority Report Generation', icon: 'zap' },
    ],
    includes: [
      'Everything in Starter, plus:',
      'Step-by-Step Agent Inspection',
      'Custom Prompt Tweaking per Agent',
      'Priority Processing Queue',
    ],
  },
  {
    id: 'venture',
    name: 'Venture Studio',
    description: 'End-to-end deep validation for serial entrepreneurs and startup studios.',
    price: 20,
    yearlyPrice: 192,
    buttonText: 'Get Started',
    features: [
      { text: '10 End-to-End Idea Validations / month', icon: 'briefcase' },
      { text: 'Full Human-in-the-Loop (HITL) Pipeline Control', icon: 'userCheck' },
      { text: 'Full Deep-Dive Market, Revenue & Competitor Analysis', icon: 'shieldCheck' },
    ],
    includes: [
      'Everything in Pro, plus:',
      'Detailed Financial & CAC Projection Reports',
      'Export Full Validation Dossier (PDF & Data)',
      'Dedicated Support',
    ],
  },
]

export function findPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find(p => p.id === id)
}

export function priceFor(plan: Plan, billing: BillingCycle): number {
  return billing === 'yearly' ? plan.yearlyPrice : plan.price
}
