'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell, FormMessage, GoogleButton, OrDivider, authInputClass } from '@/components/ui/auth-shared'
import { supabase } from '@/lib/supabase/client'

export default function Signup() {
  const router = useRouter()
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
    // database_schema.sql copies it into public.profiles.
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
    router.push('/onboarding')
  }

  return (
    <AuthShell title="Create your account" subtitle="Start validating your ideas in minutes">
      <GoogleButton onError={setError} />
      <OrDivider />

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="full-name" className="text-xs font-medium text-zinc-200">
            Full Name
          </label>
          <Input
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
          <label htmlFor="signup-email" className="text-xs font-medium text-zinc-200">
            Email Address
          </label>
          <Input
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
          <label htmlFor="signup-pw" className="text-xs font-medium text-zinc-200">
            Password
          </label>
          <Input
            id="signup-pw"
            type="password"
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

        <Button type="submit" size="lg" disabled={busy} className="mt-1 h-11 w-full rounded-xl font-semibold">
          {busy ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-white underline-offset-4 hover:underline hover:text-amber-300">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
