import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { EmptyState } from '#/components/list-card'
import { SearchField } from '#/components/search-field'
import { Sheet, SheetBody, SheetContent } from '#/components/ui/sheet'
import { searchIcons } from '#/lib/categories'
import { cn, focusRing } from '#/lib/utils'

/**
 * CAT-07: the curated icons in the category's colour, searchable in French and English.
 * The suggestion from the name comes first, marked "Suggérée".
 */
export function IconPicker({
  open,
  color,
  value,
  suggested,
  onPick,
  onClose,
}: {
  open: boolean
  color: string
  value: string
  suggested: string
  onPick: (icon: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const found = searchIcons(query)
  const icons = query
    ? found
    : [
        ...found.filter((i) => i.name === suggested),
        ...found.filter((i) => i.name !== suggested),
      ]

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        title={t('categories.icon.choose')}
        closeLabel={t('common.close')}
      >
        <div className="border-b px-5 py-3">
          <SearchField value={query} onChange={setQuery} />
        </div>
        <SheetBody>
          {icons.length === 0 && <EmptyState>{t('common.noMatch')}</EmptyState>}
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2">
            {icons.map((icon) => (
              <li key={icon.name}>
                <button
                  type="button"
                  aria-pressed={icon.name === value}
                  aria-label={icon.words.slice(1, 4).join(', ')}
                  title={icon.words.slice(1, 4).join(', ')}
                  onClick={() => {
                    onPick(icon.name)
                    onClose()
                  }}
                  className={cn(
                    'flex w-full flex-col items-center gap-1 rounded-lg p-1.5 hover:bg-secondary',
                    icon.name === value && 'bg-secondary ring-2 ring-primary',
                    focusRing,
                  )}
                >
                  <CategoryBadge icon={icon.name} color={color} />
                  {icon.name === suggested && (
                    <span className="text-xs font-semibold text-primary">
                      {t('categories.icon.suggested')}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
