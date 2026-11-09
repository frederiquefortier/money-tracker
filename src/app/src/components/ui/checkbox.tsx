import { useEffect, useRef } from 'react'
import { Icon } from '#/components/display/icon'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

/**
 * A native checkbox drawn with the field border and radius; FormData still reads it.
 * `indeterminate` draws a bar for "some of these" (an institution with some of its
 * accounts ticked); only script can set it on the input.
 */
export function Checkbox({
  className,
  indeterminate = false,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'> & { indeterminate?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <span className={cn('relative inline-grid size-5 shrink-0', className)}>
      <input
        ref={input}
        type="checkbox"
        className={cn(
          'peer size-5 appearance-none rounded-field border border-input bg-transparent checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
          focusRing,
        )}
        {...props}
      />
      <Icon
        name="check"
        className="pointer-events-none absolute inset-0 m-auto size-4 text-primary-foreground opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-0"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto h-0.5 w-2.5 rounded-full bg-primary-foreground opacity-0 peer-indeterminate:opacity-100"
      />
    </span>
  )
}
