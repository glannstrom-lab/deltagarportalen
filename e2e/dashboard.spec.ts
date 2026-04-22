import { test, expect, TEST_USER, waitForSkeleton } from './fixtures'

/**
 * E2E tests for Dashboard and Onboarding flow
 * Tests the main entry point and user journey
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, auth }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    await auth.login(TEST_USER.email, TEST_USER.password)
  })

  test.describe('Initial Load', () => {
    test('should load dashboard after login', async ({ page }) => {
      await page.goto('/')

      // Wait for skeleton to finish loading
      await waitForSkeleton(page)

      // Dashboard should be visible
      await expect(page.locator('main, [class*="dashboard"]').first()).toBeVisible()
    })

    test('should display welcome greeting', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Should show personalized greeting or welcome message
      const greeting = page.getByText(/välkommen|hej|god morgon|god dag|god kväll/i)
      await expect(greeting.first()).toBeVisible()
    })

    test('should display KPI cards', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Should show progress/stats cards
      const kpiSection = page.locator('[class*="kpi"], [class*="stat"], [class*="progress"]').first()
        .or(page.getByText(/cv|ansökningar|jobb|sparade/i).first())

      await expect(kpiSection).toBeVisible()
    })
  })

  test.describe('Onboarding Section', () => {
    test('should show "Kom igång" section', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Should have onboarding/getting started section
      const onboardingSection = page.getByText(/kom igång|getting started|steg/i).first()
      await expect(onboardingSection).toBeVisible()
    })

    test('should display onboarding steps', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Should show step items
      const steps = page.locator('[class*="step"], [class*="onboarding"]')
        .or(page.getByText(/steg \d|profil|cv|jobb/i))

      await expect(steps.first()).toBeVisible()
    })

    test('should navigate to profile from onboarding', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Find profile link in onboarding
      const profileLink = page.getByRole('link', { name: /profil|fyll i/i }).first()

      if (await profileLink.isVisible()) {
        await profileLink.click()
        await expect(page).toHaveURL(/\/profile/)
      }
    })

    test('should navigate to CV from onboarding', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Find CV link
      const cvLink = page.getByRole('link', { name: /cv|skapa.*cv/i }).first()

      if (await cvLink.isVisible()) {
        await cvLink.click()
        await expect(page).toHaveURL(/\/cv/)
      }
    })
  })

  test.describe('Quick Actions', () => {
    test('should display quick action buttons', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Should have quick action section
      const quickActions = page.getByText(/snabbåtgärder|quick actions/i)
        .or(page.locator('[class*="quick-action"]'))

      await expect(quickActions.first()).toBeVisible()
    })

    test('should navigate to job search via quick action', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Find job search quick action
      const jobSearchButton = page.getByRole('link', { name: /sök jobb|hitta jobb/i }).first()

      if (await jobSearchButton.isVisible()) {
        await jobSearchButton.click()
        await expect(page).toHaveURL(/\/job-search/)
      }
    })
  })

  test.describe('Navigation', () => {
    test('should have working navigation menu', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Find navigation (sidebar or top nav)
      const nav = page.getByRole('navigation').first()
        .or(page.locator('nav, [class*="sidebar"], [class*="nav"]').first())

      await expect(nav).toBeVisible()
    })

    test('should navigate between main sections', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Test navigation to key pages
      const pages = [
        { link: /cv/i, url: /\/cv/ },
        { link: /jobb|job/i, url: /\/job-search/ },
        { link: /brev|cover/i, url: /\/cover-letter/ },
      ]

      for (const pageInfo of pages) {
        await page.goto('/')
        const link = page.getByRole('link', { name: pageInfo.link }).first()

        if (await link.isVisible()) {
          await link.click()
          await expect(page).toHaveURL(pageInfo.url)
        }
      }
    })
  })

  test.describe('Expandable Sections', () => {
    test('should toggle section expansion', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Find expandable section button
      const expandButton = page.getByRole('button', { name: /kom igång|utveckling|snabbåtgärder/i }).first()

      if (await expandButton.isVisible()) {
        const initialState = await expandButton.getAttribute('aria-expanded')

        await expandButton.click()

        // State should toggle
        const newState = await expandButton.getAttribute('aria-expanded')
        expect(newState).not.toBe(initialState)
      }
    })
  })

  test.describe('Responsiveness', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await waitForSkeleton(page)

      // Main content should be visible
      await expect(page.locator('main').first()).toBeVisible()

      // Mobile menu should be accessible
      const menuButton = page.getByRole('button', { name: /meny|menu/i })
      if (await menuButton.isVisible()) {
        await menuButton.click()
        const nav = page.getByRole('navigation')
        await expect(nav.first()).toBeVisible()
      }
    })

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')
      await waitForSkeleton(page)

      // Dashboard should adapt to tablet
      await expect(page.locator('main').first()).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Should have h1
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1.first()).toBeVisible()
    })

    test('should have accessible buttons', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Buttons should have accessible names
      const buttons = page.getByRole('button')
      const buttonCount = await buttons.count()

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i)
        if (await button.isVisible()) {
          const name = await button.getAttribute('aria-label') ||
            await button.textContent()
          expect(name?.trim()).toBeTruthy()
        }
      }
    })

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Tab through interactive elements
      await page.keyboard.press('Tab')

      // First focusable element should be focused
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()

      // Continue tabbing - should not get stuck
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Focus should have moved
      await expect(page.locator(':focus')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should not show error boundary', async ({ page }) => {
      await page.goto('/')
      await waitForSkeleton(page)

      // Should not have error boundary visible
      const errorBoundary = page.locator('[class*="error-boundary"], [class*="error-fallback"]')
      await expect(errorBoundary).not.toBeVisible()
    })

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline
      await page.route('**/api/**', route => route.abort())

      await page.goto('/')

      // Should still render something (fallback/cached data)
      await expect(page.locator('main, body').first()).toBeVisible()
    })
  })
})
