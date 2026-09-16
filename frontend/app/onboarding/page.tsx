'use client'

import AuthGate from '@/components/AuthGate'
import Onboarding from '@/components/screens/Onboarding'
import { useNavigate } from '@/lib/navigation'
import { useRun } from '@/lib/RunContext'

export default function Page() {
  const navigate = useNavigate()
  const { setAnswers, reset } = useRun()

  return (
    <AuthGate>
      {() => (
        <Onboarding
          onNavigate={navigate}
          onComplete={([idea, industry, audience, stage, growthChannel, concern]) => {
            // Clear any previous report before the new run starts.
            reset()
            setAnswers({ idea, industry, audience, stage, growthChannel, concern })
          }}
        />
      )}
    </AuthGate>
  )
}
