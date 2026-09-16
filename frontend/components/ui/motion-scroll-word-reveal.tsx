'use client'

import { Fragment, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

const REST_OPACITY = 0.2
const REVEAL_SPAN = 0.8
const WORD_WINDOW = 0.2

function getWordRange(index: number, count: number) {
  const start = count <= 1 ? 0 : (index / (count - 1)) * REVEAL_SPAN
  return { start, end: Math.min(1, start + WORD_WINDOW) }
}

export function getWordOpacity(
  progress: number,
  { start, end }: { start: number; end: number },
  rest = REST_OPACITY
) {
  if (progress <= start) return rest
  if (progress >= end) return 1
  const t = (progress - start) / (end - start)
  return rest + (1 - rest) * t
}

function Word({
  children,
  progress,
  index,
  count,
  reducedMotion,
}: {
  children: string
  progress: MotionValue<number>
  index: number
  count: number
  reducedMotion: boolean
}) {
  const range = getWordRange(index, count)
  const opacity = useTransform(progress, (value: number) => getWordOpacity(value, range))

  return (
    <motion.span aria-hidden="true" style={reducedMotion ? undefined : { opacity }}>
      {children}
    </motion.span>
  )
}

export function ScrollWordReveal({
  text,
  className = '',
  headingClassName,
}: {
  text: string
  className?: string
  /** Overrides the default heading styles (size/colour/leading). */
  headingClassName?: string
}) {
  const targetRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start 0.8', 'end 0.2'],
  })
  const words = text.split(' ')

  return (
    <div ref={targetRef} className={cn('relative py-8', className)}>
      <h2
        className={cn(
          'text-2xl sm:text-4xl font-serif text-amber-300 leading-relaxed font-normal',
          headingClassName
        )}
      >
        {/* Every animated word is aria-hidden (so screen readers don't read a
            string of fragments), which would leave the heading with no
            accessible name at all — this carries the real text instead. */}
        <span className="sr-only">{text}</span>
        {words.map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            <Word progress={scrollYProgress} index={index} count={words.length} reducedMotion={!!reducedMotion}>
              {word}
            </Word>
            {index < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </h2>
    </div>
  )
}

export default ScrollWordReveal
