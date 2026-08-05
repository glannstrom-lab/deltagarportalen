/**
 * UX35 (2026-08-05) — CTA:erna får inte peka på /dashboard/*.
 *
 * `App.tsx` har `<Route path="/dashboard/*" element={<Navigate to="/" replace />} />`,
 * så varje knapp som navigerade dit landade på Översikt i stället för där texten
 * lovade. Testerna låser fast destinationen, inte bara att knappen finns.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

const getAllMock = vi.fn()
vi.mock('@/services/coverLetterApi', () => ({
  coverLetterApi: {
    getAll: () => getAllMock(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { CoverLetterMyLetters } from './CoverLetterMyLetters'

const renderList = () =>
  render(
    <MemoryRouter initialEntries={['/cover-letter/my-letters']}>
      <CoverLetterMyLetters />
    </MemoryRouter>
  )

beforeEach(() => {
  navigateMock.mockClear()
})

describe('CoverLetterMyLetters — destinationer', () => {
  it('tomtillståndets CTA:er går till /cover-letter, inte till /dashboard/*', async () => {
    getAllMock.mockResolvedValue([])
    renderList()

    const cta = await screen.findByText('Skriv ditt första brev')
    fireEvent.click(cta)
    expect(navigateMock).toHaveBeenCalledWith('/cover-letter')

    fireEvent.click(screen.getByText('Få hjälp av AI'))
    expect(navigateMock).toHaveBeenCalledTimes(2)
    expect(navigateMock.mock.calls.every(([to]) => !String(to).startsWith('/dashboard'))).toBe(true)
  })

  it('Redigera går till skrivvyn med brevets id — inte till omdirigeringen', async () => {
    getAllMock.mockResolvedValue([
      {
        id: 'brev-1',
        title: 'Testbrev',
        company: 'Acme',
        job_title: 'Snickare',
        content: 'Hej hej',
        template: 'professional',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
        status: 'draft',
      },
    ])
    renderList()

    // Titeln renderas i två varianter (mobil + desktop) — därför getAllByText.
    await waitFor(() => expect(screen.getAllByText('Testbrev').length).toBeGreaterThan(0))

    const editButtons = screen.getAllByRole('button', { name: /Redigera/i })
    fireEvent.click(editButtons[0])

    expect(navigateMock).toHaveBeenCalledWith('/cover-letter?edit=brev-1')
  })
})
