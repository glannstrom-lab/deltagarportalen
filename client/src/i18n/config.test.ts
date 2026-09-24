/**
 * i18n/config.ts — vad som händer när språket byts.
 *
 * Tillagt 2026-09-24 efter ett mutationsstickprov: både raden som sätter
 * `<html lang>` och raden som sparar valet i localStorage kunde tas bort ur
 * `languageChanged`-lyssnaren utan att något av elva språkrelaterade test
 * föll. Utan `lang` läser en skärmläsare engelsk text med svensk röst
 * (WCAG 3.1.1); utan sparningen är engelskan borta vid nästa sidladdning.
 */
import { describe, it, expect, afterEach } from 'vitest'
import i18n from './config'

describe('i18n — språkbyte', () => {
  afterEach(async () => {
    await i18n.changeLanguage('sv')
  })

  it('sätter lang-attributet på <html> till det nya språket', async () => {
    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')
    await i18n.changeLanguage('sv')
    expect(document.documentElement.lang).toBe('sv')
  })

  it('sparar valet i localStorage så det överlever en omladdning', async () => {
    await i18n.changeLanguage('en')
    expect(localStorage.getItem('language')).toBe('en')
    await i18n.changeLanguage('sv')
    expect(localStorage.getItem('language')).toBe('sv')
  })

  it('laddar in den engelska bundlen vid byte — annars visas svenska under engelsk flagg', async () => {
    await i18n.changeLanguage('en')
    await expect.poll(() => i18n.hasResourceBundle('en', 'translation')).toBe(true)
    await expect.poll(() => i18n.t('nav.diary')).not.toBe('Dagbok')
  })
})
