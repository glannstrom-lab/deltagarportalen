/**
 * Dagbokens skrivfrågor på engelska. `writing_prompts` har ingen engelsk
 * kolumn (15 rader i prod, mätt 2026-09-29); engelskan ligger i
 * `data/skrivfragor.ts`, nycklad på den svenska texten.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import i18n from '@/i18n/config'
import { SKRIVFRAGOR_EN, skrivfragaText } from '@/data/skrivfragor'

const { fraga } = vi.hoisted(() => ({ fraga: vi.fn() }))
vi.mock('@/lib/supabase', () => {
  const kedja: Record<string, unknown> = {}
  kedja.select = () => kedja
  kedja.eq = () => kedja
  kedja.then = (res: (v: unknown) => unknown) => res(fraga())
  return { supabase: { from: () => kedja } }
})

import { writingPromptsApi } from './diaryApi'

// Radernas text i prod 2026-09-29 (select prompt_text from writing_prompts).
const PROD = [
  'Vad gör dig unik på arbetsmarknaden?', 'Vilka är dina tre viktigaste mål just nu?',
  'Beskriv din perfekta arbetsdag.', 'Vilka framsteg har du gjort mot dina mål?',
  'Hur vill du att din framtid ska se ut?', 'Vad skulle du göra om du inte var rädd?',
  'Vad är du mest tacksam för idag?', 'Vilka styrkor har du upptäckt hos dig själv?',
  'Vem inspirerar dig och varför?', 'Om du kunde ge ditt yngre jag ett råd, vad skulle det vara?',
  'Vad ger dig energi?', 'Beskriv ett ögonblick som gjorde dig glad idag.',
  'Vad är du stolt över att ha åstadkommit?', 'Vad har du lärt dig den senaste veckan?',
  'Beskriv en utmaning du övervunnit.',
]

describe('skrivfrågor på engelska', () => {
  afterEach(async () => { await i18n.changeLanguage('sv') })

  it('varje fråga i prod har en engelsk text utan svenska tecken', () => {
    for (const q of PROD) {
      expect(SKRIVFRAGOR_EN[q], q).toBeTruthy()
      expect(SKRIVFRAGOR_EN[q]).not.toMatch(/[åäöÅÄÖ]/)
    }
  })

  it('svenska och okända frågor lämnas orörda', () => {
    expect(skrivfragaText(PROD[0], 'sv')).toBe(PROD[0])
    expect(skrivfragaText('Ny fråga utan översättning', 'en')).toBe('Ny fråga utan översättning')
  })

  it('getAll ger engelska frågor i engelskt läge och svenska annars', async () => {
    fraga.mockReturnValue({
      data: PROD.map((p, i) => ({ id: String(i), prompt_text: p, category: 'x', is_active: true })),
      error: null,
    })
    await i18n.changeLanguage('en')
    expect((await writingPromptsApi.getAll())[6].prompt_text).toBe('What are you most grateful for today?')
    await i18n.changeLanguage('sv')
    expect((await writingPromptsApi.getAll())[6].prompt_text).toBe('Vad är du mest tacksam för idag?')
  })
})
