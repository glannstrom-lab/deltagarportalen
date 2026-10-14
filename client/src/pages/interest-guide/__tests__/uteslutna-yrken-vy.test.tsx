/**
 * Vyn säger ATT yrken utelämnats och varför — på båda språken (2026-10-14).
 * En lista som tyst krymper ser ut som att guiden inte hittade fler.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@/test/utils'
import i18n from '@/i18n/config'
import { UteslutnaYrken } from '@/components/interest-guide/UteslutnaYrken'
import { allQuestions, calculateUserProfile, occupations } from '@/services/interestGuideData'

const svar = (sen: number) => ({ ...Object.fromEntries(allQuestions.map(q => [q.id, 3])), icf_sen: sen })

describe('UteslutnaYrken', () => {
  afterEach(async () => { cleanup(); await i18n.changeLanguage('sv') })

  it('redovisar antal och skäl på svenska', async () => {
    await i18n.changeLanguage('sv')
    render(<UteslutnaYrken profile={calculateUserProfile(svar(1))} yrken={occupations} />)
    expect(screen.getByText(/yrken visas inte/)).toBeInTheDocument()
    expect(screen.getByText(/Ljudtekniker – kräver ljud, ljus och andra sinnesintryck/)).toBeInTheDocument()
  })

  it('redovisar på engelska', async () => {
    const { default: en } = await import('@/i18n/locales/en.json')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    render(<UteslutnaYrken profile={calculateUserProfile(svar(1))} yrken={occupations} />)
    expect(screen.getByText(/jobs are not shown/)).toBeInTheDocument()
    expect(screen.getByText(/Ljudtekniker – needs sound, light and other sensory input/)).toBeInTheDocument()
  })

  it('ritar ingenting när inget utelämnats', () => {
    const { container } = render(<UteslutnaYrken profile={calculateUserProfile(svar(4))} yrken={occupations} />)
    expect(container.querySelector('details')).toBeNull()
  })
})
