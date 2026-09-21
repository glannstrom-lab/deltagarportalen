/**
 * Vakt mot begrepp ur regelverk som inte längre gäller (innehållsomgång 10,
 * 2026-09-21).
 *
 * Fyndet: `a-kassa-sa-fungerar-det` beskrev arbetsvillkoret och en fast
 * grundersättning via Alfa-kassan — systemet som upphörde 1 oktober 2025, när
 * den inkomstbaserade arbetslöshetsförsäkringen trädde i kraft. Artikeln
 * uppdaterades senast 2026-08-24, elva månader EFTER reformen, utan att
 * någon såg det. Samma dag skrev en agent "ett helt nytt arbetsvillkor" i en
 * ny artikel, trots att den just hade läst om reformen. Den engelska
 * versionen bar samma fel.
 *
 * Det är samma klass som de 87 döda länkarna (2026-08-23): en text om
 * omvärlden har en hållbarhetstid, och ingenting i portalen mäter den.
 * Sifferförbudet i new-articles/BRIEF.md skyddar mot föråldrade BELOPP —
 * men inte mot ett föråldrat BEGREPP, som är lika fel och ser lika säkert ut.
 *
 * Regeln: ett avskaffat begrepp får bara stå i en mening som själv säger att
 * det är avskaffat ("finns inte längre", "gällde tidigare", "det äldre …").
 * Då hjälper meningen den som läst en gammal text någon annanstans.
 *
 * Lägg till en rad i AVSKAFFAT när en regeländring upptäcks — med datum och
 * källa, så att nästa läsare kan kontrollera den. Fäller grinden på en
 * korrekt mening: skriv om meningen så att den säger att regeln är gammal,
 * lägg inte till ett undantag här.
 *
 * Vad grinden INTE ser: `content_en` (finns inte i snapshoten) och begrepp
 * ingen har lagt in i listan. Den håller ett fynd rättat; den hittar inga nya.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type Artikel = { slug: string; content: string; summary: string | null }

const SNAPSHOT = resolve(__dirname, '../../content/articles.snapshot.json')
const PUBLISH_LIST = resolve(__dirname, '../../content/publish-list.json')

const AVSKAFFAT: { monster: RegExp; vad: string }[] = [
  {
    // "arbetsvillkor" i betydelsen anställningsvillkor är levande svenska, så
    // mönstret kräver a-kassans sammanhang i SAMMA mening. Första versionen
    // krävde bestämd form och missade "kraven för medlemskap och
    // arbetsvillkor" i sommarjobb-och-extrajobb — hittad via engelskan.
    monster:
      /arbetsvillkoret|(?=[^]*\b(?:a-kassa\w*|ersättning\w*|arbetslöshetsersättning|medlemskap\w*|Alfa-kassan)\b)[^]*\barbetsvillkor/i,
    vad: 'arbetsvillkoret — ersatt av inkomstvillkoret 2025-10-01 (iaf.se, ny lag om arbetslöshetsförsäkring)',
  },
  {
    monster: /grundersättning|grundbelopp|grundförsäkring/i,
    vad: 'grundersättning/grundbelopp i a-kassan — all ersättning är inkomstbaserad sedan 2025-10-01 (iaf.se)',
  },
  {
    monster: /kassakort/i,
    vad: 'kassakort — ersättning söks per månad sedan 2025-10-01 (iaf.se)',
  },
  {
    monster: /länsstyrelsen (?:betalar|som betalar)[^.]{0,40}lönegaranti|lönegaranti[^.]{0,60}betalas ut av länsstyrelsen/i,
    vad: 'länsstyrelsen betalar lönegaranti — Skatteverket tog över 2025-02-01 (skatteverket.se)',
  },
]

/** Meningen säger själv att regeln är gammal. */
const MARKERAD_SOM_GAMMAL =
  /inte längre|finns inte kvar|gällde tidigare|tidigare gällde|det äldre|de äldre|den äldre|före reformen|avskaffa|upphör|ersatt(?:es|s)? av|har ersatts/i

function meningar(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((m) => m.trim())
    .filter(Boolean)
}

export function hittaAvskaffat(text: string): string[] {
  const fynd: string[] = []
  for (const m of meningar(text)) {
    for (const { monster, vad } of AVSKAFFAT) {
      if (monster.test(m) && !MARKERAD_SOM_GAMMAL.test(m)) {
        fynd.push(`${vad}\n      "${m.slice(0, 140)}"`)
      }
    }
  }
  return fynd
}

describe('guider: avskaffade regler', () => {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as { articles: Artikel[] }
  const publicerade = new Set(
    (JSON.parse(readFileSync(PUBLISH_LIST, 'utf8')) as { published: string[] }).published
  )

  it('ingen publicerad guide beskriver en avskaffad regel som gällande', () => {
    const fel: string[] = []
    for (const a of snapshot.articles) {
      if (!publicerade.has(a.slug)) continue
      for (const f of hittaAvskaffat(`${a.summary ?? ''}\n${a.content}`)) {
        fel.push(`  ${a.slug}: ${f}`)
      }
    }
    expect(fel, `\nAvskaffade regler beskrivna som gällande:\n${fel.join('\n')}\n`).toEqual([])
  })

  // Grinden måste kunna falla. Texterna nedan är de som faktiskt stod i prod
  // respektive i agentens leverans 2026-09-21.
  it('fäller på formuleringarna som stod i prod före rättelsen', () => {
    expect(
      hittaAvskaffat(
        'Det finns en grundersättning som hanteras av Alfa-kassan, öppen för alla som uppfyller arbetsvillkoret, oavsett medlemskap.'
      ).length
    ).toBeGreaterThan(0)
    expect(
      hittaAvskaffat('Då kan du behöva uppfylla ett helt nytt arbetsvillkor innan ersättningen betalas ut igen.')
        .length
    ).toBeGreaterThan(0)
    expect(hittaAvskaffat('Fyll i tidrapporten eller kassakortet för de dagarna.').length).toBeGreaterThan(0)
    expect(
      hittaAvskaffat('Det beror på om du uppfyller kraven för medlemskap och arbetsvillkor.').length
    ).toBeGreaterThan(0)
  })

  it('släpper igenom en mening som säger att regeln är gammal, och levande bruk av ordet', () => {
    expect(
      hittaAvskaffat('Det äldre begreppet arbetsvillkor, som byggde på arbetade timmar, finns inte längre.')
    ).toEqual([])
    expect(hittaAvskaffat('Någon fast grundersättning som är lika för alla finns inte längre.')).toEqual([])
    expect(
      hittaAvskaffat('Facket kan företräda dig i en tvist om uppsägning eller arbetsvillkor.')
    ).toEqual([])
  })
})
