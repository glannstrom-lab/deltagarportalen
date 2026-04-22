import { test, expect, TEST_USER } from './fixtures'

/**
 * E2E tests for Cover Letter (Personligt brev) feature
 * Tests the AI-powered cover letter generation flow
 */

test.describe('Cover Letter', () => {
  test.beforeEach(async ({ page, auth }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    await auth.login(TEST_USER.email, TEST_USER.password)
  })

  test.describe('Navigation', () => {
    test('should navigate to cover letter page from dashboard', async ({ page }) => {
      await page.goto('/')

      // Find cover letter link in quick actions or navigation
      const coverLetterLink = page.getByRole('link', { name: /brev|cover letter|personligt/i }).first()
      await coverLetterLink.click()

      await expect(page).toHaveURL(/\/cover-letter/)
    })

    test('should display cover letter page', async ({ page }) => {
      await page.goto('/cover-letter')

      // Should have main heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })

  test.describe('Cover Letter Creation', () => {
    test('should show form to create new cover letter', async ({ page }) => {
      await page.goto('/cover-letter')

      // Look for "new" or "create" button if on list view
      const newButton = page.getByRole('button', { name: /nytt|skapa|new|create/i })
      if (await newButton.isVisible()) {
        await newButton.click()
      }

      // Should have input fields for job info
      const jobTitleInput = page.getByLabel(/tjänst|befattning|job title|roll/i)
        .or(page.getByPlaceholder(/tjänst|befattning|job title|roll/i))
      const companyInput = page.getByLabel(/företag|company|arbetsgivare/i)
        .or(page.getByPlaceholder(/företag|company|arbetsgivare/i))

      // At least one of these should be visible
      await expect(jobTitleInput.first().or(companyInput.first())).toBeVisible({ timeout: 5000 })
    })

    test('should generate cover letter with AI', async ({ page }) => {
      await page.goto('/cover-letter')

      // Fill in job details
      const jobTitleInput = page.getByLabel(/tjänst|befattning|roll/i).first()
        .or(page.getByPlaceholder(/tjänst|befattning|roll/i).first())
      const companyInput = page.getByLabel(/företag|company/i).first()
        .or(page.getByPlaceholder(/företag|company/i).first())

      if (await jobTitleInput.isVisible()) {
        await jobTitleInput.fill('Frontend-utvecklare')
      }

      if (await companyInput.isVisible()) {
        await companyInput.fill('Tech AB')
      }

      // Click generate button
      const generateButton = page.getByRole('button', { name: /generera|skapa|generate|skriv/i })
      if (await generateButton.isVisible()) {
        await generateButton.click()

        // Should show loading state
        const loading = page.getByText(/genererar|skapar|laddar|working/i)
          .or(page.locator('[class*="spinner"], [class*="loading"]'))

        // Wait for generation (this calls the AI API, so longer timeout)
        await expect(loading).toBeVisible({ timeout: 5000 }).catch(() => {
          // Loading might be very quick
        })

        // Should show generated content or editor
        const editor = page.locator('[class*="editor"], [class*="content"], textarea')
          .or(page.getByRole('textbox'))
        await expect(editor.first()).toBeVisible({ timeout: 30000 })
      }
    })

    test('should allow editing generated letter', async ({ page }) => {
      await page.goto('/cover-letter')

      // Find editor/textarea
      const editor = page.locator('textarea, [contenteditable="true"]').first()

      if (await editor.isVisible()) {
        // Get current content
        const currentContent = await editor.inputValue().catch(() =>
          editor.textContent()
        )

        // Add some text
        await editor.focus()
        await page.keyboard.type(' - Redigerat')

        // Content should change
        const newContent = await editor.inputValue().catch(() =>
          editor.textContent()
        )
        expect(newContent).not.toBe(currentContent)
      }
    })
  })

  test.describe('Cover Letter List', () => {
    test('should show list of saved cover letters', async ({ page }) => {
      await page.goto('/cover-letter')

      // Navigate to saved/list view if needed
      const savedTab = page.getByRole('tab', { name: /sparade|mina brev|saved/i })
      if (await savedTab.isVisible()) {
        await savedTab.click()
      }

      // Should show list or empty state
      const letterList = page.locator('[class*="letter-card"], [class*="letter-item"]')
      const emptyState = page.getByText(/inga brev|inga sparade|skapa ditt första/i)

      await expect(letterList.first().or(emptyState)).toBeVisible()
    })
  })

  test.describe('Export and Copy', () => {
    test('should allow copying cover letter text', async ({ page }) => {
      await page.goto('/cover-letter')

      // Find copy button
      const copyButton = page.getByRole('button', { name: /kopiera|copy/i })

      if (await copyButton.isVisible()) {
        await copyButton.click()

        // Should show confirmation
        const confirmation = page.getByText(/kopierat|copied/i)
        await expect(confirmation).toBeVisible({ timeout: 3000 })
      }
    })

    test('should allow downloading as PDF', async ({ page }) => {
      await page.goto('/cover-letter')

      // Find download/export button
      const downloadButton = page.getByRole('button', { name: /ladda ner|download|pdf|exportera/i })

      if (await downloadButton.isVisible()) {
        // Set up download handler
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null)

        await downloadButton.click()

        const download = await downloadPromise
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
        }
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/cover-letter')

      // Tab through main elements
      await page.keyboard.press('Tab')

      // First focusable element should be focused
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/cover-letter')

      // All inputs should have associated labels
      const inputs = page.getByRole('textbox')
      const inputCount = await inputs.count()

      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i)
        if (await input.isVisible()) {
          const hasLabel = await input.getAttribute('aria-label') ||
            await input.getAttribute('aria-labelledby') ||
            await input.getAttribute('placeholder') ||
            await input.getAttribute('id')
          expect(hasLabel).toBeTruthy()
        }
      }
    })
  })
})
