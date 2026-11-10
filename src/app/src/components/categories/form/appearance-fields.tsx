import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CategoryBadge,
  CategoryIcon,
} from '#/components/categories/category-badge'
import { IconPicker } from '#/components/categories/form/icon-picker'
import { EditHint } from '#/components/forms/edit-hint'
import type { CategoryDraft } from '#/hooks/categories/use-category-draft'
import { Icon } from '#/components/display/icon'
import { SWATCHES } from '#/lib/categories/category'
import { iconColor } from '#/lib/shared/color'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

/** What the icon and colour fields need: a category's draft, or an event type's. */
export type Appearance = Pick<
  CategoryDraft,
  | 'icon'
  | 'color'
  | 'suggestedIcon'
  | 'canResetColor'
  | 'pickIcon'
  | 'pickColor'
  | 'resetColor'
>

/** The icon in its colour circle; tapping it opens the picker (CAT-07). */
function IconButton({ draft }: { draft: Appearance }) {
  const { t } = useTranslation()
  const [picking, setPicking] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-label={t('categories.icon.choose')}
        onClick={() => setPicking(true)}
        className={cn(
          'group relative w-fit cursor-pointer rounded-full',
          focusRing,
        )}
      >
        <CategoryBadge icon={draft.icon} color={draft.color} size="lg" />
        <EditHint />
      </button>
      {picking && (
        <IconPicker
          open
          color={draft.color}
          value={draft.icon}
          suggested={draft.suggestedIcon}
          onPick={draft.pickIcon}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}

const selected = 'ring-2 ring-foreground ring-offset-2 ring-offset-card'

/** A quick pick; a dot marks one another top-level category of the type already has. */
function Swatch({
  hex,
  n,
  picked,
  used,
  onPick,
}: {
  hex: string
  n: number
  picked: boolean
  used: boolean
  onPick: () => void
}) {
  const { t } = useTranslation()
  const label = t(used ? 'categories.swatchUsed' : 'categories.swatch', { n })
  return (
    <button
      type="button"
      aria-pressed={picked}
      aria-label={label}
      title={used ? label : undefined}
      onClick={onPick}
      className={cn(
        'grid aspect-square place-items-center rounded-full',
        picked && selected,
        focusRing,
      )}
      style={{ backgroundColor: hex }}
    >
      {used && !picked && (
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: iconColor(hex) }}
        />
      )}
    </button>
  )
}

/**
 * The browser's own colour picker, as the last circle: an empty dashed circle with a
 * paintbrush, and a plus on hover (like the other round add buttons), until a colour of
 * its own is picked, then that colour, selected like the quick picks and with a pencil on
 * hover. The real colour input lies invisibly over it.
 */
function CustomColor({
  draft,
  isSwatch,
}: {
  draft: Pick<Appearance, 'color' | 'pickColor'>
  isSwatch: boolean
}) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'group relative grid aspect-square place-items-center rounded-full transition-colors',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        isSwatch
          ? 'border-2 border-dashed border-primary/40 text-primary/60 hover:border-primary hover:text-primary'
          : selected,
      )}
      style={isSwatch ? undefined : { backgroundColor: draft.color }}
    >
      {isSwatch && <CategoryIcon icon="brush" className="size-4" />}
      <EditHint size="xs" icon={isSwatch ? 'plus' : 'pencil'} />
      <input
        type="color"
        aria-label={t('categories.customColor')}
        title={t('categories.customColor')}
        value={draft.color}
        onChange={(event) => draft.pickColor(event.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </span>
  )
}

/**
 * Nineteen quick picks, any colour, and a reset when a sub-category's colour was picked
 * by hand (spec 12). `used` holds the quick picks other top-level categories of the same
 * type already have.
 */
export function ColorGrid({
  draft,
  used,
  swatches,
}: {
  draft: Pick<
    Appearance,
    'color' | 'canResetColor' | 'pickColor' | 'resetColor'
  >
  used: ReadonlySet<string>
  swatches: ReadonlyArray<{ key: string; hex: string }>
}) {
  const { t } = useTranslation()
  const isSwatch = swatches.some((swatch) => swatch.hex === draft.color)
  return (
    <div
      role="group"
      aria-label={t('categories.color')}
      className="grid flex-1 grid-cols-11 gap-1.5"
    >
      {swatches.map((swatch, i) => (
        <Swatch
          key={swatch.key}
          hex={swatch.hex}
          n={i + 1}
          picked={swatch.hex === draft.color}
          used={used.has(swatch.hex)}
          onPick={() => draft.pickColor(swatch.hex)}
        />
      ))}
      <CustomColor draft={draft} isSwatch={isSwatch} />
      {draft.canResetColor && (
        <button
          type="button"
          aria-label={t('common.reset')}
          title={t('common.reset')}
          onClick={draft.resetColor}
          className={cn(
            'grid aspect-square place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground',
            focusRing,
          )}
        >
          <Icon name="undo" />
        </button>
      )}
    </div>
  )
}

/** The icon first, the colours filling the space beside it. */
export function AppearanceFields({
  draft,
  used,
  swatches = SWATCHES,
}: {
  draft: Appearance
  used: ReadonlySet<string>
  /** The quick picks; the categories' own by default. */
  swatches?: ReadonlyArray<{ key: string; hex: string }>
}) {
  return (
    <div className="flex items-center gap-4">
      <IconButton draft={draft} />
      <ColorGrid draft={draft} used={used} swatches={swatches} />
    </div>
  )
}
