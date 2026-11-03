import { useRouteContext } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AddCurrencyDialog } from '#/components/currencies/add-currency-dialog'
import {
  CurrencyRow,
  PendingCurrencyRow,
} from '#/components/currencies/currency-row'
import { useCurrencyActions } from '#/components/currencies/use-currency-actions'
import type { Adding } from '#/components/currencies/use-currency-actions'
import { FormAlert } from '#/components/form-field'
import { useToast } from '#/components/toaster'
import { Button } from '#/components/ui/button'
import type { Currency } from '#/lib/currencies'

/** The Devises list (spec 10), reused by first run (spec 17). */
export function CurrencyManager({
  heading,
  catalog,
  ratesFrom,
}: {
  heading: React.ReactNode
  catalog: ReadonlyArray<Currency>
  ratesFrom: Record<string, string | null>
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const { session } = useRouteContext({ from: '__root__' })
  const { shown, adding, add, favourite, makeDefault, remove } =
    useCurrencyActions()

  const owned = new Set(shown.currencies.map((c) => c.code))
  if (adding) owned.add(adding.currency.code)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        {heading}
        <AddCurrencyDialog
          catalog={catalog}
          exclude={owned}
          locale={session.locale}
          onChoose={(currency) => void add(currency)}
        />
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {shown.currencies.map((currency) => {
          const isDefault = currency.code === shown.defaultCurrency
          return (
            <CurrencyRow
              key={currency.code}
              currency={currency}
              isDefault={isDefault}
              ratesFrom={ratesFrom[currency.code]}
              locale={session.locale}
              onFavourite={(on) => favourite(currency.code, on)}
              onMakeDefault={() => makeDefault(currency.code)}
              onRemove={() =>
                isDefault
                  ? toast({ text: t('currencies.defaultCannotBeRemoved') })
                  : remove(currency.code)
              }
            />
          )
        })}
        {adding?.status === 'pending' && (
          <PendingCurrencyRow
            currency={adding.currency}
            locale={session.locale}
          />
        )}
      </ul>
      {adding && adding.status !== 'pending' && (
        <AddFailure adding={adding} onRetry={() => void add(adding.currency)} />
      )}
    </div>
  )
}

function AddFailure({
  adding,
  onRetry,
}: {
  adding: Adding
  onRetry: () => void
}) {
  const { t } = useTranslation()
  if (adding.status === 'unknown') {
    return (
      <FormAlert>
        {t('currencies.unknown', { code: adding.currency.code })}
      </FormAlert>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <FormAlert>{t('currencies.hexaRateDown')}</FormAlert>
      <Button
        variant="outline"
        className="self-start rounded-xl"
        onClick={onRetry}
      >
        {t('currencies.retry')}
      </Button>
    </div>
  )
}
