import { useTranslation } from 'react-i18next'
import { LocaleSwitcher } from '#/components/locale-switcher'
import { Logo } from '#/components/logo'

/** Layout of the signed-out screens: the pig, then the page's card; language top right. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <>
      <div className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-10">
        <LocaleSwitcher />
      </div>
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
        <div className="flex justify-center">
          <Logo name={t('app.name')} showName={false} size="lg" />
        </div>
        {children}
      </main>
    </>
  )
}
