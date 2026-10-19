import { describe, expect, it } from 'vitest'
import { statistikvag, tvattaHandelse } from './besoksstatistik'

const sida = (url: string) => tvattaHandelse({ type: 'pageview', url })?.url ?? null

describe('besöksstatistiken skickar bara sidans väg', () => {
  it('läser appens väg ur hashen', () => {
    expect(sida('https://www.jobin.se/#/oversikt')).toBe('https://www.jobin.se/oversikt')
  })

  it('tar aldrig med frågesträngen', () => {
    expect(sida('https://www.jobin.se/#/job-search?q=lager&ort=Örebro')).toBe('https://www.jobin.se/job-search')
  })

  it('räknar inte CV-renderingen — adressen bär hela CV:t', () => {
    expect(sida('https://www.jobin.se/#/print/cv?data=eyJuYW1uIjoiQW5uYSJ9&template=x')).toBeNull()
  })

  it('räknar inte Visa som — adressen bär engångsnyckel och e-post', () => {
    expect(sida('https://www.jobin.se/#/visa-som?t=abc&e=demo%40jobin.se')).toBeNull()
  })

  it('byter ut id och koder', () => {
    expect(statistikvag('/consultant/participants/0b7c1d2e-3f40-4a5b-8c6d-7e8f9a0b1c2d')).toBe(
      '/consultant/participants/[id]'
    )
    expect(statistikvag('/invite/HEMLIGKOD123')).toBe('/invite/[kod]')
    expect(statistikvag('/profile/shared/xyz')).toBe('/profile/shared/[kod]')
    expect(statistikvag('/applications/42')).toBe('/applications/[id]')
  })

  it('behåller artikelns slug, som är innehåll och inte en person', () => {
    expect(statistikvag('/knowledge-base/article/cv-tips')).toBe('/knowledge-base/article/cv-tips')
  })

  it('en Supabase-token i hashen (inte en appväg) blir startsidan', () => {
    expect(sida('https://www.jobin.se/#access_token=hemligt&type=recovery')).toBe('https://www.jobin.se/')
  })

  it('publika sidor räknas på sin sökväg', () => {
    expect(sida('https://www.jobin.se/for-arbetsmarknadsenheter/')).toBe(
      'https://www.jobin.se/for-arbetsmarknadsenheter/'
    )
  })
})
