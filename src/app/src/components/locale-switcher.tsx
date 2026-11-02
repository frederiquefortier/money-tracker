import { useRouteContext, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LOCALES } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { cn, focusRing } from '#/lib/utils'
import { setLocale } from '#/server/session'

// Each language named in itself.
const LABELS: Record<Locale, { short: string; name: string }> = {
  fr: { short: 'FR', name: 'Français' },
  en: { short: 'EN', name: 'English' },
}

export function LocaleSwitcher() {
  const { t } = useTranslation()
  const router = useRouter()
  const { session } = useRouteContext({ from: '__root__' })

  async function change(locale: Locale) {
    if (locale === session.locale) return
    await setLocale({ data: { locale } })
    await router.invalidate()
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
          aria-pressed={locale === session.locale}
          onClick={() => void change(locale)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
            focusRing,
            locale === session.locale
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
