import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { EMAIL, PASSWORD, TOTP_SECRET_FILE } from './account'
import { freshCode } from './totp'

// These start signed out.
test.use({ storageState: { cookies: [], origins: [] } })

test('a signed-out visitor is sent to sign in', async ({ page }) => {
  await page.goto('/transactions')
  await expect(page).toHaveURL(/\/sign-in/)
})

test('a wrong password says so and stays on the page', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill('not-the-Password-1')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Invalid email or password.')).toBeVisible()
  await expect(page).toHaveURL(/\/sign-in/)
})

test('the password alone does not open the app', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/mfa/)
  await page.goto('/transactions')
  await expect(page).toHaveURL(/\/mfa/)
})

test('the password and a code open the app', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  const secret = readFileSync(TOTP_SECRET_FILE, 'utf8')
  await page.getByLabel('Code').fill(await freshCode(secret))
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page).not.toHaveURL(/\/(mfa|sign-in)/)
})

test('a write marked cross-site is refused', async ({ request }) => {
  const response = await request.post('/sign-in', {
    headers: { 'sec-fetch-site': 'cross-site' },
  })
  expect(response.status()).toBe(403)
})
