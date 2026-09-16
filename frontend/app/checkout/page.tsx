'use client'

import Checkout from '@/components/screens/Checkout'
import { useNavigate } from '@/lib/navigation'

export default function Page() {
  return <Checkout onNavigate={useNavigate()} />
}
