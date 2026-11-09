import { useId } from 'react'
import { FieldLabel } from '#/components/ui/field'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

/**
 * Native radios drawn like the checkbox (ADR-011: the platform first), one per line under
 * a field label. The arrows move between them, as in any radio group.
 */
export function RadioGroupField<TValue extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: ReadonlyArray<{ value: TValue; label: string }>
  value: TValue
  onChange: (value: TValue) => void
}) {
  const labelId = useId()
  const name = useId()
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className="flex flex-col gap-2"
    >
      <FieldLabel id={labelId}>{label}</FieldLabel>
      {options.map((option) => {
        const id = `${name}-${option.value}`
        return (
          <div key={option.value} className="flex items-center gap-3">
            <input
              id={id}
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className={cn(
                'size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-input bg-transparent checked:border-primary checked:bg-primary checked:shadow-[inset_0_0_0_4px_var(--card)] dark:bg-input/30 dark:checked:bg-primary',
                focusRing,
              )}
            />
            <label htmlFor={id} className="cursor-pointer text-sm font-medium">
              {option.label}
            </label>
          </div>
        )
      })}
    </div>
  )
}
