import { useId } from 'react'
import { Icon } from '#/components/icon'
import { FieldLabel, fieldControl } from '#/components/ui/field'
import { cn } from '#/lib/utils'

/** A dropdown trigger: the shared field control with room for the chevron. */
export const selectControl = cn(
  fieldControl,
  'relative flex items-center pr-9 text-left',
)

export function SelectChevron() {
  return (
    <Icon
      name="chevron-down"
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
    />
  )
}

/** A native select (ADR-011: the platform first), drawn like the pickers. */
export function SelectField({
  label,
  options,
  required,
  className,
  ...select
}: Omit<React.ComponentProps<'select'>, 'id'> & {
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        <select
          id={id}
          required={required}
          className={cn(selectControl, 'appearance-none', className)}
          {...select}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <SelectChevron />
      </div>
    </div>
  )
}
