# STA — Steg till arbete — arkiverad 2026-09-12 (beslut Mikael)

> "STA som projekt ska upphöra, så det ska arkiveras, återanvänd den del av koden
> som kan vara användbar för Rusta och matcha samt kommunkonsulter (det är de kunder
> jag kan se just nu)."

Modulen var flaggavstängd sedan 2026-08-03 (`MODULES.STA`, av som default) och
konsulentvyn saknade route sedan dess. Nu är hela koden flyttad hit med `git mv`
(historiken följer med), flaggan är borttagen, och ingenting i `client/src` refererar
STA längre. **De tio `sta_*`-tabellerna i prod är orörda** — gallring 2 år efter
avslutad inskrivning enligt RETENTION-POLICY (beslut samma dag), schemat lämnas.

## Vad som ligger här

| Katalog | Innehåll | Rader |
|---|---|---|
| `client/src/pages/sta/` | deltagarvy, konsulentvy, dokumentarbetsyta, 27 komponenter, 8 konsulentflikar/hjälpare | 18 753 |
| `client/src/services/` | `staApi.ts` (1 294), `staApi.test.ts` (854), `staAiApi.ts` (92) + test (207), `staPdfExport.ts` (371) | 2 818 |
| `client/src/hooks/useSta.ts` | React Query-hookar över staApi | 604 |
| `client/src/components/focus/pages/FocusStaWizard.tsx` | fokuslägets STA-guide | 200 |
| `e2e/sta.spec.ts` | Playwright — deltagarflöde (skippat) + regressionsvakt för konsulentvyn | 105 |
| `docs/` | fem `sta-*`-planer + STA-FORBATTRINGSFORSLAG | 1 537 |

Räknat med `wc -l` vid flytten. Totalt ~24 000 rader.

**Utbrutet FÖRE flytten, eftersom det inte är STA:** `consultantConsentsApi` och
`revokeConsultantLink` (samtycket och uppsägningen av kopplingen deltagare ↔ konsulent)
bor nu i `client/src/services/konsulentKopplingApi.ts` med eget test. `KonsulentSamtyckeFraga`
och `RevokeConsultantLinkSection` importerar därifrån. RPC:n `revoke_consultant_link` och
tabellen `consultant_consents` är kvar i prod.

**Kvar utanför arkivet, medvetet:** promptarna `sta-document-draft`, `sta-week-summary`
och `sta-doa-sammanfattning` i `client/api/_prompts/sta.js` (Vercel `/api/ai`) och deras
rate-limit-/undantagsrader i `client/api/ai.js`, samt scheman i `client/src/services/aiSchemas.ts`.
Anroparen (`staAiApi.ts`) är arkiverad, så de nås inte från UI:t, men fem testfiler
asserterar på dem. Att ta bort dem är ett eget pass i `ai.js` — inte gjort här för att
inte kollidera med Perplexity-arbetet i samma dag.

## Återbrukskarta — vad som kan bli något för Rusta och matcha och kommunkonsulenter

| STA-del | Fil (rader) | Kandidat för | Kommentar |
|---|---|---|---|
| Arbetsplatsuppföljningar | `pages/sta/components/WorkplaceCard.tsx` (440), `WorkplaceFormModal.tsx` (249), `consultant/WorkplacesTab.tsx` (270), `staApi.ts` → `staWorkplaceFollowupsApi` | AG1-placeringsuppföljningarna (`consultant_work_placement_followups`, 3/6 mån) | AG1 byggdes redan med `WorkplaceFormModal` som förlaga (`PlaceringFormModal.tsx:5`). Uppföljningsfrekvens per plats och "kontaktperson på arbetsplatsen" är det som ännu inte finns i AG1 |
| Frånvaro / närvaro | `components/AbsenceForm.tsx` (254), `consultant/absenceLabels.ts`, `staAbsencesApi` (sjuk/VAB/tillåten/annat + konsulentnotering) | KM-närvaron (`activity_sessions.attendance`) | Kommunens närvaro är per pass; STA:s är per dag med orsak. Orsakskategorierna och "konsulentens notering på frånvaron" saknas i KM och behövs för aktivitetskravets rapportering |
| Snabbanteckningar | `components/QuickNoteForm.tsx` (204), `VoiceInput.tsx` (191), `staQuickNotesApi` med `visibility` (bara konsulent / i rapport / delad med deltagare) | Konsulentjournalen (`consultant_journal`) | Synlighetsnivån per anteckning är det värdefulla — journalen har i dag bara "deltagaren kan läsa". Röstinmatningen är fristående och återanvändbar rakt av |
| Självskattningar | `components/DoaSelfAssessment.tsx` (688), `AssessmentEditor.tsx` (1 132), `assessmentInstruments.ts` (410: DOA, WRI, MOHOST, AWP, AWC), `assessmentPdfExport.ts` (614), `AssessmentSignature.tsx` (120) | R&M-progressionsmätning (leverantören ska visa AF att deltagaren rör sig) | Instrumenten är AF:s egna; DOA-självskattningen med tidsserie (`EnergySparkline.tsx`, `PulseCheckWidget.tsx`, `WeeklyCheckinForm.tsx`) är den enda mätningen i portalen av hur det *går* för deltagaren över tid. Signeringen av arbetsterapeut är STA-specifik |
| Dokumentarbetsytan | `StaDocumentWorkspace.tsx` (155), `components/DocumentDraftPanel.tsx` (454), `consultant/DocumentsTab.tsx` (421), `staDocumentsApi` (utkast → konsulentgranskning → godkänd → inskickad) | AF-rapportering i R&M (periodiska rapporter, slutrapport) | Statuskedjan och "AI skriver utkast, konsulenten godkänner" är exakt R&M:s rapportflöde. Promptarna ligger kvar i `api/_prompts/sta.js` |
| Bulkimport/-inbjudan | `components/BulkImportParticipantsModal.tsx` (574), `bulkImportParser.ts` (218), `BulkInviteParticipantsModal.tsx` (367) | Kommunens onboarding av en hel grupp deltagare | Parsern (klistra in en lista → rader) är generisk; inbjudan går redan via `send-invite-email` |

Det som INTE bör återanvändas: `mockData.ts` (414 rader demo-data), Del 3/4-integrationerna
(STA-programmets delsteg), `StaOnboarding.tsx` (STA-specifik guide), `staDeadlines.ts`
(STA:s 15-vardagarsräknare).

## Regressionsvakten som låg i e2e/sta.spec.ts

Konsulentvyn `/#/konsulent/steg-till-arbete` togs bort 2026-08-03 och ska inte gå att nå:
utan route faller den på App.tsx catch-all → `/#/oversikt`. Den vakten behövs inte längre
som test — det finns ingen kod som kan montera den — men står här som beskrivning ifall
någon flyttar tillbaka `StaConsultant.tsx`.

## Om något ska tillbaka

1. Kopiera (inte flytta) den fil som behövs till sin nya plats under det spår som äger
   behovet (AG, KM, journal) och skriv om den mot dagens tabeller — STA-tabellerna ska
   inte få nya skrivare.
2. Nåbarhetsanalysen (`node client/scripts/dead-code.cjs`) ska visa att filen nås från
   `main.tsx`; annars är det dödkod igen.
3. Rör inte `api/_prompts/sta.js` för att "återanvända" prompten — skriv en ny under
   rätt domän.
