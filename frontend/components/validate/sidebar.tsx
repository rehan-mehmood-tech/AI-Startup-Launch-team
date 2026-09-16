'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CheckCircle2, ChevronDown, CircleDashed, LogOut, MessageSquarePlus, Search, Sparkles, X } from 'lucide-react'
import { CHATS_CHANGED, listChats, type ChatSummary } from '@/lib/hitl/chatStore'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { displayName, useSession } from '@/components/validate/session'

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const session = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(true)

  const activeId = pathname.startsWith('/validate/') ? pathname.split('/')[2] : null

  const load = useCallback(async () => {
    try {
      setChats(await listChats())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load chats.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    window.addEventListener(CHATS_CHANGED, load)
    return () => window.removeEventListener(CHATS_CHANGED, load)
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? chats.filter(c => c.title.toLowerCase().includes(q)) : chats
  }, [chats, query])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      {/* Mobile scrim */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn('fixed inset-0 z-40 bg-black/60 md:hidden', open ? 'block' : 'hidden')}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#2A2722] bg-[#0A0908]',
          'md:static md:z-auto md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Chats"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <Link href="/" className="flex min-w-0 items-center gap-2" onClick={onClose}>
            <Sparkles size={18} color="#E7D296" strokeWidth={1.5} className="shrink-0" />
            <span className="truncate text-[14px] font-semibold text-[#F5F3EF]">AI Startup Launch Team</span>
          </Link>
          <button onClick={onClose} className="rounded-md p-1 text-[#A8A49C] hover:text-white md:hidden" aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2 px-3">
          <Link
            href="/validate"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-[#2A2722] px-3 py-2.5 text-[13px] font-medium text-[#F5F3EF] hover:border-[#43443E] hover:bg-[#15130F]"
          >
            <MessageSquarePlus size={16} strokeWidth={1.5} />
            New Chat
          </Link>

          <label className="flex items-center gap-2 rounded-lg bg-[#15130F] px-3 py-2 text-[#6E6B64] focus-within:ring-1 focus-within:ring-[#E7D296]/40">
            <Search size={15} strokeWidth={1.5} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
              className="w-full bg-transparent text-[13px] text-[#F5F3EF] placeholder:text-[#6E6B64] outline-none"
            />
          </label>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-4 flex items-center justify-between px-4 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#6E6B64] hover:text-[#A8A49C]"
          aria-expanded={expanded}
        >
          Recent Chats
          <ChevronDown size={14} className={cn('transition-transform', expanded ? 'rotate-0' : '-rotate-90')} />
        </button>

        <nav className="mt-1 flex-1 overflow-y-auto px-2 pb-3">
          {expanded && (
            <>
              {loading && <p className="px-2 py-2 text-[12px] text-[#6E6B64]">Loading…</p>}
              {error && <p className="px-2 py-2 text-[12px] leading-relaxed text-[#C97A63]">{error}</p>}
              {!loading && !error && filtered.length === 0 && (
                <p className="px-2 py-2 text-[12px] text-[#6E6B64]">{query ? 'No chats match.' : 'No chats yet.'}</p>
              )}
              <ul className="flex flex-col gap-0.5">
                {filtered.map(chat => (
                  <li key={chat.id}>
                    <Link
                      href={`/validate/${chat.id}`}
                      onClick={onClose}
                      title={chat.title}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-2 text-[13px]',
                        chat.id === activeId ? 'bg-[#1F1C17] text-white' : 'text-[#A8A49C] hover:bg-[#15130F] hover:text-[#F5F3EF]'
                      )}
                    >
                      {chat.status === 'completed' ? (
                        <CheckCircle2 size={14} className="shrink-0 text-[#B9C99A]" />
                      ) : (
                        <CircleDashed size={14} className="shrink-0 text-[#6E6B64]" />
                      )}
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-[#2A2722] px-4 py-3">
          <span className="truncate text-[12px] text-[#A8A49C]" title={session.user.email ?? undefined}>
            {displayName(session)}
          </span>
          <button onClick={signOut} className="rounded-md p-1.5 text-[#6E6B64] hover:text-white" aria-label="Log out" title="Log out">
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    </>
  )
}
