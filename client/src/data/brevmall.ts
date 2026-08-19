/**
 * Handskriven brevmall för den som ännu inte fyllt i något om sig själv.
 *
 * ── VARFÖR DEN FINNS, OCH VARFÖR DEN INTE ÄR `mockGenerateLetter` ─────────
 *
 * B21 (2026-08-09) förbjöd med flit en mall som visades NÄR AI-ANROPET
 * FALLERADE, märkt med `data-ai-generated="true"` och `AIGeneratedWatermark`
 * — alltså ett efterlevnadspåstående enligt AI Act art. 50.2 om text ingen
 * modell hade skrivit. Den regeln gäller fortfarande och ska inte luckras upp.
 *
 * Det här är något annat, på tre punkter som alla är avgörande:
 *
 *  1. Den visas när AI-anropet LYCKAS men inte KAN ge ett sant svar — inte
 *     som en tröst när något gått sönder.
 *  2. Den säger vad den är. Ingen AI-märkning, ingen vattenstämpel,
 *     `ai_generated: false` vid sparning. Ingen ska tro att den är skriven
 *     åt hen.
 *  3. Den påstår ingenting. Varje mening om personen är en LUCKA hon fyller
 *     i själv.
 *
 * ── VAD MÄTNINGEN VISADE ─────────────────────────────────────────────────
 *
 * Tre körningar mot prod, med bara en jobbannons som underlag:
 *  · Enbart förbudslista → brevet kortades 250-350 → ~130 ord, men innehöll
 *    "Dessutom har jag goda kunskaper i svenska, både i tal och skrift".
 *  · Med utkastläge och luckor → 3-4 luckor kom, men bredvid dem stod
 *    "Jag har goda kunskaper i svenska och är van vid skiftarbete".
 *
 * Slutsats: man kan inte be en modell skriva ett personligt brev i första
 * person om en person den inte vet något om och samtidigt få ett sant svar.
 * Uppgiften kräver påståenden; fler förbud flyttar bara vilka den väljer.
 * Därför skrivs den här texten för hand — då kan ingen modell hitta på.
 *
 * Har personen ett CV eller egna rader anropas AI:n som vanligt. Mallen är
 * till för det fall där vi inte vet något alls.
 */

export interface Brevmallsunderlag {
  /** Företagets namn, från annonsen. Tomt om det saknas. */
  foretag?: string
  /** Tjänstens titel, från annonsen. Tomt om den saknas. */
  titel?: string
}

/** Luckmarkören. Samma sträng överallt, så den går att räkna och testa. */
export const LUCKA = '___'

/**
 * Bygger mallen.
 *
 * Företag och titel fylls i eftersom de kommer från ANNONSEN — det är fakta
 * om jobbet, inte påståenden om personen. Saknas de används en neutral
 * formulering i stället för ett påhittat namn.
 */
export function byggBrevmall(underlag: Brevmallsunderlag = {}): string {
  const foretag = underlag.foretag?.trim()
  const titel = underlag.titel?.trim()

  const inledning = titel && foretag
    ? `Jag söker tjänsten som ${titel} hos ${foretag}.`
    : titel
      ? `Jag söker tjänsten som ${titel}.`
      : foretag
        ? `Jag söker den utlysta tjänsten hos ${foretag}.`
        : 'Jag söker den utlysta tjänsten.'

  // Varje rad som handlar om personen är en lucka. Ledtråden står inom
  // parentes på samma rad, så den är lätt att se och lätt att radera.
  return [
    inledning,
    '',
    `Det som gör att jag söker just den här tjänsten är ${LUCKA} (skriv vad i annonsen som fick dig att reagera).`,
    '',
    `Jag har arbetat med ${LUCKA} (skriv vad du gjort tidigare — jobb, praktik, studier eller något du gjort på egen hand).`,
    '',
    `Det jag är bra på är ${LUCKA} (skriv en eller två saker du kan, gärna sådant annonsen efterfrågar).`,
    '',
    `${LUCKA} (om du har utbildning, körkort, certifikat eller något annat som hör till jobbet — skriv det här. Annars kan du ta bort den här raden.)`,
    '',
    `Jag kan börja ${LUCKA} (skriv när du kan börja) och jag berättar gärna mer vid en intervju.`,
  ].join('\n')
}

/** Antal luckor mallen innehåller — används i UI-texten och i test. */
export function raknaLuckor(text: string): number {
  return (text.match(new RegExp(LUCKA, 'g')) || []).length
}
