/**
 * A32 — CORS-ytan i `client/api/`.
 *
 * BAKGRUND. Tre av fyra serverlösa funktioner släppte in vilken vercel.app-deploy som
 * helst vars projektnamn började med `deltagarportal`, via mönstret
 * `deltagarportal(en)?-<hash>-<vem-som-helst>.vercel.app`. Vem som helst kan skapa ett
 * Vercel-projekt med det namnet. Verifierat mot skarp drift 2026-09-01: en påhittad
 * `deltagarportalen-abc123-evilteam.vercel.app` reflekterades tillbaka i
 * `Access-Control-Allow-Origin`, med credentials-rubriken satt. En helt främmande origin
 * föll korrekt tillbaka på produktionsdomänen — det var just namnlikheten som öppnade.
 *
 * VARFÖR EN KÄLLKODSVAKT OCH INTE ETT ENHETSTEST. Filerna i `client/api/` är Vercels
 * handlers och drar in Supabase-klient, rate-limiter och promptbibliotek vid import. Att
 * importera dem i vitest hade prövat allt utom det som ska prövas. Samma grepp som
 * `ai-sanningsregel.test.ts`.
 *
 * VAKTEN MATCHAR KODFORMEN, INTE ORDET. `'Access-Control-Allow-Credentials':` med
 * citattecken och kolon förekommer bara i kod; själva ordet står också i filernas
 * förklarande kommentarer. En vakt som matchar sin egen förklaring kan aldrig bli grön —
 * det kostade en halv felsökning den 21 augusti, och en gång till i det här passet.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** De tre filer som hade det förfalskningsbara mönstret. */
const FILER = ['ai.js', 'job-alerts.js', 'cv-pdf.js']

/** Den fjärde har aldrig haft vare sig mönstret eller credentials-rubriken. */
const OVRIGA = ['upload-image.js']

function las(fil: string): string {
  return readFileSync(resolve(__dirname, '../../api', fil), 'utf8')
}

describe('A32 — ingen serverlös funktion litar på ett vercel.app-NAMN', () => {
  it.each([...FILER, ...OVRIGA])('%s matchar inte vercel.app-URL:er med ett mönster', (fil) => {
    const kod = las(fil)
    expect(kod).not.toMatch(/vercel\\\.app\$/)
    expect(kod).not.toContain('isVercelPreviewUrl')
  })

  it.each(FILER)('%s tillåter i stället deployens egen URL ur Vercels systemvariabler', (fil) => {
    const kod = las(fil)
    // Alla tre behövs: VERCEL_URL är deployens unika URL, VERCEL_BRANCH_URL den
    // grenstabila, VERCEL_PROJECT_PRODUCTION_URL produktionsdomänen. Plattformen sätter
    // dem — ett annat projekt kan inte göra det.
    expect(kod).toContain('process.env.VERCEL_URL')
    expect(kod).toContain('process.env.VERCEL_BRANCH_URL')
    expect(kod).toContain('process.env.VERCEL_PROJECT_PRODUCTION_URL')
  })
})

describe('A32 — credentials-rubriken är borta', () => {
  it.each([...FILER, ...OVRIGA])('%s sätter den inte', (fil) => {
    // Kodformen, inte ordet. Se filhuvudet.
    expect(las(fil)).not.toContain("'Access-Control-Allow-Credentials':")
  })

  it('och klientkoden begär inga cookies, så rubriken hade ingen funktion', () => {
    // Om den här faller har någon infört cookie-baserad auth. Då måste
    // credentials-frågan tas om från början — inte återinföras rakt av.
    const kod = las('ai.js')
    expect(kod).not.toContain('credentials: ')
  })
})
