import { useOptimistic, useTransition } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { Icon } from '#/components/icon'
import { useToast } from '#/components/toaster'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { pickerOrder } from '#/lib/currencies'
import { cn, focusRing } from '#/lib/utils'
import { setDisplayCurrency } from '#/server/currencies'

/** CUR-06: the currency every amount is shown in, saved on the profile. */
export function DisplayCurrencySwitcher() {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const currencies = useMyCurrencies()
  const [shown, setShown] = useOptimistic(currencies.displayCurrency)
  const [, startTransition] = useTransition()

  function choose(code: string) {
    if (code === shown) return
    startTransition(async () => {
      setShown(code)
      const result = await setDisplayCurrency({ data: { code } })
      if (!result.ok) toast({ text: t('common.saveFailed') })
      await router.invalidate()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('displayCurrency.label', { code: shown })}
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-mono text-sm font-semibold text-secondary-foreground',
          focusRing,
        )}
      >
        {shown}
        <Icon name="chevron-down" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={shown} onValueChange={choose}>
          {pickerOrder(currencies.currencies).map((currency) => (
            <DropdownMenuRadioItem key={currency.code} value={currency.code}>
              <span className="font-mono font-semibold">{currency.code}</span>
              {currency.isFavourite && (
                <Icon name="star-fill" className="size-3.5 text-primary" />
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
