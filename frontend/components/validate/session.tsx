'use client'

import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

const SessionContext = createContext<Session | null>(null)

export const SessionProvider = SessionContext.Provider

/** The signed-in session; /validate's layout only renders children once one exists. */
export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside the /validate layout')
  return session
}

export function displayName(session: Session): string {
  const meta = session.user.user_metadata as { full_name?: string; name?: string } | undefined
  return meta?.full_name?.trim() || meta?.name?.trim() || session.user.email || 'Founder'
}
