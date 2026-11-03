import { useActionState, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox'
import { FormAlert } from '#/components/form-field'
import { useCloseSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { Button } from '#/components/ui/button'
import { SheetBody, SheetClose, SheetFooter } from '#/components/ui/sheet'
import type { Locale } from '#/i18n/locales'
import { currencyName } from '#/lib/currencies'
import type { Currency } from '#/lib/currencies'
import { addCurrency } from '#/server/currencies'

type Failure = 'unknown' | 'down' | null

/** CUR-02: one ISO currency, checked with HexaRate when it is added. */
export function AddCurrencyForm({
  catalog,
  owned,
  locale,
}: {
  catalog: ReadonlyArray<Currency>
  owned: ReadonlySet<string>
  locale: Locale
}) {
  const { t } = useTranslation()
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
    <form action={submit} className="flex min-h-0 flex-1 flex-col">
      <SheetBody className="flex flex-col gap-5">
        <Combobox
          label={t('currencies.currency')}
          required
          options={options}
          value={code}
          onChange={setCode}
          clearLabel={t('common.clear')}
        />
        {failure && (
          <FormAlert>
            {failure === 'unknown'
              ? t('currencies.unknown', { code })
              : t('currencies.hexaRateDown')}
          </FormAlert>
        )}
      </SheetBody>
      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="ghost">
            {t('common.cancel')}
          </Button>
        </SheetClose>
        <Button type="submit" disabled={!code || pending}>
          {pending ? t('currencies.adding') : t('currencies.addShort')}
        </Button>
      </SheetFooter>
    </form>
  )
}
