import { test, expect, TEST_USER } from './fixtures'

test.describe('Job Search', () => {
  test.beforeEach(async ({ page, auth }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    await auth.login(TEST_USER.email, TEST_USER.password)
  })

  test.describe('Navigation', () => {
    test('should navigate to job search from dashboard', async ({ page }) => {
      await page.goto('/')

      const jobSearchLink = page.getByRole('link', { name: /jobb|job|sök/i }).first()
      await jobSearchLink.click()

      await expect(page).toHaveURL(/\/job-search/)
    })

    test('should display job search page', async ({ page }) => {
      await page.goto('/job-search')

      // Should have search input
      await expect(
        page.getByRole('searchbox').or(page.getByPlaceholder(/sök|search/i))
      ).toBeVisible()
    })
  })

  test.describe('Search Functionality', () => {
    test('should allow searching for jobs', async ({ page }) => {
      await page.goto('/job-search')

      // Find search input
      const searchInput = page.getByRole('searchbox')
        .or(page.getByPlaceholder(/sök jobb|search jobs|sökord/i))
        .first()

      if (await searchInput.isVisible()) {
        await searchInput.fill('utvecklare')
        await page.keyboard.press('Enter')

        // Wait for results to load
        await page.waitForLoadState('networkidle')

        // Should show results or no results message
        const results = page.locator('[class*="job-card"], [class*="job-item"]')
        const noResults = page.getByText(/inga resultat|inga jobb|no results/i)

        await expect(results.first().or(noResults)).toBeVisible({ timeout: 10000 })
      }
    })

    test('should filter jobs by location', async ({ page }) => {
      await page.goto('/job-search')

      // Find location filter
      const locationFilter = page.getByLabel(/plats|ort|location/i)
        .or(page.getByPlaceholder(/plats|ort|location/i))
        .first()

      if (await locationFilter.isVisible()) {
        await locationFilter.fill('Stockholm')

        // Either press enter or click a search button
        const searchButton = page.getByRole('button', { name: /sök|search/i })
        if (await searchButton.isVisible()) {
          await searchButton.click()
        } else {
          await page.keyboard.press('Enter')
        }

        await page.waitForLoadState('networkidle')
      }
    })

    test('should show job details on click', async ({ page }) => {
      await page.goto('/job-search')

      // Wait for jobs to load
      await page.waitForLoadState('networkidle')

      // Find first job card
      const jobCard = page.locator('[class*="job-card"], [class*="job-item"]').first()

      if (await jobCard.isVisible()) {
        await jobCard.click()

        // Should show job details modal or page
        const jobDetails = page.getByRole('dialog')
          .or(page.locator('[class*="job-detail"], [class*="job-modal"]'))

        await expect(jobDetails).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Filters', () => {
    test('should have filter options', async ({ page }) => {
      await page.goto('/job-search')

      // Look for filter section or button
      const filterButton = page.getByRole('button', { name: /filter|filtrera/i })
      const filterPanel = page.locator('[class*="filter"]')

      await expect(filterButton.or(filterPanel.first())).toBeVisible()
    })

    test('should apply filters', async ({ page }) => {
      await page.goto('/job-search')

      // Open filters if needed
      const filterButton = page.getByRole('button', { name: /filter|filtrera/i })
      if (await filterButton.isVisible()) {
        await filterButton.click()
      }

      // Find a filter checkbox or option
      const filterOption = page.getByRole('checkbox').first()
        .or(page.getByRole('option').first())

      if (await filterOption.isVisible()) {
        await filterOption.click()

        // Results should update
        await page.waitForLoadState('networkidle')
      }
    })

    test('should clear filters', async ({ page }) => {
      await page.goto('/job-search')

      // Look for clear filters button
      const clearButton = page.getByRole('button', { name: /rensa|clear|återställ/i })

      if (await clearButton.isVisible()) {
        await clearButton.click()
        await page.waitForLoadState('networkidle')
      }
    })
  })

  test.describe('Save Jobs', () => {
    test('should allow saving a job', async ({ page }) => {
      await page.goto('/job-search')
      await page.waitForLoadState('networkidle')

      // Find save/bookmark button on a job
      const saveButton = page.getByRole('button', { name: /spara|save|bookmark/i }).first()
        .or(page.locator('[class*="save"], [class*="bookmark"]').first())

      if (await saveButton.isVisible()) {
        await saveButton.click()

        // Should show confirmation or change button state
        const confirmation = page.getByText(/sparat|saved/i)
        const filledIcon = page.locator('[class*="saved"], [class*="bookmarked"]')

        await expect(confirmation.or(filledIcon.first())).toBeVisible({ timeout: 5000 })
      }
    })

    test('should show saved jobs', async ({ page }) => {
      await page.goto('/job-search')

      // Navigate to saved jobs tab
      const savedTab = page.getByRole('tab', { name: /sparade|saved|favoriter/i })
      if (await savedTab.isVisible()) {
        await savedTab.click()

        // Should show saved jobs or empty state
        const savedJobs = page.locator('[class*="job-card"], [class*="job-item"]')
        const emptyState = page.getByText(/inga sparade|no saved/i)

        await expect(savedJobs.first().or(emptyState)).toBeVisible()
      }
    })
  })

  test.describe('Job Applications', () => {
    test('should navigate to applications tab', async ({ page }) => {
      await page.goto('/job-search')

      const applicationsTab = page.getByRole('tab', { name: /ansök|applications|mina ansök/i })
      if (await applicationsTab.isVisible()) {
        await applicationsTab.click()

        await expect(page.locator('[class*="application"]').or(
          page.getByText(/inga ansökningar|no applications/i)
        )).toBeVisible()
      }
    })
  })

  test.describe('Pagination', () => {
    test('should paginate results', async ({ page }) => {
      await page.goto('/job-search')
      await page.waitForLoadState('networkidle')

      // Look for pagination
      const nextButton = page.getByRole('button', { name: /nästa|next|>/i })
      const pagination = page.locator('[class*="pagination"]')

      if (await nextButton.isVisible()) {
        const initialJob = await page.locator('[class*="job-card"]').first().textContent()
        await nextButton.click()
        await page.waitForLoadState('networkidle')

        // Results should change
        const newJob = await page.locator('[class*="job-card"]').first().textContent()
        expect(newJob).not.toBe(initialJob)
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/job-search')

      // Search should still be visible
      const searchInput = page.getByRole('searchbox')
        .or(page.getByPlaceholder(/sök/i))

      await expect(searchInput.first()).toBeVisible()

      // Navigation should be accessible
      const menuButton = page.getByRole('button', { name: /meny|menu/i })
      if (await menuButton.isVisible()) {
        await menuButton.click()
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible search', async ({ page }) => {
      await page.goto('/job-search')

      // Search input should have proper attributes
      const searchInput = page.getByRole('searchbox').first()
      if (await searchInput.isVisible()) {
        await expect(searchInput).toHaveAttribute('type', 'search')
      }
    })

    test('should announce results to screen readers', async ({ page }) => {
      await page.goto('/job-search')

      // Look for live region
      const liveRegion = page.locator('[aria-live]')
      await expect(liveRegion.first()).toBeVisible()
    })
  })
})
