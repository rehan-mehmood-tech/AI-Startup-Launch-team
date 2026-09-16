'use client'

import { Suspense, lazy } from 'react'

// NOTE on the import style: @splinetool/react-spline@4 ships an `exports` map
// with only an "import" condition (no "require"/"default"), and its "./next"
// subpath is the same. next/dynamic's resolution rejects both with
// "Package path . is not exported"; a plain React.lazy dynamic import
// resolves fine. The wasm/draco issues this package also has are handled in
// next.config.mjs.
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <div className="w-full h-full relative">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-zinc-950/50">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Spline scene={scene} className={className} />
      </Suspense>
    </div>
  )
}

export default SplineScene
