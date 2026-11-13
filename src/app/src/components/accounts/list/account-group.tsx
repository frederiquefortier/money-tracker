import { useTranslation } from 'react-i18next'
import { AccountRow } from '#/components/accounts/list/account-row'
import type { ListedAccount } from '#/components/accounts/list/account-row'
import { DrawerHeader } from '#/components/institutions/drawer-header'
import { MissingRate, Money } from '#/components/display/money'
import { compareDecimal } from '#/lib/shared/money'
import { formatMoney } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import type { GroupTotal } from '#/lib/accounts/account'
import type { Institution } from '#/lib/institutions/institution'
import { cardSurface } from '#/components/styles'
import { Revealed } from '#/components/lists/revealed'

function Balance({ account }: { account: ListedAccount }) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <>
      <Money
        amount={account.balance}
        currency={account.currency}
        className="text-lg font-semibold"
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
      className="text-lg font-semibold"
    />
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
      <DrawerHeader
        institution={institution}
        name={name}
        collapsed={collapsed}
        onToggle={onToggle}
      >
        <GroupTotalAmount total={total} currency={displayCurrency} />
      </DrawerHeader>
      {!collapsed && accounts.length > 0 && (
        <ul className="divide-y border-t">
          <Revealed items={accounts}>
            {(shown) =>
              shown.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  details={account.typeLabel}
                  aside={<Balance account={account} />}
                />
              ))
            }
          </Revealed>
        </ul>
      )}
    </section>
  )
}
