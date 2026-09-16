'use client'

import { useState } from 'react'
import { GoogleIcon } from '@/components/ui/brand-icons'
import { supabase } from '@/lib/supabase/client'

/** Shared building blocks for the login and signup pages. */

export const authInputClass =
  'h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="relative z-10 flex min-h-[calc(100dvh-80px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950/90 p-7 shadow-2xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-serif text-3xl font-normal text-white">{title}</h1>
          <p className="text-sm text-zinc-300">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-zinc-800" />
      <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">or</span>
      <span className="h-px flex-1 bg-zinc-800" />
    </div>
  )
}

/**
 * Google OAuth via Supabase. Requires the Google provider to be enabled in the
 * Supabase dashboard (Authentication → Providers); until it is, Supabase
 * returns an error, which is surfaced to the user rather than failing silently.
 */
export function GoogleButton({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    })
    if (error) {
      onError(error.message)
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
    >
      <GoogleIcon className="size-4" />
      {busy ? 'Redirecting…' : 'Continue with Google'}
    </button>
  )
}

export function FormMessage({ error, notice }: { error: string | null; notice: string | null }) {
  if (error) {
    return (
      <p role="alert" className="text-xs text-red-300">
        {error}
      </p>
    )
  }
  if (notice) {
    return (
      <p role="status" className="text-xs text-amber-300">
        {notice}
      </p>
    )
  }
  return null
}
