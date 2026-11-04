import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox'
import { useToast } from '#/components/toaster'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Merchant } from '#/lib/merchants'
import { useLocale } from '#/lib/use-locale'
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
  const toast = useToast()
  const router = useRouter()
  const locale = FORMAT_LOCALE[useLocale()]
  const [created, setCreated] = useState<Array<Merchant>>([])
  const merchants = [
    ...loaded,
    ...created.filter((c) => !loaded.some((l) => l.id === c.id)),
  ]
  const options = [...merchants]
    .sort(
      (a, b) =>
        b.transactionCount - a.transactionCount ||
        a.name.localeCompare(b.name, locale),
    )
    .map((m) => ({ value: m.id, label: m.name }))

  async function create(name: string) {
    const result = await saveMerchant({
      data: { name, defaultCategoryId: null },
    }).catch(() => null)
    if (!result?.ok) {
      toast({ text: t('common.saveFailed') })
      return
    }
    const merchant = {
      id: result.id,
      name,
      defaultCategoryId: null,
      transactionCount: 0,
    }
    setCreated((list) => [...list, merchant])
    onChange(merchant)
    await router.invalidate()
  }

  return (
    <Combobox
      label={t('transactions.merchant')}
      options={options}
      value={value}
      onChange={(id) => onChange(merchants.find((m) => m.id === id) ?? null)}
      clearLabel={t('transactions.clearMerchant')}
      createLabel={(text) => t('common.createText', { text })}
      onCreate={(name) => void create(name)}
      typedOrder={(a, b) => a.label.localeCompare(b.label, locale)}
    />
  )
}
