'use client'

import FAQ from '@/components/screens/FAQ'
import { useNavigate } from '@/lib/navigation'

export default function Page() {
  return <FAQ onNavigate={useNavigate()} />
}
