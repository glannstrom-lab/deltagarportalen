import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ConfirmDialogProvider } from '@/components/ui'
import { ApplicationsPipeline } from './ApplicationsPipeline'
import type { Application } from '@/types/application.types'

const hookVarde = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('@/hooks/useApplications', () => ({
  useApplications: () => hookVarde.current
}))

const tomGrupp = {
  interested: [], saved: [], applied: [], screening: [], phone: [],
  interview: [], assessment: [], offer: [], accepted: [], rejected: [], withdrawn: []
}

const app = (over: Partial<Application> = {}): Application => ({
  id: 'a1', userId: 'u1', status: 'applied', priority: 'medium',
  jobTitle: 'Butikssäljare', companyName: 'Ica Maxi',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...over
} as Application)

function bas(over: Record<string, unknown> = {}) {
  return {
    applications: [],
    applicationsByStatus: { ...tomGrupp },
    archivedApplications: [],
    staleApplications: [],
    stats: null,
    statsLoading: false,
    statsError: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    updateStatus: vi.fn(),
    archiveApplication: vi.fn(),
    unarchiveApplication: vi.fn(),
    deleteApplication: vi.fn(),
    ...over
  }
}

const rita = () => render(<MemoryRouter><ConfirmDialogProvider><ApplicationsPipeline /></ConfirmDialogProvider></MemoryRouter>)

describe('ApplicationsPipeline — tre lägen', () => {
  beforeEach(() => { hookVarde.current = bas() })

  it('laddar: varken tomtillstånd eller siffror', () => {
    hookVarde.current = bas({ isLoading: true })
    rita()
    expect(screen.queryByText(/inte börjat söka jobb/i)).toBeNull()
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('fel: felläge med Försök igen — INTE "du har inte börjat söka jobb"', () => {
    hookVarde.current = bas({ error: 'network down' })
    rita()
    expect(screen.queryByText(/inte börjat söka jobb/i)).toBeNull()
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: /försök igen/i })).toBeTruthy()
  })

  it('klart + tomt: EmptyState, ingen verktygsrad med nollor', () => {
    rita()
    expect(screen.getByText(/inte börjat söka jobb/i)).toBeTruthy()
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.queryByText(/^0 /)).toBeNull()
  })

  it('klart + data: verktygsrad, kanban och tangentbordsåtkomligt kort', () => {
    const a = app()
    hookVarde.current = bas({
      applications: [a],
      applicationsByStatus: { ...tomGrupp, applied: [a] }
    })
    render(<MemoryRouter><ConfirmDialogProvider><ApplicationsPipeline onViewApplication={vi.fn()} /></ConfirmDialogProvider></MemoryRouter>)
    expect(screen.getByRole('searchbox')).toBeTruthy()
    expect(screen.getByText(/1 skickad ansökan/)).toBeTruthy()
    expect(screen.queryByText(/0 intervjuer/)).toBeNull()
    // Kanban (desktop) och listan (mobil) renderar båda i jsdom — CSS-dolda
    // element filtreras inte bort. Därför getAll.
    const kort = screen.getAllByRole('button', { name: /Öppna ansökan: Butikssäljare hos Ica Maxi/i })
    expect(kort.length).toBeGreaterThan(0)
    expect(kort[0].getAttribute('tabindex')).toBe('0')
    expect(screen.getAllByRole('button', { name: /Flytta Butikssäljare till ett annat steg/i }).length).toBeGreaterThan(0)
  })
})
