import * as React from 'react'
import { cn } from '@/lib/utils'

// Lightweight shadcn-compatible Separator (no Radix dependency needed for a
// purely decorative rule).
export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <div
      role="none"
      className={cn('shrink-0 bg-zinc-800', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)}
      {...props}
    />
  )
}
