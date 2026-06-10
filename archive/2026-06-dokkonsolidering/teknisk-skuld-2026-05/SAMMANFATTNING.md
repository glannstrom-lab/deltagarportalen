# Teknisk skuld – syntes 2026-05-09

Tio specialistagenter har granskat Deltagarportalen parallellt. Detta dokument är navet — varje rubrik länkar till underliggande rapport.

| Perspektiv | Rapport |
|---|---|
| Fullstack-utvecklare | [fullstack.md](fullstack.md) |
| Säkerhet | [security.md](security.md) |
| Prestanda | [performance.md](performance.md) |
| AI-arkitektur | [ai-engineer.md](ai-engineer.md) |
| UX/Design | [ux-design.md](ux-design.md) |
| Tillgänglighet (WCAG) | [accessibility.md](accessibility.md) |
| QA / Testning | [qa-test.md](qa-test.md) |
| Product owner | [product-owner.md](product-owner.md) |
| Arbetskonsulent | [arbetskonsulent.md](arbetskonsulent.md) |
| Deltagare (långtidsarbetslös) | [deltagare.md](deltagare.md) |

---

## TL;DR

Portalen är **tekniskt välbyggd i fundamentet** men har samlat på sig en signifikant skuld i adoption, konsistens och datanärhet. TS-strict är grönt, säkerhetsinfrastrukturen finns, designsystemet är dokumenterat, tillgänglighets-hooks finns. Skulden ligger i **inkonsekvent användning** av det vi redan har, plus några **launchblockerande** säkerhets- och dataintegritetsbrister.

**Bara 4 launchblockare. Ungefär 12-16 dagars fokuserat arbete för att rensa P0+P1.**

---

## P0 — Launchblockare (måste fixas innan publicering / EU-utlysning)

### 1. PII-läckage i localStorage på delade datorer
- `client/src/hooks/useCVAutoSave.ts:88,186,216` skriver fullständigt CV (namn, jobbhistorik, kontaktuppgifter) till localStorage. Målgruppen använder bibliotek/AF-datorer → föregående användares CV läcker till nästa.
- **GDPR-blockerare** inför EU-utlysning. Källa: [security.md](security.md) HIGH-2026-05-002.

### 2. `client/api/job-alerts.js` saknar auth-verifiering
- Endpoint använder `SUPABASE_SERVICE_KEY` på module-scope men verifierar inte Bearer-token. Exploitbar IDOR — angripare kan trigga jobbsökningar/e-post i godtycklig användares namn.
- Källa: [security.md](security.md) HIGH-2026-05-004.

### 3. `supabase/functions/af-jobsearch` är öppen proxy
- `config.toml: verify_jwt = false` + `Access-Control-Allow-Origin: '*'` → öppen Arbetsförmedlings-proxy. Risk för Supabase-quota-utbrytning och avstängning.
- Källa: [security.md](security.md) HIGH-2026-05-003.

### 4. `deploy.yml:58` kör `supabase db push`
- CLAUDE.md förbjuder kommandot uttryckligen — det försöker köra ALLA migrationer och fail:ar på konflikter. Kommer haverera nästa migrations-deploy.
- Källa: [qa-test.md](qa-test.md).

---

## P1 — Allvarliga (fixa inom 2 veckor)

### Dataintegritet
- **Mockad data i konsulentvyn** — `ParticipantDetailPage.tsx:304-310` (5 hårdkodade timeline-events), `OverviewTab.tsx:457-464` (`monthlyProgress`, `averageTimeToPlacement: 45`), `consultantService.ts:498-499` (returnerar 0 för `goalsCompletedThisMonth`/`placementsThisMonth`). Konsulenten fattar beslut på falska premisser. Källa: [arbetskonsulent.md](arbetskonsulent.md), [product-owner.md](product-owner.md).
- **Tre parallella profil-stores** — `useAuthStore.profile` + `useProfileStore` (Zustand persist med server-data) + `useDashboardData` (React Query). Synkar inte, garanterad sync-bugg mot regeln "Supabase är default-persistens". Källa: [fullstack.md](fullstack.md).
- **Streaming trasig för 12 av 13 AI-funktioner** — `ai.js:550` skickar `{token}`, `aiStreamService.ts:128` läser `{content}`. Tomma svar utan felmeddelande utöver ai-team-chat. Källa: [ai-engineer.md](ai-engineer.md).
- **Deprecerad Claude-modell** — `claude-3-haiku-20240307` (hårdkodad i `ai.js:573`) är borttagen av Anthropic, kommer börja fela. `claude-3.5-sonnet` är default → bör vara Sonnet 4.6. Källa: [ai-engineer.md](ai-engineer.md).

### Säkerhet (HIGH som inte är launchblockare)
- Google Calendar OAuth-tokens i localStorage. Källa: [security.md](security.md) HIGH-001.
- Prompt injection via `systemKontext` i ai-team-chat (klienten styr system-rolen).
- Sentry använder e-post som identifierare (PII-läcka).

### Funktioner som finns men inte syns
- `/linkedin-optimizer` och `/international` är registrerade routes men saknas i `navHubs[].memberPaths` → osynliga för 100 % av användarna efter hub-rolloutet. **15 minuters fix.** Källa: [ux-design.md](ux-design.md), [product-owner.md](product-owner.md).
- AF-edge functions (`af-jobsearch`, `af-historical`, `af-trends`) anropas aldrig från konsulentvyn — Deltagarportalen blir parallellsystem istället för operativt centrum. Källa: [arbetskonsulent.md](arbetskonsulent.md).
- "Tilldela mål"-knapp (`ResourcesTab.tsx:811`) kastar bara `alert()` → mall-bibliotek är dödkod.

### Test- och CI-skuld
- **24 testfel** ligger i main (Dashboard.test.tsx 20 fail, HubGrid 2, Sidebar 1, register-flow 1). Coverage-thresholds är avsiktligt avstängda. Källa: [qa-test.md](qa-test.md).
- E2E i CI kör bara `smoke.spec.ts` — alla autentiserade flöden skippas (TEST_USER-secret saknas i workflow).
- Inga test alls för: AI-stack, PDF-export, samtliga Supabase edge functions, samtliga Vercel serverless endpoints.

---

## P2 — Kvalitetsskuld (planera in över 1-2 sprintar)

### Arkitektur / kodkvalitet
- **1 845 `useState` mot 28 filer med React Query** — server-state hanteras manuellt nästan överallt. Ingen caching, ingen retry, dubblerade loaders. Källa: [fullstack.md](fullstack.md).
- **Mega-komponenter**: `MatchesTab.tsx` 1 885 rader, `NetworkingGuide.tsx` 1 283 rader (23 useState i en komponent), `CoverLetterWrite.tsx` 1 153 rader. 26 av dem kringgår `services/`-lagret med direkta `supabase.from()`-anrop.
- **`services/supabaseApi.ts` är 1 835 rader / 1.5 MB** (458 kB gzip) och eager-importeras av 54 filer. Splitta på domän → -200-400 kB raw från initial bundle. Källa: [performance.md](performance.md).
- **Dödkod i `App.tsx`**: `StorageTest`-import, `CVBuilder`-lazy-dubblett, `ConsultantDashboard`-lazy. `EducationPathPanel`, `MicroLearningHub`, `MicroLearning` (~700 rader exporterade utan användning).

### Designsystem-erosion
- **459 gradient-överträdelser i 172 filer** — alla 16 dashboard-widgets bryter DESIGN.md. 403 `shadow-md/lg/xl`-träffar trots tidigare audit-fix → saknas ESLint-vakt mot regression. Källa: [ux-design.md](ux-design.md).
- **Komponentduplicering**: 4 EmptyState, 5 Skeleton/LoadingState, 3 QuickWin (kollisionsrisk på mobil), 2 Button, 3 Card. 244 ad hoc-spinners.
- Dashboard, Profile, CVBuilder, SkillsGapAnalysis använder INTE `PageLayout`/`PageHeader` — den uniforma neutrala headern (DESIGN.md:s största principer) är inte applicerad.

### Tillgänglighet (WCAG-adoption, inte fundament)
- **53 ikon-bara `<button>`** saknar tillgängligt namn — inkluderar Send-knappar i AI-chat och `PhoneOff` i VideoCall. Källa: [accessibility.md](accessibility.md).
- **16 modaler med `role="dialog"`** saknar focus-trap (MobileNav, CrisisSupport, OnboardingFlow).
- **367 framer-motion-anrop** men endast 3 filer använder `useReducedMotion` — `wellness/CrisisTab.tsx` har 19 anrop på en krishanteringssida.

### Empati / användarvärde
- 18 AI-prompts har inkonsekvent ton — hälften "empatisk coach", hälften "expert". Källa: [deltagare.md](deltagare.md).
- Hårdkodade engelska felfraser ("Update failed", "Delete failed") och råa Supabase-fel visas i UI.
- Konsultjargong i UI: "Pipeline", "streak", "Personligt varumärke".
- Inga `useTranslation`-anrop i Quick Win-komponenter — engelska saknas helt.

### Observability / produktdata
- **Inget analytics-bibliotek alls i kodbasen** → roadmapens 5 KPI:er (Onboarding Completion, WAU, Feature Adoption, NPS, TTFV) är omätbara. Källa: [product-owner.md](product-owner.md).
- **Ingen `web-vitals`-mätning** → optimerar prestanda blint utan LCP/INP/CLS-fältdata. Källa: [performance.md](performance.md).
- **18 av AI-funktionerna (Vercel-vägen) loggar inget** till `ai_usage_logs` → AI-kostnader är gissade.
- Sentry har 0.1 trace-sample men ingen Web Vitals-koppling.

### GDPR / journal
- `consultant_journal` saknar `is_visible_to_participant`-flagga — konsulenten kan skriva känsliga anteckningar utan att deltagaren ser dem.
- Ingen audit-logg på konsulent-dataläsningar.
- `BulkActionsDialog` exporterar utan audit-spår.

---

## P3 — Backlog (städa när tid finns)

- 75 `any`-förekomster i `client/src` (TS-strict är ändå grönt).
- 47 filer importerar `lucide-react` direkt istället för via barrel.
- 117 kB `interestGuideData.ts` pullas in i flera route-chunks.
- N+1 i `notificationsService.ts:307` (sekventiella inserts).
- 1 040 `text-stone-300/400` på vit bakgrund (potentiell kontrastbrist, inte i CSS-overriden).
- 4 parallella onboarding-strukturer — ingen koherent user journey.
- Documentation drift: hub-systemet i `.planning/ROADMAP.md` saknas i `docs/ROADMAP.md`.
- "Operation Spring Clean" (maj 2026) i `docs/ROADMAP.md` är inte påbörjad.

---

## Tvärgående mönster

Tre teman går igen i flera rapporter:

1. **"Halvfärdig leverans"** — kod skrivs men kopplas inte (linkedin-optimizer/international utan hub-medlemskap, AF-edge functions utan UI, MicroLearningHub som dödkod, mock-data i konsulentvyn, hårdkodade nollor i `consultantService`). Skulden är inte att koden är dålig — det är att den är **frånkopplad**.

2. **"Infrastruktur utan adoption"** — accessibility.css overrider, useReducedMotion, useFocusTrap, SkipLinks, PageLayout, EmptyState finns alla, men används bara i en bråkdel av kodbasen. Mest ROI per ansträngning ligger i **migrera befintliga sidor till befintlig infrastruktur**, inte att bygga nytt.

3. **"Data-divergens"** — tre profil-stores, två AI-services, tre QuickWin-komponenter, fyra EmptyState. Var och en uppkommen från ett rimligt beslut i sin tid; sammantaget ett synkproblem och en testbarhetsskuld.

---

## Föreslagna sprintar

**Sprint A (1 vecka) — Launchblockare:** flytta CV-autospar till Supabase, auth-verifiera `job-alerts.js`, sätt `verify_jwt=true` på `af-jobsearch`, ta bort `supabase db push` från `deploy.yml`. Audit-loggning på `consultant_journal`.

**Sprint B (1 vecka) — Dataintegritet:** ta bort all mockad konsulent-data eller koppla till riktig query; konsolidera tre profil-stores till en; fixa streaming `{token}↔{content}`-buggen; byt ut deprecerad Haiku-modell.

**Sprint C (1-2 veckor) — Adoption + observability:** lägg till `web-vitals`+analytics, migrera Dashboard/Profile/CVBuilder till PageLayout, lägga till de 53 saknade aria-labels, focus-trap på 16 modaler, fixa de 24 testfelen och aktivera coverage-gating, skriv e2e för auth-flöden och kör i CI.

**Sprint D (löpande)** — splitta `supabaseApi.ts`, ESLint-regel mot gradients i återkommande UI, byt 41 trivial framer-motion till CSS, prompt caching på AI-anrop, översätt hårdkodade strängar.

---

## Vad som fungerar bra

För balansens skull:
- TS-strict är grönt med bara 3 `@ts-ignore`.
- Säkerhetsinfrastrukturen håller — föregående revisions HIGH-fynd (CORS i ai.js, distribuerad rate-limit) är verifierat lösta.
- Tillgänglighets-hooks och CSS-overrides är välbyggda.
- Designsystemet är dokumenterat och token-baserat.
- Sentry är ansluten, RLS-verifiering finns dokumenterad.
- E2E-infrastruktur (Playwright) är på plats — bara inte använd.

Skulden är åtgärdbar utan omskrivning. Det är inte ett systembyte — det är **disciplin på tre fronter**: koppla det halvfärdiga, adoptera det redan byggda, mät det levererade.
