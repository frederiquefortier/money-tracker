import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { IconPicker } from '#/components/categories/icon-picker'
import { EditHint } from '#/components/edit-hint'
import type { CategoryDraft } from '#/components/categories/use-category-draft'
import { Button } from '#/components/ui/button'
import { FieldLabel } from '#/components/ui/field'
import { SWATCHES } from '#/lib/categories'
import { iconColor } from '#/lib/color'
import { cn, focusRing } from '#/lib/utils'

/** The icon in its colour circle; tapping it opens the picker (CAT-07). */
export function IconField({ draft }: { draft: CategoryDraft }) {
  const { t } = useTranslation()
  const labelId = useId()
  const [picking, setPicking] = useState(false)
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <FieldLabel id={labelId}>{t('categories.icon.label')}</FieldLabel>
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
    </div>
  )
}

// Any colour: a full rainbow until a custom colour is picked, then a ring around it.
const RAINBOW =
  'conic-gradient(oklch(0.65 0.2 0), oklch(0.75 0.17 90), oklch(0.65 0.17 150), oklch(0.6 0.15 230), oklch(0.55 0.2 300), oklch(0.65 0.2 360))'

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

/** The browser's own colour picker, as the last circle. */
function CustomColor({
  draft,
  isSwatch,
}: {
  draft: CategoryDraft
  isSwatch: boolean
}) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'aspect-square rounded-full p-[3px]',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        !isSwatch && selected,
      )}
      style={{ background: RAINBOW }}
    >
      <input
        type="color"
        aria-label={t('categories.customColor')}
        title={t('categories.customColor')}
        value={draft.color}
        onChange={(event) => draft.pickColor(event.target.value)}
        className={cn(
          'block size-full cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 outline-none',
          '[&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0',
          '[&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0',
          isSwatch && 'opacity-0',
        )}
      />
    </span>
  )
}

/**
 * Nineteen quick picks, then any colour (spec 12). `used` holds the quick picks other
 * top-level categories of the same type already have.
 */
export function ColorField({
  draft,
  used,
}: {
  draft: CategoryDraft
  used: ReadonlySet<string>
}) {
  const { t } = useTranslation()
  const labelId = useId()
  const isSwatch = SWATCHES.some((swatch) => swatch.hex === draft.color)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <FieldLabel id={labelId}>{t('categories.color')}</FieldLabel>
        {draft.canResetColor && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={draft.resetColor}
          >
            {t('common.reset')}
          </Button>
        )}
      </div>
      <div
        role="group"
        aria-labelledby={labelId}
        className="grid grid-cols-10 gap-1.5"
      >
        {SWATCHES.map((swatch, i) => (
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
      </div>
    </div>
  )
}
