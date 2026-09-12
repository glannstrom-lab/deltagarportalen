/**
 * AG6 (2026-09-13): företagskontots skal.
 *
 * Företaget är en organisation (organizations.kind = 'arbetsgivare'); personen
 * är USER på profilnivå. Skalet får därför inte titta på profile.role — det
 * frågar `useForetagskonto`, via `ForetagskontoProvider` (samma provider som
 * App.tsx lägger runt Layout). Hooken mockas här; providern är den riktiga.
 *
 * Tre lägen vaktas, eftersom "laddning är inte tomhet":
 *   isLoading  → laddaren, varken deltagar- eller företagsmeny
 *   isEmployer → företagsmenyn, INGEN hubb (ingen länk till /jobb)
 *   annars     → deltagarens skal precis som före AG6
 *
 * Sidomeny, toppnav, TopBar, bottennav och notisklockan byts mot markörer:
 * vi testar Layouts VAL, inte deras innehåll (samma grepp som Layout.topnav).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Foretagskonto } from '@/hooks/useForetagskonto'

const konto = vi.hoisted(() => ({
  varde: { org: null, isLoading: false, isEmployer: false, error: null } as {
    org: { id: string; name: string } | null
    isLoading: boolean
    isEmployer: boolean
    error: unknown
  },
}))

vi.mock('@/hooks/useForetagskonto', () => ({
  useForetagskonto: () => konto.varde as unknown as Foretagskonto,
  FORETAGSKONTO_QUERY_KEY: ['foretagskonto'],
}))

vi.mock('./layout/Sidebar', () => ({ Sidebar: () => <div data-testid="sidomeny" /> }))
vi.mock('./layout/TopNav', () => ({
  default: () => <div data-testid="toppnav" />,
  SubNav: () => <div data-testid="undersidesrad" />,
  HubNav: () => <div data-testid="kategorirad" />,
}))
vi.mock('./layout/TopBar', () => ({ TopBar: () => <div data-testid="topbar" /> }))
vi.mock('./layout/HubBottomNav', () => ({ HubBottomNav: () => <div data-testid="bottennav" /> }))
vi.mock('./notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="bell" />,
  default: () => <div data-testid="bell" />,
}))
vi.mock('./CrisisSupport', () => ({ default: () => <div data-testid="kris" /> }))
vi.mock('@/i18n/lattSvenska', () => ({
  LATT_SVENSKA_KOD: 'sv-latt',
  arLattSvenska: () => false,
  sattLattSvenska: vi.fn(),
}))

const mobil = vi.hoisted(() => ({ pa: false }))
vi.mock('./MobileOptimizer', () => ({ useMobileOptimizer: () => ({ isMobile: mobil.pa }) }))

import Layout, { ForetagskontoProvider, MobileMainMenu, MobileTopBar } from './Layout'

afterEach(cleanup)
beforeEach(() => {
  mobil.pa = false
  konto.varde = { org: null, isLoading: false, isEmployer: false, error: null }
})

function somForetag() {
  konto.varde = {
    org: { id: 'o1', name: 'Glänne & Söner' },
    isLoading: false,
    isEmployer: true,
    error: null,
  }
}

function rendera(sokvag = '/foretag') {
  return render(
    <MemoryRouter initialEntries={[sokvag]}>
      <ForetagskontoProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/foretag/*" element={<div>företagsinnehåll</div>} />
            <Route path="/cv" element={<div>cv-innehåll</div>} />
          </Route>
        </Routes>
      </ForetagskontoProvider>
    </MemoryRouter>
  )
}

function hrefs(inom: ParentNode = document.body) {
  return [...inom.querySelectorAll('a')].map((a) => a.getAttribute('href'))
}

describe('företagskontot får sitt eget skal (AG6)', () => {
  it('isEmployer: företagsmenyn syns med alla sju länkar', () => {
    somForetag()
    rendera()
    expect(screen.getByTestId('foretagsskal')).toBeTruthy()
    const meny = screen.getByRole('navigation', { name: /företagsmeny/i })
    const lankar = hrefs(meny)
    expect(lankar).toEqual([
      '/foretag',
      '/foretag/platser',
      '/foretag/forslag',
      '/foretag/pagaende',
      '/foretag/meddelanden',
      '/foretag/stod',
      '/foretag/om',
    ])
    expect(screen.getByText('företagsinnehåll')).toBeTruthy()
  })

  it('isEmployer: ingen hubbmeny — varken sidomeny, toppnav, bottennav eller länk till /jobb', () => {
    somForetag()
    rendera()
    expect(screen.queryByTestId('sidomeny')).toBeNull()
    expect(screen.queryByTestId('topbar')).toBeNull()
    expect(screen.queryByTestId('undersidesrad')).toBeNull()
    expect(screen.queryByTestId('bottennav')).toBeNull()
    expect(hrefs()).not.toContain('/jobb')
    expect(hrefs()).not.toContain('/oversikt')
  })

  it('isEmployer: företagshuvudet visar företagsnamnet och rollen "Företag" i profilmenyn', () => {
    somForetag()
    rendera()
    expect(screen.getByTestId('foretag-topbar')).toBeTruthy()
    expect(screen.getByText('Glänne & Söner')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /min profil/i }))
    const meny = screen.getByRole('menu')
    expect(meny.textContent).toMatch(/Företag · Glänne & Söner/)
    expect(meny.textContent).not.toMatch(/Deltagare/)
  })

  it('isEmployer: aktiv länk markeras med aria-current, och /foretag matchar inte undersidorna', () => {
    somForetag()
    rendera('/foretag/forslag')
    const meny = screen.getByRole('navigation', { name: /företagsmeny/i })
    const aktiva = [...meny.querySelectorAll('a[aria-current="page"]')].map((a) => a.getAttribute('href'))
    expect(aktiva).toEqual(['/foretag/forslag'])
  })

  it('inte företag: deltagarens skal precis som förut — TopBar + undersidesrad, ingen företagsmeny', () => {
    rendera('/cv')
    expect(screen.getByTestId('topbar')).toBeTruthy()
    expect(screen.getByTestId('undersidesrad')).toBeTruthy()
    expect(screen.queryByTestId('foretagsskal')).toBeNull()
    expect(screen.queryByRole('navigation', { name: /företagsmeny/i })).toBeNull()
    expect(hrefs()).not.toContain('/foretag/platser')
    expect(screen.getByText('cv-innehåll')).toBeTruthy()
  })

  it('isLoading: laddaren, och INGEN av menyerna blinkar förbi', () => {
    konto.varde = { org: null, isLoading: true, isEmployer: false, error: null }
    rendera('/cv')
    expect(screen.getByTestId('skal-laddar')).toBeTruthy()
    expect(screen.queryByTestId('topbar')).toBeNull()
    expect(screen.queryByTestId('foretagsskal')).toBeNull()
    expect(screen.queryByText('cv-innehåll')).toBeNull()
  })
})

describe('negativ kontroll — testet kan falla', () => {
  it('de två lägena ger olika utfall för samma rutt', () => {
    rendera('/foretag')
    const deltagareHarTopbar = !!screen.queryByTestId('topbar')
    const deltagareHarForetagsmeny = !!screen.queryByTestId('foretagsmeny')
    cleanup()
    somForetag()
    rendera('/foretag')
    const foretagHarTopbar = !!screen.queryByTestId('topbar')
    const foretagHarForetagsmeny = !!screen.queryByTestId('foretagsmeny')
    expect(deltagareHarTopbar).toBe(true)
    expect(deltagareHarForetagsmeny).toBe(false)
    expect(foretagHarTopbar).toBe(false)
    expect(foretagHarForetagsmeny).toBe(true)
  })
})

describe('mobilen: samma regel i huvudmenyn och profilpanelen', () => {
  function renderaMeny() {
    return render(
      <MemoryRouter initialEntries={['/foretag']}>
        <ForetagskontoProvider>
          <MobileMainMenu isOpen onClose={() => {}} />
        </ForetagskontoProvider>
      </MemoryRouter>
    )
  }

  it('företag: bara företagslänkarna, inga hubbgrupper, ingen Hjälp-länk', () => {
    somForetag()
    renderaMeny()
    const meny = screen.getByRole('dialog', { name: /meny/i })
    expect(meny.querySelectorAll('[data-testid="mobilmeny-hubb"]').length).toBe(0)
    expect(hrefs(meny)).toContain('/foretag/forslag')
    expect(hrefs(meny)).not.toContain('/jobb')
    expect(hrefs(meny)).not.toContain('/help')
    // Inställningar och Logga ut ska finnas kvar
    expect(hrefs(meny)).toContain('/settings')
  })

  it('deltagare: fem hubbgrupper och ingen företagsmeny', () => {
    renderaMeny()
    const meny = screen.getByRole('dialog', { name: /meny/i })
    expect(meny.querySelectorAll('[data-testid="mobilmeny-hubb"]').length).toBe(5)
    expect(meny.querySelector('[data-testid="foretagsmeny"]')).toBeNull()
  })

  it('företag: profilpanelen säger "Företag" och mobilhuvudet har varken sök i deltagarsidorna eller krisstöd', () => {
    somForetag()
    mobil.pa = true
    render(
      <MemoryRouter initialEntries={['/foretag']}>
        <ForetagskontoProvider>
          <MobileTopBar />
        </ForetagskontoProvider>
      </MemoryRouter>
    )
    expect(screen.queryByTestId('kris')).toBeNull()
    expect(screen.queryByRole('button', { name: /sök efter en sida/i })).toBeNull()
    // Profilpanelen ligger alltid i DOM (inert när stängd) — rolltexten går att läsa direkt.
    expect(screen.getByText('Företag')).toBeTruthy()
    expect(screen.queryByText('Deltagare')).toBeNull()
  })

  it('företag på mobil: Layout renderar mobilhuvudet men inget bottennav', () => {
    somForetag()
    mobil.pa = true
    rendera()
    expect(screen.getByTestId('foretagsskal')).toBeTruthy()
    expect(screen.queryByTestId('bottennav')).toBeNull()
    expect(screen.queryByTestId('foretag-topbar')).toBeNull()
    expect(screen.getByRole('button', { name: /meny/i })).toBeTruthy()
  })
})
