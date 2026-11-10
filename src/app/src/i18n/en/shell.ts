import type { shellFr } from '../fr/shell'

export const shellEn: typeof shellFr = {
  app: {
    name: 'Money Tracker',
  },
  nav: {
    label: 'Main navigation',
    transactions: 'Transactions',
    accounts: 'Accounts',
    dashboard: 'Dashboard',
    budget: 'Budget',
  },
  comingSoon: {
    dashboard: 'Your spending by category and by month will show here.',
    budget: 'Your goals and your emergency fund will live here.',
  },
  fallback: {
    errorTitle: 'This page could not be shown',
    errorText: 'Your data has not changed. Try again in a moment.',
    retry: 'Try again',
    notFoundTitle: 'Page not found',
    notFoundText: 'This address leads nowhere.',
    home: 'Back to home',
  },
  settings: {
    title: 'Settings',
    categories: 'Categories',
    currencies: 'Currencies',
    merchants: 'Merchants',
    people: 'People',
    events: 'Events',
  },
  displayCurrency: {
    label: 'Display currency: {{code}}',
  },
}
