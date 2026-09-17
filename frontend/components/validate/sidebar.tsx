'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Loader2,
  LogOut,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { CHATS_CHANGED, deleteChat, listChats, renameChat, type ChatSummary } from '@/lib/hitl/chatStore'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Logo, LogoMark } from '@/components/ui/logo'
import { displayName, useSession } from '@/components/validate/session'

function ChatItem({
  chat,
  active,
  onNavigate,
  onDeleted,
}: {
  chat: ChatSummary
  active: boolean
  onNavigate: () => void
  onDeleted: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [title, setTitle] = useState(chat.title)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setTitle(chat.title), [chat.title])

  // Close the action menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function saveRename() {
    const next = title.trim()
    if (!next || next === chat.title) {
      setRenaming(false)
      setTitle(chat.title)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await renameChat(chat.id, next)
      setRenaming(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rename failed.')
    } finally {
      setBusy(false)
    }
  }

  async function doDelete() {
    setBusy(true)
    setError(null)
    try {
      await deleteChat(chat.id)
      onDeleted(chat.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.')
      setBusy(false)
    }
  }

  if (renaming) {
    return (
      <li className="px-1 py-1">
        <form
          className="flex items-center gap-1"
          onSubmit={e => {
            e.preventDefault()
            void saveRename()
          }}
        >
          <input
            autoFocus
            value={title}
            maxLength={120}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setRenaming(false)
                setTitle(chat.title)
              }
            }}
            aria-label="Chat title"
            className="min-w-0 flex-1 rounded-md border border-amber-400/60 bg-black/50 px-2 py-1.5 text-[13px] text-white outline-none"
          />
          <button type="submit" disabled={busy} className="rounded p-1 text-amber-400 hover:text-amber-300" aria-label="Save title">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setRenaming(false)
              setTitle(chat.title)
            }}
            className="rounded p-1 text-[#8C887F] hover:text-white"
            aria-label="Cancel rename"
          >
            <X size={14} />
          </button>
        </form>
        {error && <p className="px-1 pt-1 text-[11px] text-[#E3A28C]">{error}</p>}
      </li>
    )
  }

  return (
    <li className="relative">
      <div
        className={cn(
          'group flex items-center rounded-lg',
          active ? 'bg-white/[0.08] text-white' : 'text-[#A8A49C] hover:bg-white/[0.04] hover:text-[#F5F3EF]'
        )}
      >
        <Link href={`/validate/${chat.id}`} onClick={onNavigate} title={chat.title} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-[13px]">
          {chat.status === 'completed' ? (
            <CheckCircle2 size={14} className="shrink-0 text-[#B9C99A]" />
          ) : (
            <CircleDashed size={14} className="shrink-0 text-[#6E6B64]" />
          )}
          <span className="truncate">{chat.title}</span>
        </Link>
        <button
          onClick={() => {
            setMenuOpen(o => !o)
            setConfirmDelete(false)
          }}
          aria-label={`Actions for ${chat.title}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={cn(
            'mr-1 rounded-md p-1 text-[#8C887F] hover:bg-white/10 hover:text-white',
            menuOpen || active ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100'
          )}
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-1 top-9 z-20 w-44 rounded-lg border border-white/10 bg-[#141210]/95 p-1 shadow-2xl backdrop-blur-xl"
        >
          {!confirmDelete ? (
            <>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setRenaming(true)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-[#F5F3EF] hover:bg-white/[0.06]"
              >
                <Pencil size={13} /> Rename
              </button>
              <button
                role="menuitem"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-[#E3A28C] hover:bg-[#C97A63]/10"
              >
                <Trash2 size={13} /> Delete
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 p-1.5">
              <p className="text-[12px] leading-snug text-[#D6D2C9]">Delete this chat and all its messages? This can&apos;t be undone.</p>
              <div className="flex justify-end gap-1.5">
                <button onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-1 text-[12px] text-[#A8A49C] hover:text-white">
                  Cancel
                </button>
                <button
                  onClick={doDelete}
                  disabled={busy}
                  className="flex items-center gap-1 rounded-md bg-[#C97A63] px-2 py-1 text-[12px] font-semibold text-[#050405] hover:bg-[#D98B74] disabled:opacity-60"
                >
                  {busy && <Loader2 size={11} className="animate-spin" />} Delete
                </button>
              </div>
            </div>
          )}
          {error && <p className="px-2 pb-1.5 text-[11px] text-[#E3A28C]">{error}</p>}
        </div>
      )}
    </li>
  )
}

export default function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
}: {
  open: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
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

  function handleDeleted(id: string) {
    setChats(prev => prev.filter(c => c.id !== id))
    if (id === activeId) router.push('/validate')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Desktop collapsed rail.
  const rail = (
    <aside className="hidden w-[60px] shrink-0 flex-col items-center gap-2 border-r border-white/10 bg-[#0A0908]/70 py-4 backdrop-blur-xl lg:flex" aria-label="Chats (collapsed)">
      <Link href="/" aria-label="Home" className="mb-2">
        <LogoMark size={26} />
      </Link>
      <button onClick={onToggleCollapsed} className="rounded-lg p-2 text-[#A8A49C] hover:bg-white/[0.06] hover:text-white" aria-label="Expand sidebar" title="Expand sidebar">
        <PanelLeftOpen size={18} strokeWidth={1.5} />
      </button>
      <Link href="/validate" className="rounded-lg p-2 text-[#A8A49C] hover:bg-white/[0.06] hover:text-white" aria-label="New chat" title="New chat">
        <MessageSquarePlus size={18} strokeWidth={1.5} />
      </Link>
      <div className="flex-1" />
      <button onClick={signOut} className="rounded-lg p-2 text-[#6E6B64] hover:text-white" aria-label="Log out" title="Log out">
        <LogOut size={17} strokeWidth={1.5} />
      </button>
    </aside>
  )

  return (
    <>
      {collapsed && rail}

      {/* Mobile scrim */}
      <div onClick={onClose} aria-hidden className={cn('fixed inset-0 z-40 bg-black/60 lg:hidden', open ? 'block' : 'hidden')} />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[300px] lg:w-[280px] flex-col transition-transform duration-300 ease-out motion-reduce:transition-none border-r border-white/10 bg-[#0A0908]/95 backdrop-blur-xl lg:bg-[#0A0908]/70',
          'lg:static lg:z-auto lg:translate-x-0',
          open ? 'flex translate-x-0' : 'flex -translate-x-full',
          collapsed && 'lg:hidden'
        )}
        aria-label="Chats"
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <Link href="/" className="min-w-0" onClick={onClose}>
            <Logo size={24} textClassName="text-[14px]" />
          </Link>
          <button onClick={onClose} className="rounded-md p-1 text-[#A8A49C] hover:text-white lg:hidden" aria-label="Close sidebar">
            <X size={18} />
          </button>
          <button
            onClick={onToggleCollapsed}
            className="hidden rounded-md p-1 text-[#8C887F] hover:bg-white/[0.06] hover:text-white lg:block"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-2 px-3">
          <Link
            href="/validate"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2.5 text-[13px] font-semibold text-[#050405] hover:bg-amber-300"
          >
            <MessageSquarePlus size={16} strokeWidth={1.8} />
            New Chat
          </Link>

          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[#6E6B64] focus-within:border-amber-400/50">
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
                  <ChatItem key={chat.id} chat={chat} active={chat.id === activeId} onNavigate={onClose} onDeleted={handleDeleted} />
                ))}
              </ul>
            </>
          )}
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
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
