import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CategoryBadge,
  EmptyCategoryBadge,
} from '#/components/categories/category-badge'
import { EditHint } from '#/components/forms/edit-hint'
import { IconButton } from '#/components/display/icon-button'
import { PickSheet } from '#/components/events/form/pick-field'
import { SkipChoices } from '#/components/events/form/skip-pick'
import { InfoTooltip } from '#/components/forms/info-tooltip'
import { ListCard } from '#/components/lists/list-card'
import { focusRing, rowHover } from '#/components/styles'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { useToast } from '#/hooks/app/use-toast'
import { categoryPath } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import { indexById } from '#/lib/shared/collections'
import { cn } from '#/lib/utils'
import { saveEventDefaultSkips } from '#/server/events'

type Ids = Array<string>

const row = 'flex min-h-14 items-center gap-3 px-4 py-2'

/** Saves the list, puts it back on a failure, and reloads the page's data. */
function useSaveDefaults(saved: Ids, setPicked: (ids: Ids) => void) {
  const { t } = useTranslation()
  const toast = useToast()
  const router = useRouter()
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
    await router.invalidate()
  }
}

function AddRow({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onOpen}
        className={cn(row, rowHover, focusRing, 'group w-full text-left')}
      >
        <span className="relative shrink-0">
          <EmptyCategoryBadge className="size-9" />
          <EditHint size="xs" icon="plus" />
        </span>
        <span className="text-muted-foreground">{label}</span>
      </button>
    </li>
  )
}

/**
 * The Réglages tab: the categories no event links automatically unless it has its own
 * list. Saved when a row is removed or the picker closes; every automatic link is then
 * computed again.
 */
export function DefaultSkips({
  categories,
  saved,
}: {
  categories: ReadonlyArray<Category>
  saved: Ids
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const [picked, setPicked] = useState(saved)
  const [open, setOpen] = useState(false)
  const save = useSaveDefaults(saved, setPicked)
  const byId = indexById(categories)
  const rows = categories
    .filter((c) => picked.includes(c.id))
    .map((c) => ({ category: c, path: categoryPath(c, byId) }))
    .sort((a, b) => a.path.localeCompare(b.path, locale))
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="font-bold">{t('events.skip')}</h2>
        <InfoTooltip label={t('events.skipInfoLabel')}>
          {t('events.skipDefaultInfo')}
        </InfoTooltip>
      </div>
      <ListCard>
        {rows.map(({ category, path }) => (
          <li key={category.id} className={row}>
            <CategoryBadge
              icon={category.icon}
              color={category.color}
              size="md"
            />
            <span className="min-w-0 flex-1 truncate">{path}</span>
            <IconButton
              icon="close"
              label={t('common.removeName', { name: path })}
              onClick={() => {
                const next = picked.filter((id) => id !== category.id)
                setPicked(next)
                void save(next)
              }}
            />
          </li>
        ))}
        <AddRow label={t('events.chooseSkips')} onOpen={() => setOpen(true)} />
      </ListCard>
      <PickSheet
        open={open}
        title={t('events.skipTitle')}
        searchLabel={t('transactions.list.search.categories')}
        canClear={picked.length > 0}
        onClear={() => setPicked([])}
        onClose={() => {
          setOpen(false)
          void save(picked)
        }}
      >
        {(query) => (
          <SkipChoices
            categories={categories}
            picked={picked}
            query={query}
            onChange={setPicked}
          />
        )}
      </PickSheet>
    </section>
  )
}
