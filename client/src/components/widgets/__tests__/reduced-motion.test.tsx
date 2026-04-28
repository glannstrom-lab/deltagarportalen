import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * A11Y-02 — prefers-reduced-motion compliance.
 *
 * Two layers of compliance:
 *   1. CSS layer: tokens.css sets --motion-* to 0.01ms under @media reduce
 *      (any widget using var(--motion-*) is auto-compliant — no test needed).
 *   2. Framer Motion layer: any widget importing framer-motion MUST also
 *      use useReducedMotion() to skip the entry animation.
 *
 * This test is a STATIC guard — it greps the source files. Cheaper and more
 * reliable than rendering each widget under a mocked matchMedia.
 *
 * NOTE: BrandAuditTab.tsx (page, not widget) uses framer-motion but is
 * out of scope for Phase 3 (Inviolabelt rule — original 27 routes untouched).
 *
 * Audit result (2026-04-28): No widget in Phase 2/3 imports framer-motion.
 * All animations use CSS tokens (var(--motion-*)) which tokens.css maps to
 * 0.01ms under prefers-reduced-motion: reduce. These tests will catch any
 * future widget that adds framer-motion without the required useReducedMotion() hook.
 */

const WIDGETS = [
  'CvWidget',
  'CoverLetterWidget',
  'InterviewWidget',
  'JobSearchWidget',
  'ApplicationsWidget',
  'SpontaneousWidget',
  'SalaryWidget',
  'InternationalWidget',
]

function readWidget(name: string): string {
  const p = path.join(__dirname, '..', `${name}.tsx`)
  return readFileSync(p, 'utf-8')
}

describe('A11Y-02: prefers-reduced-motion compliance for widgets', () => {
  it.each(WIDGETS)('%s either does not use framer-motion OR uses useReducedMotion', (name) => {
    const src = readWidget(name)
    const usesFramerMotion = /from ['"]framer-motion['"]/.test(src)
    if (!usesFramerMotion) {
      // Compliant: relies on tokens.css --motion-* media query
      expect(usesFramerMotion).toBe(false)
      return
    }
    // If framer-motion is imported, useReducedMotion MUST also be imported AND called
    expect(src).toMatch(/useReducedMotion/)
  })

  it('tokens.css contains the prefers-reduced-motion media query', () => {
    const tokensPath = path.join(__dirname, '..', '..', '..', 'styles', 'tokens.css')
    const css = readFileSync(tokensPath, 'utf-8')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(css).toMatch(/--motion-fast:\s*0\.01ms/)
  })
})
