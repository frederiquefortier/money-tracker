import { cn } from '#/lib/utils'

/** The card every list sits in: settings rows, accounts, currencies. */
export const cardSurface = 'overflow-hidden rounded-xl border bg-card'

export const rowHover = 'transition-colors hover:bg-secondary/60'

/** The line in place of an empty list, or of a search with no match. */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-muted-foreground">{children}</p>
}

export function ListCard({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn(cardSurface, 'divide-y', className)} {...props} />
}
