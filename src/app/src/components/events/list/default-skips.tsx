import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { PickSheet } from '#/components/events/form/pick-field'
import { SkipChoices } from '#/components/events/form/skip-pick'
import { FormAlert } from '#/components/forms/form-field'
import { chipSurface } from '#/components/styles'
import { useRefresh } from '#/hooks/app/use-refresh'
import { useToast } from '#/hooks/app/use-toast'
import type { Category } from '#/lib/categories/category'
import { cn } from '#/lib/utils'
import { saveEventDefaultSkips } from '#/server/events'

type Ids = Array<string>

/** Saves the list, puts it back on a failure, and reloads the page's data. */
function useSaveDefaults(saved: Ids, setPicked: (ids: Ids) => void) {
  const { t } = useTranslation()
  const toast = useToast()
  const refresh = useRefresh()
  return async (ids: Ids) => {
    if (ids.length === saved.length && ids.every((id) => saved.includes(id)))
      return
    const result = await saveEventDefaultSkips({ data: { categoryIds: ids } })
    if (!result.ok) {
      setPicked(saved)
      toast({ text: t('common.saveFailed'), tone: 'error' })
      return
    }
    toast({ text: t('events.defaultSkipsSaved'), tone: 'success' })
    await refresh()
  }
}

/**
 * The settings icon beside the sort (ADR-070): the categories no event links automatically
 * unless it has its own list. Saved when the picker closes; every automatic link is then
 * computed again.
 */
export function DefaultSkipsButton({
  categories,
  saved,
}: {
  categories: ReadonlyArray<Category>
  saved: Ids
}) {
  const { t } = useTranslation()
  const [picked, setPicked] = useState(saved)
  const [open, setOpen] = useState(false)
  const save = useSaveDefaults(saved, setPicked)
  const label = t('events.defaultSkipsTitle')
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={label}
        title={label}
        onClick={() => {
          setPicked(saved)
          setOpen(true)
        }}
        className={cn(chipSurface, 'size-8 justify-center px-0')}
      >
        <Icon name="settings" className="size-5" />
      </button>
      <PickSheet
        open={open}
        title={label}
        searchLabel={t('transactions.list.search.categories')}
        canClear={picked.length > 0}
        onClear={() => setPicked([])}
        onClose={() => {
          setOpen(false)
          void save(picked)
        }}
      >
        {(query) => (
          <div className="flex flex-col gap-3">
            <FormAlert tone="help">{t('events.skipDefaultInfo')}</FormAlert>
            <SkipChoices
              categories={categories}
              picked={picked}
              query={query}
              onChange={setPicked}
            />
          </div>
        )}
      </PickSheet>
    </>
  )
}
