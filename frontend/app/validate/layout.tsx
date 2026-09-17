'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2, Menu } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import type { Session } from '@supabase/supabase-js'
import Sidebar from '@/components/validate/sidebar'
import { SessionProvider } from '@/components/validate/session'
import { supabase } from '@/lib/supabase/client'

export default function ValidateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [checked, setChecked] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Remember the desktop sidebar preference per browser (best effort).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('validate:sidebar-collapsed') === '1')
    } catch {
      /* storage unavailable */
    }
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem('validate:sidebar-collapsed', next ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (checked && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
  }, [checked, session, pathname, router])

  useEffect(() => setDrawerOpen(false), [pathname])

  if (!checked || !session) {
    return (
      <div className="relative z-10 flex h-dvh items-center justify-center gap-2 bg-[#050405]/60 text-[13px] text-[#8C887F]">
        <Loader2 size={16} className="animate-spin" /> {checked ? 'Redirecting to sign in…' : 'Loading…'}
      </div>
    )
  }

  return (
    <SessionProvider value={session}>
      <div className="relative z-10 flex h-dvh overflow-hidden bg-[#050405]/60 text-[#F5F3EF]">
        <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#0A0908]/70 px-3 py-2.5 backdrop-blur-xl lg:hidden">
            <button onClick={() => setDrawerOpen(true)} className="rounded-md p-1.5 text-[#A8A49C] hover:text-white" aria-label="Open chats">
              <Menu size={20} />
            </button>
            <Logo size={22} textClassName="text-[13px]" />
          </div>
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
