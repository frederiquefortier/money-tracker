import { useTranslation } from 'react-i18next'
import { AccountRow } from '#/components/accounts/list/account-row'
import type { ListedAccount } from '#/components/accounts/list/account-row'
import { CollapseToggle } from '#/components/lists/collapse-toggle'
import { ListCard } from '#/components/lists/list-card'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import type { Institution } from '#/lib/accounts/account'

const parseBoolean = (v: unknown) => (typeof v === 'boolean' ? v : undefined)

/** ACC-03: closed accounts, flat and muted, with their closing date. */
export function ClosedAccounts({
  accounts,
  institutions,
}: {
  accounts: ReadonlyArray<ListedAccount>
  institutions: ReadonlyArray<Institution>
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [expanded, setExpanded] = useStoredState(
    'accounts.closedExpanded',
    false,
    parseBoolean,
  )
  if (accounts.length === 0) return null
  const names = new Map(institutions.map((i) => [i.id, i.name]))

  return (
    <section className="mt-2 flex flex-col gap-2 border-t pt-4">
      <CollapseToggle
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        className="self-start text-sm font-semibold text-muted-foreground"
      >
        {t('accounts.closed', { count: accounts.length })}
      </CollapseToggle>
      {expanded && (
        <ListCard className="text-muted-foreground">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              alignTop
              details={[
                account.institutionId && names.get(account.institutionId),
                account.typeLabel,
              ]
                .filter(Boolean)
                .join(' · ')}
              aside={
                account.closedOn && (
                  <span className="text-sm leading-6 whitespace-nowrap">
                    {t('accounts.closedOn', {
                      date: formatDate(account.closedOn, locale, 'medium'),
                    })}
                  </span>
                )
              }
            />
          ))}
        </ListCard>
      )}
    </section>
  )
}
