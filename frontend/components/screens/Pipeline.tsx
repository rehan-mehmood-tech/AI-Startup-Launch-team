'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import {
  ShieldCheck, Globe, Layers, DollarSign, Megaphone,
  Check, AlertTriangle, X, Loader2,
} from 'lucide-react'
import type { Screen } from '@/lib/navigation'

type AgentStatus = 'pending' | 'active' | 'complete' | 'degraded' | 'failed'

interface AgentDef {
  id: string
  name: string
  Icon: React.ElementType
  description: string
  activeDesc: string
  parallel?: boolean
}

const AGENT_DEFS: AgentDef[] = [
  {
    id: '01', name: 'Market Research Agent', Icon: Globe,
    description: 'Identified 14 direct competitors; 3 VC-backed with >$40M raised. TAM ~$8.4B (IBIS 2024). Ingredient-level personalization gap is real — contested by Noom and Cronometer.',
    activeDesc: 'Analyzing competitor positioning via live SERP and SEC data…',
  },
  {
    id: '02', name: 'Product Focus Agent', Icon: Layers,
    description: 'Core JTBD maps to 3 existing solutions at price parity. Unique value claim requires a proprietary dietary-restriction data moat not yet present in MVP.',
    activeDesc: 'Evaluating 6 product hypotheses against Jobs-to-be-Done framework. Scoring differentiation depth…',
  },
  {
    id: '03', name: 'Unit Economics Agent', Icon: DollarSign,
    description: 'Blended CAC $62, 6-month LTV $114 at current churn. Payback period 8.2 months. Model requires 40% churn reduction to reach 3:1 LTV:CAC.',
    activeDesc: 'Modeling CAC, LTV, and payback period against comparable cohort data…',
    parallel: true,
  },
  {
    id: '04', name: 'Go-To-Market Agent', Icon: Megaphone,
    description: 'Content/SEO channel scores 6.2/10. Paid acquisition unfeasible at current unit economics. Influencer-led community path has precedent (Forks Over Knives).',
    activeDesc: 'Scoring distribution channels against ICP fit and conversion benchmarks…',
    parallel: true,
  },
  {
    id: '05', name: 'Orchestrator Agent', Icon: ShieldCheck,
    description: 'Verdict: Amber — Proceed with Caution. Unit economics flagged as existential risk at current trajectory. Pattern match: Kozmo.com (1999–2001).',
    activeDesc: 'Synthesizing all sub-agent findings into final verdict…',
  },
]

const statusSequence: AgentStatus[][] = [
  ['complete', 'active',    'pending',  'pending',  'pending'],
  ['complete', 'complete',  'active',   'active',   'pending'],
  ['complete', 'complete',  'complete', 'complete', 'active'],
  ['complete', 'complete',  'complete', 'complete', 'complete'],
]

const elapsedBySeq: (string | null)[][] = [
  ['1m 23s', '0m 47s', null,     null,     null],
  ['1m 23s', '2m 01s', '0m 55s', '0m 55s', null],
  ['1m 23s', '2m 01s', '1m 44s', '2m 12s', '0m 18s'],
  ['1m 23s', '2m 01s', '1m 44s', '2m 12s', '1m 05s'],
]

function AgentNode({ status, Icon }: { status: AgentStatus; Icon: React.ElementType }) {
  // Outer pulse ring for active state
  const ring = status === 'active' ? (
    <div
      className="absolute w-8 h-8 rounded-full glow-ring pointer-events-none"
      style={{ backgroundColor: 'rgba(231,210,150,0.18)' }}
    />
  ) : null

  // Badge overlay (bottom-right of node)
  let badge: ReactNode = null
  if (status === 'complete') {
    badge = (
      <div
        className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#B9C99A', animation: 'badge-spring 270ms cubic-bezier(0,0,0.2,1) both' }}
      >
        <Check size={8} strokeWidth={2.5} color="#050405" />
      </div>
    )
  } else if (status === 'degraded') {
    badge = (
      <div
        className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#D9B36C' }}
      >
        <AlertTriangle size={8} strokeWidth={2.5} color="#050405" />
      </div>
    )
  } else if (status === 'failed') {
    badge = (
      <div
        className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#C97A63' }}
      >
        <X size={8} strokeWidth={2.5} color="#050405" />
      </div>
    )
  }

  const nodeBg: Record<AgentStatus, string> = {
    pending: 'transparent',
    active: '#E7D296',
    complete: '#E7D296',
    degraded: '#D9B36C',
    failed: '#C97A63',
  }
  const nodeBorder: Record<AgentStatus, string> = {
    pending: '#43443E',
    active: 'transparent',
    complete: 'transparent',
    degraded: 'transparent',
    failed: 'transparent',
  }
  const iconColor: Record<AgentStatus, string> = {
    pending: '#43443E',
    active: '#050405',
    complete: '#050405',
    degraded: '#050405',
    failed: '#050405',
  }

  return (
    <div className="relative flex items-center justify-center flex-shrink-0 w-8 h-8">
      {ring}
      <div
        className="relative w-7 h-7 rounded-full flex items-center justify-center z-10"
        style={{ backgroundColor: nodeBg[status], border: `1.5px solid ${nodeBorder[status]}` }}
      >
        {status === 'active' ? (
          // Show identity icon; Loader2 only for tiny inline status badges elsewhere
          <Icon size={14} strokeWidth={1.75} color={iconColor[status]} />
        ) : status === 'pending' ? (
          null
        ) : (
          <Icon size={14} strokeWidth={1.75} color={iconColor[status]} />
        )}
        {badge}
      </div>
    </div>
  )
}

function AgentRow({
  def,
  status,
  elapsed,
  isLast,
}: {
  def: AgentDef
  status: AgentStatus
  elapsed: string | null
  isLast: boolean
}) {
  const statusLabel: Record<AgentStatus, string> = {
    pending: 'Queued', active: 'Running', complete: 'Complete', degraded: 'Degraded', failed: 'Failed',
  }
  const statusColor: Record<AgentStatus, string> = {
    pending: '#6E6B64',
    active: '#E7D296',
    complete: '#B9C99A',
    degraded: '#D9B36C',
    failed: '#C97A63',
  }
  const statusBorder: Record<AgentStatus, string> = {
    pending: 'rgba(110,107,100,0.35)',
    active: 'rgba(231,210,150,0.30)',
    complete: 'rgba(185,201,154,0.40)',
    degraded: 'rgba(217,179,108,0.40)',
    failed: 'rgba(201,122,99,0.40)',
  }

  const displayDesc =
    status === 'active' ? def.activeDesc :
    status === 'complete' ? def.description :
    'Awaiting upstream agents.'

  return (
    <div className="flex gap-0">
      {/* Rail column */}
      <div className="flex flex-col items-center" style={{ width: 52, flexShrink: 0 }}>
        <AgentNode status={status} Icon={def.Icon} />
        {!isLast && (
          <div
            className="flex-1 min-h-[64px]"
            style={{
              width: 2,
              backgroundColor: status === 'complete' ? 'rgba(231,210,150,0.45)' : '#2A2722',
              transition: 'background-color 600ms cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <span
              className="text-[11px] font-medium text-[#6E6B64] tabular-nums"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {def.id} /
            </span>
            <h3 className="text-[22px] font-semibold text-[#F5F3EF] leading-[120%]">{def.name}</h3>
          </div>
          {elapsed && (
            <span
              className="text-[13px] text-[#6E6B64] tabular-nums flex-shrink-0 mt-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {elapsed}
            </span>
          )}
        </div>
        <p className={`text-[13px] leading-[145%] mb-3 ${status === 'active' ? 'status-blink text-[#A8A49C]' : 'text-[#6E6B64]'}`}>
          {displayDesc}
        </p>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{ border: `1px solid ${statusBorder[status]}`, color: statusColor[status] }}
        >
          {status === 'active' && <Loader2 size={10} strokeWidth={2} className="lucide-spin" />}
          {statusLabel[status]}
        </span>
      </div>
    </div>
  )
}

export default function Pipeline({
  onNavigate,
  liveStatuses,
  liveElapsed,
  liveComplete,
  error,
  onRetry,
  title,
  subtitle,
}: {
  onNavigate: (s: Screen) => void
  /** When supplied, the component renders real backend state instead of the
   * design's built-in demo simulation (and hides the demo stage controls). */
  liveStatuses?: AgentStatus[]
  liveElapsed?: (string | null)[]
  liveComplete?: boolean
  error?: string | null
  onRetry?: () => void
  title?: string
  subtitle?: string
}) {
  const isLive = !!liveStatuses
  const [seqIdx, setSeqIdx] = useState(0)
  const [running, setRunning] = useState(!liveStatuses)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isLive || !running) return
    intervalRef.current = setInterval(() => {
      setSeqIdx(prev => {
        if (prev >= statusSequence.length - 1) { setRunning(false); return prev }
        return prev + 1
      })
    }, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, isLive])

  const statuses = liveStatuses ?? statusSequence[seqIdx]
  const elapsed = liveElapsed ?? elapsedBySeq[seqIdx]
  const isComplete = isLive ? !!liveComplete : seqIdx === statusSequence.length - 1

  // Render agents with parallel pair handled inline
  function renderPipeline(): ReactNode {
    const rows: ReactNode[] = []
    let i = 0
    while (i < AGENT_DEFS.length) {
      const def = AGENT_DEFS[i]
      const next = AGENT_DEFS[i + 1]

      if (def.parallel && next?.parallel) {
        // Y-branch parallel pair
        const bothComplete = statuses[i] === 'complete' && statuses[i + 1] === 'complete'
        const branchColor = bothComplete ? 'rgba(231,210,150,0.45)' : '#2A2722'
        rows.push(
          <div key={`parallel-${i}`}>
            {/* SVG Y-branch connector drawing */}
            <div className="relative flex" style={{ marginLeft: 26, height: 28 }}>
              <svg width="120" height="28" viewBox="0 0 120 28" fill="none" style={{ overflow: 'visible' }}>
                <path
                  d="M0 0 L0 14 L-18 28"
                  stroke={branchColor}
                  strokeWidth="2"
                  fill="none"
                  style={{ transition: 'stroke 600ms ease-in-out' }}
                />
                <path
                  d="M0 14 L60 28"
                  stroke={branchColor}
                  strokeWidth="2"
                  fill="none"
                  style={{ transition: 'stroke 600ms ease-in-out' }}
                />
              </svg>
            </div>

            {/* Parallel agent cards */}
            <div className="flex gap-4 mb-4 ml-0">
              <div style={{ width: 10, flexShrink: 0 }} />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                {[def, next].map((pa, pi) => {
                  const st = statuses[i + pi]
                  const el = elapsed[i + pi]
                  const descText =
                    st === 'active' ? pa.activeDesc :
                    st === 'complete' ? pa.description :
                    'Awaiting Product Focus output.'
                  return (
                    <div
                      key={pa.id}
                      className="rounded-xl border bg-[#0E0D0B] p-5 flex flex-col gap-3"
                      style={{ borderColor: st === 'active' ? 'rgba(231,210,150,0.25)' : '#2A2722' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AgentNode status={st} Icon={pa.Icon} />
                          <span
                            className="text-[11px] font-medium text-[#6E6B64] tabular-nums"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {pa.id} /
                          </span>
                        </div>
                        {el && (
                          <span className="text-[13px] text-[#6E6B64] tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {el}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[18px] font-semibold text-[#F5F3EF] leading-[120%]">{pa.name}</h3>
                      <p className={`text-[13px] leading-[145%] ${st === 'active' ? 'status-blink text-[#A8A49C]' : 'text-[#6E6B64]'}`}>
                        {descText}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Re-merge rail */}
            <div className="relative flex" style={{ marginLeft: 26, height: 28 }}>
              <svg width="120" height="28" viewBox="0 0 120 28" fill="none" style={{ overflow: 'visible' }}>
                <path
                  d="M-18 0 L0 14 L0 28"
                  stroke={branchColor}
                  strokeWidth="2"
                  fill="none"
                  style={{ transition: 'stroke 600ms ease-in-out' }}
                />
                <path
                  d="M60 0 L0 14"
                  stroke={branchColor}
                  strokeWidth="2"
                  fill="none"
                  style={{ transition: 'stroke 600ms ease-in-out' }}
                />
              </svg>
            </div>
          </div>
        )
        i += 2
      } else {
        rows.push(
          <AgentRow
            key={def.id}
            def={def}
            status={statuses[i]}
            elapsed={elapsed[i]}
            isLast={i === AGENT_DEFS.length - 1}
          />
        )
        i++
      }
    }
    return rows
  }

  const stageLabels = ['Research', 'Parallel', 'Synthesis', 'Complete']

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-[860px] mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em] mb-2">
              Validation Pipeline
            </p>
            <h2 className="text-[32px] font-semibold text-[#F5F3EF] leading-[120%]">
              {title ?? 'AI-powered meal planning subscription'}
            </h2>
            <p className="text-[13px] text-[#6E6B64] mt-1">
              {subtitle ?? 'Adapts to dietary restrictions and budget constraints in real time'}
            </p>
          </div>
          <div className="flex-shrink-0">
            {isComplete ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E7D296] text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-[#C9B98A] transition-colors"
              >
                <ShieldCheck size={16} strokeWidth={1.5} />
                View Report
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2722]">
                <Loader2 size={14} strokeWidth={1.5} color="#E7D296" className="lucide-spin" />
                <span className="text-[13px] text-[#A8A49C]">Running</span>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline rail card */}
        <div className="rounded-xl border border-[#2A2722] bg-[#121110] p-8 md:p-10">
          {renderPipeline()}
        </div>

        {/* Completion CTA — the header button sits above a long rail, so the
            primary action is repeated here where the eye already is. */}
        {isComplete && (
          <div className="mt-6 rounded-xl border border-[#2A2722] bg-[#121110] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em] mb-1.5">
                Validation complete
              </p>
              <p className="text-[15px] text-[#F5F3EF] leading-[150%]">
                All agents finished. Your compiled report is ready.
              </p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#E7D296] text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-[#C9B98A] transition-colors flex-shrink-0"
            >
              View Full Report
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Live error + retry (real run only) */}
        {isLive && error && (
          <div
            className="mt-6 rounded-lg p-5 flex items-start justify-between gap-4 flex-wrap"
            style={{ border: '1px solid rgba(201,122,99,0.40)', backgroundColor: 'rgba(201,122,99,0.06)' }}
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} strokeWidth={1.5} color="#C97A63" className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-[#F5F3EF] mb-1">Validation run failed</p>
                <p className="text-[13px] text-[#A8A49C] leading-[145%] break-all">{error}</p>
              </div>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#43443E] text-[13px] font-semibold text-[#F5F3EF] uppercase tracking-[0.08em] hover:border-[#6E6B64] transition-colors flex-shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Demo stage controls — hidden when driven by a real run */}
        <div className="mt-6 flex items-center gap-3 flex-wrap" style={{ display: isLive ? 'none' : undefined }}>
          <p className="text-[13px] text-[#6E6B64]">Pipeline state:</p>
          {stageLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => { setSeqIdx(i); setRunning(false) }}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-[0.08em] transition-colors"
              style={{
                border: `1px solid ${seqIdx === i ? '#43443E' : '#2A2722'}`,
                backgroundColor: seqIdx === i ? '#1A1815' : 'transparent',
                color: seqIdx === i ? '#F5F3EF' : '#6E6B64',
              }}
            >
              {label}
            </button>
          ))}
          {!running && seqIdx < statusSequence.length - 1 && (
            <button
              onClick={() => setRunning(true)}
              className="ml-auto flex items-center gap-1.5 text-[13px] text-[#E7D296] hover:text-[#C9B98A] transition-colors"
            >
              Resume simulation
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ArrowRight({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}