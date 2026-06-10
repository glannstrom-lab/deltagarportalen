# Roadmap — Jobin (Deltagarportalen)

> **Detta är projektets enda gällande plan.** Antagen 2026-06-10 utifrån `docs/portal-review-2026-06.md`.
> Ersätter och konsoliderar: gamla ROADMAP (2026-04), TECH-DEBT-ROADMAP, DESIGN-ROADMAP, LIV-ROADMAP, FLAGGED-DEFERRED, BLOCKED-FAS-D — alla arkiverade i `archive/2026-06-dokkonsolidering/` med öppna punkter överförda hit.
> ID:n som `A1`, `E3`, `F1` behålls från tech-debt-roadmapen för spårbarhet mot arkivets detaljbeskrivningar.

**Så underhålls dokumentet:** En plan, tre horisonter (Nu / Näst / Senare). Avklarat flyttas till §9. Nya idéer går in under rätt horisont — aldrig i ett nytt plandokument. Detaljspecar (STA, AF-API, EU) lever som bilagor enligt §8 och prioriteras härifrån.

---

## 1. Nu — v. 24–27 (juni–juli): Compliance & skyddsnät

### Spår 1 — Juridik (hård deadline: AI Act 2 aug 2026)

| # | Uppgift | Detaljer | Status |
|---|---------|----------|--------|
| J1 | Rotera läckt OpenRouter-nyckel | `docs/security-audit.md` CRIT-2605-01 — dashboardåtgärd, 5 min | ⬜ **Mikael, idag** |
| J2 | Färdigställ DPIA | `docs/DPIA-PORTAL.md` — fält för ansvarig/org.nr/signatur väntar | ⬜ |
| J3 | Färdigställ Art 30-register | `docs/GDPR-ART30-REGISTER.md` + verifiera retention & DPA per biträde | ⬜ |
| J4 | AI Act Annex III-klassificering per AI-funktion | `docs/AI-ACT-CLASSIFICATION.md` — kompetensanalys/jobbmatchning/STA-AI ligger närmast högrisk (Annex III p4) | ⬜ |
| J5 | Art 50-transparensmärkning i UI | "AI-genererat"-märkning på alla AI-svar (18 Vercel-funktioner + edge) | ⬜ |
| J6 | Beta av `docs/COMPLIANCE-USER-ACTIONS.md` | Levande checklista — kritiska punkter denna vecka | ⬜ pågående |

### Spår 2 — Skyddsnät & buggfixar från granskningen 2026-06

| # | Uppgift | Detaljer | Status |
|---|---------|----------|--------|
| S1 (f.d. D1) | Authenticated E2E i CI | Mikael: skapa testanvändare + GitHub Secrets (`TEST_USER_EMAIL`/`TEST_USER_PASSWORD`); instruktioner i arkivets `BLOCKED-FAS-D.md`. Sedan: aktivera workflow-steget | ⬜ blockerad på Mikael |
| S2 (f.d. D3/D4) | Konsulent golden path + PDF-export-E2E | Följer direkt på S1; STA-smoke ingår | ⬜ |
| S3 | Kurera `e2e/` | Promota ~10 bästa av 81 ad-hoc `.cjs`-skript till spec-filer, arkivera resten | ⬜ |
| S4 | Fixa V1–V7 från `portal-review-2026-06.md` §4 | "Hej □"-fallback, "1 månader sen"-plural, "Generera"-copy, cookie+tour-krock mobil, Resurser-animationsrace, stale build-timestamp, Hälsa-hero | ⬜ ~1–2 dagar |
| S5 | Mät LCP/Web Vitals i prod efter preload-fixen | Sätt baseline → performance-budget i CI (mål: LCP < 2,5 s) | ⬜ |
| S6 | Repo-städning | 39 ospårade filer: committa/ignorera; besluta `sta/`-källdokumentens hemvist (persondata?); normalisera radslut (`.gitattributes`) | ⬜ delvis Mikael |

## 2. Näst — v. 26–31 (juli–aug): Skuldbetalning

Bakgrundsarbete, körs när Spår 1–2 tillåter. Detaljer: arkivets `TECH-DEBT-ROADMAP.md` + `FLAGGED-DEFERRED.md`.

| ID | Uppgift | Notis |
|----|---------|-------|
| A1 | ESLint 1019 → 0 errors | Mest `no-unused-vars`; manuellt över flera dagar |
| D2r | Tester för 3 kvarvarande services (profileEnhancementsApi, careerApi, pdfExportService) | userApi klar (natt-loopen) |
| C1 | Prompt-konsolidering `ai.js`/`ai-stream.js` → `_prompts.js` | Designbeslut: medveten divergens dokumenterad — konsolidera eller behåll |
| PDF | Konsolidera 3 PDF-bibliotek → 1 | −700 kB möjligt |
| E6 | Radera `services/api.ts`-shim | 14 callers importeras om |
| E10 | Data-access-regel (`no-restricted-imports` för `@/lib/supabase` i pages/components) | 77 brott — soft warn → 10 filer/sprint |
| E11 | Service Worker: aktivera på riktigt eller ta bort | Idag worst-of-both |
| F1 | EmptyState-migrering ~50 sidor | Görs hub för hub; design-kontraktet i DESIGN.md §7 |
| F2 | localStorage → cloud-sync (NegotiationTab + 6 OverviewTab-flaggor) | Kräver DB-migration |
| F7 | i18n-svep för hårdkodade svenska strängar | Inkluderar hub-korten (V2/V3); utöka leak-scannerns scope till `pages/hubs/` |
| F9 | `aria-live` på dynamiska delar (sökresultat, filter, widget-laddning) | A11y |
| G | Gradient-överträdelser 68 → 0 | Levande lista i `docs/DESIGN-DEBT.md`; CI-guard finns |
| E3–E5 | Bryt upp god objects (`cloudStorage` 2810 r, `careerApi` 1150 r, `pdfExportService` 1619 r) | **Först efter** D2r — kräver testtäckning |
| E1 | `articleData.ts` (24 880 rader) → Supabase | **Först efter** S1/S2 — kräver E2E-skydd + prod-migration |
| D6 | Husky + lint-staged | Valfri bekvämlighet, CI fångar redan |
| ONB | Slutför onboarding-konsolideringen enligt DESIGN.md §12 | Natt-loopen reducerade 5 → 1 aktiv komponent; restpunkter kvar |

## 3. Senare — aug–okt: Produkt (H2)

### 3a. LIV — gör portalen levande (fas 4–5 kvar, detalj i arkivets `LIV-ROADMAP.md`)

- **Fas 4 Personalisering:** tid-på-dygnet-hälsning ("God morgon, Anna"), dynamisk hero-subtitel på hubbar, ny-vs-återvändande-copy. (Säsongstoner: flaggat, valfritt.)
- **Fas 5 Glädje i nyckelögonblick:** lugnt firande vid ansökan skickad / övning klar / milstolpe (CV-success finns). Konfetti EN gång, dismissbar, reduced-motion-safe.
- Restpunkt fas 3: verifiera att SkillsGap fick sin editorial-spot (`spot-kompetens` saknas på disk).

### 3b. STA — arbetsprövning nästa steg

Öppet ur `docs/STA-FORBATTRINGSFORSLAG.md`: A5 påminnelser (opt-in), A6 frånvarodagar förskjuter dagsslingan, A7 konsulent-statusindikator, B2 karriärvägledning som övning, B3 voice-input, B4 kompendium-läsmiljö, B5 "Det här ser Linda"-transparenssida.
Automation enligt `docs/sta-automation-roadmap.md`: fas 1–5 i drift sedan maj (datamodell, skattningar, AI-utkast, AT-blankett) — **fas 6 (avancerad automation) och fas 7 (AF-integration + statusflöde)** kvarstår.

### 3c. EU-utlysningarna (beslut i aug — se §7)

- **26-002 AI-kompetensspår (aug–sep):** ny sida `/ai-larande` (Guide, Beredskapsindex, Verktyg, Etik), tabeller `ai_learning_progress`/`ai_readiness_assessments`/`ai_course_modules`, AI-beredskapsindex (6 områden, 0–100), kompetensguide 5 moduler, konsulentvy med AI-poäng. Underlag för 45 MSEK ESF-ansöka