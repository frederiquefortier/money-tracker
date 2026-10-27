import type { Messages } from './fr'

export const en: Messages = {
  app: {
    name: 'Money Tracker',
  },
  common: {
    signOut: 'Sign out',
    language: 'Language',
    genericError: 'Something went wrong. Try again.',
  },
  signIn: {
    title: 'Sign in',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    pending: 'Signing in…',
    invalidCredentials: 'Invalid email or password.',
    forgot: 'Forgot your password?',
    inviteOnly: 'Accounts are created by invitation.',
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
    mismatch: 'The two passwords do not match.',
    weakPassword: 'This password is too weak.',
    samePassword: 'Choose a password different from the current one.',
  },
  home: {
    greeting: 'Hello {{email}}',
    intro:
      'Phase 0: sign-in, two-factor authentication and data security are in place. The rest is coming.',
  },
}
