/**
 * A line down the left side: fields that describe one thing (the opening date and the
 * balance on that date), or a sub-field of the field above it (a category's parent, within
 * its type).
 */
export function LinkedFields({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-l-2 border-primary/30 pl-4">
      {children}
    </div>
  )
}
