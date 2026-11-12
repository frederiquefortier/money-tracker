export const importHoldingsFr = {
  summary: {
    values_one: '{{count, number}} valeur de placement',
    values_other: '{{count, number}} valeurs de placements',
    viewHoldings: 'Voir les placements',
    undoHoldings:
      'Les placements, valeurs, contributions et transferts de cet import seront supprimés.',
  },
  errors: {
    holding_key_required:
      'Le placement a besoin d’un nom dans la première colonne.',
    holding_duplicate: 'Deux placements ont la même clé: {{detail}}',
    holding_type_unknown: 'Type de placement inconnu: {{detail}}',
    holding_currency_unknown: 'Devise inconnue: {{detail}}',
    holding_country_required:
      'Ce type n’a pas de pays propre: indiquez-en un (CA, CH).',
    holding_dates: 'Le placement « {{detail}} » ferme avant d’ouvrir.',
    holding_ambiguous:
      'Plusieurs placements de l’app correspondent à « {{detail}} ». Donnez-lui un nom qui les distingue.',
    holding_currency_differs:
      'Le placement « {{detail}} » est dans une autre devise dans l’app.',
    holding_unknown:
      'Aucun placement avec la clé « {{detail}} » dans holdings.csv.',
    amount_negative: 'Une valeur ne peut pas être négative: {{detail}}',
    amount_not_positive: 'Le montant doit être supérieur à zéro: {{detail}}',
    snapshot_duplicate: 'Deux valeurs pour « {{detail}} » à la même date.',
    after_holding_closed:
      'Cette date est après la fermeture de « {{detail}} ».',
    label_too_long: 'L’étiquette est trop longue (100 caractères au plus).',
    transfer_same_holding: 'Un transfert demande deux placements: {{detail}}',
    holding_transfer_kind:
      'Seuls les placements acceptent des transferts: {{detail}}',
    holding_transfer_currency:
      'Les deux placements d’un transfert doivent avoir la même devise: {{detail}}',
  },
}
