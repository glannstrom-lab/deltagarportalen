// KA3 (2026-09-12): CV: jobbmatchning, import, profiltext och CV-skrivning.
// Flyttad ordagrant ur api/ai.js. Sanningsregeln läggs på i ./index.js, inte här.
const { skillText } = require('./_delat');

module.exports = {
  'cv-jobbmatchning': (data) => ({
    system: `Du är expert på CV-matchning mot jobbannonser i Sverige. Svara ENDAST med JSON i detta format:
{"matchScore":75,"foundKeywords":["nyckelord som finns i CV:t"],"missingKeywords":["viktiga krav som saknas"],"suggestedSummaryAdditions":["kort mening i första person"],"jobTitle":"tjänstens titel","companyName":"företaget"}
Regler: matchScore 0-100 utifrån hur väl CV:t täcker annonsens krav. foundKeywords/missingKeywords = korta ord/fraser på svenska, max 10 per lista. suggestedSummaryAdditions = max 3 korta meningar som kan läggas till i CV-sammanfattningen — föreslå bara sådant som rimligen stämmer utifrån CV:t, hitta ALDRIG på erfarenheter.`,
    user: `JOBBANNONS:\n${data?.jobDescription || ''}\n\nCV:\n${data?.cvText || ''}\n\nSvara ENDAST med JSON.`,
    maxTokens: 900,
    responseKey: 'analys',
    parseJson: true
  }),
  // Strukturerar ett UPPLADDAT CV (PDF/Word) till CV-byggarens fält.
  // Sanningsregeln är hela poängen: modellen får bara flytta text som redan
  // står i filen. Ett "förbättrat" eller påhittat CV vore ett påstående om
  // personens liv som den inte gjort själv — samma felklass som portalen
  // rensade bort 2026-08-09. Tomt fält utelämnas hellre än gissas.
  // ── CV-import: TVÅ prompts, avsiktligt ───────────────────────────────
  //
  // Importen var ett enda anrop till 2026-08-19 och timade ut med 504 för
  // varje CV av normal längd. Uppmätt mot prod: den låsta modellen levererar
  // ~9 tokens/s (275 tokens tog 29 s), och Vercel-funktionen dödas vid 60 s.
  // Ett helt CV kräver 800–1200 tokens ut — alltså 90–130 s. Det gick inte
  // att lösa med ett högre `maxTokens`; taket styr inte hastigheten.
  //
  // Lösningen är att dela arbetet i två svar som klienten hämtar PARALLELLT.
  // Varje svar landar på 150–300 tokens, alltså 20–35 s med marginal.
  // Slår du ihop dem igen får du tillbaka timeouten.
  //
  // Båda delar samma sanningsregel: modellen är en FORMATERARE. Den flyttar
  // text som redan står i filen och får inte skriva om, förbättra eller hitta
  // på — ett "förbättrat" CV vore ett påstående om personens liv som hen inte
  // gjort själv.

  // Del 1: kontaktuppgifter, profiltext, kompetenser, språk, certifikat.
  'cv-import': (data) => ({
    system: `Du strukturerar en befintlig CV-text till JSON. Du är en FORMATERARE, inte en skribent.

Svara ENDAST med JSON i detta format:
{"firstName":"","lastName":"","title":"","email":"","phone":"","location":"","summary":"","skills":[""],"languages":[{"language":"","level":""}],"certificates":[{"name":"","issuer":"","date":""}]}

ABSOLUTA REGLER:
- Skriv ALDRIG något som inte står i texten. Hitta inte på kompetenser, orter eller formuleringar.
- Förbättra INTE språket. Kopiera texten som den står, bara städad från radbrytningar och sidnummer.
- Saknas ett fält: lämna tom sträng eller tom lista. Gissa aldrig.
- summary: bara om CV:t har en egen profiltext. Skriv aldrig en ny. Max 400 tecken, ordagrant.
- skills: korta ord/fraser som faktiskt listas som kompetenser. Max 20.
- email och phone kommer ALDRIG fram till dig: serverns PII-strykning ersätter dem
  med [BORTTAGET-EPOST] och [BORTTAGET-TELEFON] innan texten når hit. Skriv aldrig av en sådan
  platshållare som om den vore ett värde — lämna fälten tomma. Personen fyller i dem själv.
- location står ofta på samma rad som de överstrukna kontaktuppgifterna, nära toppen. Den går
  bra att ta med.
- Personnummer, kön, hälsa, medborgarskap och foto ska ALDRIG med.
- Ta INTE med arbetslivserfarenhet eller utbildning här. De hämtas separat.`,
    user: `CV-TEXT (utläst ur uppladdad fil):
${(data?.cvText || '').substring(0, 10000)}

Svara ENDAST med JSON.`,
    // Samma resonemang som för erfarenhetsdelen nedan: budgeten ska rymma
    // modellens tänkande OCH svaret. Rubrikdelen lyckas i dag, men med okänd
    // marginal — och ett tomt svar syns som "No response from AI", inte som
    // ett kortare svar.
    maxTokens: 2400,
    // Uppgiften är ren formatering — det finns inget att resonera om, och
    // varje tänkt token äts ur samma budget som svaret.
    reasoningEffort: 'low',
    responseKey: 'cv',
    parseJson: true
  }),

  // Del 2: arbetslivserfarenhet och utbildning.
  //
  // `description` utelämnas med flit. Beskrivningarna är den överlägset
  // största delen av utdatan — att återge dem ordagrant var det som sprängde
  // tidsbudgeten. Personen har kvar sin egen fil och skriver in det som
  // behövs; UI:t säger uttryckligen att beskrivningarna inte följer med, så
  // ingen tror att de försvunnit.
  // Del 2: arbetslivserfarenhet och utbildning.
  //
  // KOMPAKT FORMAT, och det är hela poängen. Uppmätt mot prod 2026-08-19:
  // modellen ger ~9 tokens/s och funktionen dör vid 60 s, alltså ~500 tokens
  // utdata i praktiken. Med vanlig JSON kostar en tjänst ~70 tokens — och
  // merparten av dem är NYCKELNAMNEN, som upprepas för varje rad. Tio
  // tjänster blev 800–1200 tokens och timade ut med 504, även efter att
  // resonemangsnivån sänkts.
  //
  // Positionella arrayer kostar ~25 tokens per tjänst i stället för ~70. Tio
  // tjänster landar då runt 250 tokens, med marginal. Klienten ser ingen
  // skillnad: validatorn nedan expanderar tillbaka till objektform.
  //
  // Lägg inte tillbaka nyckelnamnen "för läsbarhetens skull" — det är precis
  // det som sprängde tidsbudgeten.
  //
  // `description` utelämnas med flit. Beskrivningarna var den överlägset
  // största delen av utdatan, och det är också texten personen helst
  // formulerar själv. UI:t säger uttryckligen att de inte följer med.
  'cv-import-erfarenhet': (data) => ({
    system: `Du strukturerar en befintlig CV-text till kompakt JSON. Du är en FORMATERARE, inte en skribent.

Svara ENDAST med JSON i EXAKT detta format:
{"w":[["titel","företag","startdatum","slutdatum",0]],"e":[["skola","examen","inriktning","startår","slutår"]]}

"w" = arbetslivserfarenhet, en array per tjänst i ordningen:
  [titel, företag, startdatum, slutdatum, pågående]
  pågående är 1 om tjänsten pågår, annars 0. Är den pågående: sätt slutdatum till "".
"e" = utbildning, en array per utbildning i ordningen:
  [skola, examen, inriktning, startår, slutår]

ABSOLUTA REGLER:
- Skriv ALDRIG något som inte står i texten. Hitta inte på arbetsgivare, titlar eller datum.
- Ta med de 10 SENASTE tjänsterna och de 5 senaste utbildningarna, nyast först.
- Skriv INGA beskrivningar. Formatet har ingen plats för dem.
- Datum skrivs exakt som de står ("2019-03", "mars 2019", "2019"). Räkna inte om, fyll inte i saknade delar.
- Saknas ett värde: skriv tom sträng "" på dess plats. Hoppa aldrig över en plats i arrayen.
- Inga nyckelnamn, inga radbrytningar inuti arrayerna, ingen förklarande text.`,
    user: `CV-TEXT (utläst ur uppladdad fil):
${(data?.cvText || '').substring(0, 10000)}

Svara ENDAST med JSON.`,
    // Budgeten rymmer TÄNKANDET plus svaret, inte bara svaret.
    //
    // Uppmätt mot prod 2026-08-19 med `finish_reason` och `usage` i loggen:
    // vid maxTokens 1600 blev `completion_tokens` exakt 1600, `finish_reason`
    // "length" — och `reasoning_tokens` **1691**. Modellen tänkte alltså
    // längre än hela budgeten och hade noll kvar till svaret, vilket kom
    // tillbaka som tomt `content` och "No response from AI".
    //
    // Svaret självt är litet (~250 tokens i kompakt form). Det som kostar är
    // resonemanget, och `reasoning: { effort: 'low' }` räckte inte för att få
    // ner det. 2600 ger 1700 för tänkandet, 250 för svaret och marginal.
    // Tiden håller: den lyckade körningen tog 29,8 s av 60 tillgängliga.
    //
    // Sänk inte taket för att "spara tokens" — det som händer då är att
    // svaret försvinner helt, inte att det blir kortare.
    maxTokens: 2600,
    reasoningEffort: 'low',
    responseKey: 'cv',
    parseJson: true
  }),
  'profile-summary': (data) => {
    // Build experience text
    let experienceText = '';
    if (data?.experience?.length) {
      experienceText = data.experience.map(e => `${e.title} på ${e.company}${e.description ? ': ' + e.description : ''}`).join('\n');
    }

    // Build education text
    let educationText = '';
    if (data?.education?.length) {
      educationText = data.education.map(e => `${e.degree} från ${e.school}`).join('\n');
    }

    // Build skills text
    let skillsText = '';
    if (data?.skills?.length) {
      skillsText = data.skills.map(s => skillText(s) + (s && s.level ? ` (nivå ${s.level}/5)` : '')).filter(Boolean).join(', ');
    }

    return {
      // AR4/B26 (2026-08-17): sanningsregeln saknades här, till skillnad från
      // grannfunktionen `intervju-sammanfattning` några rader ner. Det är
      // allvarligare i just den här: resultatet sparas till `profiles.ai_summary`
      // (se profileEnhancementsApi.ts), alltså landar en påhittad persona i
      // databasen och visas sedan som deltagarens egen profiltext.
      //
      // Notera att fälten ofta är tomma ("Ej angivet" nedan) — en modell som
      // ombeds skriva "engagerande" om ingenting fyller i luckorna själv.
      system: `Du är en expert på att skriva professionella profilsammanfattningar på svenska. Skriv en sammanfattning (3-5 meningar) som lyfter fram personens styrkor, erfarenhet och mål. Använd ett varmt men professionellt tonläge som passar en jobbsökande.

SANNINGSREGEL: bygg ENDAST på uppgifterna nedan. Hitta aldrig på yrkestitlar, arbetsgivare, utbildningar, kompetenser, personlighetsdrag, ambitioner eller siffror (antal år, antal projekt, resultat) som inte står där. Står ett fält som "Ej angivet" ska du inte fylla i det — utelämna det i stället.
Om underlaget är för tunt för 3-5 meningar: skriv en kortare och ärligare sammanfattning. En kort sann text är alltid bättre än en längre påhittad — texten sparas på personens profil och kan följa med till en arbetsgivare.`,
      user: `Skriv en professionell profilsammanfattning för denna person:

NAMN: ${data?.name || 'Ej angivet'}
TITEL: ${data?.title || 'Ej angiven'}
ORT: ${data?.location || 'Ej angiven'}

ERFARENHET:
${experienceText || 'Ej angiven'}

UTBILDNING:
${educationText || 'Ej angiven'}

KOMPETENSER:
${skillsText || 'Ej angivna'}

ÖNSKADE JOBB: ${data?.desiredJobs?.join(', ') || 'Ej angivet'}
INTRESSEN: ${data?.interests?.join(', ') || 'Ej angivna'}

Skriv en sammanfattning på 3-5 meningar som passar i en jobbsökarprofil:`,
      maxTokens: 500,
      responseKey: 'summary'
    };
  },
  'cv-writing': (data) => {
    const content = data?.content || '';
    const type = data?.type || 'summary'; // summary, experience, skills
    const feature = data?.feature || 'improve'; // improve, quantify, translate, generate
    const cvData = data?.cvData || {};

    // Build context from CV data
    let cvContext = '';
    if (cvData.title) cvContext += `Yrkestitel: ${cvData.title}\n`;
    if (cvData.firstName || cvData.lastName) cvContext += `Namn: ${cvData.firstName || ''} ${cvData.lastName || ''}\n`;

    if (cvData.workExperience?.length) {
      // B14: datumen skickas med så att "antal års erfarenhet" kan RÄKNAS ur
      // underlaget i stället för att gissas. Den tidigare `totalYears`-raden
      // (`workExperience.length * 2 // Rough estimate`) var en påhittad siffra
      // och är borttagen.
      cvContext += `Arbetslivserfarenhet (${cvData.workExperience.length} tjänster):\n`;
      cvData.workExperience.slice(0, 3).forEach(exp => {
        cvContext += `- ${exp.title || 'Titel ej angiven'} på ${exp.company || 'Företag ej angivet'}`;
        const period = [exp.startDate, exp.current ? 'pågående' : exp.endDate].filter(Boolean).join('–');
        if (period) cvContext += ` (${period})`;
        if (exp.description) cvContext += `: ${exp.description.substring(0, 150)}`;
        cvContext += '\n';
      });
    }

    if (cvData.education?.length) {
      cvContext += `Utbildning:\n`;
      cvData.education.slice(0, 2).forEach(edu => {
        cvContext += `- ${edu.degree || ''} ${edu.field ? 'inom ' + edu.field : ''} från ${edu.school || ''}\n`;
      });
    }

    if (cvData.skills?.length) {
      const topSkills = cvData.skills.slice(0, 8).map(s => skillText(s)).filter(Boolean).join(', ');
      cvContext += `Kompetenser: ${topSkills}\n`;
    }

    const featurePrompts = {
      improve: {
        summary: `Förbättra denna CV-sammanfattning. Gör den mer professionell, engagerande och resultatfokuserad. Använd aktiva verb och undvik vaga fraser. Behåll längden ungefär samma. Använd personens faktiska bakgrund från CV-datan.`,
        experience: `Förbättra denna arbetserfarenhetsbeskrivning. Gör den mer resultatfokuserad med aktiva verb. Lyft fram prestationer och ansvar tydligt.`,
        skills: `Förbättra denna kompetensbeskrivning. Gör den mer specifik och professionell.`
      },
      // B14 (2026-08-05): den gamla lydelsen ("Föreslå rimliga siffror baserat
      // på personens bakgrund") bad uttryckligen modellen att uppfinna tal, och
      // texten hamnar i användarens CV som skickas till arbetsgivare. Nu får
      // modellen bara lyfta fram siffror som HAR TÄCKNING i underlaget, och
      // uttrycklig order att utelämna siffran när täckning saknas.
      quantify: {
        summary: `Lyft fram de kvantifierbara resultat som redan har täckning i underlaget nedan — t.ex. antal år i yrket (räknat ur de angivna anställningsperioderna), antal tjänster, teamstorlek, antal kunder eller mätbara förbättringar som står i texten.

ABSOLUTA REGLER FÖR SIFFROR:
- Skriv aldrig ett tal som inte står i underlaget eller går att räkna ut direkt ur det.
- Uppskatta, avrunda uppåt eller "exemplifiera" aldrig med påhittade tal. Inga procentsatser, belopp eller antal som inte finns i underlaget.
- Saknas täckning för en siffra: skriv meningen konkret UTAN siffra i stället. Utelämna hellre än att gissa.
- Använd aldrig platshållare som [X år], [antal] eller "ca X %".
- Finns inget kvantifierbart alls i underlaget: returnera en förbättrad text helt utan siffror. Det är ett korrekt svar, inte ett misslyckande.`,
        experience: `Lyft fram de kvantifierbara resultaten i denna arbetsbeskrivning — men bara de som redan framgår av beskrivningen eller av CV-datan nedan (t.ex. antal medarbetare, antal kunder, volymer, tidsperioder, mätbara resultat som nämns).

ABSOLUTA REGLER FÖR SIFFROR:
- Skriv aldrig ett tal som inte står i underlaget eller går att räkna ut direkt ur det.
- Härled aldrig siffror ur "rollens karaktär" eller vad som är vanligt i yrket — det är gissningar, och de hamnar i personens CV.
- Saknas täckning för en siffra: gör meningen konkret med vad personen faktiskt gjorde, utan siffra.
- Använd aldrig platshållare som [X] eller ungefärliga tal ("ca", "omkring", "uppskattningsvis").
- Finns inget kvantifierbart i underlaget: returnera en skärpt beskrivning helt utan siffror.`,
        skills: `Gör dessa kompetenser mer konkreta med exempel som har täckning i underlaget nedan.

ABSOLUTA REGLER: hitta aldrig på nivåer, antal år, certifieringar eller projekt som inte framgår av underlaget. Saknas underlag för en nivåangivelse — utelämna den. Inga påhittade siffror, inga platshållare som [X år].`
      },
      translate: {
        summary: `Översätt denna CV-sammanfattning till engelska. Behåll den professionella tonen och anpassa till internationella CV-standarder.`,
        experience: `Översätt denna arbetserfarenhet till engelska. Använd professionell terminologi och internationella standarder.`,
        skills: `Översätt dessa kompetenser till engelska med professionell terminologi.`
      },
      generate: {
        summary: `Skriv en professionell CV-sammanfattning på 3-4 meningar baserat på personens CV-data nedan. Sammanfattningen ska:
- Börja med yrkestitel och erfarenhetsnivå
- Lyfta fram konkreta styrkor och kompetenser
- Nämna relevanta prestationer eller ansvarsområden
- Avsluta med karriärmål eller vad personen söker

VIKTIGT: Använd INTE platshållare som [X år] eller [område]. Skriv konkret text baserat på den faktiska datan. Om viss information saknas, fokusera på det som finns.`,
        experience: `Generera en förbättrad version av denna arbetsbeskrivning. Fokusera på resultat, ansvar och prestationer.`,
        skills: `Generera en mer detaljerad beskrivning av dessa kompetenser med konkreta exempel.`
      }
    };

    // B14/B9: sanningskravet ligger i systemprompten så att det gäller ALLA
    // features, inte bara quantify. Ett CV med påhittade siffror eller
    // erfarenheter kan kosta någon jobbet — utelämna hellre än att gissa.
    const systemPrompt = [
      'Du är en expert på CV-skrivning. Ge konkreta, professionella förslag på svenska (om inte översättning efterfrågas).',
      'Svara ENDAST med den färdiga texten, ingen inledning, förklaring eller platshållare som [X]. Skriv fullständiga meningar med konkret information.',
      'SANNINGSKRAV: texten hamnar i en riktig persons CV och skickas till arbetsgivare.',
      'Du får aldrig hitta på erfarenheter, arbetsgivare, titlar, utbildningar, verktyg, certifieringar eller siffror.',
      'Varje siffra du skriver måste stå i underlaget eller gå att räkna ut direkt ur det. Uppskatta aldrig, avrunda aldrig uppåt, exemplifiera aldrig med påhittade tal.',
      'Är du osäker på om något har täckning i underlaget: utelämna det. En kortare, sann text är alltid bättre än en längre med gissningar.'
    ].join(' ');

    let userPrompt = featurePrompts[feature]?.[type] || featurePrompts.improve.summary;

    if (cvContext) {
      userPrompt += `\n\nPersonens CV-data:\n${cvContext}`;
    }

    if (content) {
      userPrompt += `\n\nBefintlig text att ${feature === 'generate' ? 'utgå från' : 'bearbeta'}:\n${content}`;
    }

    return {
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 800,
      responseKey: 'result'
    };
  },
};
