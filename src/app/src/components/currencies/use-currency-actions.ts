import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { useToast } from '#/components/toaster'
import type { MyCurrencies } from '#/lib/currencies'
import {
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

type Pending = { id: number; change: Change; saved: boolean }

let nextId = 0

/**
 * The user's currencies with immediate feedback. A change shows at once and stays until
 * loader data that includes it arrives, so it never flashes back to the old state; a
 * failed change is dropped with a toast.
 */
export function useCurrencyActions() {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const currencies = useMyCurrencies()
  const [pending, setPending] = useState<Array<Pending>>([])
  const [loaded, setLoaded] = useState(currencies)
  // New loader data contains every saved change (state adjusted during render).
  if (loaded !== currencies) {
    setLoaded(currencies)
    setPending((list) => list.filter((p) => !p.saved))
  }

  async function save(change: Change, call: () => Promise<{ ok: boolean }>) {
    const id = nextId++
    setPending((list) => [...list, { id, change, saved: false }])
    const result = await call()
    if (!result.ok) {
      setPending((list) => list.filter((p) => p.id !== id))
      toast({ text: t('common.saveFailed') })
      return
    }
    setPending((list) =>
      list.map((p) => (p.id === id ? { ...p, saved: true } : p)),
    )
    await router.invalidate()
  }

  return {
    shown: pending.reduce(
      (state, p) => applyChange(state, p.change),
      currencies,
    ),
    favourite: (code: string, on: boolean) =>
      void save({ type: 'favourite', code, on }, () =>
        setFavourite({ data: { code, on } }),
      ),
    makeDefault: (code: string) =>
      void save({ type: 'default', code }, () =>
        setDefaultCurrency({ data: { code } }),
      ),
    remove: (code: string) =>
      void save({ type: 'remove', code }, () =>
        removeCurrency({ data: { code } }),
      ),
  }
}
