import type { netWorthFr } from '../fr/net-worth'

export const netWorthEn: typeof netWorthFr = {
  netWorth: {
    title: 'Net worth',
    back: 'Net worth',
    accountsCount_one: '{{count}} account',
    accountsCount_other: '{{count}} accounts',
    holdingsCount_one: '{{count}} holding',
    holdingsCount_other: '{{count}} holdings',
    up: 'Up',
    down: 'Down',
    hide: {
      label: 'Hide items',
      labelCount_one: 'Hide items: {{count}} hidden',
      labelCount_other: 'Hide items: {{count}} hidden',
    },
    change: {
      perYear: ' a year',
      perYearShort: '/yr',
      over: 'over {{period}}',
      since: 'since {{year}}',
    },
    composition: 'Composition',
    changes: {
      byYear: 'Change by year',
      byMonth: 'Change by month',
      net: 'Net change',
    },
    chart: {
      lines: {
        total: 'Net worth',
        assets: 'Assets',
        debts: 'Debts',
      },
      groups: {
        accounts: 'Accounts',
        investments: 'Investments',
        assets: 'Other assets',
        debts: 'Debts',
      },
      years_one: '{{count}} year',
      years_other: '{{count}} years',
      yearsShort: '{{count}}Y',
      months_one: '{{count}} month',
      months_other: '{{count}} months',
      monthsShort: '{{count}}M',
      all: 'All',
      range: 'Period',
      archived: 'Archived',
    },
  },
}
