import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { ActionsSection } from '#/components/design/actions-section'
import { DashboardSection } from '#/components/design/dashboard-section'
import { DisplaySection } from '#/components/design/display-section'
import { FeedbackSection } from '#/components/design/feedback-section'
import { FieldsSection } from '#/components/design/fields-section'
import { FoundationsSection } from '#/components/design/foundations-section'
import { ListsSection } from '#/components/design/lists-section'
import { NetWorthSection } from '#/components/design/net-worth-section'
import { TransactionsSection } from '#/components/design/transactions-section'
import { PageTitle } from '#/components/layout/list-page'
import { chipSurface } from '#/components/styles'
import { cn } from '#/lib/utils'

const CONTENTS = [
  ['foundations', 'Foundations'],
  ['actions', 'Actions'],
  ['fields', 'Fields'],
  ['display', 'Display'],
  ['lists', 'Lists and cards'],
  ['transactions', 'Transactions'],
  ['net-worth', 'Net worth'],
  ['dashboard', 'Dashboard'],
  ['feedback', 'Feedback'],
] as const

// Dev only (ADR-043): the shared components in their states, in English.
export const Route = createFileRoute('/_authed/design')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: Design,
})

function Design() {
  const [dark, setDark] = useState(false)
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Design</PageTitle>
        <button
          type="button"
          aria-pressed={dark}
          onClick={() => setDark(!dark)}
          className={cn(chipSurface, dark && 'bg-secondary')}
        >
          Dark
        </button>
      </div>
      <nav aria-label="Contents" className="flex flex-wrap gap-2">
        {CONTENTS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={chipSurface}>
            {label}
          </a>
        ))}
      </nav>
      <div
        className={cn(
          'flex flex-col gap-12 rounded-xl bg-background p-4 text-foreground md:p-6',
          dark && 'dark',
        )}
      >
        <FoundationsSection />
        <ActionsSection />
        <FieldsSection />
        <DisplaySection />
        <ListsSection />
        <TransactionsSection />
        <NetWorthSection />
        <DashboardSection />
        <FeedbackSection />
      </div>
    </div>
  )
}
