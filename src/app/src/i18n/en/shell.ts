import type { shellFr } from '../fr/shell'

export const shellEn: typeof shellFr = {
  app: {
    name: 'Money Tracker',
  },
  nav: {
    label: 'Main navigation',
    transactions: 'Transactions',
    dashboard: 'Dashboard',
    budget: 'Budget',
  },
  comingSoon: {
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
    institutions: 'Institutions',
    categories: 'Categories',
    currencies: 'Currencies',
    merchants: 'Merchants',
    people: 'People',
    events: 'Events',
    data: 'Data management',
  },
  displayCurrency: {
    label: 'Display currency: {{code}}',
  },
}
