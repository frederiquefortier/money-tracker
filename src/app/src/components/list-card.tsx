import { cn, insetFocus } from '#/lib/utils'

/** The card every list sits in: settings rows, accounts, currencies. */
export const cardSurface = cn(
  'overflow-hidden rounded-xl border bg-card',
  insetFocus,
)

/**
 * A row's hover. `--row-bg` is the colour the row shows, opaque, so a ring around a
 * stacked icon can match it (`stackRing`); a pending row sets its own after this.
 */
export const rowHover = cn(
  'transition-colors hover:bg-secondary/60',
  '[--row-bg:var(--card)] hover:[--row-bg:color-mix(in_oklab,var(--secondary)_60%,var(--card))]',
)

/** The gap between stacked icons (a split's categories, a group's members): the row's colour. */
export const stackRing = 'ring-2 ring-[var(--row-bg,var(--card))]'

/** The line in place of an empty list, or of a search with no match. */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-muted-foreground">{children}</p>
}

export function ListCard({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn(cardSurface, 'divide-y', className)} {...props} />
}
