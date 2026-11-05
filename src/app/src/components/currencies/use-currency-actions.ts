import { useState } from 'react'
import { useServerAction } from '#/components/use-server-action'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import type { MyCurrencies } from '#/lib/currencies'
import { removeCurrency, setDefaultCurrency } from '#/server/currencies'

type Change =
  { type: 'default'; code: string } | { type: 'remove'; code: string }

function applyChange(state: MyCurrencies, change: Change): MyCurrencies {
  switch (change.type) {
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
  const { run } = useServerAction()
  const currencies = useMyCurrencies()
  const [pending, setPending] = useState<Array<Pending>>([])
  const [loaded, setLoaded] = useState(currencies)
  // New loader data contains every saved change (state adjusted during render).
  if (loaded !== currencies) {
    setLoaded(currencies)
    setPending((list) => list.filter((p) => !p.saved))
  }

  function save(change: Change, call: Parameters<typeof run>[0]) {
    const id = nextId++
    setPending((list) => [...list, { id, change, saved: false }])
    run(call, {
      onResult: (ok) =>
        setPending((list) =>
          ok
            ? list.map((p) => (p.id === id ? { ...p, saved: true } : p))
            : list.filter((p) => p.id !== id),
        ),
    })
  }

  return {
    shown: pending.reduce(
      (state, p) => applyChange(state, p.change),
      currencies,
    ),
    makeDefault: (code: string) =>
      save({ type: 'default', code }, () =>
        setDefaultCurrency({ data: { code } }),
      ),
    remove: (code: string) =>
      save({ type: 'remove', code }, () => removeCurrency({ data: { code } })),
  }
}
