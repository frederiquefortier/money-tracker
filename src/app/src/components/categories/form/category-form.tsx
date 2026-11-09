import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { AppearanceFields } from '#/components/categories/form/appearance-fields'
import { CategoryBadge } from '#/components/categories/category-badge'
import { FeeField } from '#/components/categories/form/fee-field'
import { KindTabs } from '#/components/categories/list/kind-tabs'
import { NecessityRadios } from '#/components/categories/form/necessity-radios'
import { useCategoryDraft } from '#/hooks/categories/use-category-draft'
import type {
  CategoryDraft,
  CategoryValues,
} from '#/hooks/categories/use-category-draft'
import { Combobox } from '#/components/combobox/combobox'
import { FormField } from '#/components/forms/form-field'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { nameFormSchema } from '#/lib/shared/validation'
import {
  categoryPath,
  childrenByParent,
  descendantIds,
  isArchived,
  usedTopColors,
} from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import { necessitySource } from '#/lib/categories/category-necessity'
import { useLocale } from '#/hooks/app/use-locale'
import { treeOrder } from '#/lib/shared/tree-layout'
import { saveCategory } from '#/server/categories'
import { indexById } from '#/lib/shared/collections'

/** Active categories of the same kind, as a tree; never the category or its branch. */
function parentOptions(
  categories: ReadonlyArray<Category>,
  self: { id: string | undefined; kind: Category['kind'] },
  locale: string,
) {
  const byId = indexById(categories)
  const branch = self.id
    ? descendantIds(self.id, childrenByParent(categories, locale))
    : new Set<string>()
  const eligible = categories.filter(
    (c) =>
      c.kind === self.kind &&
      !isArchived(c) &&
      c.id !== self.id &&
      !branch.has(c.id),
  )
  return treeOrder(eligible, locale).map(({ item: c, depth }) => ({
    value: c.id,
    label: categoryPath(c, byId),
    short: c.name,
    depth,
    parent: c.parentId ?? undefined,
    icon: <CategoryBadge icon={c.icon} color={c.color} size="sm" />,
  }))
}

/** The parent within the kind; a category cannot go under itself or its branch. */
function ParentField({
  draft,
  categories,
  categoryId,
}: {
  draft: CategoryDraft
  categories: ReadonlyArray<Category>
  categoryId?: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <Combobox
      label={t('categories.parent')}
      options={parentOptions(
        categories,
        { id: categoryId, kind: draft.kind },
        FORMAT_LOCALE[locale],
      )}
      value={draft.parent?.id ?? null}
      onChange={draft.setParent}
      clearLabel={t('categories.clearParent')}
    />
  )
}

/** CAT-10, expense only: a sub-category with no mark follows its nearest marked parent. */
function NecessityField({
  draft,
  categories,
}: {
  draft: CategoryDraft
  categories: ReadonlyArray<Category>
}) {
  if (draft.kind !== 'expense') return null
  const source = necessitySource(
    draft.parent?.id ?? null,
    indexById(categories),
  )
  return (
    <NecessityRadios
      value={draft.necessity}
      parentName={draft.parent?.name}
      source={source}
      onChange={draft.setNecessity}
    />
  )
}

/** SET-07: errors under the name, focus on the first one, values kept on failure. */
export function CategoryForm({
  categoryId,
  initial,
  categories,
  savedText,
  onSaved,
  children,
}: {
  categoryId?: string
  initial: CategoryValues
  categories: ReadonlyArray<Category>
  savedText: string
  /** The saved category's id, before the sheet closes (picked by the transaction form). */
  onSaved?: (id: string) => void
  /** Read-only content after the fields: the history. */
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  const panelId = useId()
  const draft = useCategoryDraft(categoryId, initial, categories)
  const form = useSheetForm({
    schema: nameFormSchema,
    initial: { name: initial.name },
    save: async (data) => {
      const result = await saveCategory({ data: draft.input(data.name) })
      if (result.ok) onSaved?.(result.id)
      return result
    },
    savedText,
  })
  const name = form.field('name')

  return (
    <SheetForm {...form.formProps}>
      <KindTabs
        kind={draft.kind}
        panelId={panelId}
        onChange={draft.setKind}
        singular
        disabled={draft.parent !== undefined}
      />
      <div id={panelId} className="contents">
        <AppearanceFields
          draft={draft}
          used={
            draft.parent
              ? new Set<string>()
              : usedTopColors(categories, draft.kind, categoryId)
          }
        />
        <FormField
          {...name}
          label={t('categories.name')}
          required
          autoComplete="off"
          onChange={(event) => {
            draft.setName(event.target.value)
            name.onChange(event)
          }}
        />
        <ParentField
          draft={draft}
          categories={categories}
          categoryId={categoryId}
        />
        <NecessityField draft={draft} categories={categories} />
        {draft.kind === 'expense' && (
          <FeeField
            checked={draft.isFee}
            locked={initial.isFee === true}
            onChange={draft.setFee}
          />
        )}
      </div>
      {children}
    </SheetForm>
  )
}
