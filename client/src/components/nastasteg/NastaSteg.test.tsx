/**
 * Pricken i menyn och pulsen på knappen (2026-10-19).
 * Deltagarens sammanfattning mockas — det som prövas här är att laddning inte
 * ger en prick och att pulsen läggs på och tas bort.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NastaStegBeraknare, NastaStegFokus, NastaStegPrickFor, PULS_KLASS } from './NastaSteg'
import { useNastaStegStore } from '@/stores/nastaStegStore'

const summaryMock = vi.hoisted(() => ({ state: { data: undefined as unknown, isLoading: true, isError: false } }))
vi.mock('@/hooks/useOversiktHubSummary', () => ({
  useOversiktHubSummary: () => ({ ...summaryMock.state, refetch: () => {} }),
}))

const rendera = (vag: string, ui: React.ReactNode) => render(<MemoryRouter initialEntries={[vag]}>{ui}</MemoryRouter>)

beforeEach(() => {
  useNastaStegStore.setState({ deltagare: undefined, konsulent: undefined, foretag: undefined, klickade: [] })
  summaryMock.state = { data: undefined, isLoading: true, isError: false }
})

describe('pricken', () => {
  it('ingen prick medan deltagarens data laddar — laddning är inte tomhet', () => {
    rendera('/oversikt', <><NastaStegBeraknare /><NastaStegPrickFor vag="/cv" /></>)
    expect(screen.queryByTestId('nasta-steg-prick')).toBeNull()
    expect(useNastaStegStore.getState().deltagare).toBeUndefined()
  })

  it('deltagarens mål räknas ur sammanfattningen och ger prick på rätt menyval', () => {
    summaryMock.state = {
      isLoading: false,
      isError: false,
      data: {
        profile: null,
        jobsok: { cv: null, coverLetters: [], interviewSessions: [], applicationStats: { total: 0, byStatus: {}, segments: [], awaitingSince: null }, spontaneousCount: 0, spontaneousFollowups: { count: 0, nextDate: null } },
        karriar: undefined,
        resurser: undefined,
        minVardag: undefined,
      },
    }
    rendera('/oversikt', <><NastaStegBeraknare /><NastaStegPrickFor vag="/cv" /><NastaStegPrickFor vag="/job-search" /></>)
    expect(useNastaStegStore.getState().deltagare).toEqual({ vag: '/cv', fokus: 'cv-start' })
    expect(screen.getAllByTestId('nasta-steg-prick')).toHaveLength(1)
  })

  it('ett hämtfel ger inget mål', () => {
    summaryMock.state = { data: undefined, isLoading: false, isError: true }
    rendera('/oversikt', <><NastaStegBeraknare /><NastaStegPrickFor vag="/cv" /></>)
    expect(useNastaStegStore.getState().deltagare).toBeNull()
    expect(screen.queryByTestId('nasta-steg-prick')).toBeNull()
  })

  it('konsulentens Översikt får prick med text för skärmläsare när Översikten publicerat ett steg', () => {
    useNastaStegStore.getState().satt('konsulent', { vag: '/consultant', fokus: 'konsulent-nasta' })
    rendera('/consultant/participants', (
      <>
        <NastaStegPrickFor vag="/consultant" />
        <NastaStegPrickFor vag="/consultant/participants" />
      </>
    ))
    expect(screen.getAllByTestId('nasta-steg-prick')).toHaveLength(1)
    expect(screen.getByText('Ditt nästa steg finns här')).toBeInTheDocument()
  })

  it('företagets mål okänt (Översikten har inte räknat) = ingen prick', () => {
    rendera('/foretag/forslag', <NastaStegPrickFor vag="/foretag" />)
    expect(screen.queryByTestId('nasta-steg-prick')).toBeNull()
  })
})

describe('pulsen på knappen', () => {
  it('läggs på knappen med målets nyckel och tas bort när den klickats', () => {
    useNastaStegStore.getState().satt('foretag', { vag: '/foretag', fokus: 'foretag-las-presentation' })
    rendera('/foretag', (
      <>
        <NastaStegFokus />
        <button data-nasta-steg="foretag-las-presentation">Läs presentationen</button>
        <button data-nasta-steg="annat">Annat</button>
      </>
    ))
    const knapp = screen.getByRole('button', { name: 'Läs presentationen' })
    expect(knapp.classList.contains(PULS_KLASS)).toBe(true)
    expect(screen.getByRole('button', { name: 'Annat' }).classList.contains(PULS_KLASS)).toBe(false)
    fireEvent.click(knapp)
    expect(knapp.classList.contains(PULS_KLASS)).toBe(false)
    expect(useNastaStegStore.getState().klickade).toContain('foretag-las-presentation')
  })

  it('pulserar inte på en annan sida än målets', () => {
    useNastaStegStore.getState().satt('foretag', { vag: '/foretag', fokus: 'foretag-las-presentation' })
    rendera('/foretag/platser', (
      <>
        <NastaStegFokus />
        <button data-nasta-steg="foretag-las-presentation">Läs presentationen</button>
      </>
    ))
    expect(screen.getByRole('button', { name: 'Läs presentationen' }).classList.contains(PULS_KLASS)).toBe(false)
  })
})
