'use client'

import { motion, useInView, type Variants } from 'framer-motion'
import { useMemo, type ElementType, type ReactNode, type RefObject } from 'react'

type TimelineContentProps = {
  as?: ElementType
  animationNum: number
  timelineRef: RefObject<HTMLElement | null>
  customVariants?: Variants
  className?: string
  children?: ReactNode
}

const defaultVariants: Variants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { delay: i * 0.08, duration: 0.3 },
  }),
  hidden: { y: -16, opacity: 0, filter: 'blur(8px)' },
}

/**
 * Reveals its children once the shared `timelineRef` container scrolls into
 * view, staggered by `animationNum`.
 */
export function TimelineContent({
  as = 'div',
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
}: TimelineContentProps) {
  const isInView = useInView(timelineRef as RefObject<Element>, { once: true, amount: 0.1 })
  // Memoised: creating the motion component during render would remount
  // it (and restart the animation) on every re-render.
  const MotionTag = useMemo(() => motion.create(as as 'div'), [as])

  return (
    <MotionTag
      className={className}
      custom={animationNum}
      variants={customVariants ?? defaultVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {children}
    </MotionTag>
  )
}

export default TimelineContent
