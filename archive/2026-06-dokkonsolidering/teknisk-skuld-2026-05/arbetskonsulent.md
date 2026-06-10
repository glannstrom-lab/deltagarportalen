# Teknisk skuld — Konsulent-funktionalitet

**Granskad av:** arbetskonsulent (15 års erfarenhet av att coacha arbetssökande)
**Datum:** 2026-05-09
**Scope:** `/consultant/*`-routet, tabellen `consultant_*`, `MyConsultant`-vyn samt hubb-widgeten `ConsultantWidget`.

> **Sammanfattningsvis:** Konsulentportalen har en imponerande bredd (KPI-dashboard, deltagarlistor, SMART-mål, journal, meddelandetråd med realtime, möten, AI-coach-assistent, PDF-rapporter). Men där deltagaren faktiskt sitter — i CV-byggaren, intervjusimulatorn, jobbsökmodulen, dagboken, AF-jobbflödet — är konsulenten **blind**. Mål och anteckningar är frikopplade från det operativa arbetet. Resultatet är att "uppföljning" bara ser uppföljningen — inte själva arbetet.

---

## Vad konsulenten kan göra idag

### Routes och åtkomstkontroll
- `client/src/App.tsx:287-291` — `/consultant/*` skyddas av `PrivateRoute` med rollkrav `CONSULTANT | ADMIN | SUPERADMIN`. Bra.
- Layout: `client/src/pages/Consultant.tsx` med 6 flikar definierade i `client/src/data/consultantTabs.ts`.

### Sex flikar (alla riktiga, alla kopplade till Supabase)

| Flik | Fil | Funktion | Skick |
|------|-----|----------|-------|
| Översikt | `pages/consultant/OverviewTab.tsx` | KPI:er (totalt, behöver uppmärksamhet, CV-snitt, möten denna vecka), trafikljus per deltagare, Quick Actions, Quick Notes | Levande data |
| Deltagare | `pages/consultant/ParticipantsTab.tsx` | Sök/filter/sortera, grid+list-vy, bulk-actions (meddelande, tagg, exportera, statusändring), CV-score visad | Levande data |
| Deltagardetalj | `pages/consultant/ParticipantDetailPage.tsx` | Profilkort, Quick Stats, Mål (SMART), Journal/anteckningar, Timeline | Mest levande, **timeline är hårdkodad mock** (rad 304-310) |
| Rapporter | `pages/consultant/AnalyticsTab.tsx` | Trender, kohorter, måluppfyllnad, PDF-export via `ReportGeneratorDialog` | Funktionellt, men `monthlyProgress` i `OverviewTab.tsx:457-464` är hårdkodad mock |
| Kommunikation | `pages/consultant/CommunicationTab.tsx` | Realtime-chatt (Supabase channel), 3 quick-templates, möteshantering, mötestyper (video/telefon/fysisk) | Bra implementerat |
| Resurser | `pages/consultant/ResourcesTab.tsx` | Mall-bibliotek för SMART-mål, jobbsamlingar, best practices | Halvfungerande — "tilldela mål"-knappen kastar bara en `alert()` (rad 811) |
| Inställningar | `pages/consultant/SettingsTab.tsx` | Notiser, signatur, default-vy | Standard |

### Datakällor (varifrån konsulenten ser deltagaren)
View `consultant_dashboard_participants` (007_consultant_dashboard.sql) aggregerar per deltagare:
- Profilfält, status, prioritet, `consultant_notes`-text
- `has_cv` + `ats_score` + `cv_updated_at` (från `cvs`-tabellen)
- `completed_interest_test` + `holland_code` (från `interest_results`)
- `saved_jobs_count` (från `saved_jobs`)
- `notes_count` + `last_note_date` (från `consultant_notes`)
- `last_login` (från `auth.users.last_sign_in_at`)

Övriga konsulent-tabeller: `consultant_participants` (kopplingen), `consultant_messages`, `consultant_meetings`, `consultant_goals`, `consultant_journal`, `consultant_placements`, `consultant_goal_templates`, `consultant_job_collections`, `consultant_settings`, `consultant_requests`.

### Backend-funktioner som finns men inte används av konsulenten
- AF-edge functions: `af-jobsearch`, `af-historical`, `af-trends`, `af-taxonomy`, `af-jobed`, `af-enrichments` — exponerade via `client/src/services/afTrendsApi.ts` & `afTaxonomyApi.ts`, men **konsulentvyn använder dem inte**.
- `bolagsverket`-edge function (företagsdata) — kan inte nås från konsulentvyn.
- `consultant_placements`-tabellen (placerade i jobb + 3/6m-uppföljning) — definierad i schemat men **inget UI använder den**.

### MyConsultant-sidan (deltagarens motpol)
- `client/src/pages/MyConsultant.tsx` visar konsulentens kontaktinfo, nästa möte, "delad info"-sektion (kategorier: progress, cv, goals, activity, wellbeing) med expanderbara cards och `isShared`-flagga per fält.
- Ger transparens till deltagaren — bra GDPR-arkitektur.
- `ConsultantWidget` (Min-Vardag-hub) länkar in till `/my-consultant`.

---

## Skuld: saknade verktyg

### 1. Ingen integration mot Arbetsförmedlingen (AF) i konsulentvyn — STOR LUCKA
**Problem:** I verkliga livet är AF central för långtidsarbetslösa. Deadlines för aktivitetsrapport (varje månad), handlingsplan, planeringssamtal — allt detta ligger på konsulentens bord. Inget av det syns i Deltagarportalen.

- Inga AF-deadlines på dashboarden ("Anna ska lämna aktivitetsrapport om 3 dagar")
- Ingen koppling deltagare → AF-handlingsplanens steg
- Ingen export av aktiviteter på Deltagarportalen → format som AF-handläggare förstår
- AF-edge functions finns men används inte i `/consultant/*`

**Konsekvens:** Konsulenten har två system öppna parallellt och tappar kontroll. Deltagarportalen blir ett extra system snarare än en huvudplats.

### 2. Inget operativt fönster mot deltagarens faktiska arbete
- Konsulenten ser **att** deltagaren har ett CV med ATS-score 65 — men kan inte öppna CV:t och kommentera
- Konsulenten ser **att** deltagaren har 12 sparade jobb — men kan inte se vilka, eller vilka som ansökts
- Inga ansökningar (sent/draft/awaiting answer/intervjuinbjuden/avslag) syns i konsulentvyn
- Konsulenten kan inte se intervjusimulatorns historik (vilka roller har deltagaren övat på, vilken score?)
- Konsulenten kan inte se kompetensgapsanalysen (`SkillsGapAnalysis.tsx`) — ändå pratar persona-filen explicit om "gap mot drömjobb"

**Persona-perspektivet:** Mall-frågan från `arbetskonsulent.md` är "går det att följa upp deltagarens framsteg?" — svar: bara på övergripande KPI-nivå.

### 3. Mål-tilldelning är dödkod
`ResourcesTab.tsx:811` — knappen "Tilldela mål till deltagare" kastar bara `alert('Funktionen för att tilldela mål till deltagare kommer snart!')`. Hela mall-biblioteket är därmed låst tills någon kopplar in `consultant_goals`-insert.

### 4. Timeline i deltagardetalj är hårdkodad mock
`ParticipantDetailPage.tsx:304-310` — fem hårdkodade events ("Uppdaterade CV", "Sparade 3 nya jobb", etc.) visas alltid, oavsett vad som faktiskt hänt. Konsulenten kan tolka det som riktig data och fatta beslut på falska premisser. **Detta är en allvarlig bugg ur uppföljningssynpunkt.**

### 5. Möten saknar viktiga delar för rätt uppföljning
- Inget agenda-fält (även om `notes` finns)
- Ingen automatisk för-/efter-möte-checklista
- Ingen koppling möte ↔ behandlade mål
- Ingen mötesanteckning som auto-skapar journalpost ("Beslutat: börja CV-bygge denna vecka")
- Möten skapas men `status = 'completed'` syns aldrig — flödet att "stänga" möten saknas
- Ingen kalendersync (Google Calendar API finns i `api/google-calendar.js` men ingen koppling i konsulentvyn)

### 6. Inga riktiga notifieringar till konsulenten
Persona frågar: "Sparar detta tid för konsulenten?" — Idag måste konsulenten själv öppna översikten för att se "behöver uppmärksamhet". Saknas:
- E-postavisering: "Anna har inte loggat in på 14 dagar"
- E-postavisering: "Erik har skickat ett meddelande till dig"
- Push-notifiering vid nytt meddelande (hooks finns för deltagaren men inte koppling för konsulenter specifikt)
- Realtime trigger för ouppfyllda mål med deadline idag

`SettingsTab.tsx` har toggles för `email_notifications`/`participant_activity_alerts` men ingen backend-kopplingsfunktion (jämför `client/api/job-alerts.js` som finns för deltagare-alerts — motsvarande saknas för konsulenter).

### 7. Ingen multi-konsulent / team-vy
- Tabellen `consultant_participants` har `assigned_by` men inget UI för:
  - Lista alla konsulenter inom organisationen
  - Flytta deltagare mellan konsulenter (t.ex. vid sjukskrivning)
  - Backup-konsulent / vikarie
  - Caseload-jämförelse (vem har för många deltagare?)
- `SettingsTab` listar `TeamMember`-typ men hämtningen är ofullständig

### 8. Saknade konsulentverktyg

| Behov | Status |
|-------|--------|
| Anteckningar/journal | Finns (`consultant_journal`) |
| Mötesplanering | Finns men grunt (ingen agenda/checklista) |
| Framstegsrapportering | Finns (PDF-export) — men data delvis mock |
| Intervjuförberedelse-checklistor | **Saknas** — bara en kategori i resursfliken, inget riktigt verktyg |
| AF-deadlines | **Saknas helt** |
| Spontanansökan-stöd (företagslistor) | **Saknas** — `bolagsverket`-edge function finns men ingen länk |
| Lönesamtal/lönecheck | **Saknas** |
| Kris-protokoll (suicidrisk, akut psykisk ohälsa) | **Saknas** — `wellness/CrisisTab.tsx` finns för deltagaren men ingen eskaleringsväg till konsulenten |
| Anhörig-/läkarintygshantering | **Saknas** |
| Praktik/arbetsträning-spårning | **Saknas** trots att Sverige bygger på det |
| Tolksamtal-bokning (många deltagare har annan modersmål) | **Saknas** |
| Placement-uppföljning 3m/6m | Tabell finns (`consultant_placements`), **UI saknas** |

### 9. Mobilfunktionalitet är begränsad
- `pages/consultant/*.tsx` använder `lg:`-breakpoints men det är desktop-first
- `CommunicationTab.tsx:937-1018` har en lg:grid-cols-12-layout — under 1024px kollapsar den men chat-tråden får hela kolumnen i 600px höjd, vilket fungerar men är inte mobil-optimerat
- Ingen `HubBottomNav`-motsvarighet för konsulent (de har ingen 5-hub-shell)
- Tabell-vyn (`ParticipantsTab` list-mode) overflowar på mobil
- Persona-filen pratar om "tidseffektivitet" — konsulenter rör sig ofta mellan möten, vänteperioder, hembesök. Mobil måste fungera utmärkt. Det gör den inte idag.

### 10. Ingen onboarding eller hjälpdokumentation för konsulent
- `client/src/data/helpContent.ts` har bara en `myConsultant`-sektion (för deltagarens vy av konsulenten), inget för konsulenten själv
- `OnboardingFlow.tsx` är deltagarspecifik
- Ny konsulent som loggar in får 0 vägledning — ingen rundtur, ingen "första steg"-checklista, ingen exempel-deltagare

---

## Skuld: data konsulenten saknar

Konsulenten ser idag **status om deltagaren** men saknar **innehållet i deltagarens arbete**.

### Saknad i `consultant_dashboard_participants` view (eller annan källa)
- **Antal ansökningar** (skickade / avslag / inbjuden / pågående). `applications`-tabell finns? — borde aggregeras hit.
- **Senaste CV-version** + datum för senaste ändring (har vi `cv_updated_at` men ej versionshistorik)
- **Vilka jobb** är sparade (bara antalet idag)
- **Intervjusimulator-historik** (datum, roll, score, AI-feedback)
- **Diary/dagbok-utdrag** — endast efter `participant_data_sharing.share_wellness_data = true`
- **Energinivå-trend** (mood_logs över tid) — endast efter consent
- **Aktivitetsmönster** (loggat in vilka dagar, använt vilka funktioner)
- **AF-status** (skriven in på AF? aktivitetsstöd? programdeltagare?)

### Datafält som syns men är osanna eller ofullständiga
- `monthlyProgress` i `OverviewTab.tsx:457-464` — hårdkodad `[Jan: 45, Feb: 52, Mar: 58, Apr: 63, Maj: 70]`
- `averageTimeToPlacement: 45` — hårdkodad i samma blockt
- `Timeline`-events i `ParticipantDetailPage` — alltid samma 5 mock-events

---

## Skuld: GDPR/access-kontroll

### Bra
- `participant_data_sharing`-tabellen (20260328100000_health_data_consent.sql) ger granulär opt-in: `share_health_data` + `share_wellness_data`
- RLS-policies på `interest_results` och `mood_logs` kräver att konsulenten är listad i `participant_data_sharing` med rätt flagga
- `data_sharing_audit`-tabellen + trigger loggar alla ändringar (GDPR Art. 30)
- `DataSharingSettings.tsx` ger deltagaren UI att slå av/på delning
- `MyConsultant.tsx` har `isShared`-flagga per delad info

### Brister
- **CV och `cvs`-tabellen** saknar motsvarande consent-grind. `consultant_dashboard_participants`-vyn exponerar `ats_score` och `has_cv` utan att kontrollera om deltagaren samtyckt till att konsulenten ser det. Sannolikt OK eftersom CV är arbetsmarknadsdata, men det är inte explicit dokumenterat.
- **`saved_jobs_count`** exponeras utan consent-check
- **`consultant_journal`** — konsulenten kan skriva känsliga anteckningar om deltagaren utan att deltagaren ser dem. **Deltagaren har idag ingen GDPR Art. 15 right of access till konsulentens journal om sig själv.** Detta är problematiskt.
- **Ingen retention-policy** dokumenterad — när tas anteckningar bort efter att deltagaren har skrivits ut (`status = 'COMPLETED'`)?
- **Ingen åtkomstlogg** för konsulent. Vilka deltagardata har konsulenten faktiskt visat? Audit_logs-tabellen finns (007) men loggar bara rolländringar. Att läsa data loggas inte. Vid en GDPR-incident kan vi inte visa vem som tittat på vad.
- **Bulk-export i `BulkActionsDialog`** — konsulenten kan exportera flera deltagares data samtidigt. Detta är en hög risk-vektor som inte loggas och inte begränsas.

---

## Konkreta åtgärder med deltagar/konsulent-värde

Sorterat efter (impact × hur lite jobb det är).

### Snabba vinster (1-3 dagar)

1. **Ta bort mock-timeline i `ParticipantDetailPage.tsx`** (rad 304-310). Antingen bygg den från faktiska tabeller (`consultant_journal`, `consultant_meetings`, `cvs.updated_at`, `saved_jobs.created_at`) eller dölj fliken tills den är riktig. **Att visa fake aktivitet leder till felaktiga beslut.**

2. **Implementera "Tilldela mål till deltagare"** (`ResourcesTab.tsx:811`). Byt `alert()` mot en dialog som väljer deltagare + skapar rad i `consultant_goals`. Resurser-fliken är annars 80% dödkod.

3. **Ta bort hårdkodad `monthlyProgress`/`averageTimeToPlacement`** (`OverviewTab.tsx:457-464`). Antingen räkna ut från `consultant_placements` + `consultant_goals.completed_at` eller dölj korten tills datan finns.

4. **Lägg till "Visa CV"-länk i deltagardetalj** — bara öppna `/cv?as=<participant_id>` i ny flik (read-only mode behövs i CV-byggaren). Idag kan konsulenten se ATS-score 45 men inte hjälpa deltagaren förbättra det.

5. **Konsulent-onboardning-checklista**: Lägg till en `OnboardingFlow`-variant som visas första gången rollen `CONSULTANT` öppnar `/consultant`. Tre steg: (1) Bjud in din första deltagare, (2) Skapa en mötestid, (3) Sätt notiser.

### Medellånga (1-2 veckor)

6. **Aktivera `consultant_placements`-UI**: Lägg till "Markera som placerad"-knapp på deltagarkortet → fyller i arbetsgivare/titel/datum/typ. Lägg till 3m/6m-uppföljnings-påminnelser i Översikten. Detta ger fantastisk konsulent-stolthet (att se sina placerade) och tydlig metric för verksamheten.

7. **Riktiga konsulent-notifieringar via email**: Skapa `client/api/consultant-alerts.js` analogt med `job-alerts.js`. Cron-jobb som varje natt skickar email om: deltagare inaktiv >14 dagar, mål förfaller idag, oläst meddelande >24h.

8. **Deltagarens journal-rätt (GDPR Art. 15)**: Lägg till `is_visible_to_participant`-kolumn i `consultant_journal` (default `false` för bakåtkompatibilitet). UI-toggle i journal-anteckningen. På `MyConsultant`-sidan, visa de markerade anteckningarna. **Eller** dokumentera explicit i privacy policy att konsulenten har egna anteckningar och att deltagaren kan begära utdrag via `delete-account`-edge functionens motsvarighet (`request-data-export`).

9. **Mobil-pass på `/consultant/*`**: Konvertera tabell-vyn till kort-vy under 768px. Bygg en `ConsultantBottomNav` med 4 ikoner (Översikt, Deltagare, Meddelanden, Möten) — speglar `HubBottomNav`-mönstret. Lägg till en "Mitt nästa möte"-quick-card som första vy.

10. **Spara-knapp för mötesanteckningar → auto-journal**: När konsulenten skriver i `consultant_meetings.notes` och markerar mötet som `completed`, skapa automatiskt en `consultant_journal`-post med `category = 'GENERAL'`. Halverar dubbelarbete.

### Strategiska (1-2 månader)

11. **AF-integration i konsulentvyn**:
    - Visa öppna AF-jobbsökningar relaterade till deltagarens Holland-kod / desired_jobs på deltagarprofilen
    - Lägg till `participant_af_data`-tabell (case-nummer, handläggare, programstart/slut, deadlines för aktivitetsrapport)
    - Aktivitetsrapport-export: knapp som genererar en rapport som motsvarar AF-format med deltagarens senaste 30 dagars aktivitet

12. **Read-only "konsulent-läge" för deltagarsidor**: Skapa en wrapper-komponent som gör att konsulenten kan öppna t.ex. `/cv?viewing=<participant_id>` och se exakt vad deltagaren ser, men kan inte ändra. Lägg till `View as participant`-knapp på deltagarprofilen. Loggas i `audit_logs` för GDPR.

13. **Krisprotokoll konsulent ↔ deltagare**: När deltagaren rapporterar låg energi 7+ dagar i rad eller använder `wellness/CrisisTab.tsx`, trigger en notis till konsulenten med snabblänk till support-resurser och möjlighet att boka akut-möte.

14. **Audit-logg för dataläsningar**: Logga alla `SELECT` mot `consultant_dashboard_participants` med `participant_id` i `audit_logs`. Bygg en konsulent-self-service-vy: "Du har tittat på dessa deltagares data senaste 7 dagarna" — bygger förtroende.

15. **Kalendersync Google/Outlook**: Bygg på existerande `api/google-calendar.js` så att `consultant_meetings` syncar tvåvägs.

---

## Slutsats

Konsulentportalen är längre kommen än en typisk MVP — meddelanderealtime, RLS, journal, SMART-mål, PDF-rapporter och granulär GDPR-delning är allt på plats. Men den är fortfarande **en parallell vy bredvid det riktiga arbetet** istället för **det operativa centrumet**. Riskskulden ligger i tre saker:
1. **Hårdkodad mock-data** som luras (timeline, monthlyProgress).
2. **Avgrunden mellan deltagarens verktyg och konsulentens uppföljning** — konsulenten ser score men inte innehåll.
3. **AF-integrationens fullständiga frånvaro** — i Sverige är konsulent-utan-AF som tandläkare-utan-borr.

Fixa #1-3 (snabba vinster) idag, planera in #11-12 (AF + read-only) som nästa stora milstolpe.
