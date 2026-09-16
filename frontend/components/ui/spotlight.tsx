'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform, type SpringOptions } from 'framer-motion'
import { cn } from '@/lib/utils'

type SpotlightProps = {
  className?: string
  size?: number
  springOptions?: SpringOptions
}

export function Spotlight({ className, size = 200, springOptions = { bounce: 0 } }: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null)

  const mouseX = useSpring(0, springOptions)
  const mouseY = useSpring(0, springOptions)

  const spotlightLeft = useTransform(mouseX, (x: number) => `${x - size / 2}px`)
  const spotlightTop = useTransform(mouseY, (y: number) => `${y - size / 2}px`)

  useEffect(() => {
    const parent = containerRef.current?.parentElement
    if (!parent) return
    parent.style.position = 'relative'
    parent.style.overflow = 'hidden'
    setParentElement(parent)
  }, [])

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!parentElement) return
      const { left, top } = parentElement.getBoundingClientRect()
      mouseX.set(event.clientX - left)
      mouseY.set(event.clientY - top)
    },
    [mouseX, mouseY, parentElement]
  )

  useEffect(() => {
    if (!parentElement) return

    // Named handlers so removeEventListener actually detaches them — passing
    // fresh arrow functions to remove() (as in the original snippet) leaks the
    // listeners on every re-run.
    const handleEnter = () => setIsHovered(true)
    const handleLeave = () => setIsHovered(false)

    parentElement.addEventListener('mousemove', handleMouseMove)
    parentElement.addEventListener('mouseenter', handleEnter)
    parentElement.addEventListener('mouseleave', handleLeave)

    return () => {
      parentElement.removeEventListener('mousemove', handleMouseMove)
      parentElement.removeEventListener('mouseenter', handleEnter)
      parentElement.removeEventListener('mouseleave', handleLeave)
    }
  }, [parentElement, handleMouseMove])

  return (
    <motion.div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops),transparent_80%)] blur-xl transition-opacity duration-200',
        'from-amber-400/20 via-amber-200/10 to-transparent',
        isHovered ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ width: size, height: size, left: spotlightLeft, top: spotlightTop }}
    />
  )
}

export default Spotlight
