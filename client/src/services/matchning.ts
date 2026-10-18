/**
 * EN matchning med valbara faktorer (beslut Mikael 2026-10-18: "skippa flera olika
 * matchningar, bättre att välja faktorer").
 *
 * Före: tre fristående matchningar (CV, intresseguide, karriärmål) med tre
 * poängskalor som inte gick att jämföra — CV började på 20, intresse var andel ×
 * guidens procent, karriär 50–90 — och därför låg de i varsin flik. Bransch och
 * pendlingstid samlades in i profilen men användes aldrig, och branschen lästes
 * dessutom ur ett fält profilen aldrig skriver (work_preferences.industries; den
 * sparas i consultant_data.targetIndustries).
 *
 * Nu: deltagaren kryssar i vad som räknas. Två slags faktorer:
 *  - UNDERLAG avgör vad som söks på och ger poäng (önskade yrken, tidigare yrken,
 *    intresseguiden, kompetenser, utbildning).
 *  - VILLKOR filtrerar bort eller lägger till (legitimation, besvär, bransch,
 *    anställningsform, distans, körkort och bil).
 * En poängskala: den STARKASTE yrkessignalen är basen, kompetenser, utbildning och
 * villkor läggs ovanpå. Skälen följer med, så varje träff går att förklara.
 *
 * Pendlingstid används inte: portalen har ingen restidsdata, och en siffra får inte låtsas.
 */
import type { PlatsbankenJob } from './arbetsformedlingenApi'
import {
  isGenericSkill, matchSkill, matchJobTitle, checkRequiredLicense,
  matchesEmploymentType, matchesRemoteWork, matchesDriversLicense,
  type MatchTexter,
} from './jobMatching'
import { supabase } from '@/lib/supabase'
import { anvandareFranSession } from '@/lib/anvandareFranSession'

export type Faktor =
  | 'onskadeYrken' | 'tidigareYrken' | 'intresseguiden' | 'kompetenser' | 'utbildning'
  | 'legitimation' | 'besvar' | 'bransch' | 'anstallningsform' | 'distans' | 'korkort'

export const UNDERLAG: Faktor[] = ['onskadeYrken', 'tidigareYrken', 'intresseguiden', 'kompetenser', 'utbildning']
export const VILLKOR: Faktor[] = ['legitimation', 'besvar', 'bransch', 'anstallningsform', 'distans', 'korkort']
export const ALLA_FAKTORER: Faktor[] = [...UNDERLAG, ...VILLKOR]

/** Profilens branscher (profile/constants INDUSTRIES) → AF:s yrkesområden (JobTech-taxonomin, hämtad 2026-10-18). */
export const BRANSCH_TILL_YRKESOMRADE: Record<string, string> = {
  it_tech: 'Data/IT',
  healthcare: 'Hälso- och sjukvård',
  construction: 'Bygg och anläggning',
  transport: 'Transport, distribution, lager',
  retail: 'Försäljning, inköp, marknadsföring',
  education: 'Pedagogik',
  manufacturing: 'Industriell tillverkning',
  finance: 'Administration, ekonomi, juridik',
  media: 'Kultur, media, design',
  hospitality: 'Hotell, restaurang, storhushåll',
}

export interface MatchUnderlag {
  onskadeYrken: string[]
  tidigareYrken: string[]
  intresseYrken: string[]
  kompetenser: string[]
  utbildning: string[]
  /** Yrkesnamn intresseguiden lämnat bort för deltagarens stora besvär. */
  uteslutnaYrken: string[]
  branscher: string[]
  anstallningsformer: string[]
  distans: 'yes' | 'no' | 'hybrid' | null
  korkort: string[]
  harBil: boolean
}

/** Finns det något att räkna på för faktorn? Utan data går den inte att kryssa i. */
export function harData(u: MatchUnderlag, f: Faktor): boolean {
  switch (f) {
    case 'onskadeYrken': return u.onskadeYrken.length > 0
    case 'tidigareYrken': return u.tidigareYrken.length > 0
    case 'intresseguiden': return u.intresseYrken.length > 0
    case 'kompetenser': return u.kompetenser.some((k) => !isGenericSkill(k))
    case 'utbildning': return u.utbildning.length > 0
    case 'legitimation': return true
    case 'besvar': return u.uteslutnaYrken.length > 0
    case 'bransch': return u.branscher.some((b) => BRANSCH_TILL_YRKESOMRADE[b])
    case 'anstallningsform': return u.anstallningsformer.length > 0
    case 'distans': return !!u.distans
    case 'korkort': return u.korkort.length > 0 || u.harBil
  }
}

/** Aktiva = har data och är inte bortkryssade. */
export function aktivaFaktorer(u: MatchUnderlag, av: ReadonlySet<Faktor>): Set<Faktor> {
  return new Set(ALLA_FAKTORER.filter((f) => harData(u, f) && !av.has(f)))
}

const delaYrke = (namn: string) => namn.split('/').map((p) => p.replace(/\(.*?\)/g, '').trim()).filter((p) => p.length > 2)

/** Söktermerna, i prioritetsordning: det deltagaren vill först. Högst tio. */
export function soktermer(u: MatchUnderlag, aktiva: ReadonlySet<Faktor>): string[] {
  const t: string[] = []
  if (aktiva.has('onskadeYrken')) t.push(...u.onskadeYrken)
  if (aktiva.has('tidigareYrken')) t.push(...u.tidigareYrken)
  if (aktiva.has('intresseguiden')) t.push(...u.intresseYrken.slice(0, 5).flatMap(delaYrke))
  if (aktiva.has('kompetenser')) t.push(...u.kompetenser.filter((k) => !isGenericSkill(k)).slice(0, 2))
  if (aktiva.has('utbildning')) t.push(...u.utbildning.slice(0, 1))
  const sett = new Set<string>()
  return t.filter((x) => { const k = x.toLowerCase().trim(); if (!k || sett.has(k)) return false; sett.add(k); return true }).slice(0, 10)
}

export interface Poang { score: number; skal: string[] }

const svensk: MatchTexter = (_n, fallback, v) =>
  (fallback ?? '').replace(/\{\{(\w+)\}\}/g, (_m, k: string) => String((v as Record<string, unknown> | undefined)?.[k] ?? ''))

/**
 * Poäng för ett jobb, eller null om ett valt villkor filtrerar bort det.
 * `sokterm` är termen som hittade jobbet (ger en grundpoäng om inget yrke träffar).
 */
export function poangsatt(job: PlatsbankenJob, sokterm: string, u: MatchUnderlag, aktiva: ReadonlySet<Faktor>, tx: MatchTexter = svensk): Poang | null {
  const rubrik = (job.headline || '').toLowerCase()
  const yrke = (job.occupation?.label || '').toLowerCase()
  const text = `${rubrik} ${job.description?.text || ''}`.toLowerCase()
  const skal: string[] = []

  // ── Villkor som filtrerar ──
  if (aktiva.has('legitimation') && checkRequiredLicense(job.headline || '', text, u.utbildning, u.tidigareYrken).blocked) return null
  if (aktiva.has('besvar')) {
    const krock = u.uteslutnaYrken.flatMap(delaYrke).some((n) => { const l = n.toLowerCase(); return rubrik.includes(l) || yrke.includes(l) })
    if (krock) return null
  }

  // ── Basen: den starkaste yrkessignalen ──
  let bas = 0
  const hojBas = (v: number, s: string) => { if (v > bas) { bas = v; skal.unshift(s) } }
  if (aktiva.has('onskadeYrken')) {
    for (const r of u.onskadeYrken) {
      const l = r.toLowerCase()
      if (rubrik.includes(l)) hojBas(60, tx('jobs.matches.detail.desiredJob', 'Önskat yrke: {{role}}', { role: r }))
      else if (yrke.includes(l)) hojBas(50, tx('jobs.matches.detail.desiredJob', 'Önskat yrke: {{role}}', { role: r }))
      else if (text.includes(l)) hojBas(25, tx('jobs.matches.detail.nearGoal', 'Nära ditt mål: {{role}}', { role: r }))
    }
  }
  if (aktiva.has('tidigareYrken')) {
    for (const titel of u.tidigareYrken) {
      const m = matchJobTitle(titel, rubrik, yrke).match
      if (m === 'exact') hojBas(55, tx('jobs.matches.detail.workedAs', 'Du har jobbat som {{title}}', { title: titel }))
      else if (m === 'similar') hojBas(40, tx('jobs.matches.detail.similarRole', 'Liknar din roll som {{title}}', { title: titel }))
      else if (m === 'partial') hojBas(20, tx('jobs.matches.detail.relatedExperience', 'Relaterat till din erfarenhet som {{title}}', { title: titel }))
    }
  }
  if (aktiva.has('intresseguiden')) {
    for (const namn of u.intresseYrken) {
      for (const del of delaYrke(namn)) {
        const l = del.toLowerCase()
        if (rubrik.includes(l)) hojBas(45, tx('jobs.matches.detail.interest', 'Intresse: {{name}}', { name: namn }))
        else if (yrke.includes(l)) hojBas(35, tx('jobs.matches.detail.interest', 'Intresse: {{name}}', { name: namn }))
      }
    }
  }
  if (bas === 0) {
    bas = 25
    skal.push(tx('jobs.matches.detail.foundViaSearch', 'Hittades via sökningen ”{{term}}”', { term: sokterm }))
  }

  // ── Tillägg ──
  let till = 0
  if (aktiva.has('kompetenser')) {
    const traff = u.kompetenser.filter((k) => !isGenericSkill(k) && matchSkill(k, text))
    till += Math.min(traff.length * 6, 18)
    skal.push(...traff.slice(0, 3))
  }
  if (aktiva.has('utbildning') && u.utbildning.some((e) => e.toLowerCase().split(/\s+/).filter((w) => w.length > 3).some((w) => text.includes(w)))) {
    till += 8
    skal.push(tx('jobs.matches.detail.education', 'Matchar din utbildning'))
  }
  if (aktiva.has('bransch')) {
    const omrade = job.occupation_field?.label
    const valda = u.branscher.map((b) => BRANSCH_TILL_YRKESOMRADE[b]).filter(Boolean)
    if (omrade && valda.includes(omrade)) {
      till += 8
      skal.push(tx('jobs.matches.detail.industry', 'Din bransch: {{omrade}}', { omrade }))
    }
  }
  if (aktiva.has('anstallningsform')) till += matchesEmploymentType(job, u.anstallningsformer).boost
  if (aktiva.has('distans')) {
    const d = matchesRemoteWork(job, u.distans)
    till += d.boost
    if (d.boost > 0 && u.distans === 'yes') skal.push(tx('jobs.matches.detail.remote', 'Distansarbete ✓'))
  }
  if (aktiva.has('korkort')) {
    const k = matchesDriversLicense(job, u.korkort, tx)
    till += k.boost
    if (k.detail) skal.push(k.detail)
    if (u.harBil && (text.includes('egen bil') || text.includes('tillgång till bil'))) {
      till += 8
      skal.push(tx('jobs.matches.detail.hasCar', 'Har bil ✓'))
    }
  }

  return { score: Math.max(0, Math.min(100, Math.round(bas + till))), skal: [...new Set(skal)] }
}

// ── Valen sparas på kontot (user_preferences.matchning_faktorer = {"av": [...]}) ──

export const faktorValApi = {
  async hamta(): Promise<Set<Faktor>> {
    const { data: { user } } = await anvandareFranSession()
    if (!user) return new Set()
    const { data, error } = await supabase.from('user_preferences').select('matchning_faktorer').eq('user_id', user.id).maybeSingle()
    if (error) throw error
    const av = (data?.matchning_faktorer as { av?: unknown } | null)?.av
    return new Set(Array.isArray(av) ? av.filter((f): f is Faktor => (ALLA_FAKTORER as string[]).includes(f as string)) : [])
  },
  async spara(av: ReadonlySet<Faktor>): Promise<void> {
    const { data: { user } } = await anvandareFranSession()
    if (!user) throw new Error('Inte inloggad')
    const { error } = await supabase.from('user_preferences')
      .upsert({ user_id: user.id, matchning_faktorer: { av: [...av] }, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) throw error
  },
}
