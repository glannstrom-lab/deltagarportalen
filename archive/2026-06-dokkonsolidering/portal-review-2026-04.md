# Portalgranskning – April 2026

**Datum:** 2026-04-27
**Granskare:** Claude (Opus 4.7) – kombinerar input från explore-agenter, säkerhetsrevision (2026-04-23) och UI-audit (2026-04-26).
**Scope:** Hela kodbasen – frontend, edge functions, databas, repo-hygien.

---

## Sammanfattning

Deltagarportalen är ett moget projekt: 85+ sidor, 28 edge functions, 85 migrationer, RLS aktiverat på de flesta tabeller, distribuerad rate-limiting via Supabase, OAuth-validerade callbacks, och en design-system-driven UI-omarbetning. Fundamentet är sunt.

Den största risken just nu är **inte säkerhet eller arkitektur** – den är **drift och röra**:

| Område | Status | Risk |
|--------|--------|------|
| Säkerhet (HIGH) | ✅ Åtgärdat (CORS, rate-limit, secrets) | Låg |
| RLS-täckning | ⚠️ 13 tabeller utan policies | Medel |
| Repo-hygien | ❌ 70+ filer i rot, 4 PDF-libs, 586 console.log | Hög (utvecklarvelocitet) |
| Dödkod | ❌ 4 sidor importerade men aldrig routade | Medel |
| Tester | ❌ 19 % täckning | Hög (regressioner) |
| Migrationskonflikter | ⚠️ Två migrationer med samma timestamp | Medel |
| README aktualitet | ❌ Säger React 18 + OpenAI; faktiskt React 19 + OpenRouter | Låg |

---

## 1. Arkitektur – vad som faktiskt körs

### Routing (App.tsx, 292 rader)

Alla aktiva sidor är lazy-loadade och har `RouteErrorBoundary`. Bra mönster.

**Aktiva entry-points (40 routes):**
Dashboard, CV (`/cv/*`), CoverLetter (`/cover-letter/*`), InterestGuide, KnowledgeBase, Profile, JobSearch, Applications, Career, Diary, Wellness, Settings, Resources, Help, Salary, Education, Calendar, Spontaneous, Network, PersonalBrand, LinkedInOptimizer, SkillsGapAnalysis, InterviewSimulator, AITeam, Exercises, International, ExternalResources, MyConsultant, Consultant (rollskyddad), SuperAdminPanel (rollskyddad), Landing, Login, Register, Privacy, Terms, AiPolicy, SharedProfile, LinkedInCallback, GoogleCalendarCallback, InviteHandler.

### Sidor som är importerade men aldrig routade (DÖDKOD)

```typescript
// App.tsx
const CoverLetterGenerator = lazy(() => import('./pages/CoverLetterGenerator'))  // 1632 rader, oanvänd
const UnifiedProfile = lazy(() => import('./pages/UnifiedProfile'))              // ej routad
```

Plus filer som inte ens är importerade:
- `pages/DashboardNew.tsx` (widget-baserat utkast från mars)
- `pages/FocusDashboard.tsx` (fokusläge-variant – fokusläget hanteras nu via `FocusModeProvider` + `FocusCVBuilder` i `CVPage.tsx`)
- `pages/Journey.tsx` (route utkommenterad i `App.tsx:255`)
- `pages/CareerPlan.tsx` (ingen importering)

### CV/CoverLetter är NUVARANDE arkitektur (inte dubbletter)

Tidigare audits har flaggat detta som "duplicering" – det stämmer inte:

- `CVPage.tsx` (125 rader) = **router-wrapper med 5 flikar**, använder `CVBuilder` på fliken "create"
- `CoverLetterPage.tsx` (92 rader) = **router-wrapper med 3 flikar**, använder `CoverLetterWrite`-komponenten

Det enda problemet är att `CoverLetterGenerator.tsx` (1632 rader) ligger kvar som ej-routad legacy.

### AI-arkitektur – dual-track

Två parallella backend-vägar för AI:

**Track 1: Vercel serverless (`/api/ai.js`) – 18 funktioner i en fil (~1500 rader):**
personligt-brev, cv-writing, cv-optimering, intervju-simulator, linkedin-optimering, kompetensgap, ai-team-chat, chatbot, m.fl. Per-funktions rate-limit (10–50/15 min). Modell: OpenRouter med Claude som default.

**Track 2: Supabase edge functions (Deno) – 23 funktioner:**
ai-assistant, ai-cover-letter, ai-cv-writing, ai-career-assistant, ai-company-search, ai-company-analysis, ai-industry-radar, ai-commute-planner, cv-analysis, learning-recommend, learning-progress, learning-analyze-gap, samt af-* (Arbetsförmedlingen-proxy), bolagsverket, education-search, send-invite-email, delete-account, health.

**Risk:** Vissa funktioner verkar finnas dubblerat (t.ex. cover-letter, cv-writing). Beslutet "vilken backend används för vad" är inte dokumenterat. Frontend-services anropar mestadels `/api/ai.js` men vissa hooks går direkt mot edge functions. Detta gör monitoring och rate-limiting inkonsistent.

### State-arkitektur

8 Zustand-stores. **Två potentiella kollisioner:**

1. `energyStoreWithSync` ↔ `settingsStore.energyLevel` – syncas via en hook men källan är otydlig
2. `authStore` ↔ `settingsStore` – cross-store sync i `useAuthInit` för att undvika cirkulära deps

11 React Query-hooks utan dokumenterad cache-invalidationsstrategi → risk för stale data efter mutations.

---

## 2. Databas

### Migrationer – 85 filer, två konflikter

```
supabase/migrations/
├── 20260306130000_fix_all_rls_policies.sql      # samma timestamp
├── 20260306130000_fix_all_rls_and_tables.sql    # samma timestamp
├── 20260315_add_user_preferences.sql            # samma dag
├── 20260315_fix_user_preferences.sql            # 2h senare, omdefinierar
├── 20260316_milestones_system.sql               # skapar achievements
└── 20260322200000_journey_goals_achievements.sql # skapar achievements igen
```

`invitations`-tabellen är skapad på tre olika ställen (010, 007, 20260408120000). Vilken är "sanningen"?

**Rekommendation:** Kör `npx supabase db query --linked "SELECT * FROM information_schema.tables WHERE table_schema = 'public'"` och jämför mot migrationsfilerna. Skriv en konsolidationsmigration om verkligheten avviker.

### RLS-status (verifierat live 2026-04-28)

**Resultat:** Alla persondata-tabeller har RLS aktiverat i prod.
Den tidigare skanningen var fel — den läste migrationsfilerna utan att
verifiera mot live-DB.

Verifierat via `npx supabase db query --linked` mot `pg_policies` och `pg_tables`:

```
articles_backup, content_calendar, diary_entries, elevator_pitches,
gratitude_entries, interview_sessions, job_alerts, job_applications,
mood_logs, notifications, personal_brand_audit, portfolio_items
→ Alla har rls_enabled = true
```

**Enda tabell utan policies:** `rate_limits` (RLS på, 0 policies). Detta är
**medvetet** — den är service-only och nås bara via `check_rate_limit`
RPC (SECURITY DEFINER bypassar RLS). Inga klient-direkta CRUD-anrop
ska gå mot rate_limits.

**Status:** Inga kritiska RLS-luckor.

### Storage

2 buckets: `profile-images` (public read) och `profile-documents` (private, owner-only). Policies använder `auth.uid()::text = (storage.foldername(name))[1]` – korrekt mönster.

---

## 3. Säkerhet (status efter 2026-04-23-audit)

| Risk | Status |
|------|--------|
| CORS wildcard på `/api/ai.js` | ✅ Whitelist implementerad |
| In-memory rate limiting | ✅ Bytt till Supabase RPC `check_rate_limit` |
| Produktionsnycklar i archive/ docs | ✅ Ersatta med platshållare |
| Prompt injection (4 vektorer) | ⚠️ Kvarstår – `sanitizeInput()` i edge function tar bort `<>` men interpolering finns kvar i `/api/ai.js` |
| HSTS-header saknas i `vercel.json` | ⚠️ Kvarstår |
| CSP `unsafe-inline` + `unsafe-eval` | ⚠️ Lågrisk, vanligt för Vite |
| Sentry token-skydd | ✅ Authorization-headers saneras |

**Kvarvarande aktioner:** Lägg till HSTS, samordna `sanitizeInput()` mellan `/api/ai.js` och edge functions, dokumentera vilka endpoints som kräver service role.

---

## 4. UI-status (efter 2026-04-26-audit)

Stora färgmigrationer är gjorda (`teal-* → brand-*`, `green-* → brand-*`, `shadow-* → 0`, `rounded-2xl → rounded-xl`). Tre nya UI-komponenter skapade: `Tabs`, `Badge`, `Avatar`.

**Men:** En snabb stickprovskoll på `CVPage.tsx` och `CoverLetterPage.tsx` visar att `text-teal-600`, `bg-teal-100`, `focus-visible:ring-teal-500` och `shadow-sm` finns kvar på minst dessa två sidor. Auditens "100 % klart" är överdriven.

**Två CTA-utmaningar kvar:**
- 6 sidor har 9–13 stycken `bg-brand-900` – bryter mot "en primär CTA per vy".
- Gradienter (`bg-gradient-to-br from-teal-600 to-slate-800`) finns kvar i loading-screens i `App.tsx`.

---

## 5. Repo-hygien

### Skräp i rot

**73 filer i rotmappen.** Ungefär 50 av dem är inaktuell dokumentation från sprint-processer, mockups och engångsanalyser:

- 17 PNG-screenshots (`1.png` – `17.png`)
- 4 personliga PDF-filer (`af.pdf`, `Personligt_brev_*.pdf`)
- 8 sprint-rapporter (`SPRINT_*.md`, `FAS3_*.md`)
- 6 implementeringsplaner från mars (`NEW_PAGES_*.md`, `WIDGET_REBUILD_*.md`)
- DPIA-backup (`DPIA_Deltagarportalen.docx.bak`)
- En `nul`-fil (Windows artefakt – troligen från `>nul`-redirect)

**Förslag:** Skapa `archive/2026-q1/` och flytta dit allt som inte är aktiv dokumentation. Behåll i rot: `README.md`, `CLAUDE.md`, `SECURITY.md`, `package.json`.

### Bundle – 4 PDF-bibliotek

```json
"@react-pdf/renderer": "^4.3.2",   // 250 KB
"jspdf": "^4.2.0",                  // 180 KB
"jspdf-autotable": "^5.0.7",        // 30 KB
"html2pdf.js": "^0.14.0",           // 70 KB (wrapper kring jspdf+html2canvas)
"html2canvas": "^1.4.1",            // 230 KB
"docx": "^9.6.1"                    // 300 KB
```

Totalt ~1 MB enbart för dokumentexport. `html2pdf.js` är en wrapper – välj antingen den ELLER (jspdf + html2canvas). `@react-pdf/renderer` är den moderna lösningen för CV/cover-letter (används i `cover-letter` enligt senaste commits) – konsolidera dit.

### Console.log-bloat

586 förekomster i `client/src/`. Topp-källor: `diaryApi.ts` (18), `contentApi.ts` (16), `journeyService.ts` (13). Vite är inte konfigurerad att strippa dem i produktionsbygget.

### Andra fynd

- 106 `: any` / `as any` / `@ts-ignore`
- 21 TODO/FIXME (mest problematisk: `consultantService.ts:490–499` – konsultens månadsstats är hårdkodade till 0)
- 19 % testtäckning (18 av 96 sidor)

---

## 6. Konkret åtgärdslista (prioritetsordnad)

| # | Åtgärd | Effort | Effekt |
|---|--------|--------|--------|
| 1 | Radera `CoverLetterGenerator.tsx`, `UnifiedProfile.tsx`, `DashboardNew.tsx`, `FocusDashboard.tsx`, `Journey.tsx`, `CareerPlan.tsx` + lazy-imports i `App.tsx` | 30 min | -3500 rader, mindre förvirring |
| 2 | Flytta sprint-docs, mockups, screenshots och PDF:er till `archive/2026-q1/` | 30 min | Renare rot, snabbare `ls` |
| 3 | Verifiera RLS-status med `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'`. Skriv en migration som aktiverar RLS för de 13 tabellerna. | 2 h | GDPR-täckning |
| 4 | Lägg till HSTS-header i `vercel.json` | 5 min | Säkerhet |
| 5 | Synka `sanitizeInput()` från edge functions till `/api/ai.js` | 1 h | Prompt-injection-skydd |
| 6 | Konsolidera PDF-bibliotek till bara `@react-pdf/renderer` | 4 h | -700 KB bundle |
| 7 | Konfigurera Vite att strippa `console.*` i produktion (`build.terserOptions.compress.drop_console = true`) | 5 min | Mindre bundle, rensare DevTools |
| 8 | Dokumentera AI-routing: vilka anrop går till `/api/ai.js` vs edge functions, och varför | 2 h | Underhållbarhet |
| 9 | Lös migrationskonflikten 20260306130000 – behåll en, byt namn på den andra eller arkivera | 1 h | Drift-stabilitet |
| 10 | Fixa `consultantService.ts` TODO:s (riktiga konsultstats) | 4 h | Konsultverktyg blir användbart |
| 11 | Lägg till tester för 5 viktigaste flöden: login, CV-spara, cover-letter-generering, jobbsökning, GDPR-radering | 12 h | Testtäckning 30 % → trygghet vid refactor |
| 12 | Uppdatera `README.md` – React 19, OpenRouter, faktisk migrationsguide | 30 min | Onboarding-friction |

**Total budget för punkt 1–12: ~30 timmar.**

---

## 7. Vad som INTE ska göras

- **Inte** skriva om backend till mikrotjänster. Supabase + Vercel-functions skalar tillräckligt för målgruppen.
- **Inte** flytta från Zustand till Redux. Storage-snubblar är lokala, inte arkitektoniska.
- **Inte** ersätta React Router med en ny router. Lazy-loading och error boundaries är redan korrekt.
- **Inte** bygga en mobilapp (PWA räcker; portalen är redan responsiv enligt komponentstrukturen).
- **Inte** lägga till fler AI-funktioner innan dödkoden är borta och testtäckningen >40 %.

---

*Rapport genererad 2026-04-27.*
