import type { Locale } from '#/i18n/locales'

export type Session = {
  locale: Locale
  user: { email: string } | null
  aal: 'aal1' | 'aal2' | null
  hasTotp: boolean
}
