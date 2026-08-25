/**
 * Aktivitetsrapporten — ren logik (O3, 2026-08-25).
 *
 * Arbetsförmedlingen vill ha en sammanställning per månad över de jobb man
 * sökt: datum, arbetsgivare, tjänst, hur man sökte och vad det ledde till.
 * Allt det finns redan i `saved_jobs`; det som saknades var vyn. Den här filen
 * håller uträkningen så att den går att testa utan att rendera något.
 *
 * **Två saker som är medvetna, inte glömda:**
 *
 * 1. **Ingen koppling mot Arbetsförmedlingens system.** Det finns inget API att
 *    skicka en aktivitetsrapport till. Vi producerar ett underlag som
 *    användaren själv fyller i på Mina sidor. En påhittad "skickad till
 *    Arbetsförmedlingen"-bekräftelse vore precis den felklassen portalen
 *    betalat av under sommaren.
 *
 * 2. **Rader utan datum utelämnas — men räknas.** Utan `applicationDate` går
 *    raden inte att placera i en månad. Att gissa fram ett datum ur
 *    `createdAt` vore ett påhittat värde: man kan spara ett jobb i mars och
 *    söka det i maj. Raderna räknas i stället i `utanDatum`, så vyn kan be
 *    användaren fylla i datumet i stället för att tyst tappa dem.
 *
 * Fältet heter `application_date` i databasen och `applicationDate` i
 * `Application`. Kolumnen `applied_at` finns i tabellen men skrivs aldrig av
 * `applicationsApi` — läs den inte, den är alltid tom.
 */

import {
  harSokt,
  type Application,
  type ApplicationMethod,
  type ApplicationStatus,
} from '@/types/application.types'

/** `YYYY-MM`. */
export type Manadsnyckel = string

export interface Rapportrad {
  id: string
  /** `YYYY-MM-DD`. */
  datum: string
  arbetsgivare: string | null
  tjanst: string | null
  /** `null` betyder "användaren har inte fyllt i det" — aldrig en gissning. */
  hurDuSokte: ApplicationMethod | null
  resultat: ApplicationStatus
  lank: string | null
}

export interface Manadsrapport {
  manad: Manadsnyckel
  rader: Rapportrad[]
  /** Sökta ansökningar som saknar datum och därför inte kan placeras i en månad. */
  utanDatum: number
}

const DATUM = /^(\d{4})-(\d{2})-(\d{2})/

/**
 * Månadsnyckel ur ett ISO-datum — genom strängen, inte genom `new Date()`.
 *
 * `new Date('2026-03-01').getMonth()` ger februari väster om Greenwich, eftersom
 * strängen tolkas som UTC-midnatt och sedan visas lokalt. En ansökan skickad den
 * 1:a hade då hamnat i fel månad i rapporten. Strängen bär redan rätt svar.
 */
export function manadsnyckel(iso: string | null | undefined): Manadsnyckel | null {
  if (!iso) return null
  const träff = DATUM.exec(iso)
  if (!träff) return null
  const månad = Number(träff[2])
  if (månad < 1 || månad > 12) return null
  return `${träff[1]}-${träff[2]}`
}

/** `YYYY-MM` för ett Date-objekt, i lokal tid. */
export function manadsnyckelAv(datum: Date): Manadsnyckel {
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`
}

/** Månaden före `manad`. Hanterar årsskifte. */
export function foregaendeManad(manad: Manadsnyckel): Manadsnyckel {
  const [år, mån] = manad.split('-').map(Number)
  return mån === 1
    ? `${år - 1}-12`
    : `${år}-${String(mån - 1).padStart(2, '0')}`
}

/**
 * Vilken månad vyn ska öppna på.
 *
 * Aktivitetsrapporten lämnas in mellan den 1:a och den 14:e för månaden som
 * just gått. Är det den 14:e eller tidigare är det alltså nästan alltid den
 * förra månaden användaren är ute efter; därefter den innevarande.
 */
export function foreslagenManad(nu: Date = new Date()): Manadsnyckel {
  const innevarande = manadsnyckelAv(nu)
  return nu.getDate() <= 14 ? foregaendeManad(innevarande) : innevarande
}

/**
 * Månader att välja mellan: de som har sökta ansökningar, plus innevarande och
 * föregående månad även när de är tomma — annars går det inte att öppna vyn för
 * en månad man ännu inte fyllt i något för. Nyast först.
 */
export function manadsalternativ(
  applications: Application[],
  nu: Date = new Date()
): Manadsnyckel[] {
  const månader = new Set<Manadsnyckel>()
  const innevarande = manadsnyckelAv(nu)
  månader.add(innevarande)
  månader.add(foregaendeManad(innevarande))

  for (const app of applications) {
    if (!harSokt(app)) continue
    const nyckel = manadsnyckel(app.applicationDate)
    if (nyckel) månader.add(nyckel)
  }

  return [...månader].sort().reverse()
}

/** Är metoden ett av de värden vi känner igen? Okänt behandlas som "inte ifyllt". */
const METODER: readonly ApplicationMethod[] = ['email', 'portal', 'linkedin', 'referral', 'other']

function normaliseraMetod(metod: string | null | undefined): ApplicationMethod | null {
  if (!metod) return null
  return METODER.includes(metod as ApplicationMethod) ? (metod as ApplicationMethod) : null
}

function forstaIckeTomma(...varden: (string | null | undefined)[]): string | null {
  for (const v of varden) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

/**
 * Bygg rapporten för en månad.
 *
 * Arkiverade ansökningar tas med: att man städat undan ett kort i tavlan ändrar
 * inte att jobbet söktes, och rapporten ska spegla månaden som var.
 */
export function byggManadsrapport(
  applications: Application[],
  manad: Manadsnyckel
): Manadsrapport {
  const rader: Rapportrad[] = []
  let utanDatum = 0

  for (const app of applications) {
    if (!harSokt(app)) continue

    const nyckel = manadsnyckel(app.applicationDate)
    if (!nyckel) {
      utanDatum += 1
      continue
    }
    if (nyckel !== manad) continue

    rader.push({
      id: app.id,
      datum: (app.applicationDate as string).slice(0, 10),
      arbetsgivare: forstaIckeTomma(app.companyName),
      tjanst: forstaIckeTomma(app.jobTitle),
      hurDuSokte: normaliseraMetod(app.applicationMethod),
      resultat: app.status,
      lank: forstaIckeTomma(app.jobUrl),
    })
  }

  rader.sort((a, b) => a.datum.localeCompare(b.datum))

  return { manad, rader, utanDatum }
}
