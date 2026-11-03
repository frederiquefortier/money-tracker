import { useActionState, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox'
import { useCloseSheet } from '#/components/route-sheet'
import { SheetForm } from '#/components/sheet-form'
import { useToast } from '#/components/toaster'
import { currencyName } from '#/lib/currencies'
import type { Currency } from '#/lib/currencies'
import { useLocale } from '#/lib/use-locale'
import { addCurrency } from '#/server/currencies'

type Failure = 'unknown' | 'down' | null

/** CUR-02: one ISO currency, checked with HexaRate when it is added. */
export function AddCurrencyForm({
  catalog,
  owned,
}: {
  catalog: ReadonlyArray<Currency>
  owned: ReadonlySet<string>
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const toast = useToast()
  const closeSheet = useCloseSheet()
  const [code, setCode] = useState<string | null>(null)

  const [failure, submit, pending] = useActionState(
    async (): Promise<Failure> => {
      if (!code) return null
      const result = await addCurrency({ data: { code } })
      if (result.ok) {
        toast({ text: t('currencies.added', { code }) })
        closeSheet()
        return null
      }
      return result.error === 'unknown' ? 'unknown' : 'down'
    },
    null,
  )

  const options = catalog
    .filter((c) => !owned.has(c.code))
    .map((c) => ({
      value: c.code,
      label: `${c.code} - ${currencyName(c, locale)} (${c.symbol})`,
      keywords: `${c.nameFr} ${c.nameEn}`,
    }))

  return (
    <SheetForm
      action={submit}
      pending={pending}
      canSubmit={code !== null}
      submitLabel={t('common.add')}
      pendingLabel={t('currencies.adding')}
      error={
        failure &&
        (failure === 'unknown'
          ? t('currencies.unknown', { code })
          : t('currencies.hexaRateDown'))
      }
    >
      <Combobox
        label={t('currencies.currency')}
        required
        options={options}
        value={code}
        onChange={setCode}
        clearLabel={t('common.clear')}
      />
    </SheetForm>
  )
}
