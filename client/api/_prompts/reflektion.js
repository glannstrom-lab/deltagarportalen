// KA3 (2026-09-12): Veckoreflektion.
// Flyttad ordagrant ur api/ai.js. Sanningsregeln läggs på i ./index.js, inte här.

module.exports = {

  // ===========================================================================
  // Veckoreflektion för deltagare UTANFÖR Steg till arbete (G12, 2026-07-27)
  // ===========================================================================
  // Samma mönster som `sta-week-summary`, men vänd till DELTAGAREN i stället
  // för konsulenten. Två skillnader som spelar roll:
  //
  //  - Tilltal: andra person ("du"), inte tredje. Det här är inte en rapport
  //    om någon, det är en spegel till personen själv.
  //  - Underlaget är känsligt (dagbok + mående, GDPR art. 9). Prompten får
  //    därför inte tolka, diagnostisera eller moralisera — och en tunn vecka
  //    ska aldrig beskrivas som ett misslyckande. Målgruppen kan ha veckor
  //    där ingenting hände, och det är inte något att kommentera.
  //
  // Klienten skickar bara data från de senaste 7 dagarna och Zod-validerar
  // svaret mot `VeckoReflektionSchema`.
  'vecko-reflektion': (data) => {
    const diary = Array.isArray(data?.diary) ? data.diary.slice(0, 14) : [];
    const moods = Array.isArray(data?.moods) ? data.moods.slice(0, 7) : [];

    const diaryText = diary
      .map((d) => `- [${d?.date || 'okänt datum'}]${d?.tags?.length ? ` (${d.tags.join(', ')})` : ''} ${String(d?.content || '').slice(0, 400)}`)
      .join('\n');
    const moodText = moods
      .map((m) => `- ${m?.date || '?'}: mående ${m?.mood ?? '–'}/5, energi ${m?.energy ?? '–'}/5${m?.note ? ` — ${String(m.note).slice(0, 120)}` : ''}`)
      .join('\n');

    return {
      system: `Du skriver en kort, varm veckoreflektion till en arbetssökande utifrån personens egna dagboksanteckningar och måendeloggar. Svara ENDAST med JSON i detta format:
{"summary":"2-4 meningar om veckan, i andra person","noticed":["Något konkret du ser i underlaget"],"gentleSuggestion":"En mjuk idé till nästa vecka"}

ABSOLUTA REGLER:
- Skriv till personen som "du". Aldrig tredje person, aldrig "deltagaren".
- Använd ENDAST det som står i underlaget. Hitta aldrig på händelser, känslor eller framsteg.
- Tolka eller diagnostisera aldrig mående. Du är inte behandlare. Skriv "du skrev att du kände dig trött", aldrig "du verkar deprimerad".
- Moralisera aldrig och skuldbelägg aldrig. Inga "du borde", inget om att personen gjort för lite.
- En tunn vecka är helt okej. Om underlaget är litet: säg det lugnt och utan att antyda misslyckande ("Det här är allt jag har från veckan — det räcker gott").
- noticed: 1-3 punkter, konkreta och hämtade ur texten.
- gentleSuggestion: EN mening, formulerad som en möjlighet ("Om du vill kan du ..."), aldrig som en uppgift. Utelämna fältet helt om underlaget inte ger stöd för något förslag.
- Allt på svenska.`,
      user: `DAGBOKSANTECKNINGAR (senaste 7 dagarna):\n${diaryText || 'Inga anteckningar.'}\n\nMÅENDELOGGAR (senaste 7 dagarna):\n${moodText || 'Inga loggar.'}\n\nSkriv veckoreflektionen. Svara ENDAST med JSON.`,
      maxTokens: 700,
      responseKey: 'reflektion',
      parseJson: true
    };
  },
};
