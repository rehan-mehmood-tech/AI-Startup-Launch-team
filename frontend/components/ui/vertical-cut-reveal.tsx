'use client'

import { motion, type Transition } from 'framer-motion'
import { cn } from '@/lib/utils'

type VerticalCutRevealProps = {
  children: string
  splitBy?: 'words' | 'characters'
  staggerDuration?: number
  staggerFrom?: 'first' | 'last' | 'center'
  /** Slide in from above instead of below. */
  reverse?: boolean
  transition?: Transition
  containerClassName?: string
  elementLevelClassName?: string
}

/**
 * Splits text into words (or characters) and slides each one in from behind a
 * clipping mask, staggered. Screen readers get the plain string via sr-only.
 */
export function VerticalCutReveal({
  children,
  splitBy = 'words',
  staggerDuration = 0.04,
  staggerFrom = 'first',
  reverse = false,
  transition = { type: 'spring', stiffness: 250, damping: 40 },
  containerClassName,
  elementLevelClassName,
}: VerticalCutRevealProps) {
  const parts = splitBy === 'words' ? children.split(' ') : Array.from(children)
  const count = parts.length

  const delayFor = (i: number) => {
    const base = typeof transition.delay === 'number' ? transition.delay : 0
    if (staggerFrom === 'last') return base + (count - 1 - i) * staggerDuration
    if (staggerFrom === 'center') return base + Math.abs(Math.floor(count / 2) - i) * staggerDuration
    return base + i * staggerDuration
  }

  return (
    <span className={cn('flex flex-wrap', containerClassName)}>
      <span className="sr-only">{children}</span>
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} aria-hidden="true" className="inline-flex overflow-hidden">
          <motion.span
            className={cn('inline-block', elementLevelClassName)}
            initial={{ y: reverse ? '-100%' : '100%' }}
            animate={{ y: 0 }}
            transition={{ ...transition, delay: delayFor(i) }}
          >
            {part}
          </motion.span>
          {splitBy === 'words' && i < count - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </span>
  )
}

export default VerticalCutReveal
