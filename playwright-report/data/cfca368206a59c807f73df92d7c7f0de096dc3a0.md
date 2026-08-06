# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.js >> adds an item to cart and completes checkout
- Location: e2e\checkout.spec.js:3:1

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByRole('button', { name: /log in/i })
    - locator resolved to <button type="submit" class="bg-gold text-charcoal font-semibold rounded-lg py-2 mt-2 hover:bg-champagne transition-colors disabled:opacity-50">Log In</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-wrap gap-2 mb-4">…</div> from <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button class="text-sm rounded-full px-3 py-1.5 border transition-colors border-borderDark text-offwhite hover:border-gold">Wapda Town, Lahore</button> from <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button class="text-sm rounded-full px-3 py-1.5 border transition-colors border-borderDark text-offwhite hover:border-gold">DHA, Lahore</button> from <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">…</div> subtree intercepts pointer events
  9 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-wrap gap-2 mb-4">…</div> from <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button class="text-sm rounded-full px-3 py-1.5 border transition-colors border-borderDark text-offwhite hover:border-gold">Wapda Town, Lahore</button> from <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button class="text-sm rounded-full px-3 py-1.5 border transition-colors border-borderDark text-offwhite hover:border-gold">DHA, Lahore</button> from <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button class="text-sm rounded-full px-3 py-1.5 border transition-colors border-borderDark text-offwhite hover:border-gold">DHA, Lahore</button> from <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="flex flex-wrap gap-2 mb-4">…</div> from <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button class="text-sm rounded-full px-3 py-1.5 border transition-colors border-borderDark text-offwhite hover:border-gold">Wapda Town, Lahore</button> from <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('adds an item to cart and completes checkout', async ({ page }) => {
  4  |   await page.goto('/login')
  5  |   await page.getByPlaceholder('you@example.com').fill('admin@cravo.com')
  6  |   await page.getByPlaceholder('••••••••').fill('admin123')
> 7  |   await page.getByRole('button', { name: /log in/i }).click()
     |                                                       ^ Error: locator.click: Test ended.
  8  |   await expect(page.getByText(/hi,\s*admin/i)).toBeVisible()
  9  | 
  10 |   await page.goto('/')
  11 |   await page.getByRole('link', { name: /tandoori twist/i }).click()
  12 | 
  13 |   // Menu items are added via a small "Add" button that opens a customize modal,
  14 |   // then confirmed inside the modal. Filter down to the specific menu row
  15 |   // (its own div contains both the item name and its price).
  16 |   const menuRow = page
  17 |     .locator('div')
  18 |     .filter({ hasText: 'Tandoori Chicken (Half)' })
  19 |     .filter({ hasText: 'Rs. 500' })
  20 |     .last()
  21 |   await menuRow.getByRole('button', { name: 'Add' }).click()
  22 |   await page.getByRole('button', { name: /add to cart/i }).click()
  23 | 
  24 |   await page.getByRole('link', { name: /cart/i }).click()
  25 |   await page.getByRole('button', { name: /proceed to checkout/i }).click()
  26 | 
  27 |   await page.getByPlaceholder('House #, Street, Area').fill('Wapda Town, Lahore')
  28 |   await page.getByPlaceholder('Full name').fill('Test User')
  29 |   await page.getByPlaceholder('4242 4242 4242 4242').fill('4242424242424242')
  30 |   await page.getByPlaceholder('MM/YY').fill('1133')
  31 |   await page.getByPlaceholder('123').fill('123')
  32 | 
  33 |   await page.getByRole('button', { name: /pay rs\..*place order/i }).click()
  34 | 
  35 |   await expect(page).toHaveURL(/order-confirmation/)
  36 | })
```