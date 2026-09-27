/**
 * RD5/RD6 (2026-09-27): "Allt sparat" stod på svenska i engelskt gränssnitt.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { sattLattSvenska } from '@/i18n/lattSvenska'

const state = { saveStatus: 'idle', lastSavedAt: null as Date | null, hasUnsavedChanges: false, pendingCount: 0 }
vi.mock('@/stores/cvStore', () => ({ useCVStore: () => state }))

import { SaveIndicator } from './SaveIndicator'

afterEach(async () => {
  cleanup()
  await sattLattSvenska(false)
  await i18n.changeLanguage('sv')
})

describe('SaveIndicator följer språket', () => {
  it('svenska', () => {
    render(<SaveIndicator />)
    expect(screen.getByText('Allt sparat')).toBeInTheDocument()
  })

  it('engelska', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    render(<SaveIndicator />)
    expect(screen.getByText('All saved')).toBeInTheDocument()
  })

  it('Lätt svenska', async () => {
    await sattLattSvenska(true)
    render(<SaveIndicator />)
    expect(screen.getByText('Allt är sparat')).toBeInTheDocument()
  })
})
