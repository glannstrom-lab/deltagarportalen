/**
 * Intresseguidens resultat (driftpasset 2026-09-29):
 *  1. Resultatvyn visade fortfarande matchningsprocent ("87 % match", "Utmärkt/Bra/Möjlig",
 *     "yrken (70 %+)") trots beslutet 2026-08-21: PLATS, inte procent. Talet är inte
 *     tolkbart som lämplighet (en neutral profil får 61–82 % mot varje yrke).
 *  2. ResultsView, JobCard, ICFSection och CareerRecommendationsPanel var hårdkodad
 *     svenska i engelskt läge.
 *  3. Karriärpanelen visade "Löneläge 2026" med percentiler ur tjugo handskrivna rader.
 *
 * Mutationer:
 *  · sätt tillbaka `{matchPercentage}%` i JobCard → "inga procent" faller
 *  · sätt tillbaka "Utbildning" som bar text i JobCard → "engelska" faller
 *  · sätt tillbaka scbSalaryService-uppslaget i panelen → "inga löner" faller
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@/test/utils'
import i18n from '@/i18n/config'
import ResultsTab from '../ResultsTab'
import { JobCard } from '@/components/interest-guide/JobCard'
import { CareerRecommendationsPanel } from '@/components/interest-guide/CareerRecommendationsPanel'
import { ICFSection } from '@/components/interest-guide/ICFSection'
import { calculateUserProfile, calculateJobMatches } from '@/services/interestGuideData'

vi.mock('@/components/interest-guide/ResultsView', () => ({ ResultsView: () => null }))
vi.mock('@/services/educationApi', () => ({
  educationApi: { matchByJobTitle: vi.fn(async () => ({ educations: [], source: 'ok' })) },
}))

const getProgress = vi.fn()
const getHistory = vi.fn()
vi.mock('@/services/cloudStorage', () => ({
  interestGuideApi: {
    getProgress: (...a: unknown[]) => getProgress(...a),
    getHistory: (...a: unknown[]) => getHistory(...a),
    reset: vi.fn(),
  },
}))

const profil = calculateUserProfile({})
const traffar = calculateJobMatches(profil)

beforeEach(() => {
  getProgress.mockResolvedValue({ is_completed: true, answers: {} })
  getHistory.mockResolvedValue([])
})
afterEach(() => cleanup())

const procent = /\d\s*%/

describe('Resultatfliken — plats, inte procent', () => {
  it('visar Nr 1 av N utifrån dina svar och ingen procentsiffra', async () => {
    render(<ResultsTab />)
    expect(await screen.findByText(`Nr 1 av ${traffar.length} utifrån dina svar`)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(procent)
  })
})

describe('JobCard', () => {
  it('visar platsen i stället för procent och ett neutralt stycke om vad platsen betyder', () => {
    render(<JobCard match={traffar[2]} place={3} total={traffar.length} />)
    expect(screen.getByText(`Nr 3 av ${traffar.length} utifrån dina svar`)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/Platsen visar hur nära yrkets profil ligger dina svar/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(procent)
    expect(screen.queryByText(/Detta yrke matchar väl/)).not.toBeInTheDocument()
  })

  it('följer språket: engelska rubriker i det utfällda kortet', async () => {
    const { default: en } = await import('@/i18n/locales/en.json')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    // Nycklarna i C1.json slås ihop i en.json av den som äger språkfilerna; tills dess läggs de hit.
    i18n.addResourceBundle('en', 'translation', {
      interestGuide: {
        results: { rankPlace: 'No. {{place}} of {{total}}, based on your answers' },
        jobCard: { education: 'Education', relatedJobs: 'Related jobs:', aboutPlaceTitle: 'About the ranking' },
      },
    }, true, true)
    await i18n.changeLanguage('en')
    try {
      render(<JobCard match={traffar[0]} place={1} total={traffar.length} />)
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText(`No. 1 of ${traffar.length}, based on your answers`)).toBeInTheDocument()
      expect(screen.getByText('Education')).toBeInTheDocument()
      expect(screen.getByText('Related jobs:')).toBeInTheDocument()
      expect(screen.queryByText('Utbildning')).not.toBeInTheDocument()
      expect(screen.queryByText('Relaterade yrken:')).not.toBeInTheDocument()
    } finally {
      await i18n.changeLanguage('sv')
    }
  })
})

describe('ICFSection', () => {
  it('följer språket: domännamnen och svarstexten på engelska', async () => {
    const { default: en } = await import('@/i18n/locales/en.json')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    i18n.addResourceBundle('en', 'translation', {
      interestGuide: { icf: {
        names: { energi: 'Energy and stamina' },
        answer: { good: 'You answered that this works well for you' },
        scoreOf: '{{score}} out of 5',
      } },
    }, true, true)
    await i18n.changeLanguage('en')
    try {
      render(<ICFSection scores={{ kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 }} />)
      expect(screen.getByText('Energy and stamina')).toBeInTheDocument()
      expect(screen.getAllByText('You answered that this works well for you').length).toBeGreaterThan(0)
      expect(screen.queryByText('Ork och uthållighet')).not.toBeInTheDocument()
      expect(screen.queryByText(/Du svarade att/)).not.toBeInTheDocument()
    } finally {
      await i18n.changeLanguage('sv')
    }
  })
})

describe('CareerRecommendationsPanel', () => {
  it('visar plats, inga procent och inga påhittade löner — bara en väg till SCB:s lönesök', async () => {
    render(<CareerRecommendationsPanel profile={profil} topMatches={traffar.slice(0, 5)} totalMatches={traffar.length} />)
    const forsta = await screen.findByText(`Nr 1 av ${traffar.length} utifrån dina svar`)
    expect(forsta).toBeInTheDocument()

    // Fäll ut det första yrket.
    fireEvent.click(forsta.closest('button')!)
    const lank = await screen.findByRole('link', { name: /SCB:s lönesök/ })
    expect(lank).toHaveAttribute('href', 'https://www.scb.se/hitta-statistik/sverige-i-siffror/lonesok/')

    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(procent)
    expect(text).not.toMatch(/kr\/mån|Löneläge|percentilen|Median/)
    expect(text).not.toMatch(/Utmärkt|Möjlig/)
  })

  it('följer språket: rubrik och lönehänvisning på engelska', async () => {
    const { default: en } = await import('@/i18n/locales/en.json')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    i18n.addResourceBundle('en', 'translation', {
      interestGuide: {
        results: { rankPlace: 'No. {{place}} of {{total}}, based on your answers' },
        rec: {
          title: 'Career suggestions',
          scbSalarySearch: 'the salary search from SCB (Statistics Sweden, official statistics)',
        },
      },
    }, true, true)
    await i18n.changeLanguage('en')
    try {
      render(<CareerRecommendationsPanel profile={profil} topMatches={traffar.slice(0, 5)} totalMatches={traffar.length} />)
      const forsta = await screen.findByText(`No. 1 of ${traffar.length}, based on your answers`)
      expect(screen.getByRole('heading', { name: 'Career suggestions' })).toBeInTheDocument()
      expect(screen.queryByText('Karriärrekommendationer')).not.toBeInTheDocument()
      fireEvent.click(forsta.closest('button')!)
      await waitFor(() => expect(screen.getByRole('link', { name: /salary search from SCB/ })).toBeInTheDocument())
    } finally {
      await i18n.changeLanguage('sv')
    }
  })
})
