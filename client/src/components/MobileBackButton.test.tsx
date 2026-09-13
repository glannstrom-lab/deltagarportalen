/**
 * Skav (persona 2026-09-12): den flytande "Gå tillbaka"-knappen låg bildmässigt
 * ovanpå Jobin-loggan i `MobileTopBar` (`Layout.tsx`) på mobil. Mätt i prod:
 * knappens box tog x:12–60px vid `left:12px` (44px bredd + 1px border ×2 +
 * avrundning), och loggan börjar exakt på x:60px — headerns `pl-[60px]`, satt
 * just för att göra plats åt knappen. Noll marginal kvar, så `shadow-lg`s eget
 * blur målade rakt över loggan (se skärmdumparna i granskningen).
 *
 * `Layout.tsx` ägs inte av den här ändringen (utanför uppdragets fillista),
 * så fixen sitter i knappen själv: kortare skugga + två pixlar längre in.
 * De här testerna vaktar att clearance-marginalen inte tyst krymper tillbaka.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('./MobileOptimizer', () => ({ useMobileOptimizer: () => ({ isMobile: true }) }))
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

  it('visas på en undersida, med marginal kvar till loggan (headerns pl-[60px])', () => {
    // Mutation: sätt `left` tillbaka till '12px' → knappens högerkant (12+44+
    // border ≈ 60px) rör headerns logga vid x:60px igen → RÖD.
    rita('/min-vecka')
    const knapp = screen.getByRole('button', { name: /gå tillbaka/i })
    expect(knapp).toHaveStyle({ left: 'max(8px, env(safe-area-inset-left))' })
    // 8px vänsteroffset + 44px bredd = 52px högerkant, minst 8px marginal
    // kvar innan headerns logga (x:60px).
    expect(knapp.className).toContain('w-11')
    // classList (exakta token) i stället för en substräng — annars matchar
    // `hover:shadow-lg` (avsiktligt kvar) samma kontroll.
    expect(knapp.classList.contains('shadow-md')).toBe(true)
    expect(knapp.classList.contains('shadow-lg')).toBe(false)
  })
})
