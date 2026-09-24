/**
 * Flyttdata för /career/relocation — en källa, ärligt märkt.
 *
 * Filen finns av samma skäl som `data/lonedata.ts`: siffrorna låg inbakade i
 * `RelocationTab.tsx` som en anonym konstant, tolv regioner × fyra påståenden,
 * utan källa och utan årtal. Granskningen 2026-08-21 räknade 48 sådana
 * påståenden. Två av dem var dessutom direkt felaktiga i sak:
 *
 *   · `avgSalary` sa Stockholm 48 000 medan portalens egen lönesida (via
 *     `lonedata.ts`) räknar fram 47 150. Två flikar svarade olika på samma
 *     fråga — precis det `lonedata.ts` skrevs för att avskaffa. Kolumnen är
 *     borta här; lönefrågan ägs av /salary och ingen annan.
 *   · `jobMarket` var etiketter ("Mycket stark", "God", "Medel") som ingen
 *     hade mätt. De är ersatta av Arbetsförmedlingens faktiska antal
 *     publicerade annonser per kommun, hämtat i drift via `af-trends`
 *     (kategorin `municipalities`). Ett tal som går att peka på slår en
 *     etikett som ingen kan belägga.
 *
 * VAD DE KVARVARANDE TALEN ÄR: grova uppskattningar av snitthyra och kötid,
 * inskrivna för hand. De kommer inte från Hyresgästföreningen, inte från SCB
 * och inte från någon bostadskö. Gränssnittet ska säga exakt det och peka
 * vidare till källor som har riktiga uppgifter. Ändrar du ett tal — flytta
 * fram `UPPGIFTERNA_ANGAVS`, annars ljuger stämpeln i stället.
 */

/** Datum då hyror och kötider senast skrevs in för hand. Format: ÅÅÅÅ-MM-DD. */
export const UPPGIFTERNA_ANGAVS = '2026-08-21'

export interface Flyttregion {
  id: string
  /** Kommunnamnet så som Arbetsförmedlingen skriver det — matchningsnyckel. */
  namn: string
  /** Uppskattad snitthyra per månad, kr. Handinskriven, se filhuvudet. */
  uppskattadHyra: number
  /**
   * Uppskattad kötid till förstahandskontrakt, i hela år. Handinskriven, se
   * filhuvudet. Språkneutral med flit: stod tidigare som den fria strängen
   * '5–15 år', som en engelsk användare fick oöversatt. Visas genom
   * `formateraKotid()`.
   */
  uppskattadKotidAr: { min: number; max: number }
}

/**
 * Tolv kommuner. Alla finns bland Arbetsförmedlingens trettio största
 * annonskommuner, så `af-trends` kan leverera ett verkligt jobbantal för
 * var och en av dem (kontrollerat mot API:t 2026-08-21).
 */
export const FLYTTREGIONER: Flyttregion[] = [
  { id: 'stockholm', namn: 'Stockholm', uppskattadHyra: 14500, uppskattadKotidAr: { min: 5, max: 15 } },
  { id: 'gothenburg', namn: 'Göteborg', uppskattadHyra: 10500, uppskattadKotidAr: { min: 3, max: 8 } },
  { id: 'malmo', namn: 'Malmö', uppskattadHyra: 9500, uppskattadKotidAr: { min: 2, max: 5 } },
  { id: 'uppsala', namn: 'Uppsala', uppskattadHyra: 11000, uppskattadKotidAr: { min: 4, max: 10 } },
  { id: 'linkoping', namn: 'Linköping', uppskattadHyra: 8500, uppskattadKotidAr: { min: 1, max: 3 } },
  { id: 'vasteras', namn: 'Västerås', uppskattadHyra: 8000, uppskattadKotidAr: { min: 1, max: 3 } },
  { id: 'orebro', namn: 'Örebro', uppskattadHyra: 7500, uppskattadKotidAr: { min: 1, max: 2 } },
  { id: 'umea', namn: 'Umeå', uppskattadHyra: 8500, uppskattadKotidAr: { min: 1, max: 3 } },
  { id: 'jonkoping', namn: 'Jönköping', uppskattadHyra: 7000, uppskattadKotidAr: { min: 1, max: 2 } },
  { id: 'norrkoping', namn: 'Norrköping', uppskattadHyra: 7000, uppskattadKotidAr: { min: 1, max: 2 } },
  { id: 'lulea', namn: 'Luleå', uppskattadHyra: 7500, uppskattadKotidAr: { min: 0, max: 1 } },
  { id: 'sundsvall', namn: 'Sundsvall', uppskattadHyra: 6500, uppskattadKotidAr: { min: 0, max: 1 } },
]

/**
 * Bostadssajter. Alla sex är **privata kommersiella aktörer** — portalen har
 * ingen relation till dem och rekommenderar dem inte. Beskrivningarna var
 * tidigare företagens egen marknadsföring återgiven som portalens omdöme
 * ("Trygga hyreskontrakt", "Andrahandsuthyrning med garanti"). De är
 * omskrivna till vad tjänsten är, inte hur bra den påstås vara.
 */
export const BOSTADSSAJTER = [
  { nyckel: 'blocket', namn: 'Blocket Bostad', url: 'https://www.blocket.se/bostad', beskrivningKey: 'career.relocation.sites.blocket' },
  { nyckel: 'qasa', namn: 'Qasa', url: 'https://www.qasa.se', beskrivningKey: 'career.relocation.sites.qasa' },
  { nyckel: 'bostadsportalen', namn: 'Bostadsportalen', url: 'https://www.bostadsportalen.se', beskrivningKey: 'career.relocation.sites.bostadsportalen' },
  { nyckel: 'samtrygg', namn: 'Samtrygg', url: 'https://www.samtrygg.se', beskrivningKey: 'career.relocation.sites.samtrygg' },
  { nyckel: 'homeq', namn: 'HomeQ', url: 'https://www.homeq.se', beskrivningKey: 'career.relocation.sites.homeq' },
  { nyckel: 'bostad-direkt', namn: 'Bostad Direkt', url: 'https://www.bostaddirekt.com', beskrivningKey: 'career.relocation.sites.bostadDirekt' },
] as const

/**
 * Flyttchecklistan. `prioritet` styr ordningen, inte färgen — de röda och
 * gula "Viktigt"/"Medel"-etiketterna som stod här bröt mot DESIGN.md §4
 * (rött är reserverat för destruktivt) och gav tolv larmfärgade rader på en
 * lugn sida.
 */
export const FLYTTCHECKLISTA = [
  { id: 'housing-queue', labelKey: 'career.relocation.checklist.housingQueue', narKey: 'career.relocation.when.sixMonths', prioritet: 1 },
  { id: 'job-search', labelKey: 'career.relocation.checklist.jobSearch', narKey: 'career.relocation.when.threeMonths', prioritet: 1 },
  { id: 'address-change', labelKey: 'career.relocation.checklist.addressChange', narKey: 'career.relocation.when.oneWeek', prioritet: 1 },
  { id: 'insurance', labelKey: 'career.relocation.checklist.insurance', narKey: 'career.relocation.when.movingDay', prioritet: 1 },
  { id: 'cleaning', labelKey: 'career.relocation.checklist.cleaning', narKey: 'career.relocation.when.movingDay', prioritet: 1 },
  { id: 'keys', labelKey: 'career.relocation.checklist.keys', narKey: 'career.relocation.when.movingDay', prioritet: 1 },
  { id: 'mail-forward', labelKey: 'career.relocation.checklist.mailForward', narKey: 'career.relocation.when.oneWeek', prioritet: 2 },
  { id: 'utilities', labelKey: 'career.relocation.checklist.utilities', narKey: 'career.relocation.when.twoWeeks', prioritet: 2 },
  { id: 'internet', labelKey: 'career.relocation.checklist.internet', narKey: 'career.relocation.when.twoWeeks', prioritet: 2 },
  { id: 'bank', labelKey: 'career.relocation.checklist.bank', narKey: 'career.relocation.when.after', prioritet: 3 },
  { id: 'healthcare', labelKey: 'career.relocation.checklist.healthcare', narKey: 'career.relocation.when.after', prioritet: 3 },
  { id: 'parking', labelKey: 'career.relocation.checklist.parking', narKey: 'career.relocation.when.before', prioritet: 3 },
] as const

type Oversattare = (nyckel: string, reserv: string, varden: Record<string, unknown>) => string

/**
 * Kötiden som text på aktivt språk: '5–15 år' / '5–15 years'. Svenskan är
 * reserv om nyckeln saknas.
 */
export function formateraKotid(kotid: Flyttregion['uppskattadKotidAr'], t: Oversattare): string {
  return t('career.relocation.queueYears', '{{min}}–{{max}} år', { min: kotid.min, max: kotid.max })
}

/** Snabbuppslag id → region. */
export function hittaFlyttregion(id: string): Flyttregion | undefined {
  return FLYTTREGIONER.find((r) => r.id === id)
}
