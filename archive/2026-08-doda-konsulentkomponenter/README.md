# Arkiverat: sex komponenter i `client/src/components/consultant/` (2026-08-31)

Roadmappost **KK2**. Sex filer, 1 587 rader: `ActionPlan.tsx` (702),
`IncomingSharedJobs.tsx` (271), `ParticipantList.tsx` (232),
`ConsultantRequestBanner.tsx` (176), `RecentActivity.tsx` (131),
`ConsultantStats.tsx` (75).

## Varför

**Noll importörer utanför sig själva, verifierat mot faktiska `import`-satser
och mot en andra källa.** En `grep` efter varje filnamn i `client/src` gav
ingen träff utanför komponentens egen fil och den nu borttagna barrel-filen
`components/consultant/index.ts`. `node client/scripts/dead-code.cjs` (körd
från `client/`) placerar samtliga sex under onåbar kod från `src/main.tsx`
(`ActionPlan`, `ConsultantRequestBanner`, `RecentActivity`, `ParticipantList`
och barreln själv i gruppen ARKIVERA; `ConsultantStats` och
`IncomingSharedJobs` i UTRED — färskhetsvakten flaggar dem för att de rörts
den senaste veckan, inte för att de är nåbara. Se avsnittet om
`ConsultantStats` nedan för varför den ändå arkiveras nu.)

**`grep -rn "ComponentName"` mot filnamn ensam duger inte i det här repot.**
`ConsultantStats` gav falska träffar på `useConsultantStats` i
`hooks/useSta.ts` — ett annat namn med samma understräng — vilket kontrollerades
och avfärdades. `RecentActivity` och `ActionPlan` gav träffar på likanämnda
lokala funktioner/typer i andra filer (`ApplicationsAnalytics.tsx`,
`OverviewTab.tsx`, `careerApi.ts` m.fl.) som inte importerar från
`components/consultant`. Varje träff kontrollerades mot den faktiska
`import`-satsen, inte mot förekomsten av strängen.

## Barrel-filen

`components/consultant/index.ts` exporterade bara två av mappens filer
(`ParticipantJournal`, `ActionPlan`) — och hade **noll importörer själv**:
`grep -rn "components/consultant['"]"` (utan vidare sökväg) gav noll träffar
i hela `client/src`. Barreln är alltså inte det som höll dessa sex filer
"vid liv" för en vanlig importsökning (ingen importerar den ändå), men den är
exakt den mekanism som lärdomen från 2026-08-04 varnar för: en `grep` efter
`ActionPlan` hittar barrelns export-rad och kan felaktigt rapporteras som "har
importör". Barreln är därför **borttagen helt** (inte arkiverad — den bar
ingen egen logik, bara två re-exportrader) i stället för städad, eftersom
inget kvarvarande i mappen används utifrån.

## `ParticipantJournal.tsx` — RÖRD INTE, ligger kvar i `components/consultant/`

Beslut väntar hos Mikael: filen är en fullt färdig anteckningsyta med
kategorier, redigering och radering, medan `ParticipantDetailPage` faktiskt
kör en enklare textarea som alltid sparar `category: 'GENERAL'`. Frågan är om
`ParticipantJournal` ska ersätta textarean eller arkiveras. Tills det beslutet
finns ligger filen kvar orörd i `components/consultant/` — även om den, efter
att barreln togs bort, också visar noll importörer. Räkna inte det som ett nytt
argument för att arkivera den; premissen (beslut pågår) är oförändrad.

## Notera: `ConsultantStats.tsx` fick en kontrastfix samma dag, innan den
## bekräftades död

En tidigare insats samma dag (2026-08-31) rättade kontrasten i
`ConsultantStats.tsx` innan filens nåbarhet kontrollerades. Det är samma
felklass som lärdomen från 2026-08-09: ett WCAG-svep skrev 58 rader i
15 onåbara filer eftersom svepet gick över hela `src/` utan att filtrera på
nåbarhet först. Kontrastfixen är harmlös (filen arkiveras, inte raderas — koden
finns kvar och rättelsen med den om filen någon gång återupplivas), men den är
ett bevis till på att nåbarhet ska kontrolleras **före** ett svep, inte efter.
Skriv aldrig i en fil innan du vet att någon kör den.

## Vid återupplivning

Filerna flyttades rakt av utan ändringar (utöver den kontrastfix som redan låg
i `ConsultantStats.tsx` före arkiveringen). Ingen av dem har testfiler — sökt
och bekräftat att `*.test.tsx` för dessa sex namn inte fanns i
`components/consultant/` vid arkiveringstillfället. Kompilerades senast mot
React 19 / TypeScript 5.9 vid arkiveringsdatumet ovan. Kontrollera importer och
schema på nytt innan någon av dem monteras — särskilt `IncomingSharedJobs.tsx`
och `ConsultantRequestBanner.tsx`, som pratar med `jobSharingService.ts`
respektive konsultkopplings-RPC:er som kan ha ändrats sedan dess.
