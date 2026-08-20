/**
 * Svensk inkomstskatt — en uppskattning som följer lagens struktur.
 *
 * Varför filen finns: lönekalkylatorn räknade tidigare nettolön som
 * `brutto * 0.78` — en platt schablon oberoende av inkomst. Den är ungefär
 * rätt vid 33 000 kr/mån och fel överallt annars: den underskattar nettot för
 * låga inkomster och överskattade det med över 11 000 kr/mån vid 82 000 kr i
 * bruttolön, eftersom den inte kände till att statlig inkomstskatt finns.
 *
 * Modellen här räknar i den ordning skatten faktiskt beräknas:
 *   1. grundavdrag (trappa knuten till prisbasbeloppet)
 *   2. kommunal inkomstskatt på inkomsten efter grundavdrag
 *   3. statlig inkomstskatt, 20 % på den del som överstiger skiktgränsen
 *   4. jobbskatteavdrag, som dras från den kommunala skatten
 *
 * VAD MODELLEN INTE GÖR — säg det i gränssnittet, göm det inte:
 *   · kyrkoavgift och begravningsavgift ingår inte
 *   · förhöjt grundavdrag för den som fyllt 66 år ingår inte
 *   · avtrappningen av jobbskatteavdraget vid mycket höga inkomster ingår inte,
 *     så skatten underskattas något för inkomster över ~55 000 kr/mån
 *   · inga avdrag (resor, ränta, ROT/RUT) och ingen jämkning
 *
 * Beloppen är 2025 års. Skriv ut året i gränssnittet — en siffra utan år är en
 * siffra utan hållbarhet. Källa att kontrollera mot:
 * https://www.skatteverket.se/privat/skatter/beloppochprocent
 */

/** Året beloppen nedan gäller. Visas för användaren. */
export const SKATTEAR = 2025

/** Prisbasbelopp 2025 (kr/år). Styr både grundavdrag och jobbskatteavdrag. */
const PRISBASBELOPP = 58_800

/** Skiktgräns 2025 (kr/år). Över den tas 20 % statlig inkomstskatt ut. */
const SKIKTGRANS = 625_800

/** Statlig inkomstskatt över skiktgränsen. */
const STATLIG_SKATTESATS = 0.20

/**
 * Riksgenomsnittlig kommunal skattesats 2025 (kommun + region), i procent.
 * Används när användaren inte angett sin egen kommun. Spannet i landet går
 * ungefär från 29 till 36 procent — därför går satsen att ändra i kalkylatorn.
 */
export const KOMMUNALSKATT_RIKSGENOMSNITT = 32.41

/** Rimlighetsgräns för en egen kommunalskattesats. */
export const KOMMUNALSKATT_MIN = 28
export const KOMMUNALSKATT_MAX = 36

export interface Skatteuppdelning {
  /** Bruttolön per månad, oförändrad. */
  bruttoManad: number
  /** Nettolön per månad, avrundad till hel krona. */
  nettoManad: number
  /** Summa skatt per månad. */
  skattManad: number
  /** Effektiv skattesats i procent (skatt / brutto), en decimal. */
  effektivSkattProcent: number
  /** Delposterna per månad — för den som vill se hur talet uppstod. */
  poster: {
    grundavdrag: number
    kommunalSkatt: number
    statligSkatt: number
    jobbskatteavdrag: number
  }
  /** Antaganden att skriva ut bredvid talet. */
  antaganden: {
    ar: number
    kommunalskattProcent: number
  }
}

/**
 * Grundavdrag per år enligt trappan i 63 kap. inkomstskattelagen, uttryckt i
 * prisbasbelopp. Avrundas till närmaste hundra kronor precis som i lagtexten.
 */
export function grundavdragPerAr(arsinkomst: number): number {
  const pbb = PRISBASBELOPP
  const i = arsinkomst
  let avdrag: number

  if (i <= 0.99 * pbb) {
    avdrag = 0.423 * pbb
  } else if (i <= 2.72 * pbb) {
    avdrag = 0.423 * pbb + 0.2 * (i - 0.99 * pbb)
  } else if (i <= 3.11 * pbb) {
    avdrag = 0.77 * pbb
  } else if (i <= 7.88 * pbb) {
    avdrag = 0.77 * pbb - 0.1 * (i - 3.11 * pbb)
  } else {
    avdrag = 0.293 * pbb
  }

  // Grundavdraget kan aldrig överstiga inkomsten.
  avdrag = Math.min(avdrag, i)
  return Math.round(avdrag / 100) * 100
}

/**
 * Jobbskatteavdrag per år. Underlaget räknas i prisbasbelopp och multipliceras
 * med den kommunala skattesatsen — avdraget är alltså större i en kommun med
 * hög skatt, vilket är hela poängen med konstruktionen.
 */
export function jobbskatteavdragPerAr(arsinkomst: number, kommunalskattProcent: number): number {
  const pbb = PRISBASBELOPP
  const ai = arsinkomst
  const ga = grundavdragPerAr(ai)
  let underlag: number

  if (ai <= 0.91 * pbb) {
    underlag = ai - ga
  } else if (ai <= 3.24 * pbb) {
    underlag = 0.91 * pbb + 0.3325 * (ai - 0.91 * pbb) - ga
  } else if (ai <= 8.08 * pbb) {
    underlag = 1.703 * pbb + 0.111 * (ai - 3.24 * pbb) - ga
  } else {
    underlag = 2.2405 * pbb - ga
  }

  if (underlag <= 0) return 0
  return underlag * (kommunalskattProcent / 100)
}

/**
 * Räknar ut nettolön för en månadslön.
 *
 * Returnerar `null` för indata som inte går att räkna på — ett tomt eller
 * orimligt fält ska visa ett tankstreck, inte en påhittad siffra.
 */
export function beraknaNetto(
  bruttoManad: number,
  kommunalskattProcent: number = KOMMUNALSKATT_RIKSGENOMSNITT,
): Skatteuppdelning | null {
  if (!Number.isFinite(bruttoManad) || bruttoManad <= 0) return null
  if (!Number.isFinite(kommunalskattProcent) || kommunalskattProcent <= 0) return null

  const sats = Math.min(Math.max(kommunalskattProcent, KOMMUNALSKATT_MIN), KOMMUNALSKATT_MAX)
  const arsinkomst = bruttoManad * 12

  const grundavdrag = grundavdragPerAr(arsinkomst)
  const beskattningsbar = Math.max(0, arsinkomst - grundavdrag)

  const kommunalSkatt = beskattningsbar * (sats / 100)
  const statligSkatt = Math.max(0, beskattningsbar - SKIKTGRANS) * STATLIG_SKATTESATS
  const jobbskatteavdrag = Math.min(
    jobbskatteavdragPerAr(arsinkomst, sats),
    kommunalSkatt, // avdraget kan aldrig bli större än den kommunala skatten
  )

  const skattPerAr = Math.max(0, kommunalSkatt + statligSkatt - jobbskatteavdrag)

  const skattManad = Math.round(skattPerAr / 12)
  const nettoManad = Math.round(bruttoManad - skattManad)

  return {
    bruttoManad: Math.round(bruttoManad),
    nettoManad,
    skattManad,
    effektivSkattProcent: Math.round((skattPerAr / arsinkomst) * 1000) / 10,
    poster: {
      grundavdrag: Math.round(grundavdrag / 12),
      kommunalSkatt: Math.round(kommunalSkatt / 12),
      statligSkatt: Math.round(statligSkatt / 12),
      jobbskatteavdrag: Math.round(jobbskatteavdrag / 12),
    },
    antaganden: {
      ar: SKATTEAR,
      kommunalskattProcent: sats,
    },
  }
}
