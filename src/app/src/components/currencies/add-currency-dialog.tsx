import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import type { Locale } from '#/i18n/locales'
import { currencyName, searchCurrencies } from '#/lib/currencies'
import type { Currency } from '#/lib/currencies'
import { cn, focusRing } from '#/lib/utils'

/** CUR-02: the ISO list minus what the user has, searchable in both languages. */
export function AddCurrencyDialog({
  catalog,
  exclude,
  locale,
  onChoose,
}: {
  catalog: ReadonlyArray<Currency>
  exclude: ReadonlySet<string>
  locale: Locale
  onChoose: (currency: Currency) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const available = useMemo(
    () => catalog.filter((c) => !exclude.has(c.code)),
    [catalog, exclude],
  )
  const results = searchCurrencies(available, query)

  function choose(currency: Currency) {
    setOpen(false)
    setQuery('')
    onChoose(currency)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          <Icon name="plus" className="size-4" />
          {t('currencies.add')}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t('common.close')}
        aria-describedby={undefined}
        className="sm:h-[32rem]"
      >
        <DialogTitle>{t('currencies.add')}</DialogTitle>
        <div className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('currencies.search')}
            aria-label={t('currencies.search')}
            className="pl-9"
            autoFocus
          />
        </div>
        <CurrencyResults results={results} locale={locale} onChoose={choose} />
      </DialogContent>
    </Dialog>
  )
}

function CurrencyResults({
  results,
  locale,
  onChoose,
}: {
  results: ReadonlyArray<Currency>
  locale: Locale
  onChoose: (currency: Currency) => void
}) {
  const { t } = useTranslation()
  if (results.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t('currencies.noResults')}
      </p>
    )
  }
  return (
    <ul className="-mx-2 min-h-0 flex-1 overflow-y-auto">
      {results.map((currency) => (
        <li key={currency.code}>
          <button
            type="button"
            onClick={() => onChoose(currency)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left hover:bg-secondary/60',
              focusRing,
            )}
          >
            <span className="font-mono font-bold">{currency.code}</span>
            <span aria-hidden="true">-</span>
            <span className="min-w-0 flex-1 truncate">
              {currencyName(currency, locale)}
            </span>
            <span className="text-muted-foreground">{currency.symbol}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
