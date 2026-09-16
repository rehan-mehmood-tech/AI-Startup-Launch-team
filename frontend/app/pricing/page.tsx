'use client'

import Checkout from '@/components/screens/Checkout'
import { useNavigate } from '@/lib/navigation'

/** Pricing lives on its own route; it renders the same panel as /checkout. */
export default function Page() {
  return <Checkout onNavigate={useNavigate()} />
}
