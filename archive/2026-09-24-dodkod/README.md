# Arkiverad dödkod 2026-09-24

Nio filer (3 318 rader) som `node client/scripts/dead-code.cjs` märkte **UTRED**
och som vid kontroll inte väntade på något beslut. Ingen av dem nåddes från
`client/src/main.tsx`, och ingen levande fil importerade dem (kontrollerat med
nåbarhetsanalysen och med sökvägs-grep över `client/src`, `client/api`,
`client/scripts` och `e2e`). De bar 12 av de 28 fel som `typecheck:ceiling`
hade kvar; taket sänktes 28 → 16 i samma ändring.

Sökvägarna under den här katalogen speglar repot: `client/src/hooks/useLearning.ts`
här låg på `client/src/hooks/useLearning.ts`.

## Grupp 1: EU-spårets klientsida (spåret avslutat 2026-09-12)

Skälet i dead-code.cjs var "ROADMAP C4 är pausad (EU-spåret)". Spåret är sedan
2026-09-12 avslutat och de tre `learning-*`-edgefunktionerna är raderade i prod
(`archive/2026-09-eu-utlysning/`), så skälet att vänta fanns inte längre.

| Fil | Rader | Vad den var |
|---|---|---|
| `client/src/hooks/useLearning.ts` | 120 | React Query-hook för personaliserade artiklar/övningar utifrån RIASEC |
| `client/src/services/learningService.ts` | 550 | Tjänsten bakom hooken (artiklar, övningar, lärandespår) — 5 typfel |
| `client/src/services/interestPersonalization.ts` | 443 | RIASEC → innehållsrekommendationer; importerades bara av learningService — 1 typfel |
| `client/src/services/afEnrichmentsApi.ts` | 320 | Klient mot AF:s JobAd Enrichments; noll importörer sedan den skrevs 2026-02-27 |

## Grupp 2: "Rörd de senaste 7 dagarna" — men bara av ett mekaniskt svep

Den enda ändringen den senaste veckan var commit `850edc1c` (2026-09-20, KA2),
som bytte `queryKey: ['x']` mot `queryKey: nyckel(['x'])` i hela `src/` —
ett cachenyckelsvep, inget pågående bygge. `interestJobMatching.ts` rördes
senast 2026-09-02 (SA6, poänggolvet) och följer med `useJobMatching`, sin enda
konsument.

| Fil | Rader | Vad den var |
|---|---|---|
| `client/src/components/focus/steps/FocusCV.tsx` | 557 | Äldre fokusguidens CV-steg. Den levande vägen är `components/cv/FocusCVBuilder.tsx` (monterad i `CVPage.tsx`) — 3 typfel |
| `client/src/hooks/useJobMatching.ts` | 467 | Matchning av Platsbanken-annonser mot CV + RIASEC + önskade yrken — 2 typfel |
| `client/src/services/interestJobMatching.ts` | 380 | RIASEC-poäng per annons (`matchJobsToInterests`, `quickInterestMatch`) |
| `client/src/services/interestJobMatching.test.ts` | 71 | SA6-testet för poänggolvet — 1 typfel. Testet sa själv att fixen "inte påverkar drift förrän hooken kopplas in" |
| `client/src/hooks/useMoodRecommendations.ts` | 410 | Artikelrekommendationer efter dagens humör (`mood_logs`). Obs: rad ~`.eq('log_date', …toISOString().split('T')[0])` räknar "idag" i UTC — byt till `formatLocalDate(new Date())` om den tas tillbaka |

## Grupp 3: komponenter som bara barrel-filer höll vid liv

`dead-code.cjs` räknade dem som nåbara, eftersom `components/diary/index.ts`
och `components/layout/index.ts` exporterade dem. Men ingen renderade dem
(`grep -rn "<DailyTask\|<PageTabs\|<PageHeader" client/src` gav bara
`PageHeader`s eget anrop av `PageTabs` inne i samma fil).

| Fil | Rader | Vad den var |
|---|---|---|
| `client/src/components/diary/DailyTask.tsx` | 327 | "Dagens uppgift"-kortet i dagboken. Raden i `components/diary/index.ts` togs bort |
| `client/src/components/layout/PageTabs.tsx` | 464 | Komponenterna `PageTabs` och `PageHeader` (flikraden och sidhuvudet före skenan 2026-08-17). **Typerna `Tab` och `PageStat` ligger kvar** i `client/src/components/layout/PageTabs.tsx`, som nu bara innehåller dem — 15 filer importerar dem. `components/layout/index.ts` exporterar bara `type Tab` därifrån |

Samtidigt togs de locale-nycklar bort som bara de här två läste:
`diary.dailyTask.*` (19 nycklar) och `layout.pageTabs.*` (2). Tar du tillbaka
en fil måste nycklarna tillbaka i båda `sv.json` och `en.json` — hämta dem ur
git-historiken (`git show <commit>~1:client/src/i18n/locales/sv.json`).
`dailyTaskDate`/`dailyTaskIndex`/`dailyTaskCompleted` i
`USER_SCOPED_STORAGE_KEYS` (`utils/safeStorage.ts`) ligger kvar med flit:
de rensar gamla värden ur webbläsare där kortet en gång kördes.

## Ta tillbaka en fil

```bash
mv "archive/2026-09-24-dodkod/client/src/<sökväg>" "client/src/<sökväg>"
```

Flytta beroenden ihop: `useLearning` → `learningService` → `interestPersonalization`,
och `useJobMatching` → `interestJobMatching` (+ testet). Kör sedan
`cd client && npm run typecheck:ceiling` — typfelen följer med tillbaka och
måste betalas, taket höjs inte. För `useMoodRecommendations`: grinden
`src/services/idagLokalt.test.ts` kräver då raden
`'hooks/useMoodRecommendations.ts': 1` i `TILLATNA` igen — eller, bättre,
rätta UTC-datumet så raden inte behövs.

Montera aldrig en fil härifrån utan att först kontrollera tabellerna den
läser mot prod-schemat (`npm run lint:schema` efter flytten).

## Kvar i src som UTRED (produktbeslut, inte arkiverat)

Energifunktionen (C19), jobbdelningen (C19) och notiscentret (H12) ligger kvar
i `client/src` och väntar på beslut av Mikael.
