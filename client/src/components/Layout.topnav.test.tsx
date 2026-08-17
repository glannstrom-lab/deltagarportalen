/**
 * Flaggan `VITE_TOPNAV_ENABLED` styr faktiskt layouten. (Steg 2, 2026-08-17)
 *
 * Navigationen är chrome — den ritas på varje skärm, så steg 2 träffar alla 25
 * sidor samtidigt. Det går inte att göra sida för sida. Hela säkerheten i den
 * ändringen vilar därför på två egenskaper, och båda testas här:
 *
 *  1. **Av som default.** Är den inte det når ombyggnaden prod i samma sekund
 *     som den pushas, och "reversibel med en miljövariabel" är en illusion.
 *  2. **Att den byter gren.** Att källkoden innehåller en `if` bevisar inte att
 *     grenen tas — det bevisar bara att någon skrev en `if`.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Måste ligga före importen av Layout: vi.mock hissas, men modulen läses vid
// import och flaggan är ett konstant uttryck i features.ts.
const flaggan = vi.hoisted(() => ({ pa: false }))

vi.mock('@/config/features', async (orig) => {
  const faktisk = await orig<typeof import('@/config/features')>()
  return { ...faktisk, isTopNavEnabled: () => flaggan.pa }
})

// Sidomenyn och toppnaven byts ut mot markörer. Vi testar Layouts VAL, inte
// deras innehåll — det har de egna tester för, och att rendera dem på riktigt
// hade dragit in halva appens datalager i ett layouttest.
vi.mock('./layout/Sidebar', () => ({ Sidebar: () => <div data-testid="sidomeny" /> }))
vi.mock('./layout/TopNav', () => ({
  default: () => <div data-testid="toppnav" />,
  SubNav: () => <div data-testid="undersidesrad" />,
  HubNav: () => <div data-testid="kategorirad" />,
}))
vi.mock('./layout/TopBar', () => ({ TopBar: () => <div data-testid="topbar" /> }))
vi.mock('./layout/HubBottomNav', () => ({ HubBottomNav: () => <div data-testid="bottennav" /> }))
vi.mock('./MobileOptimizer', () => ({ useMobileOptimizer: () => ({ isMobile: false }) }))

import Layout from './Layout'

afterEach(cleanup)
beforeEach(() => {
  flaggan.pa = false
})

function rendera() {
  return render(
    <MemoryRouter initialEntries={['/cv']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/cv" element={<div>innehåll</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('flaggan av — dagens navigation är orörd', () => {
  it('renderar sidomenyn', () => {
    rendera()
    expect(screen.getByTestId('sidomeny')).toBeTruthy()
  })

  it('renderar INTE toppnaven', () => {
    rendera()
    expect(screen.queryByTestId('toppnav')).toBeNull()
  })

  it('den riktiga flaggan är av utan miljövariabel', async () => {
    // Den faktiska modulen, inte mocken. Det här är egenskapen som gör att
    // ombyggnaden kan committas och pushas utan att nå en enda användare.
    const faktisk = await vi.importActual<typeof import('@/config/features')>('@/config/features')
    expect(faktisk.isTopNavEnabled()).toBe(false)
    expect(faktisk.MODULES.TOPNAV).toBe(false)
  })
})

describe('flaggan på — navigationen flyttar upp', () => {
  it('renderar toppnaven', () => {
    flaggan.pa = true
    rendera()
    expect(screen.getByTestId('toppnav')).toBeTruthy()
  })

  it('döljer sidomenyn, som annars bara upprepar den', () => {
    flaggan.pa = true
    rendera()
    expect(screen.queryByTestId('sidomeny')).toBeNull()
  })

  it('behåller TopBar — varumärke, sök och profil flyttar inte i steg 2', () => {
    flaggan.pa = true
    rendera()
    expect(screen.getByTestId('topbar')).toBeTruthy()
  })
})

describe('negativ kontroll — testet kan falla', () => {
  it('de två lägena ger olika utfall', () => {
    // Utan den här raden vore testerna ovan gröna även om Layout ignorerade
    // flaggan och alltid renderade samma sak.
    rendera()
    const avHarSidomeny = !!screen.queryByTestId('sidomeny')
    cleanup()
    flaggan.pa = true
    rendera()
    const paHarSidomeny = !!screen.queryByTestId('sidomeny')
    expect(avHarSidomeny).toBe(true)
    expect(paHarSidomeny).toBe(false)
  })
})
