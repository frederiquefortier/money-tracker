import { cn, focusRing } from '#/lib/utils'

// The receipt slip's parts (spec 15), shared by the amount and its split lines.

/** The dashed rule between the slip's sections. */
export const rule = <hr className="my-1 border-dashed border-border" />

/** The slip's small text (Taux, notes under a line): a step under its lines. */
export const small = 'text-[0.8125rem]'

/** A value typed on the slip: underlined, dashed, right-aligned. */
export const typed = cn(
  'min-w-0 border-b-2 border-dashed border-input bg-transparent text-right tabular-nums aria-invalid:border-destructive',
  focusRing,
)

/** One line of the slip: a label on the left, its value on the right. */
export function ReceiptLine({
  label,
  htmlFor,
  muted = false,
  children,
}: {
  label: string
  htmlFor?: string
  /** A smaller, quieter line (Taux). */
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3',
        muted ? cn(small, 'text-muted-foreground') : 'text-sm',
      )}
    >
      <label htmlFor={htmlFor} className="tracking-wide uppercase">
        {label}
      </label>
      <span className="flex items-center gap-1 whitespace-nowrap">
        {children}
      </span>
    </div>
  )
}
