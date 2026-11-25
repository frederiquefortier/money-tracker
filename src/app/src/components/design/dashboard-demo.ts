import type { Category, CategoryKind } from '#/lib/categories/category'
import type { Necessity } from '#/lib/categories/category-necessity'
import type { Dashboard, MonthAmount } from '#/lib/dashboard/dashboard'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import type {
  BillMerchant,
  MerchantMonth,
} from '#/lib/dashboard/merchant-bills'

// Invented categories and amounts for the dashboard's gallery section.

function category(
  [id, name, kind]: [string, string, CategoryKind],
  {
    parentId = null,
    color,
    icon = 'tag',
    necessity = null,
  }: {
    parentId?: string | null
    color: string
    icon?: string
    necessity?: Necessity | null
  },
): Category {
  return {
    id,
    parentId,
    name,
    kind,
    icon,
    iconIsAuto: false,
    color,
    colorIsAuto: false,
    necessity,
    history: [],
    periods: [{ from: null, to: null }],
  }
}

const CATEGORIES: Array<Category> = [
  category(['food', 'Food', 'expense'], {
    color: '#2f7d4f',
    icon: 'shopping-cart',
    necessity: 'need',
  }),
  category(['groceries', 'Groceries', 'expense'], {
    parentId: 'food',
    color: '#3f9a63',
  }),
  category(['restaurants', 'Restaurants', 'expense'], {
    parentId: 'food',
    color: '#5bb27c',
    necessity: 'want',
  }),
  category(['home', 'Home', 'expense'], {
    color: '#2255aa',
    icon: 'house-alt-1',
    necessity: 'need',
  }),
  category(['rent', 'Rent', 'expense'], { parentId: 'home', color: '#3a6fc2' }),
  category(['energy', 'Energy', 'expense'], {
    parentId: 'home',
    color: '#5a8ad4',
  }),
  category(['outings', 'Outings', 'expense'], {
    color: '#b0398a',
    icon: 'star',
    necessity: 'want',
  }),
  category(['travel', 'Travel', 'expense'], {
    color: '#d9822b',
    icon: 'plane',
    necessity: 'want',
  }),
  category(['transport', 'Transport', 'expense'], {
    color: '#6b5bd2',
    icon: 'car',
  }),
  category(['salary', 'Salary', 'income'], { color: '#1f8a70', icon: 'coins' }),
  category(['side', 'Side work', 'income'], {
    color: '#c2a52a',
    icon: 'coins',
  }),
  category(['refunds', 'Refunds', 'income'], {
    color: '#8a8f98',
    icon: 'coins',
  }),
  category(['etf', 'Index funds', 'investment'], {
    color: '#4a4fb3',
    icon: 'trending-up',
  }),
]

const MONTHLY: Array<[string, (m: number) => number]> = [
  ['salary', () => 4200],
  ['side', (m) => (m % 3 === 0 ? 650 : 0)],
  ['refunds', (m) => (m % 5 === 2 ? 120 : 0)],
  ['groceries', (m) => -(420 + ((m * 37) % 90))],
  ['restaurants', (m) => -(110 + ((m * 53) % 140))],
  ['rent', () => -1350],
  ['energy', (m) => -(60 + ((m * 29) % 70))],
  ['outings', (m) => -(80 + ((m * 41) % 160))],
  ['travel', (m) => (m % 6 === 4 ? -1800 : 0)],
  ['transport', (m) => -(90 + ((m * 17) % 40))],
  ['etf', () => -700],
]

/** Every month from January 2024 to `today`, but one. */
function months(today: string): Array<MonthAmount> {
  const out: Array<MonthAmount> = []
  for (let i = 0; ; i++) {
    const month = `${2024 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`
    if (month > today.slice(0, 7)) break
    // A hole in the history, for the missing-months notice.
    if (month === '2026-02') continue
    for (const [categoryId, amount] of MONTHLY) {
      const value = amount(i)
      if (value !== 0)
        out.push({
          month,
          categoryId,
          amount: value.toFixed(4),
          count: 1 + (i % 4),
        })
    }
  }
  return out
}

const MERCHANTS: Array<BillMerchant> = [
  { id: 'grocer', name: 'Corner Grocer' },
  { id: 'bakery', name: 'Bakery Lune' },
  { id: 'fuel', name: 'Fuel Stop' },
  { id: 'books', name: 'Book Nook' },
]

// Visits per month and a base bill that rises a little each month.
const BILLS: Array<[string, (m: number) => number, number]> = [
  ['grocer', (m) => 6 + (m % 3), 70],
  ['bakery', (m) => 3 + (m % 4), 9],
  ['fuel', (m) => 2 + (m % 2), 55],
  ['books', (m) => (m % 4 === 1 ? 1 : 0), 32],
]

/** Every month from January 2024 to `today`, as `months` but per merchant. */
function merchantMonths(today: string): Array<MerchantMonth> {
  const out: Array<MerchantMonth> = []
  for (let i = 0; ; i++) {
    const month = `${2024 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`
    if (month > today.slice(0, 7)) break
    if (month === '2026-02') continue
    for (const [merchantId, visitsOf, base] of BILLS) {
      const visits = visitsOf(i)
      if (visits === 0) continue
      const average = base * (1 + i * 0.006) + ((i * 13) % 7)
      out.push({
        month,
        merchantId,
        visits,
        total: (average * visits).toFixed(4),
        min: (average * 0.6).toFixed(4),
        max: (average * 1.5).toFixed(4),
      })
    }
  }
  return out
}

export function demoDashboard(today: string): Dashboard {
  return {
    displayCurrency: 'CAD',
    firstYear: 2024,
    months: months(today),
    categories: CATEGORIES,
    merchantMonths: merchantMonths(today),
    merchants: MERCHANTS,
  }
}

/** Invented days for the heat map: most days small, weekends more, a trip in May. */
export function demoDays(year: string, today: string): Array<DaySpent> {
  const days: Array<DaySpent> = []
  const date = new Date(`${year}-01-01T00:00:00Z`)
  for (let i = 0; date.getUTCFullYear() === Number(year); i++) {
    const day = date.toISOString().slice(0, 10)
    if (day > today) break
    const weekend = date.getUTCDay() % 6 === 0
    const trip = day >= `${year}-05-10` && day <= `${year}-05-17`
    const spent = (i * 37) % 11 < 3 ? 0 : ((i * 53) % 90) + (weekend ? 60 : 8)
    if (!day.startsWith(`${year}-02`) && spent > 0)
      days.push({ day, spent: (trip ? spent * 4 : spent).toFixed(4) })
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return days
}
