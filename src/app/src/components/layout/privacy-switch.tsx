import { useState } from 'react'
import { useRouteContext } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { PrivacyContext, usePrivacy } from '#/hooks/app/use-privacy'
import { forgetSession } from '#/lib/auth/session'
import { setFiguresHidden as saveFiguresHidden } from '#/server/session'

/**
 * Switches at once; the cookie follows so the next page load renders hidden. A failed
 * save keeps the switch for this visit only.
 */
export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const saved = useRouteContext({
    from: '__root__',
    select: (context) => context.session.figuresHidden,
  })
  const [figuresHidden, setShown] = useState(saved)

  function set(hidden: boolean) {
    setShown(hidden)
    void saveFiguresHidden({ data: { hidden } })
      .then(forgetSession)
      .catch(() => {})
  }

  return (
    <PrivacyContext value={{ figuresHidden, setFiguresHidden: set }}>
      {children}
    </PrivacyContext>
  )
}

export function PrivacySwitch() {
  const { t } = useTranslation()
  const { figuresHidden, setFiguresHidden } = usePrivacy()
  return (
    <IconButton
      icon={figuresHidden ? 'shield' : 'shield-off'}
      label={t('privacy.hideFigures')}
      pressed={figuresHidden}
      onClick={() => setFiguresHidden(!figuresHidden)}
    />
  )
}
