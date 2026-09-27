/**
 * RK17/RR12 (rollspelet 2026-09-27): på mobil fick konsulenten deltagarens
 * bottennav (Söka jobb, Karriär, Din vardag) och deltagarens undersidesrad
 * (Börja här, Sök jobb, CV …) även under /consultant.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HubBottomNav } from './HubBottomNav'
import { SubNav } from './TopNav'
import { aktivKonsulentFlik } from './konsulentNav'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }),
}))

afterEach(cleanup)

function rendera(path: string, K: React.ComponentType) {
  return render(<MemoryRouter initialEntries={[path]}><K /></MemoryRouter>)
}

describe('RK17 — konsulentens bottennav', () => {
  it('under /consultant visas konsulentvyns flikar, inte deltagarens hubbar', () => {
    rendera('/consultant/participants/abc', HubBottomNav)
    const lankar = screen.getAllByRole('link')
    expect(lankar.map((l) => l.getAttribute('href'))).toEqual([
      '/consultant', '/consultant/participants', '/consultant/platser', '/consultant/analytics', '/consultant/communication',
    ])
    expect(screen.queryByText('Söka jobb')).toBeNull()
    expect(screen.queryByText('Min vardag')).toBeNull()
    // En deltagarsida hör till Deltagare.
    expect(screen.getByRole('link', { name: 'Deltagare' })).toHaveAttribute('aria-current', 'page')
  })

  it('utanför konsulentvyn är deltagarens fem hubbar kvar', () => {
    rendera('/cv', HubBottomNav)
    expect(screen.getByText('Söka jobb')).toBeInTheDocument()
  })

  it('Översikt är aktiv bara på /consultant exakt', () => {
    expect(aktivKonsulentFlik('/consultant')).toBe('overview')
    expect(aktivKonsulentFlik('/consultant/analytics')).toBe('analytics')
    expect(aktivKonsulentFlik('/consultant/settings')).toBeNull()
  })
})

describe('RK17 — deltagarens undersidesrad', () => {
  it('ritas inte i konsulentvyn', () => {
    const { container } = rendera('/consultant', SubNav)
    expect(container.querySelector('nav')).toBeNull()
  })
})
