import { cn } from '@/lib/utils'

/**
 * Brand mark: a sharp amber hexagon (the agent "cell") with a four-point
 * spark at its core and a smaller orbiting spark. Geometry is mirrored in
 * lib/pdf-generator.ts and app/icon.svg — keep them in sync.
 */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={cn('shrink-0', className)}>
      <defs>
        <linearGradient id="ailt-g" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD54A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path d="M16 1.5 28.6 8.75v14.5L16 30.5 3.4 23.25V8.75L16 1.5Z" fill="url(#ailt-g)" />
      <path d="M14.5 8.5 16.4 14.1 22 16 16.4 17.9 14.5 23.5 12.6 17.9 7 16 12.6 14.1 14.5 8.5Z" fill="#0A0908" />
      <path d="M21.5 7.5 22.3 9.7 24.5 10.5 22.3 11.3 21.5 13.5 20.7 11.3 18.5 10.5 20.7 9.7 21.5 7.5Z" fill="#0A0908" />
    </svg>
  )
}

export function Logo({ size = 24, className, textClassName }: { size?: number; className?: string; textClassName?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <LogoMark size={size} />
      <span className={cn('truncate text-[15px] font-semibold tracking-tight text-[#F5F3EF]', textClassName)}>
        AI Startup Launch Team
      </span>
    </span>
  )
}

export const DISCLAIMER =
  'Disclaimer: This report contains AI-generated insights and recommendations. We are not responsible for any financial loss or business decisions made based on this output. AI models can make mistakes.'
