'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Spline scene driven by @splinetool/runtime directly (not @splinetool/react-spline).
 *
 * Why: react-spline never passes a `renderer` option, so the runtime picks
 * WebGPU whenever `navigator.gpu` exists. Initialising WebGPU against a canvas
 * that hasn't been laid out yet (0x0) floods the console with
 * GPUValidationError "texture size is empty" / zero-size swapchain errors.
 * Here we:
 *   1. force the WebGL renderer (`renderer: 'webgl'`) — stable everywhere and
 *      visually identical for this scene;
 *   2. only create the Application once the container has a real, non-zero
 *      size (ResizeObserver), and never while it's 0x0;
 *   3. defer the ~1MB runtime download until the hero is near the viewport and
 *      the main thread is idle, so it doesn't compete with first paint;
 *   4. dispose the application on unmount.
 */

type SplineApp = { load: (url: string) => Promise<void>; dispose: () => void }

interface SplineSceneProps {
  scene: string
  className?: string
}

function whenIdle(cb: () => void): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    cancelIdleCallback?: (id: number) => void
  }
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout: 1500 })
    return () => w.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(cb, 200)
  return () => window.clearTimeout(id)
}

/**
 * The Spline runtime logs two kinds of harmless noise through console.warn:
 * its scene-format migration notice ("updating from 114 to 131") and the GPU
 * driver's shader-compiler info log (e.g. D3D "warning X3595"), which three.js
 * forwards verbatim. Neither is actionable from app code, so exactly those
 * patterns are dropped; every other warning passes through untouched.
 */
function isSplineNoise(args: unknown[]): boolean {
  const text = args.map(a => (typeof a === 'string' || typeof a === 'number' ? String(a) : '')).join(' ')
  if (/^updating from\s+\d+\s+to\s+\d+\s*$/.test(text.trim())) return true
  // Only shader *warnings*; anything mentioning an error still gets through.
  return text.startsWith('THREE.WebGLProgram: Program Info Log') && /warning X\d+/.test(text) && !/error/i.test(text)
}

let warnFilterInstalled = false
function installSplineWarnFilter() {
  if (warnFilterInstalled || typeof console === 'undefined') return
  warnFilterInstalled = true
  const original = console.warn.bind(console)
  console.warn = (...args: unknown[]) => {
    if (isSplineNoise(args)) return
    original(...args)
  }
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nearViewport, setNearViewport] = useState(false)
  const [hasSize, setHasSize] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  // 1) Wait until the stage is close to the viewport.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setNearViewport(true)
      return
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setNearViewport(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // 2) Track whether the container has a usable, non-zero size.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const check = () => {
      const { width, height } = el.getBoundingClientRect()
      setHasSize(width >= 1 && height >= 1)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 3) Boot the runtime once, when visible and sized. `booted` latches so a
  // later transient 0x0 layout doesn't tear down an already-loaded scene.
  const [booted, setBooted] = useState(false)
  useEffect(() => {
    if (nearViewport && hasSize) setBooted(true)
  }, [nearViewport, hasSize])

  useEffect(() => {
    if (!booted) return
    const canvas = canvasRef.current
    if (!canvas) return
    let app: SplineApp | null = null
    let cancelled = false

    const cancelIdle = whenIdle(async () => {
      try {
        installSplineWarnFilter()
        const { Application } = await import('@splinetool/runtime')
        if (cancelled) return
        app = new Application(canvas, { renderer: 'webgl', renderOnDemand: true }) as unknown as SplineApp
        await app.load(scene)
        if (!cancelled) setLoaded(true)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })

    return () => {
      cancelled = true
      cancelIdle()
      app?.dispose()
    }
  }, [booted, scene])

  return (
    <div ref={wrapRef} className="relative h-full w-full min-h-[1px] min-w-[1px]">
      <canvas
        ref={canvasRef}
        className={cn('block h-full w-full outline-none transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0', className)}
        aria-label="Interactive 3D robot"
      />
      {!loaded && !failed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      )}
    </div>
  )
}

export default SplineScene
