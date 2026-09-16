'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useCurrentScreen, useNavigate } from '@/lib/navigation'

/**
 * Port of the Figma export's App.tsx chrome — same markup, same scroll
 * progress bar, same background. The only change is that the screen switch
 * (`{screen === 'landing' && <Landing/>}` …) is replaced by `{children}`,
 * since App Router renders the active route for us.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const screen = useCurrentScreen()
  const navigate = useNavigate()
  const pathname = usePathname()
  const [scrollPct, setScrollPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setScrollPct(total > 0 ? (window.scrollY / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reset scroll on screen change
  useEffect(() => {
    window.scrollTo(0, 0)
    setScrollPct(0)
  }, [pathname])

  // The app workspace and public shared reports carry their own chrome.
  const bare = pathname.startsWith('/validate') || pathname.startsWith('/report/share')
  if (bare) return <>{children}</>

  return (
    // Transparent + z-10 so the fixed SilkBackground canvas (z-0) shows
    // through. The page's base colour now comes from body in globals.css.
    <div className="relative z-10 min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar screen={screen} onNavigate={navigate} />

      {children}

      {/* Scroll progress bar — fixed bottom, matches onboarding step bar */}
      <div className="fixed bottom-0 left-0 right-0 h-[3px] bg-[#2A2722] z-50 pointer-events-none">
        <div
          className="h-full bg-[#E7D296] rounded-full"
          style={{ width: `${scrollPct}%`, transition: 'width 100ms linear' }}
        />
      </div>
    </div>
  )
}
