import { CollapsedSection } from '#/components/lists/collapsed-section'
import { ListCard } from '#/components/lists/list-card'
import { Revealed } from '#/components/lists/revealed'

/** A list's rows in a card, then the rest (archived, past) folded under them. */
export function SplitList<T>({
  main,
  rest,
  restLabel,
  storageKey,
  children,
}: {
  main: ReadonlyArray<T>
  rest: ReadonlyArray<T>
  restLabel: string
  storageKey: string
  children: (shown: ReadonlyArray<T>) => React.ReactNode
}) {
  return (
    <>
      {main.length > 0 && (
        <ListCard>
          <Revealed items={main}>{children}</Revealed>
        </ListCard>
      )}
      {rest.length > 0 && (
        <CollapsedSection label={restLabel} storageKey={storageKey}>
          <Revealed items={rest}>{children}</Revealed>
        </CollapsedSection>
      )}
    </>
  )
}
