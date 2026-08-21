/**
 * Sätten att synas, och idéerna till inlägg.
 *
 * Listan var tidigare skriven för en konsult som bygger personligt varumärke:
 * "Gästa poddar — erbjud dig som gäst i ditt expertområde", "Tala på
 * branschevent", "Skriv LinkedIn-artiklar … visar djup expertis". För någon
 * som varit utan arbete länge är det inte höga krav utan fel adress — samma
 * fynd som Internationellt-sidan fick 2026-08-20 ("sidan var skriven för fel
 * person"). Tre poster är utbytta mot sådant som går att göra i morgon.
 *
 * Varje strategi bar dessutom TVÅ omdömen utan källa: `difficulty`
 * ("Avancerat") och `impact` ("Hög påverkan"), renderade som faktaetiketter.
 * Portalen talade om för en arbetssökande att poddar har hög påverkan på
 * hennes chans att få jobb — en gissning som såg ut som statistik. Kvar är
 * `energi`, som beskriver vad det kostar henne, inte vad det ger.
 *
 * `strategy_id` lagras i `visibility_progress`. Tabellen har 0 rader i prod
 * (mätt 2026-08-21), så id-bytena tappar ingens framsteg.
 */

export type Energi = 'lag' | 'medel' | 'hog'
export type Synlighetskategori = 'content' | 'engagement' | 'networking' | 'platform'

export interface Synlighetssatt {
  id: string
  energi: Energi
  /** Ungefärlig tid. Beskriver omfattning, inte ett löfte om resultat. */
  tid: 'kort' | 'halvtimme' | 'timme' | 'varierar'
  category: Synlighetskategori
  /** Vart hjälpen finns, när det finns någon. */
  lank?: string
}

export const SYNLIGHETSSATT: readonly Synlighetssatt[] = [
  { id: 'linkedin-engage', energi: 'lag', tid: 'kort', category: 'engagement' },
  { id: 'share-articles', energi: 'lag', tid: 'kort', category: 'content' },
  { id: 'ask-recommendation', energi: 'lag', tid: 'kort', category: 'networking' },
  { id: 'reach-out', energi: 'lag', tid: 'halvtimme', category: 'networking' },
  { id: 'join-groups', energi: 'lag', tid: 'halvtimme', category: 'engagement' },
  { id: 'write-posts', energi: 'medel', tid: 'halvtimme', category: 'content', lank: '/linkedin-optimizer' },
  { id: 'local-meet', energi: 'medel', tid: 'varierar', category: 'networking' },
  { id: 'portfolio-page', energi: 'medel', tid: 'timme', category: 'platform', lank: '/personal-brand/portfolio' },
] as const

export const SYNLIGHETSKATEGORIER: readonly Synlighetskategori[] = [
  'content', 'engagement', 'networking', 'platform',
] as const

/** Antal idéer i i18n under `personalBrand.visibility.ideas`. */
export const ANTAL_IDEER = 12
