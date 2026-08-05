/**
 * UX34 (2026-08-05) — ruttbyten ska synas i <title> och höras i live-regionen.
 *
 * Testerna kontrollerar det som var trasigt: att titeln faktiskt ändras per
 * rutt (den var identisk på alla 45 sidor), att annonseringen sker vid byte —
 * men INTE vid första renderingen, där skärmläsaren redan läser titeln.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import { RouteAnnouncer } from './RouteAnnouncer'

function Harness({ start }: { start: string }) {
  return (
    <MemoryRouter initialEntries={[start]}>
      <RouteAnnouncer />
      <Link to="/cv">till cv</Link>
      <Link to="/diary">till dagbok</Link>
      <Routes>
        <Route path="*" element={<div>sida</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  document.title = ''
})

describe('RouteAnnouncer', () => {
  it('sätter dokumenttiteln efter mönstret <sidnamn> — Jobin', () => {
    render(<Harness start="/diary" />)
    expect(document.title).toBe('Dagbok — Jobin')
  })

  it('ger olika sidor olika titlar', () => {
    const { unmount } = render(<Harness start="/diary" />)
    const forsta = document.title
    unmount()
    render(<Harness start="/cv" />)
    expect(document.title).not.toBe(forsta)
    expect(document.title).toBe('CV — Jobin')
  })

  it('uppdaterar titeln vid ruttbyte', () => {
    render(<Harness start="/diary" />)
    fireEvent.click(screen.getByText('till cv'))
    expect(document.title).toBe('CV — Jobin')
  })

  it('annonserar inte vid första renderingen', () => {
    render(<Harness start="/diary" />)
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('annonserar sidan i en visuellt dold polite-region vid ruttbyte', () => {
    render(<Harness start="/diary" />)
    fireEvent.click(screen.getByText('till cv'))

    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveClass('sr-only')
    expect(region.textContent).toBe('Du är nu på CV')
  })

  it('annonserar inte om man klickar på länken till samma sida igen', () => {
    render(<Harness start="/cv" />)
    fireEvent.click(screen.getByText('till cv'))
    expect(screen.getByRole('status').textContent).toBe('')
  })
})
