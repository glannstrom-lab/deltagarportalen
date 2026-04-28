import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HubBottomNav } from './HubBottomNav'

vi.mock('./navigation', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    isHubNavEnabled: vi.fn(() => true), // default ON for most tests; override in test 8
  }
})

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

describe('HubBottomNav', () => {
  it('Test 1: Renders exactly 5 navigation links when isHubNavEnabled returns true', () => {
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

  it('Test 8: When isHubNavEnabled returns false, renders null', async () => {
    const nav = await import('./navigation')
    vi.mocked(nav.isHubNavEnabled).mockReturnValueOnce(false)
    const { container } = renderAt('/cv')
    expect(container.firstChild).toBeNull()
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
})
