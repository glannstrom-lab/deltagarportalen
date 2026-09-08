/**
 * Vakt för guidernas procentpåståenden (KG2, projektgenomgången 2026-09-07).
 *
 * `tools-json-pastaenden.test.ts` vaktar de 18 verktygssidorna, men de 238
 * publicerade guiderna i `content/articles.snapshot.json` stod oskyddade.
 * Räknat 2026-09-08: 27 stycken i 25 artiklar bar en procentsats om
 * omvärlden utan källa och utan år — "upp till 75 % av alla CV:n ses aldrig
 * av en människa" (fem artiklar), "70 % av alla jobb tillsätts via
 * kontakter" (fem), "87 % av rekryterare använder LinkedIn" (två), "65 % av
 * dagens barn kommer arbeta i yrken som inte finns". Flera stod under
 * rubriken "Statistik". Ingen av dem gick att spåra.
 *
 * Det är inte 27 fel utan en vana — samma som lärdomen "Ett påhittat värde
 * har alltid föredragits framför ett tomt fält": en siffra ser trovärdigare
 * ut än "många", och just därför står den kvar i åratal utan att någon
 * frågar var den kommer ifrån.
 *
 * Regeln som vaktas: **en procentsats om omvärlden får bara stå med källa
 * och år i samma sektion.** Sektion = texten från en `#`/`##`-rubrik till
 * nästa. "Källa" = `enligt …`, `källa`, en markdown-länk, eller ett namngivet
 * statistikorgan (SCB, Arbetsförmedlingen). Utan det ska meningen formuleras
 * utan siffra.
 *
 * Vad grinden INTE rör, med flit:
 *   - CV-exempel ("Ökade försäljningen med 25%") — det är exempeltext som
 *     läsaren ska anpassa, inte ett påstående om världen.
 *   - Regelsatser ("sjuklön är 80 % av lönen", "arbetsgivaravgift 31,42 %") —
 *     de vaktas av innehållsregeln "ingen siffra som är en regel" i
 *     new-articles/BRIEF.md, som är en annan klass.
 *   - Råd ("sikta 10–15 % över ditt mål", "ögonkontakt 60–70 % av tiden").
 *   - Engelskan: `content_en` finns inte i snapshoten. Skriptet
 *     `apply-procent-rattelser.cjs` rättar den i samma slug, men grinden ser
 *     bara svenskan.
 *
 * Mönstren nedan är härledda ur korpusen, inte hittade på: varje gren
 * motsvarar en formulering som faktiskt förekom. Fäller grinden på något som
 * är ett riktigt sourcat påstående — lägg till källan i stycket, inte ett
 * undantag här.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type Artikel = { slug: string; title: string; summary: string | null; content: string }

const SNAPSHOT = resolve(__dirname, '../../content/articles.snapshot.json')
const PUBLISH_LIST = resolve(__dirname, '../../content/publish-list.json')

/** En procentsats: "75%", "50-70 %", "12.5%", "0,2 procent", "51 percent". */
const PROCENT = '\\d[\\d,.\\-–]*\\s?(?:%|procent|percent)'

/**
 * Populationer som en procentsats gör ett påstående OM. "80 % av lönen",
 * "60 % av kraven", "60 % av bilden" finns inte här — de är regler och råd.
 */
const POPULATION =
  '(?:alla|allt|dagens|svenska|de\\s|jobb|jobben|tjänster|CV|cv|arbetsgivar|rekryterar|jobbsökar|kandidat|människor|arbetskraft|tillsatta|barn|befolkning|förvärvsarbetande|inskrivna|samtliga|ökningen' +
  '|all\\s|today|Swedish|employer|recruiter|job|position|CVs|résumé|resume|candidate|people|the workforce|children|hire|those)'

const PASTAENDE_MONSTER: RegExp[] = [
  // "75 % av alla CV:n", "70 % av arbetsgivare", "51 procent av de arbetsgivare"
  new RegExp(`${PROCENT}\\s+(?:av|of)\\s+(?:all\\s+|alla\\s+|dagens\\s+|svenska\\s+|the\\s+|de\\s+)?${POPULATION}`, 'i'),
  // "7–10 % mer", "12.5 % högre produktivitet" — men inte rådet "10–20 % högre än din mållön"
  new RegExp(`${PROCENT}\\s+(?:högre|mer|fler|lägre|färre|higher|more|fewer|lower)\\b(?!\\s+(?:än|than)\\s+(?:din|ditt|dina|your)\\b)`, 'i'),
  // "54 % har avfärdat kandidater"
  new RegExp(`${PROCENT}\\s+(?:har|använder|googlar|accepterar|tillsätts|annonseras|sorteras|avvisas|have|use|google|accept|are)\\b`, 'i'),
  // "+15–20 % jämfört med rikssnittet"
  new RegExp(`[+-]${PROCENT}\\s+(?:jämfört|compared)`, 'i'),
  // Ett stycke som utropar sig till statistik och bär en procentsats
  new RegExp(`(?:statistik|studier visar|forskning visar|statistics|studies show|research shows)[\\s\\S]*${PROCENT}`, 'i'),
]

const AR = /\b(?:19|20)\d{2}\b/
const KALLA = /\benligt\b|\baccording to\b|\bkälla\b|\bsource\b|\]\(https?:\/\/|\bSCB\b|Arbetsförmedlingen|Statistics Sweden|Swedish Public Employment Service/i

/** Delar texten i sektioner vid varje `#`/`##`-rubrik; ingressen före första rubriken är en egen sektion. */
const sektioner = (text: string): string[] => text.split(/\n(?=##? )/)
const stycken = (sektion: string): string[] => sektion.split(/\n\s*\n/)

/**
 * Returnerar de stycken som bär ett procentpåstående om omvärlden utan att
 * sektionen de står i anger både källa och år.
 */
export function osparbaraProcentpastaenden(text: string): string[] {
  const fynd: string[] = []
  for (const sektion of sektioner(text)) {
    const sourcad = AR.test(sektion) && KALLA.test(sektion)
    if (sourcad) continue
    for (const stycke of stycken(sektion)) {
      if (PASTAENDE_MONSTER.some((re) => re.test(stycke))) fynd.push(stycke.trim())
    }
  }
  return fynd
}

describe('guiderna påstår inga procentsatser om omvärlden utan källa och år', () => {
  it('klassificeraren fäller de formuleringar som fanns i korpusen (positiv kontroll)', () => {
    // Utan den här kontrollen hade en regex som slutat matcha gjort hela
    // sviten grön av fel skäl — samma fälla som antalCvMallar() i
    // tools-json-pastaenden.test.ts skyddar sig mot.
    const kanda = [
      '**Statistik:** Upp till 75% av alla CV:n avvisas av ATS innan en människa ser dem!',
      '- **70% av arbetsgivare** googlar kandidater före intervju',
      '85% av rekryterare googlar kandidater innan de kallar till intervju.',
      '- 54% har avfärdat kandidater baserat på vad de hittat online',
      '- De som förhandlar lön tjänar i snitt 7-10% mer',
      '- Stockholm: +15-20% jämfört med rikssnittet',
      '- Team som fokuserar på styrkor har **12.5% högre produktivitet**',
      '- **65% av dagens barn** kommer arbeta i yrken som ännu inte finns',
      'Studier visar att över 70% av svenska arbetsgivare googlar kandidater.',
      'Uppskattningar varierar, men 50-70% av tjänster tillsätts utan annons.',
      'Did you know that up to 70% of all jobs are never advertised?',
      '- **87% of recruiters** use LinkedIn to find candidates',
    ]
    for (const rad of kanda) {
      expect(osparbaraProcentpastaenden(rad), rad).toHaveLength(1)
    }
  })

  it('klassificeraren friar CV-exempel, regelsatser, råd och sourcade stycken', () => {
    const friade = [
      '"Ökade försäljningen med 25% under Q3 2024 genom uppsökande kundarbete"',
      'Dag 2-14: Du får sjuklön från arbetsgivaren. Det är 80% av din vanliga lön.',
      'Avgifter som arbetsgivaren betalar utöver din lön (ca 31,42% av bruttolönen).',
      '- Regel: 10-15% över ditt mål',
      '**Tips:** Sikta 10-20% högre än din mållön när du säger din siffra.',
      '- Ca 60-70% av tiden',
      'Deltid anges ofta i procent (t.ex. 75% = 30 tim/vecka).',
      '- Fyll i profilen till 100%',
      '- Matchar jag minst 60% av kraven?',
      // Sourcat: källa OCH år i samma sektion
      '## Läget\n\nEnligt SCB:s framskrivningar från april 2026 väntas utrikes födda stå för nära 70 procent av ökningen i arbetsför ålder.',
      '## Läget\n\nVåren 2026 uppgav 51 procent av de arbetsgivare som försökt rekrytera att de stött på problem, enligt Arbetsförmedlingens rapport Arbetsmarknadsutsikterna våren 2026.',
    ]
    for (const rad of friade) {
      expect(osparbaraProcentpastaenden(rad), rad).toHaveLength(0)
    }
    // Källa UTAN år räcker inte — och år utan källa räcker inte.
    expect(osparbaraProcentpastaenden('Enligt en undersökning googlar 70% av arbetsgivare kandidater.')).toHaveLength(1)
    expect(osparbaraProcentpastaenden('År 2024 googlade 70% av arbetsgivare kandidater.')).toHaveLength(1)
  })

  it('källfönstret är sektionen — ett år i en annan sektion friar inte', () => {
    const text =
      '## Bakgrund\n\nEnligt SCB (2026) ökar sysselsättningen.\n\n## Nätverk\n\nUpp till 70% av alla jobb tillsätts via nätverk.'
    expect(osparbaraProcentpastaenden(text)).toHaveLength(1)
  })

  it('varje publicerbar guide är fri från ospårbara procentpåståenden', () => {
    const snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as { articles: Artikel[] }
    const publicerade = new Set<string>((JSON.parse(readFileSync(PUBLISH_LIST, 'utf8')) as { published: string[] }).published)
    // Positiv kontroll: en tom publiceringslista hade gjort loopen meningslös.
    expect(publicerade.size).toBeGreaterThan(100)

    const fynd: string[] = []
    let granskade = 0
    for (const a of snapshot.articles) {
      if (!publicerade.has(a.slug)) continue
      granskade++
      for (const falt of ['title', 'summary', 'content'] as const) {
        for (const stycke of osparbaraProcentpastaenden(a[falt] ?? '')) {
          fynd.push(`${a.slug} [${falt}]: ${stycke.replace(/\s+/g, ' ').slice(0, 140)}`)
        }
      }
    }
    expect(granskade).toBeGreaterThan(100)
    expect(
      fynd,
      `${fynd.length} stycken bär en procentsats om omvärlden utan källa och år i samma sektion. ` +
        'Skriv om utan siffra ("många", "en del") eller lägg till källa + år i stycket — se filhuvudet. ' +
        'Rättelser till prod går genom scripts/apply-procent-rattelser.cjs.\n  ' +
        fynd.join('\n  ')
    ).toEqual([])
  })
})
