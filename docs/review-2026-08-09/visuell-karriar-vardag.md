# Visuell granskning — hubbarna Karriär, Resurser och Min vardag

**Datum:** 2026-08-09
**Miljö:** `http://localhost:3000` (dev, HashRouter) för allt utom AI-anrop. **AI kördes mot prod (`https://jobin.se`)** — dev-servern har ingen AI-backend alls (`client/vite.config.ts:73-78` svarar `501 "AI-funktion X är inte mockad i dev"` för allt utom `sta-doa-sammanfattning`). En granskning av AI-verktygen mot localhost hade alltså bara mätt en attrapp.
**Konto:** `claude-playwright-test@jobin.se` (deltagare, tilldelad konsulent, 1 CV, 5 rader i `saved_jobs`, 1 dagboksinlägg).
**Metod:** Playwright/Chromium, egen `storageState` (delas inte med parallella agenter). 21 sidor på desktop 1440×900 (viewport + fullPage), 20 sidor på mobil 390×844 (`isMobile`, `hasTouch`), hit-test med `elementFromPoint` på 5 punkter per interaktivt element **plus** avläsning av `opacity`/`pointer-events`/`transform` på varje blockerare, färginventering via canvas-konvertering (Tailwind 4 lämnar `oklch()` i `getComputedStyle`, så ren regex på `rgb()` mäter fel), engelskt språkläge över samma 21 sidor, fokusläget över 13 sidor, samt fyra skarpa AI-körningar mot prod.
**Bilder:** `docs/review-2026-08-09/bilder/kv-*.png`
**Ingen kod, inget dokument och inget schema har ändrats.** Två saker gjordes *genom produkten* som en deltagare: AI-samtycket slogs på och av igen i Inställningar (verifierat återställt: `ai_consent_at = NULL`, `ai_enabled = false` — samma värden som före), och två kompetensgap-analyser sparades på testkontot.

---

## 1. Sammanfattning

Designsystemet håller: alla tre hub-landningar har rätt full pastell-hero, 18 av 19 verktygssidor har neutral grå hero med 4 px hub-kant, noll horisontell overflow på 41 sidladdningar, och **noll råa i18n-nycklar någonstans** — UX24 är verkligen betald, även på `/my-consultant`. D2 ("Inte tilldelad" fast konsulent finns) är också borta. Fokusläget är portalens bästa yta: 13 av 13 sidor har en lugn guide med mänskliga frågor.

Felen sitter i tre lager. **AI-lagret**: AI-teamet svarar en person som just sagt "orkar inte så mycket" med sex parallella uppgifter och rekryterarspråk, kompetensgapet hittar på "Nuvarande: 1/5" för kompetenser CV:t aldrig nämner, och samtyckesgrinden avvisar meddelandet *efter* att det skickats, utan väg vidare. **Språklagret**: menyn är översatt men sidinnehållet är svenskt på 11 av 21 sidor i engelskt läge. **Designskulden från 2026-08-04 är i stort obetald** — D3, D4, D5a/b/c, D6a–e, D7, D8, D9, D10, D11, D14, D17 och M3 kvarstår alla, och M3 har vuxit från 36 till 50–55 tabbfällor.

---

## 2. Fynd

### KV1 — AI-teamet svarar som en rekryterare på en person som just sagt att hon inte orkar — KRITISK

**Yta:** `https://jobin.se/#/ai-team`, agenten Arbetskonsulent, personlighet Professionell, svarslängd Medel.
**Bevis:** `bilder/kv-aiteam-svar1.png`. Chatten rensades först ("Rensa chatt"), så svaret är på en tom historik. Fråga, ordagrant:

> *"Hej. Jag har varit arbetslös i tre år och orkar inte så mycket. Vad ska jag göra först?"*

Svar efter 11,8 s, ordagrant (förkortat, sex rubriker totalt):

> **Uppdatera CV** Lägg till en kort förklaring av din treåriga arbetslöshet … och betona dina tidigare projektledarerfarenheter på Tech AB …
> **Fokusera på ditt huvudområde** Rikta ditt jobbsökande mot projektledarroller …
> **Ansök till sparade jobb** Skicka in ansökningar till de fyra sparade annonserna **så snart som möjligt** …
> **Utveckla färdigheter** … gå en kort kurs i exempelvis Scrum-certifiering …
> **Sök stöd** Kontakta Arbetsförmedlingen eller en lokal karriärcoach …

Och i ett tidigare svar, som presentation av användaren:

> *"Jag heter Claude och är en erfaren projektledare … **Jag brinner för att bygga effektiva team och leverera resultat i tid och inom budget.**"*

**Vad som är fel:** orden "orkar inte så mycket" får ingen kvittens alls — inte en mening. Svaret är fem till sex parallella uppgifter, varav en med tidspress ("så snart som möjligt"), till en person som beskrivit sin kapacitet som låg. Registret är exakt det DESIGN.md §1 räknar upp som förbjudet: *"Aldrig som en LinkedIn-rekryterare. Ingen prestationsångest."* Det här är portalens mest framskjutna AI-yta och den enda som är en samtalspartner.

**Extra bevis på samma mönster:** samma fråga ställd till agenten **Arbetsterapeut** — *"Jag har utmattningssyndrom och klarar max 3 timmar om dagen. Vad är realistiskt för mig?"* — gav 27,9 s senare ett svar som varken nämner utmattning eller de tre timmarna i sin första sektion, och som mitt i innehåller rubriken

> **Huvudstad** Stockholm

(`bilder/kv-aiteam-arbetsterapeut-huvudstad.png`). Modellen har vänt kontextraden `Ort: Stockholm` — som byggs i `client/src/hooks/useAITeamContext.ts::formatAITeamContext`, `[PROFIL]`-sektionen — till en egen rubrik i ett svar om utmattningssyndrom. Andra halvan av svaret (45-minuterspass, flexibla tider, planera det svåra när du är piggast) är däremot bra och relevant.

**Orsak:** systemprompten ligger serverside i `client/api/ai.js` (`AGENT_PROMPTS`, rad ~700). Det som saknas är en instruktion om energi och omfattning: *ett* nästa steg, inte sex; kvittera det användaren säger om sin ork; aldrig tidspress.
**Åtgärd:** skriv om agentprompterna med (a) en explicit regel om max ett–två steg per svar, (b) krav på att spegla det användaren sagt om ork/mående innan råd ges, (c) förbud mot tidsuttryck som "så snart som möjligt". Verifiera med samma tre frågor mot prod.
**Storlek:** M.

---

### KV2 — Kompetensgap-analysen hittar på "Nuvarande nivå" för kompetenser CV:t inte nämner, och samma indata ger olika matchningstal — KRITISK

**Yta:** `https://jobin.se/#/skills-gap-analysis`
**Bevis:** `bilder/kv-kompetensgap-resultat.png`. Indata: kontots befintliga CV (projektledare, kompetenser `Projektledning`, `Agila metoder`, `[PERSONA-B] testkompetens` — verifierat mot prod: `select … from cvs where user_id=…`) plus en klistrad lagerannons. Resultat:

| | Nuvarande | Mål |
|---|---|---|
| Truckkort A+B | **1/5** | 5/5 |
| WMS-system | **1/5** | 5/5 |
| Svenska i tal och skrift | **3/5** | 5/5 |
| Datorvana / Microsoft Office | **2/5** | 4/5 |
| Lagerhantering | **1/5** | 4/5 |

CV:t säger ingenting om truckkort, WMS, svenska eller Office. "Nuvarande: 1/5" och "3/5" är alltså siffror utan källa, presenterade i en tabell som ser ut som en mätning. Det är samma familj som B10/B11 (påhittad AI-output märkt som analys) — här dessutom om användarens egna förmågor.

**Icke-determinism på identisk indata:** två körningar med exakt samma annons och samma CV gav **25 %** respektive **22 %** i matchningsgrad. Talet står i hjälteposition som sidans huvudsiffra, med underrubriken *"Det finns potential! Börja med de viktigaste kompetenserna nedan."* DESIGN.md §2 Regel 3 förbjuder prestationsmätningar i hjälteposition för deltagare; 22 % är en sådan, och den är inte ens stabil.

Kurs- och handlingsplansdelen är däremot bra och konkret (truckkortkurs, gratis WMS-onlinekurs, Excel på Folkuniversitetet, fyra numrerade steg) — problemet är siffrorna, inte innehållet.

**Åtgärd:** låt schemat tillåta `null` för `currentLevel` och rendera "Framgår inte av ditt CV" i stället för en påhittad siffra (`KompetensgapSchema` + `SkillsGapAnalysis.tsx:229-231`). Ta bort procenttalet ur hjälteposition, eller ersätt det med en mening. Om talet ska vara kvar måste det bli deterministiskt (temperatur 0 eller beräknat i koden ur `skills`-listan i stället för av modellen).
**Storlek:** M.

---

### KV3 — AI-teamets samtyckesgrind avvisar meddelandet efter att det skickats, och erbjuder ingen väg vidare — HÖG

**Yta:** `/#/ai-team` (både localhost och prod).
**Bevis:** `bilder/kv-aiteam-samtyckesgrind.png`. Utan `ai_consent_at` gick fyra meddelanden att skriva och skicka. Alla fyra renderas som skickade blå bubblor. Under dem ligger **ett** rött kort:

> *"AI-teamet får med sig hur du mår och vad du beskrivit som svårt, så att coacherna kan anpassa sina svar. Godkänn AI-behandling i Inställningar för att använda chatten."*

Fyra obesvarade meddelanden, ett felkort. Inget `/api/ai`-anrop görs (mätt: noll requests) — grinden är helt klientsidig och kunde ha slagit till *innan* meddelandet accepterades.

Tre problem:
1. **Textfältet och skickaknappen är aldrig avstängda.** `ChatInput.tsx:74,96,114` stänger av dem på `isLoading`/`disabled`, men samtyckesläget skickas aldrig in som `disabled`. Användaren får ingen förvarning.
2. **Ingen väg till Inställningar.** Felkortet (`AgentChat.tsx:546-553`) är ren text i en `<Card role="alert">`. Ingen länk, ingen knapp.
3. **Meddelandet är en förklaring först och ett fel sedan.** Första meningen beskriver dataflödet; att chatten inte fungerar kommer sist. För målgruppen är det bakvänt.

**Åtgärd:** grinda i `AgentChat`-nivån — sätt `disabled` på `ChatInput` när `hasConsent === false`, visa i stället en `<EmptyState>` över chattytan med rubrik, en mening och **en knapp** som går till `/#/settings?section=privacy`.
**Storlek:** S–M.

---

### KV4 — Efter godkänt samtycke kan chatten fortfarande vara låst av en spak som inte syns — HÖG

**Yta:** `/#/settings?section=privacy` → `/#/ai-team`
**Bevis:** mätt i tur och ordning på prod. Utgångsläge (`ai_consent_at = NULL`, `ai_enabled = false`, verifierat mot prod-schemat):

| Steg | "AI-behandling och profilering" | "Aktiv AI-användning" |
|---|---|---|
| Före | knapp `Godkänn` | **kortet finns inte i DOM:en** |
| Efter `Godkänn` | knapp `Återkalla` | *"AI-funktioner är pausade"* + knapp `Slå på AI` |

Med bara samtycket givet svarade chatten:

> *"Du har stängt av AI-behandling av dina uppgifter. Slå på det i Inställningar om du vill använda den här funktionen."*

Alltså: användaren följer felmeddelandets instruktion, går till Inställningar, godkänner — och får ett nytt fel med samma instruktion. Orsaken är att `Settings.tsx:605` villkorar hela art. 21-kortet på `consentData.aiConsentAt`, så spaken som faktiskt behöver slås på är osynlig ända tills samtycket givits.

**Premissgranskat:** `ai_enabled` har `DEFAULT true` och bara **1 av 92** profiler i prod står på `false` (testkontot). Det är alltså inte ett normaltillstånd — men det är fullt nåbart: pausa AI, återkalla samtycket, ge det igen. Felmeddelandet pekar dessutom på fel spak, vilket är den dyra delen.

**Åtgärd:** rendera art. 21-kortet alltid (gråat när samtycke saknas), och gör de två felmeddelandena särskiljande — "du har inte godkänt än" respektive "du har pausat AI".
**Storlek:** S.

---

### KV5 — Rått engelskt tekniskt fel i chatten vid nätverksfel, och ingen "Försök igen" — HÖG

**Yta:** `/#/ai-team`
**Bevis:** med `/api/ai` blockerad visade chatten, som synligt felmeddelande i den röda rutan:

> `Failed to fetch`

Sökning efter knappar som matchar `/försök|igen|retry/i` gav `[]` — det finns ingen väg tillbaka annat än att skriva om meddelandet.

**Orsak:** `AgentChat.tsx:229-232` — `setError(err instanceof Error ? err.message : t('aiTeam.error.generic'))`. Ett `TypeError: Failed to fetch` **är** en `Error`, så `err.message` vinner och den översatta texten används aldrig. Samma fil har rätt mönster på annat håll, och `SkillsGapAnalysis.tsx:245-248` gör uttryckligen tvärtom med kommentaren *"Visa alltid ett vänligt, översatt felmeddelande — aldrig rå err.message (t.ex. 'Failed to fetch' … ska inte nå användaren oöversatt)"*. Regeln finns; chatten följer den inte.

**Åtgärd:** mappa okända fel till `t('aiTeam.error.generic')` och släpp bara igenom `AiConsentRequiredError`-texten och de HTTP-mappade meddelandena från `aiApi.ts:198-225`. Lägg till en "Försök igen"-knapp i felkortet som skickar om senaste meddelandet.
**Storlek:** S.

---

### KV6 — Engelskt läge: menyn är översatt men sidinnehållet är svenskt på 11 av 21 sidor — HÖG

**Yta:** hela området, språk bytt via globikonen (`aria-label="Välj språk"` → *English*), `document.documentElement.lang === "en"` verifierat.
**Bevis:** `bilder/kv-en-knowledge-base.png`, `bilder/kv-en-print-resources.png`. Sidomenyn säger *Knowledge Base / My Documents / Print Resources / External Resources / My AI Team / Network* — sidan bredvid är helsvensk.

| Sida | Svenska strängar i engelskt läge (urval, ordagrant) |
|---|---|
| `/knowledge-base` | H1 *"Hej Claude"*, *"Hitta artiklar, guider och svar på vanliga frågor…"*, *"Bläddra efter ämne"*, *"13 kategorier"*, alla 13 kategorinamn + beskrivningar, *"N artiklar"* |
| `/exercises` | *"Praktiska övningar för att utveckla dina jobbsökar-skills"*, alla 14 filterchips, alla 119 övningstitlar och -beskrivningar |
| `/externa-resurser` | H1 *"Externa resurser"*, *"Sök bland resurser"*, *"Populära resurser"*, *"Visa alla"*, *"Regionala resurser"*, *"Lärande & Utbildning"*, *"Nätverk & Mentorskap"* + alla kortbeskrivningar |
| `/personal-brand` | *"Rekommenderade nästa steg"*, *"Skapa rubrik"*, *"Skapa portfolio"*, *"Visa tips"* ×16, alla 14 auditfrågor |
| `/print-resources` | H1 *"Skriv ut resurser"*, undertitel, *"Välj alla"*, *"Avmarkera alla"*, *"Förhandsgranska"*, *"Ladda ner PDF"*, alla kategorirubriker |
| `/nätverk` | H1 *"Nätverk"* + undertitel *"Bygg och underhåll ditt professionella kontaktnät"* |
| `/resources` | *"Alla dina dokument, jobb och artiklar på ett ställe"*, *"Skapa nytt dokument"* |
| `/interest-guide` | *"ICF-bedömning av dina funktionsförutsättningar"*, *"Dina förutsättningar"*, *"Hur upplever du dina kapaciteter?"* |
| `/settings` | hela avsnittet *"Roll och behörigheter"* (5 strängar) |
| `/profile` | *"Nästa steg:"*, *"Lägg till upp till"*, *"Lägg till yrke ("* |
| `/career` | blandad mening: *"Patientvård appears in **Hälso- och sjukvård**, which has many open positions"* |

**Premissgranskat:** detta är inte saknade översättningar. `sv.json` och `en.json` har båda 7 163 nycklar, och **noll råa i18n-nycklar renderades i något läge** — strängarna är hårdkodade i JSX respektive ligger i svensk innehållsdata (`articleData.ts`, övningskatalogen). Det bekräftar UX17:s formulering: skulden är `t()`-skuld och otextad data, inte tomma nycklar. Nytt här är omfattningen inom de tre hubbarna och att `/career` blandar språk *inuti en mening*.

**Åtgärd:** dela upp i två spår. (1) UI-chrome (H1, knappar, sektionsrubriker, auditfrågor, filterchips) → `t()`, uppskattningsvis 120–150 strängar över sju filer. (2) Innehållsdata (133 artiklar, 119 övningar, externa resurser) → beslut krävs: översätt, eller visa en ärlig rad *"This content is only available in Swedish"* i stället för tyst blandspråk.
**Storlek:** M för (1), L eller beslut för (2).

---

### KV7 — `/resources` räknar skickade ansökningar som sparade jobb — HÖG

**Yta:** `/#/resources`
**Bevis:** samma session, samma sekund:

| Yta | "Sparade jobb" |
|---|---|
| `/#/resources` KPI-kort och sektionsrubrik | **5** (`Sparade jobb (5)`, och listan innehåller ett kort märkt **"Ansökt"**) |
| `/#/my-consultant` → "Det här ser din konsulent" | **4 st** |
| Prod-databasen | `SAVED 2` + `INTERESTED 2` + `APPLIED 1` = 5 rader |
| `get_application_stats()` i prod | `saved: 2, interested: 2, applied: 1, total: 5` |

**Orsak, spårad:** `Resources.tsx:589` renderar `savedJobs.length` där `savedJobs` kommer från `savedJobsApi.getAll()` → `jobsApi.getSavedJobs()` → `applicationsApi.getAll()` — **hela pipelinen, utan statusfilter** (`services/jobsApi.ts`). `MyConsultant.tsx:852` gör rätt: `stats.saved + stats.interested`. Detta är ordagrant den bugg H4 rättade 2026-07-27, med kommentaren i `MyConsultant.tsx:823-825` om att *"'Sparade jobb' räknade tidigare ALLA rader i `saved_jobs` — men den tabellen bär hela pipelinen"*. Rättelsen gjordes i en fil; `Resources.tsx` blev kvar.

Samma tal används också på flikräknaren `Jobb 5` (`Resources.tsx:527`) och i `totalItems` (`:522`).

**Åtgärd:** filtrera på `['SAVED','INTERESTED']` i `Resources.tsx`, eller — bättre — läs `applicationsApi.getStats()` som de övriga ytorna, så det bara finns en definition av "sparat jobb".
**Storlek:** S.

---

### KV8 — M3 kvarstår och har vuxit: 50–55 tabbara element utanför skärmen på varje mobilsida — HÖG

**Yta:** samtliga inloggade sidor, 390×844.
**Bevis:** uppmätt per sida, `[inert]`/`[aria-hidden]` exkluderade:

| Sida | Tabbara element utanför viewporten |
|---|---|
| `/karriar` | 50 |
| `/resurser` | 51 |
| `/min-vardag` | 50 |
| `/knowledge-base` | 51 |
| `/ai-team` | 51 |
| `/wellness` | **55** |
| `/exercises` | 50 |
| `/my-consultant` | 50 |

De två drawerna mättes till:

| Drawer | left | bredd | `visibility` | `pointer-events` | `inert` | `aria-hidden` | tabbara barn |
|---|---|---|---|---|---|---|---|
| Höger (huvudmeny) | 390 | 280 | `visible` | `auto` | nej | — | 32 |
| Vänster (profilmeny) | −260 | 260 | `visible` | `auto` | nej | — | 4 |

Identiskt med mätningen 2026-08-04 (`visuell-mobil.md` M3) förutom att totalen gått från 36 till 50–55 — fler tabbara element har tillkommit i de stängda menyerna. Åtgärden som föreslogs då (en attributrad per drawer i `Layout.tsx:246-252` och `:340-346`) är inte gjord.

**Bryter:** WCAG 2.1 AA 2.4.3 (Focus Order) och 2.4.7 (Focus Visible).
**Åtgärd:** `inert` + `aria-hidden="true"` på drawern när den är stängd.
**Storlek:** S.

---

### KV9 — `/knowledge-base` saknar fortfarande verktygssidans header, och har fortfarande 13 kort i 5 hub-färger — MEDEL

**Yta:** `/#/knowledge-base`
**Bevis:** `bilder/kv-knowledge-base-utan-header.png`. Uppmätt: hero-bakgrund `rgb(255,255,255)`, `border-left: 1px oklch(0.923 …)` — **enda** verktygssidan under Resurser utan `--header-bg` `rgb(245,244,240)` och utan 4 px sky-kant `rgb(38,109,160)`. Syskonsidorna `/resources`, `/print-resources`, `/externa-resurser`, `/ai-team`, `/nätverk` har alla båda. I stället börjar sidan med hub-hälsningen **"Hej Claude"** på canvas.

Orsak oförändrad: `client/src/pages/KnowledgeBase.tsx:139` — `<PageLayout title="" domain="info" …>`. (Två andra `PageLayout` i samma fil, rad 120 och 129, sätter titeln rätt — det är bara huvudvyn som är tom.)

Färgmätning (hue efter canvas-konvertering, mättnad ≥ 0,30 så de varma stone-tokens inte räknas med): **40° ×3 · 160° ×1 · 200° ×7 · 260° ×1 · 320° ×3** — fem hue-familjer på en `info`-sida. Källan är fortfarande `KnowledgeBase.tsx:75-81`:

```
action: 'bg-emerald-100 …', activity: 'bg-orange-100 …', coaching: 'bg-pink-100 …',
info: 'bg-sky-100 …', wellbeing: 'bg-violet-100 …'
```

**Bryter:** §3 ("Olika hero-stil mellan två sidor i samma hub") och §4 ("En sida = en hub-färg … ikon-tiles").
**Åtgärd:** ge sidan en titel så `PageHeader` renderas; byt `DOMAIN_BG` mot `bg-[var(--c-bg)] text-[var(--c-text)]`.
**Storlek:** S.

---

### KV10 — `/exercises` är portalens mest kakofoniska sida: 7 färgfamiljer, två nollor i hjälteposition, 40 000 px på mobil — MEDEL

**Yta:** `/#/exercises`
**Bevis:** `bilder/kv-exercises-fyra-kpi.png`.

KPI-raden, ordagrant och i KPI-siffrastorlek: **119** Övningar totalt · **0** Påbörjade · **0** Aktiva · **119** Ej påbörjade — i fyra olika hue-familjer (mätt: 160° mint, 140° grön, 40° amber `s=1,0 l=0,96`, 260° lavendel). Sidans hub är Min vardag (lavendel); bara det sista kortet har rätt färg, och amber är §4-reserverat för varningar.

Hela sidan, färgräkning: **0° ×6 · 40° ×11 · 140° ×6 · 160° ×5 · 180° ×2 · 220° ×1 · 260° ×14** — sju familjer, 45 mätta element.

Höjd: **12 386 px** på desktop 1440, **39 360 px scrollhöjd** på mobil 390. 119 kort platt utlagda under 14 filterchips. §8 säger uttryckligen för just den här sidan: *"överst en kuraterad rad: 'För dig idag: 3 övningar som passar din situation'. Resten kategoriserat och kollapsbart."*

Filterchippet "Alla övningar" är dessutom solid **mint** (160°, l=0,30) — översiktens färg, inte Min vardags lavendel `#7058A8`.

**Åtgärd:** som §8 säger — kuraterad rad överst, resten kollapsbart per kategori. Ersätt de fyra KPI-korten med en mening. En hub-färg.
**Storlek:** M.

---

### KV11 — `/resources`: tre nollor i hjälteposition och tre solida knappfärger på samma rad — MEDEL

**Yta:** `/#/resources`
**Bevis:** `bilder/kv-resources-noll-och-knappfarger.png`. KPI-raden: **5** Sparade jobb (fel, se KV7) · **0** Dokument · **0** Bokmärken · **0** Filer. Tre nollor à 24 px.

CV-raden har tre knappar i tre solida färger: `Redigera` (amber outline), `Exportera PDF` (**160°, l=0,31 — grön solid**), `Word` (**220°, l=0,58 — blå solid**), plus `Skapa nytt dokument` (205° sky) ovanför. Fyra knappfärger, varav grön är §4-reserverad för "completed/success" och blå inte är någon hub-färg. §6 förbjuder mer än en primär CTA per vy.

**Bryter:** §7 ("0 som primär information"), §4, §6. Oförändrat sedan D5b.
**Åtgärd:** en färg (sky `#2F7DB5`) på primärknappen, resten sekundära. Ersätt nollorna med en inbjudande mening.
**Storlek:** S.

---

### KV12 — `/diary`: streak-chip med brandemoji och grammatiskt fel, plus amber tipskort på lavendelsida — MEDEL

**Yta:** `/#/diary`
**Bevis:** `bilder/kv-diary-streak-och-amber.png`. Chippet uppe till höger om flikraden säger fortfarande, ordagrant:

> 🔥 **1 dagar**

DESIGN.md §1: *"Aldrig som en gamification-app … **inga streak-counters**"*, och §2 Regel 3 listar *"Streak: 0 dagar" → (ta bort)*. Pluralfelet ("1 dagar" ska vara "1 dag") är också kvar — i18next-nyckeln saknar `_one`-form. Båda oförändrade sedan D7 (2026-08-04).

Kortet "Dagens skrivtips" är fortfarande amber/gult (`s=1, l≈0,92`) på en lavendelsida, med solid lila knapp "Använd" inuti — D6e, oförändrat.

**Åtgärd:** ta bort chippet. Om kontinuitet ska visas: en lugn mening utan siffra i hjälteposition. Byt tipskortet till `bg-[var(--c-bg)]`.
**Storlek:** S.

---

### KV13 — `/my-consultant` skriver ut "Din arbetskonsulent" två gånger i hjältekortet — MEDEL

**Yta:** `/#/my-consultant`
**Bevis:** `bilder/kv-myconsultant-dubbel-titel.png` — det lila kortet visar tre rader:

> **Claude Test**
> Din arbetskonsulent
> Din arbetskonsulent

**Orsak, spårad:** `client/src/pages/MyConsultant.tsx:753` sätter `title: t('myConsultant.consultant.yourConsultant')` i `ConsultantInfo`, och `:151-156` renderar sedan **både** `consultant.title` **och** samma `t('myConsultant.consultant.yourConsultant')`:

```tsx
{consultant.title && (<p …>{consultant.title}</p>)}
<p …>{t('myConsultant.consultant.yourConsultant')}</p>
```

`title` var tänkt som konsulentens yrkestitel, men `profiles` har ingen `title`-kolumn (verifierat mot prod: `column "title" does not exist`) och RPC:n `get_my_consultant()` returnerar sex fält utan titel (`services/myConsultantApi.ts:18-25`). Fältet fylls därför alltid med i18n-strängen — och dubbleras.

**Åtgärd:** ta bort `title`-tilldelningen på rad 753, eller ta bort den andra `<p>`-raden. Om en riktig yrkestitel ska visas måste den läggas till i RPC:n först.
**Storlek:** XS.

---

### KV14 — `/my-consultant` gör två HTTP 406-anrop mot `consultant_meetings` per sidladdning — MEDEL

**Yta:** `/#/my-consultant`
**Bevis:** de enda HTTP-felen i hela svepet, oförändrade sedan D17:

```
406  https://odcvrdkvzyrbdzvdrhkz.supabase.co/rest/v1/consultant_meetings
     ?select=*&participant_id=eq.5b0904ac-…&status=eq.scheduled
     &scheduled_at=gte.2026-08-09T14:49:24.140Z&order=scheduled_at.as…
Failed to load resource: the server responded with a status of 406 ()
```

Två identiska anrop per laddning (tidsstämplarna skiljer 8 ms: `…24.140Z` och `…24.148Z`). 406 från PostgREST betyder `.single()` mot noll rader — dvs. felet inträffar just i normalfallet "inget möte inbokat". UI:t visar korrekt "Inga planerade möten", så felet är tyst, men det är portalens enda återkommande nätverksfel och det maskerar en riktig felväg.

**Åtgärd:** `.maybeSingle()` (eller `.limit(1)` + arrayläsning) och avdubbla anropet.
**Storlek:** S.

---

### KV15 — `/ai-team` öppnar 313 px nedscrollad och bär mint på en sky-sida — MEDEL

**Yta:** `/#/ai-team`
**Bevis:** `bilder/kv-aiteam-nedscrollad.png`. Uppmätt vid ankomst: `window.scrollY = 313`, `scrollHeight = 1311`. PageHeadern *"Ditt AI-team"*, informationsbannern och rubriken "Välj din agent" ligger ovanför synfältet; agentkorten är avklippta upptill. Oförändrat sedan D14.

Färg: **160° ×4** (mint, `s=0,76 l=0,97`) på agent-tilen, chattavataren "AI" och Tips-boxen — på en sida som tillhör Resurser (sky 205°). D6d, oförändrat.

Dessutom: textfältets fokusring är hårdkodat violett (synlig i bilden), inte hubbens sky — D15, oförändrat. DESIGN.md §10: *"Fokusring … **Aldrig hårdkodad färg**."*

**Åtgärd:** kör inte `scrollIntoView` vid mount, bara när ett nytt meddelande tillkommer. Byt mint-tiles och fokusring till tokens.
**Storlek:** S.

---

### KV16 — Intresseguiden visar fyra motstridiga framstegsräknare samtidigt — MEDEL

**Yta:** `https://jobin.se/#/interest-guide`, mitt i testet.
**Bevis:** `bilder/kv-intresseguide-raknare.png`. På en och samma skärm står, uppifrån och ned:

> Fråga **17 av 34** · Din progress **47%** · Fråga **17 av 34** (**17 kvar**) · **50% klart** – ta den tid du behöver 💙 · … · Fråga **1 av 10** | Intresseområden

Fyra olika tal (17/34, 47 %, 50 %, 1/10) som alla beskriver var användaren befinner sig. Det övre räknar hela testet, det nedre räknar deltestet, och 47 % respektive 50 % är två avrundningar av samma sak. För en användare med kognitiv belastning är det fyra påståenden att stämma av mot varandra.

**Positivt att bevara:** tonen i den här guiden är portalens bästa — *"50% klart – ta den tid du behöver 💙"*, *"Du kan alltid gå tillbaka för att ändra tidigare svar"*, *"Pausa"*, *"Dina svar sparas automatiskt"*. Rör inte den.

**Åtgärd:** en räknare. Förslag: behåll "Fråga 17 av 34" plus progressbaren, ta bort procenttalen och deltestets egen räknare (eller flytta den till deltestrubriken som "Intresseområden 1/10" utan ordet "Fråga").
**Storlek:** S.

---

### KV17 — `/profile` öppnar en modal av sig själv och är mint fast Profil hör till Min vardag — MEDEL

**Yta:** `/#/profile`
**Bevis:** uppmätt vid ren navigering: ett `fixed inset-0 z-50 … bg-black/50`-lager täcker hela viewporten (1440×900) utan att användaren klickat något. På mobil blockeras därför alla fem bottennavknappar 5/5 — vilket **inte** är en bugg i sig (modalen har korrekt backdrop och går att stänga), men modalen ska enligt §10 aldrig öppna utan explicit klick. D4, oförändrat.

Färg: **160° ×4** (mint, inkl. den solida "Nästa"-knappen `l=0,28` och modalen "Välkommen!") plus **40° ×3** amber (`s=0,97 l=0,89`, bl.a. den solida knappen "Lägg till"). Sidan borde vara lavendel.

**Orsak, oförändrad:** `Profile.tsx:146` sätter `domain="action"`, och `/profile` saknas fortfarande i min-vardags `memberPaths` (`components/layout/navigation.ts:292-299` listar `/wellness`, `/diary`, `/calendar`, `/exercises`, `/my-consultant`) — trots att DESIGN.md §3 uttryckligen räknar Profile som medlem och `/min-vardag`-hubben visar ett kort "Din profil" som länkar dit. Samma konflikt gäller `/settings`, som mättes till 4 px mint kant `rgb(26,119,87)` och solid mint "Spara ändringar" (160°, l=0,28) fast §3 säger neutral grå utan hub-accent.

**Åtgärd:** beslut först (hör Profil till Min vardag?), rätta sedan antingen koden eller DESIGN.md. Konvergera modalen till `<OnboardingFlow>` och kräv explicit klick.
**Storlek:** S för färgen, M för modalen.

---

### KV18 — Kompetensgapet tar 43 sekunder och visar bara "Startar analys…" hela tiden — MEDEL

**Yta:** `https://jobin.se/#/skills-gap-analysis`
**Bevis:** mätt tidslinje för `/api/ai`: request vid `t=0,007 s`, svar `200` vid **`t=43,3 s`**. Vad användaren ser under tiden:

| t | Skärmen |
|---|---|
| 1 s | "Analyserar dina kompetenser…" / "Startar analys…" |
| 10 s | oförändrat |
| 30 s | oförändrat |
| 43 s | resultatet |

Ingen progress, ingen delleverans, ingen uppskattad tid, ingen möjlighet att avbryta. Texten "Startar analys…" är dessutom osann efter de första sekunderna.

**Relaterad observation (låg konfidens, bör verifieras):** i en tidigare körning stod samma sida kvar i laddningsläget i över 90 sekunder utan att vare sig resultat eller fel visades; konsolen loggade `Failed to run skills gap analysis: TypeError: Failed to fetch` först när jag navigerade bort. `callAI` sätter en 60 s-timeout (`aiApi.ts:236-237`) men rensar den i `finally` så snart svarshuvudena kommit — `response.json()` har ingen egen timeout. Om Vercel skickar huvuden före kroppen kan anropet därför hänga obegränsat. Jag har inte kunnat återskapa det, så det står som hypotes, inte fynd.

**Åtgärd:** byt spinnern mot ett skelett av resultatlayouten och en ärlig text ("Det här tar ungefär en minut"). Lägg en avbrytknapp. Överväg att flytta timeouten så den täcker även kroppsläsningen.
**Storlek:** S.

---

### KV19 — Fokusläget släpper in de två flytande widgetarna och har två "Avsluta fokusläge" — MEDEL

**Yta:** fokusläget, alla 13 granskade sidor.
**Bevis:** `bilder/kv-fokuslage-wellness.png`. Knapplistan på varje fokussida innehåller `"Avsluta fokusläge"` **två gånger** (en sticky uppe till höger, en i sidhuvudet) plus `"Mina samlingar"` och `"Tips"` — de två globala FAB:arna följer med in i läget som är byggt för att ta bort allt ovidkommande.

Fokusläget i övrigt är portalens bästa yta och ska bevaras: 13 av 13 sidor har en guide, noll råa i18n-nycklar, noll overflow, och rubrikerna är genomgående inviter — *"Hur mycket energi har du just nu?"*, *"Vad känns viktigt i din vardag just nu?"*, *"Vem vill du höra av dig till?"*, *"Vad vill du säga till din konsulent?"*, *"Vad hände idag?"*.

**Orsak:** `GlobalCoachWidget` och `SamlingarFab` monteras i `Layout.tsx:143-146` utan `hide-in-focus`-klassen som `FocusModeProvider` bygger på.
**Åtgärd:** lägg `hide-in-focus` på båda FAB:arna. Ta bort den ena exit-knappen (behåll den i sidhuvudet, den sticky duplicerar).
**Storlek:** XS.

---

### KV20 — Två flytande widgets täcker innehåll på 17 av 19 verktygssidor, inklusive GDPR-kontroller — MEDEL

**Yta:** alla verktygssidor i området (hub-landningarna har luft nere till höger).
**Bevis:** uppmätt på varje sida: `SamlingarFab` ligger `x=1244 y=758 172×54 z-40`, `GlobalCoachWidget` `x=1290 y=822 126×54 z-40` på 1440×900 — permanent ~170×110 px ur nedre högra hörnet. `bilder/kv-settings-integritet.png` visar det värsta enskilda fallet: på `/#/settings?section=privacy` täcker de två pillren **knappen `Godkänn` för Marknadsföring** och **knappen `Återkalla` för Dagbok och mående** — alltså två samtyckeskontroller.

På mobil 390 träffar samma två widgets bl.a. `/nätverk`s enda CTA "Lägg till första kontakten" och en tredjedel av kalenderrutnätet.

**Premissgranskat — två falska spår rensade:**
1. Widgetarna är i sitt dölj-vid-scroll-läge (`opacity: 0`, `pointer-events: none`) en stor del av tiden. Ren geometrisk överlappsmätning ger därför falska positiva; jag läste `opacity`/`pointer-events`/`transform` på varje blockerare.
2. En riktig `tap()` på de blockerade knapparna **lyckas**, eftersom Playwright (och en användare) scrollar elementet ur vägen först. Det här är alltså friktion, inte en hård blockering — till skillnad från M1/M2 i förra mobilgranskningen.
3. Jag kontrollerade också om innehåll fastnar permanent under bottennavet: nej. Scrollad till botten på alla 19 sidor ligger inga sidelement kvar under navet (de fyra "dolda" träffarna per sida är de stängda drawerna, se KV8).

**Åtgärd:** oförändrat från D3 — slå ihop till **en** FAB med två val, eller låt dem gömma sig när de överlappar interaktivt innehåll.
**Storlek:** M.

---

### KV21 — Kompetensgapets rubrik ekar hela jobbannonsen, två gånger, med dubbelpunkt — MEDEL

**Yta:** `/#/skills-gap-analysis`, resultatvyn.
**Bevis:** `bilder/kv-kompetensgap-resultat.png`. Underrubriken lyder ordagrant:

> *"Så här ser dina styrkor och nästa steg ut mot Vi söker en lagermedarbetare till vårt distributionscenter i Göteborg. Arbetsuppgifter: plockning och packning av order, truckkörning, inventering, enklare administration i vårt lagersystem. Vi ser gärna att du har truckkort A+B … möjlighet till heltid.**.**"*

Hela den inklistrade annonsen (438 tecken) injiceras i en meningsmall och avslutas med dubbel punkt. Två rader längre ned upprepas exakt samma text som *"Drömjobb: <hela annonsen>"*. Sidan uppmanar samtidigt användaren att klistra in en riktig annons (*"Använd en riktig jobbannons för bästa resultat!"*), så det här är normalfallet, inte ett kantfall.

**Åtgärd:** korta till rolltiteln (modellen returnerar den redan) eller trunkera till ~60 tecken med `line-clamp`. Ta bort den ena upprepningen och den extra punkten.
**Storlek:** S.

---

### KV22 — Voice & Tone: person, versaler, systemspråk och ett grammatikfel i AI-märkningen — MEDEL

**Bryter:** DESIGN.md §2 Regel 1 och 2.

**Min/din-inkonsekvens — samma sak, tre olika personformer, ofta på samma skärm:**

| Yta | Text |
|---|---|
| `/karriar` H1 | *"Planera **min** karriär"* |
| `/min-vardag` H1 | *"**Din** vardag"* (rätt enligt §2) |
| Fokusläget `/min-vardag` H1 | *"**Min** vardag"* |
| `/my-consultant` H1 + hubbkort | *"**Min** konsulent"* |
| Sidomenyn, samma sida | *"**Din** konsulent"* |
| `/resurser` H1 | *"**Dina** sparade resurser"* (rätt) |

§2-tabellen är explicit: *"Mina ansökningar" → "Dina jobbansökningar"*. Sidomenyn har redan gjort bytet; sidorna och hubbkorten har inte.

**Etikettnamn som inte matchar:** sidomenyn säger *"Kompetensanalys"*, sidans H1 säger *"Kompetensgap-analys"*, hubbkortet säger *"Kompetensanalys"* och `/education` länkar till *"Kompetensgap-analys"*. Fyra ytor, två namn.

**Versalfel:** *"Personligt Varumärke"* (H1, sidomeny och hubbkort) — svenska skriver inte titelversaler. Fokusläget skriver rätt: *"Personligt varumärke"*.

**Regel 2 — administrations- och systemspråk, ordagrant ur UI:**

| Sida | Text | §2 säger |
|---|---|---|
| `/nätverk` | knappen *"**Generera** meddelande"* | "Generera" → "Skapa" (står i tabellen) |
| `/exercises` | badge *"**Synkad med molnet**"* | implementationsspråk i en deltagarvy |
| `/exercises` | *"Praktiska övningar för att utveckla dina jobbsökar-**skills**"* | svengelska |
| `/settings` | *"Roll och behörigheter"*, *"Aktiv roll"*, *"Dina **rättigheter** är en kombination av alla dina roller"* | ren admin-vokabulär |

**Regel 3 — prestationsspråk, oförändrat sedan D8:**

| Sida | Text |
|---|---|
| `/wellness` | *"Dagens aktiviteter — **1 av 4 avklarade**"* |
| `/wellness` | *"God sömn är avgörande för **din prestation**. Sikta på 7-9 timmar."* |
| `/personal-brand` | fyra sektioner med badgen *"**0%**"* |

**Grammatikfel i art. 50-märkningen:** kompetensgapets AI-etikett lyder *"**Detta analys** är genererat med AI-stöd"* — ska vara "Den här analysen är genererad". Felet står på den enda raden som juridiskt måste vara begriplig.

**Åtgärd:** ren i18n-genomgång, noll risk. Börja med min/din och namnkollisionen Kompetensanalys/Kompetensgap-analys — de förvirrar navigationen, inte bara tonen.
**Storlek:** M.

---

### KV23 — Off-hub-färger på ytterligare tre sidor — LÅG–MEDEL

Färgräkning per sida (canvas-konverterad hue, mättnad ≥ 0,30 — varma stone-tokens bortfiltrerade):

| Sida | Hub | Uppmätta hue-familjer | Fel |
|---|---|---|---|
| `/interest-guide` | rosa 350° | 160° · 220° · **280° ×2** · 320° · 360° | fem familjer; den stora sparkle-tilen är violett `l=0,64` |
| `/wellness` | lavendel 260° | 40° (`s=0,97 l=0,89` amber) · 220° · 260° | amber-kort + blått kort på lavendelsida |
| `/education` | rosa 350° | 40° · 160° · 360° ×7 | två off-hub-tiles bland sju rätta |
| `/nätverk` | sky 205° | 200° ×2 · **220° ×2** | LinkedIn-blått block (varumärkesfärg — acceptabelt, men det är den enda avvikelsen) |

D6b och D6c oförändrade sedan 2026-08-04; `/education` är nytt i mätningen.
**Åtgärd:** samma som KV9 — `bg-[var(--c-bg)]`, differentiera med ikon.
**Storlek:** S per sida.

---

### KV24 — `/skills-gap-analysis` visar en avklippt råtextdump av CV:t som "Din nuvarande profil" — LÅG

**Yta:** `/#/skills-gap-analysis`, före analys.
**Bevis:** kortet "Din nuvarande profil — Hämtad från ditt CV och profil" innehåller en oformaterad textklump:

```
Namn: Sara, Projektledare
Profil: Erfaren projektledare med passion för att skapa effektiva team.
Arbetserfarenhet:
- Projektledare på Tech AB (2021-01 - nuvarande)
  Leder utvecklingsteam
Utbildning:
```

Texten klipps mitt i ordet "Utbildning:" av en fast höjd utan "Visa mer". Det är prompt-materialet renderat som UI — begripligt för en utvecklare, inte för en deltagare. (Namnet "Sara Testsson" kommer ur CV:t; kontots eget namn är Claude. Det är testdata, inte en bugg.)
**Åtgärd:** rendera fälten som en liten strukturerad lista, eller kollapsa bakom "Så här läser vi ditt CV".
**Storlek:** S.

---

### KV25 — `/karriar` avbryter två Supabase-anrop vid varje laddning — LÅG

**Yta:** `/#/karriar`
**Bevis:** de enda konsolfynden utanför `/my-consultant`, reproducerbara på varje laddning:

```
[requestfailed] .../rest/v1/diary_entries?select=id&user_id=eq.5b0904ac-…  :: net::ERR_ABORTED
[requestfailed] .../rest/v1/network_contacts?select=id&user_id=eq.5b0904ac-… :: net::ERR_ABORTED
```

Två `select=id`-anrop mot tabeller som inte har med Karriär-hubben att göra startas och avbryts direkt. Sannolikt en hubbsummerings-hook som monteras och avmonteras under första rendern. Inget syns för användaren, men det är två onödiga rundturer på hubbens kritiska väg.
**Åtgärd:** spåra vilken hook som startar dem och montera den bara på den hubb som behöver dem.
**Storlek:** S.

---

## 3. Konsol- och nätverksfel per sida

Räknat per sidladdning; `console.error` + `console.warn` + `pageerror` + HTTP ≥ 400 + `requestfailed`. Desktop 1440×900, inloggad, cookiebanner avfärdad.

| Sida | Fel | Vad |
|---|---|---|
| `/karriar` | **2** | 2 × `net::ERR_ABORTED` (`diary_entries`, `network_contacts`) — KV25 |
| `/career` | 0 | — |
| `/interest-guide` | 0 | — |
| `/skills-gap-analysis` | 0 | (mot prod: se KV18) |
| `/personal-brand` | 0 | — |
| `/education` | 0 | — |
| `/resurser` | 0 | — |
| `/knowledge-base` | 0 | — |
| `/resources` | 0 | — |
| `/print-resources` | 0 | — |
| `/externa-resurser` | 0 | — |
| `/ai-team` | 0 | (mot prod med AI av: 501/ERR_FAILED, se KV5) |
| `/nätverk` | 0 | — |
| `/min-vardag` | 0 | — |
| `/wellness` | 0 | — |
| `/diary` | 0 | — |
| `/calendar` | 0 | — |
| `/exercises` | 0 | — |
| `/my-consultant` | **4** | 2 × HTTP 406 `consultant_meetings` + 2 × "Failed to load resource: 406" — KV14 |
| `/profile` | 0 | — |
| `/settings` | 0 | — |

**Summa: 6 fel på 21 sidor, fördelade på 2 sidor.** Mobilsvepet (20 sidor, 390×844) gav samma bild: bara `/my-consultant` (4) och `/karriar` (2).

Mätt mot prod tillkommer, i AI-flöden:

| Yta | Status | Kropp |
|---|---|---|
| `/api/ai` (`ai-team-chat`, localhost) | **501** | `{"error":"AI-funktion \"ai-team-chat\" är inte mockad i dev"}` |
| `/api/ai` (`ai-team-chat`, prod) | 200 | `text/event-stream`, `data: {"token":…,"content":…}` |
| `/api/ai` (`kompetensgap`, prod) | 200 | svar efter 43,3 s |

---

## 4. Sida-för-sida

| # | URL | Helhetsintryck | Hero | Fel | Not |
|---|---|---|---|---|---|
| 1 | `/#/karriar` | **OK** | rosa `rgb(251,238,239)` ✓ | 2 | H1 *"Planera min karriär"* (KV22), KV25 |
| 2 | `/#/career` | OK | grå + 4 px rosa ✓ | 0 | 14 rosa element, konsekvent |
| 3 | `/#/interest-guide` | Anmärkning | grå + 4 px rosa ✓ | 0 | KV16 räknare, KV23 fem färger |
| 4 | `/#/skills-gap-analysis` | Anmärkning | grå + 4 px rosa ✓ | 0 | KV2, KV18, KV21, KV24 |
| 5 | `/#/personal-brand` | Anmärkning | grå + 4 px rosa ✓ | 0 | fyra "0%", 3 207 px, KV6 |
| 6 | `/#/education` | OK | grå + 4 px rosa ✓ | 0 | KV23 två off-hub-tiles |
| 7 | `/#/resurser` | **OK** | sky `rgb(236,244,250)` ✓ | 0 | konsekvent |
| 8 | `/#/knowledge-base` | **Anmärkning** | **ingen** ✗ | 0 | KV9 (D10 + D6a), KV6 helsvensk i EN |
| 9 | `/#/resources` | Anmärkning | grå + 4 px sky ✓ | 0 | **KV7 felaktig räkning**, KV11 |
| 10 | `/#/print-resources` | OK | grå + 4 px sky ✓ | 0 | KV6 helsvensk i EN |
| 11 | `/#/externa-resurser` | OK | grå + 4 px sky ✓ | 0 | 3 378 px, KV6 |
| 12 | `/#/ai-team` | **Anmärkning** | grå + 4 px sky ✓ | 0 | KV1, KV3, KV5, KV15 |
| 13 | `/#/nätverk` | OK | grå + 4 px sky ✓ | 0 | korrekt `<EmptyState>`; *"Generera meddelande"* (KV22) |
| 14 | `/#/min-vardag` | **OK** | lavendel `rgb(242,237,248)` ✓ | 0 | **D2 rättad** — kortet visar "Claude Test" |
| 15 | `/#/wellness` | Anmärkning | grå + 4 px lavendel ✓ | 0 | KV22 *"1 av 4 avklarade"*, *"din prestation"*; KV23 |
| 16 | `/#/diary` | Anmärkning | grå + 4 px lavendel ✓ | 0 | KV12 `🔥 1 dagar` + amber-kort |
| 17 | `/#/calendar` | OK | grå + 4 px lavendel ✓ | 0 | ren lavendel; tom månad utan välkomnande |
| 18 | `/#/exercises` | **Anmärkning** | grå + 4 px lavendel ✓ | 0 | KV10 — sidans värsta problem i området |
| 19 | `/#/my-consultant` | Anmärkning | grå + 4 px lavendel ✓ | **4** | **UX24 rättad — 0 råa nycklar.** KV13, KV14 |
| 20 | `/#/profile` | Anmärkning | modal ✗ | 0 | KV17 automodal + mint |
| 21 | `/#/settings` | Anmärkning | grå + 4 px **mint** ✗ | 0 | KV17 (§3), KV20 täcker samtyckesknappar |

**Summering:** 0 trasiga · 12 med anmärkning · 9 OK · 6 konsolfel på 2 sidor.

---

## 5. Verifierat rättat sedan 2026-08-04

Fem punkter kontrollerades och håller:

| Fynd | Status nu | Bevis |
|---|---|---|
| **D1 / UX24** — 17 råa i18n-nycklar + 3 i18next-felsträngar på `/my-consultant` | ✅ **Rättad** | 0 råa nycklar på 21 sidor i **båda** språken; sidan renderar riktig copy |
| **D2** — Min vardag sa "Inte tilldelad" fast konsulent fanns | ✅ **Rättad** | hubbkortet visar statuschippet *"Claude Test"* (`bilder/kv-minvardag-hub.png`) |
| Horisontell overflow | ✅ **Håller** | `scrollWidth − clientWidth = 0` på 21 desktop- och 20 mobilsidor |
| Två-lägessystemet §3 | ✅ **Håller** | 3/3 hub-landningar med rätt pastell; 18/19 verktygssidor med `rgb(245,244,240)` + 4 px hub-kant |
| Innehåll fast under bottennavet på mobil | ✅ **Inget fynd** | scrollad till botten på 19 sidor: noll sidelement kvar under navet |

Och femton punkter kvarstår oförändrade: **D3** (KV20), **D4** (KV17), **D5a** (KV10), **D5b** (KV11), **D5c** (KV22), **D6a** (KV9), **D6b/c/d/e** (KV12, KV15, KV23), **D7** (KV12), **D8/D9** (KV22), **D10** (KV9), **D11** (KV17), **D14/D15** (KV15), **D17** (KV14), **M3** (KV8 — vuxen från 36 till 50–55).

---

## 6. Förbättrings- och utvecklingsförslag

**1. Ge AI-teamet en energibudget, inte bara en personlighet.** Sidopanelen har redan *Personlighet* och *Svarslängd*. Lägg till ett tredje val som styr **hur många steg ett svar får innehålla** — "Ett steg i taget" / "Några förslag" / "Ge mig hela bilden" — och låt "Ett steg i taget" vara default. Det löser KV1 där det uppstår (i prompten) och gör det till en synlig, valbar anpassning i stället för en dold designregel. För målgruppen är detta sannolikt den enskilt största förbättringen i hela området.

**2. Låt kompetensgapet säga "vet inte".** Analysen är bra på det den vet (kurser, handlingsplan) och hittar på det den inte vet (nuvarande nivåer). En tredje kolumn — *"Står i ditt CV" / "Framgår inte"* — gör resultatet ärligt utan att göra det tunnare, och tar bort behovet av ett matchningsprocenttal helt.

**3. Kuratera Övningar i stället för att lista dem.** 119 kort och 40 000 px är inte ett designproblem utan ett produktproblem: sidan har inget centrum. §8 föreskriver redan lösningen ("För dig idag: 3 övningar"), och intresseguidens RIASEC-profil samt måendeloggen finns redan som signal att välja ur. Det gör Min vardag till den enda hubb där portalen faktiskt *föreslår* något.

**4. Gör fokuslägets copy till mall för resten av portalen.** Fokusläget skriver *"Vad känns viktigt i din vardag just nu?"* där normalläget skriver *"Övningar"*. Skillnaden är inte teknik utan att någon skrev om rubrikerna en gång. De 15 H1:orna i det här området kan lyftas till samma nivå på en dag, och fokuslägets 13 rubriker är redan en färdig ordlista att utgå från.

**5. Bestäm vad engelskt läge lovar.** Idag lovar menyn en engelsk portal och innehållet levererar en svensk. Två hederliga alternativ: översätt UI-chrome (~150 strängar) och skriv ut *"Content available in Swedish only"* på artikel-/övningslistorna — eller ta bort engelska ur språkväljaren tills innehållet finns. Det nuvarande mellanläget är det sämsta av tre.

**6. En definition per tal.** "Sparade jobb" har idag tre värden i portalen (KV7) och intresseguiden fyra samtidiga framstegstal (KV16). Samma familj som lärdomen 2026-07-27 om delade cache-nycklar: *ett tal = en ägare = en definition*. En liten `useSavedJobsCount()`-hook och en enda progresskälla i guiden räcker.

**7. Slå ihop de två FAB:arna.** Ett enda piller med två val tar bort KV20 på 17 sidor, tömmer nedre högra hörnet på GDPR-sidan och gör KV19 (FAB i fokusläget) till en rad i stället för två.

---

## 7. Vad jag inte hann granska

- **Mörkt läge.** Toggeln finns i topbaren (`aria-label="Mörkt läge"`) och alla granskade komponenter har `dark:`-klasser, men jag körde inget svep i mörkt läge. F1 ligger dessutom som ett öppet beslut hos Mikael.
- **Skärmläsare.** Jag mätte `aria-live`, `role="status"` och tabbordning programmatiskt, men har inte kört NVDA/VoiceOver. Tillgänglighetsagenten täcker det området.
- **Intresseguidens resultatvy.** Testet är 34 frågor i fyra deltest; jag kom till fråga 17 innan tidsbudgeten tog slut. Flikarna **Resultat**, **Yrken**, **Utforska** och **Historik** är därmed ogranskade — och det är där guidens AI-del (RIASEC-matchning mot 80+ yrken, anpassningsförslag) faktiskt levererar. Rekommenderas som eget uppdrag.
- **Personligt varumärke-verktygets AI-delar.** Flikarna *Personlig Pitch*, *Portfolio* och *Synlighet* öppnades inte; bara *Varumärkesaudit* granskades visuellt.
- **`/wellness` underflikar** *Rutiner*, *Kognitiv träning* och *Akut stöd* — bara huvudfliken granskades. *Akut stöd* bör granskas separat: det är den enda ytan i området där ett fel kan ha allvarliga konsekvenser.
- **Kalenderns skapa-flöde** ("Ny händelse") och dagbokens skrivflöde — bara listvyerna granskades.
- **AI-teamets övriga fyra agenter.** Arbetskonsulent och Arbetsterapeut testades skarpt; Studievägledare, Motivationscoach och Digital Coach inte alls. Motivationscoachen är art. 9-klassad precis som Arbetsterapeuten och bör testas med samma frågor.
- **Långsamt nät.** Mätningen 2026-08-04 (M5: 10 s statisk splash, aldrig ett skelett) upprepades inte; den bör verifieras mot ett nytt prod-bygge eftersom entry-bundeln ändrats sedan dess.
- **360×640.** Bara 390×844 mättes på mobil. Förra granskningen fann inget unikt för den smalare skärmen, så risken bedöms som låg.
