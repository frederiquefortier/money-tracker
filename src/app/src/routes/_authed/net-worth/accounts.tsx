import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AccountGroup } from '#/components/accounts/list/account-group'
import type { ListedAccount } from '#/components/accounts/list/account-row'
import { ClosedAccounts } from '#/components/accounts/list/closed-accounts'
import { EmptyState } from '#/components/lists/list-card'
import { ExpandAllButton } from '#/components/lists/expand-all-button'
import { FloatingAddButton } from '#/components/layout/floating-add-button'
import { NetWorthBackLink } from '#/components/net-worth/back-link'
import { ListPage } from '#/components/layout/list-page'
import { SortMenu } from '#/components/lists/sort-menu'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import {
  NO_INSTITUTION,
  SORTS,
  sortAccounts,
  typeLabel,
} from '#/lib/accounts/account'
import type { Sort, AccountsPage } from '#/lib/accounts/account'
import { useLocale } from '#/hooks/app/use-locale'
import { useMyCurrencies } from '#/hooks/currencies/use-my-currencies'
import { useStoredIds, useStoredState } from '#/hooks/app/use-stored-state'
import { getAccounts } from '#/server/accounts'
import { oneOf } from '#/lib/shared/collections'

export const Route = createFileRoute('/_authed/net-worth/accounts')({
  loader: () => getAccounts(),
  component: Accounts,
})

const parseSort = oneOf(SORTS)

const groupKey = (institutionId: string | null) =>
  institutionId ?? NO_INSTITUTION

/** Rows with their type label, open ones sorted (ACC-07), groups alphabetical (ACC-06). */
function shape(page: AccountsPage, locale: Locale, sort: Sort) {
  const types = new Map(page.types.map((type) => [type.code, type]))
  const listed: Array<ListedAccount> = page.accounts.map((account) => {
    const type = types.get(account.type)
    return {
      ...account,
      typeLabel: type ? typeLabel(type, locale) : account.type,
    }
  })
  const open = sortAccounts(
    listed.filter((a) => !a.closedOn),
    sort,
    FORMAT_LOCALE[locale],
  )
  const groups = [
    ...page.institutions.map((institution) => ({
      key: institution.id,
      institution,
    })),
    ...(open.some((a) => !a.institutionId)
      ? [{ key: NO_INSTITUTION, institution: null }]
      : []),
  ]
  const used = new Set(page.accounts.map((a) => groupKey(a.institutionId)))
  return { listed, open, groups, used }
}

function AddMenu() {
  const { t } = useTranslation()
  return (
    <FloatingAddButton
      label={t('common.add')}
      options={[
        {
          to: '/net-worth/accounts/new',
          label: t('accounts.addAccount'),
          icon: 'wallet',
        },
        {
          to: '/net-worth/accounts/institutions/new',
          label: t('accounts.addInstitution'),
          icon: 'bank',
        },
        {
          to: '/net-worth/accounts/adjust',
          label: t('transactions.adjustment.newTitle'),
          icon: 'scale',
        },
      ]}
    />
  )
}

function Accounts() {
  const { t } = useTranslation()
  const page = Route.useLoaderData()
  const locale = useLocale()
  const { displayCurrency } = useMyCurrencies()
  const [sort, setSort] = useStoredState<Sort>(
    'accounts.sort',
    'name',
    parseSort,
  )
  const collapsed = useStoredIds('accounts.collapsed')

  const { listed, open, groups, used } = shape(page, locale, sort)

  const keys = groups.map((group) => group.key)
  const allExpanded = keys.every((key) => !collapsed.ids.has(key))

  return (
    <ListPage
      title={t('accounts.title')}
      back={<NetWorthBackLink />}
      actions={
        <>
          {keys.length > 0 && (
            <ExpandAllButton
              allExpanded={allExpanded}
              onToggle={() => collapsed.setAll(keys, allExpanded)}
            />
          )}
          <SortMenu
            sort={sort}
            options={SORTS}
            labelOf={(option) => t(`accounts.sort.${option}`)}
            onChange={setSort}
          />
        </>
      }
    >
      {page.accounts.length === 0 && (
        <EmptyState>{t('accounts.empty')}</EmptyState>
      )}
      {groups.map(({ key, institution }) => (
        <AccountGroup
          key={key}
          institution={institution}
          accounts={open.filter((a) => groupKey(a.institutionId) === key)}
          inUse={used.has(key)}
          total={page.totals[key]}
          displayCurrency={displayCurrency}
          collapsed={collapsed.ids.has(key)}
          onToggle={() => collapsed.toggle(key)}
        />
      ))}
      <ClosedAccounts
        accounts={listed.filter((a) => a.closedOn)}
        institutions={page.institutions}
      />
      <AddMenu />
      {/* The account form opens here as a sheet, over the list. */}
      <Outlet />
    </ListPage>
  )
}
