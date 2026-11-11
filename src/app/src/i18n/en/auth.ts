import type { authFr } from '../fr/auth'

export const authEn: typeof authFr = {
  signIn: {
    title: 'Sign in',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    invalidCredentials: 'Invalid email or password.',
    tooManyAttempts: 'Too many attempts. Wait a few minutes.',
    forgot: 'Forgot your password?',
  },
  mfa: {
    enrollTitle: 'Turn on two-factor authentication',
    enrollIntro:
      'Scan this code with an authenticator app, then enter the six-digit code.',
    start: 'Start',
    qrAlt: 'QR code to scan with an authenticator app',
    secretLabel: 'Or enter this key manually',
    challengeTitle: 'Verification',
    challengeIntro: 'Enter the six-digit code from your authenticator app.',
    code: 'Code',
    verify: 'Verify',
    invalidCode: 'Invalid or expired code.',
  },
  emailLink: {
    continue: 'Continue',
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
    submit: 'Send the link',
    sent: 'If an account exists for this email, the link has been sent. It expires in one hour.',
    back: 'Back to sign in',
  },
  setPassword: {
    title: 'Choose your password',
    password: 'New password',
    confirm: 'Confirm password',
    weakPassword: 'This password is too weak.',
    samePassword: 'Choose a password different from the current one.',
  },
}
