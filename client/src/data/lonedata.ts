/**
 * Lönedata för /salary — en källa, ärligt märkt.
 *
 * Varför filen finns: samma siffror låg i tre kopior som inte hölls i synk.
 * Kalkylatorn sa att Ekonomi & Finans har medianen 48 000, Marknadsdata sa att
 * Finans & Bank har 55 000, och `services/scbSalaryApi.ts` hade en tredje
 * uppsättning. En deltagare som klickade mellan två flikar på samma sida fick
 * två olika svar på samma fråga.
 *
 * VAD DE HÄR TALEN ÄR: grova branschuppskattningar. De är inte hämtade från
 * SCB, inte från Medlingsinstitutet och inte från någon löneundersökning —
 * de skrevs in för hand 2026-03-18 och har inte uppdaterats sedan dess.
 * Gränssnittet ska säga exakt det, och peka vidare till källor som har riktig
 * statistik. Det stod tidigare "Data baserad på svensk lönestatistik" och
 * "Senast uppdaterad: Q1 2026" bredvid samma siffror. Det var inte sant.
 *
 * VAD SOM MEDVETET INTE FINNS HÄR:
 *   · antal anställda per bransch — talen var påhittade rakt av
 *   · årlig löneökning per bransch — en prognos med en decimal utan källa
 *   · "kompetenser med hög lönepremie" (+25–40 %) — sex IT-kompetenser utan
 *     underlag, dessutom irrelevanta för portalens målgrupp
 * Behövs något av det igen ska det komma från en källa som går att namnge.
 */

export interface Yrkesomrade {
  /** i18n-nyckel under `salary.data.occupations`. */
  nyckel: string
  /** Svenskt namn — används som lagringsnyckel och som fallback. */
  namn: string
  min: number
  median: number
  max: number
}

export interface Loneregion {
  nyckel: string
  namn: string
  /** Påslag eller avdrag mot riksnivån, i procent. */
  justeringProcent: number
}

export interface Erfarenhetsniva {
  nyckel: string
  namn: string
  faktor: number
  /** Undre kant i år — används när nivån ska uttryckas som ett tal. */
  arFran: number
}

/**
 * Uppskattade månadslöner (kr, brutto) för tolv breda yrkesområden.
 * Sorterade som de ska visas: efter median, högst först.
 */
export const YRKESOMRADEN: Yrkesomrade[] = [
  { nyckel: 'law', namn: 'Juridik', min: 38000, median: 55000, max: 95000 },
  { nyckel: 'it', namn: 'IT & Systemutveckling', min: 38000, median: 52000, max: 85000 },
  { nyckel: 'finance', namn: 'Ekonomi & Finans', min: 35000, median: 48000, max: 75000 },
  { nyckel: 'engineering', namn: 'Teknik & Ingenjör', min: 36000, median: 48000, max: 72000 },
  { nyckel: 'hr', namn: 'HR & Personal', min: 33000, median: 43000, max: 62000 },
  { nyckel: 'marketing', namn: 'Marknadsföring & Kommunikation', min: 32000, median: 42000, max: 65000 },
  { nyckel: 'sales', namn: 'Försäljning', min: 30000, median: 40000, max: 70000 },
  { nyckel: 'health', namn: 'Hälso- & sjukvård', min: 32000, median: 40000, max: 58000 },
  { nyckel: 'design', namn: 'Design & Kreativt', min: 30000, median: 40000, max: 60000 },
  { nyckel: 'education', namn: 'Utbildning', min: 30000, median: 38000, max: 52000 },
  { nyckel: 'construction', namn: 'Bygg & Hantverk', min: 32000, median: 38000, max: 55000 },
  { nyckel: 'admin', namn: 'Administration', min: 28000, median: 35000, max: 48000 },
]

export const LONEREGIONER: Loneregion[] = [
  { nyckel: 'stockholm', namn: 'Stockholm', justeringProcent: 15 },
  { nyckel: 'gothenburg', namn: 'Göteborg', justeringProcent: 8 },
  { nyckel: 'malmo', namn: 'Malmö', justeringProcent: 5 },
  { nyckel: 'uppsala', namn: 'Uppsala', justeringProcent: 3 },
  { nyckel: 'otherMetro', namn: 'Övriga storstadsregioner', justeringProcent: 0 },
  { nyckel: 'northern', namn: 'Norrland', justeringProcent: -3 },
  { nyckel: 'central', namn: 'Mellansverige', justeringProcent: -5 },
]

export const ERFARENHETSNIVAER: Erfarenhetsniva[] = [
  { nyckel: 'junior', namn: '0-2 år', faktor: 0.85, arFran: 0 },
  { nyckel: 'mid', namn: '3-5 år', faktor: 1.0, arFran: 3 },
  { nyckel: 'senior', namn: '6-10 år', faktor: 1.15, arFran: 6 },
  { nyckel: 'expert', namn: '10+ år', faktor: 1.3, arFran: 10 },
]

/**
 * Externa källor med riktig lönestatistik. Länkarna är kontrollerade
 * 2026-08-20 (HTTP 200). Kontrollera dem igen om de flyttas — en död länk i
 * ett stycke som handlar om att inte hitta på är extra illa.
 */
export const EXTERNA_LONEKALLOR = [
  {
    nyckel: 'scb',
    namn: 'SCB Lönesök',
    beskrivning: 'Officiell lönestatistik per yrke, kön, ålder och sektor.',
    url: 'https://www.scb.se/hitta-statistik/sverige-i-siffror/lonesok/',
  },
  {
    nyckel: 'medlingsinstitutet',
    namn: 'Medlingsinstitutet',
    beskrivning: 'Löneutveckling och avtalsrörelsen — hur mycket lönerna faktiskt steg.',
    url: 'https://www.medlingsinstitutet.se/',
  },
  {
    nyckel: 'skatteverket',
    namn: 'Skatteverket',
    beskrivning: 'Skattetabeller, belopp och procentsatser för året.',
    url: 'https://skatteverket.se/privat/skatter/beloppochprocent',
  },
] as const

/** Uppslag på svenskt namn — behåller kompatibilitet med sparade värden. */
export function hittaYrkesomrade(namn: string): Yrkesomrade | null {
  return YRKESOMRADEN.find(y => y.namn === namn) ?? null
}

export function hittaRegion(namn: string): Loneregion | null {
  return LONEREGIONER.find(r => r.namn === namn) ?? null
}

export function hittaErfarenhet(namn: string): Erfarenhetsniva | null {
  return ERFARENHETSNIVAER.find(e => e.namn === namn) ?? null
}

export interface Loneberakning {
  min: number
  median: number
  max: number
}

/**
 * Räknar fram ett lönespann för en kombination.
 *
 * Returnerar `null` när någon del saknas eller är okänd — en okänd region ska
 * inte tyst falla tillbaka på "ingen justering". Tidigare gjorde `|| 0` och
 * `|| 1` precis det, vilket gjorde ett stavfel oskiljbart från ett medvetet
 * nollvärde (Övriga storstadsregioner har justeringen 0).
 */
export function beraknaLonespann(
  yrkesomradeNamn: string,
  regionNamn: string,
  erfarenhetNamn: string,
): Loneberakning | null {
  const yrke = hittaYrkesomrade(yrkesomradeNamn)
  const region = hittaRegion(regionNamn)
  const erfarenhet = hittaErfarenhet(erfarenhetNamn)
  if (!yrke || !region || !erfarenhet) return null

  const regionFaktor = 1 + region.justeringProcent / 100
  return {
    min: Math.round(yrke.min * regionFaktor * erfarenhet.faktor),
    median: Math.round(yrke.median * regionFaktor * erfarenhet.faktor),
    max: Math.round(yrke.max * regionFaktor * erfarenhet.faktor),
  }
}

/** Riksmedianen över alla yrkesområden — basen för regionjämförelsen. */
export function riksmedian(): number {
  const medianer = YRKESOMRADEN.map(y => y.median).sort((a, b) => a - b)
  const mitt = Math.floor(medianer.length / 2)
  return medianer.length % 2
    ? medianer[mitt]
    : Math.round((medianer[mitt - 1] + medianer[mitt]) / 2)
}

/** Uppskattad genomsnittlig lön i en region, härledd ur riksmedianen. */
export function regionmedian(region: Loneregion): number {
  return Math.round(riksmedian() * (1 + region.justeringProcent / 100))
}
