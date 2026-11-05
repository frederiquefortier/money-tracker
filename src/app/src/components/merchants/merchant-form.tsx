import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryPicker } from '#/components/categories/category-picker'
import { FormField } from '#/components/form-field'
import { SheetForm } from '#/components/sheet-form'
import { useSheetForm } from '#/components/use-sheet-form'
import type { Category } from '#/lib/categories'
import { merchantFormSchema } from '#/lib/merchants'
import type { Merchant } from '#/lib/merchants'
import { saveMerchant } from '#/server/merchants'

/** Spec 13. A new default category applies to new transactions only (MER-01). */
export function MerchantForm({
  merchant,
  categories,
  savedText,
}: {
  merchant: Merchant | null
  categories: ReadonlyArray<Category>
  savedText: string
}) {
  const { t } = useTranslation()
  const [categoryId, setCategoryId] = useState(
    merchant?.defaultCategoryId ?? null,
  )
  const form = useSheetForm({
    schema: merchantFormSchema,
    initial: { name: merchant?.name ?? '' },
    save: (data) =>
      saveMerchant({
        data: { ...data, id: merchant?.id, defaultCategoryId: categoryId },
      }),
    savedText,
  })

  return (
    <SheetForm {...form.formProps}>
      <FormField {...form.field('name')} label={t('merchants.name')} required />
      <CategoryPicker
        label={t('merchants.defaultCategory')}
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
      />
    </SheetForm>
  )
}
