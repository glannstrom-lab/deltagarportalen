# Roadmap — Jobin (Deltagarportalen)

> **Detta är projektets enda gällande plan.** Version 2026-07-10, utifrån `docs/portal-review-2026-07.md` (ersätter versionen 2026-06-10/22).
> **Prioriteringsstatus: förslag.** Punkterna nedan är grupperade i spår A–G och rankade inom varje spår, men horisonten (vad som görs först) väntar på Mikaels val — se §7. Undantag: spår A är deadline-styrt (AI Act 2 aug 2026) och ligger fast som "Nu".
> ID:n i parentes (J1, R5, P2 …) behålls från tidigare versioner för spårbarhet.

**Så underhålls dokumentet:** Ett plandokument. Avklarat flyttas till §9. Nya idéer förs in under rätt spår — aldrig i nya plandokument. Detaljspecar (STA, AF-API, EU) är bilagor enligt §8.

---

## Rättelser mot förra versionen (2026-06-22)

- Grenen `fix/review-quick-wins-2026-06-22` är **mergad till main** (inte "committad, ej pushad") — R1/R2/R3/R6/R9 + P1 steg 1 är i produktion. Kvar av det paketet: R6-deploysteget och R10-verifieringen (nu A9).
- ESLint-skulden är **11 errors** (inte 1 019) — gamla A1 är i praktiken klar och utgår.
- LIV fas 4 är delvis levererad (tid-på-dygnet-hälsning finns i HubOverview).
- Leveranser 22/6–10/7 tillagda i §9.

---

## Spår A — Juridik & säkerhet (deadline 2 aug; ligger fast som "Nu")

| # | Uppgift | Detaljer | Ansvar |
|---|---------|----------|--------|
| A1 (J1) | Rotera läckt OpenRouter-nyckel | CRIT-2605-01 sedan 28 maj; 5 min i dashboarden | **Mikael, idag** |
| A2 (J4) | Boka AI-jurist för Annex III-gränsfall | Längst ledtid; ~4 v efter egen plan. Gränsfall: cv-analysis, kompetensgap, RIASEC | **Mikael, denna vecka** |
| A3 (J5) | Art 50-märkning på alla AI-ytor | ✅ **Klar 2026-07-10** — ~12 ytor märkta (AIResultCard-panelerna ×5, branschradar, CV-assistent, intervjufeedback, LinkedIn, kompetensgap, rapportutkast, STA). Fejk-AI-ytorna (B1/B2) märks när de görs ärliga | Claude |
| A4 (J2/J3) | Färdigställ + signera DPIA & Art 30 | Org-uppgifter/signatur = Mikael; textkomplettering = Claude | Båda |
| A5 (R8) | OpenRouter DPF/SCC/TIA | Art 9-data → USA utan verifierat underlag. Claude tar fram underlag, Mikael verifierar/signerar DPA | Båda |
| A6 (R7) | Aktivera pg_cron + kör retention-migrationen | Utan den sker ingen Art 5.1.e-gallring | **Mikael** (dashboard) + Claude (verifiering) |
| A7 (R5) | Scopa `profile_shares`-RLS | `USING(true)` + `GRANT anon` = enumeration av delade profiler. SECURITY DEFINER-RPC + omskriven `getSharedProfile` + test | Claude |
| A8 | Rate limit på `learning-analyze-gap` | ✅ **Klar 2026-07-10** — 5/min via `_shared/rateLimit.ts`, deployad | Claude |
| A9 (R6/R10) | Deploy-verifiering + uppdatera security-audit.md | ✅ **Klar 2026-07-10** — alla 24 edge-funktioner omdeployade med main-kod, Vercel-deploy verifierad, auditen nydaterad. Kvar för Mikael: dashboard-verifieringarna (OAuth-allowlist, pg_policies, FK-cascades) | Claude + Mikael (dashboardkoll) |

## Spår B — Ärlighet i produkten (nya fynd 2026-07-10)

| # | Uppgift | Detaljer |
|---|---------|----------|
| B1 | Fejk-AI på `/career/adaptation` | ✅ **Klar 2026-07-10** — `adaptation-recommendations` + `adaptation-conversation` byggda i ai.js, fliken använder callAI (auth), ärliga fel i stället för maskerad fallback, Art 50-märkt |
| B2 | Simulerad AI i CV-byggarens "Anpassa för jobb" | ✅ **Klar 2026-07-10** — ny `cv-jobbmatchning` (JSON) i ai.js ersätter den simulerade nyckelordslistan; ärlig felhantering + Art 50-märkning |
| B3 (R2b) | Konsulent-bulk: tagg-backend + PDF-export | ✅ **Klar 2026-07-10** — `consultant_participants.tags text[]` + vy + service + taggchips i deltagarlistan; PDF-export via jspdf-autotable. **Bonusfynd:** servicen skrev till obefintliga tabellen `participant_consultants` → status/prioritet/kontakt-uppdateringar har misslyckats tyst i prod; rättat till `consultant_participants` |
| B4 | "Kommer snart"-svep | ✅ **Klar 2026-07-10** — LinkedIn-import-teaser (Profil) och videokort (CV-tips) borttagna, badge-delning fick riktig Web Share/urklipp, superadmins tomma Inställningar-flik borttagen, "Kommer snart" → "Inga artiklar än" i Kunskapsbanken |

## Spår C — Städning & dödkod

| # | Uppgift | Detaljer |
|---|---------|----------|
| C1 | Arkivera widget-systemet | ✅ **Klar 2026-07-10** — hela `components/widgets/` + `useWidgetLayout`/`useWidgetSize` (+tester) → `archive/2026-07-widget-system/`; levande typer flyttade till `hooks/hubSummaryTypes.ts`. Testsviten −184 tester som vaktade dödkod |
| C2 | Radera småskrot | ✅ **Klar 2026-07-10** — CompactDashboard, MobileDashboard, ai-team/OnboardingModal, useServiceWorker raderade; SW-avregistrering 4→1 ställe (index.html); UpdateNotification förenklad till offline-indikator; `ovningshjalp` borta ur ai.js |
| C3 | Ta bort `VITE_HUB_NAV_ENABLED` | ✅ **Klar 2026-07-10** — flaggan + legacy-grenar borta ur App/Sidebar/Layout/HubBottomNav, nav-flag-flip-testet raderat, 14 e2e-skript rensade. **Korrigering:** navGroups är INTE död — mobilens MobileMainMenu renderar den; behållen och dokumenterad. Rest: pages/Dashboard.tsx blev orutad (E12-kandidat); ta bort flaggan ur Vercel-dashboarden (kosmetiskt, Mikael) |
| C4 | Beslut: 6 callerlösa edge-funktioner | ⬜ **Öppen — kopplad till G6-beslutet (aug).** `learning-*` ×3, `ai-assistant`, `af-jobsearch`, `af-enrichments` behålls tills EU-valet; alla har auth och `learning-analyze-gap` fick rate limit (A8) |
| C5 (E6) | Radera `services/api.ts`-shim | ✅ **Klar 2026-07-10** — 14 importörer omskrivna till källmoduler (supabaseApi/afTrendsApi/afTaxonomyApi/afJobEdApi), shimmen raderad |
| C6 (S3) | Kurera `e2e/` + skriv om README | ✅ **Klar 2026-07-10** — 82 ad-hoc-skript → `e2e/archive/`, 7 kanoniska kvar, README omskriven. Promota-till-spec väntar på D1 (CI-secrets) |
| C7 (S6) | `design-source/` 36 MB ospårat | ✅ Gitignorerad 2026-07-10 (rå grafik, inga persondata; optimerade versioner i client/public). Långsiktig hemvist fortfarande **Mikaels beslut** |
| C8 | Dokumentarkivering | ✅ **Klar 2026-07-10** — 12× team-betyg, jobsearch-review, AI_ENGINEER_ANALYSIS, RLS_VERIFICATION, onboarding-patterns + .planning/STATE\|ROADMAP\|REQUIREMENTS → `archive/2026-07-dokarkiv/` (README förklarar) |

## Spår D — Skyddsnät & kvalitet

| # | Uppgift | Detaljer |
|---|---------|----------|
| D1 (S1) | Authenticated E2E i CI | ✅ **Klar 2026-07-10 (kodsidan)** — `e2e-authenticated`-jobb i ci.yml; specarna själv-skippar utan credentials så jobbet aktiveras automatiskt när **Mikael lägger in secrets** TEST_USER_EMAIL/TEST_USER_PASSWORD (+ valfritt TEST_CONSULTANT_*) i GitHub. Fixade även AuthHelper.login som väntade på fel URL efter C3 |
| D2 (S2) | Golden path-spec | ✅ **Klar 2026-07-10** — `e2e/golden-path.spec.ts`: deltagarens kärnflöde (7 sidor i en session) + hubbnav + konsulent-smoke. Provkörd 3/3 grönt mot prod |
| D3 (D2r) | Tester för kärnservices | ✅ **Klar 2026-07-10** — 174 nya tester: applicationsApi (23), careerApi (37), staApi (62), cloudStorage (52). Låser beteendet inför E3–E5-refaktorerna. ~14 källkodsobservationer rapporterade (svalda fel, race i recordPractice, asymmetrisk casing i calendarApi m.m.) — se commit-historik |
| D4 (D6) | Husky + lint-staged | ✅ **Klar 2026-07-10** — pre-commit kör eslint --quiet på stage:ade filer + lint:design |
| D5 | ESLint 11→0 + jaga flaky test | ✅ **Klar 2026-07-10** — 0 errors (villkorlig useMemo i AssessmentEditor var ett äkta rules-of-hooks-brott); flaky = nav-smoke-timeout under maskinlast, höjd 8→20 s |
| D6 (S5) | LCP-baseline + CI-budget | ✅ **Klar 2026-07-10** — baseline mot prod: landning ~340 ms, inloggad översikt ~1 400 ms (median, `e2e/lcp-baseline.cjs`). LCP-budget 2 500 ms som warn i CI:s Lighthouse-jobb; skärp till error när CI-variansen är känd |
| D7 | Robusthetsfynd från testskrivningen | ⬜ Ny 2026-07-10. ~14 observationer från D3-agenterna, viktigast: tysta DB-fel i `applicationHistoryApi.log` + `milestonesApi.toggleComplete` + `favoriteOccupationsApi.isFavorite` (fel tolkas som "inte favorit" → toggle kan skapa dubblett), race i `personalBrandApi.recordPractice`, `careerPlanApi.create` error-checkar inte avaktiveringen (två aktiva planer möjliga), `savedJobsApi.getAll` utan auth-guard, asymmetrisk snake/camelCase i `calendarApi`, `credentialsApi.updateStatus` kan aldrig rensa completed_date. Detaljer i commit 79f52e78 |

## Spår E — Prestanda

| # | Uppgift | Detaljer |
|---|---------|----------|
| E1 (P3) | Timeout + AbortController på `callAI` | ✅ **Klar 2026-07-10** — 60 s timeout med vänligt felmeddelande |
| E2 | Bildbantning | ✅ **Klar 2026-07-10** — favicon/touch-icon/PWA-ikoner genererade i rätt storlekar (3–110 kB); fem oanvända stor-PNG:er raderade (appen använde redan SVG/WebP). Favicon-nedladdningen gick från ~1,5 MB till 12 kB |
| E3 (P2) | Kolumn-trimma `select('*')` | ✅ **Delvis klar 2026-07-10** — calendarApi.getEvents (24 kolumner explicit), notifications (via E5), döda getUpcomingFollowups raderad; hub-loaders var redan trimmade. Rest: cloudStorage/careerApi-svansen tas i takt med E-refaktorer |
| E4 (gamla E1) | articleData → Supabase/lazy | ✅ **Analyserad 2026-07-10:** contentApi-chunken (1 055 kB: articleData 772 + exercises 263) är REDAN on-demand — bara lazy-sidor importerar den. Ingen eager-belastning. Full Supabase-migrering kvarstår gated på D1-aktivering, nedprioriterad |
| E5 (P4) | React Query-migrering | ✅ **Delvis klar 2026-07-10** — useSavedJobs (7 konsumenter delar cache), useNotifications (TopBar = varje sidvisning; realtime → cache), useDiary (6 hooks), useJobAlerts. Rest: useSta/useLearning/useInsights m.fl. i takt med att sidorna rörs |
| E6 (P1 steg 2) | Bundle-analys | ✅ **Klar 2026-07-10** — entry 655→605 kB (statiska sidor lazy). Fynd: sv.json 290 kB är största entry-posten (medvetet — startspråk), PDF-chunken har 3× pako-kopior (tas i PDF-konsolideringen), xlsx 978 kB egen lazy-chunk. CSS 317 kB = global tailwind, ingen enkel split |
| E7 | **CI-typkontrollen avslöjad + lagad** | ✅ 2026-07-10 — `npx tsc --noEmit` utan `-p` är en NO-OP (solution-style tsconfig). Riktiga gaten är `npm run typecheck:critical`. Den visade 2 crash-fel: hooks-barrelns useServiceWorker-export (från C2 — CI röd sedan dess) + odefinierad `now` i consultantInsights. Båda lagade. OBS: full `typecheck` har ~751 pre-existing strict-fel (ny skuldpost) |

## Spår F — Design/UX-skuld

| # | Uppgift | Detaljer |
|---|---------|----------|
| F1 (R4) | **Beslut: dark mode i scope eller ej** | ⬜ **Fortfarande Mikaels beslut** (deadline v. 26 passerad). Default `'system'` exponerar oprövad mörk vy |
| F2 (F7) | i18n-svep hårdkodad svenska | ✅ **Klar 2026-07-10** (UI-delen) — ~205 stränganvändningar i hubs (7 filer) + dashboard (13 filer) + PitchTab i18n:ade, 370 nya nycklar/språk. Ny rapport `npm run report:i18n` (rå svenska utanför t()) visar att resterande ~10 000 rader är svenskt INNEHÅLL (övningar/artiklar/yrkesdata) — översättning av innehållet är ett produktbeslut, inte städning |
| F3 (gamla F1) | EmptyState-migrering | ✅ **Klar 2026-07-10** — 8 filer migrerade till `<EmptyState>` med inviter + EN CTA (StaConsultant 5 flikar, WorkDiary, WorkplaceCard, Del3, PitchTab ×2, OccupationsTab, ResultsTab, PrintableResources). DoaSelfAssessment var felflaggad (inget tomtillstånd) |
| F4 (F9) | aria-live på dynamiska vyer | ✅ **Klar 2026-07-10** — sök-/filterresultat annonseras i Ansökningar-pipelinen och Spontanansökans lista (sr-only role=status) |
| F5 | Voice & Tone-svep | ✅ **Klar 2026-07-10** — "Aktivera" → "Slå på" (bevakning, e-post, jobbalert), "Inga aktiva påminnelser" → "Du har inga påminnelser just nu" (sv+en) |
| F6 (G) | Gradients → whitelistad noll | ✅ **Klar 2026-07-10** — baseline 65 → **52 där samtliga är medvetna undantag** (CV-mallar 43, Landing-hero 3, glow 2, tokens 4). Fixbara skulden = 0: ResultsView städad (13), döda gradient-tokens raderade, SVG-diagramgradienter dokumenterade som undantag |
| F7 (ONB) | Onboarding-konsolidering rest | ✅ **Klar 2026-07-10** — läget dokumenterat i DESIGN-DEBT: 1 global + 2 medvetet sidospecifika (Profil, STA); AI-team-modal raderad (C2), CV-tour borta. Rest: ev. Profile-modal-migrering när profilsidan görs om |

## Spår G — Produktutveckling

| # | Uppgift | Detaljer |
|---|---------|----------|
| G1 | **STA fas 7: statusflöde + AF-integration** | Sista milen till kärnvisionen: Utkast→Granskning→Inskickad→Bekräftad, konsekvenscheck före export, e-post till AF, audit-trail AI-vs-konsulent. Detalj: `docs/sta-automation-roadmap.md` |
| G2 | STA fas 6-rester + förbättringar | Automatisk fredagsveckosumma, A5 påminnelser (opt-in), A6 frånvarodagar, A7 konsulent-statusindikator |
| G3 | Fokusläge för CV-flödet | 34 sidor har PageFocusShell — CV (tyngsta verktyget) och STA saknar |
| G4 | Nav-lagningar | `/profile` in i Min vardag-hubben (CLAUDE.md lovar det), länka `/help` i Resurser |
| G5 | LIV fas 5: firande i nyckelögonblick | Ansökan skickad/övning klar/milstolpe; konfetti-grund finns. Fas 4 i stort klar |
| G6 | **EU-beslut: 26-001, 26-002 eller båda** | Aug. Styr även C4 (learning-funktionernas öde). Specar: docs/26-001/26-002 |
| G7 | Spontanansökan-rester (lågprio) | SearchTab-uppdelning (~900 r), dubblettskydd "Lägg till i Ansökningar", ortfältets svenska |
| G8 | Konsulentvyn vidare | Fortsätt på "Min dag"-spåret från 10–11/6; R2b ligger i B3 |

## 4. Q4 2026 — Konsolidera & mäta

Performance-budget i CI · A11y-audit (Lighthouse + skärmläsare, 5 sidor) · i18n-granskning av AI-output · användarintervjuer (5 deltagare + 3 konsulenter) · feature-sunset (< 5 % användning → avvecklingskandidat).

## 5. Horisont 2027 (riktning, ej spec)

Realtidsmeddelanden deltagare↔konsulent · 26-010-spår om utlysningen vinns · PWA-läge med offline-CV · AI-rollsimulator (26-002 modul 7).

## 6. Bygg inte (förbjudna riktningar)

Native mobilapp (PWA räcker) · egen LLM-hosting · egen videointervju-plattform · eget CMS · Gamification 2.0.

## 7. Beslutslogg — väntar på Mikael

| Beslut | Punkter | Behövs till |
|--------|---------|-------------|
| **Prioritera spåren B–G** (A ligger fast) | hela planen | nu |
| Rotera OpenRouter-nyckeln | A1 | omedelbart |
| Boka AI-jurist | A2 | denna vecka |
| GitHub Secrets för E2E | D1 | 10 min |
| pg_cron i Supabase-dashboarden | A6 | snarast |
| Dark mode i scope eller ej | F1 | var v. 26, försenad |
| `design-source/`-hemvist (36 MB, persondata?) | C7 | v. 29 |
| EU-utlysning: 26-001/26-002/båda | G6, C4 | aug |
| DPIA/Art 30: org-uppgifter + signatur | A4 | v. 29 |

## 8. Detaljkällor (bilagor)

| Dokument | Roll |
|----------|------|
| `docs/portal-review-2026-07.md` | **Senaste helhetsgranskning — grunden för denna plan** |
| `docs/portal-review-2026-06.md` | Föregående granskning (historik) |
| `docs/DESIGN.md` + `docs/DESIGN-DEBT.md` | Designsanning + CI-kopplad skuldlista |
| `docs/COMPLIANCE-AUDIT-2026-05-15.md` + `COMPLIANCE-USER-ACTIONS.md` | Juridiskt underlag + checklista |
| `docs/security-audit.md` | Säkerhetsstatus (nydateras i A9) |
| `docs/STA-FORBATTRINGSFORSLAG.md`, `sta-automation-roadmap.md` | STA-detaljspecar (G1/G2) |
| `.planning/AF-API-INTEGRATION-ROADMAP.md` | AF-API-idébank |
| `docs/26-001 / 26-002 / 26-010` | EU-utlysningsspecar |
| `docs/GRAFIK-PLAN.md` | Grafikpipeline |

## 9. Avslutat (flyttas hit i stället för att raderas)

| Plan | Resultat | När |
|------|----------|-----|
| Spontanansökan-granskning 20 punkter | Uppföljningar, kontaktperson, brevkoppling, React Query, batch, a11y, i18n — browserverifierat mot prod (`e2e/spontan-verify.cjs`) | 2026-07-10 |
| Ansökningar-totalgenomgång | i18n, döda knappar kopplade, fokusfällor/a11y, drag-and-drop-pipeline, sök/mobil/kalender | 2026-07-07–10 |
| Jobbsök UX/i18n/refactor-paket | MatchesTab-uppdelning m.m. | 2026-07-03 |
| CV-PDF per-sida-marginaler + 12-mallsgranskning | `box-decoration-break`-lösningen, visual audit-skript | 2026-07-03 |
| Grafik fas 7 | Custom hub- och verktygsikoner | 2026-06-29–30 |
| Granskningssnabbfixar 2026-06-22 | R1 (CV-assistent-404), R2 (konsulent-bulk status), R3 (test.js raderad), R6 (rate limit), R9 (gradient-baseline), P1 steg 1 (entry −28 %) — mergade till main | 2026-06-22 |
| Konsulentportal-utbyggnad | "Min dag", gruppmeddelanden, mall-tilldelning, AI-rapportutkast | 2026-06-10–11 |
| ESLint-skulden (gamla A1) | 1 019 → 11 errors (uppmätt 2026-07-10) | löpande |
| Hub-navigering v1.0, Designsystem v3.0, TECH-DEBT fas A–F, LIV fas 1–3(–4), GRAFIK fas 1–6, STA fas 1–5, granskningar apr–jun | Se arkiv | 2026-04–06 |

---

*Uppdateras löpande. Vid kvartalsskifte: flytta avklarat till §9, omvärdera spåren.*
