'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ShimmerTextProps {
  children: React.ReactNode
  className?: string
  duration?: number
  delay?: number
}

// Rendered as spans rather than divs so it can sit inside headings and
// paragraphs without producing invalid HTML (block elements in an <h1>).
export function ShimmerText({ children, className, duration = 2.5, delay = 0.5 }: ShimmerTextProps) {
  return (
    <span className="inline-block overflow-hidden">
      <motion.span
        className={cn(
          'inline-block [--shimmer-contrast:rgba(255,255,255,0.9)] text-amber-300 font-serif',
          className
        )}
        style={
          {
            WebkitTextFillColor: 'transparent',
            background:
              'currentColor linear-gradient(to right, currentColor 0%, var(--shimmer-contrast) 50%, currentColor 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '60% 200%',
          } as React.CSSProperties
        }
        initial={{ backgroundPositionX: '-150%' }}
        animate={{ backgroundPositionX: ['-150%', '250%'] }}
        transition={{ duration, delay, repeat: Infinity, repeatDelay: 1, ease: 'linear' }}
      >
        <span>{children}</span>
      </motion.span>
    </span>
  )
}

export default ShimmerText
