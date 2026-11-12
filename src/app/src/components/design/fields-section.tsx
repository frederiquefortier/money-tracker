import { useState } from 'react'
import { Combobox } from '#/components/combobox/combobox'
import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { ChoiceField } from '#/components/forms/choice-field'
import { CheckboxField } from '#/components/forms/checkbox-field'
import { DatePickerField } from '#/components/forms/date-picker-field'
import { FormField } from '#/components/forms/form-field'
import { LinkedFields } from '#/components/forms/linked-fields'
import { InfoTooltip } from '#/components/forms/info-tooltip'
import { SearchField } from '#/components/forms/search-field'
import { SelectField } from '#/components/forms/select-field'
import type { ComboboxOption } from '#/hooks/forms/use-combobox'

const OPTIONS: Array<ComboboxOption> = [
  { value: 'food', label: 'Food', group: 'Expenses' },
  {
    value: 'groceries',
    label: 'Food / Groceries',
    short: 'Groceries',
    depth: 1,
    parent: 'food',
    group: 'Expenses',
  },
  { value: 'rent', label: 'Rent', group: 'Expenses' },
  { value: 'salary', label: 'Salary', group: 'Income' },
]
const KINDS = ['need', 'want'] as const

function LinkedFieldsSpecimen() {
  return (
    <Specimen name="LinkedFields" source="forms/linked-fields.tsx">
      <div className="flex w-full flex-col gap-4">
        <DatePickerField label="Opened on" defaultValue="2026-11-11" />
        <LinkedFields>
          <FormField
            name="balance"
            label="Balance on that date"
            inputMode="decimal"
            className="font-mono"
          />
        </LinkedFields>
      </div>
    </Specimen>
  )
}

function TextFieldSpecimen() {
  return (
    <>
      <Specimen name="FormField" source="forms/form-field.tsx">
        <div className="flex w-full flex-col gap-4">
          <FormField name="a" label="Name" placeholder="Placeholder" />
          <FormField name="b" label="Required" required defaultValue="Value" />
          <FormField
            name="c"
            label="Error"
            defaultValue="Value"
            error="A message under the field"
          />
          <FormField
            name="d"
            label="Password"
            type="password"
            defaultValue="secret"
          />
          <FormField name="e" label="Disabled" disabled defaultValue="Value" />
        </div>
      </Specimen>
    </>
  )
}

export function FieldsSection() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>('rent')
  const [kind, setKind] = useState<(typeof KINDS)[number]>('need')
  const [date, setDate] = useState('2026-11-11')
  const [checked, setChecked] = useState(true)
  return (
    <GallerySection id="fields" title="Fields">
      <div className="grid gap-6 md:grid-cols-2">
        <TextFieldSpecimen />
        <Specimen name="Pickers" source="forms/, combobox/">
          <div className="flex w-full flex-col gap-4">
            <SelectField
              label="SelectField"
              options={[
                { value: 'one', label: 'One' },
                { value: 'two', label: 'Two' },
              ]}
            />
            <Combobox
              label="Combobox"
              options={OPTIONS}
              value={category}
              onChange={setCategory}
              clearLabel="Clear"
              createLabel={(text) => `Create ${text}`}
              onCreate={() => {}}
            />
            <DatePickerField
              label="DatePickerField"
              value={date}
              onChange={setDate}
              clearable
            />
            <SearchField value={search} onChange={setSearch} />
          </div>
        </Specimen>
        <Specimen
          name="Choices"
          source="forms/checkbox-field.tsx, choice-field.tsx"
        >
          <div className="flex w-full flex-col gap-4">
            <CheckboxField
              name="x"
              label="Checkbox"
              checked={checked}
              onCheckedChange={setChecked}
            />
            <ChoiceField
              label="ChoiceField"
              options={KINDS.map((value) => ({ value, label: value }))}
              value={kind}
              onChange={setKind}
            />
          </div>
        </Specimen>
        <LinkedFieldsSpecimen />
        <Specimen name="InfoTooltip" source="forms/info-tooltip.tsx">
          <span className="text-sm font-semibold">Label</span>
          <InfoTooltip label="More">What the label means.</InfoTooltip>
        </Specimen>
      </div>
    </GallerySection>
  )
}
