# QA-testare — betyg

Bedömning baserad på kodgranskning av error/loading/empty-states, try/catch, fallbacks och edge cases. Surfaces med AI-anrop får hårdare granskning.

## Tabell

| ID | Yta | Utseende | Funktionalitet | Användbarhet | Notering |
|---|---|---|---|---|---|
| H1 | Översikt-hubben | 7 | 7 | 7 | HubPage-template, men status-data kan saknas vid load |
| H2 | Söka jobb-hubben | 7 | 7 | 7 | Konsistent template; feature-status saknar fallback-test |
| H3 | Karriär-hubben | 7 | 7 | 7 | Samma template, OK |
| H4 | Resurser-hubben | 7 | 7 | 7 | OK, beror på underliggande data-loaders |
| H5 | Min vardag-hubben | 7 | 7 | 7 | OK |
| D1 | Dashboard översikt | 8 | 8 | 8 | DashboardGridSkeleton + ErrorState + WidgetErrorBoundary |
| D2 | Mina Quests | 6 | 6 | 5 | Direkt supabase-anrop, oklart om saknad data hanteras |
| JS1 | Sök (jobs) | 8 | 8 | 8 | LoadingState/ErrorState/EmptySearch importerat — robust |
| JS2 | Dagens jobb | 6 | 6 | 6 | Beroende av AF-API; ingen synlig fallback för 0 jobb |
| JS3 | Sparade jobb | 7 | 7 | 7 | useSavedJobs-hook, troligen empty-state via EmptySearch |
| JS4 | Matchningar | 6 | 6 | 6 | AI-matchning kan misslyckas tyst; behöver fallback-text |
| AP1 | Pipeline | 7 | 7 | 7 | Modal för add/edit; beror på Pipeline-komponent |
| AP2 | Historik | 6 | 6 | 6 | Timeline; ingen synlig empty-state vid 0 ansökningar |
| AP3 | Kalender | 6 | 6 | 6 | Risk för date-fel; saknar tomt-vy |
| AP4 | Kontakter | 6 | 6 | 6 | Standard CRUD, beror på underkomponent |
| AP5 | Statistik | 6 | 6 | 5 | Charts kan krascha vid 0 datapoints |
| CV1 | Skapa CV | 8 | 8 | 8 | Auto-save, draft, beforeunload-warning, showToast-fel |
| CV2 | Mina CV | 7 | 7 | 7 | Versions-lista, restoreVersion har confirm-dialog |
| CV3 | Anpassa | 7 | 7 | 7 | JobAdaptPage; AI-fel hanteras via JobAdaptPanel |
| CV4 | ATS-analys | 7 | 7 | 7 | AI-anrop, beror på ATSAnalysis fallback |
| CV5 | CV-tips | 7 | 7 | 7 | Statisk content, låg risk |
| CL1 | Skriv brev | 7 | 7 | 7 | AI-genererat; beror på CoverLetterWrite error-hantering |
| CL2 | Mina brev | 7 | 7 | 7 | List/CRUD, OK |
| SP1 | Sök företag | 6 | 6 | 6 | Bolagsverket-integration; orgnr-validering måste finnas |
| SP2 | Mina företag | 6 | 6 | 6 | Standard list, beror på status-uppdatering |
| SP3 | Statistik | 5 | 5 | 5 | Chart-risker vid 0 data |
| SJ1 | Intervjuträning | 7 | 8 | 7 | Memo-Timer, callAI try/catch, mic-fallback. AI-fel oklar |
| SJ2 | Lön & Förhandling | 6 | 6 | 6 | Statisk + kalkylator; lite fel-hantering synlig |
| SJ3 | Internationell guide | 6 | 6 | 6 | Mest statisk content, säker |
| SJ4 | LinkedIn-optimering | 7 | 8 | 7 | AI med fallback-strängar vid fel — bra mönster |
| CA1 | Arbetsmarknad | 6 | 6 | 6 | LaborMarketTab; beror på data-källor |
| CA2 | Anpassning | 6 | 6 | 6 | OK |
| CA3 | Credentials | 6 | 6 | 6 | OK |
| CA4 | Flytta | 6 | 6 | 6 | OK |
| CA5 | Karriärplan | 6 | 6 | 6 | Komplex form; saknar synlig validering-test |
| IG1 | Test (interest) | 8 | 8 | 8 | isLoading/error-state, save-indicator, lazy-loading |
| IG2 | Resultat | 7 | 7 | 7 | Beror på sparad data; tomt-vy oklar |
| IG3 | Yrken | 7 | 7 | 7 | OK |
| IG4 | Utforska | 6 | 6 | 6 | OK |
| IG5 | Historik | 7 | 7 | 7 | OK |
| KA1 | Kompetensanalys | 7 | 8 | 7 | useAIStream + cvApi; flera fallbacks, hård att krascha |
| KA2 | Personligt varumärke | 6 | 6 | 6 | 4 tabs; ingen synlig top-level error-handling |
| KA3 | Utbildning | 7 | 7 | 7 | EmptyState/Skeleton importerat; AF/Susa-API kan timeout |
| KB1 | För dig | 7 | 7 | 7 | TabLoader + couldNotLoad-fallback med reload-knapp |
| KB2 | Komma igång | 7 | 7 | 7 | Lazy-load, samma fallback |
| KB3 | Ämnen | 7 | 7 | 7 | OK |
| KB4 | Snabbhjälp | 7 | 7 | 7 | OK |
| KB5 | Min resa | 6 | 6 | 6 | Beror på user-progress; saknar tomt-vy |
| KB6 | Verktyg | 7 | 7 | 7 | OK |
| KB7 | Trendar | 5 | 5 | 5 | Saknas i tab-defs men finns i surfaces — döda länkar? |
| KB8 | Berättelser | 5 | 5 | 5 | Samma — saknas i lazy-imports i KnowledgeBase.tsx |
| RE1 | Mina dokument | 7 | 7 | 7 | Multipla cloud-kallanden, dynamic imports för PDF |
| RE2 | Utskriftsmaterial | 7 | 7 | 7 | useArticles + isGenerating, beror på generateArticlePDF |
| RE3 | Externa resurser | 8 | 7 | 8 | Statisk länk-lista, ingen krash-risk; saknar URL-status |
| RE4 | AI-team | 7 | 7 | 8 | Skip-link, OnboardingModal, useSuggestedAgent, robust |
| RE5 | Nätverk | 6 | 6 | 6 | Wraps NetworkTab; beror på underliggande |
| WE1 | Hälsa | 7 | 7 | 7 | HealthTab, WellnessConsentGate (gdpr-skydd) |
| WE2 | Rutiner | 7 | 7 | 7 | OK |
| WE3 | Kognitiv träning | 7 | 7 | 7 | OK |
| WE4 | Akut stöd | 8 | 8 | 9 | Statiskt innehåll, kritisk info — låg krash-risk |
| MV1 | Dagbok | 7 | 7 | 7 | TabNavigation streak; consent-gate, useDiaryStreaks |
| MV2 | Kalender | 7 | 8 | 7 | error/loading/statusMessage/isSaving — bra state-mgmt |
| MV3 | Övningar | 7 | 7 | 7 | AIAssistant + content-API; beror på hantering |
| MV4 | Min konsulent | 7 | 7 | 7 | LoadingState, supabase-direkt; tomt-vy om ingen konsulent |
| OV1 | Profil | 8 | 8 | 8 | Egen ProfileErrorBoundary med try-igen-knapp, lazy tabs |
| OV2 | Inställningar | 7 | 8 | 7 | isLoadingProfile/isSaving + DeleteAccountSection |
| OV3 | Vanliga frågor | 7 | 7 | 8 | Statisk FAQ med kategorier, säker |

## Sammanfattning

**Värsta bug-risker:** KB7 (Trendar) och KB8 (Berättelser) finns i surface-listan men inte i `tabDefs`/lazy-imports i `KnowledgeBase.tsx` — sannolikt döda eller broken tabs. AP5/SP3 (Statistik-tabs) använder charts utan synligt skydd för 0-datapoints — risk för "NaN" eller tom canvas. JS4 Matchningar och CV4 ATS gör AI-anrop som kan tystfaila utan tydlig user-feedback. JS2 Dagens jobb beror på AF-API utan synlig fallback-text om endpoint är nere.

**Starkaste robusthet:** CVBuilder (CV1) — auto-save, draft-restore, beforeUnload-warning, ConfirmDialog för destruktiva ops, showToast på alla fel. Profile (OV1) — egen ProfileErrorBoundary med "försök igen". Dashboard (D1) — DashboardGridSkeleton + WidgetErrorBoundary isolerar widget-fel. Calendar (MV2) — fullständig error/loading/saving/status-message-matris. LinkedInOptimizer (SJ4) har klassisk AI-fallback-mönster med statiska strängar vid fel.

**Kritiska edge cases att täcka:**
1. AI-API-timeout/500 i CV4, JS4, KA1 — ingen testtäckning i e2e (smoke + auth-only).
2. 0-datapoint charts i AP5, SP3, KA1.
3. Bolagsverket-API-fel i SP1 utan orgnr-validering visar troligen rå error-text.
4. KB7/KB8 verkar vara orphan routes — verifiera om de byggs men inte renderas.
5. AF-API-down i JS1/JS2 — robust ErrorState finns men AF kan returnera 200+tom array (silent empty).
6. Långa CV-fält (>1000 tecken summary) saknar e2e-test för PDF-export.
7. Quest-uppdatering i D2 har direkt supabase-call utan synlig optimistic update — race condition vid snabba klick.

E2E-täckning: endast smoke + cv/cover-letter/dashboard/job-search/auth — saknar wellness, diary, knowledge-base, applications, interest-guide, settings, profile.
