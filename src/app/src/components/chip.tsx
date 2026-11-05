import { cn, focusRing } from '#/lib/utils'

/** A bubble: the transactions list's period and filters, all the same height (spec 14). */
export const chip = cn(
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-input bg-card px-3 text-sm font-semibold hover:bg-secondary disabled:opacity-50',
  focusRing,
)
