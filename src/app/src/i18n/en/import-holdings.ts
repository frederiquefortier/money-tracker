export const importHoldingsEn = {
  summary: {
    values_one: '{{count, number}} holding value',
    values_other: '{{count, number}} holding values',
    viewHoldings: 'View the holdings',
    undoHoldings:
      'The holdings, values, contributions and transfers of this import will be deleted.',
  },
  errors: {
    holding_key_required: 'The holding needs a name in the first column.',
    holding_duplicate: 'Two holdings have the same key: {{detail}}',
    holding_type_unknown: 'Unknown holding type: {{detail}}',
    holding_currency_unknown: 'Unknown currency: {{detail}}',
    holding_country_required:
      'This type has no country of its own: give one (CA, CH).',
    holding_dates: 'The holding “{{detail}}” closes before it opens.',
    holding_ambiguous:
      'Several holdings in the app match “{{detail}}”. Give it a name that tells them apart.',
    holding_currency_differs:
      'The holding “{{detail}}” is in another currency in the app.',
    holding_unknown: 'No holding with the key “{{detail}}” in holdings.csv.',
    amount_negative: 'A value cannot be negative: {{detail}}',
    amount_not_positive: 'The amount must be above zero: {{detail}}',
    snapshot_duplicate: 'Two values for “{{detail}}” on the same date.',
    after_holding_closed: 'This date is after “{{detail}}” closed.',
    label_too_long: 'The label is too long (100 characters at most).',
    transfer_same_holding: 'A transfer needs two holdings: {{detail}}',
    holding_transfer_kind: 'Only investments take transfers: {{detail}}',
    holding_transfer_currency:
      'Both holdings of a transfer must share a currency: {{detail}}',
  },
}
