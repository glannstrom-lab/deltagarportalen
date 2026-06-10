# Nulägesanalys & roadmapförslag — 2026-06-10

> **Metod:** Kodanalys (routes, TypeScript, tester, CI, beroenden), genomgång av all projektdokumentation (docs/, .planning/, audits), samt visuell granskning av produktionen på jobin.se via Playwright — 18 sidor fotade i desktop (1440px), mobil (390px) och mörkt läge, inloggad som testdeltagare (`claude-playwright-test@jobin.se`).
> **Föregående helhetsgranskning:** `archive/2026-06-dokkonsolidering/portal-review-2026-04.md` (2026-04-27).
> **Efterspel:** Roadmapförslaget i §7 antogs 2026-06-10 som gällande plan i `docs/ROADMAP.md`. Plandokumenten som nämns i §5 är konsoliderade och arkiverade i `archive/2026-06-dokkonsolidering/` — sökvägar i texten nedan avser läget vid granskningstillfället.

---

## 1. Sammanfattning

Portalen är i sitt bästa skick hittills. Sedan aprilgranskningen har hub-navigeringen shippats (v1.0), designsystemet v3.0 implementerats genom 9 faser, en hel STA-modul för arbetsprövning byggts, illustrationsprogrammet (LIV/GRAFIK fas 1–6) genomförts, och maj-auditens kritiska produktionsbuggar åtgärdats. Den visuella granskningen idag bekräftar: **0 konsolfel och 0 misslyckade nätverksanrop på samtliga 18 testade sidor** — i maj fanns ERR_ABORTED på notifications/diary/network på varje sida. TypeScript kompilerar med 0 fel.

De största riskerna är inte längre tekniska utan **juridiska och processuella**:

1. **AI Act-deadline 2 aug 2026** (8 veckor bort) — Annex III-klassificering saknas; kompetensanalys/jobbmatchning kan vara högrisk.
2. **DPIA + Art 30-register saknas** — obligatoriska givet sårbar målgrupp + AI.
3. **Läckt OpenRouter-nyckel i git-historiken** — kodfixen är gjord men nyckeln är **inte roterad** (kräver manuell åtgärd i OpenRouter-dashboarden).
4. **Roadmap-fragmentering** — 6+ parallella plandokument utan gemensam prioritering.
5. **CI testar fortfarande inte inloggade flöden** — blockerat på GitHub Secrets + testanvändare (D1, instruktioner i `archive/2026-06-dokkonsolidering/BLOCKED-FAS-D.md`).

---

## 2. Vad som hänt sedan april (leveranstakt)

| Period | Levererat |
|--------|-----------|
| 2026-04-28/29 | Hub-navigering v1.0: 5 hubbar, widget-system med code-splitting, layout-persistens (25/25 planer klara) |
| 2026-05-10 | DESIGN.md v3.0 + alla 9 designfaser samma dag; produktionsaudit 41 sidor (29 fel funna) |
| 2026-05-14/15 | Tech-debt-audit + roadmap (Fas A–F); night-loop: −14 800 rader dödkod, −2,3 MB initial JS (vendor-pdf-preload-fixen, `66b7426`), Consultant-chunk 227 kB → 2,5 kB |
| 2026-05-15 | Compliance-audit (betyg C+, tre juridiska gap identifierade) |
| 2026-05-24–28 | STA-modul: arbetsprövning, DOA-självskattning, AI-sammanfattning AT-blankett, progressiv upplåsning; säkerhetsfixar (1 HIGH + 4 MEDIUM åtgärdade) |
| 2026-06-03/04 | Grafikfas 1–6: hero- och tomtillstånds-illustrationer på alla hubbar + verktygssidor |
| 2026-06-06/07 | Konsulentvy med riktig data + GDPR-logg; mobiloptimering (7 buggfixar); full engelsk lokalisering av fokusläget |

Takten är hög och commitarna välstrukturerade. Noterbart: i princip allt är committat direkt på `main` — fungerar för soloutveckling men gör D1 (E2E i CI) viktigare som skyddsnät.

## 3. Kodhälsa

**Starkt.** TypeScript: **0 fel** (`tsc --noEmit`, hela klienten). Navigation och routes är konsistenta — alla 45 nav-paths har routes, ingen dödkod i lazy-imports (aprilfyndet åtgärdat). CI kör lint, crash-class-typecheck, gradient-regression-guard och tester med coverage. Endast 6 TODO/FIXME i 265 000 rader kod.

| Mått | Värde | Kommentar |
|------|-------|-----------|
| Kodvolym | ~265 000 rader, 860 .ts/.tsx-filer | 123 sidfiler, ~470 komponenter |
| TypeScript | 0 fel | Hela klienten, inte bara crash-class |
| Unit-/komponenttester | 87 testfiler | Täcker stores, hooks, services delvis |
| Playwright | 8 spec-filer + **81 ad-hoc .cjs-skript** | Skripten är ovärderliga arbetsverktyg men ospårade/okurerade — se §6 |
| API-yta | 6 Vercel-endpoints, 24 Supabase edge functions | Rate-limiting på plats. OBS: `cv-pdf.js` tillkommen; `google-calendar.js`/`linkedin-auth.js` borta ur rot-`api/` — CLAUDE.md är inaktuell här |
| Största filer | `articleData.ts` 24 880 rader; `exercises` ~5 000; `StaConsultant` ~4 600 | Kända god objects, flaggade i FLAGGED-DEFERRED |
| Repo-hygien | 39 ospårade filer (e2e-skript, `sta/`-källdokument, `docs/LIV-ROADMAP.md`) | + radslutsbrus (CRLF) i 386 filer i arbetsytan |

Kvarstående skuld enligt TECH-DEBT-ROADMAP som ännu inte bockats av: ESLint-rester (~1 000 no-unused-vars), 3 parallella PDF-bibliotek (−700 kB möjligt), `services/api.ts`-shim med 14 callers, EmptyState-migrering (~50 sidor), 68 gradient-överträdelser (var 250; guard förhindrar nya).

## 4. Visuell granskning (jobin.se, 2026-06-10)

### Styrkor

Designsystemet v3.0 efterlevs i verkligheten, inte bara i dokumentet. Hub-landningar har korrekt pastell-hero i rätt hub-färg med illustration och datum-disc; verktygssidor (t.ex. Hälsa) har korrekt neutral hero. En-färg-per-sida-regeln håller på alla granskade sidor. Tonen är genomgående rätt: "Vad vill du göra idag?", chips som "Skriv idag", "Logga om du vill", "Inga än" — inviter, inte etiketter. Tomtillstånd är mänskliga ("Du har inte börjat söka jobb än"-mönstret). Mörkt läge fungerar utan kontrasthaverier. Jobbsök levererar riktiga Platsbanken-träffar med matchning. CV-byggaren har 12 mallar + guidad 7-stegs-wizard — maj-auditens "saknar CTA" är löst. Mobilvyerna är rena, HubBottomNav fungerar.

### Fynd (med fil:rad där relevant)

| # | Fynd | Var | Allvar |
|---|------|-----|--------|
| V1 | **"Hej □"** — hero-hälsningen visar tofu-tecken när förnamn saknas och 👋-emojin inte kan renderas. Namnlös fallback bör vara ren text utan emoji ("Hej! Vad vill du göra idag?"). Emoji i hero är dessutom tveksam mot Manifestet. | `i18n/locales/sv.json:414` (`"Hej, {{name}}! 👋"`) | Medel |
| V2 | **"1 månader sen" / "1 dagar sen"** — pluralfel i relativ tid. Dessutom hårdkodad svenska = i18n-läcka (engelska användare ser svenska). | `pages/hubs/HubOverview.tsx:56–59`, `pages/hubs/KarriarHub.tsx:29` | Medel |
| V3 | **"Generera anpassade brev med AI-stöd"** — bryter Voice & Tone regel 2 ("Generera" → "Skapa") i deltagarvy, och är hårdkodad svenska. Hub-kortens beskrivningar bör gå via i18n. | `pages/hubs/JobsokHub.tsx:115` m.fl. kortbeskrivningar | Medel |
| V4 | **Cookie-banner + CV-onboarding-tour staplas** på mobil vid första besöket — två konkurrerande dialoger på en 390px-skärm, bannern skymmer tourens innehåll. Sekvensera: cookies först, tour efter. | `/cv` första besök, mobil | Hög (första intryck för ny deltagare) |
| V5 | **Resurser-hubben renderade tom** vid första målning (hero ~5% opacity, FUNKTIONER-sektionen osynlig) tills scroll triggade `whileInView`. Sannolikt animations-race — verifiera IntersectionObserver-fallback och `prefers-reduced-motion`. | `/resurser`, Framer Motion-intåg | Medel (a11y-risk om reproducerbar) |
| V6 | **Stale build-metadata** — `<meta name="build-timestamp" content="2026-04-09">` i prod trots juni-deploys. Vilseledande vid felsökning; generera vid build eller ta bort. | `client/index.html:27` | Låg |
| V7 | Hälsa-sidans hero "Verktyg för ditt välmående" är etikett, inte invit ("Hur mår du idag?" finns redan som sektion — heron kan mjukas). | `/wellness` | Låg |

Maj-auditens kritiska fynd (notifications-ERR_ABORTED, AI-team-dubbelrender, oöversatta kategorier) kunde **inte reproduceras** — bedöms åtgärdade.

## 5. Dokumentationsläget

Dokumentationen är ovanligt rik men har vuxit till **6+ parallella plandokument**: `docs/ROADMAP.md` (12 mån, 2026-04-27), `docs/TECH-DEBT-ROADMAP.md` (Fas A–F), `docs/DESIGN-ROADMAP.md` (klar), `docs/LIV-ROADMAP.md` (fas 3–5 kvar), `docs/sta-automation-roadmap.md`, `.planning/AF-API-INTEGRATION-ROADMAP.md`, plus `docs/TECH-DEBT-AUDIT`, `FLAGGED-DEFERRED`, `BLOCKED-FAS-D`, `DESIGN-DEBT`. Ingen central vy visar vad som gäller *nu*. CLAUDE.md:s dokumenttabell saknar de nyaste (LIV-ROADMAP är t.o.m. ospårad i git). STA-modulen — nu en av portalens största delar — saknas helt i CLAUDE.md:s funktionstabell och projektstruktur.

**Rekommendation:** konsolidera till EN levande `docs/ROADMAP.md` med Now/Next/Later + statuskolumn, arkivera avslutade (DESIGN-ROADMAP) till `archive/`, och uppdatera CLAUDE.md med STA, aktuell API-struktur och aktuella dokument.

## 6. Risker & gap (rankade)

1. **AI Act, 2 aug 2026** — Annex III p4 gör AI för "anställning/urval" till högrisk. Kompetensanalys, jobbmatchning och STA:s AI-sammanfattningar måste klassificeras nu; transparens-märkning (Art 50) krävs för alla AI-funktioner. Underlag finns i `docs/AI-ACT-CLASSIFICATION.md` men arbetet är inte slutfört.
2. **DPIA + Art 30-register** — obligatoriska (sårbar målgrupp + hälsodata + AI). Compliance-auditen gav C+ med dessa som huvudorsak.
3. **OpenRouter-nyckeln** — rotera i dashboarden (CRIT-2605-01). 5 minuter, fortfarande ogjort per security-audit.
4. **Inloggad E2E i CI saknas** — D1-blockern (GitHub Secrets `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` + dedikerad testanvändare). Med 81 ad-hoc-skript finns redan allt material för riktiga spec-filer; utan CI-skydd vilar regressionssäkerheten på manuella körningar.
5. **Repo-hygien** — 39 ospårade filer inkl. `sta/`-Word-dokument (innehåller de persondata? flytta ut ur repot i så fall), e2e-djungel, CRLF-brus som förorenar diffar.
6. **i18n-regression i hubbarna** — leak-rapporten visar 0, men hub-korten (V2/V3) är skrivna efter den. Lägg hub-filerna i leak-scannerns scope.
7. **Prestanda omätt efter fix** — LCP var 7–8 s; preload-fixen (−2,3 MB) bör ha gett stor effekt men ingen ny mätning finns. Utan baseline går det inte att styra vidare optimering.

## 7. Roadmapförslag H2 2026

Förslaget ersätter inte EU-spåret i `docs/ROADMAP.md` utan sekvenserar om H2 utifrån dagens läge. Princip: **juridiken har hård deadline, allt annat är förhandlingsbart.**

### Spår 1 — Compliance-sprint (v. 24–27, deadline-styrt)

DPIA färdigställs, Art 30-register upprättas, AI Act-klassificering per AI-funktion (18 Vercel + relevanta edge functions) med Art 50-transparensmärkning i UI ("Det här svaret är AI-genererat"). STA:s AI-delar ingår — de ligger närmast högrisk-definitionen. Klart före 2 aug med marginal. Punkterna i `docs/COMPLIANCE-USER-ACTIONS.md` betas av parallellt (nyckelrotation först — idag).

### Spår 2 — Skyddsnät (v. 24–26)

D1: testanvändare + GitHub Secrets → auth-E2E i CI (golden path deltagare + konsulent + STA-smoke). Kurera e2e/: promota de 10 bästa .cjs-skripten till spec-filer, arkivera resten. Fixa V1–V6 från §4 (uppskattning: 1–2 dagar totalt). Mät LCP/Web Vitals i prod och sätt budget i CI.

### Spår 3 — Skuldbetalning (v. 26–31, i bakgrunden)

Resterande TECH-DEBT Fas B–F: ESLint-nollning, PDF-bibliotek-konsolidering (−700 kB), `api.ts`-shim bort, EmptyState-svepet (50 sidor — kan göras hub för hub), gradienter 68 → 0. God objects (`cloudStorage`, `careerApi`, `pdfExportService`) bryts först när testtäckning finns (ordningsföljden i TECH-DEBT-ROADMAP håller). `articleData.ts` → Supabase när Spår 2 gett E2E-skydd.

### Spår 4 — Produkt (v. 28–39)

1. **LIV fas 3–5** (dashboard-animation, känslo-feedback, levande onboarding) — billigt, hög upplevd kvalitet.
2. **STA-automation** enligt `docs/sta-automation-roadmap.md` — konsulentvärde, differentierar mot konkurrenter.
3. **AF API-integration** (`.planning/AF-API-INTEGRATION-ROADMAP.md`) — gör jobbdata och rapportering robustare.
4. **EU-utlysningarna** (26-001 mikromeriter, 26-002 AI-kompetens): besluta i augusti vilken som söks; mikromeriter passar STA-modulen naturligt.

### Spår 5 — Mätning & drift (löpande)

Sentry-baseline efter compliance-sprinten (Session Replay-beslutet är redan taget), månadsvis Playwright-svep mot prod (skripten finns), kvartalsvis säkerhets- och beroendegenomgång.

### Beslut som bara du kan ta

| Beslut | Behövs till |
|--------|-------------|
| Rotera OpenRouter-nyckeln | Idag |
| Skapa testanvä