import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryPicker } from '#/components/categories/category-picker'
import { FormField } from '#/components/forms/form-field'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import type { Category } from '#/lib/categories/category'
import { merchantFormSchema } from '#/lib/merchants/merchant'
import type { Merchant } from '#/lib/merchants/merchant'
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
