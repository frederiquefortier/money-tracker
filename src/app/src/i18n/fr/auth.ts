export const authFr = {
  signIn: {
    title: 'Connexion',
    email: 'Courriel',
    password: 'Mot de passe',
    submit: 'Se connecter',
    invalidCredentials: 'Courriel ou mot de passe invalide.',
    tooManyAttempts: 'Trop de tentatives. Patientez quelques minutes.',
    forgot: 'Mot de passe oublié?',
  },
  mfa: {
    enrollTitle: 'Activer la double authentification',
    enrollIntro:
      'Scannez ce code avec une application d’authentification, puis entrez le code à six chiffres.',
    start: 'Commencer',
    qrAlt: 'Code QR à scanner avec une application d’authentification',
    secretLabel: 'Ou entrez cette clé manuellement',
    challengeTitle: 'Vérification',
    challengeIntro:
      'Entrez le code à six chiffres de votre application d’authentification.',
    code: 'Code',
    verify: 'Vérifier',
    invalidCode: 'Code invalide ou expiré.',
  },
  emailLink: {
    continue: 'Continuer',
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
    submit: 'Envoyer le lien',
    sent: 'Si un compte existe pour ce courriel, le lien vient d’être envoyé. Il expire dans une heure.',
    back: 'Retour à la connexion',
  },
  setPassword: {
    title: 'Choisir votre mot de passe',
    password: 'Nouveau mot de passe',
    confirm: 'Confirmer le mot de passe',
    weakPassword: 'Ce mot de passe est trop faible.',
    samePassword: 'Choisissez un mot de passe différent de l’actuel.',
  },
}
