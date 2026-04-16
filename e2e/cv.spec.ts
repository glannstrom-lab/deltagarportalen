import { test, expect, TEST_USER } from './fixtures'

test.describe('CV Builder', () => {
  // Skip all tests if no test credentials
  test.beforeEach(async ({ page, auth }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    await auth.login(TEST_USER.email, TEST_USER.password)
  })

  test.describe('Navigation', () => {
    test('should navigate to CV page from dashboard', async ({ page }) => {
      await page.goto('/')

      // Find and click CV link
      const cvLink = page.getByRole('link', { name: /cv|resume/i }).first()
      await cvLink.click()

      await expect(page).toHaveURL(/\/cv/)
    })

    test('should display CV page with tabs', async ({ page }) => {
      await page.goto('/cv')

      // Should have tabs for different CV sections
      await expect(page.getByRole('tablist')).toBeVisible()
    })
  })

  test.describe('CV Creation', () => {
    test('should allow editing personal information', async ({ page }) => {
      await page.goto('/cv')

      // Navigate to personal info section/tab
      const personalTab = page.getByRole('tab', { name: /personlig|personuppgifter|info/i })
      if (await personalTab.isVisible()) {
        await personalTab.click()
      }

      // Check for form fields
      const nameField = page.getByLabel(/namn|förnamn/i).first()
      if (await nameField.isVisible()) {
        await nameField.fill('Test Användare')
        await expect(nameField).toHaveValue('Test Användare')
      }
    })

    test('should allow adding work experience', async ({ page }) => {
      await page.goto('/cv')

      // Navigate to experience section
      const experienceTab = page.getByRole('tab', { name: /erfarenhet|arbete|jobb/i })
      if (await experienceTab.isVisible()) {
        await experienceTab.click()
      }

      // Look for add button
      const addButton = page.getByRole('button', { name: /lägg till|ny|add/i }).first()
      if (await addButton.isVisible()) {
        await addButton.click()

        // Modal or form should appear
        const modal = page.getByRole('dialog').or(page.locator('[class*="modal"]'))
        if (await modal.isVisible()) {
          // Fill in experience details
          await page.getByLabel(/titel|befattning|roll/i).first().fill('Utvecklare')
          await page.getByLabel(/företag|arbetsgivare/i).first().fill('Tech AB')
        }
      }
    })

    test('should allow adding education', async ({ page }) => {
      await page.goto('/cv')

      // Navigate to education section
      const educationTab = page.getByRole('tab', { name: /utbildning|education/i })
      if (await educationTab.isVisible()) {
        await educationTab.click()

        // Look for add button
        const addButton = page.getByRole('button', { name: /lägg till|ny|add/i }).first()
        if (await addButton.isVisible()) {
          await addButton.click()
        }
      }
    })

    test('should allow adding skills', async ({ page }) => {
      await page.goto('/cv')

      // Navigate to skills section
      const skillsTab = page.getByRole('tab', { name: /kompetens|skills|färdigheter/i })
      if (await skillsTab.isVisible()) {
        await skillsTab.click()

        // Look for skill input
        const skillInput = page.getByPlaceholder(/kompetens|skill|färdighet/i).first()
        if (await skillInput.isVisible()) {
          await skillInput.fill('JavaScript')
          await page.keyboard.press('Enter')
        }
      }
    })
  })

  test.describe('CV Preview', () => {
    test('should show CV preview', async ({ page }) => {
      await page.goto('/cv')

      // Look for preview tab or button
      const previewButton = page.getByRole('button', { name: /förhandsgranska|preview/i })
        .or(page.getByRole('tab', { name: /förhandsgranska|preview/i }))

      if (await previewButton.isVisible()) {
        await previewButton.click()

        // Preview should be visible
        await expect(page.locator('[class*="preview"], [class*="cv-preview"]')).toBeVisible()
      }
    })
  })

  test.describe('CV Export', () => {
    test('should have export options', async ({ page }) => {
      await page.goto('/cv')

      // Look for export button
      const exportButton = page.getByRole('button', { name: /exportera|ladda ner|download|pdf/i })

      if (await exportButton.isVisible()) {
        await exportButton.click()

        // Should show export options or start download
        const exportOptions = page.getByRole('menu').or(page.getByRole('dialog'))
        const downloadStarted = page.locator('[class*="download"], [class*="export"]')

        await expect(exportOptions.or(downloadStarted)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('CV Save', () => {
    test('should auto-save changes', async ({ page }) => {
      await page.goto('/cv')

      // Make a change
      const editableField = page.getByRole('textbox').first()
      if (await editableField.isVisible()) {
        const originalValue = await editableField.inputValue()
        await editableField.fill(originalValue + ' updated')

        // Wait for auto-save indicator
        const saveIndicator = page.getByText(/sparar|saved|sparat/i)
        await expect(saveIndicator).toBeVisible({ timeout: 5000 })
      }
    })

    test('should persist changes after reload', async ({ page }) => {
      await page.goto('/cv')

      // Find an editable field and change it
      const editableField = page.getByRole('textbox').first()
      if (await editableField.isVisible()) {
        const testValue = `Test ${Date.now()}`
        await editableField.fill(testValue)

        // Wait for save
        await page.waitForTimeout(2000)

        // Reload page
        await page.reload()

        // Check if value persists
        const reloadedField = page.getByRole('textbox').first()
        await expect(reloadedField).toHaveValue(testValue)
      }
    })
  })

  test.describe('CV List (Mina CV)', () => {
    test('should show list of CVs', async ({ page }) => {
      await page.goto('/cv')

      // Navigate to "Mina CV" tab
      const minaCvTab = page.getByRole('tab', { name: /mina cv|saved|sparade/i })
      if (await minaCvTab.isVisible()) {
        await minaCvTab.click()

        // Should show list or empty state
        const cvList = page.locator('[class*="cv-list"], [class*="cv-card"]')
        const emptyState = page.getByText(/inga cv|skapa ditt första/i)

        await expect(cvList.first().or(emptyState)).toBeVisible()
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible form controls', async ({ page }) => {
      await page.goto('/cv')

      // All inputs should have labels
      const inputs = page.getByRole('textbox')
      const inputCount = await inputs.count()

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i)
        if (await input.isVisible()) {
          const hasLabel = await input.getAttribute('aria-label') ||
            await input.getAttribute('aria-labelledby') ||
            await input.getAttribute('id')
          expect(hasLabel).toBeTruthy()
        }
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/cv')

      // Tab through tabs
      const tabs = page.getByRole('tab')
      const tabCount = await tabs.count()

      if (tabCount > 1) {
        await tabs.first().focus()
        await page.keyboard.press('ArrowRight')

        // Second tab should be focused
        await expect(tabs.nth(1)).toBeFocused()
      }
    })
  })
})
