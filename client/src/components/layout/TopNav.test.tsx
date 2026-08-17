/**
 * Tester för den tvåradiga toppnaven (steg 2, 2026-08-17).
 *
 * Navigationen är chrome: den ritas på varje skärm, så ett fel här träffar
 * alla 25 sidor samtidigt. Det är också skälet till att den ligger bakom
 * `VITE_TOPNAV_ENABLED` — men flaggan skyddar bara mot att felet når prod,
 * inte mot att det byggs.
 *
 * Det som testas:
 *  1. Att raderna byggs ur `navHubs` och inte ur en kopia. En andra lista hade
 *     glidit isär från sidomenyn och bottennavet, och skickat folk till sidor
 *     som tagits bort.
 *  2. Att rad 2 följer aktiv kategori — hela poängen med två rader.
 *  3. Att Översikt, som saknar egna undersidor, inte ritar en tom rad.
 *  4. Att etiketten på Översikt säger sanningen om vad datan är.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TopNav, { HubNav, SubNav } from './TopNav'
import { navHubs } from './navigation'

/** Samma nyckel som navigation.ts använder — läst ur källan, inte gissad. */
const BESOKTA_NYCKEL = 'jobin_visited_features'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

function rendera(path: string, Komponent: React.ComponentType = TopNav) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Komponent />
    </MemoryRouter>
  )
}

describe('rad 1 — huvudkategorierna', () => {
  it('visar alla fem, hämtade ur navHubs', () => {
    rendera('/oversikt', HubNav)
    const nav = screen.getByRole('navigation')
    const lankar = within(nav).getAllByRole('link')
    expect(lankar).toHaveLength(navHubs.length)
    expect(navHubs.length).toBe(5)
  })

  it('markerar aktiv kategori med aria-current, inte bara färg', () => {
    rendera('/cv', HubNav)
    const aktiv = screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')
    expect(aktiv).toHaveLength(1)
    expect(aktiv[0].getAttribute('href')).toBe('/jobb')
  })

  it('en undersida markerar sin kategori, inte sig själv', () => {
    // /skills-gap-analysis ligger under Karriär. Rad 1 ska visa Karriär aktiv.
    rendera('/skills-gap-analysis', HubNav)
    const aktiv = screen.getAllByRole('link').find((l) => l.getAttribute('aria-current') === 'page')
    expect(aktiv?.getAttribute('href')).toBe('/karriar')
  })
})

describe('rad 2 — undersidorna följer aktiv kategori', () => {
  it('Söka jobb visar alla nio, inklusive de två som saknas i hubbsidan (F26)', () => {
    rendera('/cv', SubNav)
    const lankar = screen.getAllByRole('link')
    const jobb = navHubs.find((h) => h.id === 'jobb')!
    expect(lankar).toHaveLength(jobb.items.length)
    expect(jobb.items.length).toBe(9)

    const hrefs = lankar.map((l) => l.getAttribute('href'))
    // Precis de två som dagens /jobb-hubbsida glömmer.
    expect(hrefs).toContain('/linkedin-optimizer')
    expect(hrefs).toContain('/international')
  })

  it('Karriär visar Karriärs undersidor, inte Söka jobbs', () => {
    rendera('/interest-guide', SubNav)
    const hrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/interest-guide')
    expect(hrefs).not.toContain('/cv')
  })

  it('markerar den öppna undersidan', () => {
    rendera('/cv', SubNav)
    const aktiv = screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')
    expect(aktiv).toHaveLength(1)
    expect(aktiv[0].getAttribute('href')).toBe('/cv')
  })

  it('varje hub med undersidor kan rendera rad 2 utan att krascha', () => {
    for (const hub of navHubs.filter((h) => h.items.length > 0)) {
      cleanup()
      rendera(hub.items[0].path, SubNav)
      expect(screen.getAllByRole('link').length).toBe(hub.items.length)
    }
  })
})

describe('Översikt — hubben som inte har några undersidor', () => {
  it('ritar INTE en tom rad', () => {
    // navigation.ts: "meta-hub — it owns no leaf pages". Utan fallbacken hade
    // raden varit tom precis där navigationen möts först.
    const { container } = rendera('/oversikt', SubNav)
    expect(container.querySelector('nav')).not.toBeNull()
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })

  it('utan besökshistorik föreslås startpunkter, märkta "Börja här"', () => {
    rendera('/oversikt', SubNav)
    expect(screen.getByText(/Börja här/i)).toBeTruthy()
    const hrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/cv')
  })

  it('med besökshistorik byter etiketten till "Du har använt"', () => {
    // Etiketten måste säga vad datan ÄR. getVisitedFeatures() är en mängd utan
    // tidsstämplar — att kalla den "Senast" hade varit ett påhittat värde av
    // precis det slag ROADMAP B31 förbjuder.
    localStorage.setItem(BESOKTA_NYCKEL, JSON.stringify(['/diary', '/wellness']))
    rendera('/oversikt', SubNav)
    expect(screen.getByText(/Du har använt/i)).toBeTruthy()
    const hrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/diary')
    expect(hrefs).toContain('/wellness')
  })

  it('visar inte fler än åtta poster — raden ska inte bli oändlig', () => {
    localStorage.setItem(
      BESOKTA_NYCKEL,
      JSON.stringify(navHubs.flatMap((h) => h.items.map((i) => i.path)))
    )
    rendera('/oversikt', SubNav)
    expect(screen.getAllByRole('link').length).toBeLessThanOrEqual(8)
  })
})

describe('tillgänglighet', () => {
  it('båda raderna är namngivna landmärken', () => {
    rendera('/cv')
    const navs = screen.getAllByRole('navigation')
    expect(navs.length).toBe(2)
    for (const n of navs) expect(n.getAttribute('aria-label')).toBeTruthy()
  })

  it('färgprickarna är dolda för skärmläsare', () => {
    const { container } = rendera('/cv', SubNav)
    const prickar = container.querySelectorAll('span[aria-hidden="true"]')
    expect(prickar.length).toBeGreaterThan(0)
  })
})

describe('negativ kontroll — testet kan falla', () => {
  it('rad 2 skiljer sig faktiskt mellan kategorier', () => {
    // Utan den här raden hade testerna ovan varit gröna även om SubNav
    // returnerade samma lista överallt. Jfr lärdomen 2026-08-09.
    rendera('/cv', SubNav)
    const jobbHrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href')).sort()
    cleanup()
    rendera('/diary', SubNav)
    const vardagHrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href')).sort()
    expect(jobbHrefs).not.toEqual(vardagHrefs)
  })

  it('navHubs är inte tom', () => {
    expect(navHubs.flatMap((h) => h.items).length).toBeGreaterThan(20)
  })
})
