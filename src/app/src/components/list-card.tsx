import { cn } from '#/lib/utils'

/** The card every list sits in: settings rows, accounts, currencies. */
export const cardSurface = 'overflow-hidden rounded-xl border bg-card'

export const rowHover = 'transition-colors hover:bg-secondary/60'

export function ListCard({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn(cardSurface, 'divide-y', className)} {...props} />
}
