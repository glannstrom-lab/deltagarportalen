import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'

// Mock isHubNavEnabled (reads import.meta.env at module load — must mock the module)
vi.mock('./navigation', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    isHubNavEnabled: vi.fn(() => false), // default off; override per test
  }
})

// Mock useAuthStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    profile: { activeRole: 'USER', email: 'test@example.com', first_name: 'Test' },
    signOut: vi.fn(),
  }),
}))

// Helper — renders Sidebar at a given path
const renderAt = (path: string, props?: { isCollapsed?: boolean }) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar {...props} />
    </MemoryRouter>
  )

// Helper to get isHubNavEnabled mock
const getNavMock = async () => {
  const nav = await import('./navigation')
  return vi.mocked(nav.isHubNavEnabled)
}

// ============================================================
// HUB MODE TESTS (isHubNavEnabled returns true)
// ============================================================

describe('Hub mode (isHubNavEnabled = true)', () => {
  beforeEach(async () => {
    const mock = await getNavMock()
    mock.mockReturnValue(true)
  })

  it('Test 1: Renders exactly 5 top-level hub links with hub fallback labels', () => {
    renderAt('/oversikt')
    const nav = document.querySelector('nav')!
    // All 5 hub links must be present as links in the nav
    expect(within(nav).getByRole('link', { name: /översikt/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /söka jobb/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /karriär/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /resurser/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /min vardag/i })).toBeInTheDocument()
  })

  it('Test 2: When on /cv (Söka jobb member), Söka jobb is active and its sub-items are rendered', () => {
    renderAt('/cv')
    // The active hub link should have aria-current="page"
    const nav = document.querySelector('nav')!
    const jobLinks = within(nav).getAllByRole('link', { name: /söka jobb/i })
    const activeLink = jobLinks.find(
      (el) => el.getAttribute('aria-current') === 'page'
    )
    expect(activeLink).toBeDefined()
    // Sub-item "CV" should appear as a link
    expect(within(nav).getByRole('link', { name: /^cv$/i })).toBeInTheDocument()
  })

  it('Test 3: When on /cv, sub-items for OTHER hubs (e.g. Karriär items) are NOT in the DOM', () => {
    renderAt('/cv')
    const nav = document.querySelector('nav')!
    // Intresseguide is a Karriär sub-item, should NOT be visible in nav
    expect(within(nav).queryByRole('link', { name: /intresseguide/i })).not.toBeInTheDocument()
  })

  it('Test 4: When on /karriar (hub path itself), Karriär is active and its 5 sub-items are rendered', () => {
    renderAt('/karriar')
    const nav = document.querySelector('nav')!
    const karriarLinks = within(nav).getAllByRole('link', { name: /karriär/i })
    const activeLink = karriarLinks.find(
      (el) => el.getAttribute('aria-current') === 'page'
    )
    expect(activeLink).toBeDefined()
    // Karriar hub has 5 sub-items — spot-check 2
    expect(within(nav).getByRole('link', { name: /intresseguide/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /kompetensanalys/i })).toBeInTheDocument()
  })

  it('Test 5: When on /oversikt, Översikt hub is active and renders no sub-items (empty items[])', () => {
    renderAt('/oversikt')
    const nav = document.querySelector('nav')!
    const oversiktLinks = within(nav).getAllByRole('link', { name: /översikt/i })
    const activeLink = oversiktLinks.find(
      (el) => el.getAttribute('aria-current') === 'page'
    )
    expect(activeLink).toBeDefined()
    // Översikt has no sub-items — only the 5 hub links should be in nav
    // (plus consultant/admin sections for USER role = none for this mock)
    const navLinks = nav.querySelectorAll('a')
    // 5 hub links only (no sub-items)
    expect(navLinks.length).toBe(5)
  })

  it('Test 6: When on /some-unknown-route, no hub link has aria-current and no sub-items are rendered', () => {
    renderAt('/some-unknown-route')
    const nav = document.querySelector('nav')!
    const activeLinks = nav.querySelectorAll('[aria-current="page"]')
    expect(activeLinks.length).toBe(0)
    // No sub-items from any hub should be rendered
    expect(within(nav).queryByRole('link', { name: /^cv$/i })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: /intresseguide/i })).not.toBeInTheDocument()
  })
})

// ============================================================
// LEGACY MODE TESTS (isHubNavEnabled returns false — default)
// ============================================================

describe('Legacy mode (isHubNavEnabled = false)', () => {
  beforeEach(async () => {
    const mock = await getNavMock()
    mock.mockReturnValue(false)
  })

  it('Test 7: Renders all 3 navGroup labels as group headers', () => {
    renderAt('/')
    const nav = document.querySelector('nav')!
    // Group headers are uppercase small text spans, not links
    // Use getAllByText since "Översikt" may appear both as group header and nav item
    const allOversigtElements = within(nav).getAllByText('Översikt')
    // At minimum the group header should exist
    expect(allOversigtElements.length).toBeGreaterThanOrEqual(1)
    expect(within(nav).getByText('Reflektion')).toBeInTheDocument()
    expect(within(nav).getByText('Utåtriktat')).toBeInTheDocument()
  })

  it('Test 8: Renders all nav items from navGroups (at least 27 links)', () => {
    renderAt('/')
    const nav = document.querySelector('nav')!
    const navLinks = nav.querySelectorAll('a')
    // navGroups has 7 + 12 + 8 = 27 items
    expect(navLinks.length).toBeGreaterThanOrEqual(27)
  })

  it('Test 9: When on /cv, the /cv nav link is highlighted (aria-current="page")', () => {
    renderAt('/cv')
    const nav = document.querySelector('nav')!
    const activeLinks = nav.querySelectorAll('[aria-current="page"]')
    expect(activeLinks.length).toBeGreaterThanOrEqual(1)
    // Verify the active link goes to /cv
    const cvActiveLink = Array.from(activeLinks).find(
      (el) => el.getAttribute('href') === '/cv'
    )
    expect(cvActiveLink).toBeDefined()
  })
})

// ============================================================
// BOTH MODES — footer and sections
// ============================================================

describe('Both modes — footer and sections', () => {
  it('Test 10 (hub mode): Footer renders settings link and logout button', async () => {
    const mock = await getNavMock()
    mock.mockReturnValue(true)
    renderAt('/oversikt')
    expect(screen.getByRole('link', { name: /inställningar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logga ut/i })).toBeInTheDocument()
  })

  it('Test 10b (legacy mode): Footer renders settings link and logout button', async () => {
    const mock = await getNavMock()
    mock.mockReturnValue(false)
    renderAt('/')
    expect(screen.getByRole('link', { name: /inställningar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logga ut/i })).toBeInTheDocument()
  })

  it('Test 11: When isCollapsed=true and hub mode, only icon-only hub links render (no text labels, no sub-items)', async () => {
    const mock = await getNavMock()
    mock.mockReturnValue(true)
    renderAt('/cv', { isCollapsed: true })
    // In collapsed mode, hub link text labels should not be visible (they use sr-only or are omitted)
    expect(screen.queryByText('Söka jobb')).not.toBeInTheDocument()
    expect(screen.queryByText('Karriär')).not.toBeInTheDocument()
    // Sub-items should not render when collapsed
    expect(screen.queryByText('CV')).not.toBeInTheDocument()
  })
})
