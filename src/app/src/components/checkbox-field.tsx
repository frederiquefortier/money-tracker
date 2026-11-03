import { useId } from 'react'
import { Checkbox } from '#/components/ui/checkbox'

export function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string
  label: string
  defaultChecked?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} name={name} defaultChecked={defaultChecked} />
      <label htmlFor={id} className="cursor-pointer text-sm font-medium">
        {label}
      </label>
    </div>
  )
}
