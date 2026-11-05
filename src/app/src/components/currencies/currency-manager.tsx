import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FloatingAddLink } from '#/components/floating-add-button'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { CurrencyRow } from '#/components/currencies/currency-row'
import { useCurrencyActions } from '#/components/currencies/use-currency-actions'
import { ListCard } from '#/components/list-card'
import { useToast } from '#/components/toaster'

/** One thing to add, so the + goes straight to its form (shared patterns). */
export function AddCurrencyButton() {
  const { t } = useTranslation()
  return (
    <FloatingAddLink
      to="/settings/currencies/add"
      label={t('currencies.add')}
    />
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
  const { shown, makeDefault, remove } = useCurrencyActions()
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
        confirmLabel={t('common.remove')}
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
