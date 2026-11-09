import { accountsEn } from './accounts'
import { authEn } from './auth'
import { categoriesEn } from './categories'
import { commonEn } from './common'
import { currenciesEn } from './currencies'
import { merchantsEn } from './merchants'
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
  ...categoriesEn,
  ...merchantsEn,
  ...peopleEn,
  ...transactionsEn,
}
