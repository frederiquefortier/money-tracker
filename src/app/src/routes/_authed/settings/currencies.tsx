import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CurrencyManager } from '#/components/currencies/currency-manager'
import { Icon } from '#/components/icon'
import { cn, focusRing } from '#/lib/utils'
import { getCurrencySettings } from '#/server/currencies'

export const Route = createFileRoute('/_authed/settings/currencies')({
  loader: () => getCurrencySettings(),
  component: Currencies,
})

function Currencies() {
  const { t } = useTranslation()
  const { catalog, ratesFrom } = Route.useLoaderData()

  return (
    <div className="flex flex-col gap-4">
      {/* Top left of the page, outside the centred column. */}
      <Link
        to="/settings"
        className={cn(
          'flex items-center gap-1 self-start rounded-lg text-sm font-semibold text-primary',
          focusRing,
        )}
      >
        <Icon name="arrow-left" className="size-5 [&_path]:stroke-[2.5]" />
        {t('settings.back')}
      </Link>
      <div className="mx-auto w-full max-w-[40rem]">
        <CurrencyManager
          heading={
            <h1 className="font-mono text-xl font-bold tracking-wide uppercase">
              {t('currencies.title')}
            </h1>
          }
          catalog={catalog}
          ratesFrom={ratesFrom}
        />
      </div>
    </div>
  )
}
