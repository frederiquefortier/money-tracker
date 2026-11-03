/**
 * Fields that describe one thing (the opening date and the balance on that date), held
 * together by a line down their left side.
 */
export function LinkedFields({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-l-2 border-primary/30 pl-4">
      {children}
    </div>
  )
}
