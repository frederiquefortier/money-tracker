import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { Card } from '#/components/ui/card'

/** A centred card with one message: a screen still to come, an error, a missing page. */
export function MessageCard({
  icon = 'pig-fill',
  title,
  text,
  children,
}: {
  icon?: IconName
  title: string
  text: string
  children?: React.ReactNode
}) {
  return (
    <Card className="items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-secondary text-primary">
        <Icon name={icon} className="size-8" />
      </span>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
      {children}
    </Card>
  )
}
