import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, test as setup } from '@playwright/test'
import {
  AUTH_DIR,
  EMAIL,
  PASSWORD,
  STORAGE_STATE,
  TOTP_SECRET_FILE,
} from './account'
import { e2eEnv } from './env'
import { freshCode } from './totp'

async function createUser() {
  const { url, secretKey } = e2eEnv()
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    }),
  })
  // 422 is "already registered": a second run on the same stack.
  if (!response.ok && response.status !== 422)
    throw new Error(`Creating the test user failed (${response.status}).`)
}

// Signs in once, enrols the authenticator through the screen, and keeps the session so
// the other specs start signed in at aal2.
setup('sign in with MFA', async ({ page }) => {
  mkdirSync(AUTH_DIR, { recursive: true })
  await createUser()

  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/mfa/)

  if (existsSync(TOTP_SECRET_FILE)) {
    const secret = readFileSync(TOTP_SECRET_FILE, 'utf8')
    await page.getByLabel('Code').fill(await freshCode(secret))
  } else {
    await page.getByRole('button', { name: 'Start' }).click()
    const secret = (await page.locator('code').innerText()).trim()
    writeFileSync(TOTP_SECRET_FILE, secret)
    await page.getByLabel('Code').fill(await freshCode(secret))
  }
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page).not.toHaveURL(/\/(mfa|sign-in)/)

  await page.context().storageState({ path: STORAGE_STATE })
})
