import { useTranslation } from 'react-i18next'
import type { Category } from '#/lib/categories'
import { formatDate } from '#/lib/format'
import { useLocale } from '#/lib/use-locale'

/** CAT-03: the archive and reactivation dates, newest first. Read-only. */
export function CategoryHistory({ category }: { category: Category }) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (category.history.length === 0) return null
  return (
    <section className="flex flex-col gap-1 border-t pt-5">
      <h3 className="text-sm font-semibold">{t('categories.history')}</h3>
      <ul className="text-sm text-muted-foreground">
        {category.history.map((event) => (
          <li key={`${event.status}-${event.effectiveOn}`}>
            {t(
              event.status === 'archived'
                ? 'categories.historyArchived'
                : 'categories.historyActive',
              { date: formatDate(event.effectiveOn, locale) },
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
