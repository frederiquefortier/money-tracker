import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { IconButton } from '#/components/icon-button'
import { fieldControl } from '#/components/ui/field'
import { cn, focusRing } from '#/lib/utils'

/**
 * The last row of a CheckList in a form: a button that becomes a name field. Enter or
 * the check creates it; Escape goes back. Enter never submits the sheet's form.
 */
export function CreateRow({
  label,
  onCreate,
}: {
  label: string
  onCreate: (name: string) => void
}) {
  // A border above it when rows come first; alone in its card, none.
  const border = 'border-t first:border-t-0'
  const { t } = useTranslation()
  const [name, setName] = useState<string | null>(null)

  function create() {
    if (!name?.trim()) return
    onCreate(name.trim())
    setName(null)
  }

  if (name === null)
    return (
      <button
        type="button"
        onClick={() => setName('')}
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

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2', border)}>
      <input
        autoFocus
        aria-label={label}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            create()
          } else if (event.key === 'Escape') {
            // The sheet must not close with it.
            event.preventDefault()
            event.stopPropagation()
            setName(null)
          }
        }}
        className={fieldControl}
      />
      <IconButton icon="check" label={t('common.add')} onClick={create} />
    </div>
  )
}
