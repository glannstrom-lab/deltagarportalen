/**
 * Aktivitetsrapportvyns tre lägen (O3, 2026-08-25).
 *
 * Uträkningen prövas i `aktivitetsrapport.test.ts`. Den här filen vaktar det
 * som bara syns när komponenten renderas:
 *
 *  1. **Laddar, fel och klart är tre olika lägen.** Ett trasigt anrop får inte
 *     ritas som "inga sökta jobb den här månaden" — då fyller användaren i en
 *     tom aktivitetsrapport till Arbetsförmedlingen och tror att den stämmer.
 *  2. **Rader utan datum syns.** De kan inte placeras i en månad, men om vyn
 *     tiger om dem tappas riktiga jobbansökningar tyst.
 *  3. **Ett tomt fält skrivs "Inte ifyllt", aldrig som ett påhittat värde.**
 *
 * Testet kan falla: byter man `if (error)` mot ett tomtillstånd faller
 * fel-testet, och tar man bort `utanDatum`-rutan faller det andra.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Application, ApplicationStatus } from '@/types/application.types'

const hookVarde = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('@/hooks/useApplications', () => ({
  useApplications: () => hookVarde.current,
}))

import { ApplicationsActivityReport } from './ApplicationsActivityReport'

function ansokan(over: Partial<Application> & { id: string; status: ApplicationStatus }): Application {
  return {
    userId: 'u1',
    jobId: `job-${over.id}`,
    jobData: { headline: 'Jobb', employer: { name: 'Företag' } },
    source: 'manual',
    priority: 'medium',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  } as Application
}

function rita() {
  return render(
    <MemoryRouter>
      <ApplicationsActivityReport />
    </MemoryRouter>
  )
}

/** Månaden vyn öppnar på — samma regel som komponenten följer. */
function oppnadManad(): string {
  const nu = new Date()
  const d = nu.getDate() <= 14 ? new Date(nu.getFullYear(), nu.getMonth() - 1, 1) : nu
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-10`
}

beforeEach(() => {
  hookVarde.current = { applications: [], isLoading: false, error: null, refetch: vi.fn() }
})

describe('ApplicationsActivityReport', () => {
  it('säger att den hämtar, i stället för att påstå att listan är tom', () => {
    hookVarde.current = { applications: [], isLoading: true, error: null, refetch: vi.fn() }
    rita()
    expect(screen.getByRole('status')).toHaveTextContent(/hämtar/i)
    expect(screen.queryByText(/inga sökta jobb/i)).toBeNull()
  })

  it('visar ett fel som ett fel — aldrig som noll ansökningar', () => {
    hookVarde.current = {
      applications: [],
      isLoading: false,
      error: new Error('nätet dog'),
      refetch: vi.fn(),
    }
    rita()
    expect(screen.getByText(/kunde inte hämtas/i)).toBeInTheDocument()
    expect(screen.queryByText(/inga sökta jobb/i)).toBeNull()
  })

  it('bjuder in när månaden är tom, utan att skriva en nolla', () => {
    rita()
    expect(screen.getByText(/inga sökta jobb registrerade/i)).toBeInTheDocument()
  })

  it('säger uttryckligen att ingenting skickas till Arbetsförmedlingen', () => {
    rita()
    expect(screen.getByText(/skickar ingenting till arbetsförmedlingen/i)).toBeInTheDocument()
  })

  it('listar månadens sökta jobb', () => {
    hookVarde.current = {
      applications: [
        ansokan({
          id: '1',
          status: 'applied',
          applicationDate: oppnadManad(),
          companyName: 'Nordbygg AB',
          jobTitle: 'Snickare',
          applicationMethod: 'email',
        }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }
    rita()
    expect(screen.getByText('Nordbygg AB')).toBeInTheDocument()
    expect(screen.getByText('Snickare')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('skriver "Inte ifyllt" för fält användaren inte fyllt i', () => {
    hookVarde.current = {
      applications: [
        ansokan({
          id: '1',
          status: 'applied',
          applicationDate: oppnadManad(),
          companyName: 'Nordbygg AB',
          jobTitle: 'Snickare',
          // ingen applicationMethod
        }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }
    rita()
    expect(screen.getAllByText(/inte ifyllt/i).length).toBeGreaterThan(0)
  })

  it('berättar om sökta jobb som saknar datum i stället för att tappa dem', () => {
    hookVarde.current = {
      applications: [
        ansokan({ id: 'utan', status: 'applied', companyName: 'Glömda AB' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }
    rita()
    expect(screen.getByText(/saknar datum/i)).toBeInTheDocument()
  })
})
