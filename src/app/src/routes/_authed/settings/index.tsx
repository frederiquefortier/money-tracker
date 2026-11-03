import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import type { IconName } from '#/components/icon'
import { cn, focusRing } from '#/lib/utils'
import { signOut } from '#/server/session'

export const Route = createFileRoute('/_authed/settings/')({
  component: Settings,
})

// A row appears once its screen exists (spec 10).
const SCREENS = [
  { to: '/settings/currencies', label: 'settings.currencies', icon: 'coins' },
] as const satisfies ReadonlyArray<{
  to: string
  label: string
  icon: IconName
}>

const row = cn(
  'flex w-full items-center gap-3 px-4 py-3.5 text-left font-semibold transition-colors hover:bg-secondary/60',
  focusRing,
)

function Settings() {
  const { t } = useTranslation()
  const router = useRouter()

  async function leave() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/sign-in' })
  }

  return (
    <div className="mx-auto flex max-w-[40rem] flex-col gap-4">
      <h1 className="font-mono text-xl font-bold tracking-wide uppercase">
        {t('settings.title')}
      </h1>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {SCREENS.map((screen) => (
          <li key={screen.to}>
            <Link to={screen.to} className={row}>
              <Icon name={screen.icon} className="text-primary" />
              <span className="flex-1">{t(screen.label)}</span>
              <Icon
                name="arrow-right"
                className="size-5 text-muted-foreground [&_path]:stroke-[2.5]"
              />
            </Link>
          </li>
        ))}
      </ul>
      <div className="overflow-hidden rounded-xl border bg-card">
        <button
          type="button"
          className={cn(row, 'text-destructive hover:bg-destructive/10')}
          onClick={() => void leave()}
        >
          <Icon name="log-out" />
          {t('common.signOut')}
        </button>
      </div>
    </div>
  )
}
