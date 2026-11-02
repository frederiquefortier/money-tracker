import { Icon } from '#/components/icon'
import { Card } from '#/components/ui/card'

export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <Card className="items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-secondary text-primary">
        <Icon name="pig-fill" className="size-8" />
      </span>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </Card>
  )
}
