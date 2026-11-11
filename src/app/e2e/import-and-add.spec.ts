import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

// The invented example files the import page offers as templates.
const TEMPLATES = '../data/reference/import-templates'
const FILES = ['accounts', 'transactions', 'splits'].map((name) =>
  resolve(`${TEMPLATES}/${name}.csv`),
)

// One flow: the import creates the accounts and categories the form then needs.
test.describe.configure({ mode: 'serial' })

test('importing the example files creates the history', async ({ page }) => {
  await page.goto('/settings/import')
  await page.locator('input[type="file"]').setInputFiles(FILES)
  await page.getByRole('button', { name: 'Extract' }).click()
  await page.getByRole('button', { name: 'Import 11 transactions' }).click()
  await expect(page.getByText('Import finished')).toBeVisible()
})

test('a new expense lands in the list', async ({ page }) => {
  await page.goto('/transactions/new')
  await page.getByLabel('Amount', { exact: true }).fill('12.50')
  await page.getByRole('button', { name: /^Category:/ }).click()
  await page
    .getByRole('button', { name: /Épicerie/ })
    .first()
    .click()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Transaction added.')).toBeVisible()

  await page.goto('/transactions')
  await expect(page.getByText(/12\.50/).first()).toBeVisible()
})
