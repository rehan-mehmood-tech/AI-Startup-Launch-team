'use client'

import { ReactNode, useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Screen } from '@/lib/navigation'
import { supabase } from '@/lib/supabase/client'
import { SplineScene } from '@/components/ui/splite'
import { Spotlight } from '@/components/ui/spotlight'
import { ScrollWordReveal } from '@/components/ui/motion-scroll-word-reveal'
import { ShimmerText } from '@/components/ui/shimmer-text'
import { Footer } from '@/components/ui/footer'
import { useTypewriter } from '@/lib/useTypewriter'

const founderMetrics = [
  { stat: '92%', label: 'Failure Rate', body: 'Driven by premature scaling and shipping without validated market demand.' },
  { stat: '6 Months', label: 'Wasted', body: 'Average time spent building features nobody turns out to pay for.' },
  { stat: '$10k', label: 'Average Loss', body: 'Capital burned before discovering the pricing strategy was wrong.' },
]

/** Static illustrative content for the pipeline showcase card. */
const pipelinePreviewAgents = [
  { name: 'Market Agent', task: 'Scanning Reddit & TAM', state: '100% Complete', progress: '100%', stateColor: '#B9C99A', barColor: '#B9C99A' },
  { name: 'Financial Agent', task: 'Calculating LTV:CAC & Margins', state: '100% Complete', progress: '100%', stateColor: '#B9C99A', barColor: '#B9C99A' },
  { name: 'Competitor Agent', task: 'Analyzing Incumbents', state: 'Processing', progress: '62%', stateColor: '#FBBF24', barColor: '#FBBF24' },
  { name: 'Orchestrator', task: 'Synthesizing Verdict', state: 'Queued', progress: '0%', stateColor: '#6E6B64', barColor: '#6E6B64' },
]

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

const features = [
  {
    n: '01', label: 'Market Truth',
    title: 'Live competitor intelligence, not stale reports',
    body: 'Real-time SERP data and SEC filings cross-referenced against your positioning claims. No recycled Crunchbase snapshots.',
  },
  {
    n: '02', label: 'Product Focus',
    title: "What you're building vs. what the market actually needs",
    body: "Jobs-to-be-Done analysis separates genuine differentiation from feature wishlist. Brutal gap scoring included.",
  },
  {
    n: '03', label: 'Unit Economics',
    title: 'CAC, LTV, payback — modeled without optimism bias',
    body: 'Bottom-up projections anchored to comparable cohort data from similar-stage companies in your vertical.',
  },
  {
    n: '04', label: 'Go-To-Market',
    title: 'Distribution strategy stress-tested before day one',
    body: 'Channel economics, ICP definition, and conversion benchmarks from analogous markets. Finds the leaky buckets early.',
  },
  {
    n: '05', label: 'Failure Patterns',
    title: 'Matched against 2,400+ documented startup post-mortems',
    body: "Structural pattern matching against documented failures. If Kozmo fits, you'll hear it before your investors do.",
  },
  {
    n: '06', label: 'Competitive Moat',
    title: 'Sustainable advantage or a temporary head start?',
    body: 'Network effects, switching costs, data compounding — assessed against your actual business model, not the deck.',
  },
  {
    n: '07', label: 'Timing Risk',
    title: 'Is the market ready, or are you 3 years early?',
    body: 'Search trend velocity, VC thesis alignment, and regulatory tailwind/headwind scored on a single timing index.',
  },
  {
    n: '08', label: 'Orchestrated Verdict',
    title: 'Green, Amber, or Red — with primary sources',
    body: 'Five sub-agents, one synthesized verdict. Every claim cited. Every failure analogue named. Zero hallucinated confidence.',
  },
]

const subAgents: { n: string; category: string; title: string; body: string; motif: ReactNode }[] = [
  {
    n: '01', category: 'Market Research',
    title: 'Competitive Landscape: Amber Risk',
    body: 'Identified 14 direct competitors; 3 are VC-backed with >$40M raised. TAM ~$8.4B. Ingredient-level tracking gap is real but contested.',
    motif: (
      <>
        {/* Histogram */}
        <line x1="14" y1="70" x2="14" y2="34" strokeWidth="2" />
        <line x1="34" y1="70" x2="34" y2="14" strokeWidth="2" />
        <line x1="54" y1="70" x2="54" y2="46" strokeWidth="2" />
        <line x1="74" y1="70" x2="74" y2="24" strokeWidth="2" />
        <line x1="94" y1="70" x2="94" y2="54" strokeWidth="2" />
        <line x1="8" y1="72" x2="112" y2="72" strokeWidth="1.2" />
      </>
    ) as ReactNode,
  },
  {
    n: '02', category: 'Product Focus',
    title: 'Differentiation Depth: Low Signal',
    body: 'Core JTBD maps to 3 existing solutions at price parity. Unique value claim requires proprietary data moat not present in MVP.',
    motif: (
      <>
        {/* Venn */}
        <circle cx="46" cy="42" r="26" strokeWidth="1.5" />
        <circle cx="74" cy="42" r="26" strokeWidth="1.5" />
        <line x1="60" y1="18" x2="60" y2="66" strokeWidth="0.8" strokeDasharray="3 3" />
      </>
    ) as ReactNode,
  },
  {
    n: '03', category: 'Unit Economics',
    title: 'CAC/LTV Ratio: 1:1.8 (Danger)',
    body: 'Blended CAC of $62 against 6-month LTV of $114. Payback period of 8.2 months exceeds industry median.',
    motif: (
      <>
        {/* Growth line */}
        <polyline points="10,66 30,52 50,57 70,32 90,40 108,14" strokeWidth="1.8" fill="none" />
        <line x1="8" y1="72" x2="112" y2="72" strokeWidth="1.2" />
        <line x1="8" y1="8" x2="8" y2="72" strokeWidth="1.2" />
      </>
    ) as ReactNode,
  },
  {
    n: '04', category: 'GTM & Marketing',
    title: 'Go-To-Market & Channel Fit: High Friction',
    body: 'B2C acquisition channels saturated for health & productivity niches. Paid ad payback unsustainable without organic viral loops or strategic B2B distribution.',
    motif: (
      <>
        {/* Target / radar */}
        <circle cx="60" cy="40" r="30" strokeWidth="1.2" />
        <circle cx="60" cy="40" r="19" strokeWidth="1.2" />
        <circle cx="60" cy="40" r="8" strokeWidth="1.5" />
        <line x1="60" y1="4" x2="60" y2="76" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="24" y1="40" x2="96" y2="40" strokeWidth="0.8" strokeDasharray="3 3" />
      </>
    ) as ReactNode,
  },
  {
    n: '05', category: 'Orchestrator',
    title: 'Synthesis & Final Verdict: Proceed with Pivot',
    body: 'Synthesizing signals across 4 primary agents. High failure probability on current generic B2C positioning. Shift focus to B2B enterprise wellness integrations.',
    motif: (
      <>
        {/* Node / neural mesh */}
        <circle cx="60" cy="40" r="9" strokeWidth="1.5" />
        <circle cx="22" cy="18" r="5" strokeWidth="1.2" />
        <circle cx="98" cy="18" r="5" strokeWidth="1.2" />
        <circle cx="22" cy="62" r="5" strokeWidth="1.2" />
        <circle cx="98" cy="62" r="5" strokeWidth="1.2" />
        <line x1="51" y1="35" x2="27" y2="22" strokeWidth="1" />
        <line x1="69" y1="35" x2="93" y2="22" strokeWidth="1" />
        <line x1="51" y1="45" x2="27" y2="58" strokeWidth="1" />
        <line x1="69" y1="45" x2="93" y2="58" strokeWidth="1" />
      </>
    ) as ReactNode,
  },
]

const timeline = [
  {
    title: 'Describe your idea in plain language',
    body: "Five questions. Two minutes. No deck needed. Our onboarding wizard extracts the signal from your narrative — market, audience, stage, and growth model.",
  },
  {
    title: 'Five agents run in parallel',
    body: "Market research, product differentiation, unit economics, go-to-market strategy, and failure pattern matching all execute concurrently against live data sources.",
  },
  {
    title: 'Review the evidence, not just the conclusion',
    body: "Every finding links to a primary source. Every failure analogue is named. You can interrogate the reasoning, not just accept the score.",
  },
  {
    title: 'Walk away with a verdict you can act on',
    body: "Green, Amber, or Red — with a specific list of what to validate next. No vague frameworks. No consultant-speak. A decision, with receipts.",
  },
]


const HERO_PHRASES = [
  'Real market evidence from real potential customers before writing code.',
  'An autonomous AI board of directors analyzing your risk and revenue strategy.',
  'Complete customer validation report & pitch deck generated in 2 minutes.',
]
const LONGEST_HERO_PHRASE = HERO_PHRASES.reduce((a, b) => (b.length > a.length ? b : a))

export default function Landing({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const typedPhrase = useTypewriter(HERO_PHRASES, { typeMs: 35, deleteMs: 15, pauseMs: 1500, gapMs: 250 })

  // Drives the footer CTA: signed-in founders go straight to the wizard,
  // guests are routed to pricing first.
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setIsSignedIn(!!data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setIsSignedIn(!!session))
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <main>
      {/* ── Hero ── */}
      {/* Content sits just below the navbar (pt-12 ≈ 48px gap) rather than
          being vertically centred in a tall block — `justify-center` inside
          min-h-[760px] was pushing the badge and headline far down the fold.
          min-h is kept only so the topographic mesh anchored to the bottom
          still has room to render. */}
      {/* ── Hero: typewriter headline left / interactive 3D right ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 12%, rgba(231,210,150,0.065) 0%, transparent 60%)' }}
        />

        {/* Grid, not flex: the requested class string mixed `flex` and `grid`,
            which set `display` twice and leave the winner to CSS source order.
            `items-center` vertically centres both columns within the viewport. */}
        <div className="relative z-10 min-h-[calc(100vh-80px)] w-full max-w-7xl mx-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
          {/* Left column — copy */}
          <div className="lg:col-span-7 flex flex-col items-start justify-center gap-5">
            <h1 className="font-serif text-3xl sm:text-5xl leading-tight font-normal text-white antialiased">
              <span className="block">Your Idea, Our Validation.</span>

              {/* Screen readers get the full, stable text; the animated
                  character-by-character version is hidden from them so it
                  isn't re-announced on every keystroke. */}
              <span className="sr-only">{HERO_PHRASES.join(' ')}</span>

              {/* The invisible longest phrase reserves the tallest height the
                  typed line will ever need, so the layout doesn't jump as
                  phrases of different lengths wrap onto more lines. */}
              <span aria-hidden="true" className="grid mt-2">
                <span className="invisible [grid-area:1/1]">{LONGEST_HERO_PHRASE}|</span>
                <span className="[grid-area:1/1]">
                  <ShimmerText duration={1.6} delay={0} className="text-3xl sm:text-5xl font-serif leading-tight">
                    {typedPhrase}
                    <span className="animate-pulse">|</span>
                  </ShimmerText>
                </span>
              </span>
            </h1>

            <p className="text-zinc-200 text-base sm:text-lg max-w-xl leading-[155%] space-y-1">
              <span className="block">
                AI Startup Launch Team turns your raw ideas into market-tested evidence in under two minutes.
              </span>
              <span className="block">
                Our autonomous AI agents analyze risks, poll target customers, and generate real validation reports.
              </span>
              <span className="block">
                Stop building in the dark&mdash;validate unit economics and pitch decks before writing a single line of
                code.
              </span>
            </p>

            <div className="flex items-center gap-6 flex-wrap mt-1">
              <button
                onClick={() => onNavigate('onboarding')}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-amber-400 text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-amber-300"
              >
                Start Validation
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-[13px] text-zinc-200 hover:text-white"
              >
                See a sample dashboard →
              </button>
            </div>
          </div>

          {/* Right column — robot stage (unchanged). Only the column span
              changed, to fit the 12-column grid; the badge was removed. */}
          <div className="relative lg:col-span-5 w-full flex flex-col items-end justify-center min-h-[420px]">
            <div className="relative w-full h-[420px] lg:h-[520px]">
              <Spotlight className="-top-40 left-0" size={320} />
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full scale-[0.85] md:scale-90 origin-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 1: The Founder's Dilemma ── */}
      <section className="max-w-[1280px] mx-auto px-8 py-20">
        <p className="text-[11px] font-medium text-amber-400 uppercase tracking-[0.12em] mb-4">
          [ The Graveyard of Good Ideas ]
        </p>
        <ScrollWordReveal
          text="90% of first-time & solo founders don't fail on code. They fail on positioning."
          className="py-2 max-w-[900px]"
          headingClassName="text-[clamp(34px,4.4vw,52px)] leading-[110%] tracking-[-0.01em]"
        />

        <div className="mt-8 max-w-[760px] flex flex-col gap-4">
          <p className="text-[15px] text-zinc-200 leading-[160%]">
            The typical first build burns <span className="text-white font-semibold">$5k&ndash;$15k</span> and{' '}
            <span className="text-white font-semibold">four to six months</span> before anyone checks whether the numbers
            work. No validated CAC. No sharply defined ICP. No unit economics beyond a spreadsheet guess.
          </p>
          <p className="text-[15px] text-zinc-200 leading-[160%]">
            The failure mode is rarely the engineering. It&apos;s a target audience defined too broadly to market to, a
            price point chosen by feel rather than by margin, and an incumbent whose distribution advantage was never
            seriously modelled. Those three mistakes compound into instant churn &mdash; and turn a genuinely valid product
            concept into a ghost town with a landing page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {founderMetrics.map(metric => (
            <div key={metric.stat} className="group rounded-xl border border-zinc-700 bg-zinc-950/90 p-6 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-400/40">
              <div className="text-[32px] font-bold text-amber-400 leading-none mb-2 tabular-nums">{metric.stat}</div>
              <div className="text-[15px] font-semibold text-white mb-2">{metric.label}</div>
              <p className="text-[13px] text-zinc-300 leading-[150%]">{metric.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Why strategic clarity matters ── */}
      <section className="max-w-[1280px] mx-auto px-8 pb-20">
        <p className="text-[11px] font-medium text-amber-400 uppercase tracking-[0.12em] mb-4">
          [ Why Strategic Clarity Matters ]
        </p>
        <ScrollWordReveal
          text="The best builders validate the assumption before they open the IDE."
          className="py-2 max-w-[820px]"
          headingClassName="text-[clamp(32px,3.8vw,46px)] leading-[112%] tracking-[-0.01em]"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="flex flex-col gap-4">
            <p className="text-[15px] text-zinc-200 leading-[160%]">
              Every serious accelerator teaches the same sequence: name the customer, size the pain, prove someone will
              pay, and only then write software. It works because it front-loads the cheap experiments. Being wrong about
              your ICP costs an afternoon at that stage &mdash; and half a year once the product is built around it.
            </p>
            <p className="text-[15px] text-zinc-200 leading-[160%]">
              The problem is that doing it properly is slow. Competitor teardowns, TAM/SAM/SOM sizing, CAC and LTV
              modelling, channel scoring, and post-mortem pattern matching are five different specialist jobs, and most
              founders are doing all of them alone, at night, between shipping features.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-700 bg-zinc-950/90 p-6 flex flex-col gap-4 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-400/40">
            <p className="text-[11px] font-medium text-zinc-300 uppercase tracking-[0.12em]">
              What the pipeline replaces
            </p>
            <p className="text-[15px] text-zinc-200 leading-[160%]">
              Five agents run as an automated co-founder bench &mdash; deep market research against live search data,
              competitive gap analysis, deterministic unit-economics modelling, go-to-market channel scoring, and
              structural matching against documented startup post-mortems &mdash; executing in parallel and reconciled by
              an orchestrator into a single verdict.
            </p>
            <p className="text-[15px] text-zinc-200 leading-[160%]">
              You get the output of a week of strategy work, with every claim traced back to a primary source you can
              open and check yourself.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3: Live validation pipeline showcase ── */}
      <section className="max-w-[1280px] mx-auto px-8 pb-20">
        <p className="text-[11px] font-medium text-amber-400 uppercase tracking-[0.12em] mb-4">
          [ The Live Validation Pipeline ]
        </p>
        <h2 className="font-serif text-[clamp(32px,3.8vw,46px)] font-normal text-white leading-[112%] tracking-[-0.01em] mb-8 max-w-[760px]">
          Watch the run happen, node by node.
        </h2>
        <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-6 shadow-2xl max-w-3xl mx-auto relative z-10 w-full text-left">
          {/* Window chrome */}
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-700">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300 uppercase tracking-[0.12em]">
              Live Validation Pipeline
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-400/40 text-[11px] font-medium text-amber-400 uppercase tracking-[0.08em]">
              4 Agents Active
            </span>
          </div>

          {/* Agent grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            {pipelinePreviewAgents.map(agent => (
              <div key={agent.name} className="rounded-lg border border-zinc-700 bg-zinc-900/95 p-3.5 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-400/40">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[13px] font-semibold text-white">{agent.name}</span>
                  <span
                    className="text-[10px] font-medium uppercase tracking-[0.08em] flex-shrink-0"
                    style={{ color: agent.stateColor }}
                  >
                    {agent.state}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-300 leading-[145%] mb-2.5">{agent.task}</p>
                <div className="h-[3px] rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: agent.progress, backgroundColor: agent.barColor }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Terminal strip */}
          <div className="mt-4 rounded-lg bg-black border border-zinc-700 px-4 py-3">
            <code
              className="text-[12px] text-amber-400 tabular-nums"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              &gt; Verdict: AMBER | Payback: 14 Months | Focus B2B
            </code>
          </div>
        </div>
      </section>

      {/* ── Bento feature grid ── */}
      <section id="features" className="max-w-[1280px] mx-auto px-8 py-20 scroll-mt-24">
        <p className="text-[11px] font-medium text-amber-400 uppercase tracking-[0.12em] mb-10">
          [ What The Pipeline Covers ]
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-700 rounded-xl overflow-hidden border border-zinc-700">
          {features.map((f) => (
            <div
              key={f.n}
              className="group bg-zinc-950/90 p-8 flex flex-col gap-3 transition-colors duration-300 hover:bg-zinc-900"
            >
              <NumericTag n={f.n} label={f.label} />
              <h3 className="text-[18px] font-semibold text-white leading-[120%] mt-1 transition-colors duration-300 group-hover:text-amber-300">{f.title}</h3>
              <p className="text-[13px] text-zinc-300 leading-[145%]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3-up sub-agent teaser cards ── */}
      <section id="agents" className="max-w-[1280px] mx-auto px-8 pb-20 scroll-mt-24">
        <div className="mb-10">
          <p className="text-[11px] font-medium text-amber-400 uppercase tracking-[0.12em] mb-3">[ Inside The Pipeline ]</p>
          <h2 className="font-serif text-[clamp(36px,4.4vw,52px)] font-normal text-white leading-[104%] tracking-[-0.005em]">
            Five agents.<br />One honest verdict.
          </h2>
        </div>
        {/* Infinite marquee: the array is rendered twice so translating the
            track by -50% lands exactly on the start of the second copy, giving
            a seamless loop with no gap. Hovering anywhere over the track pauses
            it for reading; prefers-reduced-motion disables it (see globals.css). */}
        <div className="group relative overflow-hidden">
          <div className="agent-marquee flex gap-4 w-max group-hover:[animation-play-state:paused]">
            {[...subAgents, ...subAgents].map((a, i) => (
              <article
                key={`${a.n}-${i}`}
                aria-hidden={i >= subAgents.length}
                className="w-[360px] flex-shrink-0 rounded-2xl border border-zinc-800 bg-zinc-950/90 overflow-hidden flex flex-col"
              >
                <div className="h-[150px] bg-black/40 flex items-center justify-center">
                  <svg
                    width="120"
                    height="80"
                    viewBox="0 0 120 80"
                    fill="none"
                    className="stroke-amber-400/60"
                    aria-hidden="true"
                  >
                    {a.motif}
                  </svg>
                </div>
                <div className="p-6 flex flex-col gap-2 flex-1">
                  <NumericTag n={a.n} label={a.category} />
                  <h3 className="text-[19px] font-semibold text-white leading-[125%] mt-1">{a.title}</h3>
                  <p className="text-[13px] text-zinc-300 leading-[155%]">{a.body}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Edge fades so cards enter/exit without a hard cut */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#050405] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#050405] to-transparent" />
        </div>
      </section>

      {/* ── Vertical timeline ── */}
      <section className="max-w-[1280px] mx-auto px-8 pb-20">
        <p className="text-[11px] font-medium text-amber-400 uppercase tracking-[0.12em] mb-10">[ How It Works ]</p>
        <div className="flex flex-col max-w-[680px]">
          {timeline.map((step, i) => (
            <div key={i} className="flex gap-10 relative">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center flex-shrink-0 px-3 py-1 rounded-md border border-amber-400/30 bg-amber-400/10">
                  <span className="text-[13px] font-medium text-amber-400 tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                    0{i + 1}
                  </span>
                </div>
                {i < timeline.length - 1 && <div className="w-px flex-1 bg-zinc-700 mt-2 min-h-[48px]" />}
              </div>
              <div className="pb-10">
                <h3 className="text-[22px] font-semibold text-white leading-[120%] mb-2">{step.title}</h3>
                <p className="text-[15px] text-zinc-200 leading-[150%]">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Smart conversion CTA (auth-aware) ── */}
      <section className="max-w-[1280px] mx-auto px-8 pb-20">
        <div className="rounded-xl border border-zinc-700 bg-zinc-950/90 px-8 py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-[620px]">
            <h3 className="font-serif text-[clamp(26px,3.2vw,36px)] font-normal text-white leading-[115%] tracking-[-0.01em] mb-3">
              Ready to validate your startup hypothesis?
            </h3>
            <p className="text-[15px] text-zinc-200 leading-[155%]">
              Stop guessing. Get empirical evidence and unit economics in under 2 minutes.
            </p>
          </div>
          <button
            onClick={() => onNavigate(isSignedIn ? 'onboarding' : 'pricing')}
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-amber-400 text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-amber-300 flex-shrink-0"
          >
            {isSignedIn ? 'Go to Validation Pipeline' : 'View Pricing & Start'}
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      <Footer />
    </main>
  )
}