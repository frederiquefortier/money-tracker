import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckList } from '#/components/forms/check-list'
import { categoryTicks } from '#/components/forms/check-ticks'
import { SearchField } from '#/components/forms/search-field'
import { FilterFooter } from '#/components/sheet/filter-footer'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHead,
} from '#/components/ui/sheet'
import { useCategoryTree } from '#/hooks/transactions/use-check-trees'
import type { Category } from '#/lib/categories/category'

type Props = {
  categories: ReadonlyArray<Category>
  picked: ReadonlyArray<string>
  onChange: (picked: Array<string>) => void
  onClose: () => void
}

/** Mounted while the sheet is open, so the search starts empty each time. */
function CategoryFilter({ categories, picked, onChange, onClose }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const nodes = useCategoryTree(categories, query)
  const ticks = categoryTicks(categories, picked)
  return (
    <>
      <SheetHead>
        <SearchField
          value={query}
          onChange={setQuery}
          label={t('transactions.list.search.categories')}
        />
      </SheetHead>
      <SheetBody>
        {nodes.length ? (
          <CheckList
            nodes={nodes}
            stateOf={ticks.stateOf}
            onToggle={(node) => onChange(ticks.toggle(node))}
          />
        ) : (
          <p className="text-muted-foreground">{t('common.noMatch')}</p>
        )}
      </SheetBody>
      <FilterFooter
        cleared={picked.length === 0}
        onClear={() => onChange([])}
        onClose={onClose}
      />
    </>
  )
}

/**
 * DSH-02: the categories the Argent tab counts; a ticked one takes its branch. The
 * transactions' categories filter: its title, search and footer.
 */
export function CategoryFilterSheet({
  open,
  onOpenChange,
  ...filter
}: Omit<Props, 'onClose'> & {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={t('transactions.list.filters')}
        closeLabel={t('common.close')}
      >
        <CategoryFilter {...filter} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
