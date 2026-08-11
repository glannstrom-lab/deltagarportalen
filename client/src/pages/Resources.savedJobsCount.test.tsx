/**
 * B32 (2026-08-12) — "Sparade jobb" på /resources räknade skickade
 * ansökningar som sparade jobb. Samma sanning som H4 (MyConsultant.tsx,
 * 2026-07-27): `saved_jobs` bär HELA ansökningspipelinen (SAVED, INTERESTED,
 * APPLIED, INTERVIEW, REJECTED, ACCEPTED, …), inte bara jobb som fortfarande
 * är "sparade". `savedJobsApi.getAll()` returnerar hela pipelinen rakt av —
 * `Resources.tsx` räknade tidigare `savedJobs.length` och kallade det
 * "Sparade jobb".
 *
 * Fixturen speglar den verkliga status-formen: `toSavedJobRow` (jobsApi.ts)
 * versaliserar hela `ApplicationStatus`-enumen (som bl.a. innehåller
 * 'interested' och 'applied'), inte bara de fem värden som SavedJob-typen
 * råkar deklarera.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const getAllMock = vi.fn()

vi.mock('@/services/jobsApi', () => ({
  savedJobsApi: {
    getAll: () => getAllMock(),
    delete: vi.fn(),
  },
}))

vi.mock('@/services/cloudStorage', () => ({
  articleBookmarksApi: { getBookmarks: async () => [] },
}))

vi.mock('@/services/cvApi', () => ({
  cvApi: {
    getCV: async () => null,
    getVersions: async () => [],
  },
}))

vi.mock('@/services/coverLetterApi', () => ({
  coverLetterApi: { getAll: async () => [] },
}))

vi.mock('@/services/interestApi', () => ({
  interestApi: { getResult: async () => null },
}))

vi.mock('@/components/FocusModeProvider', () => ({
  useFocusMode: () => ({ isFocusMode: false, leaveWizard: vi.fn() }),
}))

vi.mock('@/components/layout/index', () => ({
  PageLayout: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/pdf/PDFExportButton', () => ({
  PDFExportButton: () => null,
}))

import Resources from './Resources'

/** Rå radform, exakt så som `toSavedJobRow` (jobsApi.ts) levererar den. */
const fixture = [
  { id: '1', job_id: 'j1', job_data: { headline: 'Snickare' }, status: 'SAVED', created_at: '2026-08-01' },
  { id: '2', job_id: 'j2', job_data: { headline: 'Målare' }, status: 'INTERESTED', created_at: '2026-08-02' },
  { id: '3', job_id: 'j3', job_data: { headline: 'Elektriker' }, status: 'APPLIED', created_at: '2026-08-03' },
  { id: '4', job_id: 'j4', job_data: { headline: 'Rörmokare' }, status: 'INTERVIEW', created_at: '2026-08-04' },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <Resources />
    </MemoryRouter>
  )

beforeEach(() => {
  getAllMock.mockReset()
  getAllMock.mockResolvedValue(fixture)
})

describe('B32: /resources räknar bara faktiskt sparade jobb som "Sparade jobb"', () => {
  it('KPI-kortet visar 2 (SAVED+INTERESTED), inte 4 (hela pipelinen)', async () => {
    renderPage()

    await waitFor(() => expect(getAllMock).toHaveBeenCalled())

    // Skalar in på KPI-kortets egen siffra i stället för att leta efter "2"/"4"
    // i hela dokumentet — andra kort (t.ex. dokument-räknaren) kan råka visa
    // samma siffra.
    const label = await screen.findByText('Sparade jobb')
    const value = label.previousElementSibling as HTMLElement
    expect(value).toHaveTextContent('2')
    expect(value).not.toHaveTextContent('4')
  })

  it('listar bara de faktiskt sparade jobben, inte skickade ansökningar', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Snickare')).toBeInTheDocument())
    expect(screen.getByText('Målare')).toBeInTheDocument()

    // Elektriker (APPLIED) och Rörmokare (INTERVIEW) hör hemma i
    // Jobbtrackern, inte i "Sparade jobb"-sektionen på Resurser-sidan.
    expect(screen.queryByText('Elektriker')).not.toBeInTheDocument()
    expect(screen.queryByText('Rörmokare')).not.toBeInTheDocument()
  })
})
