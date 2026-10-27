import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './resources/en'
import { fr } from './resources/fr'
import { languageOf } from './locales'
import type { Locale } from './locales'

// One instance per render: on the server, concurrent requests can be in different
// languages, so a shared singleton would leak one user's language into another's page.
export function createI18n(locale: Locale) {
  const instance = i18next.createInstance()
  void instance.use(initReactI18next).init({
    lng: languageOf(locale),
    fallbackLng: 'fr',
    resources: { fr: { translation: fr }, en: { translation: en } },
    initAsync: false,
    interpolation: { escapeValue: false },
  })
  return instance
}
