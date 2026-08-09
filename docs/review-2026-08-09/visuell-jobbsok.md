# Visuell granskning — deltagarens jobbsökarspår

**Datum:** 2026-08-09
**Miljö:** `http://localhost:3000` (vite dev, HashRouter) + **prod `https://jobin.se`** för de AI-beroende flödena — `/api/ai` finns inte på dev-servern (POST ger `501`, ingen proxy i `client/vite.config.ts:151-153`), så all AI-verifiering är gjord mot prod och märks ut per fynd.
**Konto:** `claude-playwright-test@jobin.se` (deltagare — 1 CV, 2 sparade jobb, 5 poster i ansökningspipen, tilldelad konsulent)
**Metod:** Playwright/Chromium, egen `storageState`, 11 sidor × 2 viewporter (1440×900, 390×844), DOM-sond (hero-bakgrund, `border-left`, gradienter, pastellinventering, råa i18n-nycklar, overflow, fixerade lager), hit-test i tre scrollägen **plus riktiga `tap()`/`click()`** på de träffar hit-testet flaggade, samt genomklickade flöden: sök jobb → spara jobb → sparade-fliken, ny ansökan (modal + tom validering), CV-byggaren, personligt brev hela vägen till genererad text, intervjusimulator igång, LinkedIn-headline genererad.
**Bilder:** `docs/review-2026-08-09/bilder/jobbsok-*.png`

---

## 1. Sammanfattning

Två-lägessystemet håller: alla fem hub-landningar och alla nio verktygssidor i `/jobb`-hubben har rätt hero (persika `rgb(252,241,230)` respektive neutral grå `rgb(245,244,240)` med 4 px `rgb(168,93,36)`-kant), noll gradientknappar, noll horisontell overflow på 22 mätningar, noll konsolfel vid vanlig navigering. Felen sitter i innehåll, i AI-fallbacks, i navigationen och i mobilens fixerade lager. **Det allvarligaste:** när AI-anropet för personligt brev fallerar skriver portalen ett påhittat mallbrev åt användaren och märker det "genererat med AI-stöd" — reproducerat på prod (J1). Två kända mobilbuggar från 2026-08-04 är **oåtgärdade**: CoachWidget täcker "Nästa" i CV-byggaren (M2) och cookiebannern gör inloggningsknappen otappbar (M1/UX23). Två av hubbens nio verktyg saknas både på hubbsidan och i mobilmenyn — de är oåtkomliga på mobil utan direkt-URL (J5), och mobilmenyn kör fortfarande den gamla platta navigationen parallellt med 5-hub-modellen (J23). Ett "Exempeldata"-kommando skriver över deltagarens riktiga CV med en påhittad person, och autosparas (J4). Tonen är rätt på hubbarna men glider till etikett- och prestationsspråk så fort man kommer in i ett verktyg.

**23 fynd:** 1 kritisk, 4 höga, 14 medel, 4 låga.

---

## 2. Fynd

### J1 — Misslyckad AI-generering ger ett påhittat brev märkt "genererat med AI-stöd" — **KRITISK** — S

**Sida:** `/#/cover-letter`, steget "Skriv brev". **Reproducerat på prod.**

När `/api/ai` svarar med fel visar portalen en toast ("Kunde inte generera brev. Försök igen.") som försvinner efter några sekunder — och lägger *samtidigt* ett färdigt brev i redigeringsrutan under rubriken **"Ditt brev"**. Brevet kommer från en hårdkodad mall, inte från AI.

**Bevis (prod, `/api/ai` avvisad med 500 via route-interception i webbläsaren — ingen ändring i prod):** `bilder/jobbsok-04-brev-fallback-prod.png`

> Jag söker med stort intresse rollen som Bagagevaktmästare hos AKTIEBOLAGET NYA GRAND HOTEL. Med min bakgrund inom **Erfaren projektledare med passion för att skapa effektiva team.** och passion för att utvecklas, tror jag att jag skulle passa väl in i ert team.
>
> Under min tidigare erfarenhet har jag utvecklat starka färdigheter inom Projektledning, Agila metoder, **[PERSONA-B] testkompetens**. […]
>
> Med vänliga hälsningar,
> **[ Ditt namn ]**

Går man ett steg vidare till "Granska & Spara" får samma text AI-märkningen: *"Detta brev är genererat med AI-stöd. Granska och redigera innan du använder det."* (`bilder/jobbsok-05-brev-fallback-ai-markning.png`).

**Orsak (verifierad i koden):**
- `client/src/components/cover-letter/CoverLetterWrite.tsx:396-407` — `catch`-grenen anropar `mockGenerateLetter(...)` och sätter resultatet som `generatedLetter`/`editedLetter`.
- `client/src/components/cover-letter/CoverLetterWrite.tsx:1137-1155` — mallen. Kommentaren i koden lyder ordagrant `// Mock AI fallback`.
- `client/src/components/cover-letter/CoverLetterWrite.tsx:1110` + `1112` — rutan bär `data-ai-generated="true"` och `<AIGeneratedWatermark contentType="brev" />`.
- `client/src/components/ai/AIBadge.tsx:89-104` — watermarkens docstring hänvisar uttryckligen till **AI Act art. 50.2**. Märkningen är alltså både falsk *och* det som ska bära den rättsliga transparensen.

**Tre fel i ett:** (a) innehållet är inte AI-genererat men märks som det; (b) svenskan är trasig (CV-sammanfattningen splitsas in mitt i en mening, kvarvarande punkt före "och passion"); (c) texten påstår kompetenser (Projektledning, Agila metoder) som inte har med tjänsten att göra, och läcker `[PERSONA-B]`. En deltagare som litar på verktyget kan skicka det här till en arbetsgivare.

**Åtgärd:** ta bort fallbacken. Vid fel: behåll rutan tom, visa ett kvarstående felmeddelande med "Försök igen"-knapp. Vill man erbjuda en mall ska den (1) heta mall, (2) sakna AI-märkning, (3) inte fyllas med CV-fragment mitt i meningar. Lägg ett test som asserterar att `data-ai-generated` **aldrig** sätts på fallback-innehåll.

**Not:** när AI:n *fungerar* är resultatet bra — sammanhängande, rollanpassad svenska (`bilder/jobbsok-13-brev-ai-prod-lyckad.png`). Problemet är enbart felvägen.

---

### J2 — CoachWidget täcker "Nästa" i CV-byggaren på mobil — **HÖG** — S — *regression från 2026-08-04 kvarstår*

**Sida:** `/#/cv`, 390×844. Detta är fynd **M2** i `docs/review-2026-08-04/visuell-mobil.md`. Statuskontroll: **oåtgärdat**.

**Bevis:** riktig `tap()` på "Nästa" **timeoutar efter 4 s**; Playwright loggar `<img alt="" loading="lazy" aria-hidden="true" …>` som interceptor — coach-avatarerna. Geometri: knappraden `DIV.lg:hidden.fixed.left-0.right-0` y=705–780 (z-40), CoachWidget `BUTTON.group.fixed.z-40.bottom-20` x=292–374, y=710–764. Bild: `bilder/jobbsok-07-cv-nasta-vs-coachwidget-390.png` — bara "Näs" syns under avatarerna.

**Orsak (oförändrad sedan förra granskningen):** `client/src/pages/CVBuilder.tsx:1088-1089` (`paddingBottom: calc(var(--bottom-nav-h) + 5rem)`, raden lyfts) vs `client/src/components/CoachWidget.tsx` (`bottom-20`, dvs 80 px).
**Åtgärd:** som föreslaget 2026-08-04 — låt verktygsraden exportera `--tool-bar-h` och låt CoachWidget/SamlingarFab räkna `bottom: calc(80px + var(--tool-bar-h, 0px))`. Verifiera med hit-test över *alla* fixerade lager, inte okulärt.

---

### J3 — Cookiebannern gör "Logga in" otappbar på 390 px — **HÖG** — S — *M1/UX23 kvarstår*

**Sida:** `/#/login`, ren kontext utan cookies/localStorage.

| Viewport | Hit-test | Riktig `tap()` |
|---|---|---|
| 390×844 | **5/5 punkter blockerade** — blockerare `P.text-sm.text-stone-600`, `H2.text-lg.font-semibold`, `DIV.flex.items-start.gap-4`, `path` | **timeout 4000 ms** |
| 1440×900 | 0/5 | `click()` OK |

Knappen ligger x=49–341, y=519–569. Bild: `bilder/jobbsok-08-login-cookiebanner-390.png`.
**Åtgärd:** oförändrad från M1 — backdrop + `role="dialog"`/`aria-modal` så bannern läser som det spärrläge den faktiskt är, eller en kompakt variant under `sm`. Portalens ytterdörr ska inte kräva att man gissar sig till att cookiefrågan måste besvaras först.

---

### J4 — "Exempeldata" skriver över deltagarens riktiga CV med en påhittad person — och autosparar — **HÖG** — S

**Sida:** `/#/cv`. Knappen "Exempeldata" ligger permanent i åtgärdsraden ovanför CV-innehållet, synlig i prod för deltagare (verifierat inloggad på jobin.se).

`client/src/pages/CVBuilder.tsx:543-570` ersätter `firstName/lastName/title/email/phone/location/summary/skills/workExperience/education` med **Anna Andersson, Projektledare, anna@example.com, 070-123 45 67, Stockholm, Tech AB, Stockholms Universitet**. Bekräftelsedialog finns, men CV:t har **autospar mot molnet** (kommentaren på rad 1091: *"auto-save sköter molnet, ingen manuell spara-knapp"*) och det finns ingen ångra-funktion och ingen versionsåterställning i vyn.

Detta är inte teoretiskt: testkontots CV bär exakt strängen *"Erfaren projektledare med passion för att skapa effektiva team."* och kompetenserna *Projektledning / Agila metoder* — och det är den texten som sedan splitsades in i brevet i J1.

**Åtgärd:** ta bort knappen ur deltagarvyn, eller gör den additiv (fyll bara tomma fält) och ge en "Ångra"-åtgärd. En destruktiv demo-knapp hör inte hemma i ett produktionsverktyg för den här målgruppen.

---

### J5 — `/jobb`-hubben saknar två av hubbens nio verktyg — **HÖG** — S

**Sida:** `/#/jobb`. Bild: `bilder/jobbsok-02-jobb-hub-desktop.png`

Hubben visar sju funktionskort. `navHubs[].memberPaths` för hubben listar nio sidor (`client/src/components/layout/navigation.ts:215-225`) — **`/linkedin-optimizer` och `/international` har inget kort** (`client/src/pages/hubs/JobsokHub.tsx:84-154`, listan slutar på `salary`).

På desktop räddas det av sidomenyns undermeny. **På mobil finns ingen väg alls:** hamburgermenyn (`navGroups`) listar 32 poster och **varken LinkedIn-optimering eller Internationell Guide finns med** (verifierat, se J23 och `bilder/jobbsok-15-mobilmeny-390.png`). För en mobilanvändare är de två verktygen alltså bara nåbara via direkt-URL. Båda sidorna fungerar (LinkedIn-optimeraren genererar riktig AI-text i prod) — de saknar bara en väg in.

**Åtgärd:** lägg till de två korten i `features[]`. Överväg en grind som jämför `memberPaths` mot hubsidans `features[].href` och mot `navGroups` — samma klass av tyst lucka som lazy-import-utan-route var.

---

### J6 — Modaler renderas utanför `data-domain` och får därför fel hub-färg — **MEDEL** — S

**Sida:** `/#/applications` → "Ny ansökan". Bild: `bilder/jobbsok-06-ny-ansokan-modal-mintgron.png`

Mätning i webbläsaren: modalens primärknapp "Lägg till" har `background-color: rgb(26, 119, 87)` och `--c-solid: #1A7757` — det är **Översikts mint**, på en persika-sida. Orsak: elementkedjan från modalen upp till `body` är `DIV → DIV → MAIN → DIV → DIV → DIV → DIV → DIV → BODY` **utan ett enda `[data-domain]`**, så `--c-solid` faller tillbaka på `:root`-defaulten. Sidans egen `data-domain="activity"`-div (`--c-solid: #A85D24`) ligger vid sidan om.

Bryter DESIGN.md §4 ("en sida = en hub-färg"). Samma modal har dessutom **`focus:ring-violet-500` hårdkodat på nio fält** (`client/src/components/applications/AddApplicationModal.tsx:218, 237, 254, 270, 283, 299, 313, 328, 346`) — det är fynd D15 (violett fokusring) i en ny skepnad.

**Åtgärd:** montera modallagret innanför `data-domain`-wrappern (eller sätt `data-domain` på modalroten), och byt de violetta ringarna mot `--c-solid`.

---

### J7 — Hårdkodad emerald och violett genom hela persika-hubben — **MEDEL** — M

Pastellsystemet i sig är rent: sondningen hittade **enbart persika-toner** i `main` på alla nio verktygssidor. Färgbrotten kommer från hårdkodade Tailwind-klasser vid sidan av tokensystemet:

| Fil:rad | Vad |
|---|---|
| `components/cover-letter/CoverLetterWrite.tsx:510, 528` | stegindikatorns "klart"-prickar och linjer i `bg-emerald-500` |
| `components/cover-letter/CoverLetterWrite.tsx:662, 1128` | "Spara brev" i `bg-emerald-600 hover:bg-emerald-700` |
| `pages/CVBuilder.tsx:215, 234` | wizard-stegens gröna bockar och progressfyllning |
| `components/cv/templates/CVTemplates.tsx:1475, 1538` | "Vald"-badge respektive vald mall i grönt |
| `pages/InterviewSimulator.tsx:1249` | grön ikonbricka i sessionsvyn (jfr grön stoppursiffra i `bilder/jobbsok-10-intervju-session-desktop.png`) |
| `components/ai/AIBadge.tsx:102` | AI-watermarken i violett — syns som violett rad mitt i ett persika-brev |

På `/#/interview-simulator` blandas dessutom fyra pasteller i STAR-blocket (gul S, orange T, blå A, grön R) på samma sida (`bilder/jobbsok-11-intervju-start-desktop.png`).

**Åtgärd:** ersätt med `var(--c-solid)` / `var(--c-accent)`. Grönt som "klart"-semantik bör i så fall bli en egen token, inte en Tailwind-klass som råkar krocka med Översikts hub-färg.

---

### J8 — Ansökningspipen: fem "0"-kolumner och fem staplade tomtillstånd — **MEDEL** — M — *D12 kvarstår*

**Sida:** `/#/applications`. Bild: `bilder/jobbsok-03-applications-pipeline-desktop.png`

Åtta kolumner, tre med innehåll. Screening, Telefonintervju, Intervju, Arbetsprov och Erbjudande visar var sin **`0`-badge** och var sitt "Inga ansökningar" — fem tomtillstånd staplade på en skärm, utan ikon-rubrik-CTA-strukturen som DESIGN.md §7 kräver. Det bryter både §7 och Voice-regel 3 ("0 aktiva ansökningar" → "Du har inte börjat söka jobb än").

Uppföljningsbannern ovanför säger *"Dessa har inte uppdaterats på 7+ dagar. **Överväg att** följa upp eller uppdatera status."* — myndighetston i en deltagarvy.

**Åtgärd:** dölj tomma senare steg bakom "Visa alla steg", ta bort `0`-badgen (visa inget), och gör kvarvarande tomtillstånd till en enda `<EmptyState>`. Skriv om bannern: "Fyra ansökningar har vilat en vecka. Vill du höra av dig?"

---

### J9 — Intervjusimulatorn är byggd som ett prov, inte som en övning — **MEDEL** — M

**Sida:** `/#/interview-simulator` under pågående session (prod). Bild: `bilder/jobbsok-10-intervju-session-desktop.png`

I hjälteposition, tre KPI-kort: **"Frågor besvarade — 0"**, **"Genomsnittligt betyg — Inget svar är betygsatt än"**, **"Tid för svar — 8s"** (stoppur som räknar uppåt; mätt 8 s → 14 s på sex sekunder). Längst ned: **"Din progress · Besvarat 0 frågor · 5 frågor kvar till utmärkelse"**.

Det är fyra av de saker Manifestet uttryckligen förbjuder samtidigt: nolla i hjälteposition, betygsättning, klocka på svaret och en utmärkelse att jaga. För en användare med prestationsångest inför just intervjuer är det den sämsta möjliga inramningen.

**Åtgärd:** ta bort räknarna och "utmärkelse". Behåll stoppuret men gör det opt-in ("Vill du öva med tidtagning?"). Byt "Genomsnittligt betyg" mot kvalitativ återkoppling.

---

### J10 — Fallback-frågorna i intervjusimulatorn är rollblinda — **MEDEL** — S

**Sida:** `/#/interview-simulator` när AI:n inte svarar (reproducerat lokalt; i prod svarade AI:n och gav en korrekt rollanpassad fråga: *"Kan du berätta lite om dig själv och vad som motiverar dig att arbeta som lokalvårdare?"*).

I fallback-läget för en session med rollen **Lokalvårdare** visas:

> **Exempel på bra svar:** "Jag är en driven utvecklare med 5 års erfarenhet inom webbutveckling. Jag är specialiserad på React och backend-teknologier. […]"

Sessionen märks samtidigt "Generisk övning" — men exemplet är inte generiskt, det är en utvecklarprofil. Samma familj som J1: fallbacken låtsas vara något den inte är.
**Åtgärd:** gör exempelsvaret rollneutralt (eller ta bort det i fallback-läget) och skriv ut för användaren att frågorna är standardfrågor eftersom AI:n inte kunde nås.

---

### J11 — LinkedIn-fallbacken motsäger sig själv — **MEDEL** — S

**Sida:** `/#/linkedin-optimizer` (reproducerat lokalt, AI 501).

Resultatrutan visar först en varning — *"⚠️ AI-tjänsten är inte tillgänglig just nu. Här är en grundmall du kan utgå från och anpassa själv"* — och direkt under den, som fast disclaimer: *"Detta förslag är genererat med AI-stöd."* Två motstridiga påståenden om samma text, tio rader isär. Mallen påstår dessutom "Erfaren specialist inom Storstädning" utan underlag.
Orsak: `client/src/pages/LinkedInOptimizer.tsx:74` (catch-grenen) lämnar disclaimern på plats.
**Åtgärd:** dölj AI-disclaimern när innehållet kommer från fallbacken. Samma regel som J1.

---

### J12 — `aria-label` renderar en rå i18n-nyckel — **MEDEL** — S

**Sida:** `/#/job-search`. Röstsökningsknappen har `aria-label="jobSearch.voiceSearch"` — nyckeln finns inte i `sv.json` (`node -e "Object.keys(sv.jobSearch).filter(/voice|listen/)"` → `[]`). Samma sak för `jobSearch.listening`.
`client/src/pages/JobSearch.tsx:481`. En skärmläsaranvändare hör "jobSearch punkt voiceSearch".
Detta är den enda råa nyckeln jag hittade i hela spåret — sondningen (textnoder + `placeholder` + `aria-label`) gav 1 träff på 22 sidladdningar. Resten av i18n-arbetet håller.
**Åtgärd:** lägg till `jobSearch.voiceSearch` och `jobSearch.listening` i `sv.json` och `en.json`. Överväg en grind som failar när `t()` returnerar nyckeln själv.

---

### J13 — LinkedIn-optimeraren blandar svenska och engelska — **MEDEL** — S

**Sida:** `/#/linkedin-optimizer`. Bild: `bilder/jobbsok-09-linkedin-desktop.png`

Flikar: **"Headline" · "About" · "Inlägg" · "Kontakt" · "Profilgranskning"** — två av fem på engelska. Rubrik: **"Skapa Headline"**. Brödtext: *"Din headline syns direkt under ditt namn. Gör den beskrivande och **catchy**!"*

För en användare med svenska som andraspråk — en stor del av målgruppen — är det här onödigt svårt. Att LinkedIn själv kallar fältet "headline" på engelska motiverar inte "catchy".
**Åtgärd:** "Rubrik (headline)", "Om dig (about)", och skriv om "catchy" till "lätt att komma ihåg".

---

### J14 — Verktygssidornas rubriker är etiketter, inte inviter — **MEDEL** — M

DESIGN.md §3 visar verktygsläget med exemplet *"Skapa ditt CV / Bygg ett CV som öppnar dörrar."* Så här ser de nio sidorna ut i verkligheten:

| Sida | H1 idag | Kommentar |
|---|---|---|
| `/cv` | **"CV"** + "Skapa och **hantera** ditt CV" | Ren etikett. "Hantera" är det ord §2 Regel 2 pekar ut. |
| `/spontanansökan` | "Spontanansökan" | Etikett. Underrubriken *"Hitta och kontakta företag som passar dig"* är däremot rätt. |
| `/salary` | **"Lön & Förhandling"** | Versal mitt i frasen — engelsk titelkonvention på svenska. |
| `/international` | **"Internationell Guide"** | Samma. |
| `/interview-simulator` | "Intervju-simulator" | Systemord, inte invit. |
| `/linkedin-optimizer` | "LinkedIn-optimerare" | Samma. |
| `/job-search` | "Sök jobb" | OK. |
| `/applications` | "Dina jobbansökningar" | **Rätt** — så här ska de andra låta. |
| `/cover-letter` | "Personligt brev" | Neutral; underrubriken är bra. |

Samma sak i knappnamnen: **"Generera brev med AI"** (`/cover-letter`, steg 2) — "Generera" står ordagrant i §2:s förbudslista med "Skapa" som ersättare.

Sidomenyn och `/jobb`-hubben är dessutom oense om namnen: menyn säger "Dina jobbansökningar", hubkortet säger "Mina ansökningar" (`client/src/pages/hubs/JobsokHub.tsx:96`) — och §2:s egen tabell säger uttryckligen att "Mina ansökningar" ska bli "Dina jobbansökningar".

**Åtgärd:** en genomgång av de nio H1:orna + hubkortens titlar mot §2. Litet arbete per sida, men det är den mest synliga tonavvikelsen i hela spåret.

---

### J15 — De två flytande knapparna täcker riktiga CTA:er — **MEDEL** — S — *D3 kvarstår*

Uppmätt överlapp på desktop 1440×900 (prod):

| Sida | Widget | Täcker | Överlapp |
|---|---|---|---|
| `/linkedin-optimizer` | "Mina samlingar" (x=1244, y=758, 172×54) | knappen **"Starta profilgranskning"** | **172×48 px — hela knappens höjd** |
| `/cv` | "Mina samlingar" | länken "Så skriver du en sammanfattning som fångar…" | 147×54 px |
| `/cv` | "Tips" (CoachWidget) | två artikellänkar i "Behöver du hjälp?" | 101×21 px vardera |

På 390 px ligger båda över sidinnehållet vid scrolltoppen på samtliga elva sidor. De tonas ut vid scroll (verifierat: `opacity` 0 i mid-scroll), så de blockerar inte permanent — men de sitter över *precis* den yta där verktygssidor lägger sin sekundära CTA.
**Åtgärd:** samma som J2 — ge widgetstacken en offset som räknar med sidans egna fixerade lager, och undvik `bottom-right` på sidor som har en CTA där.

---

### J16 — "Ny ansökan"-modalen är ett myndighetsformulär — **MEDEL** — S

**Sida:** `/#/applications`. Bild: `bilder/jobbsok-06-ny-ansokan-modal-mintgron.png`

Rubrik "Lägg till ansökan". Fält: "Företag \*", "Tjänst \*", "Källa", "Prioritet". Vid tomt formulär: *"Företag och tjänst är **obligatoriska fält**"*. Valideringen fungerar (submit är aktiv, klick ger felraden, modalen stannar kvar) — men språket är hämtat rakt ur ett ärendehanteringssystem.

Positivt: fälten har vettiga exempel-placeholders ("T.ex. Spotify"), och Escape stänger modalen.
**Åtgärd:** "Vilket jobb sökte du?" som rubrik, "Var sökte du?" / "Vilken tjänst?" som etiketter, "Fyll i företag och tjänst så hittar du tillbaka hit" som felrad. Prioritet/Källa bakom "Fler detaljer".

---

### J17 — CV-hero visar tre motstridiga framstegssignaler samtidigt — **MEDEL** — S

**Sida:** `/#/cv`, 390×844. Bild: `bilder/jobbsok-07-cv-nasta-vs-coachwidget-390.png`

I samma rad: **"Steg 1 av 6 · ~2 min kvar · 83% klart"**, med fem gröna bockar och en grå prick under. Att stå på steg 1 och samtidigt vara 83 % klar är motsägelsefullt — procenten mäter ifyllda sektioner, stegräknaren mäter position i guiden. Procent i hjälteposition är dessutom exakt det §2 Regel 3 förbjuder ("23% klart med din profil").
**Åtgärd:** behåll "Steg 1 av 6" (som §2 tillåter), ta bort procenten och tidsuppskattningen ur hero.

---

### J18 — CV-onboardingen tar hela mobilskärmen direkt vid ankomst — **MEDEL** — S

**Sida:** `/#/cv`, 390×844. Bild: `bilder/jobbsok-12-cv-onboarding-390.png`

En modal på **7 steg** öppnar sig automatiskt vid första besöket och täcker hela viewporten (`DIV.fixed.inset-0.z-50`, hit-test: alla sidans knappar 5/5 blockerade — korrekt för en modal, men allt är blockerat). Stängkryssets fokusring är **violett** på en persika-sida (samma familj som J6).

Att möta en sjustegsguide innan man ens sett sidan är motsatsen till "lugn före information". Modalen har "Hoppa över", vilket räddar situationen — men den är den minst framträdande av tre knappar.
**Åtgärd:** korta till 3 steg, eller byt till en icke-blockerande "Vill du ha en rundtur?"-remsa. Rätta fokusringen.

---

### J19 — Streak-räknare på Översikt — **LÅG** — S

**Sida:** `/#/oversikt`. Bild: `bilder/jobbsok-01-oversikt-desktop.png` — kortet "Din vardag" visar statusraden **"1 dag i rad loggade"**.
`client/src/pages/hubs/HubOverview.tsx:184` (och `MinVardagHub.tsx:97`). §2 Regel 3 listar "Streak: 0 dagar" under "(ta bort)". Med värdet 1 blir det närmast en förebråelse.
Resten av Översikt är däremot mönstergill: "Hej, Claude", "Vad vill du göra idag?", "Inga händelser än — börja utforska" i kursiv sekundärton.
**Åtgärd:** byt till "Senast loggat i går" eller ta bort raden.

---

### J20 — Sparade jobb är en återvändsgränd — **LÅG** — S

**Sida:** `/#/job-search` → fliken "Sparade". Bild: `bilder/jobbsok-14-sparade-jobb.png`

Flödet fungerar: "Spara" på ett sökträffkort lägger jobbet i "Sparade" (verifierat — herons räknare gick 1 → 2 sparade, och `/applications` gick från "4 aktiva" till "5 aktiva" i samma session). Men **det sparade kortet erbjuder bara "Visa annons"**, medan sökträffskortet erbjuder "Spara / Skriv brev / Ansök". Man kan alltså inte gå vidare från det man sparat utan att söka upp jobbet igen.

Sparningen ger dessutom **ingen bekräftelse** — ingen toast, ingen `role="status"`-uppdatering (de två aria-live-meddelanden som fångades var "Du är nu på Sök jobb" och "Visar 20 av 693 jobb").
**Åtgärd:** samma tre åtgärder på det sparade kortet som på sökträffskortet, och en bekräftelse vid sparning ("Sparat — du hittar det under Sparade").

---

### J21 — Testdata `[PERSONA-A]` / `[PERSONA-B]` syns i produktionsvyer — **LÅG (datafynd)** — S

**Syns bara med det här kontots data.** Tre poster i ansökningspipen heter "[PERSONA-A] P375265 tjänst", "[PERSONA-A] Lagerarbetare", "[PERSONA-A] Testföretag AB", och en CV-kompetens heter "[PERSONA-B] testkompetens" — den senare hamnade i brevtexten i J1. Det är rader i testkontot, inte kod. Tas upp här enbart för att den som verifierar J1 ska veta varför taggen dyker upp.

---

### J22 — Två avbrutna HEAD-anrop vid ankomst till Översikt på mobil — **LÅG** — S

`FAILED HEAD .../rest/v1/diary_entries?select=id&user_id=eq… :: net::ERR_ABORTED` och samma för `network_contacts` (390×844, `/#/oversikt`). Inga följdfel i UI:t, inga konsolfel. Ser ut som existenskontroller som avbryts av en efterföljande navigering.
**Åtgärd:** låg prioritet — men om det är `AbortController` som fungerar som avsett bör anropen inte loggas som fel.

---

### J23 — Mobilmenyn använder den gamla platta navigationen — två navigationsmodeller på samma skärm — **MEDEL** — M

**Sida:** valfri, 390×844, hamburgermenyn. Bild: `bilder/jobbsok-15-mobilmeny-390.png`

Bottennavet visar 5-hub-modellen (**Översikt · Söka jobb · Karriär · Resurser · Din vardag**). Hamburgermenyn bredvid visar den gamla `navGroups`-modellen med rubrikerna **ÖVERSIKT · REFLEKTION · UTÅTRIKTAT** (`client/src/components/layout/navigation.ts:47, 85-87, 105-107` — samma `reflection`/`outbound` som CLAUDE.md kallar bakåtkompatibilitetsaliaser och säger att man inte ska använda i ny kod).

Konsekvenser i jobbsökarspåret:
- **CV** och **Personligt brev** ligger under "REFLEKTION", medan **Sök jobb**, **Dina jobbansökningar**, **Spontanansökan** och **Lön & Förhandling** ligger under "UTÅTRIKTAT" — alla sex tillhör hubben "Söka jobb". En mobilanvändare som söker CV-verktyget under sitt jobbsökarspår hittar det på fel ställe.
- **Intervjuträning** ligger under "REFLEKTION" tillsammans med Kalender och Övningar.
- **LinkedIn-optimering och Internationell Guide saknas helt** (se J5).
- "Ditt AI-team" bär en **"Ny!"-badge** — samma familj som "Beta"-badges, som Manifestet förbjuder.

**Åtgärd:** låt mobilmenyn spegla `navHubs` i stället för `navGroups`, eller ta bort hamburgermenyn helt och låt hubbarna vara den enda vägen på mobil. Så länge båda finns kommer de att glida isär — det är precis det som hänt med de två saknade verktygen.

---

## 3. Vad som mättes grönt (rör inte)

- **Två-lägessystemet:** `/jobb` har full persika-hero `rgb(252,241,230)`; samtliga nio verktygssidor har `rgb(245,244,240)` + `border-left: 4px rgb(168,93,36)`. Ingen sida blandar lägena.
- **En hub-färg per sida:** pastellinventeringen i `main` gav enbart persika-toner på alla nio verktygssidor (t.ex. `/job-search`: persika-bg ×24, persika-solid ×21, noll främmande pasteller). Färgbrotten i J6/J7 kommer från Tailwind-klasser vid sidan av tokensystemet, inte från pastellsystemet.
- **Gradienter:** noll utom de två tillåtna hub-hero-glow:arna på `/oversikt` och `/jobb` (`radial-gradient(circle, <hub-accent>, transparent 70%)`, 320×320, dekorativa). Noll gradientknappar.
- **Overflow:** `scrollWidth − clientWidth = 0` på samtliga 22 sidladdningar (11 sidor × 2 viewporter).
- **Konsol/nät:** noll konsolfel och noll HTTP ≥ 400 vid vanlig navigering på alla elva sidor i båda viewporterna. Enda felen uppstod när jag själv provocerade AI-vägen.
- **AI:n när den fungerar:** både brevet och LinkedIn-rubrikerna i prod var sammanhängande, rollanpassad svenska utan hallucinationer (`bilder/jobbsok-13-brev-ai-prod-lyckad.png`).
- **Mobil bakåtknapp:** hit-testet flaggade `button.mobile-back-button` som 4/5 blockerad på alla verktygssidor — riktig `tap()` **fungerar** på alla. Falskt positivt från hörnpunkterna (knappen är 44 px i en 48 px-ruta). Rapporteras inte.
- **UX10** (cookiebanner vs bottennav) och **UX16** (CV-raden vs bottennavet) håller fortfarande — det är CoachWidget-lagret ovanför som är problemet, inte navet.

---

## 4. Förbättrings- och utvecklingsförslag

1. **Kedja ihop spåret.** Idag är verktygen öar. Ett sparat jobb borde bära en synlig nästa-åtgärd hela vägen: *sparat → skriv brev (jobbet förifyllt) → anpassa CV mot annonsen → öva intervjun för just den rollen → lägg i pipen*. Delarna finns redan; det som saknas är länkarna mellan dem. `/#/cover-letter` gör det rätt (väljer bland sparade jobb) — ingen annan gör det.
2. **En "vad gör jag härnäst"-rad i `/jobb`-hubben.** Hubben visar sju likvärdiga kort. En rad överst — *"Bagagevaktmästare har legat i Ansökt i 12 dagar. Vill du följa upp?"* — skulle göra hubben till en följeslagare i stället för en verktygslåda. Datat finns (uppföljningsbannern på `/applications` räknar redan ut det).
3. **Rollanpassa intervjuträningen från CV:t.** Rollfältet är tomt varje gång, trots att portalen vet vilka jobb man sparat och vad CV:t säger. Förifyll med senaste sparade jobbet.
4. **En ärlig felväg för AI.** J1, J10 och J11 är samma designbeslut tre gånger: hellre något falskt än inget alls. Bestäm motsatsen som princip — *fail visible* — och lägg en enda återförsöksmodul som alla AI-ytor delar. Skriv ut varför i koden, så nästa läsare inte harmoniserar tillbaka mallarna.
5. **Ge sparning och ändring en kvittens.** Att spara ett jobb, byta status på en ansökan eller fylla i CV-fältet ger idag ingen synlig bekräftelse. "Sparat, Claude ✓" är redan definierat i §2 — det används bara inte här.
6. **Låt lönekalkylatorn säga varför knappen är släckt.** "Beräkna lön" är `disabled` tills tre select-fält är valda, utan text som förklarar det. Samma på "Starta intervjun".

---

## 5. Vad jag inte hann granska

- **Att faktiskt skapa en ansökan.** Jag stannade före submit i "Ny ansökan"-modalen för att inte skriva till databasen. Valideringen och modalens beteende är verifierade; själva sparningen och den efterföljande pipeline-uppdateringen är inte det.
- **Spontanansökan på djupet.** Bara landningsvyn — inte företagssökningen, sparade företag eller statistikfliken.
- **CV-export till PDF** och mallväxling (nio mallar), samt ATS-analysen och "Anpassa"-fliken.
- **Dark mode.** Alla mätningar är gjorda i ljust läge; koden är full av `dark:`-klasser som ingen har tittat på här.
- **360×640** och 320 px. Bara 390×844 och 1440×900.
- **Tangentbord och skärmläsare** utöver `aria-label`-sondningen. Ingen tab-ordning, inga fokusfällor testade (utom det som syntes i J18).
- **`/international`s innehåll** — sidan är omfattande (visum, uppehållstillstånd) och innehållet är inte faktagranskat här, bara layouten.
- **Intervjusimulatorns återkoppling.** Jag startade en session men skrev inget svar, så AI:ns betygsättning och feedback är otestad.
- **Nätverkslasttest / långsam uppkoppling.** Alla mätningar på snabb uppkoppling.
