import { useId } from 'react'
import { Checkbox } from '#/components/ui/checkbox'

/** A labelled checkbox, read from FormData, or controlled with `checked`. */
export function CheckboxField({
  name,
  label,
  defaultChecked,
  checked,
  onCheckedChange,
}: {
  name: string
  label: string
  defaultChecked?: boolean
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id={id}
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={
          onCheckedChange && ((event) => onCheckedChange(event.target.checked))
        }
      />
      <label htmlFor={id} className="cursor-pointer text-sm font-medium">
        {label}
      </label>
    </div>
  )
}
