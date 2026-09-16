import { Suspense } from 'react'
import Signup from '@/components/ui/signup'

// useSearchParams (for ?next=) needs a Suspense boundary under the App Router.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Signup />
    </Suspense>
  )
}
