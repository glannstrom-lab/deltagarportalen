/**
 * CB4 — `JobAdaptPage` rullade aldrig tillbaka en misslyckad optimistisk
 * uppdatering.
 *
 * `handleAddSkill`/`handleUpdateSummary` satte `cvData` direkt (optimistiskt),
 * anropade `cvApi.updateCV`, och visade vid fel bara en toast — ändringen
 * låg kvar i UI:t som om den vore sparad. Nästa laddning var den borta,
 * utan att deltagaren fått veta att den aldrig sparades.
 *
 * Fixen fångar det tidigare värdet innan den optimistiska uppdateringen och
 * rullar tillbaka till precis det om `cvApi.updateCV` kastar.
 *
 * `JobAdaptPanel` mockas bort — den är AI-analyspanelen (egen fil, egna
 * tester hör hemma där) och drar in `useSavedJobs`/Supabase-beroenden som
 * inte hör hemma i det här testet. Stubben exponerar bara de två callbacksen
 * CB4 handlar om, plus den aktuella sammanfattningen så vi kan se rollbacken.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import JobAdaptPage from './JobAdaptPage'
import type { CVData } from '@/services/supabaseApi'

const mockGetCV = vi.fn()
const mockUpdateCV = vi.fn()

vi.mock('@/services/supabaseApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/supabaseApi')>()
  return {
    ...actual,
    cvApi: {
      getCV: (...args: unknown[]) => mockGetCV(...args),
      updateCV: (...args: unknown[]) => mockUpdateCV(...args),
    },
  }
})

vi.mock('@/components/cv/JobAdaptPanel', () => ({
  JobAdaptPanel: ({
    cvData,
    onAddSkill,
    onUpdateSummary,
  }: {
    cvData: CVData
    onAddSkill: (skill: string) => void
    onUpdateSummary: (summary: string) => void
  }) => (
    <div>
      <div data-testid="current-summary">{cvData.summary}</div>
      <button onClick={() => onAddSkill('React')}>lägg till kompetens</button>
      <button onClick={() => onUpdateSummary('Ny sammanfattning från annonsen')}>
        uppdatera sammanfattning
      </button>
    </div>
  ),
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/components/Toast', () => ({
  showToast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const INITIAL_CV: CVData = {
  firstName: 'Anna',
  lastName: 'Andersson',
  title: 'Utvecklare',
  summary: 'Ursprunglig sammanfattning.',
  skills: [{ id: '1', name: 'TypeScript', level: 4, category: 'technical' }],
  workExperience: [],
  education: [],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <JobAdaptPage />
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockGetCV.mockReset()
  mockUpdateCV.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
  mockGetCV.mockResolvedValue({ ...INITIAL_CV, skills: [...INITIAL_CV.skills!] })
})

describe('JobAdaptPage — rullar tillbaka en misslyckad optimistisk uppdatering (CB4)', () => {
  it('handleAddSkill: UI återgår när sparningen misslyckas', async () => {
    mockUpdateCV.mockRejectedValue(new Error('nätverksfel'))
    renderPage()

    await screen.findByText('TypeScript')
    fireEvent.click(await screen.findByRole('button', { name: /lägg till kompetens/i }))

    // Sparningen misslyckas (redan avgjord av mocken innan React hinner
    // committa den optimistiska mellanrenderingen i jsdom, så den kapplöpning
    // testas inte här) → rollback. Chippen ska INTE synas i sluttillståndet.
    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('React')).toBeNull())

    // Den ursprungliga kompetensen finns kvar orörd.
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('handleAddSkill: chippen ligger kvar när sparningen lyckas', async () => {
    mockUpdateCV.mockResolvedValue({})
    renderPage()

    await screen.findByText('TypeScript')
    fireEvent.click(await screen.findByRole('button', { name: /lägg till kompetens/i }))

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled())
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('handleUpdateSummary: UI återgår till föregående text när sparningen misslyckas', async () => {
    mockUpdateCV.mockRejectedValue(new Error('nätverksfel'))
    renderPage()

    const summaryNode = await screen.findByTestId('current-summary')
    await waitFor(() => expect(summaryNode).toHaveTextContent('Ursprunglig sammanfattning.'))

    fireEvent.click(screen.getByRole('button', { name: /uppdatera sammanfattning/i }))

    // Optimistiskt satt direkt.
    await waitFor(() =>
      expect(summaryNode).toHaveTextContent('Ny sammanfattning från annonsen')
    )

    // Rollback efter misslyckad sparning — tillbaka till den gamla texten.
    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    await waitFor(() =>
      expect(summaryNode).toHaveTextContent('Ursprunglig sammanfattning.')
    )
  })

  it('handleUpdateSummary: den nya texten ligger kvar när sparningen lyckas', async () => {
    mockUpdateCV.mockResolvedValue({})
    renderPage()

    const summaryNode = await screen.findByTestId('current-summary')
    await waitFor(() => expect(summaryNode).toHaveTextContent('Ursprunglig sammanfattning.'))

    fireEvent.click(screen.getByRole('button', { name: /uppdatera sammanfattning/i }))

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled())
    expect(summaryNode).toHaveTextContent('Ny sammanfattning från annonsen')
  })
})
