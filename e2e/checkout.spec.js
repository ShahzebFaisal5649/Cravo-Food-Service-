import { test, expect } from '@playwright/test'

test('adds an item to cart and completes checkout', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill('admin@cravo.com')
  await page.getByPlaceholder('••••••••').fill('admin123')
  await page.getByRole('button', { name: /log in/i }).click()
  await expect(page.getByText(/hi,\s*admin/i)).toBeVisible()

  await page.goto('/')
  await page.getByRole('link', { name: /tandoori twist/i }).click()

  const menuRow = page
    .locator('div')
    .filter({ hasText: 'Tandoori Chicken (Half)' })
    .filter({ hasText: 'Rs. 500' })
    .last()
  await menuRow.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: /add to cart/i }).click()

  await page.getByRole('link', { name: /cart/i }).click()
  await page.getByRole('button', { name: /proceed to checkout/i }).click()

  await page.getByPlaceholder('House #, Street, Area').fill('Wapda Town, Lahore')
  await page.getByPlaceholder('Full name').fill('Test User')
  await page.getByPlaceholder('4242 4242 4242 4242').fill('4242424242424242')
  await page.getByPlaceholder('MM/YY').fill('1133')
  await page.getByPlaceholder('123').fill('123')

  await page.getByRole('button', { name: /pay rs\..*place order/i }).click()

  await expect(page).toHaveURL(/order-confirmation/)
})