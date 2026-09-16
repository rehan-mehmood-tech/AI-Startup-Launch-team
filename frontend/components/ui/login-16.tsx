'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell, FormMessage, GoogleButton, OrDivider, authInputClass } from '@/components/ui/auth-shared'
import { supabase } from '@/lib/supabase/client'

export default function Login16() {
  const router = useRouter()
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
    router.push('/onboarding')
  }

  async function handleForgot() {
    setError(null)
    if (!email) {
      setNotice('Enter your email above, then click “Forgot?” again.')
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
      <GoogleButton onError={setError} />
      <OrDivider />

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-zinc-200">
            Email
          </label>
          <Input
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
            <label htmlFor="pw" className="text-xs font-medium text-zinc-200">
              Password
            </label>
            <button type="button" onClick={handleForgot} className="text-xs text-zinc-400 hover:text-amber-300">
              Forgot password?
            </button>
          </div>
          <Input
            id="pw"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={authInputClass}
          />
        </div>

        <FormMessage error={error} notice={notice} />

        <Button type="submit" size="lg" disabled={busy} className="mt-1 h-11 w-full rounded-xl font-semibold">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-400">
        New here?{' '}
        <Link href="/signup" className="font-medium text-white underline-offset-4 hover:underline hover:text-amber-300">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
