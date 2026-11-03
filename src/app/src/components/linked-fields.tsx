/**
 * A line down the left side of a sub-field, under the field it belongs to: the balance on
 * the opening date, a category's parent within its type.
 */
export function LinkedFields({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-l-2 border-primary/30 pl-4">
      {children}
    </div>
  )
}
