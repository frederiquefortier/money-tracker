import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import type { IconName } from '#/components/icon'
import { cn, focusRing } from '#/lib/utils'

const TABS = [
  {
    to: '/transactions',
    label: 'nav.transactions',
    icon: 'receipt',
    activeIcon: 'receipt-fill',
  },
  {
    to: '/dashboard',
    label: 'nav.dashboard',
    icon: 'chart-pie',
    activeIcon: 'chart-pie-fill',
  },
  {
    to: '/budget',
    label: 'nav.budget',
    icon: 'target',
    activeIcon: 'target-fill',
  },
  {
    to: '/settings',
    label: 'nav.settings',
    icon: 'settings',
    activeIcon: 'settings-fill',
  },
] as const satisfies ReadonlyArray<{
  to: string
  label: string
  icon: IconName
  activeIcon: IconName
}>

export function AppNav({ variant }: { variant: 'bottom' | 'top' }) {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t('nav.label')}
      className={
        variant === 'bottom' ? 'grid grid-cols-4' : 'flex items-center gap-1'
      }
    >
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={cn(
            'rounded-full text-muted-foreground transition-colors hover:text-primary',
            focusRing,
            variant === 'bottom'
              ? 'flex flex-col items-center gap-1 py-2 text-[0.7rem] font-semibold'
              : 'flex items-center gap-2 px-3 py-1.5 text-sm font-semibold',
          )}
          activeProps={{
            className: cn('text-primary', variant === 'top' && 'bg-secondary'),
            'aria-current': 'page',
          }}
        >
          {({ isActive }) => (
            <>
              <Icon
                name={isActive ? tab.activeIcon : tab.icon}
                className={variant === 'bottom' ? 'size-6' : 'size-5'}
              />
              {t(tab.label)}
            </>
          )}
        </Link>
      ))}
    </nav>
  )
}
