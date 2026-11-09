import { useTranslation } from 'react-i18next'
import { CategoryTree } from '#/components/categories/list/category-tree'
import type { RowContext } from '#/components/categories/list/category-row'
import { CollapseToggle } from '#/components/lists/collapse-toggle'
import type { Category } from '#/lib/categories/category'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'

const parseBoolean = (v: unknown) => (typeof v === 'boolean' ? v : undefined)

const archivedOn = (category: Category) => category.history[0]?.effectiveOn

/**
 * CAT-05: archived categories as a muted tree. A branch whose parent is still active
 * starts at the top with its full path. The date shows where it differs from the parent's.
 */
export function ArchivedCategories({
  childrenOf,
  count,
  byId,
  pathOf,
  contextOf,
  expanded: openBranches,
  onToggle,
  open = false,
}: {
  childrenOf: ReadonlyMap<string | null, ReadonlyArray<Category>>
  count: number
  byId: ReadonlyMap<string, Category>
  pathOf: (category: Category) => string
  contextOf: (category: Category) => RowContext
  expanded: ReadonlySet<string>
  onToggle: (id: string) => void
  open?: boolean
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [stored, setExpanded] = useStoredState(
    'categories.archivedExpanded',
    false,
    parseBoolean,
  )
  const expanded = open || stored
  const roots = childrenOf.get(null) ?? []
  if (count === 0) return null
  const isRoot = (category: Category) => roots.includes(category)

  return (
    <section className="flex flex-col gap-2">
      <CollapseToggle
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        className="self-start text-sm font-semibold text-muted-foreground"
      >
        {t('categories.archived', { count })}
      </CollapseToggle>
      {expanded && roots.length > 0 && (
        <CategoryTree
          className="text-muted-foreground"
          roots={roots}
          childrenOf={childrenOf}
          contextOf={contextOf}
          expanded={openBranches}
          onToggle={onToggle}
          labelOf={(category) =>
            isRoot(category) ? pathOf(category) : category.name
          }
          asideOf={(category) => {
            const date = archivedOn(category)
            const parent = category.parentId
              ? byId.get(category.parentId)
              : undefined
            if (
              !date ||
              (!isRoot(category) && parent && archivedOn(parent) === date)
            )
              return null
            return (
              <span className="text-sm whitespace-nowrap">
                {t('categories.archivedOn', {
                  date: formatDate(date, locale, 'medium'),
                })}
              </span>
            )
          }}
        />
      )}
    </section>
  )
}
