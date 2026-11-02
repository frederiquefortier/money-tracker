import type { Messages } from './fr'

export const en: Messages = {
  app: {
    name: 'Money Tracker',
  },
  common: {
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    signOut: 'Sign out',
    language: 'Language',
    genericError: 'Something went wrong. Try again.',
  },
  validation: {
    required: 'This field is required.',
    email: 'Enter a valid email address.',
    passwordRule:
      'At least {{min}} characters, with at least one letter and one digit.',
    mismatch: 'The two passwords do not match.',
    code: 'The code has six digits.',
    invalid: 'This value is not valid.',
  },
  signIn: {
    title: 'Sign in',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    pending: 'Signing in…',
    invalidCredentials: 'Invalid email or password.',
    tooManyAttempts: 'Too many attempts. Wait a few minutes.',
    forgot: 'Forgot your password?',
  },
  mfa: {
    enrollTitle: 'Turn on two-factor authentication',
    enrollIntro:
      'Two-factor authentication is required. Scan this code with an authenticator app, ideally in two apps (phone and password manager), then enter the six-digit code.',
    start: 'Start',
    qrAlt: 'QR code to scan with an authenticator app',
    secretLabel: 'Or enter this key manually',
    challengeTitle: 'Verification',
    challengeIntro: 'Enter the six-digit code from your authenticator app.',
    code: 'Code',
    verify: 'Verify',
    pending: 'Verifying…',
    invalidCode: 'Invalid or expired code.',
  },
  emailLink: {
    continue: 'Continue',
    pending: 'Checking…',
    invite: {
      title: 'Welcome',
      intro: 'Your invitation is ready. Continue to set your password.',
      invalid:
        'This invitation link is invalid or has expired. Ask for a new invitation.',
    },
    recovery: {
      title: 'Password reset',
      intro: 'Continue to choose a new password.',
      invalid:
        'This link is invalid or has expired. Request a new reset email.',
    },
  },
  forgotPassword: {
    title: 'Forgot password',
    intro:
      'Enter your email. If it belongs to an account, you will receive a link to choose a new password.',
    submit: 'Send the link',
    pending: 'Sending…',
    sent: 'If an account exists for this email, the link has been sent. It expires in one hour.',
    back: 'Back to sign in',
  },
  setPassword: {
    title: 'Choose your password',
    rule: 'At least {{min}} characters, with at least one letter and one digit.',
    password: 'New password',
    confirm: 'Confirm password',
    submit: 'Save',
    pending: 'Saving…',
    weakPassword: 'This password is too weak.',
    samePassword: 'Choose a password different from the current one.',
  },
  nav: {
    label: 'Main navigation',
    transactions: 'Transactions',
    dashboard: 'Dashboard',
    budget: 'Budget',
    settings: 'Settings',
  },
  comingSoon: {
    transactions:
      'Your accounts and transactions will live here, with the import of your history.',
    dashboard: 'Your spending by category and by month will show here.',
    budget: 'Your goals and your emergency fund will live here.',
    settings: 'Accounts, categories and currencies will be added to this page.',
  },
  settings: {
    signedInAs: 'Signed in as',
  },
}
