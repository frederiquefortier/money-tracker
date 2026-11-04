import { useOptimistic } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyChip } from '#/components/currency-chip'
import { useServerAction } from '#/components/use-server-action'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { setDisplayCurrency } from '#/server/currencies'

/** CUR-06: the currency every amount is shown in, saved on the profile. */
export function DisplayCurrencySwitcher() {
  const { t } = useTranslation()
  const { run } = useServerAction()
  const currencies = useMyCurrencies()
  const [shown, setShown] = useOptimistic(currencies.displayCurrency)

  function choose(code: string) {
    if (code === shown) return
    // Called inside the transition, so the optimistic code shows until the save ends.
    run(() => {
      setShown(code)
      return setDisplayCurrency({ data: { code } })
    })
  }

  return (
    <CurrencyChip
      value={shown}
      label={t('displayCurrency.label', { code: shown })}
      currencies={currencies.currencies}
      onChange={choose}
    />
  )
}
