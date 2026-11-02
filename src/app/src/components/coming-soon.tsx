import { Icon } from '#/components/icon'

/** Placeholder for a section whose screens come in a later phase. */
export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-12 text-center shadow-sm ring-1 ring-border">
      <span className="grid size-14 place-items-center rounded-full bg-secondary text-primary">
        <Icon name="pig-fill" className="size-8" />
      </span>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </section>
  )
}
