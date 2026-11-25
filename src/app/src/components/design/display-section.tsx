import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { EventTag } from '#/components/display/event-tag'
import { CurrencyCode } from '#/components/display/currency-code'
import { IconBubble } from '#/components/display/icon-bubble'
import { Money } from '#/components/display/money'
import { Tag } from '#/components/display/tag'
import {
  Skeleton,
  SkeletonCard,
  SkeletonRows,
} from '#/components/feedback/skeleton'
import { Spinner } from '#/components/feedback/spinner'

// Invented colours, as an event type would carry.
const EVENT_COLORS = ['#2563eb', '#16a34a', '#db2777', '#ca8a04', '#7c3aed']

export function DisplaySection() {
  return (
    <GallerySection id="display" title="Display">
      <Specimen name="Money" source="display/money.tsx">
        <Money amount="1234.5" currency="CAD" />
        <Money amount="1234.5" currency="CAD" signed className="text-income" />
        <Money amount="-42.1" currency="EUR" />
        <Money amount="1234.5" currency="CHF" converted />
        <Money amount="0" currency="JPY" />
      </Specimen>
      <Specimen name="CurrencyCode" source="display/currency-code.tsx">
        <CurrencyCode code="CAD" />
        <CurrencyCode code="EUR" className="font-bold" />
      </Specimen>
      <Specimen name="Tag" source="display/tag.tsx">
        <Tag>Default</Tag>
        <Tag>Archived</Tag>
      </Specimen>
      <Specimen name="EventTag" source="display/event-tag.tsx">
        <EventTag name="No type" color={null} />
        {EVENT_COLORS.map((color) => (
          <EventTag key={color} name={color} color={color} />
        ))}
        <EventTag name="Linked by the rule" color="#2563eb" auto />
      </Specimen>
      <Specimen name="IconBubble" source="display/icon-bubble.tsx">
        <IconBubble icon="arrow-left-right" />
        <IconBubble icon="scale" tone="primary" />
        <IconBubble icon="check" tone="income" />
        <IconBubble icon="circle-warning" tone="error" />
        <IconBubble icon="import" size="sm" />
        <IconBubble icon="import" size="lg" />
      </Specimen>
      <Specimen name="Spinner" source="feedback/spinner.tsx">
        <Spinner />
        <Spinner className="size-6" />
        <Spinner className="size-10 text-primary" />
      </Specimen>
      <Specimen name="Skeleton" source="feedback/skeleton.tsx">
        <Skeleton />
        <Skeleton className="w-24 text-sm" />
        <div className="w-full">
          <SkeletonRows count={3} />
        </div>
        <div className="w-full max-w-md">
          <SkeletonCard chart="h-40" />
        </div>
      </Specimen>
    </GallerySection>
  )
}
