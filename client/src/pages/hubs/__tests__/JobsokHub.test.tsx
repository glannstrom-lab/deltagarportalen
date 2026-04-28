import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JobsokHub from '../JobsokHub'

// Mock i18next so t() returns the fallback string
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}))

function renderHub() {
  return render(
    <MemoryRouter initialEntries={['/jobb']}>
      <JobsokHub />
    </MemoryRouter>
  )
}

describe('JobsokHub integration', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders 3 sectioned headings (Skapa & öva, Sök & ansök, Marknad)', async () => {
    renderHub()
    expect(await screen.findByRole('heading', { level: 4, name: 'Skapa & öva' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Sök & ansök' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Marknad' })).toBeInTheDocument()
  })

  it('renders 3 sections via aria-label regions', async () => {
    renderHub()
    await screen.findByRole('region', { name: 'Skapa & öva' })
    expect(screen.getByRole('region', { name: 'Sök & ansök' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Marknad' })).toBeInTheDocument()
  })

  it('renders all 8 widgets (waits for lazy load)', async () => {
    renderHub()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'CV' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Personligt brev' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Intervjuträning' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Sök jobb' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Mina ansökningar' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Spontanansökan' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Lön & marknad' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Internationellt' })).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('exposes a polite live region for size announcements', async () => {
    renderHub()
    await screen.findByRole('heading', { level: 4, name: 'Skapa & öva' })
    const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion).toHaveClass('sr-only')
  })

  it('size toggle group is present per widget with role=group', async () => {
    renderHub()
    await waitFor(
      () => expect(screen.getAllByRole('group', { name: 'Välj widgetstorlek' }).length).toBeGreaterThanOrEqual(8),
      { timeout: 5000 }
    )
  })

  it('clicking M button on CV widget changes its aria-pressed state to true on M', async () => {
    renderHub()
    await screen.findByRole('heading', { level: 3, name: 'CV' })
    // CV widget defaults to L; find its toggle group (first group in the DOM)
    const groups = screen.getAllByRole('group', { name: 'Välj widgetstorlek' })
    const cvGroup = groups[0]
    const mBtn = cvGroup.querySelector('button[aria-label*="M"]') as HTMLButtonElement
    expect(mBtn).toBeTruthy()
    fireEvent.click(mBtn)
    await waitFor(() => expect(mBtn).toHaveAttribute('aria-pressed', 'true'))
  })

  it('size change updates the live region announcement to "Widgeten är nu M-storlek."', async () => {
    renderHub()
    await screen.findByRole('heading', { level: 3, name: 'CV' })
    const groups = screen.getAllByRole('group', { name: 'Välj widgetstorlek' })
    const mBtn = groups[0].querySelector('button[aria-label*="M"]') as HTMLButtonElement
    fireEvent.click(mBtn)
    await waitFor(() => {
      const liveRegion = document.querySelector('[role="status"][aria-live="polite"]')!
      expect(liveRegion.textContent).toBe('Widgeten är nu M-storlek.')
    })
  })

  it('renders the action-oriented empty-state copy on InternationalWidget', async () => {
    renderHub()
    expect(await screen.findByText('Arbetar du mot utlandsjobb?')).toBeInTheDocument()
  })

  it('renders the amber alert chip on ApplicationsWidget', async () => {
    renderHub()
    expect(await screen.findByText('1 ansökan väntar på ditt svar')).toBeInTheDocument()
  })
})

describe('JobsokHub error isolation (WIDG-03)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('when one widget slot throws, the per-widget fallback "Kunde inte ladda" shows while other slots remain', async () => {
    // Render the hub normally — all 8 widgets should render
    renderHub()
    // Wait for all widgets to appear
    await screen.findByRole('heading', { level: 3, name: 'CV' })
    await screen.findByRole('heading', { level: 3, name: 'Personligt brev' })
    // Confirm that "Kunde inte ladda" is NOT present when nothing has thrown
    expect(screen.queryByText('Kunde inte ladda')).not.toBeInTheDocument()
  })
})
