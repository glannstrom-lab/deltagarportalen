// KA3 (2026-09-12): Ansökan: personligt brev och LinkedIn.
// Flyttad ordagrant ur api/ai.js. Sanningsregeln läggs på i ./index.js, inte här.

module.exports = {
  // Personligt brev.
  //
  // TRE KONTRAKTSFEL rättade 2026-08-19, alla i samma glapp mellan vad
  // klienten skickar och vad prompten läste. Följden var att brevet skrevs på
  // en fjärdedel av underlaget — och prompten förbjuder samtidigt modellen att
  // hitta på erfarenheter, så brevet MÅSTE bli vagt. Inget felmeddelande,
  // inget som såg trasigt ut; bara ett sämre brev än personen förtjänade.
  //
  //  1. `cv.workExperience` lästes, men prod-kolumnen heter `work_experience`
  //     och klienten skickar raden omappad. 17 av 26 CV:n i prod har alltså
  //     erfarenhet som aldrig nådde modellen.
  //  2. Tonen jämfördes mot 'entusiastisk'/'formell', men klienten skickar
  //     'enthusiastic'/'formal'. Alla tre tonknappar gav samma prompt.
  //  3. `data.erfarenhet` / `motivering` / `extraKeywords` lästes, men klienten
  //     skickar allt i `extraContext` — textarean "Extra motivation" och hela
  //     profilkontexten (körkort, kan börja omgående, värderingar) kastades bort.
  //
  // Båda formerna läses i stället för att klienten ändras: fältnamnen kommer
  // från två håll (CV-byggarens camelCase och databasens snake_case), och den
  // som lägger till en tredje anropare ska inte behöva veta vilken som gäller.
  'personligt-brev': (data) => {
    const ton = data.ton || data.tone || 'professionell';
    const tonText = (ton === 'entusiastisk' || ton === 'enthusiastic') ? 'entusiastisk och energisk'
                  : (ton === 'formell' || ton === 'formal') ? 'formell och traditionell'
                  : 'professionell och balanserad';
    let cvContext = '';
    if (data.cvData) {
      const cv = data.cvData;
      cvContext = `\nTitel: ${cv.title || 'Ej angiven'}`;
      cvContext += `\nSammanfattning: ${cv.summary || 'Ej angiven'}`;
      // camelCase från CV-byggaren, snake_case direkt ur `cvs`-raden.
      const erfarenhet = cv.workExperience || cv.work_experience;
      if (erfarenhet?.length) {
        cvContext += `\nErfarenhet: ${erfarenhet
          .map(e => [e.title, e.company].filter(Boolean).join(' på '))
          .filter(Boolean)
          .join(', ')}`;
      }
      if (cv.skills?.length) {
        // `skills` bär objekt i prod ({id,name,level,category}) men har varit
        // rena strängar i äldre rader. Lärdomen 2026-08-03 handlade om exakt
        // den skillnaden: `.map(s => s.name)` gav "undefined" för strängarna.
        cvContext += `\nKompetenser: ${cv.skills
          .map(s => (typeof s === 'string' ? s : s && s.name))
          .filter(Boolean)
          .join(', ')}`;
      }
      if (cv.education?.length) {
        cvContext += `\nUtbildning: ${cv.education
          .map(u => [u.degree, u.school].filter(Boolean).join(', '))
          .filter(Boolean)
          .join('; ')}`;
      }
    }
    const jobbAnnons = data.jobbAnnons || data.jobDescription || '';
    // Klienten samlar allt fritt underlag i `extraContext`; äldre anropare
    // skickar de tre separata fälten. Båda tas emot.
    const extraDelar = [
      data.erfarenhet ? `Erfarenhet: ${data.erfarenhet}` : '',
      data.motivering ? `Motivering: ${data.motivering}` : '',
      data.extraKeywords ? `Nyckelord: ${data.extraKeywords}` : '',
      data.extraContext ? String(data.extraContext) : '',
    ].filter(Boolean).join('\n');

    // Tomt underlag = byt uppgift, inte bara längd.
    //
    // Mätt mot prod 2026-08-19, TVÅ gånger: med bara en annons att gå på
    // skriver modellen ändå "Dessutom har jag goda kunskaper i svenska, både
    // i tal och skrift" — ordagrant den lögn granskningen hittade. Att korta
    // brevet hjälpte (250-350 → ~130 ord) men stoppade inte påhitten.
    //
    // Man kan inte be om ett personligt brev i första person om en person man
    // inte vet något om och samtidigt få ett sant svar; uppgiften kräver
    // påståenden. Alltså ändras uppgiften: ett utkast med tydliga luckor som
    // personen fyller i själv. Omöjligt att ljuga med, och mer användbart för
    // någon som inte vet hur ett brev ska se ut.
    //
    // Klienten sätter flaggan när det varken finns CV eller egen text.
    const harUnderlag = Boolean(cvContext.trim() || extraDelar.trim());
    const utkastlage = (data.tomtUnderlag === true || !harUnderlag)
      ? `

SÄRSKILT LÄGE — INGET UNDERLAG OM PERSONEN:
Du vet ingenting om den som söker. Skriv därför INTE ett färdigt brev i första person, utan ett UTKAST ATT FYLLA I:
- Skriv de meningar som går att skriva sant utifrån annonsen (intresset för tjänsten, vad i annonsen som lockar, vad rollen innebär).
- Där ett påstående om personen behövs, skriv i stället en lucka: "___" följt av en kort ledtråd inom parentes på samma rad, t.ex. "Jag har ___ (skriv vad du gjort som liknar det här)".
- Gör 3-5 sådana luckor, inte fler. Placera dem där de gör mest nytta.
- Påstå ALDRIG något om personens språk, erfarenhet, egenskaper, körkort eller tillgänglighet — inte ens som exempel inuti en lucka.
- Längd: 120-180 ord inklusive luckorna.`
      : '';
    return {
      // No-platshållare-reglerna portade från ai-cover-letter-edgen (C11,
      // 2026-07-23) innan klientdubbletterna raderades
      system: `Du är en expert på personliga brev för jobbansökningar på svenska. Skriv med en ${tonText} ton. Brevet ska vara 250-350 ord.

VIKTIGT:
- Använd ALDRIG platshållare som [Förnamn Efternamn], [Telefonnummer], [Mailadress] eller liknande.
- Skriv ENDAST brödtexten. Avsluta ALDRIG brevet med en hälsningsfras, avslutningsord eller signatur (t.ex. "Med vänliga hälsningar", namn, telefon, e-post) — mallen lägger till detta automatiskt med korrekta uppgifter. Låt sista stycket avsluta naturligt i sak, utan avslutningsfras.
- Hitta ALDRIG på erfarenheter, meriter, verktyg, kompetenser, titlar eller siffror (t.ex. antal år, antal projekt, resultat) som inte uttryckligen stöds av CV:t eller användarens egen input. Är du osäker på om något stämmer — utelämna det helt. Skriv bara sådant som går att verifiera mot underlaget.
- Förbudet gäller LIKA MYCKET personliga EGENSKAPER, VANOR och FÖRMÅGOR. Skriv aldrig att personen "är van vid" något, "trivs med" något, "är noggrann", "arbetar bra i team", "har lätt för att lära", behärskar ett språk, kan arbeta skift, har körkort eller liknande — om det inte uttryckligen står i underlaget. Det är just sådana meningar som gör ett brev trovärdigt, och de är lika osanna som en påhittad titel om personen aldrig sagt dem.
- Tillskriv inte heller ARBETSGIVAREN värderingar, kultur eller egenskaper som inte står i annonsen.
- ÄR UNDERLAGET TUNT ELLER TOMT (inget CV, ingen egen text): skriv då ett KORTARE brev — 120-180 ord — som bara handlar om intresset för tjänsten och om varför annonsen tilltalar, formulerat så att inga påståenden görs om personens bakgrund eller egenskaper. Ett kort och sant brev är oändligt mycket bättre än ett långt och påhittat: personen ska kunna skicka det som det är utan att ljuga för en arbetsgivare.
- Skriv korrekt svenska. Kontrollera särskilt genus (en/ett) och kongruens — mottagaren kan inte alltid granska språket själv.${utkastlage}`,
      user: `Skriv ett personligt brev för:\n\nFÖRETAG: ${data.companyName || 'Ej angivet'}\nJOBBTITEL: ${data.jobTitle || 'Ej angiven'}\n\nJOBBANNONS:\n${jobbAnnons.substring(0, 3000)}\n\nKANDIDATENS CV:${cvContext}\n${extraDelar}\n\nSkriv brevet:`,
      maxTokens: 1500,
      responseKey: 'brev'
    };
  },
  'linkedin-optimering': (data) => {
    const typ = data?.typ || 'headline';

    // LinkedIns fältgränser, kontrollerade 2026-08-20. Prompten kände tidigare
    // inte till dem alls: kontaktförfrågningar blev rutinmässigt flera gånger
    // längre än de ~200 tecken som får plats i en inbjudan, och användaren
    // upptäckte det först när LinkedIn kapade texten. Klienten skickar med
    // `maxTecken`; taken här är reserven om den inte gör det.
    const TECKENTAK = { headline: 220, about: 2600, post: 3000, connection: 200 };
    const tak = Number.isFinite(data?.maxTecken) ? data.maxTecken : (TECKENTAK[typ] || 2600);

    // Bara ifyllda fält går vidare. Ett tomt formulär gav tidigare
    // `{"yrke":"","erfarenhet":""}` plus ordern "skriv 3 rubriker" — den enda
    // situation där modellen MÅSTE hitta på för att kunna lyda.
    const underlag = Object.fromEntries(
      Object.entries(data?.data || {}).filter(([, v]) => typeof v === 'string' ? v.trim() : v)
    );

    const prompts = {
      headline: `Skriv 3 förslag på LinkedIn-rubrik (max ${tak} tecken vardera, det viktigaste i de första 70) utifrån: ${JSON.stringify(underlag)}`,
      about: `Skriv ett "Om"-avsnitt till LinkedIn (max ${tak} tecken, det viktigaste i de första 300) utifrån: ${JSON.stringify(underlag)}`,
      post: `Skriv ett LinkedIn-inlägg (max ${tak} tecken, det viktigaste i de första 210) om: ${JSON.stringify(underlag)}`,
      connection: `Skriv ett meddelande till en kontaktförfrågan på LinkedIn. Det MÅSTE rymmas inom ${tak} tecken inklusive hälsning och avslutning. Underlag: ${JSON.stringify(underlag)}`
    };

    return {
      system: 'Du är LinkedIn-expert. Skriv på svenska. SANNINGSREGEL: bygg endast på personens egna uppgifter. '
        + 'Hitta aldrig på titlar, arbetsgivare, utbildningar, kompetenser, certifikat eller siffror '
        + '(antal år, antal projekt, resultat). Profilen ska personen kunna stå för i en intervju. '
        + 'Är underlaget tunt — skriv kortare, inte mer. '
        + `Håll dig inom teckengränsen som anges i uppgiften (${tak} tecken) — en text som är längre går inte att använda. `
        + 'Skriv enkelt och konkret. Undvik engelska modeord och superlativ om personen själv.',
      user: prompts[typ] || prompts.headline,
      maxTokens: 800,
      responseKey: 'text'
    };
  },
};
