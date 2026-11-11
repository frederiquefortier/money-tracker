import { useState } from 'react'
import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { Tag } from '#/components/display/tag'
import { CheckList } from '#/components/forms/check-list'
import type { CheckNode } from '#/components/forms/check-list'
import { CreateButton } from '#/components/forms/create-row'
import { EmptyState, ListCard } from '#/components/lists/list-card'
import { MessageCard } from '#/components/layout/message-card'
import { Money } from '#/components/display/money'
import { cn } from '#/lib/utils'
import { rowHover } from '#/components/styles'

const NODES: Array<CheckNode> = [
  {
    id: 'bank',
    label: 'Bank',
    children: [
      { id: 'chequing', label: 'Chequing', detail: 'CAD' },
      { id: 'savings', label: 'Savings', detail: 'CAD' },
    ],
  },
  {
    id: 'wise',
    label: 'Wise',
    children: [{ id: 'wise-eur', label: 'Wise EUR', detail: 'EUR' }],
  },
]

export function ListsSection() {
  const [ticked, setTicked] = useState(new Set(['chequing']))
  return (
    <GallerySection id="lists" title="Lists and cards">
      <Specimen
        name="ListCard"
        source="lists/list-card.tsx, styles.ts rowHover"
      >
        <div className="w-full max-w-lg">
          <ListCard>
            {['Chequing', 'Savings'].map((name, i) => (
              <li
                key={name}
                className={cn('flex items-center gap-3 px-4 py-3', rowHover)}
              >
                <span className="flex-1 font-semibold">{name}</span>
                {i === 0 && <Tag>Default</Tag>}
                <Money amount={i === 0 ? '1250.4' : '8000'} currency="CAD" />
              </li>
            ))}
            <CreateButton label="New account" onClick={() => {}} />
          </ListCard>
        </div>
      </Specimen>
      <Specimen name="EmptyState" source="lists/list-card.tsx">
        <div className="w-full max-w-lg">
          <EmptyState>Nothing here yet</EmptyState>
        </div>
      </Specimen>
      <Specimen name="CheckList" source="forms/check-list.tsx">
        <div className="w-full max-w-lg">
          <CheckList
            nodes={NODES}
            openCount={1}
            stateOf={(node) => {
              if (ticked.has(node.id)) return 'on'
              const kids = node.children?.filter((k) => ticked.has(k.id)).length
              return kids ? 'mixed' : 'off'
            }}
            onToggle={(node) =>
              setTicked((previous) => {
                const next = new Set(previous)
                if (next.has(node.id)) next.delete(node.id)
                else next.add(node.id)
                return next
              })
            }
          />
        </div>
      </Specimen>
      <Specimen name="MessageCard" source="layout/message-card.tsx">
        <div className="w-full max-w-lg">
          <MessageCard
            title="Nothing to show"
            text="A screen still to come, an error or a missing page."
          />
        </div>
      </Specimen>
    </GallerySection>
  )
}
