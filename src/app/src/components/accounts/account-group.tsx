import { useTranslation } from 'react-i18next'
import { AccountRow } from '#/components/accounts/account-row'
import type { ListedAccount } from '#/components/accounts/account-row'
import { InstitutionActions } from '#/components/accounts/institution-actions'
import { CollapseToggle } from '#/components/collapse-toggle'
import { IconAnchor } from '#/components/icon-button'
import { cardSurface } from '#/components/list-card'
import { MissingRate, Money } from '#/components/money'
import { compareDecimal } from '#/lib/accounts'
import { formatMoney } from '#/lib/format'
import { useLocale } from '#/lib/use-locale'
import type { GroupTotal, Institution } from '#/server/accounts'

function Balance({ account }: { account: ListedAccount }) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <>
      <Money
        amount={account.balance}
        currency={account.currency}
        className="font-semibold"
      />
      {compareDecimal(account.pending, '0') !== 0 && (
        <span className="block text-xs text-muted-foreground">
          {t('accounts.pending', {
            amount: formatMoney(account.pending, account.currency, locale),
          })}
        </span>
      )}
    </>
  )
}

function GroupTotalAmount({
  total,
  currency,
}: {
  total: GroupTotal | undefined
  currency: string
}) {
  // No total: the group holds only closed accounts.
  if (!total) return null
  if (total.total === null) return <MissingRate />
  return (
    <Money
      amount={total.total}
      currency={currency}
      converted={total.converted}
      className="font-bold"
    />
  )
}

/** One institution's card (ACC-06): collapsible, total of its open accounts. */
export function AccountGroup({
  institution,
  accounts,
  inUse,
  total,
  displayCurrency,
  collapsed,
  onToggle,
}: {
  institution: Institution | null
  accounts: ReadonlyArray<ListedAccount>
  /** Any account, open or closed, is in this institution. */
  inUse: boolean
  total: GroupTotal | undefined
  displayCurrency: string
  collapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const name = institution?.name ?? t('accounts.noInstitution')
  return (
    <section className={cardSurface}>
      <header className="flex items-center gap-2 py-2.5 pr-2 pl-3">
        <CollapseToggle
          expanded={!collapsed}
          onToggle={onToggle}
          className="font-bold"
        >
          {name}
        </CollapseToggle>
        {institution?.websiteUrl && (
          <IconAnchor
            icon="external-link"
            label={t('accounts.website', { name })}
            href={institution.websiteUrl}
          />
        )}
        <span className="ml-auto">
          <GroupTotalAmount total={total} currency={displayCurrency} />
        </span>
        {institution && (
          <InstitutionActions institution={institution} inUse={inUse} />
        )}
      </header>
      {!collapsed && accounts.length > 0 && (
        <ul className="divide-y border-t">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              details={account.typeLabel}
              aside={<Balance account={account} />}
            />
          ))}
        </ul>
      )}
      {/* An institution with no open account still shows, so it can be found (ACC-05). */}
      {!collapsed && accounts.length === 0 && institution && (
        <p className="border-t px-4 py-3 text-sm text-muted-foreground">
          {t('accounts.emptyInstitution')}
        </p>
      )}
    </section>
  )
}
