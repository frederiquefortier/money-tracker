// French is the source language (ADR-008). The English files are typed against this shape.
import { accountsFr } from './accounts'
import { authFr } from './auth'
import { categoriesFr } from './categories'
import { commonFr } from './common'
import { currenciesFr } from './currencies'
import { merchantsFr } from './merchants'
import { peopleFr } from './people'
import { shellFr } from './shell'
import { transactionsFr } from './transactions'

export const fr = {
  ...commonFr,
  ...shellFr,
  ...authFr,
  ...accountsFr,
  ...currenciesFr,
  ...categoriesFr,
  ...merchantsFr,
  ...peopleFr,
  ...transactionsFr,
}

export type Messages = typeof fr
