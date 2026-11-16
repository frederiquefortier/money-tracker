import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CategoryBadge,
  EmptyCategoryBadge,
} from '#/components/categories/category-badge'
import { EditHint } from '#/components/forms/edit-hint'
import { Tag } from '#/components/display/tag'
import { CheckList } from '#/components/forms/check-list'
import { categoryTicks } from '#/components/forms/check-ticks'
import { PickSheet } from '#/components/events/form/pick-field'
import { FieldLabel } from '#/components/ui/field'
import { focusRing, stackRing } from '#/components/styles'
import { useCategoryTree } from '#/hooks/transactions/use-check-trees'
import { isArchived } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import { cn } from '#/lib/utils'

// The categories an event's link by date leaves out (EVT-07, ADR-055, ADR-056): the default
// list in the Réglages tab, which an event follows until it has its own.

type Ids = Array<string>

/** The category tree with the picked ones ticked; a parent takes its sub-categories. */
export function SkipChoices({
  categories,
  picked,
  query,
  onChange,
}: {
  categories: ReadonlyArray<Category>
  picked: Ids
  query: string
  onChange: (ids: Ids) => void
}) {
  const { t } = useTranslation()
  // Archived categories stay listed only while picked.
  const listed = categories.filter(
    (c) => !isArchived(c) || picked.includes(c.id),
  )
  const nodes = useCategoryTree(listed, query)
  const ticks = categoryTicks(listed, picked)
  if (nodes.length === 0)
    return <p className="text-muted-foreground">{t('common.noMatch')}</p>
  return (
    <CheckList
      nodes={nodes}
      openCount={1}
      stateOf={ticks.stateOf}
      onToggle={(node) => onChange(ticks.toggle(node))}
    />
  )
}

const sameIds = (a: Ids, b: Ids) =>
  a.length === b.length && a.every((id) => b.includes(id))

// Past this many icons, the stack shows one less and the count of the others.
const STACKED = 5
const circle = 'size-11 md:size-9'

/**
 * The receipt's category circles, overlapping, ending on the empty one (CategoryButton):
 * one button opening the list, its corner a plus while empty, a pencil once chosen.
 */
function SkipStack({
  picked,
  label,
  onOpen,
}: {
  picked: ReadonlyArray<Category>
  label: string
  onOpen: () => void
}) {
  const shown = picked.length > STACKED ? picked.slice(0, STACKED - 1) : picked
  const more = picked.length - shown.length
  const names = picked.map((c) => c.name).join(', ')
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={names ? `${label}: ${names}` : label}
      title={names || label}
      className={cn(
        'group flex items-center self-start rounded-full',
        focusRing,
      )}
    >
      {shown.map((c, i) => (
        <span
          key={c.id}
          className={cn('rounded-full', stackRing, i > 0 && '-ml-2.5')}
        >
          <CategoryBadge icon={c.icon} color={c.color} className={circle} />
        </span>
      ))}
      {more > 0 && (
        <span
          className={cn(
            '-ml-2.5 grid place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground',
            circle,
            stackRing,
          )}
        >
          +{more}
        </span>
      )}
      <span className={cn('relative shrink-0', picked.length > 0 && 'ml-2')}>
        <EmptyCategoryBadge className={circle} />
        <EditHint size="sm" icon={picked.length > 0 ? 'pencil' : 'plus'} />
      </span>
    </button>
  )
}

/**
 * The event's list: null follows the default, shown ticked and marked "Par défaut". A
 * change makes it the event's own, even empty; picking exactly the defaults follows them
 * again.
 */
export function EventSkipField({
  categories,
  defaultIds,
  own,
  onChange,
}: {
  categories: ReadonlyArray<Category>
  defaultIds: Ids
  own: Ids | null
  onChange: (ids: Ids | null) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const picked = own ?? defaultIds
  const set = (ids: Ids) => onChange(sameIds(ids, defaultIds) ? null : ids)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <FieldLabel>{t('events.skip')}</FieldLabel>
        {own === null && defaultIds.length > 0 && (
          <Tag>{t('events.usingDefault')}</Tag>
        )}
      </div>
      <SkipStack
        picked={categories.filter((c) => picked.includes(c.id))}
        label={t(picked.length ? 'events.editSkips' : 'events.chooseSkips')}
        onOpen={() => setOpen(true)}
      />
      <PickSheet
        open={open}
        title={t('events.skipTitle')}
        searchLabel={t('transactions.list.search.categories')}
        canClear={picked.length > 0}
        onClear={() => set([])}
        onClose={() => setOpen(false)}
      >
        {(query) => (
          <SkipChoices
            categories={categories}
            picked={picked}
            query={query}
            onChange={set}
          />
        )}
      </PickSheet>
    </div>
  )
}
