// French is the source language (ADR-008). en.ts is typed against this shape.
export const fr = {
  app: {
    name: 'Money Tracker',
  },
  common: {
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    signOut: 'Se déconnecter',
    language: 'Langue',
    genericError: 'Une erreur est survenue. Réessayez.',
  },
  validation: {
    required: 'Ce champ est requis.',
    email: 'Entrez une adresse courriel valide.',
    passwordRule:
      'Au moins {{min}} caractères, avec au moins une lettre et un chiffre.',
    mismatch: 'Les deux mots de passe ne correspondent pas.',
    code: 'Le code compte six chiffres.',
    invalid: 'Cette valeur n’est pas valide.',
  },
  signIn: {
    title: 'Connexion',
    email: 'Courriel',
    password: 'Mot de passe',
    submit: 'Se connecter',
    pending: 'Connexion…',
    invalidCredentials: 'Courriel ou mot de passe invalide.',
    tooManyAttempts: 'Trop de tentatives. Patientez quelques minutes.',
    forgot: 'Mot de passe oublié ?',
  },
  mfa: {
    enrollTitle: 'Activer la double authentification',
    enrollIntro:
      'La double authentification est obligatoire. Scannez ce code avec une application d’authentification, idéalement dans deux applications (téléphone et gestionnaire de mots de passe), puis entrez le code à six chiffres.',
    start: 'Commencer',
    qrAlt: 'Code QR à scanner avec une application d’authentification',
    secretLabel: 'Ou entrez cette clé manuellement',
    challengeTitle: 'Vérification',
    challengeIntro:
      'Entrez le code à six chiffres de votre application d’authentification.',
    code: 'Code',
    verify: 'Vérifier',
    pending: 'Vérification…',
    invalidCode: 'Code invalide ou expiré.',
  },
  emailLink: {
    continue: 'Continuer',
    pending: 'Vérification…',
    invite: {
      title: 'Bienvenue',
      intro:
        'Votre invitation est prête. Continuez pour créer votre mot de passe.',
      invalid:
        'Ce lien d’invitation est invalide ou a expiré. Demandez une nouvelle invitation.',
    },
    recovery: {
      title: 'Réinitialisation',
      intro: 'Continuez pour choisir un nouveau mot de passe.',
      invalid:
        'Ce lien est invalide ou a expiré. Demandez un nouveau courriel de réinitialisation.',
    },
  },
  forgotPassword: {
    title: 'Mot de passe oublié',
    intro:
      'Entrez votre courriel. Si un compte y est associé, vous recevrez un lien pour choisir un nouveau mot de passe.',
    submit: 'Envoyer le lien',
    pending: 'Envoi…',
    sent: 'Si un compte existe pour ce courriel, le lien vient d’être envoyé. Il expire dans une heure.',
    back: 'Retour à la connexion',
  },
  setPassword: {
    title: 'Choisir votre mot de passe',
    rule: 'Au moins {{min}} caractères, avec au moins une lettre et un chiffre.',
    password: 'Nouveau mot de passe',
    confirm: 'Confirmer le mot de passe',
    submit: 'Enregistrer',
    pending: 'Enregistrement…',
    weakPassword: 'Ce mot de passe est trop faible.',
    samePassword: 'Choisissez un mot de passe différent de l’actuel.',
  },
  nav: {
    label: 'Navigation principale',
    transactions: 'Transactions',
    dashboard: 'Dashboard',
    budget: 'Budget',
    settings: 'Réglages',
  },
  comingSoon: {
    transactions:
      'Vos comptes et vos transactions arrivent ici, avec l’import de votre historique.',
    dashboard: 'Vos dépenses par catégorie et par mois s’afficheront ici.',
    budget: 'Vos objectifs et votre fonds d’urgence vivront ici.',
    settings: 'Comptes, catégories et devises s’ajouteront à cette page.',
  },
  settings: {
    signedInAs: 'Connecté avec',
  },
}

export type Messages = typeof fr
