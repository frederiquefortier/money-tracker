import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'
import { loadTranslations } from '#/i18n'
import { DEFAULT_LOCALE, isLocale } from '#/i18n/locales'

// Start's default client entry, after loading the page's language: hydration does not run
// the root's beforeLoad again, and the first render must match the server's text.
const lang = document.documentElement.lang
await loadTranslations(isLocale(lang) ? lang : DEFAULT_LOCALE)

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  )
})
