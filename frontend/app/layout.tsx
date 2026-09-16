import type { Metadata } from 'next'
import AppShell from '@/components/AppShell'
import { SilkBackground } from '@/components/ui/silk-background-animation'
import { RunProvider } from '@/lib/RunContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Startup Launch Team',
  description:
    'Every claim tested against live market data, unit economics, and startup failure precedent before you write a line of code.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Fixed canvas at z-0; body keeps the #050405 base colour beneath it
            and AppShell stacks above at z-10. */}
        <SilkBackground />
        <RunProvider>
          <AppShell>{children}</AppShell>
        </RunProvider>
      </body>
    </html>
  )
}
