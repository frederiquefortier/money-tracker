import { cardSurface } from '#/components/styles'
import { useLocale } from '#/hooks/app/use-locale'
import { formatCount } from '#/lib/shared/format'
import { cn } from '#/lib/utils'

export function Tile({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className?: string
}) {
  const locale = useLocale()
  return (
    <div
      className={cn(
        cardSurface,
        'flex flex-col items-center gap-1 p-3',
        className,
      )}
    >
      <span className="font-mono text-2xl font-bold">
        {formatCount(value, locale)}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

export function BigNumber({ value, label }: { value: number; label: string }) {
  const locale = useLocale()
  return (
    <div
      className={cn(cardSurface, 'flex flex-col items-center gap-1 px-4 py-5')}
    >
      <span className="font-mono text-4xl font-bold">
        {formatCount(value, locale)}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
