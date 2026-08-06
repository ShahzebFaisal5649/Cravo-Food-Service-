import { test, expect } from '@playwright/test'

test('logs in and sees the account name in the navbar', async ({ page }) => {
  await page.goto('/login')

  await page.getByPlaceholder('you@example.com').fill('admin@cravo.com')
  await page.getByPlaceholder('••••••••').fill('admin123')
  await page.getByRole('button', { name: /log in/i }).click()

  await expect(page.getByText(/hi,\s*admin/i)).toBeVisible()
})

test('shows an error on wrong password', async ({ page }) => {
  await page.goto('/login')

  await page.getByPlaceholder('you@example.com').fill('admin@cravo.com')
  await page.getByPlaceholder('••••••••').fill('wrong-password')
  await page.getByRole('button', { name: /log in/i }).click()

  await expect(page.getByText(/incorrect password/i)).toBeVisible()
})