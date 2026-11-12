import * as React from 'react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { Icon } from '#/components/display/icon'
import { cn } from '#/lib/utils'
import { iconAction } from '#/components/styles'
import { useVisualViewport } from '#/hooks/app/use-visual-viewport'
import { isTouchDevice } from '#/lib/shared/touch'
import {
  OverlayContainerProvider,
  inAriaOverlay,
} from '#/components/ui/overlay-container'

// Based on shadcn's sheet: full screen on phones, a panel from md up, sliding in from the
// right at every width (from the left with side="left"), its animations in
// styles.css (.sheet-panel). Built on the Radix dialog, so focus is trapped
// and returns to the trigger on close. Content is a SheetBody that scrolls and a
// SheetFooter that stays put; a form can wrap both. `actions` are the item's row actions,
// shown in the header on phones only, where rows do not carry them.
function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetContent({
  title,
  closeLabel,
  side = 'right',
  actions,
  children,
  onCloseAutoFocus,
  onEscapeKeyDown,
}: {
  title: string
  closeLabel: string
  side?: 'right' | 'left'
  actions?: React.ReactNode
  children: React.ReactNode
  /** Runs once the closing animation has finished. */
  onCloseAutoFocus?: (event: Event) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
}) {
  const [panel, setPanel] = React.useState<HTMLElement | null>(null)
  useVisualViewport(panel)
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-black/40" />
      <SheetPrimitive.Content
        ref={setPanel}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          // The first field takes the focus, so typing starts at once. Not on a phone: Safari
          // focuses without opening the keyboard, and the layout then shifts under the
          // first tap.
          if (isTouchDevice()) return
          const field = panel?.querySelector<HTMLElement>(
            'form :is(input:not([type=hidden]), textarea, [role=combobox]):not([disabled])',
          )
          if (!field) return
          event.preventDefault()
          field.focus()
        }}
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={(event) => {
          // A calendar closes on its own Escape; the sheet stays.
          if (inAriaOverlay(event.target)) return event.preventDefault()
          onEscapeKeyDown?.(event)
        }}
        className={cn(
          'sheet-panel fixed inset-0 z-50 flex flex-col bg-card text-card-foreground outline-none md:w-full md:max-w-md',
          side === 'left'
            ? 'sheet-panel-left md:right-auto md:border-r'
            : 'md:left-auto md:border-l',
        )}
      >
        <header className="flex items-center gap-3 border-b px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 md:pt-4">
          <SheetPrimitive.Title className="flex-1 font-mono text-lg font-bold tracking-wide uppercase">
            {title}
          </SheetPrimitive.Title>
          {actions && (
            <div className="flex items-center md:hidden">{actions}</div>
          )}
          <SheetPrimitive.Close className={iconAction()}>
            <Icon name="close" label={closeLabel} className="size-5" />
          </SheetPrimitive.Close>
        </header>
        <OverlayContainerProvider value={panel}>
          {children}
        </OverlayContainerProvider>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

/**
 * What stays put above a sheet's scrolling body: its search, and tabs when it has them.
 * Every sheet with a search uses it, so the search is always in reach (decided
 * 2026-11-05).
 */
function SheetHead({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-3 border-b px-5 py-4',
        className,
      )}
      {...props}
    />
  )
}

// Children never shrink: once the body scrolls, a flex column would squeeze the fields.
function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto px-5 py-5 [&>*]:shrink-0',
        className,
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex justify-end gap-2 border-t px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4',
        className,
      )}
      {...props}
    />
  )
}

const SheetClose = SheetPrimitive.Close

export { Sheet, SheetBody, SheetClose, SheetContent, SheetFooter, SheetHead }
