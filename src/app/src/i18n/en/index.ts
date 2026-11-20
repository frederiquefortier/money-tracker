import { accountsEn } from './accounts'
import { authEn } from './auth'
import { categoriesEn } from './categories'
import { commonEn } from './common'
import { currenciesEn } from './currencies'
import { dashboardEn } from './dashboard'
import { eventsEn } from './events'
import { holdingsEn } from './holdings'
import { importEn } from './import'
import { merchantsEn } from './merchants'
import { netWorthEn } from './net-worth'
import { peopleEn } from './people'
import { shellEn } from './shell'
import { transactionsEn } from './transactions'
import type { Messages } from '../fr'

export const en: Messages = {
  ...commonEn,
  ...shellEn,
  ...authEn,
  ...accountsEn,
  ...currenciesEn,
  ...holdingsEn,
  ...categoriesEn,
  ...merchantsEn,
  ...eventsEn,
  ...dashboardEn,
  ...netWorthEn,
  ...peopleEn,
  ...importEn,
  ...transactionsEn,
}
