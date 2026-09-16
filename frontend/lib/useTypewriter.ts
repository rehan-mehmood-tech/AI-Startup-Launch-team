'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface TypewriterOptions {
  typeMs?: number
  deleteMs?: number
  /** Hold time once a phrase is fully typed. */
  pauseMs?: number
  /** Gap after a phrase is fully deleted, before the next one starts. */
  gapMs?: number
}

/**
 * Types a phrase, holds it, deletes it, then moves to the next — looping
 * forever. Users with prefers-reduced-motion get the first phrase shown in
 * full with no typing loop.
 */
export function useTypewriter(
  phrases: string[],
  { typeMs = 45, deleteMs = 22, pauseMs = 1800, gapMs = 400 }: TypewriterOptions = {}
): string {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (reducedMotion || phrases.length === 0) return

    const full = phrases[index % phrases.length]
    let timer: ReturnType<typeof setTimeout>

    if (!deleting && text.length < full.length) {
      timer = setTimeout(() => setText(full.slice(0, text.length + 1)), typeMs)
    } else if (!deleting && text.length === full.length) {
      timer = setTimeout(() => setDeleting(true), pauseMs)
    } else if (deleting && text.length > 0) {
      timer = setTimeout(() => setText(full.slice(0, text.length - 1)), deleteMs)
    } else {
      timer = setTimeout(() => {
        setDeleting(false)
        setIndex(i => (i + 1) % phrases.length)
      }, gapMs)
    }

    return () => clearTimeout(timer)
  }, [text, deleting, index, phrases, reducedMotion, typeMs, deleteMs, pauseMs, gapMs])

  return reducedMotion ? phrases[0] ?? '' : text
}
