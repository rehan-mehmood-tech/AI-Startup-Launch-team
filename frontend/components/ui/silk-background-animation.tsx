'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Animated silk/moiré backdrop.
 *
 * The pattern maths is unchanged from the reference implementation, but the
 * rendering strategy is not — the original looped over every 2nd pixel of a
 * full-resolution buffer each frame (~520k iterations with trig at 1920x1080,
 * plus an ~8MB ImageData allocation per frame), which pins a CPU core. Three
 * changes keep it visually identical while making it cheap:
 *
 *   1. The field is computed into a small offscreen buffer (RES_DIVISOR) and
 *      scaled up with the browser's smoothing — the pattern is low-frequency,
 *      so upscaling is indistinguishable and costs ~36x less work.
 *   2. The buffer is allocated once and reused rather than per frame.
 *   3. Frames are capped (TARGET_FPS) and paused when the tab is hidden.
 *
 * It also honours prefers-reduced-motion by painting a single static frame.
 */

const RES_DIVISOR = 6 // offscreen buffer is 1/6 the size in each axis
const TARGET_FPS = 30
const SPEED = 0.02
const SCALE = 2
const NOISE_INTENSITY = 0.8

export const SilkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Offscreen buffer the pattern is actually drawn into.
    const buffer = document.createElement('canvas')
    const bctx = buffer.getContext('2d')
    if (!bctx) return

    let imageData: ImageData | null = null
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      buffer.width = Math.max(1, Math.ceil(canvas.width / RES_DIVISOR))
      buffer.height = Math.max(1, Math.ceil(canvas.height / RES_DIVISOR))
      // Reallocate only when the size actually changes.
      imageData = bctx.createImageData(buffer.width, buffer.height)
      ctx.imageSmoothingEnabled = true
    }

    resize()
    window.addEventListener('resize', resize)

    const noise = (x: number, y: number) => {
      const G = 2.71828
      const rx = G * Math.sin(G * x)
      const ry = G * Math.sin(G * y)
      return (rx * ry * (1 + x)) % 1
    }

    const drawFrame = () => {
      if (!imageData) return
      const w = buffer.width
      const h = buffer.height
      const data = imageData.data
      const tOffset = SPEED * time

      for (let y = 0; y < h; y++) {
        const v = (y / h) * SCALE
        for (let x = 0; x < w; x++) {
          const u = (x / w) * SCALE

          const texX = u
          const texY = v + 0.03 * Math.sin(8.0 * texX - tOffset)

          const pattern =
            0.6 +
            0.4 *
              Math.sin(
                5.0 * (texX + texY + Math.cos(3.0 * texX + 5.0 * texY) + 0.02 * tOffset) +
                  Math.sin(20.0 * (texX + texY - 0.1 * tOffset))
              )

          const rnd = noise(x, y)
          const intensity = Math.max(0, pattern - (rnd / 15.0) * NOISE_INTENSITY)

          const i = (y * w + x) * 4
          data[i] = 123 * intensity
          data[i + 1] = 116 * intensity
          data[i + 2] = 129 * intensity
          data[i + 3] = 255
        }
      }

      bctx.putImageData(imageData, 0, 0)

      // Base gradient, then the upscaled pattern over it.
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      g.addColorStop(0, '#0a0a0a')
      g.addColorStop(0.5, '#171717')
      g.addColorStop(1, '#0a0a0a')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.globalAlpha = 0.85
      ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = 1

      // Radial vignette so the centre stays readable.
      const overlay = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      )
      overlay.addColorStop(0, 'rgba(0, 0, 0, 0.2)')
      overlay.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
      ctx.fillStyle = overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    if (reduceMotion) {
      drawFrame()
      return () => window.removeEventListener('resize', resize)
    }

    const frameInterval = 1000 / TARGET_FPS
    let last = 0

    const loop = (now: number) => {
      animationRef.current = requestAnimationFrame(loop)
      if (document.hidden) return
      if (now - last < frameInterval) return
      last = now
      drawFrame()
      time += 1
    }

    animationRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current !== undefined) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 w-full h-full opacity-[0.28]"
      />
      {/* Darkening scrim so foreground text and figures stay high-contrast. */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 bg-black/60" />
    </>
  )
}

export default SilkBackground
