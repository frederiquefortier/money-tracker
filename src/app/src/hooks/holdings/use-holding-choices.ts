import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { typesFor } from '#/components/holdings/form/holding-fields'
import { offeredType } from '#/lib/holdings/holding'
import { nameFallback } from '#/lib/holdings/holding-input'
import type { Institution } from '#/lib/institutions/institution'
import type { HoldingType } from '#/lib/holdings/holding'
import { useLocale } from '#/hooks/app/use-locale'

/**
 * What the holding form chooses live rather than reads on submit: the country, the type
 * it offers, the text of a typed type, the institution and the currency.
 */
export function useHoldingChoices({
  country: initialCountry,
  type: initialType,
  typed: initialTyped,
  kind: initialKind,
  institutionId,
  currency,
  types,
}: {
  country: string
  type: string
  typed: string
  kind: string
  institutionId: string | null
  currency: string
  types: ReadonlyArray<HoldingType>
}) {
  const locale = useLocale()
  const [country, setCountry] = useState(initialCountry)
  const [chosen, setType] = useState(initialType)
  const [typed, setTyped] = useState(initialTyped)
  const [kind, setKind] = useState(initialKind)
  const [institution, setInstitution] = useState(institutionId)
  const [code, setCode] = useState(currency)

  // A country has its own types; the type held is always one of them (spec 19).
  const type = offeredType(chosen, typesFor(types, country, locale))

  return {
    country,
    setCountry,
    type,
    setType,
    typed,
    setTyped,
    kind,
    setKind,
    institutionId: institution,
    setInstitutionId: setInstitution,
    currency: code,
    setCurrency: setCode,
  }
}

/** The name the holding would get with none typed, for the name field's placeholder. */
export function useNamePlaceholder(
  choice: ReturnType<typeof useHoldingChoices>,
  types: ReadonlyArray<HoldingType>,
  institutions: ReadonlyArray<Institution>,
) {
  const { t } = useTranslation()
  const locale = useLocale()
  return nameFallback({
    type: choice.type,
    typed: choice.typed,
    otherText: t('holdings.otherType'),
    types,
    institution:
      institutions.find((i) => i.id === choice.institutionId)?.name ?? null,
    currency: choice.currency,
    locale,
  })
}
