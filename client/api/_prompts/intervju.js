// KA3 (2026-09-12): Intervjusimulatorn: frågor och sammanfattning.
// Flyttad ordagrant ur api/ai.js. Sanningsregeln läggs på i ./index.js, inte här.

module.exports = {
  'intervju-simulator': (data) => {
    // Kategorin kommer från deltagarens egen meny på sidan. Den var död fram
    // till 2026-08-19: `selectedCategory` sattes, lästes aldrig, och skickades
    // aldrig hit. Menyn lovade "Tekniska frågor" och gjorde ingenting.
    const KATEGORIER = {
      'Om dig själv': 'frågor om personen själv, bakgrund, styrkor och svagheter',
      'Erfarenhet & färdigheter': 'frågor om tidigare erfarenheter, konkreta situationer och hur personen löser problem',
      'Motivation & mål': 'frågor om drivkrafter, intresset för tjänsten och framtiden',
      'Tekniska frågor': 'fackmässiga frågor om hantverket i yrket — det som en kollega i samma yrke skulle fråga om'
    };
    const kategori = typeof data?.kategori === 'string' ? KATEGORIER[data.kategori] : undefined;
    const kategoriRad = kategori
      ? `
Håll dig till ${kategori}.`
      : '';

    if (data?.anvandarSvar) {
      // Deltagaren har svarat — ge feedback och nästa fråga.
      //
      // SANNINGSREGELN (tillagd 2026-08-19). Den här prompten fanns i
      // `UTAN_KRAV` i ai-sanningsregel.test.ts med motiveringen att den
      // "påstår ingenting om användaren … skulle den börja sammanfatta svaren
      // hör den hemma i kravlistan igen". Utlösaren var redan uppfylld: grenen
      // nedan skriver 500 tokens fri text OM EN MÄNNISKAS SVAR och sätter ett
      // betyg på henne. Grinden såg det inte, eftersom den anropade
      // PROMPTS[namn]({}) — vilket alltid ger den ofarliga öppningsgrenen.
      // Både regeln och grinden är rättade.
      //
      // Systerprompten `intervju-sammanfattning` i samma fil har haft regeln
      // sedan G11. Den kopierades aldrig hit.
      return {
        system: `Du är en erfaren och varm intervjucoach som hjälper en arbetssökande att öva. Målgruppen kan ha varit utan jobb länge — var uppmuntrande och konkret, aldrig nedlåtande.

SANNINGSREGEL: bedöm ENDAST det som faktiskt står i svaret. Hitta aldrig på erfarenheter, egenskaper, utbildningar, språkkunskaper eller exempel som personen inte själv nämnt — och tillskriv henne heller inte åsikter eller känslor hon inte uttryckt. Är svaret kort eller tomt: säg det vänligt i feedbacken i stället för att gissa vad hon menade.

BETYGET: sätt "rating" bara om svaret går att bedöma. Är det för kort eller oklart, utelämna fältet helt hellre än att gissa — ett påhittat betyg är värre än inget betyg. Feedbacken ska handla om SVARET (struktur, konkretion, längd), aldrig om personen.

Svara ENDAST med JSON: {"rating":1-5,"feedback":"kort feedback om svaret","nastaFraga":"nästa intervjufråga"}`,
        user: `Övningsintervju för ${data?.roll}${data?.foretag ? ' på ' + data.foretag : ''}.${kategoriRad}

Fråga: ${data?.tidigareFragor?.[data.tidigareFragor.length-1]?.fraga || 'Berätta om dig själv'}
Deltagarens svar: ${data.anvandarSvar}

Ge kort feedback på svaret, betygsätt det 1-5 om det går att bedöma, och ställ nästa relevanta intervjufråga. Svara ENDAST med JSON.`,
        maxTokens: 500,
        responseKey: 'resultat',
        parseJson: true
      }
    } else {
      // Starta intervju — bara ställ första frågan.
      return {
        system: 'Du är rekryterare som intervjuar kandidater på svenska i en övningsintervju. SANNINGSREGEL: du vet ingenting om personen. Ställ en öppen fråga — hitta aldrig på att hon har en viss erfarenhet, utbildning eller egenskap, och formulera aldrig frågan så att den förutsätter något om henne.',
        user: `Starta en övningsintervju för rollen ${data?.roll}${data?.foretag ? ' på ' + data.foretag : ''}.${kategoriRad} Ställ en bra öppningsfråga. Svara ENDAST med frågan, inget annat.`,
        maxTokens: 200,
        responseKey: 'resultat'
      }
    }
  },
  // G11 (2026-07-27): helhetsbedömning efter en avslutad simulatorsession.
  // Tidigare fanns bara betyg per svar — ingen sammanvägd bild. Svarsformen
  // matchar IntervjuSimulatorResultSchema i client/src/services/aiSchemas.ts.
  'intervju-sammanfattning': (data) => {
    const historik = Array.isArray(data?.historik) ? data.historik.slice(0, 20) : [];
    const qaText = historik
      .map((h, i) => `${i + 1}. FRÅGA: ${h?.fraga || ''}\n   SVAR: ${h?.svar || '(inget svar)'}${typeof h?.rating === 'number' && h.rating > 0 ? `\n   Deltagarens eget betyg: ${h.rating}/5` : ''}`)
      .join('\n\n');
    return {
      system: `Du är en erfaren och varm intervjucoach som sammanfattar en övningsintervju för en arbetssökande. Målgruppen är arbetssökande som kan ha varit utan jobb länge — tonen ska vara uppmuntrande och konkret, aldrig nedslående eller dömande. Svara ENDAST med JSON i detta format:
{"overall_score":7,"strengths":["Konkret styrka du SER i svaren"],"improvements":["Konkret sak att öva på, formulerad som ett vänligt förslag"],"summary":"2-3 meningar som sammanfattar övningen"}
Regler: overall_score är ett heltal 0-10 för hela sessionen. strengths = 2-4 punkter, improvements = 2-3 punkter. Basera ALLT på de faktiska svaren nedan — hitta aldrig på erfarenheter, exempel eller egenskaper som inte framgår. Om ett svar är kort eller tomt: säg det vänligt i improvements i stället för att gissa vad personen menade. Skriv improvements som förslag ("Testa att ...") och aldrig som kritik. Allt på svenska.`,
      user: `Övningsintervju för rollen ${data?.roll || 'ej angiven'}${data?.foretag ? ' på ' + data.foretag : ''}.\nAntal besvarade frågor: ${historik.length}\n\n${qaText || 'Inga svar registrerade.'}\n\nSammanfatta hela övningen. Svara ENDAST med JSON.`,
      maxTokens: 900,
      responseKey: 'sammanfattning',
      parseJson: true
    };
  },
};
