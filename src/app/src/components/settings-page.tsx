import { useTranslation } from 'react-i18next'
import { BackLink } from '#/components/back-link'

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-mono text-xl font-bold tracking-wide uppercase">
      {children}
    </h1>
  )
}

/** A Réglages screen: back to Réglages, then one centred column under its title. */
export function SettingsPage({
  title,
  actions,
  back = true,
  children,
}: {
  title: string
  actions?: React.ReactNode
  back?: boolean
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      {back && <BackLink to="/settings" label={t('settings.back')} />}
      <div className="mx-auto flex w-full max-w-[40rem] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageTitle>{title}</PageTitle>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
