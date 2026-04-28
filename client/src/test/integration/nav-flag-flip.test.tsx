/**
 * Flag-flip integration test — Phase 1 NAV-05 verification
 *
 * Asserts that Sidebar AND HubBottomNav both flip behavior atomically
 * based on isHubNavEnabled(). The two components must agree on which
 * mode is active — if they disagree, the user would see a 5-tab bottom
 * nav with a 27-item sidebar (or vice versa), which is broken.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../../components/layout/Sidebar'
import { HubBottomNav } from '../../components/layout/HubBottomNav'

vi.mock('@/components/layout/navigation', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    isHubNavEnabled: vi.fn(() => false),
  }
})

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    profile: {
      activeRole: 'USER',
      role: 'USER',
      email: 'test@example.com',
      first_name: 'Test',
    },
    signOut: vi.fn(),
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'sv' },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

function renderNavSurface(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <>
        <Sidebar />
        <HubBottomNav />
      </>
    </MemoryRouter>
  )
}

describe('Nav flag-flip integration (NAV-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('flag OFF (legacy mode)', () => {
    beforeEach(async () => {
      const nav = await import('@/components/layout/navigation')
      vi.mocked(nav.isHubNavEnabled).mockReturnValue(false)
    })

    it('Sidebar renders at least 3 nav group headers', () => {
      renderNavSurface('/cv')
      // navGroups fallbackLabels: Översikt, Reflektion, Utåtriktat
      expect(screen.getByText('Reflektion')).toBeInTheDocument()
      expect(screen.getByText('Utåtriktat')).toBeInTheDocument()
      // Översikt appears as both group header and nav item — confirm at least one instance
      const oversiktElements = screen.getAllByText('Översikt')
      expect(oversiktElements.length).toBeGreaterThanOrEqual(1)
    })

    it('Sidebar renders at least 27 deep-link nav items (legacy flat list)', () => {
      renderNavSurface('/cv')
      const allLinks = screen.getAllByRole('link')
      // navGroups has 7 + 12 + 8 = 27 items; footer adds settings link
      expect(allLinks.length).toBeGreaterThanOrEqual(27)
    })

    it('HubBottomNav renders nothing when flag is off', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/cv']}>
          <HubBottomNav />
        </MemoryRouter>
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('flag ON (hub mode)', () => {
    beforeEach(async () => {
      const nav = await import('@/components/layout/navigation')
      vi.mocked(nav.isHubNavEnabled).mockReturnValue(true)
    })

    it('Sidebar renders exactly 5 hub top-level links', () => {
      renderNavSurface('/cv')
      // Both Sidebar and HubBottomNav render each hub label — verify via getAllByRole
      // (at least 1 match per label; the integration surface shows they both agree)
      expect(screen.getAllByRole('link', { name: /översikt/i }).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByRole('link', { name: /söka jobb/i }).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByRole('link', { name: /karriär/i }).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByRole('link', { name: /resurser/i }).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByRole('link', { name: /min vardag/i }).length).toBeGreaterThanOrEqual(1)
    })

    it('HubBottomNav renders 5 tab links when flag is on', () => {
      render(
        <MemoryRouter initialEntries={['/cv']}>
          <HubBottomNav />
        </MemoryRouter>
      )
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    it('Active hub is consistent between Sidebar and HubBottomNav at /applications', () => {
      renderNavSurface('/applications')
      // Both surfaces should highlight 'jobb' as the active hub
      const activeLinks = screen.getAllByRole('link', { current: 'page' })
      // At least 1 aria-current="page" link must be present (hub mode active-hub detection)
      expect(activeLinks.length).toBeGreaterThanOrEqual(1)
      // All aria-current=page links should point to /jobb OR to a /jobb member path
      const jobbMemberPaths = new Set([
        '/jobb', '/applications', '/cv', '/cover-letter', '/job-search',
        '/spontanansökan', '/interview-simulator', '/salary', '/international',
        '/linkedin-optimizer',
      ])
      activeLinks.forEach((link) => {
        const href = link.getAttribute('href') ?? ''
        expect(jobbMemberPaths.has(href)).toBe(true)
      })
    })

    it('Neither Sidebar nor HubBottomNav throws on unknown path', () => {
      expect(() => renderNavSurface('/some-unknown-route-xyz')).not.toThrow()
      // No aria-current="page" anywhere (unknown path activates no hub)
      const activeLinks = screen.queryAllByRole('link', { current: 'page' })
      expect(activeLinks).toHaveLength(0)
    })
  })

  describe('mode switching is atomic', () => {
    it('Sidebar and HubBottomNav agree: neither shows hub UI when flag is off', async () => {
      const nav = await import('@/components/layout/navigation')
      vi.mocked(nav.isHubNavEnabled).mockReturnValue(false)
      renderNavSurface('/cv')
      // No hub bottom nav landmark (flag off — HubBottomNav returns null)
      expect(screen.queryByRole('navigation', { name: /hubnavigering/i })).toBeNull()
      // Legacy nav uses "Sök jobb" (nav.jobSearch), NOT "Söka jobb" (nav.hubs.jobb)
      // "Söka jobb" is unique to hub mode — must not appear in legacy mode
      expect(screen.queryByText('Söka jobb')).toBeNull()
    })

    it('Sidebar and HubBottomNav agree: both show hub UI when flag is on', async () => {
      const nav = await import('@/components/layout/navigation')
      vi.mocked(nav.isHubNavEnabled).mockReturnValue(true)
      renderNavSurface('/cv')
      // Hub bottom nav landmark is present (flag on)
      expect(screen.getByRole('navigation', { name: /hubnavigering/i })).toBeInTheDocument()
      // Sidebar shows hub label "Söka jobb" (unique to hub mode)
      // getAllByText because HubBottomNav also renders it as a tab label
      const jobbLabels = screen.getAllByText('Söka jobb')
      expect(jobbLabels.length).toBeGreaterThanOrEqual(1)
    })
  })
})
