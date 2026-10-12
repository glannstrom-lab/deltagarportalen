/**
 * KH7 + KH8 (rollspelet 2026-09-28).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="layout" data-class={className}>{children}</div>
  ),
}))
vi.mock('./consultant/OverviewTab', () => ({ OverviewTab: () => <p>ÖVERSIKT</p> }))
vi.mock('./consultant/SettingsTab', () => ({ SettingsTab: () => <p>INSTÄLLNINGAR</p> }))
vi.mock('./consultant/ParticipantsTab', () => ({ ParticipantsTab: () => <p>DELTAGARE</p> }))
const mockMedlemskap = vi.hoisted(() => ({ roller: [] as string[] }))
vi.mock('@/services/orgApi', () => ({
  orgApi: { myMemberships: async () => mockMedlemskap.roller.map((role) => ({ role })) },
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_k: string, f: string) => f }) }))

import Consultant from './Consultant'
import { flikSokvag, MOBIL_FLIKRAD_DOLJ_BOTTENNAV } from './consultantFlikar'
import { konsulentBottenNav } from '@/components/layout/konsulentNav'
import { consultantTabs } from '@/data/consultantTabs'

afterEach(() => { cleanup(); mockMedlemskap.roller = [] })

function visa(url: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/consultant/*" element={<Consultant />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('KH8: ?tab= på /consultant', () => {
  it('?tab=settings landar på Inställningar', async () => {
    visa('/consultant?tab=settings')
    expect(await screen.findByText('INSTÄLLNINGAR')).toBeInTheDocument()
  })

  it('okänd tab blir Översikt, och flikSokvag känner igen id:n', async () => {
    visa('/consultant?tab=finnsinte')
    expect(await screen.findByText('ÖVERSIKT')).toBeInTheDocument()
    expect(flikSokvag(null)).toBeNull()
    expect(flikSokvag('overview')).toBeNull()
    expect(flikSokvag('analytics')).toBe('/consultant/analytics')
  })
})

describe('KH7: mobilens övre flikrad visar bara det bottennavet saknar', () => {
  it('dolj-klassen skickas till layouten och döljer exakt bottennavets flikar', async () => {
    visa('/consultant')
    expect((await screen.findByTestId('layout')).getAttribute('data-class')).toBe(MOBIL_FLIKRAD_DOLJ_BOTTENNAV)
    // nth-child(-n+5) förutsätter att bottennavets flikar är de första, i ordning
    const n = Number(/-n\+(\d+)/.exec(MOBIL_FLIKRAD_DOLJ_BOTTENNAV)![1])
    expect(n).toBe(konsulentBottenNav.length)
    expect(consultantTabs.slice(0, n).map((t) => t.id)).toEqual(konsulentBottenNav.map((t) => t.id))
  })

  it('klassen gäller bara mobil (max-lg) och FlikRad har etiketten väljaren söker', () => {
    expect(MOBIL_FLIKRAD_DOLJ_BOTTENNAV.startsWith('max-lg:')).toBe(true)
    const skena = readFileSync(join(__dirname, '../components/layout/SidRail.tsx'), 'utf8')
    expect(skena).toMatch(/export function FlikRad[\s\S]*aria-label="Avsnitt"/)
  })
})

describe('KSL15: handläggarens flikar', () => {
  it('en direktlänk till Deltagare går till Översikt för en handläggare', async () => {
    mockMedlemskap.roller = ['handlaggare']
    visa('/consultant/participants')
    expect(await screen.findByText('ÖVERSIKT')).toBeInTheDocument()
    expect(screen.queryByText('DELTAGARE')).toBeNull()
  })

  it('en konsulent når Deltagare som förut', async () => {
    mockMedlemskap.roller = ['konsulent']
    visa('/consultant/participants')
    expect(await screen.findByText('DELTAGARE')).toBeInTheDocument()
  })

  it('?tab=settings fungerar för handläggaren, ?tab=participants gör det inte', async () => {
    mockMedlemskap.roller = ['handlaggare']
    visa('/consultant?tab=settings')
    expect(await screen.findByText('INSTÄLLNINGAR')).toBeInTheDocument()
    cleanup()
    visa('/consultant?tab=participants')
    expect(await screen.findByText('ÖVERSIKT')).toBeInTheDocument()
  })

  it('medan rollerna laddas renderas inte en dold flik, och en konsulent hamnar sedan på sin sida', async () => {
    mockMedlemskap.roller = ['konsulent']
    visa('/consultant/participants')
    expect(screen.queryByText('DELTAGARE')).toBeNull()
    expect(await screen.findByText('DELTAGARE')).toBeInTheDocument()
  })

  it('en handläggares direktlänk blinkar aldrig förbi innehållet medan rollerna laddas', async () => {
    mockMedlemskap.roller = ['handlaggare']
    visa('/consultant/participants')
    expect(screen.queryByText('DELTAGARE')).toBeNull()
    expect(await screen.findByText('ÖVERSIKT')).toBeInTheDocument()
    expect(screen.queryByText('DELTAGARE')).toBeNull()
  })
})
