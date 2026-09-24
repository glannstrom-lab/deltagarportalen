/**
 * Kötiden på flyttfliken ska följa språket.
 *
 * Prod-svepet 2026-09-24: `uppskattadKotid` var den fria svenska strängen
 * '5–15 år', som visades oöversatt i engelskt läge. Den är nu språkneutral
 * (`{ min, max }` i år) och formateras genom `career.relocation.queueYears`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { FLYTTREGIONER, formateraKotid } from '@/data/flyttdata'

vi.mock('@/services/careerApi', () => ({
  relocationApi: { get: vi.fn().mockResolvedValue(null), save: vi.fn() },
}))
vi.mock('@/services/unifiedProfileApi', () => ({
  unifiedProfileApi: { getProfile: vi.fn().mockResolvedValue(null) },
}))
vi.mock('@/services/afTrendsApi', () => ({
  trendsApi: { getPopularSearches: vi.fn().mockResolvedValue([]) },
}))

import RelocationTab from '../RelocationTab'

const NYA_EN = { career: { relocation: { queueYears: '{{min}}–{{max}} years' } } }

const tMed = (nyckel: string, reserv: string, varden: Record<string, unknown>) =>
  i18n.t(nyckel, { ...varden, defaultValue: reserv })

async function engelska() {
  i18n.addResourceBundle('en', 'translation', en, true, true)
  i18n.addResourceBundle('en', 'translation', NYA_EN, true, true)
  await i18n.changeLanguage('en')
}

describe('flyttdatans kötid', () => {
  afterEach(async () => {
    await i18n.changeLanguage('sv')
  })

  it('är tal, inte svensk text', () => {
    for (const r of FLYTTREGIONER) {
      expect(Number.isInteger(r.uppskattadKotidAr.min)).toBe(true)
      expect(Number.isInteger(r.uppskattadKotidAr.max)).toBe(true)
      expect(r.uppskattadKotidAr.max).toBeGreaterThanOrEqual(r.uppskattadKotidAr.min)
    }
  })

  it('formateras på svenska och engelska', async () => {
    expect(formateraKotid({ min: 5, max: 15 }, tMed)).toBe('5–15 år')
    await engelska()
    expect(formateraKotid({ min: 5, max: 15 }, tMed)).toBe('5–15 years')
  })

  it('RelocationTab visar kötiden på engelska i engelskt läge', async () => {
    await engelska()
    const { container } = render(<MemoryRouter><RelocationTab /></MemoryRouter>)
    expect((await screen.findAllByText('5–15 years')).length).toBeGreaterThan(0)
    expect(container.textContent).not.toMatch(/\d+–\d+ år/)
  })
})
