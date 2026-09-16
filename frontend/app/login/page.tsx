import { Suspense } from 'react'
import Login16 from '@/components/ui/login-16'

// useSearchParams (for ?next=) needs a Suspense boundary under the App Router.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Login16 />
    </Suspense>
  )
}
