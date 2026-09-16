'use client'

import { Suspense } from 'react'
import Checkout from '@/components/screens/Checkout'
import { useNavigate } from '@/lib/navigation'

// Checkout reads ?plan & ?billing via useSearchParams, which Next requires to
// sit inside a Suspense boundary or the static build fails.
export default function Page() {
  const navigate = useNavigate()
  return (
    <Suspense fallback={null}>
      <Checkout onNavigate={navigate} />
    </Suspense>
  )
}
