'use client'

import { useMemo } from 'react'
import Dashboard from '@/components/screens/Dashboard'
import { toDashboardData } from '@/lib/dashboardData'
import { useNavigate } from '@/lib/navigation'
import { useRun } from '@/lib/RunContext'

export default function Page() {
  const navigate = useNavigate()
  const { output } = useRun()
  const data = useMemo(() => (output ? toDashboardData(output) : undefined), [output])

  // With no run in this session the design's own sample report renders —
  // which is exactly what the navbar's "Sample Report" link is for.
  return <Dashboard onNavigate={navigate} data={data} />
}
