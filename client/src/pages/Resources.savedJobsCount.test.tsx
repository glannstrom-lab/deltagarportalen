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

/**
 * Mocken renderar `stats`, inte bara `children`.
 *
 * 2026-08-17 flyttade nyckeltalen från ett kort i sidans innehåll till
 * PageLayouts `stats`-prop (hjälten ersattes av en sidoskena). Mocken kastade
 * propen, så B32-vakten slutade se siffran den vaktar och föll med "Unable to
 * find an element with the text: Sparade jobb".
 *
 * Att lätta på assertionen hade gjort testet grönt och tandlöst. Mocken speglar
 * i stället propen, så vakten mäter samma sak som förut — vilket tal sidan
 * skickar som "Sparade jobb" — oberoende av var layouten väljer att rita det.
 */
vi.mock('@/components/layout/index', () => ({
  PageLayout: ({
    children,
    stats,
  }: {
    children?: React.ReactNode
    stats?: Array<{ label: string; value: string | number }>
  }) => (
    <div>
      {stats?.map((st) => (
        <div key={st.label} data-testid={`stat-${st.label}`}>
          {st.value}
        </div>
      ))}
      {children}
    </div>
  ),
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

    // Skalar in på just det nyckeltalet i stället för att leta efter "2"/"4"
    // i hela dokumentet — andra tal (t.ex. dokumenträknaren) kan råka visa
    // samma siffra.
    const value = await screen.findByTestId('stat-Sparade jobb')
    expect(value).toHaveTextContent('2')
    expect(value).not.toHaveTextContent('4')
  })

  it('negativ kontroll: vakten fäller om räkningen tar hela pipelinen', async () => {
    // Utan den här skulle testet ovan gå grönt även om `stats` slutade skickas
    // och elementet försvann — `findByTestId` hade då kastat, men en framtida
    // uppmjukning ("finns elementet, hoppa över") hade inte märkts. Här står
    // det uttryckligen vad fixturen innehåller och vad som INTE får räknas.
    renderPage()
    const value = await screen.findByTestId('stat-Sparade jobb')
    expect(fixture).toHaveLength(4)
    expect(fixture.filter((r) => ['SAVED', 'INTERESTED'].includes(r.status))).toHaveLength(2)
    expect(value.textContent).toBe('2')
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
