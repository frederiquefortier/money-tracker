import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { CheckList } from '#/components/forms/check-list'
import type { CheckNode, CheckState } from '#/components/forms/check-list'
import { GROUP } from '#/components/forms/check-ticks'
import { Sheet, SheetBody, SheetContent } from '#/components/ui/sheet'
import { useLocale } from '#/hooks/app/use-locale'
import type { EventSummary } from '#/lib/events/event-calendar'
import type { EventType } from '#/lib/events/event'
import { formatDate } from '#/lib/shared/format'

type Hidden = {
  ids: ReadonlySet<string>
  toggle: (id: string) => void
  setAll: (ids: ReadonlyArray<string>, included: boolean) => void
}

/** Every dated event under its type, newest first, those without a type last. */
function useEventNodes(
  summaries: ReadonlyArray<EventSummary>,
  types: ReadonlyArray<EventType>,
): Array<CheckNode> {
  const { t } = useTranslation()
  const locale = useLocale()
  const node = (s: EventSummary): CheckNode => ({
    id: s.event.id,
    label: s.event.name,
    detail:
      s.from === s.to
        ? formatDate(s.from, locale, 'medium')
        : t('events.dayRange', {
            start: formatDate(s.from, locale, 'medium'),
            end: formatDate(s.to, locale, 'medium'),
          }),
  })
  const group = (id: string, label: string, typeId: string | null) => {
    const children = summaries
      .filter((s) => s.event.typeId === typeId)
      .sort((a, b) => b.from.localeCompare(a.from))
      .map(node)
    return children.length ? [{ id: `${GROUP}${id}`, label, children }] : []
  }
  return [
    ...[...types]
      .sort((a, b) => a.name.localeCompare(b.name, locale))
      .flatMap((type) => group(type.id, type.name, type.id)),
    ...group('none', t('dashboard.events.hide.noType'), null),
  ]
}

/**
 * The eye beside the overview's title and its sheet of every event, ticked when hidden,
 * as the net worth page's "Masquer des éléments": a group ticks all its events. A hidden
 * event leaves the overview, the calendar and what names a top day, so an event of a
 * year or more does not cover every other day (author, 2026-11-23); its spending stays.
 */
export function HideEvents({
  summaries,
  types,
  hidden,
}: {
  summaries: ReadonlyArray<EventSummary>
  types: ReadonlyArray<EventType>
  hidden: Hidden
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const nodes = useEventNodes(summaries, types)
  const count = summaries.filter((s) => hidden.ids.has(s.event.id)).length
  const stateOf = (node: CheckNode): CheckState => {
    if (!node.children) return hidden.ids.has(node.id) ? 'on' : 'off'
    const ticked = node.children.filter((c) => hidden.ids.has(c.id)).length
    if (ticked === 0) return 'off'
    return ticked === node.children.length ? 'on' : 'mixed'
  }
  const toggle = (node: CheckNode) => {
    if (!node.children) return hidden.toggle(node.id)
    hidden.setAll(
      node.children.map((c) => c.id),
      stateOf(node) !== 'on',
    )
  }
  if (nodes.length === 0) return null
  return (
    <>
      <IconButton
        icon={count > 0 ? 'eye-off' : 'eye'}
        label={
          count > 0
            ? t('dashboard.events.hide.labelCount', { count })
            : t('dashboard.events.hide.label')
        }
        pressed={count > 0}
        onClick={() => setOpen(true)}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          title={t('dashboard.events.hide.label')}
          closeLabel={t('common.close')}
        >
          <SheetBody>
            <CheckList nodes={nodes} stateOf={stateOf} onToggle={toggle} />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  )
}
