import { useId } from 'react'
import { FieldMessage } from '#/components/forms/form-field'
import { errorTint } from '#/components/styles'
import { FieldLabel } from '#/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

/**
 * The one control for a short choice among a few named options: a store or a person, a
 * holding's nature. One is always chosen once chosen (pressing it again clears nothing).
 * With `name` a hidden input carries the value to a form. With an `error` the group turns
 * red and the message says why.
 */
export function ChoiceField<TValue extends string>({
  label,
  options,
  value,
  onChange,
  name,
  required = false,
  error,
}: {
  label: string
  options: ReadonlyArray<{ value: TValue; label: string }>
  /** '' while nothing is chosen. */
  value: TValue | ''
  onChange: (value: TValue) => void
  name?: string
  required?: boolean
  error?: string
}) {
  const labelId = useId()
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel id={labelId} required={required}>
        {label}
      </FieldLabel>
      <ToggleGroup
        type="single"
        aria-labelledby={labelId}
        value={value}
        onValueChange={(next) => next && onChange(next as TValue)}
        className={error ? errorTint : undefined}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {name && <input type="hidden" name={name} value={value} />}
      {error && <FieldMessage error>{error}</FieldMessage>}
    </div>
  )
}
