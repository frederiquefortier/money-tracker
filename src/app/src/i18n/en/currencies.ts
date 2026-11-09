import type { currenciesFr } from '../fr/currencies'

export const currenciesEn: typeof currenciesFr = {
  currencies: {
    title: 'Currencies',
    defaultBadge: 'Default',
    add: 'Add a currency',
    makeDefaultFor: 'Use {{code}} as default',
    isDefault: '{{code}} is the default currency',
    removeCode: 'Remove {{code}}',
    defaultCannotBeRemoved: 'Choose another default currency first.',
    usedByAccount_zero: 'The account {{name}} is in {{code}}.',
    usedByAccount_one: 'The account {{name}} and 1 other are in {{code}}.',
    usedByAccount_other:
      'The account {{name}} and {{count}} others are in {{code}}.',
    adding: 'Checking…',
    hexaRateDown: 'Rate validation is unavailable. Try again in a moment.',
    unknown: 'The rate service does not know {{code}}.',
    ratesFrom: 'Rates available from {{date}}',
    ratesPending: 'Rates available after the next daily update.',
    removeConfirm: 'Remove {{code}}',
    currency: 'Currency',
    added: '{{code}} added.',
  },
}
