import { useTranslation } from 'react-i18next'
import { InstitutionActions } from '#/components/institutions/institution-actions'
import { ListRow } from '#/components/lists/list-row'
import type { InstitutionRow } from '#/lib/institutions/institution'

/** One institution in Réglages: its name and what uses it. */
export function InstitutionRowView({
  institution,
}: {
  institution: InstitutionRow
}) {
  const { t } = useTranslation()
  const { accountCount, holdingCount } = institution
  const usage =
    accountCount + holdingCount === 0
      ? t('institutions.unused')
      : [
          accountCount > 0 &&
            t('institutions.accounts', { count: accountCount }),
          holdingCount > 0 &&
            t('institutions.holdings', { count: holdingCount }),
        ]
          .filter(Boolean)
          .join(', ')
  return (
    <ListRow
      link={{
        to: '/settings/institutions/$institutionId',
        params: { institutionId: institution.id },
      }}
      actions={<InstitutionActions institution={institution} />}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{institution.name}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {usage}
        </span>
      </span>
    </ListRow>
  )
}
