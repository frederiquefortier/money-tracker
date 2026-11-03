import { Icon } from '#/components/icon'
import { cn, focusRing } from '#/lib/utils'

/** A native checkbox drawn with the field border and radius; FormData still reads it. */
export function Checkbox({
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <span className={cn('relative inline-grid size-5 shrink-0', className)}>
      <input
        type="checkbox"
        className={cn(
          'peer size-5 appearance-none rounded-field border border-input bg-transparent checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
          focusRing,
        )}
        {...props}
      />
      <Icon
        name="check"
        className="pointer-events-none absolute inset-0 m-auto size-4 text-primary-foreground opacity-0 peer-checked:opacity-100"
      />
    </span>
  )
}
