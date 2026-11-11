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
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={pageColumn}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>{title}</PageTitle>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </div>
  )
}
