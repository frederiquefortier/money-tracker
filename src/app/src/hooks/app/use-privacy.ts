import { createContext, useContext } from 'react'
import { formatHiddenMoney, formatMoney } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'

export type Privacy = {
  figuresHidden: boolean
  setFiguresHidden: (hidden: boolean) => void
}

export const PrivacyContext = createContext<Privacy>({
  figuresHidden: false,
  setFiguresHidden: () => {},
})

/** SET-08: whether figures show as bullets, and the switch. */
export function usePrivacy() {
  return useContext(PrivacyContext)
}

/** formatMoney for text (a dialog, a tag), hidden in privacy mode. */
export function useMoneyText() {
  const locale = useLocale()
  const { figuresHidden } = usePrivacy()
  return (amount: string, currency: string) =>
    figuresHidden
      ? formatHiddenMoney(currency, locale)
      : formatMoney(amount, currency, locale)
}
