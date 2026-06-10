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

- **26-002 AI-kompetensspår (aug–sep):** ny sida `/ai-larande` (Guide, Beredskapsindex, Verktyg, Etik), tabeller `ai_learning_progress`/`ai_readiness_assessments`/`ai_course_modules`, AI-beredskapsindex (6 områden, 0–100), kompetensguide 5 moduler, konsulentvy med AI-poäng. Underlag för 45 MSEK ESF-ansökan + standalone-värde.
- **26-001 Mikromeriter (okt):** tabell `micro_credentials` (utfärdare, kompetens, verifierings­hash), generering vid slutförd kurs/intervjutröskel/CV-poäng > 85, PDF med QR-verifiering, LinkedIn-delning. Passar STA-modulen naturligt.

### 3d. AF-API tier 2

Idébank med ~60 förslag (flera ✅ klara) i `.planning/AF-API-INTEGRATION-ROADMAP.md` — plocka härifrån när 3b/3c skapar behov.

## 4. Q4 2026 — Konsolidera & mäta

Performance-budget i CI (LCP < 2,5 s på 3G, INP < 200 ms) · A11y-audit (Lighthouse + manuell skärmläsare, 5 viktigaste sidorna) · i18n-granskning av AI-output-strängar · användarintervjuer (5 deltagare + 3 konsulenter: vad används aldrig?) · feature-sunset-process (< 5 % användning under Q4 → avvecklingskandidat).

## 5. Horisont 2027 (riktning, ej spec)

Realtidsmeddelanden deltagare↔konsulent (Supabase Realtime) · 26-010-spår om utlysningen vinns · PWA-läge med offline-CV · AI-rollsimulator (26-002 modul 7).

## 6. Bygg inte (förbjudna riktningar)

Native mobilapp (PWA räcker) · egen LLM-hosting (OpenRouter ger modellfrihet) · egen videointervju-plattform (välj partner vid behov) · eget CMS (Supabase-tabell + admin-UI räcker) · Gamification 2.0 (använd befintliga tabeller).

## 7. Beslutslogg — väntar på Mikael

| Beslut | Behövs till | Status |
|--------|-------------|--------|
| Rotera OpenRouter-nyckeln (J1) | Omedelbart | ⬜ |
| Testanvändare + GitHub Secrets (S1) | v. 24 | ⬜ |
| `sta/`-källdokumentens hemvist (S6) | v. 25 | ⬜ |
| Prompt-strategi: konsolidera eller dokumenterad divergens (C1) | v. 28 | ⬜ |
| Välj EU-utlysning: 26-001, 26-002 eller båda | Aug | ⬜ |
| DPIA/Art 30: org-uppgifter + signatur (J2/J3) | v. 25 | ⬜ |

## 8. Detaljkällor (bilagor — prioriteras härifrån, inte därifrån)

| Dokument | Roll |
|----------|------|
| `docs/portal-review-2026-06.md` | Senaste helhetsgranskning — grunden för denna plan |
| `docs/DESIGN.md` + `docs/DESIGN-DEBT.md` | Designsanning + levande skuldlista (CI-kopplad) |
| `docs/COMPLIANCE-AUDIT-2026-05-15.md` + `COMPLIANCE-USER-ACTIONS.md` | Juridiskt underlag + åtgärdschecklista |
| `docs/security-audit.md` | Levande säkerhetsstatus |
| `docs/STA-FORBATTRINGSFORSLAG.md`, `sta-automation-roadmap.md`, `sta-*` | STA-detaljspecar |
| `.planning/AF-API-INTEGRATION-ROADMAP.md` | AF-API-idébank |
| `docs/26-001 / 26-002 / 26-010` | EU-utlysningsspecar |
| `docs/GRAFIK-PLAN.md` | Grafikpipeline-manual (chroma-key-standard, optimering) |

## 9. Avslutat (flyttas hit i stället för att raderas)

| Plan | Resultat | Arkiv |
|------|----------|-------|
| Hub-navigering v1.0 (fas 1–5) | 5 hubbar, widgets, persistens — shippad 2026-04-29 | `.planning/` |
| DESIGN-ROADMAP fas 0–8 | Designsystem v3.0 implementerat 2026-05-10 | `archive/2026-06-dokkonsolidering/DESIGN-ROADMAP.md` |
| TECH-DEBT fas A + autonoma B–F | −14 800 rader dödkod, −52 % initial JS, AI-robusthet, säkerhetsfixar (2026-05-15) | `.../TECH-DEBT-ROADMAP.md`, `NIGHT-LOOP-SUMMARY-2026-05-15.md` |
| LIV fas 1–3 + GRAFIK fas 1–6 | Illustrationer i heroes, tomtillstånd, success-vyer, editorial spots (2026-06-04/06) | `.../LIV-ROADMAP.md` |
| STA-bygget maj 2026 | Arbetsprövningsmodul: deltagar- + konsulentflöde, DOA, AI-utkast | `docs/sta-*` |
| Granskningar apr/maj | portal-review-2026-04, audit-2026-04, audit-2026-05-10, teknisk-skuld-2026-05 | `archive/2026-06-dokkonsolidering/` |

---

*Uppdateras löpande. Vid kvartalsskifte: flytta avklarat till §9, omvärdera §1–3.*
