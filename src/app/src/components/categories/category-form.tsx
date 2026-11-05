import { useActionState, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { AppearanceFields } from '#/components/categories/appearance-fields'
import { CategoryBadge } from '#/components/categories/category-badge'
import { KindTabs } from '#/components/categories/kind-tabs'
import { NecessityRadios } from '#/components/categories/necessity-radios'
import { useCategoryDraft } from '#/components/categories/use-category-draft'
import type {
  CategoryDraft,
  CategoryValues,
} from '#/components/categories/use-category-draft'
import { Combobox } from '#/components/combobox'
import { FormField } from '#/components/form-field'
import { useCloseSheet } from '#/components/route-sheet'
import { SheetForm } from '#/components/sheet-form'
import { FORMAT_LOCALE } from '#/i18n/locales'
import {
  categoryFormSchema,
  categoryPath,
  childrenByParent,
  descendantIds,
  isArchived,
  usedTopColors,
} from '#/lib/categories'
import type { Category } from '#/lib/categories'
import {
  formValues,
  savedState,
  useFieldValidation,
  useFocusFirstError,
  validate,
} from '#/lib/form'
import type { FormState } from '#/lib/form'
import { necessitySource } from '#/lib/necessity'
import { useLocale } from '#/lib/use-locale'
import { treeOrder } from '#/lib/tree'
import { saveCategory } from '#/server/categories'

type State = FormState<{ name: string }>

function useCategorySubmit(
  draft: CategoryDraft,
  initial: State['values'],
  onSaved: () => void,
) {
  return useActionState(
    async (_: State, form: FormData): Promise<State> => {
      const values = formValues(form, ['name'])
      const { data, errors } = validate(categoryFormSchema, values)
      if (!data) return { values, errors, failed: false }
      const result = await saveCategory({
        data: draft.input(data.name),
      })
      if (result.ok) onSaved()
      return savedState(values, result)
    },
    { values: initial, errors: {}, failed: false },
  )
}

/** Active categories of the same kind, as a tree; never the category or its branch. */
function parentOptions(
  categories: ReadonlyArray<Category>,
  self: { id: string | undefined; kind: Category['kind'] },
  locale: string,
) {
  const byId = new Map(categories.map((c) => [c.id, c]))
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
    new Map(categories.map((c) => [c.id, c])),
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
  onSaved,
  children,
}: {
  categoryId?: string
  initial: CategoryValues
  categories: ReadonlyArray<Category>
  onSaved: () => void
  /** Read-only content after the fields: the history. */
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  const panelId = useId()
  const closeSheet = useCloseSheet()
  const draft = useCategoryDraft(categoryId, initial, categories)
  const [state, submit, pending] = useCategorySubmit(
    draft,
    { name: initial.name },
    () => {
      onSaved()
      closeSheet()
    },
  )
  const fields = useFieldValidation(categoryFormSchema, state.errors)
  const formRef = useFocusFirstError(state.errors)

  return (
    <SheetForm
      action={submit}
      formRef={formRef}
      pending={pending}
      error={state.failed && t('common.saveFailed')}
    >
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
          name="name"
          label={t('categories.name')}
          required
          autoComplete="off"
          defaultValue={state.values.name}
          error={fields.error('name')}
          onBlur={fields.onBlur}
          onChange={(event) => {
            draft.setName(event.target.value)
            fields.onChange(event)
          }}
        />
        <ParentField
          draft={draft}
          categories={categories}
          categoryId={categoryId}
        />
        <NecessityField draft={draft} categories={categories} />
      </div>
      {children}
    </SheetForm>
  )
}
