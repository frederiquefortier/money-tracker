import { cn } from '#/lib/utils'

/** A short status beside a name: "Par défaut", "Archivée". */
export function Tag({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-semibold text-primary',
        className,
      )}
    >
      {children}
    </span>
  )
}
