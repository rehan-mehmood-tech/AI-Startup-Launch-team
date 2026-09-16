'use client'

import { useEffect, useState } from 'react'
import { Lock, LogIn } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

/**
 * The Figma design has no auth screen, but the backend requires a real
 * Supabase `auth.users` id (workspaces.owner_id is a NOT NULL foreign key),
 * so a run can't start signed out. This is built from the same design
 * tokens as the onboarding chat card so it doesn't read as foreign.
 */
export default function AuthGate({ children }: { children: (session: Session) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function submit() {
    setBusy(true)
    setError(null)
    setNotice(null)
    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    if (mode === 'signup' && !result.data.session) {
      setNotice('Check your email to confirm your account, then sign in.')
      setMode('login')
      return
    }
    setSession(result.data.session)
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-[13px] text-[#6E6B64]">Loading…</p>
      </div>
    )
  }

  if (session) return <>{children(session)}</>

  const inputCls =
    'w-full bg-[#0A0908] border border-zinc-700 rounded-lg px-4 py-3 text-[15px] text-white placeholder-zinc-300 outline-none transition-all duration-150'
  const focusOn = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#E7D296'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(231,210,150,0.08)'
  }
  const focusOff = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#2A2722'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[460px]">
        <div className="mb-6">
          <span className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-[0.12em]">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-700 bg-zinc-950/90 p-8 flex flex-col gap-5">
          <div className="flex gap-3 items-start">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ border: '1.5px solid #E7D296' }}
            >
              <Lock size={13} color="#E7D296" strokeWidth={1.5} />
            </div>
            <div className="bg-zinc-900/95 rounded-xl rounded-tl-none px-4 py-3 max-w-[85%]">
              <p className="text-[15px] text-white leading-[150%]">
                Your validation run is saved to your workspace, so we need an account first.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@startup.com"
              className={inputCls}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              onFocus={focusOn}
              onBlur={focusOff}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••••••"
              className={inputCls}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              onFocus={focusOn}
              onBlur={focusOff}
            />

            {error && <p className="text-[13px]" style={{ color: '#C97A63' }}>{error}</p>}
            {notice && <p className="text-[13px]" style={{ color: '#D9B36C' }}>{notice}</p>}

            <button
              onClick={submit}
              disabled={busy || !email || !password}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150 mt-1"
              style={{
                backgroundColor: busy || !email || !password ? '#1A1815' : '#E7D296',
                color: busy || !email || !password ? '#43443E' : '#050405',
                cursor: busy || !email || !password ? 'default' : 'pointer',
              }}
            >
              <LogIn size={16} strokeWidth={1.5} />
              {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            <button
              onClick={() => { setMode(m => (m === 'login' ? 'signup' : 'login')); setError(null); setNotice(null) }}
              className="text-[13px] text-[#6E6B64] hover:text-[#A8A49C] transition-colors"
            >
              {mode === 'login' ? 'No account? Create one' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
