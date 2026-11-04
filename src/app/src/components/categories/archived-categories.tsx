import { useTranslation } from 'react-i18next'
import { CategoryRow } from '#/components/categories/category-row'
import type { RowContext } from '#/components/categories/category-row'
import { CollapseToggle } from '#/components/collapse-toggle'
import { ListCard } from '#/components/list-card'
import type { Category } from '#/lib/categories'
import { formatDate } from '#/lib/format'
import { useLocale } from '#/lib/use-locale'
import { useStoredState } from '#/lib/use-stored-state'

const parseBoolean = (v: unknown) => (typeof v === 'boolean' ? v : undefined)

/** CAT-05: archived categories, flat and muted, with their full path and date. */
export function ArchivedCategories({
  archived,
  contextOf,
  open = false,
}: {
  archived: ReadonlyArray<{ category: Category; path: string }>
  contextOf: (category: Category) => RowContext
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
  if (archived.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <CollapseToggle
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        className="self-start text-sm font-semibold text-muted-foreground"
      >
        {t('categories.archived', { count: archived.length })}
      </CollapseToggle>
      {expanded && (
        <ListCard className="text-muted-foreground">
          {archived.map(({ category, path }) => (
            <li key={category.id}>
              <CategoryRow
                category={category}
                label={path}
                context={contextOf(category)}
                aside={
                  category.history[0] && (
                    <span className="text-sm whitespace-nowrap">
                      {t('categories.archivedOn', {
                        date: formatDate(
                          category.history[0].effectiveOn,
                          locale,
                          'medium',
                        ),
                      })}
                    </span>
                  )
                }
              />
            </li>
          ))}
        </ListCard>
      )}
    </section>
  )
}
