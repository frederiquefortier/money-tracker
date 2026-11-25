import { cn } from '#/lib/utils'

// The class strings shared by several components: one place to change how they look.

/** The one width of a screen's column: the lists, the transactions, the calendar sheet. */
export const pageWidth = 'max-w-[48rem]'
export const pageColumn = cn(
  'mx-auto flex w-full flex-col gap-4 pb-20',
  pageWidth,
)

/**
 * Frosted glass for a small bar over content that scrolls: the header, the tab bar, a
 * toast. The blur is redrawn as the page moves under it, so never on a full-screen layer,
 * a list's rows or anything that slides.
 */
export const glassSurface = 'bg-card/80 backdrop-blur'

/** The red tint of an error message, a badge or a destructive row hover. */
export const errorTint = 'bg-destructive/10 text-destructive'

/** The green tint of a success message (the income green). */
export const successTint = 'bg-income/10 text-income'

/** The orange tint of a notice that asks for a look but is not an error. */
export const warningTint = 'bg-warning/15 text-warning-foreground'

/** The grey of a notice that explains a setting. */
export const helpTint = 'bg-muted text-foreground'

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

/**
 * A paper slip torn along the bottom: the transaction form's amount, and a merchant's
 * typical bill on the dashboard (MER-04).
 */
export const receiptSlip =
  'receipt flex flex-col gap-3 bg-background px-4 pt-4 font-mono'

/** The dashed rule between a slip's sections. */
export const slipRuleLine = 'my-1 border-dashed border-border'

/** A slip's line: its label in capitals at the left, its figure at the right. */
export const slipLine = 'flex items-baseline justify-between gap-3'
export const slipLabel = 'min-w-0 truncate tracking-wide uppercase'

/** A bubble: the transactions list's period and filters, all the same height. */
export const chipSurface = cn(
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-input bg-transparent px-3 text-sm font-semibold hover:bg-secondary disabled:pointer-events-none disabled:opacity-50',
  focusRing,
)

/** A chip while what it opens has something chosen: a filter in use. */
export const chipActive = 'border-primary text-primary'

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

// The dashboard's category and merchant tables, one above the other: the same name and
// figure widths so their first columns line up. The widths sit inside
// the head cells: beside a full-width trend column, a width on the cell itself is ignored.
/**
 * The tables' name column, pinned while the figures scroll: opaque in the row's colour,
 * with its own fade and a shadow for a right border, which a collapsed table would lose.
 */
export const tableStickyCell =
  'sticky left-0 z-10 bg-[var(--row-bg,var(--card))] shadow-[inset_-1px_0_0_var(--border)] transition-colors'
/** A row's panel, pinned to the visible width while the figures scroll under it, over the fades. */
export const tablePanel = 'sticky left-0 z-30 w-[100cqw] bg-card px-4 pt-4 pb-3'
/** On a name cell: long names cut at the width the head sets. */
export const tableNameWidth = 'max-w-48 sm:max-w-56'
/** Inside the name head, after its padding: the column at `sm:max-w-56`. */
export const tableNameHead = 'block sm:w-[12.25rem]'
export const tableFigureHead = 'block min-w-20'
/** A figure's cell in the dashboard's tables, right-aligned after the name. */
export const tableFigureCell = 'py-1.5 pl-6 text-right whitespace-nowrap'
/** A zero: far paler than a figure, so the amounts stand out. */
export const zeroFigure = 'text-muted-foreground/45'

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
  'grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
  focusRing,
)

export const pickerHeader = 'flex items-center justify-between'
export const pickerHeading = 'font-mono font-bold capitalize'
