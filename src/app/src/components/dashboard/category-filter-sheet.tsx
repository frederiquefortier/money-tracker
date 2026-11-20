import { useTranslation } from 'react-i18next'
import { CheckList } from '#/components/forms/check-list'
import { categoryTicks } from '#/components/forms/check-ticks'
import { Button } from '#/components/ui/button'
import { Sheet, SheetBody, SheetContent } from '#/components/ui/sheet'
import { useCategoryTree } from '#/hooks/transactions/use-check-trees'
import type { Category } from '#/lib/categories/category'

/** DSH-02: the categories the Argent tab counts; a ticked one takes its branch. */
export function CategoryFilterSheet({
  open,
  onOpenChange,
  categories,
  picked,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ReadonlyArray<Category>
  picked: ReadonlyArray<string>
  onChange: (picked: Array<string>) => void
}) {
  const { t } = useTranslation()
  const nodes = useCategoryTree(categories, '')
  const ticks = categoryTicks(categories, picked)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={t('dashboard.categories.filter')}
        closeLabel={t('common.close')}
      >
        <SheetBody>
          {picked.length > 0 && (
            <Button
              variant="outline"
              className="self-start"
              onClick={() => onChange([])}
            >
              {t('dashboard.categories.clear')}
            </Button>
          )}
          <CheckList
            nodes={nodes}
            stateOf={ticks.stateOf}
            onToggle={(node) => onChange(ticks.toggle(node))}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
