/**
 * KH6/KH13 (rollspelet 2026-09-28): Hjälp var deltagarens för alla roller. Konsulent och
 * administratör ser nu konsulentens uppgifter; deltagare (och SUPERADMIN, med flit) ser det gamla.
 * Motprov: ta bort rollgrenen i Help.tsx → konsulentprovet faller på CV-frågan.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { KONSULENT_HJALP } from '@/components/consultant/konsulentHjalpData'

vi.mock('@/components/layout/index', () => ({ PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/components/FocusModeProvider', () => ({ useFocusMode: () => ({ isFocusMode: false, leaveWizard: vi.fn() }) }))

let roll: string | undefined
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ profile: roll ? { activeRole: roll } : null }),
}))

import Help from './Help'

afterEach(cleanup)

const rita = () => render(<MemoryRouter><Help /></MemoryRouter>)

describe('Hjälp per roll', () => {
  it.each(['CONSULTANT', 'ADMIN'])('%s ser konsulentens uppgifter, inte CV-tips', (r) => {
    roll = r
    rita()
    expect(screen.getByText('Hur markerar jag närvaro på dagens pass?')).toBeInTheDocument()
    expect(screen.getByText('Hur skapar jag en plan åt en deltagare som saknar plan?')).toBeInTheDocument()
    expect(screen.queryByText(/Applicant|CV/)).toBeNull()
  })

  it.each(['USER', 'SUPERADMIN', undefined])('%s ser deltagarens hjälp', (r) => {
    roll = r
    rita()
    expect(screen.queryByText('Hur markerar jag närvaro på dagens pass?')).toBeNull()
    expect(document.querySelector('[data-testid="konsulent-hjalp"]')).toBeNull()
  })

  it('konsulenttexterna hänvisar bara till knappar som finns i koden', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const rot = resolve(__dirname, '../components/consultant')
    const kalla = (f: string) => readFileSync(resolve(rot, f), 'utf-8')
    expect(kalla('AktivitetsplanSektion.tsx')).toContain("label: 'Tillämpa schemamall'")
    expect(kalla('DagensPass.tsx')).toContain('Närvaro per pass')
    expect(kalla('OrganisationSektion.tsx')).toContain('Överlämna deltagare…')
    expect(kalla('ParticipantJournal.tsx')).toContain('Ny anteckning')
    expect(KONSULENT_HJALP.length).toBeGreaterThan(0)
  })
})
