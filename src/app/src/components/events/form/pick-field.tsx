import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EditHint } from '#/components/forms/edit-hint'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { IconButton } from '#/components/display/icon-button'
import { SearchField } from '#/components/forms/search-field'
import { Button } from '#/components/ui/button'
import { FieldLabel } from '#/components/ui/field'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHead,
} from '#/components/ui/sheet'
import { focusRing } from '#/components/styles'
import { cn } from '#/lib/utils'

export type Picked = { id: string; name: string; icon: React.ReactNode }

/** The round add button: an empty dashed circle with its icon and a plus. */
function AddCircle({
  icon,
  label,
  onOpen,
}: {
  icon: IconName
  label: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={label}
      title={label}
      className={cn('group self-start rounded-full', focusRing)}
    >
      <span className="relative block">
        <span className="grid size-8 place-items-center rounded-full border-2 border-dashed border-primary/40 text-primary/60 transition-colors group-hover:border-primary group-focus-visible:border-primary">
          <Icon name={icon} className="size-4" />
        </span>
        <EditHint size="xs" icon="plus" />
      </span>
    </button>
  )
}

/**
 * Several choices in a form, drawn as on the receipt: what is chosen listed with
 * its icon and a ✕, then a round add button. The button opens the choices in a sheet over
 * the form, with a search; Terminé gives the form back.
 */
export function PickField({
  label,
  title = label,
  addLabel,
  addIcon,
  picked,
  onRemove,
  onClear,
  children,
}: {
  label: string
  /** The sheet's title, when the label is too long for it. */
  title?: string
  addLabel: string
  addIcon: IconName
  picked: ReadonlyArray<Picked>
  onRemove: (id: string) => void
  onClear: () => void
  /** The choices for what is typed in the search. */
  children: (query: string) => React.ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      {picked.length > 0 && (
        <ul className="flex flex-col gap-1">
          {picked.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              {item.icon}
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <IconButton
                icon="close"
                label={t('common.removeName', { name: item.name })}
                onClick={() => onRemove(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <AddCircle icon={addIcon} label={addLabel} onOpen={() => setOpen(true)} />
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <SheetContent title={title} closeLabel={t('common.close')}>
          <SheetHead>
            <SearchField value={query} onChange={setQuery} />
          </SheetHead>
          <SheetBody>{children(query)}</SheetBody>
          <SheetFooter className="justify-between">
            <Button
              variant="ghost"
              disabled={picked.length === 0}
              onClick={onClear}
            >
              {t('common.clear')}
            </Button>
            <Button onClick={() => setOpen(false)}>{t('common.done')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
