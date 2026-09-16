'use client'

import { useState, useEffect } from 'react'
import { Sparkles, FileText, ChevronRight, Menu, X } from 'lucide-react'
import type { Screen } from '@/lib/navigation'

const navLinks: { label: string; screen: Screen }[] = [
  { label: 'Platform', screen: 'landing' },
  { label: 'Pipeline', screen: 'pipeline' },
  { label: 'Pricing',  screen: 'pricing' },
  { label: 'FAQ',      screen: 'faq' },
]

export default function Navbar({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  return (
    <nav
      className="sticky top-0 z-50 w-full transition-all duration-[250ms]"
      style={{
        backgroundColor: scrolled ? 'rgba(10,9,8,0.92)' : 'rgba(10,9,8,0)',
        borderBottom: scrolled ? '1px solid #2A2722' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 8px 24px rgba(0,0,0,0.20)' : 'none',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-8 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 group"
        >
          <Sparkles size={20} color="#E7D296" strokeWidth={1.5} />
          <span className="text-[15px] font-semibold text-[#F5F3EF] group-hover:text-white transition-colors">
            AI Startup Launch Team
          </span>
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => onNavigate(link.screen)}
              className={`text-[13px] transition-colors duration-150 ${
                screen === link.screen ? 'text-[#F5F3EF]' : 'text-[#A8A49C] hover:text-[#F5F3EF]'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#43443E] text-[13px] font-semibold text-[#F5F3EF] uppercase tracking-[0.08em] hover:border-[#6E6B64] transition-colors duration-150"
          >
            <FileText size={16} strokeWidth={1.5} />
            Sample Report
          </button>
          <button
            onClick={() => onNavigate('onboarding')}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-amber-400 text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-amber-300"
          >
            Start Now
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-[#F5F3EF]"
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#2A2722] bg-[#0A0908] px-8 py-4 flex flex-col gap-4">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => { onNavigate(link.screen); setMobileOpen(false) }}
              className="text-[15px] text-[#A8A49C] hover:text-[#F5F3EF] text-left transition-colors"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { onNavigate('onboarding'); setMobileOpen(false) }}
            className="mt-2 px-5 py-3 rounded-full bg-amber-400 text-[#050405] text-[13px] font-semibold uppercase tracking-[0.08em] text-center"
          >
            Start Validation
          </button>
        </div>
      )}
    </nav>
  )
}