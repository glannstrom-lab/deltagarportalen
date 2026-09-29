/**
 * Sparade-fliken (driftpasset 2026-09-29): rubriken, antalet, sorteringen och
 * "Visa annons" var hårdkodad svenska, och "Ta bort" frågade med window.confirm().
 *
 * Mutationer:
 *  · sätt tillbaka `confirm('Ta bort detta sparade jobb?')` → "frågar i en egen dialog" faller
 *  · sätt tillbaka "Sparade jobb" som bar text i SavedJobsTab → "engelska" faller
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'

vi.mock('@/services/arbetsformedlingenApi', () => ({
  searchJobs: vi.fn(async () => ({ hits: [], total: { value: 0 } })),
  getJobDetails: vi.fn(),
  getAutocomplete: vi.fn(async () => []),
  SWEDISH_MUNICIPALITIES: [],
}))

const removeJob = vi.fn()
vi.mock('@/hooks/useSavedJobs', () => ({
  useSavedJobs: () => ({
    savedJobs: [{
      id: 's1', status: 'saved', savedAt: '2026-09-20T10:00:00Z',
      jobData: { headline: 'Lagerarbetare', employer: { name: 'Lager AB' }, webpage_url: 'https://example.com/annons' },
    }],
    isLoaded: true,
    error: null,
    saveJob: vi.fn(),
    removeJob: (...a: unknown[]) => removeJob(...a),
    updateJobStatus: vi.fn(),
    refresh: vi.fn(),
    isSaved: vi.fn(() => false),
    getStats: vi.fn(() => ({ total: 1, applied: 0, interviews: 0 })),
  }),
}))

vi.mock('@/hooks/useJobAlerts', () => ({ useJobAlerts: () => ({ alerts: [], createAlert: vi.fn() }) }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user1' } }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}))

import JobSearch from './JobSearch'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'

function visaSparade() {
  return render(
    <MemoryRouter initialEntries={['/job-search/saved']}>
      <I18nextProvider i18n={i18n}>
        <ConfirmDialogProvider>
          <Routes>
            <Route path="job-search/*" element={<JobSearch />} />
          </Routes>
        </ConfirmDialogProvider>
      </I18nextProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => { removeJob.mockClear() })
afterEach(() => cleanup())

describe('JobSearch — sparade jobb', () => {
  it('frågar i en egen dialog, inte med window.confirm, och tar bort först efter ja', async () => {
    const nativ = vi.spyOn(window, 'confirm').mockReturnValue(true)
    visaSparade()

    fireEvent.click(await screen.findByRole('button', { name: 'Ta bort' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Ta bort detta sparade jobb?')
    expect(nativ).not.toHaveBeenCalled()
    expect(removeJob).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(removeJob).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Ta bort' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Ta bort' }))
    await waitFor(() => expect(removeJob).toHaveBeenCalledWith('s1'))
    nativ.mockRestore()
  })

  it('visar rubrik, antal, sortering och "Visa annons" på engelska', async () => {
    const { default: en } = await import('@/i18n/locales/en.json')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    // Nycklarna i C1.json slås ihop i en.json av den som äger språkfilerna; tills dess läggs de hit.
    i18n.addResourceBundle('en', 'translation', {
      jobSearch: {
        savedJobsHeading: 'Saved jobs',
        savedJobsCount_one: '{{count}} job saved',
        savedJobsCount_other: '{{count}} jobs saved',
        sortSavedJobs: 'Sort saved jobs',
        viewAd: 'View ad',
      },
    }, true, true)
    await i18n.changeLanguage('en')
    try {
      visaSparade()
      expect(await screen.findByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument()
      expect(screen.getByText('1 job saved')).toBeInTheDocument()
      expect(screen.getByLabelText('Sort saved jobs')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View ad' })).toBeInTheDocument()
      expect(screen.queryByText('Visa annons')).not.toBeInTheDocument()
      expect(screen.queryByText(/jobb sparat/)).not.toBeInTheDocument()
    } finally {
      await i18n.changeLanguage('sv')
    }
  })
})
