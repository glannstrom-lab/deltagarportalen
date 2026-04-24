import { test, expect, TEST_USER, waitForAppReady } from './fixtures'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/#/login')
      await waitForAppReady(page)

      // Check page title and heading
      await expect(page.getByRole('heading', { name: /välkommen tillbaka/i })).toBeVisible()

      // Check form elements - use more specific locators
      await expect(page.locator('input#email')).toBeVisible()
      await expect(page.locator('input#password')).toBeVisible()
      await expect(page.getByRole('button', { name: /^logga in$/i })).toBeVisible()

      // Check for register link
      await expect(page.getByRole('link', { name: /skapa ett konto/i })).toBeVisible()
    })

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.goto('/#/login')
      await waitForAppReady(page)

      // Submit empty form
      await page.getByRole('button', { name: /^logga in$/i }).click()

      // Should show validation errors - use first alert
      const alerts = page.getByRole('alert').first()
      await expect(alerts).toBeVisible()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/#/login')
      await waitForAppReady(page)

      // Fill invalid email
      await page.locator('input#email').fill('notanemail')
      await page.locator('input#password').fill('password123')
      await page.locator('input#password').blur()

      // Tab away to trigger validation
      await page.getByRole('button', { name: /^logga in$/i }).click()

      // Should show email validation error
      await expect(page.getByRole('alert').first()).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/#/login')
      await waitForAppReady(page)

      const passwordInput = page.locator('input#password')
      const toggleButton = page.getByRole('button', { name: /visa lösenord|dölj lösenord/i })

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle to show password
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')

      // Click toggle to hide password again
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/#/login')
      await waitForAppReady(page)

      // Fill with invalid credentials
      await page.locator('input#email').fill('invalid@example.com')
      await page.locator('input#password').fill('wrongpassword')
      await page.getByRole('button', { name: /^logga in$/i }).click()

      // Should show error message
      await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('alert').first()).toContainText(/fel|invalid|ogiltigt/i)
    })

    test('should redirect authenticated users to dashboard', async ({ page, auth }) => {
      // Skip if no test credentials configured
      test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')

      await auth.login(TEST_USER.email, TEST_USER.password)

      // Should be on dashboard
      await expect(page).toHaveURL('/')

      // Visit login page should redirect back
      await page.goto('/#/login')
      await expect(page).toHaveURL('/')
    })

    test('should be accessible', async ({ page }) => {
      await page.goto('/#/login')
      await waitForAppReady(page)

      // Check for proper form labels
      const emailInput = page.locator('input#email')
      const passwordInput = page.locator('input#password')

      // Inputs should have associated labels
      await expect(emailInput).toHaveAttribute('id')
      await expect(passwordInput).toHaveAttribute('id')

      // Check for autocomplete attributes
      await expect(emailInput).toHaveAttribute('autocomplete', 'email')
      await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')

      // Check button is focusable
      const submitButton = page.getByRole('button', { name: /^logga in$/i })
      await submitButton.focus()
      await expect(submitButton).toBeFocused()
    })

    test('should work with keyboard navigation', async ({ page }) => {
      await page.goto('/#/login')
      await waitForAppReady(page)

      // Focus the email input
      await page.locator('input#email').focus()
      await expect(page.locator('input#email')).toBeFocused()

      // Tab to password
      await page.keyboard.press('Tab')
      await expect(page.locator('input#password')).toBeFocused()

      // Tab to show password button
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: /visa lösenord/i })).toBeFocused()

      // Tab to submit button
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: /^logga in$/i })).toBeFocused()
    })
  })

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/#/register')
      await waitForAppReady(page)

      // Check form elements
      await expect(page.locator('input#firstName')).toBeVisible()
      await expect(page.locator('input#lastName')).toBeVisible()
      await expect(page.locator('input#email')).toBeVisible()
      await expect(page.locator('input#password')).toBeVisible()
      await expect(page.getByRole('button', { name: /^registrera$/i })).toBeVisible()
    })

    test('should have link to login', async ({ page }) => {
      await page.goto('/#/register')
      await waitForAppReady(page)

      // Dismiss cookie consent if present
      const acceptCookies = page.getByRole('button', { name: /acceptera|endast nödvändiga/i })
      if (await acceptCookies.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptCookies.first().click()
      }

      const loginLink = page.getByText('Logga in här')
      await expect(loginLink).toBeVisible()

      await loginLink.click()
      await expect(page).toHaveURL(/\/#\/login/)
    })
  })

  test.describe('Logout', () => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')

    test('should logout successfully', async ({ page, auth }) => {
      // Login first
      await auth.login(TEST_USER.email, TEST_USER.password)
      await expect(page).toHaveURL('/')

      // Logout
      await auth.logout()

      // Should be on login page or landing
      await expect(page).toHaveURL(/(\/#\/login|^\/$)/)
    })
  })
})

test.describe('Protected Routes', () => {
  test('should show landing page when not authenticated', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = [
      '/#/cv',
      '/#/job-search',
      '/#/profile',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await waitForAppReady(page)
      // Should show landing page content (not the protected content)
      await expect(page.getByText(/stärk dina deltagare/i)).toBeVisible()
    }
  })
})
