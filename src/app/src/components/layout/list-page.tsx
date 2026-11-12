import { cn } from '#/lib/utils'
import { pageColumn } from '#/components/styles'

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-mono text-xl font-bold tracking-wide uppercase">
      {children}
    </h1>
  )
}

/** A list screen (Comptes, or one from the menu): one centred column under its title. */
export function ListPage({
  title,
  back,
  titleNote,
  actions,
  wide = false,
  children,
}: {
  title: string
  /** The link above the title, on a page opened from a hub card. */
  back?: React.ReactNode
  /** A status beside the title, such as a warning tag. */
  titleNote?: React.ReactNode
  actions?: React.ReactNode
  /** Fills the screen, for a page with charts. */
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn(pageColumn, wide && 'max-w-none')}>
      {back}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <PageTitle>{title}</PageTitle>
          {titleNote}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </div>
  )
}
