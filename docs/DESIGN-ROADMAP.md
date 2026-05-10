# Designimplementations-roadmap

> **Källa:** DESIGN.md v3.0 (2026-05-10) + DESIGN-GRANSKNING.md.
> **Mål:** Lyfta jobin.se från "fungerande portal med inkonsekvent ton" till "produkten som varit den lugna vännen genom en svår tid".
> **Tidsram:** 13 arbetsveckor (~3 månader) i 9 faser. Faserna är sekventiella där det krävs och parallellbara där det går.
> **Princip:** Varje fas ska kunna släppas live för sig själv. Inga half-shipped passes. Inget designsystem-rewrite-bigbang.

---

## Översikt

```
Fas 0  ──  Förberedelser & guardrails       [1 vecka]   ┐
Fas 1  ──  Identitet & ton                  [1 vecka]   │
Fas 2  ──  Designsystem-kärna               [2 veckor]  │  Grundsten
Fas 3  ──  Hub-landningar                   [1 vecka]   │
                                                         ┘
Fas 4  ──  Verktygssidor — färgrevision     [3 veckor]  ┐
Fas 5  ──  Innehållsdensitet                [2 veckor]  │  Tillämpning
Fas 6  ──  Onboarding-konsolidering         [1 vecka]   │
Fas 7  ──  Mobil-pass                       [2 veckor]  ┘

Fas 8  ──  Polish & PR-disciplin            [löpande]
```

**Totalt:** 13 arbetsveckor + löpande polish.
**Inga av faserna är "bigbang".** Varje fas kan stoppas, granskas och rullas tillbaka.

---

## Prioritetsprincip

Vid varje val mellan två faser, två uppgifter, två komponenter:
**Det som gör mest skillnad för en utsatt deltagares första 5 minuter går först.**

I praktiken betyder det:
1. Dölj/fixa allt som SKRÄCKER (oöversatta i18n-keys, dubbla tomtillstånd, gradient-knappar)
2. Sätt tonen (Manifest, personalisering, voice & tone)
3. Lös designsystem-grunden (en-färg-regel, EmptyState-komponent)
4. Tillämpa konsekvent över hubbar och verktygssidor
5. Optimera mobilen och innehållsdensiteten

---

# Fas 0 — Förberedelser & guardrails

**Tidsram:** 1 vecka
**Beroenden:** Ingen
**Parallellisering:** N/A

## Mål
Skapa de tekniska räcken som hindrar oss från att rulla tillbaka under nästa 8 faser. Utan dessa kommer minst en av reglerna i DESIGN.md att bli bruten innan vi är klara.

## Uppgifter

| # | Uppgift | Arbete |
|---|---------|--------|
| 0.1 | **ESLint-regel: förbud mot gradient-knappar** | Custom regel som flaggar `bg-gradient-to-` på elementer i `client/src/components/ui/Button` och `<button>` i pages. Lägg på `client/.eslintrc.cjs`. |
| 0.2 | **ESLint-regel: hårdkodade hub-tokens utanför HubOverview** | Flagga `--action-solid`, `--activity-bg` osv. om filen inte är `client/src/pages/hubs/HubOverview.tsx`. Använd `--c-*`-aliaserna istället. |
| 0.3 | **Skript: i18n-key-läckage-detektor** | Bash/Node-skript som kör Playwright på alla rutter, samlar all `innerText`, regex:ar `\w+\.(\w+(?:Desc|Title|Label|Text|Description))` och rapporterar potentiella läckande keys. Kör mot prod en gång per vecka. |
| 0.4 | **Skapa `<EmptyState>`-komponentens skelett** | `client/src/components/ui/EmptyState.tsx` med kontraktet från DESIGN.md §7. Bara skelett + propTypes — fullskalig design i Fas 2. |
| 0.5 | **Audit-baseline** | Kör `audit-2026-05-10/audit.cjs` på nytt och spara som `audit-2026-05-10/baseline.json`. Detta är "innan"-bilden vi mäter mot. |
| 0.6 | **PR-template uppdatering** | Lägg till "Designcheckpunkter" från DESIGN.md §15 i `.github/PULL_REQUEST_TEMPLATE.md`. |

## Definition of Done

- ESLint-regler 0.1 + 0.2 är aktiva i `npm run lint`. Befintliga överträdelser är listade som tekniska skulder (men inte fixade än — det är Fas 4).
- 0.3-skriptet kör utan fel och genererar en rapport.
- `<EmptyState>`-skelett finns och kan importeras.
- PR-template är synlig vid varje ny PR.

## Risker

- **Befintliga gradient-knappar bryter `npm run lint`.** Lös genom att tillfälligt whitelisthar de filerna i ESLint-config — men dokumentera dem som teknisk skuld i `docs/DESIGN-DEBT.md` (skapas i denna fas). Fas 4 städar.

---

# Fas 1 — Identitet & ton

**Tidsram:** 1 vecka
**Beroenden:** Fas 0 (PR-template)
**Parallellisering:** Med Fas 2 om vi har två developers

## Mål
Sätt manifestets ton i de delar som syns FÖRST. Personalisering. Logo. Strängläckor. Detta är det användaren märker direkt.

## Uppgifter

| # | Uppgift | Arbete |
|---|---------|--------|
| 1.1 | **i18n-läckage-sweep** | Kör 0.3-skriptet, fixa varenda läckande key. Trolig storlek: 5-15 strängar (bekräftade hittills: `myConsultant.noConsultantFullDesc`). |
| 1.2 | **Logo-konsolidering** | Sweep efter `logo-jobin.png/webp` och `logo-jobin-new.*` i `client/src`. Allt utanför Landing-footer (där vi använder white-version på mörk bg) ska byta till `/logo-icon.svg`. |
| 1.3 | **Personalisering: Översikten** | "Hej {firstName}" som primär hero-rubrik. Tidsanpassad ("God morgon" / "God kväll"). Fallback om förnamn saknas: "Hej 👋" — aldrig synlig token. |
| 1.4 | **Personalisering: 4 övriga huvar** | Samma princip på `/jobb`, `/karriar`, `/resurser`, `/min-vardag` men kopplat till hubbens egna mening: *"Sökandet med dig, Anna"*, *"Din karriär, Anna"*, etc. |
| 1.5 | **Voice & Tone-pass: knappar och rubriker** | Genomgång av alla texter i `client/src/i18n/locales/sv.json`. Korrigera enligt DESIGN.md §2-tabellen. Fokus på: knappar (`*.actions.*`), rubriker (`*.title`), empty-states (`*.empty.*`). |
| 1.6 | **Empty-state-copywriting-pass** | För alla nuvarande tomtillstånd: skriv om copytext enligt DESIGN.md §2-mallen. Bara strängar — komponentbytet sker i Fas 2. |

## Definition of Done

- Inga `key.subkey`-strängar visas i UI (verifieras med 0.3-skriptet).
- Login, Register, topbar och appens header använder samma logo (`/logo-icon.svg`).
- Översikten säger "Hej {firstName}" där användarens förnamn finns.
- Genomgång av sv.json där minst 30 strängar är reviderade enligt §2.
- En före/efter-screenshot av Översikten visas i PR.

## Risker

- **Voice & tone-passet blir för stort.** Hård gräns: max 50 strängar i denna fas. Resten görs sida-för-sida i Fas 4.

---

# Fas 2 — Designsystem-kärna

**Tidsram:** 2 veckor
**Beroenden:** Fas 0
**Parallellisering:** Kan köras parallellt med Fas 1

## Mål
Implementera de tre tekniska byggstenarna som alla efterföljande faser bygger på: full `<EmptyState>`, `<PageHero>`-läges-system, gradient-knapp-utrotning.

## Uppgifter

| # | Uppgift | Arbete |
|---|---------|--------|
| 2.1 | **Fullt `<EmptyState>`** | Komplett komponent med ikon, titel, beskrivning, action-prop, optional secondary-action. Storybook-eller-equivalent showcase. |
| 2.2 | **`<PageHero>`-komponent: två lägen** | Ny komponent som ersätter ad-hoc hero-implementationer. `mode="hub"` ger full pastell-hero. `mode="tool"` ger neutral grå med 4 px hub-kant. Auto-detektering från route via `getDomainForPath`. |
| 2.3 | **Migrera HubPage till `<PageHero mode="hub">`** | De 4 hub-landningssidorna (`/jobb`, `/karriar`, `/resurser`, `/min-vardag`) renderar via den nya komponenten. Översikt har eget hero (HubOverview). |
| 2.4 | **Migrera PageLayout till `<PageHero mode="tool">`** | Verktygssidornas header-rendering går via samma komponent. Inget visuellt brott — bara konsoliderat. |
| 2.5 | **Gradient-knapp-utrotning** | Sweep-fix av kända fall: Intresseguide ("Starta Intresseguiden"), Skills Gap ("Analysera gapet"), Profile-onboarding-modal-header. Ersätt med solid `--c-solid`. |
| 2.6 | **`<KpiCard>`-komponent: en-färg-regel** | Ny eller refaktorerad komponent som bara accepterar hub-färg från sammanhang (via `--c-bg` osv). Förbjud färg-prop. |
| 2.7 | **Konsolidera tab-aktiv-stil** | Sweep efter alla `<Tabs>`-användningar. Alla ska gå genom `<PageTabs>`-komponenten. Aktiv-stil enligt DESIGN.md §6. |

## Definition of Done

- `<EmptyState>` finns och har minst tre fält (ikon, titel, action). En showcase-sida visar alla varianter.
- `<PageHero>` används av minst HubPage + PageLayout.
- ESLint-regel 0.1 (gradient-förbud) går grön på hela kodbasen.
- ESLint-regel 0.2 (hårdkodade hub-tokens) går grön utanför HubOverview.
- Alla tabs på portalen ser likadana ut (manuell visuell verifiering).

## Risker

- **`<PageHero>`-introduktionen kan brytta hub-landningars visuella stil**. Hantera genom att rulla ut huv-för-huv och visuellt verifiera mot screenshots i `audit-2026-05-10/baseline.json`.

---

# Fas 3 — Hub-landningar

**Tidsram:** 1 vecka
**Beroenden:** Fas 1 (personalisering), Fas 2 (`<PageHero>`)
**Parallellisering:** Inte med Fas 2

## Mål
Få de 5 hub-landningssidorna att perfekt följa "läge A — full pastell-hero". Detta är portalens emotionella ankarpunkt.

## Uppgifter

| # | Uppgift | Arbete |
|---|---------|--------|
| 3.1 | **Översikt-hero pass** | Implementera "Hej Anna" i full mint-hero. Datum-disc rätten ("SÖN" + "10" → samma case). Subtil radial-gradient-glow tillåten enligt §3. |
| 3.2 | **Söka jobb-hub: ny copy + bottom-nav** | Subtitel revideras enligt §2 ("Hitta och söka jobb" → "Hitta jobb och håll koll på dina ansökningar"). Eyebrow-text "HUB · SÖKA JOBB" tas bort (DESIGN-GRANSKNING.md §2). |
| 3.3 | **Karriär, Resurser, Min vardag — samma pass som 3.2** | Eyebrow tas bort. Subtitlar revideras. Ikon-tile på feature-cards går till hub-färg. |
| 3.4 | **Hub-medlemskap i sidebar/hub: lös Nätverk-dubblering** | Nätverk listas idag i både Resurser och Min vardag. Bestäm hub (förslag: Resurser eftersom den handlar om externa kontakter). Uppdatera `navHubs[].memberPaths` så `/nätverk` förekommer EN gång. |
| 3.5 | **Visuell regression-test** | Kör Playwright med screenshot-jämförelse mot baseline. Justera där tidigare design tappades. |

## Definition of Done

- Alla 5 hub-landningar är personaliserade ("Hej Anna").
- Inga eyebrow-prefix ("HUB · X") i hub-headers.
- Subtitlarna följer §2.
- Nätverk listas exakt i en hub.
- Visuell regression-rapport bifogad PR.

## Risker

- **Personalisering kräver att förnamn finns på user-objektet.** Verifiera i Fas 1 — om förnamn ofta saknas, lägg in en "Saknar förnamn? Klicka här för att lägga till"-prompt på Översikten istället för en synlig token.

---

# Fas 4 — Verktygssidor — färgrevision

**Tidsram:** 3 veckor
**Beroenden:** Fas 2 (PageHero, KpiCard, EmptyState)
**Parallellisering:** Kan delas upp på 2-3 developers per hub

## Mål
De ~25 verktygssidorna under hubbarna ska följa "läge B — neutral grå hero med 4 px hub-kant" + "en sida = en hub-färg". Detta är portalens mest omfattande pass.

## Uppgifter — strukturerade per hub

### 4.A — Söka jobb-hub (8 sidor)
| Sida | Tasks |
|------|-------|
| `/job-search` | Hero pass, KPI-färgrevision, EmptyState-byte |
| `/applications` | Hero pass (du har redan fixat dubbla CTA + tomtillstånd) |
| `/spontanansökan` | Hero pass, eyebrow bort, KPI till persika |
| `/cv/*` (5 flikar) | Hero pass alla flikar, KPI på "Mina CV" till persika |
| `/cover-letter/*` | Hero pass, "Skriv brev"/"Mina brev"-tabs |
| `/interview-simulator` | Hero pass, gul tips-box till persika-pastell |
| `/salary` | Hero pass, AI-samtycke-banner reviderad |
| `/international` | Hero pass — sidan är redan välstrukturerad |
| `/linkedin-optimizer` | Hero pass, gradient-knappar bort |

### 4.B — Karriär-hub (5 sidor)
| Sida | Tasks |
|------|-------|
| `/career` | **Tung redesign — KPI-konfetti till en-färg-rosa**. Detta är Fas 5 om vi delar upp. |
| `/interest-guide/*` (5 flikar) | Hero pass, gradient-knapp bort, RIASEC-graf med rosa |
| `/skills-gap-analysis` | Gradient-knapp bort, hero pass |
| `/personal-brand/*` | Hero pass, audit-checklista i rosa-pastell |
| `/education` | Hero pass — sidan är redan välstrukturerad |

### 4.C — Resurser-hub (6 sidor)
| Sida | Tasks |
|------|-------|
| `/knowledge-base/*` (6 flikar) | Hero pass, **mörkblå banderoller bort** (sky-pastell istället) |
| `/resources/*` (4 tabs) | Hero pass, gradient-banner bort |
| `/print-resources` | (klart från B4 — kategorier översatta) |
| `/externa-resurser` | Hero pass |
| `/ai-team` | Hero pass, gradient-modal-bg bort |
| `/nätverk` | Hero pass, dubbla tomtillstånd → ett |

### 4.D — Min vardag-hub (6 sidor)
| Sida | Tasks |
|------|-------|
| `/wellness/*` (4 flikar) | Mestadels redan rätt — verifiera att "Spara reflektion" är solid |
| `/diary` | Hero pass, GDPR-consent till lavendel |
| `/calendar` | Hero pass — sidan är välstrukturerad |
| `/exercises` | **Tung redesign till "max 5-7 saker synliga"** — flytta till Fas 5 |
| `/my-consultant` | EmptyState-byte (i18n-läckan löst i Fas 1) |
| `/profile` | Welcome-modal: gradient-header → solid mint |

## Definition of Done per sida

För varje sida i tabellen ovan:
- [ ] Använder `<PageHero mode="tool">`
- [ ] Hub-färg är ENDA pastellen i innehållet
- [ ] Inga gradient-knappar/headers/cards
- [ ] EmptyState (om finns) går genom `<EmptyState>`
- [ ] Före/efter-screenshot bifogad PR
- [ ] DESIGN.md §15-checklist signerad

## Risker

- **Volymen.** 25 sidor är mycket. Prioritetsordning: A → B → C → D, för att Söka jobb är portalens mest använda flöde.
- **Career- och Exercises-sidan är tunga.** Markeras explicit som "flyttas till Fas 5" — dvs. inte bara färgrevision utan en hel densitets-pass.

---

# Fas 5 — Innehållsdensitet

**Tidsram:** 2 veckor
**Beroenden:** Fas 4 (resten av portalen följer designreglerna)
**Parallellisering:** Career, Exercises, Knowledge Base kan göras parallellt

## Mål
Reducera de mest överdrivna sidorna till "max 5-7 saker synliga utan val". Detta är där Manifestet möter verkligheten.

## Uppgifter

| # | Sida | Mål |
|---|------|-----|
| 5.1 | **`/career`** | 4-färgad KPI-grid → 3 sektioner: en huvudsiffra med kontext, top 5 yrken som chips, top 3 städer. Inga delta-procentpilar. |
| 5.2 | **`/exercises`** | Kuraterad rad överst ("För dig idag: 3 övningar"). Resten kategoriserat och kollapsbart. Behåll alla övningar — bara dölj dem bakom kategorival. |
| 5.3 | **`/knowledge-base` (alla flikar)** | Max 3 artikelkort per kategori synliga utan "Visa fler". Sky-pastell-banderoller (inte solid mörkblå). |
| 5.4 | **`/applications` pipeline** | Verifiera att fixet i B13 (en empty-state istället för två) gäller; eventuell finputs av pipeline-kolumnernas täthet. |
| 5.5 | **`/oversikt`-hub HubCards** | Aktivitetsraderna ("Inga händelser än — börja utforska") byter till EmptyState-stil. Möjligen kontextualiserade förslag istället för helt tom rad. |
| 5.6 | **`/oversikt/historik`** | Idag visas en rad på en stor blank yta. Lägg till "Du har bara en aktivitet ännu. Här är 3 saker att utforska:" + launch-cards. |

## Definition of Done

- Career visar inte fler än 7 saker utan användarval.
- Exercises kräver alltid ett kategorival för att se >5 övningar.
- Knowledge Base har alltid "Visa fler"-knappar i kategorier.
- Översikt-historik har kontextualiserade förslag när nästan tomt.

## Risker

- **Career-passet kan kännas som funktionalitetsförlust.** Förebyggning: visa "Visa mer detaljer" som expanderar till nuvarande detaljnivå. Inga features tas bort, bara dolda by default.

---

# Fas 6 — Onboarding-konsolidering

**Tidsram:** 1 vecka
**Beroenden:** Fas 2 (PageHero), Fas 4 (sidor är rena nog att tala för sig själva)
**Parallellisering:** Nej

## Mål
Ersätt 4+ separata onboardings (CV-tour, AI Team, Profile, Översikt-onboarding) med EN konsekvent komponent. Eller — om sidorna självförklarar — ta bort dem helt.

## Uppgifter

| # | Uppgift | Arbete |
|---|---------|--------|
| 6.1 | **Inventering** | Lista alla onboardings i kodbasen. Befintliga: `OnboardingFlow`, `OnboardingModal` (AI Team), CV-tour-overlay, Profile welcome-modal. |
| 6.2 | **Konsolidera till en `<OnboardingFlow>`** | Den befintliga är OK som start. Migrera de andra. Modal med backdrop, locked body-scroll, max 3 steg, "Hoppa över" alltid synlig. |
| 6.3 | **Ta bort sido-specifika onboardings** | CV-tour-overlay tas bort om steg-indikator + "Välj en mall för att börja"-rubrik räcker. AI Team-modal tas bort om "Välj din agent"-sektionsrubrik räcker. |
| 6.4 | **Inline-tips-mönster** | Etablera `<InlineTip>`-komponenten ("💡 Tips: …"). Använd i st.f. modaler där en kort förklaring räcker. |
| 6.5 | **Frequency-cap: max 1 onboarding per session** | localStorage med `onboarding-shown-{date}` så vi aldrig visar två onboardings i samma session. |

## Definition of Done

- Bara en onboarding-komponent finns i kodbasen.
- Inga modaler dyker upp på en återinloggning.
- Sidor som tidigare hade tour fungerar utan tour (verifierat med användartest om möjligt).

## Risker

- **Användare som faktiskt behövde tour blir vilse.** Förebyggning: behåll `<HelpButton>` (FAB) på alla sidor — användaren kan alltid trigga hjälp manuellt.

---

# Fas 7 — Mobil-pass

**Tidsram:** 2 veckor
**Beroenden:** Fas 4 (en konsekvent designsystem att translata)
**Parallellisering:** CV-galleri och sub-tabs kan göras parallellt

## Mål
Mobilen är inte desktop minskat. Strategiska val:

## Uppgifter

| # | Uppgift | Arbete |
|---|---------|--------|
| 7.1 | **Hub-intros på mobil** | Hub-landningssidor får en kort intro-mening överst på mobil ("Vart vill du ta vägen idag?"). Desktop oförändrad. |
| 7.2 | **CV-mall-galleri som horisontell snap-scroll** | 11 CV-mallar som idag staplas vertikalt (6356 px scroll!) blir horisontell swipe-galleri på mobil. Tinder-modell. |
| 7.3 | **Övningar-galleri samma pattern** | Snap-scroll-rader per kategori. |
| 7.4 | **Sub-tabs på verktygssidor mobil** | När användaren är på `/cv` ska CV-flikarna vara tillgängliga via en horisontell scroll-bar under header — inte gömda i meny. |
| 7.5 | **Bottenmarginal-audit** | Verifiera att alla sidor har `pb-20` eller `pb-safe + 64px`. |
| 7.6 | **Touch-target-audit** | Sweep efter `<button>` med < 44 px. Lägg till invisible padding där det behövs. |
| 7.7 | **MobileBackButton-konsekvens** | Verifiera att backknappen visas på alla undersidor utom hub-rotsidor. |

## Definition of Done

- CV-byggar på mobil är mindre än 1500 px hög på första laddning (idag 6356 px).
- Alla sub-tabs är synliga på mobil utan att öppna meny.
- Inga sidor har innehåll dolt bakom bottennav.
- WCAG 2.1 AA SC 2.5.5 (44 px touch-targets) gäller överallt.

## Risker

- **CV-snap-scroll kräver custom scroll-snap-behavior** som behöver testas på iOS Safari (där scroll-snap historiskt varit bristfälligt).

---

# Fas 8 — Polish & PR-disciplin

**Tidsram:** Löpande efter Fas 7
**Beroenden:** Alla tidigare faser
**Parallellisering:** N/A

## Mål
Behåll det vi nått. Designsystemet är levande — det rasar om vi inte underhåller.

## Aktiviteter

- **PR-disciplin:** Varje ny PR som rör UI ska bifoga §15-checklist + screenshot. Reviewer kan blocka PR enbart på checklist-grund.
- **Veckovis i18n-sweep:** 0.3-skriptet körs varje måndag, läckande keys flaggas i ett enskilt issue.
- **Månatlig design-audit:** Kör `audit.cjs` mot prod, jämför mot baseline. Avvikelser dokumenteras i `docs/DESIGN-DEBT.md`.
- **Kvartalsvis Voice & Tone-pass:** Granska minst 30 strängar mot §2-tabellen. Mikro-rättningar.
- **Halvårsvis user research:** Sätt 3 deltagare framför portalen. Mät emotionell respons, inte funktionalitet. Uppdatera Manifestet om vi lärt oss något.

## Definition of Done

- Aldrig "klart". Designsystem är process, inte tillstånd.

---

# Sammanfattning per fas

| Fas | Vecka | Fokus | Estimerat arbete |
|-----|-------|-------|------------------|
| 0 | 1 | Guardrails (lint, EmptyState-skelett, baseline) | 5 dagar dev |
| 1 | 2 | Identitet (manifest-ton, personalisering, logo, i18n-sweep) | 5 dagar dev + 2 dagar copy |
| 2 | 3-4 | Designsystem-kärna (PageHero, EmptyState, KpiCard, gradient-borttagning) | 10 dagar dev |
| 3 | 5 | Hub-landningar | 5 dagar dev |
| 4 | 6-8 | Verktygssidor (~25 st) | 15 dagar dev |
| 5 | 9-10 | Innehållsdensitet (Career, Exercises, KB) | 10 dagar dev |
| 6 | 11 | Onboarding-konsolidering | 5 dagar dev |
| 7 | 12-13 | Mobil-pass | 10 dagar dev |
| 8 | Löpande | Polish | 1 dag/vecka |

**Total dev-tid:** ~65 arbetsdagar för en developer. Med 2 developers parallellt: ~33 arbetsdagar = ~7 kalenderveckor (med viss buffert för code review).

**Optimistiskt scenario:** 3 månader om 2 developers jobbar dedikerat.
**Realistiskt scenario:** 5-6 månader om designarbetet körs vid sidan av annan utveckling.

---

# Vad vi INTE gör i denna roadmap

För att hålla scope:

- **Ny visuell identitet** — färgsystemet behåller hub-pasteller. Det är inte ett rebrand-projekt.
- **Ny hub-struktur** — 5 hubbar är beslutat och stabilt. Inga nya hubbar tillkommer.
- **Konsulent- och admin-vyer** — har separata designval enligt DESIGN.md §2. Eget projekt.
- **Hela landningssidan (`/`, public)** — den kan i sig ha en designgranskning men ligger utanför "portalen" som denna roadmap fokuserar på.
- **Dark mode-pass** — befintlig dark-mode behåller nuvarande implementation. Eget projekt.
- **Animations-system** — DESIGN.md §11 sätter ramen. Inga "playful animations" introduceras.

---

# Beroenden mot andra projekt

- **i18n-läckage-fix (Fas 1.1)** är blockerat av att alla i18n-keys är tillgängliga i `sv.json`. Verifiera att inga keys saknas.
- **Personalisering (Fas 1.3-1.4)** kräver att `firstName` ligger på user-objektet i `useAuthStore`. Om inte: behöver en migration först.
- **Sub-tabs på mobil (Fas 7.4)** kräver att `<PageTabs>`-komponenten har en mobil-variant. Lägg till i Fas 2 om det saknas.

---

# Hur vi mäter framgång

Ingen metric-driven design — men för transparens:

| Mått | Innan | Efter mål |
|------|-------|-----------|
| Antal hub-landningar med "Hej {namn}"-personalisering | 0 | 5 |
| Antal sidor med >1 hub-färg som pastell | ≥4 | 0 (utom Översikt) |
| Antal gradient-knappar i kodbasen | 5+ | 0 |
| Antal separata onboarding-komponenter | 4+ | 1 |
| Antal sidor med staplade tomtillstånd | ≥3 | 0 |
| Antal i18n-läckande keys i UI | ≥1 | 0 |
| CV-byggar mobil-höjd | 6356 px | < 1500 px |
| Total mobil-bottenmarginal-överlapp | förekommer | 0 |

Mätvärdena är gjorda för att vara **maskinellt verifierbara** så automatiska audits kan flagga regression.

---

# Slutord

Denna roadmap är en **gemensam riktning**, inte en vattenfallsplan. Varje fas kan justeras baserat på vad vi lär oss — men Manifestet (DESIGN.md §1) ändras bara när vi har förstått vår målgrupp på ett nytt sätt.

Roadmapen är klar när jobin.se öppnar och det första en utsatt deltagare känner är: *"Det här verkar vara skrivet av någon som vet hur jag mår."*

Det är slutmålet. Allt annat är teknik.

— *Roadmap utfärdad 2026-05-10. Uppdateras efter varje fas-avslut.*
