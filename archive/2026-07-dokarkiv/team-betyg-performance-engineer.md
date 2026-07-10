# Performance-engineer — betyg

Lens: Core Web Vitals, laddningstider, React-optimering. Alla rutter `lazy()`-importeras i `App.tsx` med `Suspense` + `RouteErrorBoundary`, så code-splitting på sidnivå är generellt OK. Bottenproblem: 24K-rader `articleData.ts` mock laddas eagerly av flera hooks, tunga formulär/listor utan `useMemo/useCallback`, saknade skeletons.

## Tabell

| ID | Yta | Utseende | Funktionalitet | Användbarhet | Notering |
|---|---|---|---|---|---|
| H1 | /oversikt | 8 | 8 | 8 | Lazy-route + useMemo + react-query summary, snabb |
| H2 | /jobb | 8 | 8 | 8 | Tunn HubPage, lazy-route, query-cache via hub-summary |
| H3 | /karriar | 8 | 8 | 8 | Samma HubPage-template, useKarriarHubSummary cachas |
| H4 | /resurser | 8 | 8 | 8 | Tunn shell, lazy-route OK |
| H5 | /min-vardag | 8 | 8 | 8 | useMinVardagHubSummary cachas, lätt mount |
| D1 | / Dashboard | 8 | 9 | 9 | DashboardSkeleton + react-query + useMemo, exemplariskt |
| D2 | /quests | 7 | 7 | 7 | QuestsTab 353 rader, ingen explicit skeleton |
| JS1 | /job-search Sök | 6 | 7 | 7 | 980 rader, useMemo finns men saknar debounce på query |
| JS2 | /job-search/daily | 6 | 7 | 7 | DailyJobTab via API, saknar skeleton-fallback |
| JS3 | /job-search/saved | 7 | 7 | 7 | useSavedJobs cachas, list-render OK |
| JS4 | /job-search/matches | 5 | 7 | 6 | MatchesTab kör 3 parallella searchJobs+matchningsmatte |
| AP1 | /applications | 6 | 7 | 7 | useApplications cachas, ingen useMemo i page |
| AP2 | /applications/timeline | 6 | 6 | 6 | Tidslinje renderas helt, saknar virtualisering |
| AP3 | /applications/calendar | 6 | 6 | 6 | Kalendervy laddas inline med page |
| AP4 | /applications/contacts | 6 | 6 | 6 | Listrendering utan memo |
| AP5 | /applications/analytics | 6 | 6 | 6 | Charts utan lazy, framer-motion overhead |
| CV1 | /cv | 5 | 7 | 6 | CVBuilder 1084 rader, 0 useMemo, tung autosave-loop |
| CV2 | /cv/my-cvs | 6 | 7 | 7 | useDocuments cachas, OK |
| CV3 | /cv/adapt | 5 | 6 | 6 | JobAdaptPage gör AI-anrop, saknar streaming-feedback |
| CV4 | /cv/ats | 6 | 6 | 6 | ATS-analys synkron, blockar UI vid stora CV |
| CV5 | /cv/tips | 8 | 7 | 8 | Statisk tips-yta, snabb |
| CL1 | /cover-letter | 5 | 7 | 6 | 0 useMemo, mall-array (`coverLetterTemplates` 9.8KB) bundlas |
| CL2 | /cover-letter/my-letters | 7 | 7 | 7 | Listvy via cloud, OK |
| SP1 | /spontanansökan Sök | 5 | 7 | 6 | SearchTab 759 rader, AI-anrop utan streaming |
| SP2 | /spontanansökan/companies | 6 | 7 | 7 | MyCompaniesTab 436 rader, listvy |
| SP3 | /spontanansökan/stats | 7 | 7 | 7 | Statistikvy lätt |
| SJ1 | /interview-simulator | 6 | 8 | 7 | Memo + useCallback, 914 rader, mic-API tungt |
| SJ2 | /salary | 7 | 7 | 7 | Lazy-route OK, statisk content |
| SJ3 | /international | 7 | 7 | 7 | Lazy-route OK, mestadels statisk |
| SJ4 | /linkedin-optimizer | 6 | 7 | 7 | 477 rader, AI-form utan streaming-hook |
| CA1 | /career Arbetsmarknad | 6 | 7 | 7 | LaborMarketTab 295 rader, AF-API cachas |
| CA2 | /career/adaptation | 5 | 7 | 7 | AdaptationTab 1164 rader, useMemo+useCallback OK |
| CA3 | /career/credentials | 6 | 7 | 7 | CredentialsTab 376 rader, OK |
| CA4 | /career/relocation | 6 | 7 | 7 | RelocationTab 521 rader |
| CA5 | /career/plan | 6 | 7 | 7 | PlanTab 713 rader, AI-driven |
| IG1 | /interest-guide | 7 | 8 | 8 | Suspense-fallback, lazy-tabs internt |
| IG2 | /interest-guide/results | 7 | 8 | 8 | useInterestProfile cachas, charts lazy |
| IG3 | /interest-guide/occupations | 6 | 7 | 7 | Occupations-listing, ingen virtualisering |
| IG4 | /interest-guide/explore | 7 | 7 | 7 | Lazy-tab OK |
| IG5 | /interest-guide/history | 7 | 7 | 7 | Historikvy lätt |
| KA1 | /skills-gap-analysis | 5 | 7 | 6 | 875 rader, AI-anrop synkront, blockar |
| KA2 | /personal-brand | 6 | 7 | 7 | Lazy-route, formflöde |
| KA3 | /education | 6 | 7 | 7 | useEducationSearch + debounce, OK |
| KB1 | /knowledge-base För dig | 4 | 7 | 6 | ForYouTab importerar articleData (24K rader) eagerly |
| KB2 | /knowledge-base getting-started | 6 | 7 | 7 | Lazy-tab, lättare innehåll |
| KB3 | /knowledge-base topics | 4 | 7 | 6 | TopicsTab importerar hela mock-arkivet |
| KB4 | /knowledge-base quick-help | 7 | 7 | 7 | Lazy-tab, lätt |
| KB5 | /knowledge-base my-journey | 7 | 7 | 7 | Lazy-tab, journeyData 12KB |
| KB6 | /knowledge-base tools | 7 | 7 | 7 | Lazy-tab, lätt |
| KB7 | /knowledge-base trending | 6 | 6 | 6 | Saknar definierad lazy-tab i page |
| KB8 | /knowledge-base stories | 5 | 7 | 6 | StoriesTab 534 rader, eager mock-import |
| RE1 | /resources | 6 | 7 | 7 | 1329 rader, useMemo OK, listfilter |
| RE2 | /print-resources | 5 | 6 | 6 | Importerar exercises-mock (258KB) eagerly |
| RE3 | /externa-resurser | 4 | 6 | 6 | 3573 rader hårdkodad lista, ingen virtualisering |
| RE4 | /ai-team | 6 | 8 | 7 | Streaming-AI via useAIStream, OK |
| RE5 | /nätverk | 6 | 7 | 7 | Network-page, OK |
| WE1 | /wellness Hälsa | 6 | 7 | 7 | HealthTab 449 rader, 0 page-level useMemo |
| WE2 | /wellness/routines | 6 | 7 | 7 | RoutinesTab 355 rader |
| WE3 | /wellness/cognitive | 6 | 7 | 7 | CognitiveTab 454 rader, övningsbygge |
| WE4 | /wellness/crisis | 7 | 7 | 8 | CrisisTab 397 rader, mest statisk |
| MV1 | /diary | 6 | 7 | 7 | 0 useMemo i page, 4 tab-komponenter laddas eagerly |
| MV2 | /calendar | 6 | 7 | 7 | useCallback finns, ingen virtualisering på vyer |
| MV3 | /exercises | 3 | 7 | 5 | data/exercises.ts 258KB bundlas, AI-API + Supabase synk |
| MV4 | /my-consultant | 6 | 7 | 7 | 959 rader, image-fallback, OK |
| OV1 | /profile | 7 | 8 | 8 | Lazy-loadade sektioner + Suspense, error-boundary |
| OV2 | /settings | 6 | 7 | 7 | helpContent 34KB importeras, ingen lazy |
| OV3 | /help | 7 | 7 | 8 | Statisk FAQ, snabb |

## Sammanfattning

Värsta perf-flaskhalsar: (1) `client/src/services/articleData.ts` på 24 483 rader importeras eagerly från KnowledgeBase-tabbar, useMoodRecommendations, learningService och Exercises — kommer in i nästan varje route-bundle. (2) `client/src/data/exercises.ts` 257 KB / 4 855 rader importeras av Exercises, PrintableResources, contentApi, learningService — slår tillbaka i hub-summaries. (3) `ExternalResources.tsx` 3 573 rader hårdkodad statisk lista utan virtualisering. (4) Tunga formulärsidor (CVBuilder 1084 rader, Settings 892, SkillsGapAnalysis 875, SearchTab spontaneous 759) saknar `useMemo/useCallback` helt och blockar interaktion vid AI-anrop.

Bästa optimeringar: Dashboard har komplett pipeline (skeleton + react-query + useMemo + useFocusMode), Profile har lazy-laddade sektionssegment med Suspense, Hub-shells är tunna och delar `useXxxHubSummary`-cachet, KnowledgeBase har inre `lazy()` per tab. `App.tsx` har konsekvent `LazyRoute` med `RouteErrorBoundary` + `RouteLoadingFallback`.

Top-3 bundles att slimma: (a) Splitta `articleData.ts` per kategori och dynamic-importera vid filter — direkt vinst på alla KB-tabbar, Exercises, mood-rekommendationer. (b) Flytta `exercises.ts` till Supabase-edge `learning-*` (redan finns i `supabase/functions/`) eller chunka per kategori bakom `import()`. (c) `ExternalResources` 3 573 rader bör konverteras till JSON + fetch + virtualiserad lista (reagent-window/tanstack-virtual). Sekundärt: lägg till `LoadingState`/`Skeleton` i AP1–AP5, JS1–JS4, WE1–WE4 där den saknas, och debouncea sökfältet i `JobSearch.SearchTab` (autocomplete-anropen).
