/**
 * Foretag.tsx — sidans tre lägen: laddar (inget påstås), inte företag (lugnt
 * meddelande + länk till /oversikt, ingen redirect), företag (namn + flikar).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { rendera } from './__tests__/rendera'
import { ORG } from './__tests__/fixturer'

const mockKonto = vi.fn()
vi.mock('@/hooks/useForetagskonto', () => ({ useForetagskonto: () => mockKonto() }))
vi.mock('./OversiktFlik', () => ({ OversiktFlik: ({ org }: { org: { name: string } }) => <div>Översiktsflik för {org.name}</div> }))
vi.mock('./PlatserFlik', () => ({ PlatserFlik: () => <div>Platsflik</div> }))

import Foretag, { Foretag as NamedForetag } from './Foretag'

// Samma förälderrutt som App.tsx ger sidan — de inre <Routes> är relativa till den.
const sida = <Routes><Route path="/foretag/*" element={<Foretag />} /></Routes>

describe('Foretag', () => {
  beforeEach(() => mockKonto.mockReset())

  it('exporterar både default och named', () => {
    expect(Foretag).toBe(NamedForetag)
  })

  it('påstår ingenting medan medlemskapen hämtas', () => {
    mockKonto.mockReturnValue({ org: null, isLoading: true, isEmployer: false, error: null })
    rendera(sida)
    expect(screen.getByText(/hämtar ert företagskonto/i)).toBeInTheDocument()
    expect(screen.queryByText(/inte kopplat/i)).not.toBeInTheDocument()
  })

  it('utan företagskonto: lugnt meddelande med länk till översikten, ingen krasch', () => {
    mockKonto.mockReturnValue({ org: null, isLoading: false, isEmployer: false, error: null })
    rendera(sida)
    expect(screen.getByText('Det här kontot är inte kopplat till något företag')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /till din översikt/i })).toHaveAttribute('href', '/oversikt')
  })

  // 2026-09-24: rubriken, texten och länken var hårdkodad svenska och syntes
  // så i engelskt läge — sidan nås av vem som helst som hamnar på /foretag.
  it('utan företagskonto på engelska: inget svenskt i meddelandet', async () => {
    const { default: i18n } = await import('@/i18n/config')
    const { default: en } = await import('@/i18n/locales/en.json')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    try {
      mockKonto.mockReturnValue({ org: null, isLoading: false, isEmployer: false, error: null })
      rendera(sida)
      expect(screen.getByText(en.foretagskonto.notLinkedTitle)).toBeInTheDocument()
      expect(screen.getByText(en.foretagskonto.notLinkedBody)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: en.foretagskonto.toOverview })).toHaveAttribute('href', '/oversikt')
      expect(screen.queryByText(/inte kopplat|Till din översikt|Företagskonton skapas/)).not.toBeInTheDocument()
    } finally {
      await i18n.changeLanguage('sv')
    }
  })

  it('visar felet om medlemskapen inte gick att hämta — inte "inte kopplat"', () => {
    mockKonto.mockReturnValue({ org: null, isLoading: false, isEmployer: false, error: new Error('nätet borta') })
    rendera(sida)
    expect(screen.getByRole('alert')).toHaveTextContent('nätet borta')
    expect(screen.queryByText(/inte kopplat/i)).not.toBeInTheDocument()
  })

  it('med företagskonto: företagets namn som rubrik, sju flikar och översikten som index', async () => {
    mockKonto.mockReturnValue({ org: ORG, isLoading: false, isEmployer: true, error: null })
    rendera(sida)
    expect(await screen.findByText('Översiktsflik för Glänne & Söner')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Glänne & Söner' }).length).toBeGreaterThan(0)
    for (const flik of ['Översikt', 'Våra platser', 'Förslag', 'Pågående', 'Meddelanden', 'Stöd och regler', 'Om företaget']) {
      expect(screen.getAllByRole('link', { name: new RegExp(flik) }).length).toBeGreaterThan(0)
    }
  })

  it('ruttar /foretag/platser till platsfliken', async () => {
    mockKonto.mockReturnValue({ org: ORG, isLoading: false, isEmployer: true, error: null })
    rendera(sida, '/foretag/platser')
    expect(await screen.findByText('Platsflik')).toBeInTheDocument()
  })
})
