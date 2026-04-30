# Fullstack-utvecklare — betyg

Lins: React/TypeScript/Supabase-integration, kodkvalitet, separation of concerns, typsäkerhet.

Skala: 1-10 där 9-10 = exemplarisk, 7-8 = solid modulär, 5-6 = ok men spretig, 3-4 = monolit/skuld, 1-2 = brand.

## Tabell

| ID | Yta | Utseende | Funktionalitet | Användbarhet | Notering |
|---|---|---|---|---|---|
| H1 | /oversikt | 8 | 7 | 7 | HubOverview 379 LOC, useMemo, hub-kort återanvänt |
| H2 | /jobb | 9 | 8 | 9 | JobsokHub 133 LOC, ren HubPage-template |
| H3 | /karriar | 9 | 8 | 9 | KarriarHub 96 LOC, samma template, lättskött |
| H4 | /resurser | 9 | 8 | 9 | ResurserHub 107 LOC, konsekvent mall |
| H5 | /min-vardag | 9 | 8 | 9 | MinVardagHub 116 LOC, samma DRY-mönster |
| D1 | / Dashboard | 7 | 7 | 7 | Dashboard.tsx 453 LOC, bra hooks-uppdelning |
| D2 | /quests | 6 | 6 | 6 | QuestsTab 353 LOC, supabase-direkt i komponent |
| JS1 | /job-search | 4 | 5 | 4 | JobSearch.tsx 980 LOC, hårdkodad REGIONS-lista inline |
| JS2 | /job-search/daily | 6 | 6 | 6 | DailyJobTab extraherad, bra |
| JS3 | /job-search/saved | 6 | 6 | 6 | Återanvänder useSavedJobs-hook |
| JS4 | /job-search/matches | 6 | 6 | 6 | MatchesTab extraherad |
| AP1 | /applications | 8 | 8 | 8 | Applications.tsx 136 LOC, ren router+modal |
| AP2 | /applications/timeline | 7 | 7 | 7 | Komponent extraherad till ApplicationsTimeline |
| AP3 | /applications/calendar | 7 | 7 | 7 | ApplicationsCalendar isolerad |
| AP4 | /applications/contacts | 7 | 7 | 7 | ApplicationsContacts isolerad |
| AP5 | /applications/analytics | 7 | 7 | 7 | ApplicationsAnalytics isolerad |
| CV1 | /cv | 8 | 8 | 8 | CVPage 67 LOC, ren router; FocusMode-gren clean |
| CV2 | /cv/my-cvs | 7 | 7 | 7 | MyCVs-komponent extraherad |
| CV3 | /cv/adapt | 6 | 6 | 6 | JobAdaptPage 194 LOC, ok men samlad |
| CV4 | /cv/ats | 7 | 7 | 7 | ATSAnalysis-komponent isolerad |
| CV5 | /cv/tips | 8 | 7 | 8 | CVTips lättviktig |
| CV-x | CVBuilder (inre) | 4 | 5 | 4 | 1084 LOC, useState x16, monolit-form |
| CL1 | /cover-letter | 8 | 7 | 8 | CoverLetterPage 43 LOC, ren router |
| CL2 | /cover-letter/my-letters | 7 | 7 | 7 | CoverLetterMyLetters extraherad |
| SP1 | /spontanansökan | 4 | 5 | 4 | SearchTab 759 LOC, blandar AF+Bolagsverket+UI |
| SP2 | /spontanansökan/companies | 6 | 6 | 6 | MyCompaniesTab 436 LOC, supabase-koppling |
| SP3 | /spontanansökan/stats | 6 | 6 | 6 | StatsTab 252 LOC, ren visualisering |
| SJ1 | /interview-simulator | 4 | 5 | 4 | 914 LOC, useState x14, useEffect x3, monolit |
| SJ2 | /salary | 8 | 7 | 8 | Salary.tsx 44 LOC, ren router |
| SJ3 | /international | 8 | 7 | 8 | International.tsx 44 LOC, ren router |
| SJ4 | /linkedin-optimizer | 5 | 6 | 5 | 477 LOC, useState x9, samlad form-logik |
| CA1 | /career | 8 | 7 | 8 | Career.tsx 63 LOC, ren router + tracking |
| CA2 | /career/adaptation | 3 | 5 | 3 | AdaptationTab 1164 LOC, 7-kategori monolit |
| CA3 | /career/credentials | 6 | 7 | 6 | CredentialsTab 376 LOC, hårdkodad lista |
| CA4 | /career/relocation | 5 | 6 | 5 | RelocationTab 521 LOC, blandar API+UI |
| CA5 | /career/plan | 4 | 5 | 4 | PlanTab 713 LOC, milestone+goal+plan ihop |
| IG1 | /interest-guide | 9 | 8 | 9 | InterestGuide 59 LOC, lazy tabs, ren |
| IG2 | /interest-guide/results | 5 | 6 | 5 | ResultsTab 545 LOC, många chart-states |
| IG3 | /interest-guide/occupations | 5 | 6 | 5 | OccupationsTab 543 LOC, sökning+filter ihop |
| IG4 | /interest-guide/explore | 6 | 6 | 6 | ExploreTab 385 LOC, hanterbar |
| IG5 | /interest-guide/history | 7 | 7 | 7 | HistoryTab 285 LOC, ren lista |
| KA1 | /skills-gap-analysis | 4 | 6 | 4 | 875 LOC, AI-stream + cv + plan + favoriter |
| KA2 | /personal-brand | 8 | 7 | 8 | PersonalBrand.tsx 47 LOC, ren router |
| KA3 | /education | 6 | 6 | 6 | Education.tsx 646 LOC, useEducationSearch hjälper |
| KB1 | /knowledge-base | 7 | 7 | 7 | KnowledgeBase 191 LOC, lazy tabs, ?tab=-routing |
| KB2 | KB getting-started | 7 | 7 | 7 | Lazy tabkomponent |
| KB3 | KB topics | 7 | 7 | 7 | Lazy tabkomponent |
| KB4 | KB quick-help | 7 | 7 | 7 | Lazy tabkomponent |
| KB5 | KB my-journey | 7 | 7 | 7 | Lazy tabkomponent |
| KB6 | KB tools | 7 | 7 | 7 | Lazy tabkomponent |
| KB7 | KB trending | 5 | 5 | 5 | Saknas i nuvarande tabDefs - dödflik? |
| KB8 | KB stories | 5 | 6 | 5 | StoriesTab 534 LOC, hårdkodad story-data |
| RE1 | /resources | 3 | 5 | 3 | Resources.tsx 1329 LOC, useState x14, sjukt blandat |
| RE2 | /print-resources | 6 | 6 | 6 | PrintableResources 432 LOC, dynamic-import bra |
| RE3 | /externa-resurser | 4 | 7 | 5 | ExternalResources 3573 LOC, statisk länk-databas |
| RE4 | /ai-team | 8 | 8 | 8 | AITeam 160 LOC, Zustand-store + komponenter |
| RE5 | /nätverk | 9 | 7 | 9 | Network.tsx 22 LOC, wrap av NetworkTab |
| WE1 | /wellness | 8 | 7 | 8 | Wellness.tsx 49 LOC, ren router |
| WE2 | /wellness/routines | 6 | 6 | 6 | RoutinesTab 355 LOC, ok |
| WE3 | /wellness/cognitive | 5 | 6 | 5 | CognitiveTab 454 LOC, useState-tung |
| WE4 | /wellness/crisis | 6 | 6 | 6 | CrisisTab 397 LOC, statisk innehållsbias |
| MV1 | /diary | 7 | 7 | 7 | Diary 220 LOC, 4 tab-komponenter extraherade |
| MV2 | /calendar | 6 | 6 | 6 | Calendar 431 LOC, useState x8, calendarApi-anrop |
| MV3 | /exercises | 5 | 6 | 5 | Exercises 834 LOC, kategori-färg-monolit |
| MV4 | /my-consultant | 4 | 6 | 4 | MyConsultant 959 LOC, supabase direkt + form |
| OV1 | /profile | 8 | 8 | 8 | Profile.tsx 181 LOC, lazy tabs + ErrorBoundary |
| OV2 | /settings | 5 | 6 | 5 | Settings 892 LOC, useState x14, sektion-monolit |
| OV3 | /help | 8 | 7 | 8 | Help.tsx 186 LOC, deklarativ FAQ-data |

## Sammanfattning

**Värsta tekniska skuld:**
1. `Resources.tsx` (1329 LOC) — blandar savedJobs, articleBookmarks, cv, coverLetter, interest, dynamic PDF-export i en fil. Behöver splittras i 4-5 sektioner.
2. `career/AdaptationTab.tsx` (1164 LOC) — 7 kategorier × N-checkbox-options + AI + export i samma komponent. Klassisk god-page.
3. `CVBuilder.tsx` (1084 LOC), `JobSearch.tsx` (980 LOC), `MyConsultant.tsx` (959 LOC), `InterviewSimulator.tsx` (914 LOC), `Settings.tsx` (892 LOC), `SkillsGapAnalysis.tsx` (875 LOC) — alla god-pages med 10+ useState.
4. `ExternalResources.tsx` (3573 LOC) — egentligen mest data men 50+ ikon-imports och inline-array borde flyttas till `data/`-katalog.

**Renaste kod:** Hub-systemet (`HubPage.tsx` + 4 hub-shells á ~100 LOC), `Network.tsx`, `Wellness.tsx`/`Career.tsx`/`InterestGuide.tsx`/`Salary.tsx`/`International.tsx`/`PersonalBrand.tsx`/`CoverLetterPage.tsx`/`CVPage.tsx` — alla under 70 LOC och rena router-shells. `Applications.tsx` är guldstandard för router+modal-pattern. `Profile.tsx` har proper ErrorBoundary + lazy sections.

**Type safety:** Bra överlag — endast ~30 `any`-träffar i pages, mest i konsulent-tabs och privacy-policy. Inga raw `any` i hot paths.

**Top-3 refactor-kandidater:**
1. **Resources.tsx → splitta i 5 mindre komponenter** (SavedJobsList, ArticleBookmarks, CVList, CoverLetterList, InterestResults) bakom Tabs eller Accordion.
2. **AdaptationTab → extrahera kategori-konfig till `data/adaptationCategories.ts`** + bryt ut CategorySection-komponent. Spar ~600 LOC.
3. **CVBuilder/InterviewSimulator/MyConsultant → state-extraktion till custom hooks** (`useCVBuilderState`, `useInterviewSession`, `useConsultantConnection`). Halverar pages-LOC och möjliggör tester.

**Övrigt:** Konsekvent `PageLayout`-användning (alla sidor utom landing/auth ärver denna), `useTranslation` täckt, lazy-loading väl orkestrerad i `App.tsx`. Hub-arkitekturen är **förebild** — om alla sidor följde dess DRY-template skulle kodbasen krympa märkbart.
