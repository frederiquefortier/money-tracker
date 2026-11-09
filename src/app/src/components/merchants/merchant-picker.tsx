import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { useInlineCreate } from '#/hooks/forms/use-inline-create'
import { compareByUse } from '#/lib/merchants/merchant'
import type { Merchant } from '#/lib/merchants/merchant'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { saveMerchant } from '#/server/merchants'

/**
 * TRX-05 (spec 13): the most used merchants first, matches by name while typing, and
 * "Créer « … »" for a new one with no default category.
 */
export function MerchantPicker({
  merchants: loaded,
  value,
  onChange,
}: {
  merchants: ReadonlyArray<Merchant>
  value: string | null
  onChange: (merchant: Merchant | null) => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { items: merchants, create } = useInlineCreate(loaded, {
    save: async (name) => {
      const result = await saveMerchant({
        data: { name, defaultCategoryId: null },
      })
      return result.ok
        ? { id: result.id, name, defaultCategoryId: null, transactionCount: 0 }
        : null
    },
    onCreated: onChange,
  })
  const options = [...merchants]
    .sort(compareByUse(locale))
    .map((m) => ({ value: m.id, label: m.name }))

  return (
    <Combobox
      label={t('transactions.merchant')}
      options={options}
      value={value}
      onChange={(id) => onChange(merchants.find((m) => m.id === id) ?? null)}
      clearLabel={t('transactions.clearMerchant')}
      createLabel={(text) => t('common.createText', { text })}
      onCreate={create}
      typedOrder={(a, b) => a.label.localeCompare(b.label, locale)}
    />
  )
}
