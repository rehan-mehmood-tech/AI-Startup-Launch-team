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

export default function Signup() {
  const router = useRouter()
  const next = safeNext(useSearchParams().get('next'))
  const [fullName, setFullName] = useState('')
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

    // full_name is stored in auth metadata; the handle_new_user() trigger in
    // database_schema.sql copies it into public.profiles. The PDF header uses it.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    setBusy(false)

    if (error) {
      setError(error.message)
      return
    }
    if (!data.session) {
      // Email confirmation is enabled on the project.
      setNotice('Check your inbox to confirm your email, then sign in.')
      return
    }
    router.push(next)
  }

  return (
    <AuthShell title="Create your account" subtitle="Start validating your ideas in minutes">
      <GoogleButton onError={setError} next={next} />
      <OrDivider />

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="full-name" className={authLabelClass}>
            Full Name
          </label>
          <input
            id="full-name"
            autoComplete="name"
            required
            placeholder="Ada Lovelace"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className={authInputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-email" className={authLabelClass}>
            Email Address
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-pw" className={authLabelClass}>
            Password
          </label>
          <PasswordInput
            id="signup-pw"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={authInputClass}
          />
        </div>

        <FormMessage error={error} notice={notice} />

        <button type="submit" disabled={busy} className={authButtonClass}>
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-[#6E6B64]">
        Already have an account?{' '}
        <Link
          href={next === '/validate' ? '/login' : `/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-[#F5F3EF] underline-offset-4 hover:text-[#E7D296] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
