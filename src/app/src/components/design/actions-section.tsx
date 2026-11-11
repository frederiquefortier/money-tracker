import { useState } from 'react'
import { ChoiceMenu } from '#/components/display/choice-menu'
import { CurrencyChip, FixedCurrency } from '#/components/display/currency-chip'
import { IconButton } from '#/components/display/icon-button'
import { Spinner } from '#/components/feedback/spinner'
import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { SortMenu } from '#/components/lists/sort-menu'
import { TabList } from '#/components/lists/tab-list'
import { Button } from '#/components/ui/button'
import { chipSurface } from '#/components/styles'
import type { Currency } from '#/lib/currencies/currency'

const VARIANTS = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
] as const
const SIZES = ['xs', 'sm', 'default', 'lg'] as const
const CURRENCIES: Array<Currency> = [
  {
    code: 'CAD',
    nameFr: 'Dollar canadien',
    nameEn: 'Canadian dollar',
    symbol: '$',
  },
  { code: 'EUR', nameFr: 'Euro', nameEn: 'Euro', symbol: '€' },
  { code: 'CHF', nameFr: 'Franc suisse', nameEn: 'Swiss franc', symbol: 'CHF' },
]
const SORTS = ['name', 'balance', 'recent'] as const
const TABS = ['expense', 'income', 'transfer'] as const

function ButtonSpecimens() {
  return (
    <>
      <Specimen name="Button" source="ui/button.tsx">
        {VARIANTS.map((variant) => (
          <div
            key={variant}
            className="flex w-full flex-wrap items-center gap-2"
          >
            <span className="w-24 text-xs text-muted-foreground">
              {variant}
            </span>
            {SIZES.map((size) => (
              <Button key={size} variant={variant} size={size}>
                {size}
              </Button>
            ))}
            <Button variant={variant} disabled>
              disabled
            </Button>
          </div>
        ))}
      </Specimen>
      <Specimen name="Pending button" source="feedback/spinner.tsx">
        <Button disabled>
          <Spinner />
          Save
        </Button>
        <Button variant="destructive" disabled>
          <Spinner />
          Delete
        </Button>
      </Specimen>
    </>
  )
}

export function ActionsSection() {
  const [sort, setSort] = useState<(typeof SORTS)[number]>('name')
  const [currency, setCurrency] = useState('CAD')
  const [tab, setTab] = useState<(typeof TABS)[number]>('expense')
  const [pressed, setPressed] = useState(false)
  return (
    <GallerySection id="actions" title="Actions">
      <ButtonSpecimens />
      <Specimen name="IconButton" source="display/icon-button.tsx">
        <IconButton icon="pencil" label="Normal" />
        <IconButton
          icon="filter"
          label="Pressed"
          pressed={pressed}
          onClick={() => setPressed(!pressed)}
        />
        <IconButton icon="trash-full" label="Muted" muted />
        <IconButton icon="trash-full" label="Disabled" disabled />
      </Specimen>
      <Specimen name="Chip" source="styles.ts chipSurface">
        <button type="button" className={chipSurface}>
          Dates
        </button>
        <button type="button" className={chipSurface} disabled>
          Disabled
        </button>
        <SortMenu
          sort={sort}
          options={SORTS}
          labelOf={(value) => value}
          onChange={setSort}
        />
        <ChoiceMenu
          label="Choice"
          value={sort}
          options={SORTS}
          labelOf={(value) => value}
          onChange={setSort}
        />
      </Specimen>
      <Specimen name="Currency" source="display/currency-chip.tsx">
        <CurrencyChip
          value={currency}
          label={`Currency ${currency}`}
          currencies={CURRENCIES}
          onChange={setCurrency}
        />
        <FixedCurrency value="CHF" />
      </Specimen>
      <Specimen name="TabList" source="lists/tab-list.tsx">
        <div className="w-full max-w-sm">
          <TabList
            label="Kind"
            tabs={TABS}
            value={tab}
            labelOf={(value) => value}
            panelId="gallery-tabs"
            idPrefix="gallery-tab"
            onSelect={setTab}
          />
        </div>
      </Specimen>
    </GallerySection>
  )
}
