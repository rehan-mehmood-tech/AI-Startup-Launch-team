'use client'

import Landing from '@/components/screens/Landing'
import { useNavigate } from '@/lib/navigation'

export default function Page() {
  return <Landing onNavigate={useNavigate()} />
}
