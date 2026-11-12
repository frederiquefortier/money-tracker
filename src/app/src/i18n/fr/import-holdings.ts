export const importHoldingsFr = {
  summary: {
    values_one: '{{count, number}} valeur d’avoir',
    values_other: '{{count, number}} valeurs d’avoirs',
    viewHoldings: 'Voir les avoirs',
    undoHoldings:
      'Les avoirs, valeurs, contributions et transferts de cet import seront supprimés.',
  },
  errors: {
    holding_key_required: 'L’avoir a besoin d’un nom dans la première colonne.',
    holding_duplicate: 'Deux avoirs ont la même clé: {{detail}}',
    holding_type_unknown: 'Type d’avoir inconnu: {{detail}}',
    holding_currency_unknown: 'Devise inconnue: {{detail}}',
    holding_country_required:
      'Ce type n’a pas de pays propre: indiquez-en un (CA, CH).',
    holding_dates: 'L’avoir « {{detail}} » ferme avant d’ouvrir.',
    holding_ambiguous:
      'Plusieurs avoirs de l’app correspondent à « {{detail}} ». Donnez-lui un nom qui les distingue.',
    holding_currency_differs:
      'L’avoir « {{detail}} » est dans une autre devise dans l’app.',
    holding_unknown:
      'Aucun avoir avec la clé « {{detail}} » dans holdings.csv.',
    amount_negative: 'Une valeur ne peut pas être négative: {{detail}}',
    amount_not_positive: 'Le montant doit être supérieur à zéro: {{detail}}',
    snapshot_duplicate: 'Deux valeurs pour « {{detail}} » à la même date.',
    after_holding_closed:
      'Cette date est après la fermeture de « {{detail}} ».',
    label_too_long: 'L’étiquette est trop longue (100 caractères au plus).',
    transfer_same_holding: 'Un transfert demande deux avoirs: {{detail}}',
    holding_transfer_kind:
      'Seuls les placements acceptent des transferts: {{detail}}',
    holding_transfer_currency:
      'Les deux avoirs d’un transfert doivent avoir la même devise: {{detail}}',
  },
}
