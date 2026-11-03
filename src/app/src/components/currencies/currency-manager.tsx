import { useState } from 'react'
import { Link, useRouteContext } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { CurrencyRow } from '#/components/currencies/currency-row'
import { useCurrencyActions } from '#/components/currencies/use-currency-actions'
import { Icon } from '#/components/icon'
import { useToast } from '#/components/toaster'
import { Button } from '#/components/ui/button'

/** The Devises list (spec 10), reused by first run (spec 17). */
export function CurrencyManager({
  heading,
  ratesFrom,
  openAccounts,
}: {
  heading: React.ReactNode
  ratesFrom: Record<string, string | null>
  openAccounts: Partial<Record<string, Array<string>>>
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const { session } = useRouteContext({ from: '__root__' })
  const { shown, favourite, makeDefault, remove } = useCurrencyActions()
  const [removing, setRemoving] = useState<string | null>(null)

  /** Why a currency cannot be removed, or null (CUR-04). */
  function removalBlock(code: string) {
    if (code === shown.defaultCurrency)
      return t('currencies.defaultCannotBeRemoved')
    const accounts = openAccounts[code] ?? []
    if (accounts.length === 0) return null
    return t('currencies.usedByAccount', {
      name: accounts[0],
      code,
      count: accounts.length - 1,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        {heading}
        <Button asChild variant="outline">
          <Link to="/settings/currencies/add">
            <Icon name="plus" className="size-4" />
            {t('currencies.add')}
          </Link>
        </Button>
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {shown.currencies.map((currency) => {
          const removeHint = removalBlock(currency.code)
          return (
            <CurrencyRow
              key={currency.code}
              currency={currency}
              isDefault={currency.code === shown.defaultCurrency}
              removeHint={removeHint}
              ratesFrom={ratesFrom[currency.code]}
              locale={session.locale}
              onFavourite={(on) => favourite(currency.code, on)}
              onMakeDefault={() => makeDefault(currency.code)}
              onRemove={() =>
                removeHint
                  ? toast({ text: removeHint })
                  : setRemoving(currency.code)
              }
            />
          )
        })}
      </ul>
      <ConfirmDialog
        open={removing !== null}
        title={t('currencies.removeConfirm', { code: removing ?? '' })}
        confirmLabel={t('currencies.remove')}
        irreversible={false}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) remove(removing)
          setRemoving(null)
        }}
      />
    </div>
  )
}
