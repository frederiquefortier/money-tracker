import { useOptimistic, useState, useTransition } from 'react'
import { useRouteContext, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useToast } from '#/components/toaster'
import type { Currency, MyCurrencies } from '#/lib/currencies'
import {
  addCurrency,
  removeCurrency,
  setDefaultCurrency,
  setFavourite,
} from '#/server/currencies'

type Change =
  | { type: 'favourite'; code: string; on: boolean }
  | { type: 'default'; code: string }
  | { type: 'remove'; code: string }

function applyChange(state: MyCurrencies, change: Change): MyCurrencies {
  switch (change.type) {
    case 'favourite':
      return {
        ...state,
        currencies: state.currencies.map((c) =>
          c.code === change.code ? { ...c, isFavourite: change.on } : c,
        ),
      }
    case 'default':
      return { ...state, defaultCurrency: change.code }
    case 'remove':
      return {
        ...state,
        currencies: state.currencies.filter((c) => c.code !== change.code),
      }
  }
}

export type Adding = {
  currency: Currency
  status: 'pending' | 'unknown' | 'down'
}

/** The user's currencies with optimistic writes; a failed write rolls back with a toast. */
export function useCurrencyActions() {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const { currencies } = useRouteContext({ from: '/_authed' })
  const [shown, change] = useOptimistic(currencies, applyChange)
  const [, startTransition] = useTransition()
  const [adding, setAdding] = useState<Adding | null>(null)

  function save(
    next: Change,
    call: () => Promise<{ ok: boolean }>,
    onSaved?: () => void,
  ) {
    startTransition(async () => {
      change(next)
      const result = await call()
      if (result.ok) onSaved?.()
      else toast({ text: t('common.saveFailed') })
      await router.invalidate()
    })
  }

  async function add(currency: Currency) {
    setAdding({ currency, status: 'pending' })
    const result = await addCurrency({ data: { code: currency.code } })
    if (!result.ok) {
      const status = result.error === 'unknown' ? 'unknown' : 'down'
      setAdding({ currency, status })
      return
    }
    await router.invalidate()
    setAdding(null)
  }

  function undoRemove(code: string) {
    // Adding back skips the HexaRate check (CUR-04).
    void addCurrency({ data: { code } }).then(() => router.invalidate())
  }

  return {
    shown,
    adding,
    add,
    favourite: (code: string, on: boolean) =>
      save({ type: 'favourite', code, on }, () =>
        setFavourite({ data: { code, on } }),
      ),
    makeDefault: (code: string) =>
      save({ type: 'default', code }, () =>
        setDefaultCurrency({ data: { code } }),
      ),
    remove: (code: string) =>
      save(
        { type: 'remove', code },
        () => removeCurrency({ data: { code } }),
        () =>
          toast({
            text: t('currencies.removed', { code }),
            action: {
              label: t('common.undo'),
              altText: t('common.undo'),
              onClick: () => undoRemove(code),
            },
          }),
      ),
  }
}
