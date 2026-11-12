import { useTranslation } from 'react-i18next'
import { IconActions, IconAnchor } from '#/components/display/icon-button'
import { CollapseToggle } from '#/components/lists/collapse-toggle'
import type { Institution } from '#/lib/institutions/institution'

/**
 * The header of an institution's drawer, on the accounts and the holdings pages: the name
 * toggles the rows, `children` is the total, and a website has its icon after it (from
 * `md` up, as the rows' actions). The form and the delete are in Réglages.
 */
export function DrawerHeader({
  institution,
  name,
  collapsed,
  onToggle,
  children,
}: {
  institution: Institution | null
  name: string
  collapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <header className="flex items-center gap-2 py-2.5 pr-2 pl-3">
      <CollapseToggle
        expanded={!collapsed}
        onToggle={onToggle}
        className="font-bold"
      >
        {name}
      </CollapseToggle>
      <span className="ml-auto md:pr-4">{children}</span>
      <IconActions slots={2}>
        {institution?.websiteUrl && (
          <IconAnchor
            icon="external-link"
            label={t('institutions.openWebsite', { name })}
            href={institution.websiteUrl}
          />
        )}
      </IconActions>
    </header>
  )
}
