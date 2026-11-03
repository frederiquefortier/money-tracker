import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { CurrencyRow } from '#/components/currencies/currency-row'
import { useCurrencyActions } from '#/components/currencies/use-currency-actions'
import { Icon } from '#/components/icon'
import { ListCard } from '#/components/list-card'
import { useToast } from '#/components/toaster'
import { Button } from '#/components/ui/button'

export function AddCurrencyButton() {
  const { t } = useTranslation()
  return (
    <Button asChild variant="outline">
      <Link to="/settings/currencies/add">
        <Icon name="plus" className="size-4" />
        {t('currencies.add')}
      </Link>
    </Button>
  )
}

/** The Devises list (spec 10), reused by first run (spec 17). */
export function CurrencyManager({
  ratesFrom,
  openAccounts,
}: {
  ratesFrom: Record<string, string | null>
  openAccounts: Partial<Record<string, Array<string>>>
}) {
  const { t } = useTranslation()
  const toast = useToast()
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
    <>
      <ListCard>
        {shown.currencies.map((currency) => {
          const removeHint = removalBlock(currency.code)
          return (
            <CurrencyRow
              key={currency.code}
              currency={currency}
              isDefault={currency.code === shown.defaultCurrency}
              removeHint={removeHint}
              ratesFrom={ratesFrom[currency.code]}
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
      </ListCard>
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
    </>
  )
}
