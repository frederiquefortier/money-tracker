import { useTranslation } from 'react-i18next'
import { useServerAction } from '#/hooks/app/use-server-action'
import { LOCALES } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'
import { setLocale } from '#/server/session'
import { forgetSession } from '#/lib/auth/session'
import { focusRing } from '#/components/styles'

// Each language named in itself.
const LABELS: Record<Locale, { short: string; name: string }> = {
  fr: { short: 'FR', name: 'Français' },
  en: { short: 'EN', name: 'English' },
}

export function LocaleSwitcher() {
  const { t } = useTranslation()
  const current = useLocale()
  const { run } = useServerAction()

  function change(locale: Locale) {
    if (locale === current) return
    run(async () => {
      const result = await setLocale({ data: { locale } })
      forgetSession()
      return result
    })
  }

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className="inline-flex rounded-full bg-secondary p-1"
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          title={LABELS[locale].name}
          aria-label={LABELS[locale].name}
          aria-pressed={locale === current}
          onClick={() => change(locale)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
            focusRing,
            locale === current
              ? 'bg-card text-primary'
              : 'text-secondary-foreground/70 hover:text-secondary-foreground',
          )}
        >
          {LABELS[locale].short}
        </button>
      ))}
    </div>
  )
}
