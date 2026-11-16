import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Messages } from './fr'
import type { Locale } from './locales'

// Each language is its own chunk: the browser downloads only the one it shows. The root's
// beforeLoad loads it before a render (server, language switch), and the client entry
// before hydration.
const IMPORTS: Record<Locale, () => Promise<Messages>> = {
  fr: () => import('./fr').then((module) => module.fr),
  en: () => import('./en').then((module) => module.en),
}

// Translations are the same for everyone, so the server keeps them across requests. The
// cache lives on globalThis: after a hot reload in dev, Vite serves a second copy of this
// module (`index.ts?t=…`) to new importers, and a module-level cache would be empty there.
const cache = globalThis as {
  moneyTrackerTranslations?: Partial<Record<Locale, Messages>>
}
const loaded = (cache.moneyTrackerTranslations ??= {})

export async function loadTranslations(locale: Locale) {
  loaded[locale] ??= await IMPORTS[locale]()
}

// One instance per render: a shared one would leak a language across requests.
export function createI18n(locale: Locale) {
  const translation = loaded[locale]
  if (!translation)
    throw new Error(`Translations for ${locale} were not loaded`)
  const instance = i18next.createInstance()
  void instance.use(initReactI18next).init({
    lng: locale,
    resources: { [locale]: { translation } },
    initAsync: false,
    interpolation: { escapeValue: false },
  })
  return instance
}
