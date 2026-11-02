import { cn } from '#/lib/utils'

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('fill-current', className)}
    >
      <path d="M12 0C12.6 7 17 11.4 24 12 17 12.6 12.6 17 12 24 11.4 17 7 12.6 0 12 7 11.4 11.4 7 12 0Z" />
    </svg>
  )
}
