import { useTranslation } from 'react-i18next'
import type { Category } from '#/lib/categories/category'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'

/**
 * CAT-03: the archive and reactivation dates, newest first, naming the category an event
 * came through. Read-only.
 */
export function CategoryHistory({
  category,
  byId,
}: {
  category: Category
  byId: ReadonlyMap<string, Category>
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (category.history.length === 0) return null
  return (
    <section className="flex flex-col gap-2 border-t pt-5">
      <h3 className="text-sm font-semibold">{t('categories.history')}</h3>
      <table className="text-sm text-muted-foreground">
        <tbody>
          {category.history.map((event) => {
            const via = event.viaId ? byId.get(event.viaId) : undefined
            const action =
              event.status === 'archived' ? 'historyArchived' : 'historyActive'
            return (
              <tr
                key={`${event.status}-${event.effectiveOn}`}
                className="border-b last:border-b-0"
              >
                <td className="w-px border-r py-1.5 pr-3 whitespace-nowrap tabular-nums">
                  {formatDate(event.effectiveOn, locale, 'short')}
                </td>
                <td className="py-1.5 pl-3">
                  {via
                    ? t(`categories.${action}With`, { name: via.name })
                    : t(`categories.${action}`)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
