# AI-lagret — granskning 2026-08-04

Granskad kod, inte dokumentation. Alla påståenden nedan är verifierade mot filerna
i repot 2026-08-04. Ingen kod har ändrats.

**Premissrättelser mot dokumentationen (läs först):**

| Doc säger | Verkligheten |
|---|---|
| `AI_ARCHITECTURE_OVERVIEW.md` §2: "16 funktioner", "1084 rader" | **18 funktioner**, 1237 rader (`client/api/ai.js`). Nya sedan C15: `intervju-sammanfattning` (:474), `vecko-reflektion` (:888) |
| `AI_MODEL_LOCKING.md` tabell: "ai.js (18 funktioner)" + "ai-stream.js (13 funktioner)" | `client/api/ai-stream.js` **finns inte** (arkiverad). Siffran 18 stämmer numera av en slump |
| §1: "Klienten pratar med ai.js **uteslutande** via aiApi.ts" | **Falskt.** `AgentChat.tsx:193` gör rå `fetch('/api/ai')` förbi `callAI` → förbi PII-saneringen (se AI-04) |
| `aiSchemas.ts` ligger i `client/src/lib/` | Ligger i `client/src/services/aiSchemas.ts` |
| §3.2: "fyra AI-edge-funktioner har noll klientanropare" | **Nio** edge-funktioner har noll anropare (se tabell 2) |
| AI-ACT-CLASSIFICATION.md listar 32 funktioner, varav 8 borttagna i C12 | Dokumentet är ett år efter koden; `vecko-reflektion`, `intervju-sammanfattning`, `konsulent-rapportutkast`, `cv-jobbmatchning` är oklassade |

---

## Sammanfattning av allvarlighetsgrad

| ID | Rubrik | Allvarlighet |
|---|---|---|
| AI-01 | "Din AI-assistent" hittar på statistik om användaren — helt påhittad | **KRITISK** |
| AI-17 | Konsulentens "AI-insikter" handlar om fyra deltagare som inte finns | **KRITISK** |
| AI-02 | Intervjusimulatorn sätter betyg 3/5 och "Bra svar!" som AI aldrig gav | **KRITISK** |
| AI-03 | Arbetsmarknadstrender är `Math.random()` — visas under AI-märkning | **HÖG** |
| AI-18 | Lönestatistiken är handskriven men attribueras till SCB | **MEDEL** |
| AI-19 | Fem påhittande komponenter ligger ett import-uttryck från att bli skarpa | **LÅG** |
| AI-04 | AI-team-chatten går förbi PII-saneringen och samtyckesgrinden | **HÖG** |
| AI-05 | `cv-writing`-prompten beordrar modellen att hitta på siffror i CV:t | **HÖG** |
| AI-06 | ART9_FUNCTIONS saknar `ai-team-chat` (arbetsterapeut-agenten) | **HÖG** |
| AI-07 | `cv-analysis` bryter modell-låsningen (gpt-4 mot OpenAI, ingen rate limit) | **MEDEL** |
| AI-08 | Edge-fallbacks skriver påhittad analys till databasen | **MEDEL** |
| AI-09 | Art. 50-märkning saknas på fem levande AI-ytor | **MEDEL** |
| AI-10 | `sta-week-summary` saknar `parseJson` — returnerar rå JSON-sträng | **MEDEL** (död kod) |
| AI-11 | Ovaliderade AI-svar: tre funktioner castas rakt av | **MEDEL** |
| AI-12 | `ai-assistant`-edgen låter klienten välja modell | **MEDEL** (död kod) |
| AI-13 | `send-inactivity-warning` saknar auth helt | **MEDEL** |
| AI-14 | Nio callerlösa edge-funktioner + tre döda STA-AI-vägar | **LÅG** |
| AI-15 | Modell-lås-läcka via `AI_MODEL_HAIKU` | **LÅG** |
| AI-16 | Perplexity-funktionerna saknar timeout | **LÅG** |

---

## AI-01 — "Din AI-assistent" hittar på statistik om användaren

**Allvarlighet:** KRITISK

**Bevis:**

Komponenten är monterad och nåbar: `App.tsx:41` + `App.tsx:259` (`/exercises`) →
`pages/Exercises.tsx:791` och `:842` renderar `<AIAssistant />` (två gånger).

`client/src/components/ai/AIAssistant.tsx:158-163`:
```js
// Simulated activity data - in production from API
const mockActivities = useMemo(() => [
  { created_at: new Date(Date.now() - 86400000).toISOString(), type: 'login' },
  { created_at: new Date(Date.now() - 172800000).toISOString(), type: 'cv_update' },
  { created_at: new Date(Date.now() - 259200000).toISOString(), type: 'job_search' },
], [])
```

Dessa tre påhittade aktiviteter matas in i `analyzeBehavior()` (`:166`). Alla tre
ligger inom 14 dagar, så `recentActivities.length === 3` och
`olderActivities.length === 0` (`:66-76`). Villkoret på `:78`
(`3 > 0 * 1.2`) är **alltid sant** → `trendDirection` är alltid `'up'`.

`AIAssistant.tsx:100-108` returnerar dessutom hårdkodat:
```js
mostActiveDay: t('ai.assistant.days.tuesday'),   // alltid "Tisdag"
mostActiveHour: 10,                              // alltid 10
optimalEnergyLevel: 'medium',                    // alltid medium
```

och en uppfunnen prognosformel (`:89-98`):
```js
const interviewChance = Math.min(95, Math.round(
  (cvScore * 0.4) + (Math.min(applicationsCount * 5, 30)) + (wellnessScore * 2)))
const daysToInterview = applicationsCount > 0 && interviewChance > 50
  ? Math.round(14 - (interviewChance / 100) * 10) : null
```

**Vad användaren faktiskt läser** (`client/src/i18n/locales/sv.json`, `ai.assistant`):

- "Du är **40% mer** aktiv än förra månaden" — alltid, för alla, även dag 1
- "Dina ansökningar på tisdagar får **3x fler svar**" — helt hittat på
- "När du loggar välmående ökar din aktivitet med **25%**" — helt hittat på
- "Baserat på din takt: **Intervju inom {{days}} dagar** (konfidens: {{confidence}}%)"
- "Din chans till intervju är **{{chance}}%** – varje ansökan ökar oddsen!"
- "Du är mest aktiv på **tisdagar 10-11**. Perfekt tid för reflektion!"
- "Användare som söker 5+ jobb har **78% chans** till intervju inom 30 dagar"
- "**+10% ATS-score**" / "ATS-analysen visar att din mall kan förbättras" — någon ATS-analys körs inte

Allt presenteras under rubriken **"Din AI-assistent"** med hjärnikon
(`AIAssistant.tsx:191-192`), och koden kallar sig själv "ML-analys" (`:26`).

**Konsekvens:** Det här är portalens grövsta ärlighetsbrott. Målgruppen är
långtidsarbetslösa. Att säga "Intervju inom 8 dagar (konfidens: 72 %)" till
någon som varit arbetslös i två år, byggt på en formel som inte har någon
koppling till verkligheten, är både ett förtroendehaveri och — eftersom ytan
marknadsförs som AI — ett problem mot AI Act art. 50 och mot marknadsförings-
lagens förbud mot vilseledande påståenden. Ingen av siffrorna går att belägga.

**Åtgärd:** Ta bort `AIAssistant` från `Exercises.tsx:791` och `:842` omedelbart
(snabbast, noll risk — komponenten har inga andra konsumenter än `AIToolsPanel.tsx:98`,
som i sin tur saknar importörer). Bygg därefter om den från grunden på verklig
data, eller släng den. Radera i18n-nycklarna `ai.assistant.insights.*` och
`ai.assistant.actions.*Reason/*Impact` så de inte återanvänds.

**Storlek:** S för borttagning (1 h). L för att bygga en ärlig ersättare.

---

## AI-17 — Konsulentens "AI-insikter" handlar om deltagare som inte finns

**Allvarlighet:** KRITISK

**Bevis:** `client/src/pages/Consultant.tsx:23` lazy-importerar och `:52` renderar
`<AICoachAssistant context="overview" />`. Sidan är routad på `/consultant`
(`App.tsx:45`, `:272`) — portalens **enda** konsulentvy.

`client/src/components/consultant/AICoachAssistant.tsx:62-101`:
```js
// Mock AI responses based on context
const getContextualInsights = (context: string, participantName?: string): Insight[] => {
  const baseInsights: Insight[] = [
    { id: '1', type: 'warning', title: 'Inaktiv deltagare',
      description: 'Maria Lindberg har inte loggat in på 12 dagar. Överväg att kontakta henne.',
      priority: 'high', participant: { id: 'p1', name: 'Maria Lindberg' } },
    { id: '2', … 'Erik Svensson har uppnått 85% CV-kvalitet. Dags för intervjuträning?' },
    { id: '3', … 'Anna Karlssons profil matchar 3 nya jobb inom IT-support.' },
    { id: '4', … 'Jonas Berg har genomfört 5 jobbansökningar denna vecka!' },
  ]
```

Korten renderas via `InsightCard` (`:181-199`) med prioritetsfärger — "Inaktiv
deltagare" får `border-l-red-500` (`:196`) och varningsikon. Deltagarnamnen är
klickbara med handlingsknappar (`onScheduleMeeting`, `onSendMessage`,
`onCreateGoal`, `:57-59`).

Chatten är lika falsk: `:171-177`
```js
// Simple keyword matching for demo
const lowerMessage = message.toLowerCase()
if (lowerMessage.includes('cv')) return responses.cv
if (lowerMessage.includes('intervju')) return responses.interview
return responses.default
```
Fyra fasta svar via nyckelordsmatchning, med en simulerad "tänketid" på
1–1,5 s (`Math.random()`, `:128`). Inget AI-anrop sker. Ingenting i UI:t
markerar detta som demo.

**Konsekvens:** Detta är värre än AI-01, trots att färre ser det. En
arbetskonsulent loggar in på `/consultant` och får en röd högprioriterad varning
om att "Maria Lindberg inte loggat in på 12 dagar". Maria Lindberg finns inte.
Konsulenten kan agera på informationen — leta efter deltagaren, oroa sig,
dokumentera. Samtidigt döljs eventuella *riktiga* inaktiva deltagare, eftersom
ytan som ska larma om dem är upptagen av fyra hittepå-personer. En yta som
ljuger om deltagares aktivitet i en arbetsmarknadsinsats är också ett
dokumentationsproblem gentemot uppdragsgivaren.

**Åtgärd:** Ta bort `<AICoachAssistant />` från `Consultant.tsx:52` idag.
Komponenten har ingen annan konsument. Bygg om från riktiga
`consultant_participants`-data om funktionen ska finnas, och märk den enligt
art. 50 när den faktiskt anropar AI.

**Storlek:** XS för borttagning (15 min). L för en riktig implementation.

---

## AI-02 — Intervjusimulatorn sätter betyg som AI aldrig gav

**Allvarlighet:** KRITISK

**Bevis:** `client/src/pages/InterviewSimulator.tsx:342-357`
```js
if (resultat && typeof resultat === 'object') {
  setHistorik([...historik, {
    ...nyFragaSvar,
    rating: resultat.rating || 3,          // ← AI utelämnar betyg → användaren får 3/5
    feedback: resultat.feedback || 'Bra svar!'   // ← hårdkodat beröm
  }])
  setNuvarandeFraga(resultat.nastaFraga || 'Vad är dina framtidsplaner?')
} else {
  setHistorik([...historik, { ...nyFragaSvar, feedback: 'Bra svar!' }])  // :354
```

och vid totalt AI-fel, `:363-371`:
```js
} catch {
  const allQuestions = questionCategories.flatMap(cat => cat.questions)
  const nextQuestion = allQuestions[antalFragor % allQuestions.length] || '...'
  setHistorik([...historik, nyFragaSvar])   // rating förblir 0, ingen felsignal
```

Betyget propagerar till en synlig poäng — `:517` beräknar snittet och `:712`
och `:860` renderar `{avgRating}/5` som sessionens resultat. `:474` skriver in
samma snitt i den nedladdningsbara sammanfattningen, `:458` sparar det i
sessionshistoriken.

Svaret är dessutom **ovaliderat**: `intervju-simulator` har `parseJson: true`
(`client/api/ai.js:459`) men klienten castar rakt av (`:333`, `:340`) — inget
Zod-schema, till skillnad från `intervju-sammanfattning` på samma sida.

**Konsekvens:** Två olika lögner. (1) När modellen svarar utan `rating` får
användaren beskedet "3/5, Bra svar!" om ett svar som ingen bedömt. (2) När
AI-anropet failar loggas svaret med rating 0 utan att något sägs — snittbetyget
sjunker och användaren tror att hen presterade dåligt. `|| 3` träffar även
legitim rating 0. Detta är samma klass som den hårdkodade 50 %-matchningen.

**Åtgärd:** Zod-validera `intervju-simulator`-svaret (schemat finns delvis
redan). Utelämnat betyg ska ge "ej bedömt", inte 3. Utelämnad feedback ska ge
tomt, inte "Bra svar!". `catch` ska visa ett ärligt fel — samma mönster som
`hamtaAiSammanfattning` (`:433-434`) redan använder korrekt på samma sida.
Snittbetyget ska räknas på faktiskt betygsatta svar.

**Storlek:** M (0,5 dag)

---

## AI-03 — Arbetsmarknadstrender är slumptal, visade under AI-märkning

**Allvarlighet:** HÖG

**Bevis:** `supabase/functions/af-trends/index.ts` fabricerar i **normalvägen**,
inte i ett felfallback:

```js
:98   new_jobs_today: Math.floor(data.total?.value * 0.02) || 0,   // "Estimate ~2% new daily"
:99   new_jobs_week:  Math.floor(data.total?.value * 0.12) || 0,
:100  avg_time_to_hire_days: 35,   // "Industry average"
:101  competition_index: 6.5,      // "Industry average"
:106  growth_percent: Math.floor(Math.random() * 10) + 1,  // "Would need historical data for real growth"
:172  demand: Math.max(95 - skills.length * 5, 50),   // = position i loopen, inte efterfrågan
:173  trend: skills.length < 3 ? 'up' : skills.length < 6 ? 'stable' : 'down',
:174  job_count: Math.floor(field.count / fieldSkills.length),
:216  change_percent: index < 3 ? Math.floor(Math.random() * 15) + 5 : …
```

Detta renderas skarpt. `App.tsx` → `Career.tsx:84` → `pages/career/LaborMarketTab.tsx:16`
(`trendsApi`) och `:15` (`IndustryRadarSection`):

- `LaborMarketTab.tsx:121-122` — "`{new_jobs_week}` nya denna vecka" (= totalen × 0,12)
- `LaborMarketTab.tsx:181` — regionlistan med slumpad `growth_percent`
- `components/ai/IndustryRadarSection.tsx:102-103` — `` `+${region.growth_percent}% tillväxt` `` —
  **ett slumptal 1–10 presenterat som regional jobbtillväxt**
- `IndustryRadarSection.tsx:86-87` — `` `+${Math.floor(skill.demand / 3)}%` `` som "efterfrågeökning",
  där `demand` är loop-positionen
- `IndustryRadarSection.tsx:89-90` — "3-6 månader" inlärningstid härledd ur samma siffra

**Och klienten fabricerar en gång till, ovanpå detta.**
`components/ai/IndustryRadarSection.tsx:76-77`:
```js
growthPercent: occ.trend === 'up' ? Math.floor(Math.random() * 15) + 5 :
               occ.trend === 'down' ? -(Math.floor(Math.random() * 10) + 2) : 0,
```
Detta är ett **andra, oberoende** slumptal — för `trendingIndustries`, renderat
som `{industry.growthPercent}%` bredvid en upp/ner-pil (`:300`). `:80-81` sätter
dessutom `salaryTrend: '+3-6% årligen'` hårdkodat, och `:89-90` en påhittad
inlärningstid. `occ.trend` som styr tecknet kommer från `af-trends:112`, där
"trend" bara betyder om annonsantalet är över 1000 — ingen tidsserie finns.
Komponenten laddar direkt vid sidladdning (`defaultExpanded`,
`LaborMarketTab.tsx:130`), och siffrorna byter värde varje gång användaren
klickar "uppdatera".

Och det som gör det värre: `IndustryRadarSection.tsx:418` sätter
`<AIGeneratedWatermark contentType="analys" />` under alltihop — texten
"Detta analys är genererat med AI-stöd" ger de slumpade talen AI:ns auktoritet.

`LaborMarketTab.tsx:121` och `:122` returnerar dessutom identisk sträng i båda
grenarna av samma ternary — separat liten bugg.

**Premissnot:** `components/market/RealMarketInsights.tsx` (som renderar
`competition_index` "6.5 sökande/jobb" och `avg_time_to_hire_days` "35 dagar" på
`:60` och `:67`) har **noll importörer** — dödkod. De två hårdkodade
branschsnitten når alltså inte användaren idag.

**Konsekvens:** En arbetssökande kan välja bort en region eller en kompetens på
grundval av ett `Math.random()`. Siffrorna ändras dessutom vid varje omladdning,
vilket gör felet upptäckbart för en uppmärksam användare — och då rasar
förtroendet för hela portalen, inte bara för den vyn.

**Åtgärd:** Ta bort fälten som inte går att belägga (`growth_percent`,
`change_percent`, `demand`, `avg_time_to_hire_days`, `competition_index`) ur
`af-trends`-svaret och ur UI:t. AF:s API har historik-endpoints
(`af-historical` finns redan) om verklig tillväxt ska visas. Visa hellre
`total_jobs` och `job_count`, som är riktiga, än falsk precision.

**Storlek:** M (1 dag)

---

## AI-04 — AI-team-chatten går förbi PII-saneringen

**Allvarlighet:** HÖG

**Bevis:** `client/src/components/ai-team/AgentChat.tsx:193-217` anropar
`/api/ai` med rå `fetch` i stället för `callAI`:
```js
const response = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json',
             'Authorization': `Bearer ${session.access_token}` },
  body: JSON.stringify({ function: 'ai-team-chat', stream: true, data: { … } }),
```

Det innebär att tre skydd i `client/src/services/aiApi.ts` aldrig körs för
portalens mest använda AI-funktion (rate limit 50/15 min, högst av alla —
`ai.js:91`):

1. **PII-saneringen** (`aiApi.ts:90`, `sanitizeObjectForAi`) — personnummer,
   kreditkortsnummer, IBAN och bankgiro strippas aldrig. Ett fritextfält i en
   chatt är exakt där en användare skriver sitt personnummer. Datan går till
   OpenRouter i USA.
2. **Art. 9-förkontrollen** (`aiApi.ts:75-87`).
3. **60-sekunderstimeouten** (`aiApi.ts:57`, `AI_TIMEOUT_MS`). AgentChat har en
   AbortController men bara för användarens egen avbrytning (`:191`) — en hängd
   anslutning hänger för evigt.

Serverns `sanitizeAll()` (`ai.js:1000`) hjälper inte: den tar bort `<`/`>` mot
prompt-injection, inte personuppgifter — och den körs *efter* att datan lämnat
webbläsaren.

**Konsekvens:** GDPR-brottet som `piiSanitizer.ts` byggdes för att förhindra är
öppet på den yta som har mest fritext. Dokumentationen påstår motsatsen
(`AI_ARCHITECTURE_OVERVIEW.md` §1: "uteslutande via aiApi.ts"), så ingen har
letat här.

**Åtgärd:** Låt `callAI` få ett streaming-läge, eller anropa
`sanitizeObjectForAi()` explicit i `AgentChat.tsx` före `JSON.stringify`.
Lägg till en timeout. Rätta §1 i `AI_ARCHITECTURE_OVERVIEW.md`.

**Storlek:** S (2–3 h)

---

## AI-05 — `cv-writing`-prompten beordrar modellen att hitta på siffror

**Allvarlighet:** HÖG

**Bevis:** `client/api/ai.js:572-576`, funktionen `cv-writing`, feature `quantify`:
```js
quantify: {
  summary: `Lägg till kvantifierbara resultat och mätbara prestationer i denna
    sammanfattning. Föreslå rimliga siffror baserat på personens bakgrund
    (t.ex. antal års erfarenhet, teamstorlek, procentuella förbättringar).`,
  experience: `Lägg till kvantifierbara resultat i denna arbetsbeskrivning.
    Föreslå rimliga siffror och mätvärden baserat på rollens karaktär.`,
```

Systemprompten (`ai.js:595`) stänger samtidigt nödutgången:
> "Svara ENDAST med den färdiga texten, ingen inledning, förklaring eller
> platshållare som [X]. Skriv fullständiga meningar med konkret information."

Modellen får alltså inte skriva "[X] år" — den *måste* leverera en konkret
siffra, och instruktionen säger uttryckligen att den ska föreslå den själv.
Ingen av `cv-writing`-varianterna har den "hitta ALDRIG på"-regel som finns i
`personligt-brev` (`ai.js:377`), `kompetensgap` (`:399`),
`konsulent-rapportutkast` (`:349`), `intervju-sammanfattning` (`:482`) och
`vecko-reflektion` (`:905`).

Funktionen är levande: `components/cv/AIWritingAssistant.tsx:115`.

**Konsekvens:** Portalen genererar påhittade meriter — "ledde ett team på 8",
"förbättrade processen med 25 %" — direkt in i användarens CV. Att gå till
intervju med uppdiktade siffror i CV:t är en reell skada för just den här
målgruppen. `cvData` skickas med (`ai.js:539-564`), så texten låter trovärdig.

**Bonusfynd samma funktion:** `ai.js:545` beräknar
`const totalYears = cvData.workExperience.length * 2; // Rough estimate` —
en påhittad "2 år per anställning"-heuristik. Variabeln används aldrig. Radera.

**Åtgärd:** Skriv om `quantify` till att be modellen *markera var* siffror
skulle stärka texten och be användaren fylla i dem (t.ex. "ansvarade för ett
team på ___ personer"), i stället för att gissa dem. Lägg till samma
"hitta ALDRIG på"-regel i systemprompten som de fem andra funktionerna har.

**Storlek:** S (2 h)

---

## AI-06 — ART9_FUNCTIONS saknar `ai-team-chat`

**Allvarlighet:** HÖG

**Bevis:** `client/api/ai.js:215-219` listar tre funktioner:
```js
const ART9_FUNCTIONS = new Set([
  'vecko-reflektion', 'adaptation-recommendations', 'adaptation-conversation',
]);
```

Men `ai-team-chat` tar emot art. 9-data om **den inloggade användaren själv**:

- `ai.js:54` — agenten `arbetsterapeut`: *"Du är en arbetsterapeut som hjälper
  personer med funktionsvariationer och hälsoutmaningar. Du har tillgång till
  användarens energinivå…"*
- `hooks/useAITeamContext.ts:421-426` — för `arbetsterapeut` skickas ett
  `[ENERGINIVÅ]`-block med användarens mående
- `useAITeamContext.ts:295-309` — för `arbetsterapeut` **och** `motivationscoach`
  skickas `[STÖDMÅL]` med `supportGoals.challenges`, dvs. användarens egna
  beskrivna hinder (i praktiken funktionsnedsättning/hälsa)
- `components/ai-team/QuickActions.tsx:66-68` lägger dessutom till
  "Min energinivå just nu är låg/normal/hög" i själva meddelandetexten
- Och chatten är fritext — vad som helst kan skrivas in

Kommentaren på `ai.js:206-214` motiverar varför konsulentfunktionerna och
art. 6-funktionerna står utanför listan. `ai-team-chat` nämns inte alls —
det ser ut som en förbiseende, inte ett beslut.

Samma lucka finns i klientens spegellista, `services/aiApi.ts:25-29`.

**Konsekvens:** Hälso- och funktionsnedsättningsdata om användaren själv går
till OpenRouter i USA utan den uttryckliga grund (art. 9.2.a) som UX13-grinden
byggdes för att kräva. Kombinerat med AI-04 (ingen PII-sanering på just den här
vägen) är `ai-team-chat` portalens svagaste GDPR-punkt.

**Åtgärd:** Beslut krävs (produktbeslut för Mikael, som kommentaren på
`ai.js:211-214` konstaterar — 75 av 92 profiler saknar `ai_consent_at`). Två
vägar: (a) lägg in `ai-team-chat` i ART9_FUNCTIONS och acceptera att chatten
kräver samtycke, eller (b) grinda enbart agenterna `arbetsterapeut`/
`motivationscoach` och sluta skicka `[ENERGINIVÅ]`/`[STÖDMÅL]` för övriga.
Alternativ (b) är mindre ingripande och tekniskt enkelt — `agentTyp` finns
redan i `req.body.data`.

**Storlek:** S för koden (3 h), plus beslut.

---

## AI-07 — `cv-analysis` bryter modell-låsningen

**Allvarlighet:** MEDEL (låg exponering — noll anropare, men deployad)

**Bevis:** `supabase/functions/cv-analysis/index.ts:107` — hårdkodad `'gpt-4'`,
`:100` — anropar `api.openai.com` direkt med `OPENAI_API_KEY`, alltså utanför
OpenRouter och utanför `AI_MODEL`-låsningen. Funktionen importerar **aldrig**
`_shared/rateLimit.ts` trots att en post för den finns i `rateLimit.ts:27` —
den har alltså ingen rate limit alls. `config.toml` sätter `verify_jwt = true`,
så en inloggad användare kan anropa den obegränsat.

Modell-låsningen i övrigt: verifierad **konsekvent** på alla andra vägar.
`ai.js:1080`, `:1201` och `:1223` använder alla
`process.env.AI_MODEL || 'openai/gpt-oss-120b'`. Edge-funktionerna
`ai-assistant:95`, `ai-cover-letter:120`, `ai-cv-writing:134`,
`learning-analyze-gap:55` använder motsvarande Deno-mönster. De fem
Perplexity-funktionerna är dokumenterade undantag.

**Konsekvens:** gpt-4 kostar en storleksordning mer än gpt-oss-120b, på separat
faktura, utan tak. Idag noll anrop från klienten — men URL:en är nåbar för
vem som helst med ett giltigt konto.

**Åtgärd:** Ta bort funktionen (`supabase functions delete cv-analysis`) — den
har ingen anropare och `useSupabase.ts:1-3` dokumenterar att vägen togs bort.
Om den ska behållas: flytta till OpenRouter + gpt-oss-120b och koppla in
`_shared/rateLimit.ts`. Rätta `AI_MODEL_LOCKING.md` som fortfarande listar den
som "bör flyttas".

**Storlek:** S (1 h för borttagning)

---

## AI-08 — Edge-fallbacks skriver påhittad analys till databasen

**Allvarlighet:** MEDEL (låg exponering idag — båda vägarna callerlösa)

**Bevis:**

`supabase/functions/cv-analysis/index.ts:170-237`, `generateFallbackAnalysis()`:
```js
strengths: ['CV:et innehåller relevant information', 'Strukturen är tydlig',
            'Erfarenheter är beskrivna']
function calculateFallbackATSScore(cvText) { let score = 70 // Baspoäng …
```
Körs när `OPENAI_API_KEY` saknas (`:98`, `:146`) och vid ogiltig JSON (`:142`).
Resultatet **sparas i `cv_analyses`** (`:150`) med `match_percentage` och
`ats_score` som om det vore en AI-analys — ingen kolumn markerar att det är ett
fallback.

`supabase/functions/learning-analyze-gap/index.ts:182-209`:
```js
const commonGaps: SkillGap[] = [
  { skill: 'Digital kompetens', importance: 'high', demandLevel: 'very-high',
    rationale: 'De flesta yrken kräver idag grundläggande digital kompetens',
    estimatedLearningTime: '1-2 veckor' }, … ]
```
Returneras vid saknad nyckel (`:50`), timeout och alla AI-fel (`:131`), och
skapar sedan riktiga `user_learning_paths`-rader (`:301`) byggda på de
påhittade gapen.

`supabase/functions/education-search/index.ts:421-602`, `getFallbackEducations()`
(anropas `:268`): åtta påhittade utbildningar med **riktiga skolnamn**
(Nackademin, KTH, Karolinska, Hyper Island, Hermods, Berghs), riktiga URL:er och
**påhittade sista ansökningsdatum** (t.ex. `applicationDeadline: '2026-04-15'`).
Enda spåret är `source: 'fallback-mock'` (`:600`), som UI:t inte läser. Denna
funktion **har levande anropare**: `services/educationApi.ts:101` ←
`pages/Education.tsx`, `hooks/useEducationSearch.ts`,
`CareerRecommendationsPanel.tsx:73`.

`supabase/functions/af-historical/index.ts:97-102` uppfinner en lönekurva per
erfarenhetsnivå ur percentiler (`median * 0.95`, `median * 1.1`) — källan
innehåller ingen erfarenhetsdata.

**Konsekvens:** `education-search` är den skarpa av dessa: en arbetssökande kan
missa en riktig ansökningsdeadline för att portalen visade ett påhittat datum
mot ett riktigt skolnamn. De andra två är latenta tills någon kopplar in dem
igen — och då är fallbacken tyst.

**Åtgärd:** `education-search`: ta bort `getFallbackEducations()` och returnera
ett ärligt fel; om mock-data ska behållas för utveckling, gate:a den bakom en
env-flagga som är av i prod. `cv-analysis` + `learning-analyze-gap`: radera
tillsammans med funktionerna (AI-07, AI-14).

**Storlek:** M (0,5 dag)

---

## AI-09 — Art. 50-märkning saknas på fem levande AI-ytor

**Allvarlighet:** MEDEL (deadline var 2 aug 2026 — passerad)

**Bevis:** `components/ai/AIBadge.tsx` finns och är korrekt byggd
(`data-ai-generated="true"` för maskinläsbarhet, `:34`/`:51`/`:68`/`:99`).
Täckningen är god men inte fullständig. Följande **monterade** ytor genererar
AI-innehåll utan `AIBadge` eller `AIGeneratedWatermark`:

| Yta | Fil | Monterad via | AI-funktion |
|---|---|---|---|
| Profilsammanfattning | `components/profile/AISummary.tsx` (hela filen) | `profile/sections/CompetenceSection.tsx:45` | `profile-summary` |
| Konsulentens rapportutkast | `components/consultant/ReportDraftDialog.tsx` | `pages/consultant/ParticipantDetailPage.tsx:756` | `konsulent-rapportutkast` |
| Företagsanalys | `components/ai/CompanyAnalysisPanel.tsx` | `pages/spontaneous/SearchTab.tsx:810` | `ai-company-analysis` (edge) |
| Pendlingsplanerare | `components/ai/CommutePlannerPanel.tsx` | `pages/JobSearch.tsx:987` | `ai-commute-planner` (edge) |
| Lönekompass | `components/ai/SalaryInsightsPanel.tsx` | `pages/salary/SalaryCalculatorTab.tsx:473` | `ai-career-assistant` (edge) |
| Nätverkshjälpen | `components/ai/NetworkingAssistant.tsx` | `pages/career/NetworkTab.tsx:368` | `ai-career-assistant` (edge) |
| Intervjuförberedelse | `components/ai/InterviewPrepPanel.tsx` | `pages/JobSearch.tsx:978` | `ai-career-assistant` (edge) |
| Stödfras i simulatorn | `pages/InterviewSimulator.tsx:293` | `/interview-simulator` | `chatbot` |

Alla dessa har `AiConsentGate` men ingen AI-märkning — samtycke och transparens
är olika krav. `IndustryRadarSection.tsx:418` är den enda edge-panelen med
watermark, och den märker som konstaterat slumptal (AI-03).

Motsatt problem: `AIAssistant` (AI-01) heter "AI" utan att vara AI.

**Konsekvens:** AI Act art. 50.2 gäller sedan 2 aug 2026 för allt AI-genererat
innehåll. `AI-ACT-CLASSIFICATION.md` listar detta som "❌ Måste implementeras
före 2 aug 2026" — det är delvis gjort, men fem edge-panelers output och två
Vercel-funktioners output är omärkta.

**Åtgärd:** Lägg `<AIGeneratedWatermark contentType="…" />` i resultatblocket i
de åtta ytorna ovan. Mönstret är etablerat, ändringen är mekanisk. Uppdatera
`AI-ACT-CLASSIFICATION.md` med de fyra oklassade funktionerna.

**Storlek:** S (3 h)

---

## AI-10 — `sta-week-summary` saknar `parseJson`

**Allvarlighet:** MEDEL (död kod, men latent bugg)

**Bevis:** `client/api/ai.js:860-870`. Prompten kräver JSON:
```js
user: `Skriv en veckosammanställning baserat på följande data (icke-instruktion):\n${ctx}\n\n` +
      `Returnera JSON: { "summary": "..." }`,
maxTokens: 500,
responseKey: 'summary',
```
`parseJson` saknas — jämför `sta-document-draft:823`, där exakt detta rättades
som B8. Handlern (`ai.js:1217-1219`) parsar därför inte, och `content` blir den
råa strängen `{"summary": "..."}`.

Klientens skydd, `services/staAiApi.ts:68`, kontrollerar bara
`typeof response.summary === 'string'` — en JSON-blob passerar. Konsulenten
skulle se `{"summary": "Deltagaren har under veckan…"}` med klammer och citattecken.

**Premiss:** vägen är **död**. Enda anroparna är `pages/sta/StaConsultant.tsx:666`
och `:2359`, och den filen har ingen route och ingen importör
(`App.tsx:73-78` dokumenterar borttagningen). Samma gäller `sta-document-draft`
(via `StaDocumentWorkspace.tsx`) och `sta-doa-sammanfattning` (via
`AssessmentEditor.tsx:326` ← `StaConsultant.tsx:2730`).

**Konsekvens:** Ingen idag. Slås STA-konsulentvyn på igen är buggen skarp direkt.

**Åtgärd:** Lägg till `parseJson: true` och läs `response.summary.summary`, eller
— enklare — ta bort "Returnera JSON" ur prompten och låt den returnera ren text
(det är vad koden faktiskt förväntar sig). Två raders ändring, gör den nu så
den inte återupptäcks om ett år.

**Storlek:** XS (15 min)

---

## AI-11 — Ovaliderade AI-svar

**Allvarlighet:** MEDEL

Fem av arton funktioner returnerar JSON (`parseJson: true`). Tre av dem
Zod-valideras, två castas.

**Bevis:**

| Funktion | `parseJson` | Klientens hantering |
|---|---|---|
| `karriarplan` | `ai.js:394` | ✅ `PlanTab.tsx:188` — `KarriarPlanSchema` |
| `kompetensgap` | `ai.js:404` | ✅ `SkillsGapAnalysis.tsx:211` — `KompetensgapSchema` |
| `intervju-sammanfattning` | `ai.js:486` | ✅ `InterviewSimulator.tsx:424` — `IntervjuSimulatorResultSchema` |
| `vecko-reflektion` | `ai.js:915` | ✅ `WeeklyReflectionCard.tsx:85` — `VeckoReflektionSchema` |
| `sta-document-draft` | `ai.js:823` | ✅ `staAiApi.ts:41` (men död väg) |
| `cv-jobbmatchning` | `ai.js:413` | 🟡 Manuella runtime-guards, `JobAdaptPanel.tsx:71-84` — inget schema men kontrollerar `typeof matchScore === 'number'`, klampar 0–100 och `Array.isArray` på listorna. **Acceptabelt.** |
| `intervju-simulator` | `ai.js:459` | ❌ Cast `:333`/`:340` + `\|\| 3`-fallback — se AI-02 |
| `sta-doa-sammanfattning` | `ai.js:968` | ❌ `services/aiApi.ts:211` — `callAI<DoaSummaryResult>` rakt av. `AssessmentEditor.tsx:326` läser `result.malPlanering` och `result.kategorier[i]` utan kontroll; texten skrivs till `scores._ai_summary` och exporteras till AF-blankett (`assessmentPdfExport.ts:260`). Död väg idag. |

Textfunktionerna (`personligt-brev`, `cv-writing`, `linkedin-optimering`,
`adaptation-*`, `chatbot`, `konsulent-rapportutkast`) behöver inget schema —
de flesta har en `typeof === 'string'`-kontroll. Undantag: `profile-summary`,
`services/profileEnhancementsApi.ts:723-725`, som gör
`(result as {summary?, content?}).summary || .content || (typeof result === 'string' ? result : '')`
och sparar tomma strängen till `profiles.ai_summary` vid oväntad form.

**Åtgärd:** Zod-validera `intervju-simulator` (prio, se AI-02) och
`sta-doa-sammanfattning` (när/om STA återupplivas). Lägg en tom-sträng-vakt i
`profileEnhancementsApi.ts:726` innan skrivningen till databasen.

**Storlek:** S (3 h)

---

## AI-12 — `ai-assistant`-edgen låter klienten välja modell

**Allvarlighet:** MEDEL (död kod)

**Bevis:** `supabase/functions/ai-assistant/index.ts:43` och `:96` — `model`
läses ur request-body och används i `:95` som override av
`Deno.env.get('AI_MODEL') || 'openai/gpt-oss-120b'`. Ingen allowlist.

**Konsekvens:** En inloggad användare kan begära `anthropic/claude-opus-4` eller
någon annan dyr modell på Mikaels OpenRouter-konto. Rate limit är 20/min
(`:81`). Funktionen har noll klientanropare, men endpointen är deployad och
verifierar bara JWT.

**Åtgärd:** Ta bort funktionen (den har ingen anropare — se AI-14). Om den
behålls: ignorera `body.model` eller allowlist:a mot en enda tillåten sträng.

**Storlek:** XS (30 min)

---

## AI-13 — `send-inactivity-warning` saknar auth

**Allvarlighet:** MEDEL

**Bevis:** `supabase/functions/send-inactivity-warning/index.ts:79-95` — ingen
JWT-kontroll alls. Funktionen kör med service role och läser/tömmer
`email_queue`. En POST från vem som helst räcker.

**Konsekvens:** Inte AI-lagret i strikt mening, men hittat i samma svep och
värt att flagga: en utomstående kan trigga utskick eller tömma e-postkön.

**Åtgärd:** Kräv en delad hemlighet i header (cron-mönstret) eller sätt
`verify_jwt = true` + service-role-anrop från cron.

**Storlek:** S (1 h)

---

## AI-14 — Callerlösa funktioner

**Allvarlighet:** LÅG (kostnad = attackyta + underhåll)

**Bevis:** Nio edge-funktioner har noll anropare i `client/src` (verifierat med
sökning på `functions/v1/<namn>` och `functions.invoke`):

`af-jobsearch` (klienten går direkt mot AF via `arbetsformedlingenApi.ts:10`),
`af-enrichments`, `ai-assistant`, `ai-cover-letter`, `ai-cv-writing`,
`cv-analysis`, `learning-analyze-gap`, `learning-progress`, `learning-recommend`.

Undantag som inte är dödkod: `health` (anropas av CI,
`.github/workflows/deploy.yml:101`) och `send-inactivity-warning` (cron).

`ai-cv-writing`s enda anropare ligger i
`archive/2026-07-doda-ai-dubbletter/AIWritingAssistantSecure.tsx:112`.

Därtill tre **döda vägar i ai.js** via STA-konsulentvyn (se AI-10):
`sta-document-draft`, `sta-week-summary`, `sta-doa-sammanfattning`. Dessa ska
**inte** raderas — de tillhör den medvetet avaktiverade STA-modulen.

Kandidater för borttagning **nu**: `ai-assistant`, `ai-cover-letter`,
`ai-cv-writing`, `cv-analysis` (C11 flaggade dem redan för beslut i C4/G6).
`learning-*` är låsta i vänteläge av det pausade EU-spåret — rör dem inte.
`af-jobsearch`/`af-enrichments` bör utredas separat.

**Åtgärd:** Beslut från Mikael. Fyra `supabase functions delete` tar 15 minuter
och tar bort AI-07 och AI-12 på köpet.

**Storlek:** XS

---

## AI-15 — Modell-lås-läcka via `AI_MODEL_HAIKU`

**Allvarlighet:** LÅG

**Bevis:** `client/api/ai.js:1152` (uppföljningsfrågorna efter en strömmad
AI-team-chatt):
```js
model: process.env.AI_MODEL_HAIKU || process.env.AI_MODEL || 'openai/gpt-oss-120b',
```
`AI_MODEL_HAIKU` finns ingen annanstans i repot (endast arkiverad dokumentation
nämner Haiku-eran). Variabelnamnet är ett arv från Anthropic-tiden. Är den satt
i Vercels miljö kör uppföljningsfrågorna en annan modell än låsningen anger,
utan att någon kod eller dokumentation avslöjar det.

Kommentaren precis ovanför (`:1149-1151`) påstår motsatsen: "samma modell som
AI_MODEL för att undvika multi-modell-kostnad".

**Åtgärd:** Ta bort `process.env.AI_MODEL_HAIKU ||` från raden. Verifiera i
Vercel att variabeln inte är satt. Kontrollera i `ai_usage_logs`:
`SELECT model, count(*) FROM ai_usage_logs GROUP BY model;`

**Storlek:** XS (10 min)

---

## AI-16 — Perplexity-funktionerna saknar timeout

**Allvarlighet:** LÅG

**Bevis:** De fem Perplexity-funktionerna har `max_tokens` men **ingen**
AbortController/timeout på LLM-anropet: `ai-career-assistant:367` (2500 tokens),
`ai-industry-radar:169` (2500), `ai-company-analysis:183` (3000),
`ai-company-search:333`+`:390` (2000+1000), `ai-commute-planner:168` (1500).

Jämför de låsta funktionerna, som har timeout: `ai-cover-letter:127` (25 s),
`ai-cv-writing:121` (20 s), `learning-analyze-gap:60` (25 s).

Retry finns bara på Vercel-vägen (`ai.js:258`, `fetchWithRetry`, 2 försök med
2 s/4 s backoff). Ingen edge-funktion retrierar.

**Konsekvens:** Ett hängt Perplexity-anrop håller edge-funktionen (och
användarens flik) tills Supabases hårda gräns slår till. Klienten
(`aiCareerAssistantApi.ts`) har ingen egen timeout heller — till skillnad från
`callAI` (`aiApi.ts:57`, 60 s).

**Åtgärd:** Lägg `AbortSignal.timeout(25_000)` på de fem anropen, och en
timeout i `aiCareerAssistantApi.ts`.

**Storlek:** S (2 h)

---

## AI-18 — Lönestatistiken är handskriven men attribueras till SCB

**Allvarlighet:** MEDEL

**Bevis:** `client/src/pages/salary/MarketDataTab.tsx:13-27` — `INDUSTRY_DATA`
är 13 hårdkodade branscher med median, `change`-procent och antal anställda:
```js
{ name: 'IT & Tech', median: 52000, change: 4.2, employees: '320 000' },
{ name: 'Finans & Bank', median: 55000, change: 3.1, employees: '85 000' },
```
`:30-39` — `REGIONAL_DATA` med `premium: '+15%'` för Stockholm osv. Därtill
`HOT_SKILLS` med löneökningar som `'+25-40%'`.

Monterad: `pages/Salary.tsx:69`, route `salary/*` (`App.tsx:249`).

i18n-texten kring tabellen säger *"Data baserad på svenska löneundersökningar
och SCB-statistik"* och disclaimern *"Data baseras på branschrapporter,
SCB-statistik och löneundersökningar … Senast uppdaterad: Q1 2026."* Ingen av
siffrorna kommer från något anrop — och `services/scbSalaryApi.ts` finns i
repot, oanvänd av den här vyn.

**Konsekvens:** Mildrat av att disclaimern kallar siffrorna uppskattningar, men
källattributionen till SCB är osann. En användare kan gå in i en
löneförhandling med en siffra hen tror är myndighetsstatistik. Detta är inte en
AI-funktion, men samma ärlighetsklass och hittad i samma svep.

**Åtgärd:** Antingen koppla in `scbSalaryApi.ts`, eller ta bort
SCB-attributionen och skriva rakt ut att siffrorna är redaktionella
uppskattningar med angivet årtal.

**Storlek:** S för texten (1 h). M för riktig SCB-koppling.

---

## AI-19 — Påhittande komponenter som ligger ett import-uttryck från att bli skarpa

**Allvarlighet:** LÅG idag (noll importörer verifierat), men laddade

Dessa renderar påhittat innehåll men når ingen användare. De ska **raderas**,
inte lämnas — historiken visar att sådan kod blir monterad av misstag.

| Fil:rad | Vad den hittar på | Importörsspår |
|---|---|---|
| `components/cover-letter/CoverLetterStatistics.tsx:347` | `{trend === 'up' ? '+' : '-'}{Math.floor(Math.random() * 10)}%` som trendpil; hela komponenten drivs av `mockStats` (`:52`) med "8 brev skrivna", "60 % svarsfrekvens" | Endast barrel `components/cover-letter/index.ts:8`. `CoverLetterPage.tsx` importerar direkt från filväg |
| `components/dashboard/WhyItMatters.tsx:211-263` | Nio uppdiktade statistikpåståenden med 📊-ikon: *"8 av 10 arbetsgivare tittar på CV först"*, *"ökar chansen till intervju med 65%"*, *"minskar stress med 23%"*, *"80% större framgång"* | Endast barrel `components/dashboard/index.ts:7` |
| `services/arbetsformedlingenApi.ts:448` | `const matchPercentage = Math.floor(Math.random()*40)+60; // Simulerad för nu` i `analyzeSkillGap()`, plus platshållarsträngar som `missing: ['Erfarenhet (kommer från jobbannonsen)']` | Endast default-objektet `:882`. Noll callers |
| `services/arbetsformedlingenApi.ts:420-431` | `getMarketInsights` fördelar totalen på hårdkodade andelar (Stockholm 35 %, Sjuksköterskor 8 % …) | Exponerad som `afApi.getMarketStats` `:881`. Noll callers |
| `services/afEnrichmentsApi.ts:270-283` | `fallbackCVMatch` returnerar `keyword_match: 50, experience_match: 50, education_match: 50` som analysresultat | `calculateCVMatch` har noll importörer |
| `components/market/RealMarketInsights.tsx:54,60,67,184` | Renderar `af-trends` rådata inkl. `competition_index` "6.5 sökande/jobb" och "35 dagar" | Noll importörer |
| `components/chat/AIChatbot.tsx:31` | *"Fördefinierade intents och svar för offline/demosyfte"* | Endast barrel (känd sedan G10) |
| `components/ai/AIToolsPanel.tsx:98` | Monterar `AIAssistant` (AI-01) | Noll importörer |
| `services/insightsService.ts:412` | `impact: '+25% chans till intervju'` | `hooks/useInsights.ts` → endast barrel `hooks/index.ts:25` |

**Bonusfynd (kraschrisk, inte fabrikation):**
`components/jobs/JobMatchAnalyzer.tsx:42` anropar `afApi.analyzeJobMatch(...)` —
den funktionen **finns inte** i `arbetsformedlingenApi.ts`. Komponenten skulle
krascha direkt vid montering. Endast barrel `components/jobs/index.ts:6`.

**Verifierat rent** (tidigare städat, inga fynd kvar): `consultantInsights.ts:36`
och `AnalyticsTab.tsx:470`/`:643` bär kommentarer om att `Math.random()`-
fabrikationen togs bort 2026-07-23 och räknar nu på riktiga värden.
`jobMatching.ts`, `interestJobMatching.ts`, `cvOptimizer.ts`,
`BrandAuditTab.tsx` och STAR-poängen i `interviewService.ts` är genuint
beräknade. Slumpen i `BreakReminder`, `supportiveMessages`, `SlumpjobbetTab`,
`diaryApi:671` m.fl. väljer *innehåll* och är själva poängen — inte resultat.

**Åtgärd:** Radera filerna (de ligger i git-historiken). Ta bort barrel-raderna.

**Storlek:** S (2 h)

---

## Kostnad och skydd — sammanställning

**Fungerar:**
- Rate limiting per funktion, distribuerat via Supabase-RPC (`ai.js:128-162`)
  med in-memory-fallback som är fail-closed-ish (`:105-119`) — bra beslut.
- Dygnstokentak 50 000/användare (`ai.js:170-195`). Medvetet fail-open, med
  motivering i koden — korrekt tillämpning av "välj efter vad felet kostar".
- Art. 9-grinden fail-closed (`ai.js:232-251`) med testexponering (`:1236-1237`).
- `fetchWithRetry` på Vercel-vägen (`ai.js:258-287`).
- Prompt-injection-sanering rekursivt före prompt-bygge (`ai.js:1000`), och
  AI-team-agenternas systemprompter är hårdkodade serverside med whitelist
  (`ai.js:632-641`) — klientens `systemKontext` ignoreras och loggas.
- 60 s klienttimeout i `callAI` (`aiApi.ts:57`).

**Luckor:** AI-04 (AgentChat förbi alla tre), AI-07 (cv-analysis utan rate
limit), AI-12 (klientvald modell), AI-16 (ingen timeout på Perplexity),
AI-13 (send-inactivity-warning utan auth).

**Streaming-avbrott:** `ai.js:1134-1136` fångar strömfel och loggar, men skriver
inget felmeddelande till klienten — strömmen avslutas bara. `AgentChat.tsx:288-297`
visar då `aiTeam.error.noResponse`, vilket är ärligt. OK.

**Tokenloggning:** exakt på icke-strömmande (`ai.js:1224`, OpenRouters
`usage.total_tokens`), approximerad på strömmande (`:1182`, `längd / 4`).
Approximationen underskattar systematiskt för svenska — dygnstaket är därför
mer generöst än 50 000 för chatt-tunga användare. Värt att veta, inte akut.

---

## Tabell 1 — Alla AI-funktioner i `client/api/ai.js` (Vercel)

Backend = Vercel serverless, modell = `process.env.AI_MODEL || 'openai/gpt-oss-120b'`
för samtliga (`ai.js:1080`, `:1201`; följdfrågorna `:1152`, se AI-15).

| # | Funktion | Caller (fil:rad) | Validerad | Art. 50-märkt |
|---|---|---|---|---|
| 1 | `personligt-brev` | `components/cover-letter/CoverLetterWrite.tsx:169` | Text (ingen kontroll) | ✅ `:1110` |
| 2 | `cv-writing` | `components/cv/AIWritingAssistant.tsx:115` | Text | ✅ `:272` |
| 3 | `cv-jobbmatchning` | `components/cv/JobAdaptPanel.tsx:67` | 🟡 Runtime-guards `:71-84` | ✅ `:428` |
| 4 | `karriarplan` | `pages/career/PlanTab.tsx:182` | ✅ Zod `:188` | ✅ `:732` |
| 5 | `kompetensgap` | `pages/SkillsGapAnalysis.tsx:205` | ✅ Zod `:211` | ✅ `:539` |
| 6 | `intervju-simulator` | `pages/InterviewSimulator.tsx:309`, `:333` | ❌ Cast + `\|\| 3` (**AI-02**) | ✅ `:776`, `:818`, `:970` |
| 7 | `intervju-sammanfattning` | `pages/InterviewSimulator.tsx:419` | ✅ Zod `:424` | ✅ `:776` |
| 8 | `adaptation-recommendations` | `pages/career/AdaptationTab.tsx:449` | Text | ✅ `:740` |
| 9 | `adaptation-conversation` | `pages/career/AdaptationTab.tsx:474` | Text | ✅ `:757` |
| 10 | `linkedin-optimering` | `pages/LinkedInOptimizer.tsx:62` | Text | ✅ `:342` |
| 11 | `profile-summary` | `services/profileEnhancementsApi.ts:722` ← `components/profile/AISummary.tsx:46` | 🟡 Lös cast `:723-725` | ❌ **AI-09** |
| 12 | `chatbot` | `pages/InterviewSimulator.tsx:290` | Text + hårdkodad fallback `:293`, `:295` | ❌ **AI-09** |
| 13 | `ai-team-chat` | `components/ai-team/AgentChat.tsx:193` (**rå fetch**, AI-04) | SSE-ström | ✅ `:497` |
| 14 | `vecko-reflektion` | `components/wellness/WeeklyReflectionCard.tsx:71` | ✅ Zod `:85` | ✅ `:155` |
| 15 | `konsulent-rapportutkast` | `components/consultant/ReportDraftDialog.tsx:83` ← `pages/consultant/ParticipantDetailPage.tsx:756` | 🟡 `typeof string` `:95` | ❌ **AI-09** |
| 16 | `sta-document-draft` | `pages/sta/components/DocumentDraftPanel.tsx:111` ← `StaDocumentWorkspace.tsx:134` — **ingen route** | ✅ Zod `staAiApi.ts:41` | ⚫ Död |
| 17 | `sta-week-summary` | `pages/sta/StaConsultant.tsx:666`, `:2359` — **ingen route** | ❌ `parseJson` saknas (**AI-10**) | ⚫ Död |
| 18 | `sta-doa-sammanfattning` | `pages/sta/components/AssessmentEditor.tsx:326` ← `StaConsultant.tsx:2730` — **ingen route** | ❌ Cast `aiApi.ts:211` | ⚫ Död |

Rate limits per funktion finns i `ai.js:78-98`. Notera att `intervju-sammanfattning`
och `vecko-reflektion` har limits (`:82`, `:94`) — hela listan är i synk med `PROMPTS`.

---

## Tabell 2 — Edge-funktioner (`supabase/functions/`)

| Funktion | LLM | Modell (fil:rad) | Rate limit | Caller (fil:rad) | Validerad | Art. 50 |
|---|---|---|---|---|---|---|
| `ai-career-assistant` | ✅ | `perplexity/sonar` hårdk. `:367` | `:331` 20/min | `services/aiCareerAssistantApi.ts:169` | Typad, ej Zod | ❌ (Salary/Network/InterviewPrep) |
| `ai-company-analysis` | ✅ | `perplexity/sonar` `:183` | `:163` 5/min | `aiCareerAssistantApi.ts:290` | Typad | ❌ |
| `ai-company-search` | ✅ | `perplexity/sonar` `:333`, `:390` | `:276` 10/min | `services/aiCompanySearchApi.ts:56` | Typad | ❌ |
| `ai-industry-radar` | ✅ | `perplexity/sonar` `:169` | `:149` 10/min | `aiCareerAssistantApi.ts:357` | Typad | ✅ `IndustryRadarSection.tsx:418` |
| `ai-commute-planner` | ✅ | `perplexity/sonar` `:168` | `:148` 10/min | `aiCareerAssistantApi.ts:426` | Typad | ❌ |
| `ai-assistant` | ✅ | `AI_MODEL \|\| gpt-oss-120b` `:95` — **klient kan överstyra `:43`, `:96`** | `:81` 20/min | **INGEN** | – | ⚫ |
| `ai-cover-letter` | ✅ | `AI_MODEL \|\| gpt-oss-120b` `:120` | `:53` 5/min | **INGEN** (`coverLetterApi.ts:94-96`) | – | ⚫ |
| `ai-cv-writing` | ✅ | `AI_MODEL \|\| gpt-oss-120b` `:134` | `:97` 10/min | **INGEN** | – | ⚫ |
| `cv-analysis` | ✅ | **`gpt-4` hårdk. `:107`, api.openai.com `:100`** | **INGEN** | **INGEN** | – | ⚫ |
| `learning-analyze-gap` | ✅ | `AI_MODEL \|\| gpt-oss-120b` `:55` | `:290` 5/min | **INGEN** | – | ⚫ |
| `learning-progress` | ❌ | – | **INGEN** | **INGEN** | – | – |
| `learning-recommend` | ❌ | – | **INGEN** | **INGEN** | – | – |
| `af-trends` | ❌ | – | `:40` 30/min | `services/afTrendsApi.ts:65` | – | Fabricerar (**AI-03**) |
| `af-historical` | ❌ | – | `:124` 30/min | `afTrendsApi.ts:70` | – | Fabricerar lönekurva (**AI-08**) |
| `af-taxonomy` | ❌ | – | `:174` 60/min | `services/afTaxonomyApi.ts:29` | – | – |
| `af-jobed` | ❌ | – | `:17` 30/min | `services/afJobEdApi.ts:17` | – | – |
| `af-jobsearch` | ❌ | – | `:68` 60/min | **INGEN** | – | – |
| `af-enrichments` | ❌ | – | `:17` 30/min | **INGEN** | – | – |
| `education-search` | ❌ | – | `:613` 30/min | `services/educationApi.ts:101` | – | Mock-fallback (**AI-08**) |
| `bolagsverket` | ❌ | – | `:311` 30/15min | `services/bolagsverketApi.ts:107` m.fl. | – | – |
| `delete-account` | ❌ | – | – | `services/accountApi.ts:82` | – | – |
| `send-invite-email` | ❌ | – | – | `components/consultant/InviteParticipantDialog.tsx:135` | – | – |
| `send-inactivity-warning` | ❌ | – | – | Cron — **ingen auth** (**AI-13**) | – | – |
| `health` | ❌ | – | – | CI: `.github/workflows/deploy.yml:101` | – | – |

**verify_jwt:** rot-`config.toml` saknar `[functions.*]`-block. Endast tre
per-funktions-`config.toml` finns (`ai-cover-letter`, `cv-analysis`,
`af-jobsearch` — alla `verify_jwt = true`). AF-/education-proxyerna är enligt
`_shared/proxyGuard.ts:4-6` medvetet oautentiserade, vilket inte syns i någon
config-fil.

**Felmaskering (samma mönster som gömde jobbevakningsbuggen):** `af-jobed:43`,
`:62`, `af-taxonomy:214`, `af-historical:157` och `education-search:691`
returnerar **status 200** med tom lista vid fel.

---

## Rekommenderad ordning

**Idag, under en timme — tre borttagningar som stoppar pågående skada:**

1. **AI-17** — ta bort `<AICoachAssistant />` från `Consultant.tsx:52`.
   Konsulenter ser just nu varningar om deltagare som inte finns.
2. **AI-01** — ta bort `<AIAssistant />` från `Exercises.tsx:791` och `:842`.
   Påhittad intervjuprognos i hjälteposition mot långtidsarbetslösa.
3. **AI-03 (delvis)** — ta bort `growthPercent`-raderna
   `IndustryRadarSection.tsx:76-77` och `:102-103`, samt `demandGrowth` `:86-87`.
   Låt resten av radarn stå — `total_jobs` och `job_count` är riktiga.

**Därefter, i ordning:**

4. **AI-02** — intervjusimulatorns betyg (`|| 3` / `'Bra svar!'`). Halvdag.
5. **AI-04 + AI-06** — AI-team-chattens PII-sanering och art. 9 (-06 kräver
   beslut från Mikael).
6. **AI-05** — `quantify`-prompten som beordrar påhittade CV-siffror.
7. **AI-03 (resten)** — rensa `af-trends`-svaret i edgen.
8. **AI-09** — art. 50-märkning på åtta ytor (mekaniskt).
9. **AI-14** — radera fyra callerlösa edge-funktioner (tar AI-07, AI-08 och
   AI-12 med sig).
10. **AI-19** — radera de nio laddade dödkodsfilerna.
11. **AI-18** — SCB-attributionen i `MarketDataTab`.
12. **AI-10, AI-15** — två småfixar, 25 min totalt.

**Mönstret bakom AI-01, AI-17, AI-03 och AI-19 är detsamma:** demo-/mockdata som
byggdes för att visa upp en yta innan den hade riktig data, och som sedan
seglade in i produktion utan att någon tog bort stödhjulen. Det är värt en egen
CI-grind — t.ex. att `Math.random()` och identifierare som `mock*`/`Simulated`
inte får förekomma i `components/` och `pages/` utan en uttrycklig
`// eslint-disable`-motivering. Det hade fångat samtliga fyra.

---

## Dokumentation som behöver rättas

- `docs/AI_ARCHITECTURE_OVERVIEW.md` §1 (påståendet om `aiApi.ts` som enda väg),
  §2 (16 → 18 funktioner, 1084 → 1237 rader), §2.1 (lägg till
  `intervju-sammanfattning`, `vecko-reflektion`), §3.2 (fyra → nio callerlösa),
  §4.2 (`aiSchemas.ts` ligger i `services/`, inte `lib/`).
- `docs/AI_MODEL_LOCKING.md` — tabellen refererar `ai-stream.js` som inte
  finns; datum 2026-05-15 är över ett kvartal gammalt.
- `docs/AI-ACT-CLASSIFICATION.md` — listar åtta funktioner som togs bort i C12
  och saknar fyra som tillkommit. Art. 50-raden ("❌ före 2 aug 2026") är
  passerad och delvis åtgärdad.
- `CLAUDE.md` — "ai.js (24 funktioner, samlad)" och referensen till
  `client/api/ai-stream.js` under Projektstruktur stämmer inte.
