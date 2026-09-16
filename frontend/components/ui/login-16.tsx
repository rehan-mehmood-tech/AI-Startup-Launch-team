'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AuthShell,
  FormMessage,
  GoogleButton,
  OrDivider,
  authButtonClass,
  authInputClass,
  authLabelClass,
  safeNext,
} from '@/components/ui/auth-shared'
import { PasswordInput } from '@/components/ui/password-input'
import { supabase } from '@/lib/supabase/client'

export default function Login16() {
  const router = useRouter()
  const next = safeNext(useSearchParams().get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push(next)
  }

  async function handleForgot() {
    setError(null)
    if (!email) {
      setNotice('Enter your email above, then click “Forgot password?” again.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) setError(error.message)
    else setNotice('If an account exists for that email, a reset link is on its way.')
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your validation account">
      <GoogleButton onError={setError} next={next} />
      <OrDivider />

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={authLabelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={authInputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="pw" className={authLabelClass}>
              Password
            </label>
            <button type="button" onClick={handleForgot} className="text-xs text-[#6E6B64] hover:text-[#E7D296]">
              Forgot password?
            </button>
          </div>
          <PasswordInput
            id="pw"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={authInputClass}
          />
        </div>

        <FormMessage error={error} notice={notice} />

        <button type="submit" disabled={busy} className={authButtonClass}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-[#6E6B64]">
        New here?{' '}
        <Link
          href={next === '/validate' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`}
          className="font-medium text-[#F5F3EF] underline-offset-4 hover:text-[#E7D296] hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
