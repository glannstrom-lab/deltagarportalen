# Nulägesanalys — 2026-07-10

> Fan-out-granskning av alla aspekter: kodhälsa, säkerhet/compliance, UX/design/i18n/a11y, prestanda, produktyta, dokumentation. Sex parallella analyser + egna mätningar (build, testsvit, git-statistik). Ersätter `portal-review-2026-06.md` som underlag för roadmapen.

## 1. Sammanfattning

Portalen är i sitt bästa skick hittills: 762 tester gröna, 11 ESLint-fel (roadmapen trodde 1 019), designbaselinen hålls, inga döda routes, XSS-ytorna sanerade. Leveranstakten är hög — 27 commits sedan förra granskningen (10 juni) med konsulentportal-utbyggnad, grafikfas 7, CV-PDF-fixar och totalgenomgångar av Jobbsök, Ansökningar och Spontanansökan.

**Men tre saker skaver:**
1. **Compliance-spåret har inte rört sig** — OpenRouter-nyckeln är oroterad sedan 28 maj (CRIT), AI-juristen är obokad (~4 v försenad), och Art 50-märkningen täcker 2 av 13 AI-ytor med deadline **2 aug (23 dagar)**.
2. **Produkten ljuger på två ställen** — `/career/adaptation` anropar AI-funktioner som inte existerar och visar hårdkodad fallback som om det vore AI; CV-byggarens "Anpassa för jobb" simulerar AI helt.
3. **Dokumentationen släpar** — roadmapen innehåller faktafel (gren-status, ESLint-siffran) och missar tre veckors leveranser.

## 2. Leveranstakt sedan 2026-06-10

27 commits (895 sedan 1 april). Teman, inget av detta finns i ROADMAP §9:
- Konsulentportal: "Min dag", gruppmeddelanden, mall-tilldelning, AI-rapportutkast (10–11/6)
- Granskningssnabbfixar R1/R2/R3/R6/R9 + P1 steg 1 — **mergade till main** (22/6; roadmapen säger felaktigt "ej pushad gren")
- Grafik fas 7: custom hub- och verktygsikoner (29–30/6)
- CV-PDF per-sida-marginaler + granskning av alla 12 mallar (3/7)
- Jobbsök: UX/i18n/refactor-paket, MatchesTab-uppdelning (3/7)
- Ansökningar: totalgenomgång — i18n, döda knappar, a11y, drag-and-drop-pipeline (7–10/7)
- Spontanansökan: 20-punktsgranskning genomförd + browserverifierad mot prod (10/7)

## 3. Kodhälsa

| Mätvärde | 2026-07-10 | Kommentar |
|---|---|---|
| ESLint | **11 errors, 188 warnings** | Roadmapen sa 1 019 — skulden är i praktiken betald. Vanligast: exhaustive-deps (59), set-state-in-effect (53), no-console (34) |
| Tester | 87 testfiler, **762/767 gröna** (5 skippade) | 1 flaky observerad i en av två körningar |
| Services utan test | **53 av 70** | Inkl. cloudStorage (2 810 r), careerApi (1 383 r), staApi, applicationsApi |
| God objects | articleData **24 864 r**, cloudStorage 2 810, pdfExport 1 619, StaConsultant 4 671 | |
| TODO/FIXME | 3 | Mycket rent |
| Lazy-routes | 45 lazy(), alla har Route | 2026-04-27-lärdomen åtgärdad |

**Dödkod (störst först):**
- `components/widgets/` — **~6 000 rader inkl. tester**: hela widget-grid-systemet (registry, HubGrid, JobsokLayoutContext, ~24 *Widget) monteras aldrig; hubbarna använder HubPage-funktionskort. ~30 testfiler testar dödkod. Endast typexporterna (JobsokSummary m.fl.) och summary-hooks är levande.
- `CompactDashboard.tsx` + `MobileDashboard.tsx` (690 r, 0 importörer) — listas ändå som aktiva i CLAUDE.md
- `ai-team/OnboardingModal.tsx` (avkopplad, kvar i bundlen), `useServiceWorker.ts` + SW-avregistreringskod på 3 ställen
- `services/api.ts`-shim kvar med 14 importörer (E6)
- 34 filer i pages/components importerar `@/lib/supabase` direkt (E10)
- 4 PDF-bibliotek klientside (jspdf, @react-pdf, pdf-lib, html2canvas) + puppeteer serverside
- Ingen husky/lint-staged — ingen pre-commit-gate

## 4. Säkerhet & compliance

**Öppna risker, rankade:**
1. **CRIT-2605-01: läckt OpenRouter-nyckel oroterad** sedan 28 maj (5-min dashboardåtgärd)
2. **Art 50-märkning: 2 av ~13 AI-ytor** har AIGeneratedWatermark (AI-team-chatt, Personligt brev). Saknas: InterviewSimulator, LinkedInOptimizer, SkillsGap, CareerCoach, NetworkingGuide, SalaryInsights, SkillsDevelopment, CV-skrivassistent, AICareerChatbot, konsulentens ReportDraftDialog, STA AssessmentEditor. Privacy-texten "AI-genererat innehåll märks tydligt" (sv.json:5547) stämmer inte. **Deadline 2 aug.**
3. **DPIA + Art 30 formellt ogiltiga** — osignerade, `[företagsnamn — fyll i]` kvar; OpenRouter DPF/SCC/TIA overifierad (Art 9-data → USA). AI-jurist obokad, ~4 v efter egen plan.
4. **profile_shares RLS:** `USING (true)` + `GRANT SELECT TO anon` (migration 20260417120000:144-147) — anon kan enumerera alla delade profiler. Känd sedan april (R5).
5. **Retention-cron sannolikt inaktiv** — pg_cron ej bekräftat aktiverad → Art 5.1.e-gallring körs inte.
6. `learning-analyze-gap` anropar OpenRouter utan rate limit (enda edge-funktionen utan `_shared/rateLimit.ts`).
7. 7 LOW öppna sedan maj + 3 punkter som kräver dashboard-verifiering; deploy-status för 28-maj-fixarna odokumenterad (R10).

**Grönt:** inga secrets i arbetsträdet, `client/api/test.js` raderad, båda dangerouslySetInnerHTML sanerade via DOMPurify, alla ai-*-edge-funktioner har distribuerad rate limit.

## 5. UX / design / i18n / a11y

- **Gradient-baseline hålls:** 65 vs baseline 65 (från 443 i fas 0)
- **Dark mode (R4, beslut försenat):** default `'system'` exponerar oprövad mörk vy; 10 768 `dark:`-klasser utan styrande designprincip
- **i18n-läckor (F7):** ~100+ hårdkodade svenska strängar i `pages/hubs/` + `components/dashboard/` + STA/PitchTab. Leak-scannern letar bara oöversatta *nycklar* — rå svenska utanför t() syns aldrig i CI
- **EmptyState-kontraktet (§7):** 10 av 95 sidfiler använder komponenten; 15 har ad-hoc-tomtillstånd, koncentrerat till STA-modulen
- **a11y:** 50 aria-live i src men `Applications.tsx` har 0 trots sök/filter/drag-and-drop; useFocusTrap i 18 filer (bra); 0 img utan alt
- **Voice & Tone-rester:** "Aktivera bevakning"/"Aktivera e-postaviseringar" (sv.json), hårdkodat 0-språk i CareerGoalWidget
- **Onboarding (§12):** 3 aktiva (global, profil, STA) + 1 avkopplad i bundlen — konsolideringen delvis klar
- **Två-läges-systemet:** stickprov 5/5 verktygssidor korrekt via PageLayout + domain

## 6. Prestanda

- Entry-chunk **655 kB rå / 156 kB br** (P1 steg 1 levererad, −28 %); CSS 317 kB rå i en fil
- **callAI saknar timeout/AbortController** (P3) — hängda AI-anrop väntar för evigt
- **178 × `select('*')`** i services, inkl. listvyerna saved_jobs och spontaneous_companies (P2)
- **logo-jobin.png 1 052 kB**, logo-icon 424 kB — snabbaste LCP-vinsten; OptimizedImage används bara i 8 filer
- contentApi-chunk 1 019 kB rå (articleData m.m.) — näst största filen
- en.json lazy ✓, Sentry lazy ✓, 45 lazy routes ✓
- 12 hooks kvar på manuellt fetch-mönster utan React Query (useSavedJobs, useNotifications, useSta m.fl.)
- Web Vitals: endast Sentry tracing 0.1 sample — ingen baseline/budget

## 7. Produktyta

**Fejk-AI (allvarligast):**
- `pages/career/AdaptationTab.tsx` (live på `/career/adaptation`) anropar `adaptation-recommendations`/`adaptation-conversation` som **inte finns i ai.js** → 400, och fallbacken visar statisk text som om det vore AI
- `components/cv/JobAdaptPanel.tsx` ("Anpassa för jobb" i CV-byggaren): "Simulera API-anrop" — ingen riktig AI

**Övriga fynd:**
- 6 deployade edge-funktioner utan frontend-anropare (`learning-*` ×3, `ai-assistant`, `af-jobsearch`, `af-enrichments`) + `ovningshjalp` i ai.js — behåll som 26-002-groundwork eller ta bort
- `VITE_HUB_NAV_ENABLED` är `true` i alla miljöer → flaggan + gamla navGroups-navigationen är död vikt; e2e-skript sätter flaggan via localStorage vilket inte fungerar
- `/profile` tillhör ingen hubb (CLAUDE.md påstår Min vardag), `/help` finns i memberPaths men länkas inte
- Fokusläge finns på 34 sidor men saknas i hela CV-flödet (tyngsta verktyget) och STA
- Konsulent-bulk: taggning + PDF-export är fortfarande "kommer snart"-knappar (R2b)
- STA: fas 1–5 i drift; fas 6 delvis (arbetsdagbok, veckosumma på begäran finns; automatik saknas); **fas 7 (statusflöde Utkast→Inskickad→Bekräftad + AF-e-post + audit-trail) saknas helt**
- LIV fas 4 delvis klar (tid-på-dygnet-hälsning finns i HubOverview) — roadmapen säger "kvar"
- ai.js har **22 funktioner** (inte 18 som CLAUDE.md säger); edge = 24 ✓

## 8. Dokumentationsläget

- **ROADMAP.md:** faktafel (quick-wins-grenen är mergad, ESLint-siffran 100× fel), tre veckors leveranser saknas i §9
- **CLAUDE.md:** 116→120 migrations, ai.js 18→22 funktioner, döda dashboards i komponentkatalogen, e2e "8 spec + ad-hoc" är nu 87 .cjs-skript
- **security-audit.md** 6 veckor gammal med oklar deploy-status
- **e2e/README.md** täcker inte 87 av 95 filer; föreslår staging-domän som test-e-post
- Arkivkandidater: 12× `team-betyg*.md`, `jobsearch-fullstack-review.md`, `AI_ENGINEER_ANALYSIS.md`, `RLS_VERIFICATION.md` (farligt inaktuell — skriven före R5-fyndet), `.planning/STATE|ROADMAP|REQUIREMENTS` (frysta sedan april)
- Ospårat: `design-source/` 39 filer / 36 MB — behöver beslut (committa/ignorera/flytta)

## 9. Risker & gap (rankade)

1. **AI Act/GDPR-paketet står stilla med 23 dagar till deadline** — nyckel, jurist, märkning, DPIA/Art30, DPA/TIA
2. **Fejk-AI i två skarpa flöden** — förtroenderisk mot både deltagare och konsulenter
3. **profile_shares-enumeration + inaktiv retention** — konkreta GDPR-brott som ackumuleras
4. **Dokumentationen som styrverktyg har tappat synk** — beslut fattas på inaktuella siffror
5. **Testtäckningen skyddar fel saker** — 30 testfiler vaktar dött widget-system medan cloudStorage (2 810 r) saknar test
