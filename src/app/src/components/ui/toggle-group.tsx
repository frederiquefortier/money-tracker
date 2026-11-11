import * as React from 'react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

// The parts of shadcn's toggle group the app uses: a single choice, sized to its items.
function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        'inline-flex w-fit gap-1 rounded-xl bg-secondary p-1',
        className,
      )}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-muted-foreground hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-primary data-[state=on]:shadow-sm',
        focusRing,
        className,
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
