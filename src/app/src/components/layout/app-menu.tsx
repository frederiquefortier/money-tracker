import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { IconButton } from '#/components/display/icon-button'
import { ListCard } from '#/components/lists/list-card'
import { Sheet, SheetBody, SheetContent } from '#/components/ui/sheet'
import { cn } from '#/lib/utils'
import { signOut } from '#/server/session'
import { cardSurface, rowHover, focusRing } from '#/components/styles'

// The lists set up once and rarely opened; a row appears once its screen exists.
const SCREENS = [
  { to: '/settings/categories', label: 'settings.categories', icon: 'tags' },
  { to: '/settings/currencies', label: 'settings.currencies', icon: 'coins' },
  { to: '/settings/events', label: 'settings.events', icon: 'calendar' },
  {
    to: '/settings/import',
    label: 'settings.import',
    icon: 'arrow-left-right',
  },
  {
    to: '/settings/institutions',
    label: 'settings.institutions',
    icon: 'bank',
  },
  { to: '/settings/merchants', label: 'settings.merchants', icon: 'store' },
  { to: '/settings/people', label: 'settings.people', icon: 'users' },
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

export function AppMenu() {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function leave() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/sign-in' })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <IconButton
        icon="menu"
        label={t('settings.title')}
        onClick={() => setOpen(true)}
      />
      <SheetContent
        title={t('settings.title')}
        closeLabel={t('common.close')}
        side="left"
      >
        <SheetBody className="flex flex-col gap-4">
          <ListCard>
            {SCREENS.map((screen) => (
              <li key={screen.to}>
                <Link
                  to={screen.to}
                  className={row}
                  activeProps={{ 'aria-current': 'page' }}
                  onClick={() => setOpen(false)}
                >
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
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
