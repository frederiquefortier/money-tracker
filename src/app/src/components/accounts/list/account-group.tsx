import { useTranslation } from 'react-i18next'
import { AccountRow } from '#/components/accounts/list/account-row'
import type { ListedAccount } from '#/components/accounts/list/account-row'
import { IconActions, IconAnchor } from '#/components/display/icon-button'
import { CollapseToggle } from '#/components/lists/collapse-toggle'
import { MissingRate, Money } from '#/components/display/money'
import { compareDecimal } from '#/lib/shared/money'
import { formatMoney } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import type { GroupTotal } from '#/lib/accounts/account'
import type { Institution } from '#/lib/institutions/institution'
import { cardSurface } from '#/components/styles'

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

/**
 * The card header: the name toggles the accounts. An institution with a website has its
 * icon after the total (from `md` up, as the account rows' actions); the form and the
 * delete are in Réglages.
 */
function GroupHeader({
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

/** One institution's card (ACC-06): collapsible, total of its open accounts. */
export function AccountGroup({
  institution,
  accounts,
  total,
  displayCurrency,
  collapsed,
  onToggle,
}: {
  institution: Institution | null
  accounts: ReadonlyArray<ListedAccount>
  total: GroupTotal | undefined
  displayCurrency: string
  collapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const name = institution?.name ?? t('accounts.noInstitution')
  return (
    <section className={cardSurface}>
      <GroupHeader
        institution={institution}
        name={name}
        collapsed={collapsed}
        onToggle={onToggle}
      >
        <GroupTotalAmount total={total} currency={displayCurrency} />
      </GroupHeader>
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
    </section>
  )
}
