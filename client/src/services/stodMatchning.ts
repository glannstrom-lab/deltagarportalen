/**
 * stodMatchning.ts — ren matchningsfunktion för stödkalkylatorn (spår AG2).
 *
 * Tar en persons och en plats uppgifter (fyllda i av konsulenten — det
 * finns ingen tabell för de här fälten i dag, se anteckning i
 * `components/consultant/StodPanel.tsx`) och svarar VILKA av de fem
 * stödformerna i `data/anstallningsstod.ts` som **kan vara aktuella**.
 *
 * ABSOLUT REGEL (CLAUDE.md): den här funktionen räknar ALDRIG fram ett
 * belopp. `MatchningsResultat` har medvetet inga fält som `belopp`,
 * `procent`, `kronor_per_manad` eller `besparing` — se testet
 * "aldrig ett belopp i resultatet" i stodMatchning.test.ts, som läser
 * nycklarna på ett resultat i RUNTIME för att fånga att någon lägger till
 * ett sådant fält senare, inte bara vad TypeScript råkar tillåta.
 *
 * Art. 9: `harFunktionsnedsattningSomPaverkarArbetsformaga` och
 * `funktionsnedsattningTyp` är hälsonära uppgifter. De används HÄR bara
 * för att avgöra vilka stöd som ska föreslås — `grund`-fältet i svaret
 * refererar till dem med en NEUTRAL nyckel (t.ex. "nedsatt_arbetsformaga"),
 * aldrig med den fria texten personen/konsulenten skrivit. Resultatet från
 * den här funktionen får ALDRIG skickas genom
 * `placeringarApi.byggArbetsgivarUnderlag()` eller något annat som når en
 * arbetsgivare — samma allowlist-princip som den funktionen själv bygger
 * på, men här finns ingen allowlist att gå igenom överhuvudtaget, för att
 * ingen kod av misstag ska kunna koppla ihop de två.
 */

import { ANSTALLNINGSSTOD, type StodformId } from '@/data/anstallningsstod'

// ============================================================================
// INDATA
// ============================================================================

export type FunktionsnedsattningTyp = 'kognitiv' | 'missbruk' | 'psykisk_sjukdom' | 'lss' | 'fysisk' | 'annan'

export interface PersonUppgifter {
  /** Datum personen blivit arbetslös på heltid (approximation, se manaderArbetslos). */
  arbetslosSedan: string | null
  alder: number | null
  arNyanland: boolean | null
  /** Datum för uppehållstillstånd/uppehållskort, om nyanländ. */
  uppehallstillstandDatum: string | null
  deltarIEtableringsprogram: boolean | null
  deltarIJobbOchUtvecklingsgaranti: boolean | null
  /** Antal dagar med ersättning i jobbgaranti för ungdomar. */
  deltarIUngdomsgarantiDagar: number | null
  inskrivenHosAf: boolean | null
  /** Art. 9 — se filhuvudet. */
  harFunktionsnedsattningSomPaverkarArbetsformaga: boolean | null
  /** Art. 9 — se filhuvudet. */
  funktionsnedsattningTyp: FunktionsnedsattningTyp[] | null
}

export type ArbetsgivarTyp = 'privat' | 'kommun' | 'region' | 'statlig_myndighet'

export interface PlatsUppgifter {
  arbetsgivartyp: ArbetsgivarTyp | null
  harSagtUppPersonalSenaste12Man: boolean | null
  planeratStartdatum: string | null
}

export function tomPersonUppgifter(): PersonUppgifter {
  return {
    arbetslosSedan: null,
    alder: null,
    arNyanland: null,
    uppehallstillstandDatum: null,
    deltarIEtableringsprogram: null,
    deltarIJobbOchUtvecklingsgaranti: null,
    deltarIUngdomsgarantiDagar: null,
    inskrivenHosAf: null,
    harFunktionsnedsattningSomPaverkarArbetsformaga: null,
    funktionsnedsattningTyp: null,
  }
}

export function tomPlatsUppgifter(): PlatsUppgifter {
  return {
    arbetsgivartyp: null,
    harSagtUppPersonalSenaste12Man: null,
    planeratStartdatum: null,
  }
}

// ============================================================================
// UTDATA
// ============================================================================

export type Bedomning = 'kan_vara_aktuellt' | 'for_lite_underlag' | 'troligen_inte_aktuellt'

/**
 * Ett matchningssvar per stödform. INGA belopps-fält — se filhuvudet.
 * Håll den här listan disjunkt från `data/anstallningsstod.ts` sina
 * `AnstallningsstodBelopp`-fält (varde/enhet/kallTyp) om du utökar den.
 */
export interface MatchningsResultat {
  stodform: StodformId
  bedomning: Bedomning
  /** Neutrala nycklar, inte fri text — se art. 9-anteckningen i filhuvudet. */
  grund: string[]
  text: string
  lank: string
  kraverBeslutForeStart: boolean
  ansokningsansvarig: 'arbetsgivaren' | 'arbetsformedlingen'
}

/**
 * Mänsklig text för varje `grund`-nyckel matchningsfunktionerna nedan kan
 * returnera. Håll i synk med nycklarna som faktiskt används — testet
 * "varje grund-nyckel har en etikett" i stodMatchning.test.ts fäller
 * bygget om en ny nyckel läggs till utan motsvarande text här.
 */
export const GRUND_LABEL: Record<string, string> = {
  uppsagning_senaste_12_manaderna: 'Arbetsplatsen har sagt upp personal på grund av arbetsbrist de senaste 12 månaderna',
  inte_inskriven_hos_af: 'Personen är inte inskriven hos Arbetsförmedlingen',
  deltar_i_garantiprogram_eller_etablering: 'Deltar i etableringsprogram eller jobb- och utvecklingsgarantin',
  arbetslos_sedan_saknas: 'Datum för arbetslöshetens start saknas',
  nyanland_arbetslos_minst_6_av_9_manader: 'Nyanländ och arbetslös länge nog (ungefärlig beräkning, se text)',
  nyanland_ej_uppnatt_6_manader_an: 'Nyanländ men inte arbetslös länge nog ännu (ungefärlig beräkning)',
  alder_eller_arbetsloshetstid_saknas: 'Ålder eller datum för arbetslöshetens start saknas',
  '20_24_ar_arbetslos_minst_6_av_9_manader': '20–24 år och arbetslös länge nog (ungefärlig beräkning)',
  '20_24_ar_ej_uppnatt_6_manader_an': '20–24 år men inte arbetslös länge nog ännu (ungefärlig beräkning)',
  '25plus_ar_arbetslos_minst_12_av_15_manader': '25 år eller äldre och arbetslös länge nog (ungefärlig beräkning)',
  '25plus_ar_ej_uppnatt_12_manader_an': '25 år eller äldre men inte arbetslös länge nog ännu (ungefärlig beräkning)',
  under_20_ar_ej_annat_villkor_uppfyllt: 'Under 20 år och inget av de andra villkoren är uppfyllt',
  deltar_i_jobb_och_utvecklingsgaranti: 'Deltar i jobb- och utvecklingsgarantin',
  ungdomsgaranti_minst_200_dagar: 'Deltagit i jobbgaranti för ungdomar i minst 200 dagar med ersättning',
  nyanland_20plus_etableringsprogram: 'Nyanländ, 20+ år, anvisad till etableringsprogrammet senaste 12 månaderna',
  nyanland_20plus_uppehallstillstand: 'Nyanländ, 20+ år, uppehållstillstånd/uppehållskort inom senaste 36 månaderna',
  inget_av_de_fyra_villkoren_uppfyllt: 'Inget av introduktionsjobbets fyra villkor verkar uppfyllt',
  for_lite_underlag_om_garantiprogram_eller_nyanlandhet: 'För lite underlag om garantiprogram eller nyanländhet',
  nedsatt_arbetsformaga: 'Funktionsnedsättning som medför nedsatt arbetsförmåga är uppgiven',
  ingen_uppgiven_nedsatt_arbetsformaga: 'Ingen funktionsnedsättning med nedsatt arbetsförmåga uppgiven',
  uppgift_om_nedsatt_arbetsformaga_saknas: 'Uppgift om funktionsnedsättning/nedsatt arbetsförmåga saknas',
  arbetsgivaren_ar_inte_offentlig: 'Arbetsgivaren är inte kommun, region eller statlig myndighet',
  arbetsgivartyp_eller_funktionsnedsattningstyp_saknas: 'Arbetsgivartyp eller typ av funktionsnedsättning saknas',
  offentlig_arbetsgivare_och_relevant_funktionsnedsattning: 'Offentlig arbetsgivare och en funktionsnedsättningstyp som OSA gäller för',
  funktionsnedsattningstyp_matchar_inte_osas_villkor: 'Den uppgivna funktionsnedsättningstypen matchar inte OSA:s villkor',
  nedsatt_arbetsformaga_behov_av_introduktionsstod: 'Nedsatt arbetsförmåga och behov av att öva arbetsuppgifter/färdigheter',
}

const AF_ANSVARIG: Record<StodformId, 'arbetsgivaren' | 'arbetsformedlingen'> = {
  nystartsjobb: 'arbetsgivaren',
  introduktionsjobb: 'arbetsgivaren',
  lonebidrag: 'arbetsgivaren',
  osa: 'arbetsformedlingen',
  sius: 'arbetsgivaren',
}

function svar(
  stodform: StodformId,
  bedomning: Bedomning,
  grund: string[],
  textOverride?: string
): MatchningsResultat {
  const stod = ANSTALLNINGSSTOD.find((s) => s.id === stodform)!
  const text =
    textOverride ??
    (bedomning === 'kan_vara_aktuellt'
      ? `${stod.namn} kan vara aktuellt — kontrollera villkoren och ansök hos Arbetsförmedlingen innan anställningen börjar.`
      : bedomning === 'troligen_inte_aktuellt'
        ? `${stod.namn} verkar inte aktuellt utifrån det som är ifyllt.`
        : `${stod.namn}: för lite underlag för att bedöma. Fyll i fler uppgifter.`)
  return {
    stodform,
    bedomning,
    grund,
    text,
    lank: stod.kalla,
    kraverBeslutForeStart: true,
    ansokningsansvarig: AF_ANSVARIG[stodform],
  }
}

// ============================================================================
// HJÄLPFUNKTIONER
// ============================================================================

/**
 * Antal hela månader sedan `arbetslosSedan`, given `now`. En APPROXIMATION
 * av "arbetslös på heltid" — AF:s villkor räknar faktisk frånvaro (t.ex.
 * "6 av de senaste 9 månaderna"), vilket kräver en historik den här
 * funktionen inte har. Används bara som ett grovt tröskelvärde för att
 * avgöra om det är värt att föreslå stödet — AF gör den riktiga
 * bedömningen. Returnerar `null` vid saknat eller ogiltigt datum.
 */
export function manaderArbetslos(arbetslosSedan: string | null, now: Date = new Date()): number | null {
  if (!arbetslosSedan) return null
  const start = new Date(arbetslosSedan)
  if (isNaN(start.getTime())) return null
  if (start.getTime() > now.getTime()) return null
  // UTC-getters rakt igenom: `start` kommer nästan alltid från en ren
  // datumsträng ("2026-02-28"), som Date parsar som UTC-midnatt. Att blanda
  // det med lokala getters (getMonth/getDate) skiftar svaret ett dygn i
  // vissa tidszoner — samma fälla som cohorts.ts undviker med UTC-getters.
  const months =
    (now.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - start.getUTCMonth()) -
    (now.getUTCDate() < start.getUTCDate() ? 1 : 0)
  return Math.max(0, months)
}

function arOffentligArbetsgivare(typ: ArbetsgivarTyp | null): boolean | null {
  if (typ === null) return null
  return typ === 'kommun' || typ === 'region' || typ === 'statlig_myndighet'
}

// ============================================================================
// MATCHNING PER STÖDFORM
// ============================================================================

function matchaNystartsjobb(person: PersonUppgifter, plats: PlatsUppgifter, now: Date): MatchningsResultat {
  if (plats.harSagtUppPersonalSenaste12Man === true) {
    return svar('nystartsjobb', 'troligen_inte_aktuellt', ['uppsagning_senaste_12_manaderna'])
  }
  if (person.inskrivenHosAf === false) {
    return svar('nystartsjobb', 'troligen_inte_aktuellt', ['inte_inskriven_hos_af'])
  }

  const automatisktKvalificerande =
    person.deltarIEtableringsprogram === true || person.deltarIJobbOchUtvecklingsgaranti === true
  if (automatisktKvalificerande) {
    return svar('nystartsjobb', 'kan_vara_aktuellt', ['deltar_i_garantiprogram_eller_etablering'])
  }

  const manader = manaderArbetslos(person.arbetslosSedan, now)
  if (person.arNyanland === true) {
    if (manader === null) return svar('nystartsjobb', 'for_lite_underlag', ['arbetslos_sedan_saknas'])
    return manader >= 6
      ? svar('nystartsjobb', 'kan_vara_aktuellt', ['nyanland_arbetslos_minst_6_av_9_manader'])
      : svar('nystartsjobb', 'for_lite_underlag', ['nyanland_ej_uppnatt_6_manader_an'])
  }

  if (person.alder === null || manader === null) {
    return svar('nystartsjobb', 'for_lite_underlag', ['alder_eller_arbetsloshetstid_saknas'])
  }
  if (person.alder >= 20 && person.alder <= 24) {
    return manader >= 6
      ? svar('nystartsjobb', 'kan_vara_aktuellt', ['20_24_ar_arbetslos_minst_6_av_9_manader'])
      : svar('nystartsjobb', 'for_lite_underlag', ['20_24_ar_ej_uppnatt_6_manader_an'])
  }
  if (person.alder >= 25) {
    return manader >= 12
      ? svar('nystartsjobb', 'kan_vara_aktuellt', ['25plus_ar_arbetslos_minst_12_av_15_manader'])
      : svar('nystartsjobb', 'for_lite_underlag', ['25plus_ar_ej_uppnatt_12_manader_an'])
  }
  return svar('nystartsjobb', 'troligen_inte_aktuellt', ['under_20_ar_ej_annat_villkor_uppfyllt'])
}

function matchaIntroduktionsjobb(person: PersonUppgifter, plats: PlatsUppgifter): MatchningsResultat {
  if (plats.harSagtUppPersonalSenaste12Man === true) {
    return svar('introduktionsjobb', 'troligen_inte_aktuellt', ['uppsagning_senaste_12_manaderna'])
  }
  if (person.inskrivenHosAf === false) {
    return svar('introduktionsjobb', 'troligen_inte_aktuellt', ['inte_inskriven_hos_af'])
  }

  if (person.deltarIJobbOchUtvecklingsgaranti === true) {
    return svar('introduktionsjobb', 'kan_vara_aktuellt', ['deltar_i_jobb_och_utvecklingsgaranti'])
  }
  if (person.deltarIUngdomsgarantiDagar !== null && person.deltarIUngdomsgarantiDagar >= 200) {
    return svar('introduktionsjobb', 'kan_vara_aktuellt', ['ungdomsgaranti_minst_200_dagar'])
  }
  if (person.arNyanland === true && person.alder !== null && person.alder >= 20) {
    if (person.deltarIEtableringsprogram === true) {
      return svar('introduktionsjobb', 'kan_vara_aktuellt', ['nyanland_20plus_etableringsprogram'])
    }
    if (person.uppehallstillstandDatum) {
      return svar('introduktionsjobb', 'kan_vara_aktuellt', ['nyanland_20plus_uppehallstillstand'])
    }
  }

  const naraOgonKandaVillkor =
    person.deltarIJobbOchUtvecklingsgaranti === false &&
    (person.deltarIUngdomsgarantiDagar ?? 0) < 200 &&
    person.arNyanland === false
  if (naraOgonKandaVillkor) {
    return svar('introduktionsjobb', 'troligen_inte_aktuellt', ['inget_av_de_fyra_villkoren_uppfyllt'])
  }
  return svar('introduktionsjobb', 'for_lite_underlag', ['for_lite_underlag_om_garantiprogram_eller_nyanlandhet'])
}

function matchaLonebidrag(person: PersonUppgifter): MatchningsResultat {
  if (person.inskrivenHosAf === false) {
    return svar('lonebidrag', 'troligen_inte_aktuellt', ['inte_inskriven_hos_af'])
  }
  if (person.harFunktionsnedsattningSomPaverkarArbetsformaga === true) {
    return svar('lonebidrag', 'kan_vara_aktuellt', ['nedsatt_arbetsformaga'])
  }
  if (person.harFunktionsnedsattningSomPaverkarArbetsformaga === false) {
    return svar('lonebidrag', 'troligen_inte_aktuellt', ['ingen_uppgiven_nedsatt_arbetsformaga'])
  }
  return svar('lonebidrag', 'for_lite_underlag', ['uppgift_om_nedsatt_arbetsformaga_saknas'])
}

function matchaOsa(person: PersonUppgifter, plats: PlatsUppgifter): MatchningsResultat {
  if (person.inskrivenHosAf === false) {
    return svar('osa', 'troligen_inte_aktuellt', ['inte_inskriven_hos_af'])
  }
  const offentlig = arOffentligArbetsgivare(plats.arbetsgivartyp)
  if (offentlig === false) {
    return svar('osa', 'troligen_inte_aktuellt', ['arbetsgivaren_ar_inte_offentlig'])
  }

  const relevantTyp =
    person.funktionsnedsattningTyp?.some((t) => t === 'kognitiv' || t === 'missbruk' || t === 'lss' || t === 'psykisk_sjukdom') ??
    null

  if (offentlig === null || relevantTyp === null || person.harFunktionsnedsattningSomPaverkarArbetsformaga === null) {
    return svar('osa', 'for_lite_underlag', ['arbetsgivartyp_eller_funktionsnedsattningstyp_saknas'])
  }
  if (offentlig && person.harFunktionsnedsattningSomPaverkarArbetsformaga && relevantTyp) {
    return svar('osa', 'kan_vara_aktuellt', ['offentlig_arbetsgivare_och_relevant_funktionsnedsattning'])
  }
  return svar('osa', 'troligen_inte_aktuellt', ['funktionsnedsattningstyp_matchar_inte_osas_villkor'])
}

function matchaSius(person: PersonUppgifter): MatchningsResultat {
  if (person.harFunktionsnedsattningSomPaverkarArbetsformaga === true) {
    return svar('sius', 'kan_vara_aktuellt', ['nedsatt_arbetsformaga_behov_av_introduktionsstod'])
  }
  if (person.harFunktionsnedsattningSomPaverkarArbetsformaga === false) {
    return svar('sius', 'troligen_inte_aktuellt', ['ingen_uppgiven_nedsatt_arbetsformaga'])
  }
  return svar('sius', 'for_lite_underlag', ['uppgift_om_nedsatt_arbetsformaga_saknas'])
}

// ============================================================================
// HUVUDFUNKTION
// ============================================================================

/**
 * Ren funktion. Injicerbar `now` för deterministiska tester (samma mönster
 * som `placeringsmatt.ts`s `followupStatus`).
 */
export function matchaStod(
  person: PersonUppgifter,
  plats: PlatsUppgifter,
  now: Date = new Date()
): MatchningsResultat[] {
  return [
    matchaNystartsjobb(person, plats, now),
    matchaIntroduktionsjobb(person, plats),
    matchaLonebidrag(person),
    matchaOsa(person, plats),
    matchaSius(person),
  ]
}

/**
 * Sant om `plats.planeratStartdatum` ligger så nära i tiden att det kan bli
 * svårt att hinna få beslut innan anställningen börjar. Ingen exakt
 * handläggningstid är belagd i underlaget — 3 veckor används bara för
 * nystartsjobbets uttryckliga "minst tre veckor innan" (den enda konkreta
 * fristen i materialet), som en försiktig, generell varningströskel för
 * samtliga stöd eftersom alla kräver beslut/överenskommelse före start.
 */
export const VARNINGSTROSKEL_DAGAR = 21

export function starttidVarning(planeratStartdatum: string | null, now: Date = new Date()): string | null {
  if (!planeratStartdatum) return null
  const start = new Date(planeratStartdatum)
  if (isNaN(start.getTime())) return null
  const dagarKvar = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (dagarKvar < 0) {
    return 'Det planerade startdatumet har redan passerat — samtliga stöd kräver beslut innan anställningen börjar.'
  }
  if (dagarKvar < VARNINGSTROSKEL_DAGAR) {
    return `Bara ${dagarKvar} dagar kvar till planerad start. Samtliga stöd kräver beslut/överenskommelse innan anställningen börjar — kontrollera om det hinns.`
  }
  return null
}
