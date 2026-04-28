import { describe, it } from 'vitest'
import CvWidget from './CvWidget'

/**
 * HUB-01 widget data wiring — Wave 0 stub (Plan 03 fills implementation).
 */
describe('CvWidget — data wiring', () => {
  it.skip('renders milestone label from JobsokDataContext data.cv.completion_pct (HUB-01)', () => {
    // Plan 03 replaces MOCK_CV with context read
    void CvWidget
  })

  it.skip('shows empty state when context returns no cv (A11Y-03 milestone framing — no raw %)', () => {
    // Empty state per UI-SPEC: "Ditt CV väntar"
  })
})
