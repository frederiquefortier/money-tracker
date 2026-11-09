import { useActionState, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { SheetForm } from '#/components/sheet/sheet-form'
import { currencyName } from '#/lib/currencies/currency'
import type { Currency } from '#/lib/currencies/currency'
import { useLocale } from '#/hooks/app/use-locale'
import { addCurrency } from '#/server/currencies'
import { useToast } from '#/hooks/app/use-toast'
import { useCloseSheet } from '#/hooks/forms/use-sheet'

type Failure = 'unknown' | 'unavailable' | 'failed' | null

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
      const result = await addCurrency({ data: { code } }).catch(() => null)
      if (result?.ok) {
        toast({ text: t('currencies.added', { code }) })
        closeSheet()
        return null
      }
      if (result?.error === 'unknown' || result?.error === 'unavailable')
        return result.error
      return 'failed'
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
        {
          unknown: t('currencies.unknown', { code }),
          unavailable: t('currencies.hexaRateDown'),
          failed: t('common.saveFailed'),
        }[failure]
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
