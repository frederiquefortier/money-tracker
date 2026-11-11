import { cn } from '#/lib/utils'

/** A currency code (CAD) beside an amount or a name: always in the mono face. */
export function CurrencyCode({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  return <span className={cn('font-mono', className)}>{code}</span>
}
