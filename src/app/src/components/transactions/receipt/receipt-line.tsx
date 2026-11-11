import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

// The receipt slip's parts, shared by the amount and its split lines.

/** The dashed rule between the slip's sections. */
export const slipRule = <hr className="my-1 border-dashed border-border" />

/** The slip's small text (Taux, notes under a line): a step under its lines. */
export const slipSmall = 'text-[0.8125rem]'

/** A value typed on the slip: underlined, dashed, right-aligned. */
export const slipTyped = cn(
  'min-w-0 border-b-2 border-dashed border-input bg-transparent text-right font-mono tabular-nums aria-invalid:border-destructive',
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
        muted ? cn(slipSmall, 'text-muted-foreground') : 'text-sm',
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

/** Which amount the category picker is choosing for: the main one, or a split line by index. */
export type PickTarget = 'main' | number
