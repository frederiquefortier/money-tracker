import { IconBubble } from '#/components/display/icon-bubble'
import type { IconName } from '#/components/display/icon'
import { PageTitle } from '#/components/layout/list-page'
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
      <IconBubble icon={icon} tone="primary" size="lg" />
      <PageTitle>{title}</PageTitle>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
      {children}
    </Card>
  )
}
