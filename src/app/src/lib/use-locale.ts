import { useRouteContext } from '@tanstack/react-router'
import { FORMAT_LOCALE } from '#/i18n/locales'

export function useLocale() {
  return useRouteContext({ from: '__root__' }).session.locale
}

/** The Intl locale ("fr-CA") for collation and formatting. */
export function useFormatLocale() {
  return FORMAT_LOCALE[useLocale()]
}
