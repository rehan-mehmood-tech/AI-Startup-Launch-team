'use client'

import { useState } from 'react'
import { GoogleIcon } from '@/components/ui/brand-icons'
import { supabase } from '@/lib/supabase/client'

/** Shared building blocks for the login and signup pages, on the global
 * obsidian + champagne palette. */

export const authInputClass =
  'h-11 w-full rounded-xl border border-[#2A2722] bg-[#0A0908] px-3.5 text-sm text-[#F5F3EF] placeholder:text-[#6E6B64] outline-none transition-colors focus:border-[#E7D296] focus:ring-2 focus:ring-[#E7D296]/15'

export const authLabelClass = 'text-xs font-medium text-[#A8A49C]'

export const authButtonClass =
  'mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E7D296] text-sm font-semibold text-[#050405] transition-colors hover:bg-[#F0DFAE] disabled:cursor-not-allowed disabled:opacity-60'

/** Only same-site relative paths are honored, so `?next=` can't redirect off-site. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/validate'
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="relative z-10 flex min-h-[calc(100dvh-80px)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[#2A2722] bg-[#0A0908]/95 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)] sm:p-7">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-serif text-3xl font-normal text-[#F5F3EF]">{title}</h1>
          <p className="text-sm text-[#A8A49C]">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-[#2A2722]" />
      <span className="text-[11px] font-medium uppercase tracking-widest text-[#6E6B64]">or</span>
      <span className="h-px flex-1 bg-[#2A2722]" />
    </div>
  )
}

/**
 * Google OAuth via Supabase. Requires the Google provider to be enabled in the
 * Supabase dashboard (Authentication → Providers); until it is, Supabase
 * returns an error, which is surfaced to the user rather than failing silently.
 */
export function GoogleButton({ onError, next = '/validate' }: { onError: (message: string) => void; next?: string }) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    try {
      const targetPath = next && next.startsWith('/') ? next : '/validate'
      const redirectTo = `${window.location.origin}${targetPath}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })
      if (error) {
        onError(error.message)
        setBusy(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during Google sign in.'
      onError(message)
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#2A2722] bg-[#15130F] px-4 text-sm font-medium text-[#F5F3EF] transition-colors hover:border-[#43443E] hover:bg-[#1F1C17] disabled:opacity-60"
    >
      <GoogleIcon className="size-4" />
      {busy ? 'Redirecting…' : 'Continue with Google'}
    </button>
  )
}

export function FormMessage({ error, notice }: { error: string | null; notice: string | null }) {
  if (error) {
    return (
      <p role="alert" className="text-xs text-[#E3A28C]">
        {error}
      </p>
    )
  }
  if (notice) {
    return (
      <p role="status" className="text-xs text-[#E7D296]">
        {notice}
      </p>
    )
  }
  return null
}
