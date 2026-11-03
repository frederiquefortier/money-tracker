import { useActionState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ColorField,
  IconField,
} from '#/components/categories/appearance-fields'
import { CategoryBadge } from '#/components/categories/category-badge'
import { useCategoryDraft } from '#/components/categories/use-category-draft'
import type {
  CategoryDraft,
  CategoryValues,
} from '#/components/categories/use-category-draft'
import { Combobox } from '#/components/combobox'
import { FormField } from '#/components/form-field'
import { LinkedFields } from '#/components/linked-fields'
import { useCloseSheet } from '#/components/route-sheet'
import { SelectField } from '#/components/select-field'
import { SheetForm } from '#/components/sheet-form'
import { FORMAT_LOCALE } from '#/i18n/locales'
import {
  KINDS,
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
import { useLocale } from '#/lib/use-locale'
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

/** Active categories of the same kind, by path; never the category or its branch. */
function parentOptions(
  categories: ReadonlyArray<Category>,
  self: { id: string | undefined; kind: Category['kind'] },
  locale: string,
) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const branch = self.id
    ? descendantIds(self.id, childrenByParent(categories, locale))
    : new Set<string>()
  return categories
    .filter(
      (c) =>
        c.kind === self.kind &&
        !isArchived(c) &&
        c.id !== self.id &&
        !branch.has(c.id),
    )
    .map((c) => ({
      value: c.id,
      label: categoryPath(c, byId),
      icon: <CategoryBadge icon={c.icon} color={c.color} size="sm" />,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale))
}

/** Type, then the parent within it: only a top-level category chooses its type (CAT-02). */
function PlacementFields({
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
    <>
      <SelectField
        name="kind"
        label={t('categories.type')}
        value={draft.kind}
        disabled={draft.parent !== undefined}
        onChange={(event) =>
          draft.setKind(
            KINDS.find((k) => k === event.target.value) ?? 'expense',
          )
        }
        options={KINDS.map((k) => ({
          value: k,
          label: t(`categories.kind.${k}`),
        }))}
      />
      <LinkedFields>
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
      </LinkedFields>
    </>
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
      <PlacementFields
        draft={draft}
        categories={categories}
        categoryId={categoryId}
      />
      <IconField draft={draft} />
      <ColorField
        draft={draft}
        used={
          draft.parent
            ? new Set<string>()
            : usedTopColors(categories, draft.kind, categoryId)
        }
      />
      {children}
    </SheetForm>
  )
}
