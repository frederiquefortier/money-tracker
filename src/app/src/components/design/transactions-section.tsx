import { useState } from 'react'
import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { FilterSidebar } from '#/components/transactions/filters/filter-sidebar'
import { ListEnd } from '#/components/lists/list-end'
import { ListHeader } from '#/components/transactions/list/list-header'
import { TransactionDayGroup } from '#/components/transactions/list/transaction-day'
import { TransactionDaysSkeleton } from '#/components/transactions/list/transaction-skeleton'
import { NO_FILTERS } from '#/lib/transactions/transaction-filters'
import type { FilterValues } from '#/lib/transactions/transaction-filters'
import type {
  ListedTransaction,
  PeriodChoice,
  TransactionDay,
} from '#/lib/transactions/transaction-list'

// Invented rows: two days of a made-up month, in CAD.

const row = (
  id: string,
  over: Partial<ListedTransaction> &
    Pick<ListedTransaction, 'kind' | 'occurredOn' | 'amount'>,
): ListedTransaction => ({
  id,
  transferId: null,
  pending: false,
  merchant: null,
  note: null,
  account: { name: 'Chequing', institution: 'Demo Bank' },
  transfer: null,
  categories: [],
  people: [],
  reimburses: [],
  event: null,
  holding: null,
  currency: 'CAD',
  displayAmount: over.amount,
  rate: '1',
  fee: null,
  arrival: null,
  conversionCost: null,
  ...over,
})

const GROCERY = { name: 'Groceries', icon: 'shopping-cart', color: '#3a8f5c' }
const DINING = { name: 'Dining', icon: 'utensils', color: '#c2693d' }
const SALARY = { name: 'Salary', icon: 'coins', color: '#4a6fc2' }

const DAYS: Array<TransactionDay> = [
  {
    date: '2026-11-14',
    net: '-96.40',
    rows: [
      row('demo-1', {
        kind: 'expense',
        occurredOn: '2026-11-14',
        amount: '-62.15',
        merchant: 'Corner Market',
        categories: [GROCERY],
      }),
      row('demo-2', {
        kind: 'expense',
        occurredOn: '2026-11-14',
        amount: '-34.25',
        merchant: 'Noodle House',
        categories: [DINING, GROCERY],
        people: [{ name: 'Sam', count: 1, role: 'invited', open: false }],
      }),
    ],
  },
  {
    date: '2026-11-13',
    net: '2400.00',
    rows: [
      row('demo-3', {
        kind: 'income',
        occurredOn: '2026-11-13',
        amount: '2400.00',
        merchant: 'Demo Employer',
        categories: [SALARY],
      }),
      row('demo-4', {
        kind: 'transfer',
        occurredOn: '2026-11-13',
        amount: '500.00',
        transferId: 'demo-transfer',
        transfer: {
          from: { name: 'Chequing', institution: 'Demo Bank' },
          to: { name: 'Savings', institution: 'Demo Bank' },
        },
      }),
    ],
  },
]

// A range no tab stands for, so the calendar tab shows its longest label.
const PERIOD: PeriodChoice = {
  period: 'custom',
  month: '2026-11',
  year: '2026',
  start: '2026-09-03',
  end: '2026-10-15',
}

/** The list as the route draws it, on the net worth hub's grid. */
function DemoList() {
  const [period, setPeriod] = useState(PERIOD)
  const [filters, setFilters] = useState<FilterValues>(NO_FILTERS)
  const [search, setSearch] = useState('')
  return (
    <div className="grid w-full items-start gap-3 lg:grid-cols-12">
      <FilterSidebar
        values={filters}
        names={null}
        period={period}
        onChange={setFilters}
        onPeriod={setPeriod}
        className="hidden lg:col-span-3 lg:flex"
      />
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:col-start-5">
        <ListHeader
          choice={period}
          filters={filters}
          names={null}
          pending={{ count: 2, on: false }}
          owed={{ count: 1, on: false }}
          search={search}
          onPeriod={setPeriod}
          onFilters={setFilters}
          onPending={() => {}}
          onOwed={() => {}}
          onSearch={setSearch}
        />
        <div className="flex flex-col gap-4">
          {DAYS.map((day) => (
            <TransactionDayGroup
              key={day.date}
              day={day}
              displayCurrency="CAD"
              filtered={false}
              feeCategory={null}
            />
          ))}
          {/* The end of a list with more to load. */}
          <ListEnd
            sentinel={() => {}}
            placeholder={<TransactionDaysSkeleton days={1} />}
          />
        </div>
      </div>
    </div>
  )
}

export function TransactionsSection() {
  return (
    <GallerySection id="transactions" title="Transactions">
      <Specimen
        name="ListHeader, FilterSidebar, TransactionDayGroup"
        source="transactions/list/, transactions/filters/, lists/list-end"
      >
        <DemoList />
      </Specimen>
      <Specimen
        name="TransactionDaysSkeleton"
        source="transactions/list/transaction-skeleton.tsx"
      >
        <div className="w-full max-w-2xl">
          <TransactionDaysSkeleton />
        </div>
      </Specimen>
    </GallerySection>
  )
}
