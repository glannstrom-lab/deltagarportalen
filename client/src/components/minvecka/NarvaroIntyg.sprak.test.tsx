/**
 * RD6 (rollspelet 2026-09-27): månadsväljaren i närvarointyget visade
 * "september 2026 / augusti 2026" i engelskt gränssnitt. Själva PDF:en är ett
 * svenskt dokument till handläggaren och är det fortfarande.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { sattLattSvenska } from '@/i18n/lattSvenska'

vi.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ select: () => ({ limit: async () => ({ data: [], error: null }) }) }) } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: (sel: (s: unknown) => unknown) => sel({ profile: null }) }))
vi.mock('@/services/aktivitetApi', () => ({ minVeckaApi: { listMySessions: vi.fn() } }))

import { NarvaroIntyg } from './NarvaroIntyg'
import type { ActivityPlan } from '@/services/aktivitetApi'

// Planen börjar innevarande månad, så väljaren har exakt en månad oavsett när testet körs.
const nu = new Date()
const plan = { start_date: `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-01` } as ActivityPlan
const SV = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
const EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const svManad = `${SV[nu.getMonth()]} ${nu.getFullYear()}`
const enManad = `${EN[nu.getMonth()]} ${nu.getFullYear()}`

afterEach(async () => {
  cleanup()
  await sattLattSvenska(false)
  await i18n.changeLanguage('sv')
})

describe('NarvaroIntyg följer språket', () => {
  it('svenska: månaderna på svenska', () => {
    render(<NarvaroIntyg plan={plan} />)
    expect(screen.getByRole('option', { name: svManad })).toBeInTheDocument()
  })

  it('engelska: månaderna på engelska', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    render(<NarvaroIntyg plan={plan} />)
    expect(screen.getByRole('option', { name: enManad })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: svManad })).toBeNull()
  })

  it('Lätt svenska: rubriken är enkel', async () => {
    await sattLattSvenska(true)
    render(<NarvaroIntyg plan={plan} />)
    expect(screen.getByRole('button', { name: 'Ladda ner intyg' })).toBeInTheDocument()
  })
})
