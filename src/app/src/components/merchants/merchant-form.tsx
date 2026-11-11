import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryPicker } from '#/components/categories/category-picker'
import { AliasList } from '#/components/forms/alias-list'
import { FormField } from '#/components/forms/form-field'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import type { Category } from '#/lib/categories/category'
import { takenMerchantNames } from '#/lib/merchants/merchant'
import type { Merchant } from '#/lib/merchants/merchant'
import { nameFormSchema } from '#/lib/shared/validation'
import { saveMerchant } from '#/server/merchants'

/** A new default category applies to new transactions only (MER-01). */
export function MerchantForm({
  merchant,
  merchants,
  categories,
  savedText,
}: {
  merchant: Merchant | null
  merchants: ReadonlyArray<Merchant>
  categories: ReadonlyArray<Category>
  savedText: string
}) {
  const { t } = useTranslation()
  const [categoryId, setCategoryId] = useState(
    merchant?.defaultCategoryId ?? null,
  )
  const [aliases, setAliases] = useState<Array<string>>([
    ...(merchant?.aliases ?? []),
  ])
  const form = useSheetForm({
    schema: nameFormSchema,
    initial: { name: merchant?.name ?? '' },
    save: (data) =>
      saveMerchant({
        data: {
          ...data,
          id: merchant?.id,
          defaultCategoryId: categoryId,
          aliases,
        },
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
      <AliasList
        label={t('merchants.aliases')}
        newLabel={t('merchants.newAlias')}
        aliases={aliases}
        taken={takenMerchantNames(merchants, merchant?.id)}
        onChange={setAliases}
      />
    </SheetForm>
  )
}
