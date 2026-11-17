/**
 * A group's name over its card, with its total on the right: a day of transactions, a
 * group of net worth items (one look for both, author 2026-11-17). `color` puts a dot
 * before the name, for a group drawn in a chart.
 */
export function GroupHeader({
  color,
  aside,
  children,
}: {
  color?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <h2 className="flex items-center justify-between gap-3 px-1 font-mono text-sm font-bold tracking-wide text-muted-foreground uppercase">
      <span className="flex min-w-0 items-center gap-2">
        {color && (
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
        )}
        <span className="truncate">{children}</span>
      </span>
      {aside}
    </h2>
  )
}
