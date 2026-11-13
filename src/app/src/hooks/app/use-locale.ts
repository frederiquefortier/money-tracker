import { useRouteContext } from '@tanstack/react-router'
import { FORMAT_LOCALE } from '#/i18n/locales'

// Selects the string: the root context is a new object at each navigation, and every
// amount on a list reads the locale, so the whole list re-rendered when a sheet opened.
export function useLocale() {
  return useRouteContext({
    from: '__root__',
    select: (context) => context.session.locale,
  })
}

/** The Intl locale ("fr-CA") for collation and formatting. */
export function useFormatLocale() {
  return FORMAT_LOCALE[useLocale()]
}
