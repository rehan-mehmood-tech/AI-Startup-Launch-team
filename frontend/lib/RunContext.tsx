'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { OnboardingAnswers } from '@/lib/runMapping'
import type { OrchestratorOutput } from '@/lib/types'

export type RunStatus = 'idle' | 'running' | 'done' | 'error'

interface RunState {
  answers: OnboardingAnswers | null
  output: OrchestratorOutput | null
  status: RunStatus
  error: string | null
}

interface RunContextValue extends RunState {
  /** False until sessionStorage has been read. Consumers must not act on a
   * null `answers`/`output` before this flips, or they'll redirect away on
   * a hard refresh while the saved run is still loading. */
  hydrated: boolean
  setAnswers: (a: OnboardingAnswers) => void
  setStatus: (s: RunStatus) => void
  setOutput: (o: OrchestratorOutput) => void
  setError: (e: string | null) => void
  reset: () => void
}

const EMPTY: RunState = { answers: null, output: null, status: 'idle', error: null }
const STORAGE_KEY = 'aislt.run'

const RunContext = createContext<RunContextValue | null>(null)

/**
 * The Figma design kept everything in one component's useState. With real
 * App Router routes, onboarding → pipeline → dashboard are separate pages,
 * so the run has to survive navigation — this holds it, and mirrors to
 * sessionStorage so a refresh on /dashboard doesn't lose the report.
 */
export function RunProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RunState>(EMPTY)
  const [hydrated, setHydrated] = useState(false)

  // Rehydrate once on mount (client-only; avoids SSR/hydration mismatch).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) setState(JSON.parse(raw) as RunState)
    } catch {
      /* storage unavailable or corrupt — start clean */
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    try {
      if (state === EMPTY) return
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* non-fatal */
    }
  }, [state])

  const setAnswers = useCallback((answers: OnboardingAnswers) => setState(s => ({ ...s, answers })), [])
  const setStatus = useCallback((status: RunStatus) => setState(s => ({ ...s, status })), [])
  const setOutput = useCallback((output: OrchestratorOutput) => setState(s => ({ ...s, output, status: 'done', error: null })), [])
  const setError = useCallback((error: string | null) => setState(s => ({ ...s, error, status: error ? 'error' : s.status })), [])
  const reset = useCallback(() => {
    setState(EMPTY)
    try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* non-fatal */ }
  }, [])

  const value = useMemo<RunContextValue>(
    () => ({ ...state, hydrated, setAnswers, setStatus, setOutput, setError, reset }),
    [state, hydrated, setAnswers, setStatus, setOutput, setError, reset]
  )

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>
}

export function useRun(): RunContextValue {
  const ctx = useContext(RunContext)
  if (!ctx) throw new Error('useRun must be used inside <RunProvider>')
  return ctx
}
