/**
 * Vakt för artiklarnas byline.
 *
 * ## Vad som hände
 *
 * `articles.author` bar till 2026-08-22 **37 olika namn**, varav 36 var
 * påhittade personer. Fem artiklar om ersättningsnivåer signerades "Katarina
 * Holm, Handläggare Arbetsförmedlingen" — en person som inte finns,
 * tillskriven en myndighet, på precis de texter där myndighetsauktoritet
 * väger tyngst. Fem om depression och avslag signerades "Anna Lindberg,
 * Psykolog".
 *
 * Migrationen `20260822_artikelforfattare.sql` satte samtliga 163 artiklar
 * till en verklig, ansvarig person. Det här testet läser
 * `content/articles.snapshot.json` — samma ögonblicksbild som guidesidorna
 * byggs ur — och ser till att inget av de gamla namnen smyger tillbaka via
 * en ny artikel eller en återställd säkerhetskopia.
 *
 * Testet kan inte se prod. Det ser vad som senast hämtades DÄRIFRÅN
 * (`npm run content:refresh`), vilket är det som faktiskt publiceras.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface Ogonblicksbild {
  slug: string
  author?: string | null
  author_title?: string | null
}

// Snapshoten är ett objekt med metadata: { _generated, _source,
// generatedAt, count, articles }. Artiklarna ligger under `articles`.
const ogonblicksbild = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'content', 'articles.snapshot.json'), 'utf-8')
) as { count: number; articles: Ogonblicksbild[] }

const artiklar = ogonblicksbild.articles

/** Ordagrant ur säkerhetskopian `supabase/backups/2026-08-22-artikelforfattare.json`. */
const PAHITTADE = [
  'Maria Lindqvist',
  'Erik Johansson',
  'Lisa Bergström',
  'Katarina Holm',
  'Sara Blom',
  'Anna Lindberg',
  'Jobin-redaktionen',
  'Jobin Team',
]

/** Titlar som gör en byline till ett auktoritetsanspråk. */
const MYNDIGHETSTITLAR = [
  'Handläggare Arbetsförmedlingen',
  'Psykolog',
  'Arbetsrättsjurist',
  'Beteendevetare',
]

describe('artiklarnas byline', () => {
  it('har artiklar att granska, och metadatan stämmer med innehållet', () => {
    expect(artiklar.length).toBeGreaterThan(100)
    expect(artiklar.length).toBe(ogonblicksbild.count)
  })

  it('innehåller inget av de påhittade namnen', () => {
    const traffar = artiklar
      .filter((a) => a.author && PAHITTADE.includes(a.author))
      .map((a) => `${a.slug}: ${a.author}`)
    expect(traffar).toEqual([])
  })

  it('tillskriver ingen artikel en myndighets- eller klinikertitel utan verklig person bakom', () => {
    const traffar = artiklar
      .filter((a) => a.author_title && MYNDIGHETSTITLAR.includes(a.author_title))
      .map((a) => `${a.slug}: ${a.author_title}`)
    expect(traffar).toEqual([])
  })

  it('har en namngiven författare på varje artikel', () => {
    // 10 av 163 saknade författare helt före migrationen. En artikel utan
    // avsändare är inte bättre än en påhittad — den säger bara ingenting.
    const utan = artiklar.filter((a) => !a.author?.trim()).map((a) => a.slug)
    expect(utan).toEqual([])
  })

  it('använder EN byline — flera avsändare ska vara ett medvetet val, inte ett arv', () => {
    const bylines = new Set(artiklar.map((a) => `${a.author} | ${a.author_title ?? ''}`))
    expect([...bylines]).toEqual(['Mikael Glännström | Arbetskonsulent'])
  })
})
