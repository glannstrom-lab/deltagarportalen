 
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HubBottomNav } from './HubBottomNav'

// (isHubNavEnabled-mocken borttagen 2026-07-10, C3 — hub-nav är permanent)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <HubBottomNav />
    </MemoryRouter>
  )

describe('HubBottomNav — egna hubbikoner (N3, 2026-09-10)', () => {
  it('varje flik visar hubbens egen ikon, dekorativ, och bara den aktiva är i färg', () => {
    const { container } = renderAt('/cv')
    const ikoner = [...container.querySelectorAll('a img')]
    expect(ikoner.length).toBe(5)
    for (const i of ikoner) {
      expect(i.getAttribute('alt')).toBe('')
      expect(i.getAttribute('aria-hidden')).toBe('true')
    }
    const avfargade = ikoner.filter((i) => i.className.includes('grayscale'))
    expect(avfargade.length).toBe(4)
  })
})

describe('HubBottomNav', () => {
  it('Test 1: Renders exactly 5 navigation links', () => {
    renderAt('/cv')
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
  })

  it('Test 2: Each link text matches the hub fallback labels', () => {
    renderAt('/cv')
    expect(screen.getByText('Översikt')).toBeInTheDocument()
    expect(screen.getByText('Söka jobb')).toBeInTheDocument()
    expect(screen.getByText('Karriär')).toBeInTheDocument()
    expect(screen.getByText('Resurser')).toBeInTheDocument()
    expect(screen.getByText('Min vardag')).toBeInTheDocument()
  })

  it('Test 3: Each link href matches the hub path', () => {
    renderAt('/cv')
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/oversikt')
    expect(hrefs).toContain('/jobb')
    expect(hrefs).toContain('/karriar')
    expect(hrefs).toContain('/resurser')
    expect(hrefs).toContain('/min-vardag')
  })

  it('Test 4: When at /cv, link to /jobb has aria-current="page" and active class', () => {
    renderAt('/cv')
    const links = screen.getAllByRole('link')
    const jobbLink = links.find((l) => l.getAttribute('href') === '/jobb')
    expect(jobbLink).toBeDefined()
    expect(jobbLink!.getAttribute('aria-current')).toBe('page')
    expect(jobbLink!.className).toContain('bg-[var(--c-bg)]')
  })

  it('Test 5: When at /karriar (hub own path), link to /karriar has aria-current="page"', () => {
    renderAt('/karriar')
    const links = screen.getAllByRole('link')
    const karriarLink = links.find((l) => l.getAttribute('href') === '/karriar')
    expect(karriarLink).toBeDefined()
    expect(karriarLink!.getAttribute('aria-current')).toBe('page')
  })

  it('Test 6: When at an unknown route, no link has aria-current="page"', () => {
    renderAt('/some-unknown-route')
    const links = screen.getAllByRole('link')
    for (const link of links) {
      expect(link.getAttribute('aria-current')).toBeNull()
    }
  })

  it('Test 7: Each link has min-h-[44px] in its className', () => {
    renderAt('/cv')
    const links = screen.getAllByRole('link')
    for (const link of links) {
      expect(link.className).toContain('min-h-[44px]')
    }
  })

  it('Test 9: Active link parent <li> has data-domain equal to the active hub domain', () => {
    renderAt('/cv') // /cv belongs to jobb hub (domain: activity)
    // Find the active link
    const links = screen.getAllByRole('link')
    const activeLink = links.find((l) => l.getAttribute('aria-current') === 'page')
    expect(activeLink).toBeDefined()
    const li = activeLink!.closest('li')
    expect(li).toBeDefined()
    expect(li!.getAttribute('data-domain')).toBe('activity')
  })

  it('Test 10: Component has role="navigation" and an aria-label', () => {
    renderAt('/cv')
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    const label = nav.getAttribute('aria-label')
    expect(label).toBeTruthy()
  })

  /*
   * MB2 (2026-09-08): `--bottom-nav-h` ska vara navets UPPMÄTTA höjd, inte ett
   * hårdkodat 64. jsdom mäter allt till 0, så höjden stubbas på
   * getBoundingClientRect — det är exakt det anropet komponenten gör.
   * Konsumenter: CookieConsent, CVBuilder och `html { scroll-padding-bottom }`
   * i tokens.css; en fel höjd här flyttar alla tre.
   */
  describe('--bottom-nav-h (uppmätt navhöjd)', () => {
    const stubbaHojd = (h: number) => {
      const orig = HTMLElement.prototype.getBoundingClientRect
      HTMLElement.prototype.getBoundingClientRect = function () {
        const r = orig.call(this)
        return this.tagName === 'NAV' ? { ...r, height: h, bottom: r.top + h } : r
      }
      return () => { HTMLElement.prototype.getBoundingClientRect = orig }
    }

    it('sätter variabeln till navets mätta höjd, inte till ett fast tal', () => {
      const aterstall = stubbaHojd(65)
      try {
        renderAt('/cv')
        expect(document.documentElement.style.getPropertyValue('--bottom-nav-h')).toBe('65px')
      } finally { aterstall() }
    })

    it('reserverar ingen plats när navet är dolt (fokusläget: display:none → 0)', () => {
      const aterstall = stubbaHojd(0)
      try {
        renderAt('/cv')
        expect(document.documentElement.style.getPropertyValue('--bottom-nav-h')).toBe('0px')
      } finally { aterstall() }
    })

    it('tar bort variabeln vid avmontering (publika sidor ska inte ärva den)', () => {
      const aterstall = stubbaHojd(65)
      try {
        const { unmount } = renderAt('/cv')
        expect(document.documentElement.style.getPropertyValue('--bottom-nav-h')).toBe('65px')
        unmount()
        expect(document.documentElement.style.getPropertyValue('--bottom-nav-h')).toBe('')
      } finally { aterstall() }
    })

    it('har riktig safe-area-padding — `pb-safe` finns inte i Tailwind 4', () => {
      renderAt('/cv')
      const nav = screen.getByRole('navigation')
      expect(nav.className).toContain('pb-[env(safe-area-inset-bottom)]')
      expect(nav.className).not.toMatch(/\bpb-safe\b/)
    })
  })
})
