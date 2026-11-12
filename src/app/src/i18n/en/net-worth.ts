import type { netWorthFr } from '../fr/net-worth'

export const netWorthEn: typeof netWorthFr = {
  netWorth: {
    title: 'Net worth',
    back: 'Net worth',
    accountsCount_one: '{{count}} account',
    accountsCount_other: '{{count}} accounts',
    investments_one: '{{count}} investment',
    investments_other: '{{count}} investments',
    assets_one: '{{count}} asset',
    assets_other: '{{count}} assets',
    debts_one: '{{count}} debt',
    debts_other: '{{count}} debts',
    updatedOn: 'Updated {{date}}',
  },
}
