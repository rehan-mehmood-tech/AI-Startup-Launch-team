import * as React from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string
  title: string
  category: string
  href: string
  onSave?: () => void
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ className, imageUrl, title, category, href, onSave, ...props }, ref) => {
    const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      onSave?.()
    }

    return (
      <div
        ref={ref}
        className={cn(
          'group relative block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-all duration-300 ease-in-out hover:shadow-xl hover:border-amber-400/40',
          className
        )}
        {...props}
      >
        <a href={href} aria-label={title}>
          <div className="aspect-video w-full overflow-hidden bg-zinc-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold leading-tight text-white truncate">{title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{category}</p>
          </div>
        </a>

        {/* Hover-revealed, but also shown on keyboard focus — an opacity-0
            control that only appears on mouse hover is unreachable-looking to
            keyboard users even though it's focusable. */}
        <Button
          aria-label="Save"
          variant="secondary"
          size="icon"
          onClick={handleSaveClick}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-zinc-900/80 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-amber-400 hover:text-black"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>
    )
  }
)
ProductCard.displayName = 'ProductCard'

export { ProductCard }
