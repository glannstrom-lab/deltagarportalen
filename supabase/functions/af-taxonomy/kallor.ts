/**
 * Yrkesuppslagets tre källor — utbrutet ur index.ts 2026-09-22 (ST4) så att
 * logiken går att köra i test (index.ts kör `serve()` vid import).
 *
 * Två fel rättades samtidigt:
 *
 * 1. INGEN TIDSGRÄNS. Tre anrop i följd utan timeout: en hängande Jobtech-
 *    anslutning höll instansen tills plattformen dödade den. Klienten
 *    (`afTaxonomyApi.ts` via `retryService`) ger upp efter 10 s — så funktionen
 *    har hela sin budget inom den. Varje källa får högst `MAX_PER_KALLA_MS`,
 *    och de tre tillsammans högst `TIDSBUDGET_MS`.
 *
 * 2. FEL SÅG UT SOM "INGA YRKEN". När alla tre källorna kastade svarade
 *    funktionen 200 `{ concepts: [], source: 'none' }` — exakt samma svar som
 *    en sökning utan träffar. Klienten cachade det tomma svaret i en timme och
 *    visade "inga yrken hittades", i stället för att falla tillbaka på sin
 *    lista över vanliga yrken (vilket den gör när anropet misslyckas).
 *    Nu bär resultatet `allaFel`, och index.ts svarar 502.
 */

import { fetchMedTimeout } from '../_shared/fetchMedTimeout.ts'

export const TAXONOMY_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy'
export const JOBSEARCH_API_BASE = 'https://jobsearch.api.jobtechdev.se'

/** Hela uppslagets budget — under klientens 10 s. */
export const TIDSBUDGET_MS = 8_000
/** En enskild källas tak, så att en hängande första källa inte äter hela budgeten. */
export const MAX_PER_KALLA_MS = 4_000

export interface Concept {
  id: string
  preferred_label: string
  type: string
  definition?: string
}

export type Kalla = 'jobsearch-search' | 'taxonomy-api' | 'jobsearch-complete' | 'none'

export interface Yrkesresultat {
  concepts: Concept[]
  source: Kalla
  /** true = varje källa som prövades kastade (nät, timeout, HTTP-fel). Inte samma sak som noll träffar. */
  allaFel: boolean
}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

export interface Alternativ {
  fetchImpl?: FetchFn
  tidsbudgetMs?: number
  maxPerKallaMs?: number
}

function felText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function hamtaJson(url: string, ms: number, fetchImpl?: FetchFn): Promise<any> {
  const response = await fetchMedTimeout(url, { headers: { Accept: 'application/json' } }, ms, fetchImpl)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return await response.json()
}

async function fetchFromTaxonomy(query: string, limit: number, ms: number, fetchImpl?: FetchFn): Promise<Concept[]> {
  const url = `${TAXONOMY_API_BASE}/main/concepts?type=occupation-name&version=16&query=${encodeURIComponent(query)}&limit=${limit}`
  const data = await hamtaJson(url, ms, fetchImpl)

  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      id: item.id || item.concept_id || `concept_${Math.random().toString(36).slice(2, 11)}`,
      preferred_label: item.preferred_label || item.term || item.label,
      type: item.type || 'occupation-name',
      definition: item.definition || item.description,
    }))
  }

  return []
}

/**
 * Hämtar conceptId direkt från JobSearch:s /search-endpoint. Vi söker jobb med
 * en bred query och extraherar unika occupation-objekt (med concept_id) från
 * hits. Detta ger riktiga AF concept_ids som funkar för matchning, även
 * när taxonomy.api är nere.
 */
async function fetchFromJobSearchSearch(query: string, limit: number, ms: number, fetchImpl?: FetchFn): Promise<Concept[]> {
  const url = `${JOBSEARCH_API_BASE}/search?q=${encodeURIComponent(query)}&limit=50`
  const data = await hamtaJson(url, ms, fetchImpl)
  const seen = new Map<string, Concept>()
  const hits = Array.isArray(data?.hits) ? data.hits : []

  for (const hit of hits) {
    const occ = hit.occupation
    if (occ?.concept_id && occ.label && !seen.has(occ.concept_id)) {
      seen.set(occ.concept_id, { id: occ.concept_id, preferred_label: occ.label, type: 'occupation' })
      if (seen.size >= limit) break
    }
  }

  // Fallback: lägg till occupation_group-träffar om vi har plats kvar
  if (seen.size < limit) {
    for (const hit of hits) {
      const group = hit.occupation_group
      if (group?.concept_id && group.label && !seen.has(group.concept_id)) {
        seen.set(group.concept_id, { id: group.concept_id, preferred_label: group.label, type: 'occupation-group' })
        if (seen.size >= limit) break
      }
    }
  }

  return Array.from(seen.values())
}

/** Legacy fallback — /complete-endpoint ger occupation-namn utan concept_id. */
async function fetchFromJobSearchComplete(query: string, limit: number, ms: number, fetchImpl?: FetchFn): Promise<Concept[]> {
  const url = `${JOBSEARCH_API_BASE}/complete?q=${encodeURIComponent(query)}&limit=${limit * 2}`
  const data = await hamtaJson(url, ms, fetchImpl)
  const results: Concept[] = []

  if (Array.isArray(data?.typeahead)) {
    for (const item of data.typeahead) {
      if (item.type === 'occupation' && item.value) {
        // Inget concept_id från /complete — använd value som id (kommer ej matcha exakt).
        results.push({ id: `term_${item.value}`, preferred_label: item.value, type: 'occupation' })
        if (results.length >= limit) break
      }
    }
  }

  return results
}

const KALLOR: Array<{ namn: Exclude<Kalla, 'none'>; hamta: typeof fetchFromTaxonomy }> = [
  // Primär källa: JobSearch /search — ger riktiga concept_ids från aktiva jobb.
  { namn: 'jobsearch-search', hamta: fetchFromJobSearchSearch },
  // Sekundär: taxonomy.api (när den fungerar)
  { namn: 'taxonomy-api', hamta: fetchFromTaxonomy },
  // Sista fallback: /complete (utan concept_ids — fritext-matchning)
  { namn: 'jobsearch-complete', hamta: fetchFromJobSearchComplete },
]

export async function getOccupations(query: string, limit: number, alt: Alternativ = {}): Promise<Yrkesresultat> {
  if (!query || query.length < 2) {
    return { concepts: [], source: 'none', allaFel: false }
  }

  const budget = alt.tidsbudgetMs ?? TIDSBUDGET_MS
  const perKalla = alt.maxPerKallaMs ?? MAX_PER_KALLA_MS
  const deadline = Date.now() + budget
  let nagonSvarade = false

  for (const kalla of KALLOR) {
    const kvar = deadline - Date.now()
    if (kvar <= 0) {
      console.log(`[af-taxonomy] Tidsbudgeten slut före ${kalla.namn}`)
      break
    }
    try {
      const concepts = await kalla.hamta(query, limit, Math.min(perKalla, kvar), alt.fetchImpl)
      nagonSvarade = true
      if (concepts.length > 0) {
        return { concepts, source: kalla.namn, allaFel: false }
      }
    } catch (error) {
      console.log(`[af-taxonomy] ${kalla.namn} misslyckades: ${felText(error)}`)
    }
  }

  return { concepts: [], source: 'none', allaFel: !nagonSvarade }
}
