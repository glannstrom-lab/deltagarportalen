/**
 * RR22 (rollspelet 2026-09-27): på söndagen bedömde kortet innevarande vecka
 * som avslutad. Klockan står här på söndag 27 sep 2026 kl. 10 lokal tid.
 * Kortet ska också säga rakt ut att eget jobbsökande inte räknas (RR1).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AvtalskravKort } from './AvtalskravKort'

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: { listAll: vi.fn(async () => []), listSessionsBetween: vi.fn(async () => []) },
}))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({ fetchCachedConsultantParticipants: vi.fn(async () => []) }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 27, 10, 0, 0)) // söndag 27 sep 2026
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

describe('AvtalskravKort på en söndag (RR22)', () => {
  it('klipper vid förra söndagen, inte vid dagens', async () => {
    render(<QueryClientProvider client={new QueryClient()}><AvtalskravKort /></QueryClientProvider>)
    expect(await screen.findByText(/Avslutade veckor 1 september 2026 – 20 september 2026/)).toBeInTheDocument()
    expect(screen.queryByText(/– 27 september 2026/)).not.toBeInTheDocument()
  })

  it('skriver regeln om eget jobbsökande på kortet (RR1)', async () => {
    render(<QueryClientProvider client={new QueryClient()}><AvtalskravKort /></QueryClientProvider>)
    expect(await screen.findByText(/Eget jobbsökande räknas inte/)).toBeInTheDocument()
  })
})
