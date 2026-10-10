/**
 * Tillbakaknappen sitter i sidhuvudet sedan 2026-10-10. Som flytande
 * `position: fixed`-knapp låg den först ovanpå Jobin-loggan (persona
 * 2026-09-12) och sedan ovanpå demobannerns text (mobilgenomgången
 * 2026-10-10). Testerna vaktar att den inte blir flytande igen.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('./layout/navigation', () => ({
  navHubs: [{ path: '/oversikt' }, { path: '/jobb' }, { path: '/karriar' }, { path: '/resurser' }, { path: '/min-vardag' }],
}))

import { MobileBackButton } from './MobileBackButton'

function rita(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MobileBackButton />
    </MemoryRouter>
  )
}

describe('MobileBackButton', () => {
  it('döljs på hub-rotsidor', () => {
    rita('/oversikt')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('visas på en undersida som en knapp i flödet, inte flytande', () => {
    // Mutation: lägg tillbaka `fixed` eller `mobile-back-button` (som är
    // position: fixed i mobile.css) → RÖD.
    rita('/min-vecka')
    const knapp = screen.getByRole('button', { name: /gå tillbaka/i })
    expect(knapp.classList.contains('fixed')).toBe(false)
    expect(knapp.classList.contains('mobile-back-button')).toBe(false)
    expect(knapp.getAttribute('style')).toBeNull()
    // 44 px tryckyta (WCAG 2.5.5).
    expect(knapp.classList.contains('w-11')).toBe(true)
    expect(knapp.classList.contains('h-11')).toBe(true)
  })
})
