import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { IconButton } from '#/components/display/icon-button'
import { fieldControl } from '#/components/ui/field'
import { cn } from '#/lib/utils'
import { useSheetEscape } from '#/hooks/forms/use-sheet'
import { focusRing } from '#/components/styles'

// A border above it when rows come first; alone in its card, none.
const border = 'border-t first:border-t-0'

/** The "+ Nouveau …" row closing a list: a create row's start, or a form to open. */
export function CreateButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-12 w-full items-center gap-3 px-3 text-left font-semibold text-primary hover:bg-secondary/50',
        border,
        focusRing,
      )}
    >
      <Icon name="plus" />
      {label}
    </button>
  )
}

/**
 * The last row of a list in a form (a CheckList, the aliases): a button that becomes a
 * name field. Enter or the check creates it; Escape goes
 * back, leaving the sheet open. Enter never submits the sheet's form.
 */
export function CreateRow({
  label,
  onCreate,
}: {
  label: string
  onCreate: (name: string) => void
}) {
  const [name, setName] = useState<string | null>(null)

  function create() {
    if (!name?.trim()) return
    onCreate(name.trim())
    setName(null)
  }

  if (name === null)
    return <CreateButton label={label} onClick={() => setName('')} />

  return (
    <NameField
      label={label}
      name={name}
      onChange={setName}
      onCreate={create}
      onCancel={() => setName(null)}
    />
  )
}

function NameField({
  label,
  name,
  onChange,
  onCreate,
  onCancel,
}: {
  label: string
  name: string
  onChange: (name: string) => void
  onCreate: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  useSheetEscape(onCancel)
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2', border)}>
      <input
        autoFocus
        aria-label={label}
        value={name}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onCreate()
          }
        }}
        className={fieldControl}
      />
      <IconButton icon="check" label={t('common.add')} onClick={onCreate} />
    </div>
  )
}
