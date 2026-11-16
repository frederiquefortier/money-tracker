import { cn } from '#/lib/utils'

// The class strings shared by several components: one place to change how they look.

/** The one width of a screen's column: the lists, the transactions, the calendar sheet. */
export const pageWidth = 'max-w-[48rem]'
export const pageColumn = cn(
  'mx-auto flex w-full flex-col gap-4 pb-20',
  pageWidth,
)

/** The red tint of an error message, a badge or a destructive row hover. */
export const errorTint = 'bg-destructive/10 text-destructive'

/** The green tint of a success message (the income green). */
export const successTint = 'bg-income/10 text-income'

/** The orange tint of a notice that asks for a look but is not an error. */
export const warningTint = 'bg-warning/15 text-warning-foreground'

// Layers: 10 inside a screen, 20 header and tab bar, 30 add button, 50 overlays (sheet,
// dialog, menu, calendar), 60 toast, 70 tooltip.

// One focus style everywhere: an outline in the text colour, never the error red.
export const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring'

/**
 * On a container that clips (a card's rounded corners, a row that scrolls sideways): the
 * outlines inside it are drawn within their element, so none is cut.
 */
export const insetFocus = '[&_:focus-visible]:-outline-offset-2!'

/** A bubble: the transactions list's period and filters, all the same height. */
export const chipSurface = cn(
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-input bg-transparent px-3 text-sm font-semibold hover:bg-secondary disabled:pointer-events-none disabled:opacity-50',
  focusRing,
)

/** The card every list sits in: settings rows, accounts, currencies. */
export const cardSurface = cn(
  'overflow-hidden rounded-xl border bg-card',
  insetFocus,
)

/**
 * A row's hover. `--row-bg` is the colour the row shows, opaque, so a ring around a
 * stacked icon can match it (`stackRing`); a pending row sets its own after this.
 */
export const rowHover = cn(
  'transition-colors hover:bg-secondary/60',
  '[--row-bg:var(--card)] hover:[--row-bg:color-mix(in_oklab,var(--secondary)_60%,var(--card))]',
)

/** The gap between stacked icons (a split's categories, a group's members): the row's colour. */
export const stackRing = 'ring-2 ring-[var(--row-bg,var(--card))]'

// Checkboxes in cards, several ticked at once: the transactions filters and a
// person's groups or a group's members. The cards take a form field's radius
// and border, so they read as fields.
/** A form field's radius and border, for what stands in for a field (a list, a popover). */
export const fieldSurface = 'rounded-field border-input'
export const fieldCard = cn(cardSurface, fieldSurface)

// Every icon action in the app: one 32px target, one 20px icon, one hover.
export function iconAction(muted = false) {
  return cn(
    'inline-grid size-8 shrink-0 place-items-center rounded-lg',
    muted
      ? 'cursor-default text-muted-foreground/50'
      : 'text-primary hover:bg-secondary',
    focusRing,
  )
}

/**
 * The icon actions' 32px hover behind a smaller icon whose box must not grow (a tree's
 * chevron sets where its connectors meet). `group` variants light it from a wider
 * button, as a section header whose name toggles too.
 */
export const iconHover = {
  self: 'relative isolate before:absolute before:-inset-1.5 before:-z-10 before:rounded-lg hover:before:bg-secondary',
  group:
    'relative isolate before:absolute before:-inset-1.5 before:-z-10 before:rounded-lg group-hover:before:bg-secondary',
}

// The calendar's header and its round buttons.
export const roundButton = cn(
  'grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground',
  focusRing,
)

export const pickerHeader = 'flex items-center justify-between'
export const pickerHeading = 'font-mono font-bold capitalize'
export const pickerNav = cn(
  'grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
  focusRing,
)
