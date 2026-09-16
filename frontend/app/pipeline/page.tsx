'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import AuthGate from '@/components/AuthGate'
import Pipeline from '@/components/screens/Pipeline'
import { ApiError, runOrchestratorPipeline } from '@/lib/api'
import { useNavigate } from '@/lib/navigation'
import { useRun } from '@/lib/RunContext'
import { buildOrchestratorInput } from '@/lib/runMapping'

type AgentStatus = 'pending' | 'active' | 'complete' | 'degraded' | 'failed'

/** design node index → key in the backend's compiled_dashboard */
const STAGE_KEYS = ['market_research', 'product_strategy', 'pricing', 'marketing'] as const

/** The backend runs all five agents behind a single request and reports no
 * incremental progress, so the rail advances on a timer while the call is in
 * flight. Final per-node states below come from the real response — only the
 * intermediate timing is an approximation. */
const SIMULATED_STAGE_MS = 20000

/** Grace period so the last node visibly flips to complete before routing. */
const AUTO_REDIRECT_MS = 2500

function fmt(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

function PipelineRunner({ session }: { session: Session }) {
  const navigate = useNavigate()
  const { answers, output, status, error, hydrated, setStatus, setOutput, setError } = useRun()

  const [statuses, setStatuses] = useState<AgentStatus[]>(['active', 'pending', 'pending', 'pending', 'pending'])
  const [elapsed, setElapsed] = useState<(string | null)[]>([null, null, null, null, null])

  const startedAt = useRef<number>(0)
  const stageStart = useRef<number>(0)
  const advanceRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeIdx = useRef(0)
  const launched = useRef(false)

  const stopTimers = useCallback(() => {
    if (advanceRef.current) clearInterval(advanceRef.current)
    if (tickRef.current) clearInterval(tickRef.current)
    advanceRef.current = null
    tickRef.current = null
  }, [])

  const run = useCallback(async () => {
    if (!answers) return
    stopTimers()
    setError(null)
    setStatus('running')
    startedAt.current = Date.now()
    stageStart.current = Date.now()
    activeIdx.current = 0
    setStatuses(['active', 'pending', 'pending', 'pending', 'pending'])
    setElapsed([null, null, null, null, null])

    // Live timer on the active node.
    tickRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = [...prev]
        next[activeIdx.current] = fmt(Date.now() - stageStart.current)
        return next
      })
    }, 1000)

    // Advance the rail while the single request is in flight.
    advanceRef.current = setInterval(() => {
      const i = activeIdx.current
      if (i >= 4) return
      setElapsed(prev => {
        const next = [...prev]
        next[i] = fmt(Date.now() - stageStart.current)
        return next
      })
      setStatuses(prev => {
        const next = [...prev]
        next[i] = 'complete'
        next[i + 1] = 'active'
        return next
      })
      activeIdx.current = i + 1
      stageStart.current = Date.now()
    }, SIMULATED_STAGE_MS)

    try {
      const result = await runOrchestratorPipeline(buildOrchestratorInput(session.user.id, answers))
      stopTimers()

      // Real per-agent outcomes from the response.
      const finalStatuses: AgentStatus[] = STAGE_KEYS.map(key => {
        const stage = result.compiled_dashboard[key] as Record<string, unknown> | undefined
        const s = stage?.status
        if (s === 'skipped') return 'failed'
        if (s === 'unavailable') return 'degraded'
        return 'complete'
      })
      finalStatuses.push('complete') // orchestrator synthesised the verdict

      const total = Date.now() - startedAt.current
      setStatuses(finalStatuses)
      setElapsed(prev => prev.map((v, i) => (i === 4 ? fmt(total) : v ?? fmt(SIMULATED_STAGE_MS))))
      setOutput(result)
    } catch (err) {
      stopTimers()
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unknown error'
      setStatuses(prev => prev.map(s => (s === 'active' ? 'failed' : s)))
      setError(message)
    }
  }, [answers, session.user.id, setError, setOutput, setStatus, stopTimers])

  // Kick off exactly once per visit (unless a finished report is already held).
  // Waits for `hydrated` so a hard refresh doesn't bounce to /onboarding while
  // the saved run is still being read out of sessionStorage.
  useEffect(() => {
    if (!hydrated) return
    if (!answers) { navigate('onboarding'); return }
    if (launched.current) return
    launched.current = true
    if (output && status === 'done') {
      setStatuses(['complete', 'complete', 'complete', 'complete', 'complete'])
      return
    }
    void run()
  }, [hydrated, answers, output, status, run, navigate])

  // Only stop timers when the component really goes away. (Previously this
  // cleanup also fired on React StrictMode's dev double-mount, which killed
  // the rail's timers while `launched` stayed true — so the pipeline sat on
  // step 1 for the whole run instead of advancing.)
  useEffect(() => () => stopTimers(), [stopTimers])

  const isComplete = status === 'done'
  const ideaLine = answers?.idea ?? ''

  // Auto-advance to the report once the verdict is in, leaving a moment to
  // see the final node flip to complete. Cancelled if the user clicks first.
  useEffect(() => {
    if (!isComplete) return
    const t = setTimeout(() => navigate('dashboard'), AUTO_REDIRECT_MS)
    return () => clearTimeout(t)
  }, [isComplete, navigate])

  return (
    <Pipeline
      onNavigate={navigate}
      liveStatuses={statuses}
      liveElapsed={elapsed}
      liveComplete={isComplete}
      error={error}
      onRetry={() => void run()}
      title={ideaLine.length > 80 ? `${ideaLine.slice(0, 80)}…` : ideaLine || 'Your validation run'}
      subtitle={answers ? [answers.industry, answers.audience, answers.stage].filter(Boolean).join(' · ') : undefined}
    />
  )
}

export default function Page() {
  return <AuthGate>{session => <PipelineRunner session={session} />}</AuthGate>
}
