'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import ReportView from '@/components/validate/report-view'
import { getSharedReport } from '@/lib/hitl/chatStore'
import type { ReportBundle } from '@/lib/hitl/types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Public, read-only report: no sidebar, no app navigation, no chat history. */
export default function ShareReportPage({ shareId }: { shareId: string }) {
  const [report, setReport] = useState<ReportBundle | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!UUID.test(shareId)) {
      setState('missing')
      return
    }
    let cancelled = false
    getSharedReport(shareId)
      .then(r => {
        if (cancelled) return
        setReport(r)
        setState(r ? 'ready' : 'missing')
      })
      .catch(e => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Could not load this report.')
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [shareId])

  return (
    <div className="relative z-10 min-h-screen bg-[#050405]/80">
      <div className="mx-auto flex max-w-[820px] items-center gap-2 px-4 pt-6 sm:px-8">
        <Link href="/"><Logo size={22} textClassName="text-[14px]" /></Link>
      </div>

      {state === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-32 text-[13px] text-[#8C887F]">
          <Loader2 size={16} className="animate-spin" /> Loading report…
        </div>
      )}
      {(state === 'missing' || state === 'error') && (
        <div className="mx-auto max-w-md px-4 py-32 text-center">
          <h1 className="font-serif text-[30px] text-[#F5F3EF]">{state === 'missing' ? 'Report not found' : 'Something went wrong'}</h1>
          <p className="mt-3 text-[14px] text-[#A8A49C]">
            {state === 'missing' ? 'This link is invalid, or the report is no longer shared.' : error}
          </p>
          <Link href="/" className="mt-6 inline-block text-[13px] text-[#E7D296] underline underline-offset-4">
            Go to AI Startup Launch Team
          </Link>
        </div>
      )}
      {state === 'ready' && report && (
        <ReportView report={report} shareUrl={typeof window !== 'undefined' ? window.location.href : null} />
      )}
    </div>
  )
}
