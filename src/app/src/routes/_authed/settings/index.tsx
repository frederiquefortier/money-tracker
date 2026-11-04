import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import type { IconName } from '#/components/icon'
import { ListCard, cardSurface, rowHover } from '#/components/list-card'
import { SettingsPage } from '#/components/settings-page'
import { cn, focusRing } from '#/lib/utils'
import { signOut } from '#/server/session'

export const Route = createFileRoute('/_authed/settings/')({
  component: Settings,
})

// A row appears once its screen exists (spec 10).
const SCREENS = [
  { to: '/settings/accounts', label: 'settings.accounts', icon: 'bank' },
  { to: '/settings/categories', label: 'settings.categories', icon: 'tags' },
  { to: '/settings/currencies', label: 'settings.currencies', icon: 'coins' },
  { to: '/settings/merchants', label: 'settings.merchants', icon: 'store' },
] as const satisfies ReadonlyArray<{
  to: string
  label: string
  icon: IconName
}>

const row = cn(
  'flex w-full items-center gap-3 px-4 py-3.5 text-left font-semibold',
  rowHover,
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
    <SettingsPage title={t('settings.title')} back={false}>
      <ListCard>
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
      </ListCard>
      <div className={cardSurface}>
        <button
          type="button"
          className={cn(row, 'text-destructive hover:bg-destructive/10')}
          onClick={() => void leave()}
        >
          <Icon name="log-out" />
          {t('common.signOut')}
        </button>
      </div>
    </SettingsPage>
  )
}
