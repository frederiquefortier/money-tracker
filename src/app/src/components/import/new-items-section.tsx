import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Tag } from '#/components/display/tag'
import { CategoryBadge } from '#/components/categories/category-badge'
import { suggestIcon } from '#/lib/categories/category'
import { categoryParts } from '#/lib/import/import-names'
import { Icon } from '#/components/display/icon'
import { Money } from '#/components/display/money'
import { CollapseToggle } from '#/components/lists/collapse-toggle'
import { cardSurface, focusRing, rowHover } from '#/components/styles'
import { useLocale } from '#/hooks/app/use-locale'
import { formatCount, formatDate } from '#/lib/shared/format'
import { isDropped } from '#/lib/import/import-edits'
import type { Section, SectionItem } from '#/lib/import/import-sections'
import { RowButtons } from '#/components/import/row-buttons'
import type { Actions } from '#/components/import/row-buttons'
import { cn } from '#/lib/utils'

// What the import writes for a category: its parent's colour, or this grey (import.sql).
const NEW_CATEGORY_COLOR = '#6b7280' // Tailwind's gray-500, the import's default grey

function stateTag(item: SectionItem, t: TFunction, renamed: boolean) {
  const edit = item.edit
  if (item.mergedInto !== null) {
    return t(renamed ? 'import.edit.renamed' : 'import.mergedInto', {
      target: item.mergedInto,
      name: item.mergedInto,
    })
  }
  if (item.asPerson) return t('import.asPersonTag')
  if (!edit) return null
  if (edit.name === '') {
    return edit.note === '' ? t('import.edit.removed') : t('import.edit.inNote')
  }
  return t(
    edit.note === '' ? 'import.edit.renamed' : 'import.edit.renamedNote',
    { name: edit.name },
  )
}

function detailOf(item: SectionItem, t: TFunction, locale: 'fr' | 'en') {
  if (item.opening) {
    return t('import.openedOn', {
      date: formatDate(item.opening.openedOn, locale, 'medium'),
    })
  }
  if (item.detail) {
    return t('import.aliasOf', {
      name: item.detail.aliasOf,
      kind: t(
        `import.aliasKinds.${item.detail.kind === 'person' ? 'person' : 'merchant'}`,
      ),
    })
  }
  return item.uses === null ? null : t('import.uses', { count: item.uses })
}

/** A new item as an account is on Comptes: a bold name over a muted line, actions at the end. */
function ItemRow({ item, actions }: { item: SectionItem; actions: Actions }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const changed =
    item.mergedInto !== null || item.edit !== null || item.asPerson
  const dropped = item.mergedInto !== null || isDropped(item.edit)
  const tag = stateTag(item, t, actions.renamed === true)
  const detail = detailOf(item, t, locale)
  return (
    <li className={cn('flex min-h-16 items-center pr-2', rowHover)}>
      <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4">
        {actions.badge && (
          <CategoryBadge
            icon={suggestIcon(categoryParts(item.label).at(-1) ?? '')}
            color={NEW_CATEGORY_COLOR}
          />
        )}
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate font-semibold',
              dropped && 'text-muted-foreground line-through',
            )}
          >
            {item.label}
          </span>
          {detail && (
            <span className="block truncate text-sm text-muted-foreground">
              {detail}
            </span>
          )}
        </span>
        {tag && <Tag>{tag}</Tag>}
        {item.opening && (
          <Money
            amount={item.opening.balance}
            currency={item.opening.currency}
            className="shrink-0 font-mono font-semibold md:pr-4"
          />
        )}
        {!changed && actions.similar && (
          <button
            type="button"
            onClick={actions.similar.onMerge}
            className={cn(
              'flex max-w-48 shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20',
              focusRing,
            )}
          >
            <Icon name="merge" className="size-3.5 shrink-0" />
            <span className="truncate">
              {t('import.similarTo', { name: actions.similar.name })}
            </span>
          </button>
        )}
      </div>
      <RowButtons item={item} actions={actions} changed={changed} />
    </li>
  )
}

/**
 * What the import would create of one kind, as an institution's card on Comptes:
 * the group's name folds it, its count at the end, its items as rows. Where a kind can be
 * merged or edited (IMP-06), each row has the icons for it.
 */
export function NewItemsSection({
  section,
  onMerge,
  onEdit,
  onRemove,
  onRestore,
  onPerson,
  similarOf,
  renamedOf,
  count,
}: {
  section: Section
  /** The count when it is not the section's own (renames count). */
  count?: number
  onMerge?: (item: SectionItem) => void
  onEdit?: (item: SectionItem) => void
  onRemove?: (item: SectionItem) => void
  onRestore?: (item: SectionItem) => void
  onPerson?: (item: SectionItem) => void
  similarOf?: (item: SectionItem) => Actions['similar']
  renamedOf?: (item: SectionItem) => boolean
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  // A short list opens by itself; a long one (hundreds of merchants) waits to be opened.
  const [collapsed, setCollapsed] = useState(section.items.length > 6)
  return (
    <section className={cardSurface}>
      <header className="flex min-h-16 items-center gap-2 py-3 pr-4 pl-3">
        <CollapseToggle
          expanded={!collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          className="font-bold"
        >
          {t(`import.sections.${section.key}`)}
        </CollapseToggle>
        <span className="ml-auto font-mono font-bold">
          {formatCount(count ?? section.count, locale)}
        </span>
      </header>
      {!collapsed && (
        <ul className="divide-y border-t">
          {section.items.map((item) => (
            <ItemRow
              key={item.key}
              item={item}
              actions={{
                onMerge: onMerge && (() => onMerge(item)),
                onEdit: onEdit && (() => onEdit(item)),
                onRemove: onRemove && (() => onRemove(item)),
                onRestore: onRestore && (() => onRestore(item)),
                onPerson: onPerson && (() => onPerson(item)),
                badge: section.key === 'categories',
                renamed: renamedOf?.(item),
                similar: similarOf?.(item),
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
