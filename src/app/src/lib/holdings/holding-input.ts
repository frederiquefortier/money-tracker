import { OTHER_TYPE, holdingLabel } from '#/lib/holdings/holding'
import type {
  HoldingInput,
  HoldingKind,
  HoldingType,
} from '#/lib/holdings/holding'
import type { Locale } from '#/i18n/locales'

type FormValues = {
  country: string
  type: string
  customType: string
  kind: string
  name: string
  openedOn: string
}

function typedKind(kind: string): HoldingKind {
  if (kind === 'asset' || kind === 'debt') return kind
  return 'investment'
}

/** What the sheet form hands the server: a predefined type, or a typed one with its kind. */
export function holdingInputOf({
  values,
  types,
  id,
  currency,
  institutionId,
}: {
  values: FormValues
  types: ReadonlyArray<HoldingType>
  id: string | undefined
  currency: string
  institutionId: string | null
}): HoldingInput {
  const other = values.type === OTHER_TYPE
  const kind = other
    ? typedKind(values.kind)
    : (types.find((one) => one.code === values.type)?.kind ?? 'investment')
  return {
    id,
    country: values.country,
    type: other ? null : values.type,
    typeLabel: other ? values.customType : null,
    kind,
    name: values.name || null,
    currency,
    institutionId,
    openedOn: values.openedOn,
  }
}

/** The name the holding would get with none typed, shown in the name field. */
export function nameFallback({
  type,
  typed,
  otherText,
  types,
  institution,
  currency,
  locale,
}: {
  type: string
  typed: string
  /** What stands for a typed type before anything is typed. */
  otherText: string
  types: ReadonlyArray<HoldingType>
  institution: string | null
  currency: string
  locale: Locale
}): string {
  const chosen = types.find((one) => one.code === type)
  const text = typed || otherText
  return holdingLabel(
    {
      name: null,
      typeFr: chosen?.labelFr ?? text,
      typeEn: chosen?.labelEn ?? text,
      institution,
      currency,
    },
    locale,
  )
}
