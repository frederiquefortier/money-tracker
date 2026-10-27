import { useRouteContext, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LOCALES, isLocale } from '#/i18n/locales'
import { localeName } from '#/lib/format'
import { setLocale } from '#/server/session'

export function LocaleSwitcher() {
  const { t } = useTranslation()
  const router = useRouter()
  const { session } = useRouteContext({ from: '__root__' })

  async function change(value: string) {
    if (!isLocale(value)) return
    await setLocale({ data: { locale: value } })
    await router.invalidate()
  }

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="sr-only">{t('common.language')}</span>
      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        value={session.locale}
        onChange={(event) => void change(event.target.value)}
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale} lang={locale}>
            {localeName(locale)}
          </option>
        ))}
      </select>
    </label>
  )
}
