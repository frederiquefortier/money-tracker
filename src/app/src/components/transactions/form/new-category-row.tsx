import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryForm } from '#/components/categories/form/category-form'
import { CreateButton } from '#/components/forms/create-row'
import { FormSheet } from '#/components/sheet/route-sheet'
import { useRefresh } from '#/hooks/app/use-refresh'
import { DEFAULT_ICON, nextTopColor } from '#/lib/categories/category'
import type { Category, CategoryKind } from '#/lib/categories/category'

/**
 * The Catégories form, over the transaction, at the top of the open type. Once closed,
 * the data is refreshed so the new category is there to show, then `onClosed` gets its
 * id, or null when nothing was saved.
 */
function NewCategorySheet({
  kind,
  categories,
  onClosed,
}: {
  kind: CategoryKind
  categories: ReadonlyArray<Category>
  onClosed: (id: string | null) => void
}) {
  const { t } = useTranslation()
  const refresh = useRefresh()
  const saved = useRef<string | null>(null)
  return (
    <FormSheet
      title={t('categories.newTitle')}
      onClosed={() => void refresh().then(() => onClosed(saved.current))}
    >
      <CategoryForm
        initial={{
          name: '',
          kind,
          parentId: null,
          icon: DEFAULT_ICON,
          iconIsAuto: true,
          color: nextTopColor(categories, kind),
          colorIsAuto: false,
          necessity: null,
        }}
        categories={categories}
        savedText={t('categories.created')}
        onSaved={(id) => {
          saved.current = id
        }}
      />
    </FormSheet>
  )
}

/** "+ Nouvelle catégorie" closing the tree, and the form it opens. */
export function NewCategoryRow({
  kind,
  categories,
  onPick,
}: {
  kind: CategoryKind
  categories: ReadonlyArray<Category>
  onPick: (categoryId: string) => void
}) {
  const { t } = useTranslation()
  const [creating, setCreating] = useState(false)
  return (
    <>
      <CreateButton
        label={t('categories.newTitle')}
        onClick={() => setCreating(true)}
      />
      {creating && (
        <NewCategorySheet
          kind={kind}
          categories={categories}
          onClosed={(id) => {
            setCreating(false)
            if (id) onPick(id)
          }}
        />
      )}
    </>
  )
}
