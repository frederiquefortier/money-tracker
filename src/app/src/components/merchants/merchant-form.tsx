import { useActionState, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryPicker } from '#/components/categories/category-picker'
import { FormField } from '#/components/form-field'
import { useCloseSheet } from '#/components/route-sheet'
import { SheetForm } from '#/components/sheet-form'
import type { Category } from '#/lib/categories'
import {
  formValues,
  savedState,
  useFieldValidation,
  useFocusFirstError,
  validate,
} from '#/lib/form'
import type { FormState } from '#/lib/form'
import { merchantFormSchema } from '#/lib/merchants'
import type { Merchant } from '#/lib/merchants'
import { saveMerchant } from '#/server/merchants'

type State = FormState<{ name: string }>

function useMerchantSubmit({
  merchantId,
  initialName,
  categoryId,
  onSaved,
}: {
  merchantId: string | undefined
  initialName: string
  categoryId: string | null
  onSaved: () => void
}) {
  return useActionState(
    async (_: State, form: FormData): Promise<State> => {
      const values = formValues(form, ['name'])
      const { data, errors } = validate(merchantFormSchema, values)
      if (!data) return { values, errors, failed: false }
      const result = await saveMerchant({
        data: {
          id: merchantId,
          name: data.name,
          defaultCategoryId: categoryId,
        },
      })
      if (result.ok) onSaved()
      return savedState(values, result)
    },
    { values: { name: initialName }, errors: {}, failed: false },
  )
}

/** Spec 13. A new default category applies to new transactions only (MER-01). */
export function MerchantForm({
  merchant,
  categories,
  onSaved,
}: {
  merchant: Merchant | null
  categories: ReadonlyArray<Category>
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const closeSheet = useCloseSheet()
  const [categoryId, setCategoryId] = useState(
    merchant?.defaultCategoryId ?? null,
  )
  const [state, submit, pending] = useMerchantSubmit({
    merchantId: merchant?.id,
    initialName: merchant?.name ?? '',
    categoryId,
    onSaved: () => {
      onSaved()
      closeSheet()
    },
  })
  const fields = useFieldValidation(merchantFormSchema, state.errors)
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
        label={t('merchants.name')}
        required
        defaultValue={state.values.name}
        error={fields.error('name')}
        onBlur={fields.onBlur}
        onChange={fields.onChange}
      />
      <CategoryPicker
        label={t('merchants.defaultCategory')}
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
      />
    </SheetForm>
  )
}
