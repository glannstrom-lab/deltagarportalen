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
| B1 | Fejk-AI på `/career/adaptation` | AdaptationTab anropar AI-funktioner som inte finns; fallback maskerar felet som AI-svar. Bygg funktionerna i ai.js eller gör fliken ärligt statisk |
| B2 | Simulerad AI i CV-byggarens "Anpassa för jobb" | JobAdaptPanel "simulerar API-anrop". Koppla till riktig AI-väg eller märk om/ta bort |
| B3 (R2b) | Konsulent-bulk: tagg-backend + PDF-export | Två "kommer snart"-knappar i BulkActionsDialog. Bygg (tags-kolumn + export) eller ta bort |
| B4 | "Kommer snart"-svep | Inventera resterande platshållar-UI; allt ska antingen fungera eller inte visas |

## Spår C — Städning & dödkod

| # | Uppgift | Detaljer |
|---|---------|----------|
| C1 | Arkivera widget-systemet | `components/widgets/` ~6 000 rader inkl. ~30 testfiler, monteras aldrig. Flytta typexporter (JobsokSummary m.fl.) till hooks-filerna, arkivera resten |
| C2 | Radera småskrot | CompactDashboard + MobileDashboard (690 r), `ai-team/OnboardingModal`, `useServiceWorker` + SW-avregistrering ×3, `ovningshjalp` i ai.js |
| C3 | Ta bort `VITE_HUB_NAV_ENABLED` + navGroups | Flaggan är permanent på; gamla 27-items-navigationen är död. Rätta även e2e-skript som sätter flaggan via localStorage (verkningslöst) |
| C4 | Beslut: 6 callerlösa edge-funktioner | `learning-*` ×3, `ai-assistant`, `af-jobsearch`, `af-enrichments` — behåll som 26-002-groundwork eller ta bort (attackyta). **Kopplas till G6-beslutet** |
| C5 (E6) | Radera `services/api.ts`-shim | 14 importörer skrivs om |
| C6 (S3) | Kurera `e2e/` + skriv om README | 87 ad-hoc-.cjs; promota ~10 till spec, arkivera resten |
| C7 (S6) | `design-source/` 36 MB ospårat | Committa, .gitignore eller flytta ut — **Mikael beslutar** (persondata?) |
| C8 | Dokumentarkivering | 12× team-betyg, jobsearch-fullstack-review, AI_ENGINEER_ANALYSIS, RLS_VERIFICATION (inaktuell = farlig), .planning/STATE|ROADMAP|REQUIREMENTS → archive/ |

## Spår D — Skyddsnät & kvalitet

| # | Uppgift | Detaljer |
|---|---------|----------|
| D1 (S1) | Authenticated E2E i CI | Testkontot FINNS (.env.test.local, användes 10/7 mot prod). Kvar: GitHub Secrets + aktivera workflow-steget. **Mikael: secrets, 10 min** |
| D2 (S2) | Golden path-spec | Deltagare: registrera→CV→söka→spara→följa upp; konsulent-smoke; STA-smoke. `spontan-verify.cjs` promotas |
| D3 (D2r) | Tester för kärnservices | 53/70 services otestade; börja cloudStorage, careerApi, staApi, applicationsApi — **förutsättning för E3–E5-refaktorer** |
| D4 (D6) | Husky + lint-staged | Ingen pre-commit-gate; förklarar no-console-ackumulering |
| D5 | ESLint 11→0 + jaga flaky test | Restskuld liten; 1 flaky observerad i full suite |
| D6 (S5) | LCP/Web Vitals-baseline + CI-budget | Mål LCP < 2,5 s; idag bara Sentry 0.1-sampling |

## Spår E — Prestanda

| # | Uppgift | Detaljer |
|---|---------|----------|
| E1 (P3) | Timeout + AbortController på `callAI` | Hängda AI-anrop väntar för evigt; liten fix, stor UX-effekt på svag uppkoppling |
| E2 | Bildbantning | logo-jobin.png 1 052 kB + logo-icon 424 kB → WebP/SVG < 30 kB; snabbaste LCP-vinsten |
| E3 (P2) | Kolumn-trimma `select('*')` | 178 st; börja med listvyerna saved_jobs + spontaneous_companies |
| E4 (gamla E1) | articleData (24 864 r) → Supabase/lazy | contentApi-chunken är 1 019 kB rå. **Efter D1/D2** (kräver E2E-skydd) |
| E5 (P4) | React Query-migrering av 12 hooks | useSavedJobs, useNotifications, useSta m.fl. — i takt med att sidor ändå rörs |
| E6 (P1 steg 2) | Bundle-analys av entry 655 kB + CSS-split 317 kB | Visualizer-körning; en.json/Sentry redan lazy |

## Spår F — Design/UX-skuld

| # | Uppgift | Detaljer |
|---|---------|----------|
| F1 (R4) | **Beslut: dark mode i scope eller ej** | Default `'system'` exponerar oprövad mörk vy (10 768 ostyrda dark:-klasser). Ja → designprincip + tokens; Nej → default 'light' + städning. **Mikael** (deadline passerad) |
| F2 (F7) | i18n-svep hårdkodad svenska | ~100+ strängar i hubs/dashboard/STA/PitchTab + utöka leak-scannern till rå svenska utanför t() |
| F3 (gamla F1) | EmptyState-migrering | 15 sidfiler med ad-hoc-tomtillstånd, STA värst; DESIGN.md §7-kontraktet |
| F4 (F9) | aria-live på dynamiska vyer | Applications.tsx har 0 trots sök/filter/drag-and-drop |
| F5 | Voice & Tone-svep | "Aktivera bevakning" m.fl. i sv.json; 0-språk i CareerGoalWidget |
| F6 (G) | Gradients 65→0 | Baseline hålls; beta av resterande |
| F7 (ONB) | Onboarding-konsolidering rest | 3 aktiva + 1 avkopplad i bundlen (raderas i C2) |

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
