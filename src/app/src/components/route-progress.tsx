import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

// Waits before showing so preloaded routes, which resolve at once, never flash the bar.
const SHOW_DELAY_MS = 150

export function RouteProgress() {
  const { t } = useTranslation()
  const isLoading = useRouterState({ select: (s) => s.status === 'pending' })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setVisible(false)
      return
    }
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      role="progressbar"
      aria-label={t('common.loading')}
      className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <div className="route-progress h-full w-1/3 motion-reduce:w-full" />
    </div>
  )
}
