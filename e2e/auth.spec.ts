import { test, expect, TEST_USER } from './fixtures'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login')

      // Check page title and heading
      await expect(page.getByRole('heading', { name: /välkommen tillbaka/i })).toBeVisible()

      // Check form elements
      await expect(page.getByLabel(/e-postadress/i)).toBeVisible()
      await expect(page.getByLabel(/lösenord/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /logga in/i })).toBeVisible()

      // Check for register link
      await expect(page.getByRole('link', { name: /skapa konto|registrera/i })).toBeVisible()
    })

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.goto('/login')

      // Submit empty form
      await page.getByRole('button', { name: /logga in/i }).click()

      // Should show validation errors
      const alerts = page.getByRole('alert')
      await expect(alerts).toBeVisible()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/login')

      // Fill invalid email
      await page.getByLabel(/e-postadress/i).fill('notanemail')
      await page.getByLabel(/lösenord/i).fill('password123')
      await page.getByLabel(/lösenord/i).blur()

      // Tab away to trigger validation
      await page.getByRole('button', { name: /logga in/i }).click()

      // Should show email validation error
      await expect(page.getByRole('alert')).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login')

      const passwordInput = page.getByLabel(/lösenord/i)
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
      await page.goto('/login')

      // Fill with invalid credentials
      await page.getByLabel(/e-postadress/i).fill('invalid@example.com')
      await page.getByLabel(/lösenord/i).fill('wrongpassword')
      await page.getByRole('button', { name: /logga in/i }).click()

      // Should show error message
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('alert')).toContainText(/fel|invalid|ogiltigt/i)
    })

    test('should redirect authenticated users to dashboard', async ({ page, auth }) => {
      // Skip if no test credentials configured
      test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')

      await auth.login(TEST_USER.email, TEST_USER.password)

      // Should be on dashboard
      await expect(page).toHaveURL('/')

      // Visit login page should redirect back
      await page.goto('/login')
      await expect(page).toHaveURL('/')
    })

    test('should be accessible', async ({ page }) => {
      await page.goto('/login')

      // Check for proper form labels
      const emailInput = page.getByLabel(/e-postadress/i)
      const passwordInput = page.getByLabel(/lösenord/i)

      // Inputs should have associated labels
      await expect(emailInput).toHaveAttribute('id')
      await expect(passwordInput).toHaveAttribute('id')

      // Check for autocomplete attributes
      await expect(emailInput).toHaveAttribute('autocomplete', 'email')
      await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')

      // Check button is focusable
      const submitButton = page.getByRole('button', { name: /logga in/i })
      await submitButton.focus()
      await expect(submitButton).toBeFocused()
    })

    test('should work with keyboard navigation', async ({ page }) => {
      await page.goto('/login')

      // Tab through form
      await page.keyboard.press('Tab') // Focus email
      await expect(page.getByLabel(/e-postadress/i)).toBeFocused()

      await page.keyboard.press('Tab') // Focus password
      await expect(page.getByLabel(/lösenord/i)).toBeFocused()

      await page.keyboard.press('Tab') // Focus show password button
      await page.keyboard.press('Tab') // Focus submit button

      // Submit with Enter
      await page.keyboard.type('test@example.com')
      await page.keyboard.press('Tab')
      await page.keyboard.type('password123')
      await page.keyboard.press('Enter')

      // Should attempt login (will fail but form submitted)
      await expect(page.getByRole('button', { name: /loggar in/i })).toBeVisible()
    })
  })

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register')

      // Check form elements
      await expect(page.getByLabel(/förnamn/i)).toBeVisible()
      await expect(page.getByLabel(/efternamn/i)).toBeVisible()
      await expect(page.getByLabel(/e-postadress/i)).toBeVisible()
      await expect(page.getByLabel(/^lösenord$/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /skapa konto|registrera/i })).toBeVisible()
    })

    test('should have link to login', async ({ page }) => {
      await page.goto('/register')

      const loginLink = page.getByRole('link', { name: /logga in/i })
      await expect(loginLink).toBeVisible()

      await loginLink.click()
      await expect(page).toHaveURL('/login')
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
      await expect(page).toHaveURL(/\/(login)?$/)
    })
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = [
      '/cv',
      '/job-search',
      '/profile',
      '/cover-letter',
      '/diary',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      // Should redirect to landing or login
      await expect(page).toHaveURL(/^\/$|\/login/)
    }
  })
})
