import type { netWorthFr } from '../fr/net-worth'

export const netWorthEn: typeof netWorthFr = {
  netWorth: {
    title: 'Net worth',
    empty: 'No accounts or holdings yet.',
    closed_one: 'Archived ({{count}})',
    closed_other: 'Archived ({{count}})',
    closedOn: 'Archived on {{date}}',
    groupByLabel: 'Group: {{groupBy}}',
    groupBy: {
      type: 'By type',
      institution: 'By institution',
    },
    sort: {
      name: 'Name (A to Z)',
      type: 'Type',
      currency: 'Currency',
      valueAsc: 'Value (lowest)',
      valueDesc: 'Value (highest)',
    },
    up: 'Up',
    down: 'Down',
    hide: {
      label: 'Hide items',
      hidden: 'Hidden from net worth',
      labelCount_one: 'Hide items: {{count}} hidden',
      labelCount_other: 'Hide items: {{count}} hidden',
    },
    change: {
      perYear: ' a year',
      multiple: '· ×{{multiple}}',
      perYearAverage: 'a year on average',
      perYearShort: '/yr',
      over: 'over {{period}}',
      since: 'since {{year}}',
    },
    changes: {
      byYear: 'Change by year',
      byMonth: 'Change by month',
      net: 'Net change',
    },
    chart: {
      lines: {
        total: 'Net worth',
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
