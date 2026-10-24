/**
 * Ett bra nästa steg — regellogiken bakom Översiktens första kort.
 *
 * (2026-09-10, beslut Mikael efter designförslaget för Översikt.)
 *
 * Sidan visade sexton likadana rader och tog inte ställning till något. En
 * följeslagare säger först vad som vore bra att göra. Det här är den funktion
 * som avgör VAD — ett enda förslag, plus två alternativ för den som hellre
 * vill något annat. Aldrig en lista på tre likvärdiga.
 *
 * ── Regeln som styr varje kandidat ─────────────────────────────────────────
 *
 * Kortet lovar bara sådant portalen kan belägga (ROADMAP B31, lärdomen
 * 2026-08-09: ett påhittat värde har alltid föredragits framför ett tomt
 * fält). Varje kandidat har ett villkor som läser ETT faktum ur sammanfattningen:
 *
 *   dagens pass          konsulent finns och dagens pass är varken incheckat,
 *                        markerat eller frånvaroanmält (2026-10-19: deltagarens
 *                        styrning ledde aldrig till Min vecka, fast passet är
 *                        det viktigaste för den som har aktivitetskrav)
 *   följ upp ansökan     `awaitingSince` ≥ 7 dagar gammalt. Utan datum: inget
 *                        förslag, för då vet vi inte hur länge.
 *   spontanansökan       en uppföljning förfaller inom tre dagar
 *   intervju             en kalenderhändelse av typen intervju i dag eller i morgon
 *                        (FN2) — leder till intervjusimulatorn, inte kalendern
 *   hur gick intervjun   en intervju låg igår eller dagen före (FN3). Källan är
 *                        kalenderhändelsen: `saved_jobs.interview_date` är ifyllt
 *                        på 0 av 46 rader i prod (mätt 2026-10-24)
 *   kalender             en annan händelse i dag eller i morgon
 *   första steget       välkomstturen hoppades över och inget av stegen cv/intresse/
 *                        jobbsök/karriär/spontan är gjort (FN5). Mjukt kort till CV-byggaren;
 *                        ersätter "skapa CV" för just dessa personer
 *   skapa CV             `cv === null`
 *   fyll på CV           CV:t inte ändrat på 90 dagar
 *   första jobbet        CV finns, inga ansökningar
 *   första brevet        ansökningar finns, inga brev
 *   kompetensanalys      ingen gjord
 *   mående               ingen loggning de senaste sju dagarna
 *
 * Ordningen är fallande angelägenhet: sådant som har ett datum som rinner
 * (svar, uppföljning, möte) före sådant som bara är ogjort. Finns inget
 * villkor uppfyllt returneras null och kortet ritas inte — ett steg utan
 * underlag visas inte.
 *
 * Ren funktion utan React och utan i18n. Texterna slås upp i `NastaSteg.tsx`
 * ur nyckeln `hubOverview.nasta.<id>.*`; här bestäms bara id, mål och de
 * värden texten behöver. Så går logiken att testa utan en enda rendering.
 */

import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'

export type StegId =
  | 'todaysPass'
  | 'followUp'
  | 'spontaneous'
  | 'interview'
  | 'interviewDone'
  | 'event'
  | 'firstStep'
  | 'createCv'
  | 'updateCv'
  | 'firstJob'
  | 'firstLetter'
  | 'skills'
  | 'mood'

export interface Steg {
  id: StegId
  /** Rutt som knappen leder till. */
  till: string
  /** Ett andra val, när steget har två knappar (FN3: ansökan + dagboken). */
  sekundar?: { till: string }
  /** Värden som texterna interpolerar. Bara det som faktiskt finns. */
  varden: {
    /** Dagar sedan (följ upp). */
    dagar?: number
    /** ISO-datum för det steget bygger på (CV:ts updated_at, händelsens datum …). */
    datum?: string
    /** Händelsens titel. */
    titel?: string
    /** true = i dag, false = i morgon. */
    idag?: boolean
  }
}

export interface NastaSteg {
  primar: Steg
  alternativ: Steg[]
}

const DYGN = 86_400_000

function dagarSedan(iso: string | null | undefined, nu: Date): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return Math.floor((nu.getTime() - d.getTime()) / DYGN)
}

/** Lokal kalenderdag som YYYY-MM-DD, så en händelse "i dag" jämförs mot rätt dag. */
function lokaltDatum(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dag}`
}

export const FOLJ_UPP_EFTER_DAGAR = 7
export const CV_GAMMALT_EFTER_DAGAR = 90
export const UPPFOLJNING_INOM_DAGAR = 3
/** "Hur gick intervjun?" visas dagen efter och dagen därpå — sedan lämnar vi personen i fred. */
export const INTERVJU_FRAGA_DAGAR = 2

/**
 * Räknar fram alla kandidater vars villkor är uppfyllda, i angelägenhetsordning.
 * Exporterad för testerna; vyn använder `valjNastaSteg`.
 */
export function kandidater(s: OversiktSummary, nu: Date = new Date()): Steg[] {
  const ut: Steg[] = []
  const jobsok = s.jobsok
  const karriar = s.karriar
  const vardag = s.minVardag

  // 0. Dagens pass, för den som har en konsulent. Går före allt annat: ett
  // pass har en tid som rinner ut i dag, och närvaron är det aktivitetskravet
  // bygger på. Bara när passet varken är incheckat, markerat eller anmält —
  // annars finns inget för deltagaren att göra.
  const pass = vardag?.nastaPass
  if (
    vardag?.consultant &&
    pass &&
    pass.date === lokaltDatum(nu) &&
    !pass.self_checkin_at &&
    !pass.attendance &&
    !pass.absence_reported_at
  ) {
    ut.push({
      id: 'todaysPass',
      till: '/min-vecka',
      varden: { titel: pass.title, datum: pass.date },
    })
  }

  // 0b. En intervju i dag eller i morgon (FN2). Går före uppföljningar: en
  // intervju har en tid, och förberedelsen är det som hjälper mest nu.
  const idag = lokaltDatum(nu)
  const imorgon = lokaltDatum(new Date(nu.getTime() + DYGN))
  const intervju = (vardag?.upcomingEvents ?? []).find(
    (e) => e.type === 'interview' && (e.date === idag || e.date === imorgon)
  )
  if (intervju) {
    ut.push({
      id: 'interview',
      till: '/interview-simulator',
      varden: { titel: intervju.title, datum: intervju.date, idag: intervju.date === idag },
    })
  }

  // 0c. Intervjun var nyss (FN3). Frågan ställs en gång, utan poäng, och med
  // två vägar vidare. Ingen tidpunkt påstås — bara datumet vet vi.
  const gammal = vardag?.senasteIntervju
  if (gammal) {
    const tidigast = lokaltDatum(new Date(nu.getTime() - INTERVJU_FRAGA_DAGAR * DYGN))
    if (gammal.date < idag && gammal.date >= tidigast) {
      ut.push({
        id: 'interviewDone',
        till: '/applications',
        sekundar: { till: '/diary' },
        varden: { titel: gammal.title, datum: gammal.date },
      })
    }
  }

  // 1. En ansökan har väntat på svar länge nog för att en fråga är rimlig.
  const vantatDagar = dagarSedan(jobsok?.applicationStats?.awaitingSince, nu)
  if (vantatDagar !== null && vantatDagar >= FOLJ_UPP_EFTER_DAGAR) {
    ut.push({ id: 'followUp', till: '/applications', varden: { dagar: vantatDagar } })
  }

  // 2. En spontanansökan har en uppföljning som förfaller snart (eller redan).
  const nasta = jobsok?.spontaneousFollowups?.nextDate
  if (nasta) {
    const grans = new Date(nu.getTime() + UPPFOLJNING_INOM_DAGAR * DYGN)
    if (nasta <= lokaltDatum(grans)) {
      ut.push({ id: 'spontaneous', till: '/spontanansökan', varden: { datum: nasta } })
    }
  }

  // 3. Något inbokat i dag eller i morgon.
  // Intervjuer har ett eget steg ovan — de dubbleras inte här.
  const handelse = (vardag?.upcomingEvents ?? []).find(
    (e) => e.type !== 'interview' && (e.date === idag || e.date === imorgon)
  )
  if (handelse) {
    ut.push({
      id: 'event',
      till: '/calendar',
      varden: { titel: handelse.title, datum: handelse.date, idag: handelse.date === idag },
    })
  }

  // 3b. Välkomstturen hoppades över och inget första steg är taget (FN5).
  // Lägre än allt som har ett datum. Försvinner av sig självt så fort ett av
  // stegen markeras. Kräver att CV inte redan finns, och ersätter då "skapa CV".
  const prog = s.profile?.onboarding_progress
  const forstaSteg =
    prog?.valkomstHoppad === true &&
    !prog.cv && !prog.interest && !prog.jobSearch && !prog.career && !prog.spontaneous &&
    !jobsok?.cv
  if (forstaSteg) ut.push({ id: 'firstStep', till: '/cv', varden: {} })

  // 4–5. CV:t: saknas helt, eller är gammalt.
  // `jobsok` undefined betyder att skivan inte är hämtad — då vet vi inget om
  // CV:t och föreslår inget om det. `cv === null` är däremot ett faktum.
  if (jobsok && jobsok.cv === null && !forstaSteg) {
    ut.push({ id: 'createCv', till: '/cv', varden: {} })
  } else if (jobsok?.cv) {
    const cvDagar = dagarSedan(jobsok.cv.updated_at, nu)
    if (cvDagar !== null && cvDagar >= CV_GAMMALT_EFTER_DAGAR) {
      ut.push({ id: 'updateCv', till: '/cv', varden: { datum: jobsok.cv.updated_at, dagar: cvDagar } })
    }
  }

  // 6. CV finns men inga ansökningar alls.
  const antalAns = jobsok?.applicationStats?.total ?? 0
  if (jobsok?.cv && antalAns === 0) {
    ut.push({ id: 'firstJob', till: '/job-search', varden: {} })
  }

  // 7. Ansökningar finns men inget brev.
  if (jobsok && antalAns > 0 && jobsok.coverLetters.length === 0) {
    ut.push({ id: 'firstLetter', till: '/cover-letter', varden: {} })
  }

  // 8. Ingen kompetensanalys gjord. Kräver att karriärskivan är hämtad.
  if (karriar && karriar.latestSkillsAnalysis === null) {
    ut.push({ id: 'skills', till: '/skills-gap-analysis', varden: {} })
  }

  // 9. Ingen måendeloggning på en vecka.
  if (vardag) {
    const senaste = vardag.recentMoodLogs[0]?.log_date
    const d = dagarSedan(senaste, nu)
    if (d === null || d >= 7) {
      ut.push({ id: 'mood', till: '/wellness', varden: {} })
    }
  }

  return ut
}

/**
 * Ett förslag och upp till två alternativ. `null` när inget villkor är uppfyllt
 * eller när sammanfattningen saknas — kortet visas då inte alls.
 */
export function valjNastaSteg(s: OversiktSummary | undefined, nu: Date = new Date()): NastaSteg | null {
  if (!s) return null
  const [primar, ...rest] = kandidater(s, nu)
  if (!primar) return null
  return { primar, alternativ: rest.slice(0, 2) }
}
