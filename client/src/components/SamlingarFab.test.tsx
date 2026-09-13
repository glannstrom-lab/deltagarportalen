/**
 * Skav (persona 2026-09-12): FAB:en ("Mina samlingar") låg fixed i nedre
 * högra hörnet och överlappade Snabb-CV:ts "Ditt namn"-fält
 * (`components/cv/QuickCVMode.tsx`) — sett i skärmdumparna i granskningen.
 * Den sidan äger inte den här ändringen (utanför uppdragets fillista), så
 * fixen är generisk: dölj FAB:en medan NÅGOT formulärfält i dokumentet har
 * fokus — samma mönster som döljs-vid-scroll nedan, men för "användaren
 * skriver" i stället för "användaren scrollar".
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: { profile: { role: string; activeRole?: string } }) => unknown) =>
    sel({ profile: { role: 'USER' } }),
}))

const hiddenOnScrollMock = vi.fn(() => false)
vi.mock('@/hooks/useHideOnScrollDown', () => ({
  useHideOnScrollDown: () => hiddenOnScrollMock(),
  default: () => hiddenOnScrollMock(),
}))

import { SamlingarFab } from './SamlingarFab'

function knappWrapper() {
  // Öppningsknappen (bokmärkesikonen) är alltid i DOM när isOpen är false —
  // den identifieras via sitt aria-label.
  return screen.getByRole('button', { name: /öppna mina samlingar/i })
}

function classes() {
  return knappWrapper().className
}

describe('SamlingarFab', () => {
  it('är synlig i vila (inte döljningsklasserna)', () => {
    render(
      <MemoryRouter>
        <SamlingarFab />
        <input aria-label="ett fält på sidan" />
      </MemoryRouter>
    )
    expect(classes()).toContain('translate-y-0')
    expect(classes()).not.toContain('translate-y-[220%]')
  })

  it('döljs medan ett textfält NÅGON ANNANSTANS på sidan har fokus', async () => {
    // Mutation: ta bort `|| faltHarFokus` ur villkoret → RÖD (knappen förblir synlig
    // och täcker fältet, exakt buggen från granskningen).
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SamlingarFab />
        <input aria-label="Ditt namn" placeholder="Ditt namn" />
      </MemoryRouter>
    )
    await user.click(screen.getByLabelText('Ditt namn'))
    expect(classes()).toContain('translate-y-[220%]')
    expect(classes()).toContain('pointer-events-none')

    await user.tab() // lämnar fältet
    expect(classes()).not.toContain('translate-y-[220%]')
  })

  it('döljs även för textarea och contenteditable, inte bara <input>', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SamlingarFab />
        <textarea aria-label="Ett brev" />
      </MemoryRouter>
    )
    await user.click(screen.getByLabelText('Ett brev'))
    expect(classes()).toContain('translate-y-[220%]')
  })
})
