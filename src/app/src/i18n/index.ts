import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './resources/en'
import { fr } from './resources/fr'
import { DEFAULT_LOCALE } from './locales'
import type { Locale } from './locales'

// One instance per render: a shared one would leak a language across requests.
export function createI18n(locale: Locale) {
  const instance = i18next.createInstance()
  void instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    resources: { fr: { translation: fr }, en: { translation: en } },
    initAsync: false,
    interpolation: { escapeValue: false },
  })
  return instance
}
