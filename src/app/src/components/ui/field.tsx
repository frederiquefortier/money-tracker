import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

/**
 * The control every form field shares: text inputs, native selects and picker triggers.
 * One border, radius, height, focus outline and error state, so they always match.
 * 44px tall on phones for touch, 36px from md up.
 */
export const fieldControl = cn(
  'h-11 w-full min-w-0 rounded-field border border-input bg-transparent px-3 text-base placeholder:font-mono placeholder:text-[0.85em] placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:h-9 md:text-sm dark:bg-input/30',
  focusRing,
)

/** A field label; `required` adds the asterisk, a convention needing no legend. */
export function FieldLabel({
  required = false,
  children,
  ...label
}: React.ComponentProps<typeof Label> & { required?: boolean }) {
  return (
    <Label {...label}>
      <span>
        {children}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-primary">
            *
          </span>
        )}
      </span>
    </Label>
  )
}
