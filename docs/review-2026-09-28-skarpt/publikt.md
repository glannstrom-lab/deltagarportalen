# Skarpt funktionstest 2026-09-28 — område: publikt

Testat mot **produktion** (`https://www.jobin.se`). Inga inloggade konton krävdes för de
allra flesta punkterna — den publika ytan (startsida, B2B-sidor, guider, juridiska sidor,
login/register-validering, API-robusthet) behöver inget konto. Inget testkonto skapades.

**ID-prefix:** SP tilldelades det här området, men `docs/ROADMAP.md` använder redan `SP1–SP6`
som prefix för "Städpasset 2026-09-24 — väntar på Mikael". Jag har **inte** återanvänt SP-numren
för nya fynd, utan skrivit ut dem med egna beskrivande namn (`PUB-1` osv.) nedan. Huvudagenten
bör välja ett annat prefix om detta ska in i ROADMAP, för att undvika kollision med de
befintliga SP-punkterna.

## Konton, mutationer, städning

- **Inga konton skapades.** Området kräver inte inloggning för det som testades.
- **Ingen data muterades.** Alla anrop var GET/OPTIONS eller POST utan giltig auth (för att
  pröva robusthet — se nedan), plus cookie-samtycke i tre separata, engångsanvända
  webbläsarkontexter (localStorage, ingen serverdata).
- **Inget att städa.** Ett riktigt inloggningsförsök med fel lösenord gjordes mot
  `skarpt-publikt-test-2026-09-28@jobin.test` (ett konto som inte finns) — det gav förväntat
  `400` från Supabase och skapade ingen data.
- **AI-anrop: 0 av 12.** Området behöver ingen AI. Edge-funktionerna `ai-*` testades bara för
  att bekräfta att de nekar **innan** de når modellen (verifierat via svarstid ~300 ms och att
  koden faktiskt kastar vid `auth.getUser()`, före några externa anrop).
- Skärmdumpar/textdumpar: `docs/review-2026-09-28-rollspel/skarpt-publikt/`. Skript:
  `e2e/skarpt-2026-09-28-publikt-01.cjs`, `-cookies.cjs`, `-perf.cjs`, `-dark.cjs`.

## Testmatris

| Funktion | Resultat |
|---|---|
| Startsida — laddar, innehåll, hero, sektioner | ✅ |
| Startsida — Core Web Vitals (mobil, Fast 3G) | ⚠️ LCP ~3,9 s — känt (K13), se PUB-3 |
| B2B: /for-rusta-och-matcha/ | ✅ |
| B2B: /for-arbetsmarknadsenheter/ | ✅ |
| B2B: /for-arbetsgivare/ | ✅ |
| /for-dig-som/ (situationsnav) | ✅ |
| /om-oss/ | ✅ |
| Priser (`#priser`-sektion) | ✅ |
| Kontakt | ⏭ Ej en egen sida — bara `mailto:support@jobin.se` i footern; inget att funktionstesta |
| /privacy, /terms, /ai-policy, /tillganglighet | ✅ alla fyra laddar, rimligt innehåll |
| Cookie-banner: "Acceptera alla" sparas + döljs + överlever reload | ✅ |
| Cookie-banner: "Endast nödvändiga" sparas + döljs + överlever reload | ✅ |
| Cookie-banner: "Anpassa" → "Spara inställningar" sparas + döljs + överlever reload | ✅ |
| 404 / okänd sökväg (hash-catch-all) | ✅ redirectar till `/` (avsett, inget krasch) |
| Soft-404 på påhittad `/guider/<slug>/` | ⏭ Redan känt och avsiktligt (ROADMAP, "Prövat och avfärdat": 200 + canonical mot roten) — bekräftat oförändrat, ingen ny post |
| /guider/ — index laddar | ✅ 293 guide-länkar hittade |
| 10 slumpade guider — laddar, rätt H1, interna länkar, CTA | ✅ alla tio: rätt H1, 5–51 interna länkar, giltig CTA (utom lättläst-index, se not) |
| CTA på guide → registrering med `returnTo` | ✅ `…/#/register?returnTo=%2Fjob-search` |
| sitemap.xml — alla URL:er | ✅ 341/341 svarade 200 |
| robots.txt | ✅ text/plain, rätt Sitemap-rad |
| Meta/OG-taggar på 5 sidor | ✅ title/description/og:*/canonical konsekventa; alla 4 og-bilder 200 |
| Login — fel lösenord ger begripligt fel | ✅ "Fel e-post eller lösenord" (avslöjar inte om kontot finns) |
| Login — "Glömt lösenord" | ❌ **Finns inte alls** — se PUB-1 (Kritisk) |
| Login — Google-knapp finns | ✅ |
| Login — fokus vid fel | ⚠️ Fokus flyttas inte till felmeddelandet (känt: SV4, rollspel 2026-09-28) |
| Login — skiplänk/landmärken | ⚠️ 0 skip-link, 0 `<main>`, 0 `<nav>` (känt: SV3/SV19, rollspel 2026-09-28) |
| Register — validering utan att skicka | ✅ "Ogiltig e-postadress", "Lösenordet måste vara minst 12 tecken" |
| `POST /api/ai` utan token | ✅ 401 `Unauthorized` |
| `POST /api/cv-pdf` utan token | ✅ 401 `Unauthorized` |
| `POST /api/upload-image` utan token | ✅ 401 |
| `POST /api/job-alerts` utan token (alla tre actions) | ✅ 401 |
| Fel CORS-ursprung mot alla fyra `/api/*` | ✅ reflekterar inte angriparens origin på något av dem | 
| upload-image.js CORS-fallback vs de andra tre | ⚠️ Inkonsekvent + otestad — se PUB-2 (Låg) |
| Trasig JSON mot `/api/ai`, `/api/cv-pdf`, `/api/upload-image` | ✅ 401 (auth kollas före JSON-parsning — aldrig 500) |
| Edge-funktioner (18 st) utan JWT | ✅ alla 401 utom `health` (200, öppen med flit) |
| `health` | ✅ 200 `{"status":"healthy",...}` |
| Fem `ai-*`-funktioner med bara anon-nyckeln (ingen riktig användare) | ✅ alla nekar (400 vid inputvalidering före auth, eller 401 "Invalid token") — bekräftat att inget AI-anrop görs innan auth kontrollerats (svarstid ~300 ms) |
| `af-jobed`, `af-enrichments` — döda edge-funktioner fortfarande live i prod | ⏭ Redan känt (ROADMAP SP6, ej kört) — bekräftat oförändrat |
| `send-inactivity-warning` fail-closed utan `CRON_SECRET` | ⏭ Redan känt (ROADMAP SP2, ej kört) — bekräftat oförändrat |
| Mörkt läge: startsidan | ✅ inga uppenbara kontrastfel vid stickprov |
| Mörkt läge: en guide-sida | ✅ inga uppenbara kontrastfel vid stickprov |

Not till "10 slumpade guider": `/guider/lattlast/` är en samlingssida (51 interna länkar) utan
egen CTA-knapp i mönstret `Skapa konto|Kom igång|Registrera` — det är korrekt, sidan är en
länksamling, inte en artikel.

## Buggar

### PUB-1 — Kritisk: Ingen "glömt lösenord"-funktion existerar
**Repro:** Gå till `https://www.jobin.se/#/login`. Leta efter en länk/knapp för att återställa
lösenord.
**Förväntat:** En väg att begära återställningslänk via e-post (Supabase har inbyggt stöd,
`resetPasswordForEmail`).
**Faktiskt:** Ingen sådan länk finns. Hela `Login.tsx` har bara e-post, lösenord, "Visa
lösenord", submit, en Google-knapp och en länk till registrering — inget om glömt lösenord.
Sökt i hela `client/src` efter `glömt|forgot|resetPasswordForEmail|ForgotPassword` — **noll
träffar** någonstans i kodbasen. Ingen i18n-nyckel för det heller.
**Belägg:** `docs/review-2026-09-28-rollspel/skarpt-publikt/60-login-start.png`,
`resultat.json`: `"harGlomtLosenordLank": false`. `grep -rln "glömt\|forgot\|resetPasswordForEmail" client/src` → tom träfflista.
**Trolig kod:** `client/src/pages/Login.tsx` (hela filen — funktionen saknas helt, inte bara
länken). Behöver en ny route/vy plus `supabase.auth.resetPasswordForEmail(email, { redirectTo: … })`
och en sida som tar emot återställningslänken (`type=recovery` i Supabase-flödet) och sätter
nytt lösenord.
**Varför det är kritiskt:** Portalens målgrupp (CLAUDE.md: långtidsarbetslösa, ofta med
begränsad digital vana) har i dagsläget **ingen självbetjäningsväg** att komma in i sitt konto
igen om lösenordet glöms — bara Google-inloggning (om kontot skapades så) eller mejl till
`support@jobin.se`.

### PUB-2 — Låg: `upload-image.js` följer inte CORS-konventionen och testas inte av BS1-grinden
**Repro:**
```
curl -X OPTIONS https://www.jobin.se/api/upload-image -H "Origin: https://evil-example.com" -H "Access-Control-Request-Method: POST" -D -
curl -X OPTIONS https://www.jobin.se/api/ai         -H "Origin: https://evil-example.com" -H "Access-Control-Request-Method: POST" -D -
```
**Förväntat:** Alla fyra `/api/*`-filer faller tillbaka på samma kanoniska ursprung för ett
okänt Origin, enligt kommentaren i `ai.js`: "www.jobin.se STÅR FÖRST … (jobin.se svarar 307
till www)".
**Faktiskt:** `ai.js`, `cv-pdf.js`, `job-alerts.js` svarar `Access-Control-Allow-Origin:
https://www.jobin.se` för ett okänt origin. `upload-image.js` svarar
`https://jobin.se` (utan www) — omvänd ordning i dess `ALLOWED_ORIGINS`-array.
**Inte exploaterbart** (apex-domänen `jobin.se` gör en 307-redirect till `www.jobin.se` innan
någon sida hinner köra JS där, så ingen sida körs faktiskt från det ursprunget) — men
`client/src/test/cors-avregistrerad-doman.test.ts` (BS1-grinden mot den avregistrerade
`deltagarportalen.se`) har `const FILER = ['ai.js', 'cv-pdf.js', 'job-alerts.js']` — **`upload-image.js` är inte med**. Filen har visserligen ingen referens till den döda domänen
`deltagarportalen.se` kvar, men den delar inte den gemensamma testade konventionen och skulle
inte fångas om den fick det.
**Belägg:** curl-utdata ovan (körd 2026-09-28); `client/api/upload-image.js:36-40`
(`ALLOWED_ORIGINS = ['https://jobin.se', 'https://www.jobin.se', …]`) vs.
`client/api/ai.js:620-628`; `client/src/test/cors-avregistrerad-doman.test.ts:24`.
**Trolig kod:** `client/api/upload-image.js:36-40` (byt ordning så `https://www.jobin.se` står
först) + lägg till `'upload-image.js'` i `FILER` i `cors-avregistrerad-doman.test.ts`.

### PUB-3 — Medel: /login delar startsidans CWV-problem (känt för `/`, inte tidigare mätt för `/login`)
**Repro:** Playwright + CDP, mobilviewport (390×844), `Emulation.setCPUThrottlingRate rate:4`,
nätverk "Fast 3G" (1,6 Mbps ner / 750 Kbps upp / 150 ms latens), gå till sidan, mät
`largest-contentful-paint` via `PerformanceObserver`.
**Förväntat:** ROADMAP K13 dokumenterar redan att **startsidan** är "enda sidan som failar
CWV" (LCP uppmätt 4 150–4 368 ms i tidigare granskningar, väntar på Mikaels beslut om
prerendering).
**Faktiskt:** Samma mätmetod ger `/` LCP ≈ 3 944 ms (samma störningsklass som tidigare — K13
kvarstår oförändrat) **och `/login` LCP ≈ 3 620 ms** — nästan lika dåligt, av samma orsak (ingen
prerendering av SPA-skalet). En guide-sida (prerenderad statisk HTML) är däremot mycket snabbare:
LCP ≈ 396 ms.
**Belägg:** `docs/review-2026-09-28-rollspel/skarpt-publikt/perf-resultat.json`,
skärmdumpar `perf-start.png`, `perf-guide.png`, `perf-login.png`.
**Trolig kod:** Samma rotorsak som K13 (ingen SSR/prerendering av App-skalet för
icke-prerenderade routes) — `/login` är en av de sidor som drabbas av samma beslut. Ingen ny
kod pekas ut; det här utökar bara K13:s omfattning med ett mätvärde för `/login`.

## Redan kända fynd — bekräftade oförändrade (ingen ny post)

- **SV3/SV19** (`/login` saknar skiplänk och landmärken) och **SV4** (fokus flyttas inte till
  inloggningsfelet) — rollspel 2026-09-28, "Viktiga", ej åtgärdade. Bekräftat: `main`-element:
  0, `nav`-element: 0, skip-link: 0 på `/login`; fokus efter fel lösenord låg kvar på `<body>`.
- **Soft-404 under `/guider/`** — ROADMAP "Prövat och avfärdat": medvetet val (200 + canonical
  mot roten), väntar på signal från Search Console. Bekräftat oförändrat.
- **`af-jobed`/`af-enrichments`** — noll klientanropare, ändå live i prod och nåbara (utan JWT
  ger de förväntad 401/401; med bara anon-nyckeln 200/500). Matchar exakt ROADMAP **SP6**
  ("Arkivera af-jobsearch, af-jobed, af-enrichments … flytta ur supabase/functions/"), inte kört
  ännu. `af-jobed` returnerar dessutom alltid HTTP 200 även vid uppströms-fel (fel i body,
  `{"error":"JobEd API error","status":405}"`) — ofarligt eftersom ingen konsumerar den, men
  bekräftar att SP6 bör köras (färre onödigt nåbara funktioner, mindre deploy-yta).
- **`send-inactivity-warning`** svarar `503 "Cron authentication not configured"` — fail-closed
  som avsett, matchar ROADMAP **SP2** (inget schemalägger anropet; första berörda användaren
  ~slutet 2027).

## Förbättringar (kort lista)

1. **Bygg "glömt lösenord"** (PUB-1) — det enskilt viktigaste fyndet i det här passet. Supabase
   har färdig serverfunktion; det som saknas är UI + en mottagningssida för återställningslänken.
2. **Städa `upload-image.js`:s CORS-lista** (PUB-2) och lägg filen i BS1-grindens `FILER`-array
   så framtida CORS-regressioner fångas på alla fyra endpoints, inte tre.
3. **Kör SP6** (arkivera `af-jobed`/`af-enrichments` ur `supabase/functions/`) — bekräftat
   fortfarande live och callerlösa; minskar deploy-yta och en (ofarlig men förvirrande)
   status/body-mismatch försvinner på köpet.
