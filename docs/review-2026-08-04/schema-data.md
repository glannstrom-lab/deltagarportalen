# Schema- och dataintegritet — granskning 2026-08-04

> **Metod.** Alla schemapåståenden är körda mot **produktionsdatabasen** via
> `npx supabase db query --linked` den 2026-08-04 (main @ `d1afc046`). Radantal är
> `count(*)`, inte `reltuples` och inte `n_live_tup` ensamt — där jag använt
> `pg_stat_user_tables` har jag verifierat om med `count(*)` (H3-lärdomen 2026-07-27).
> Kodpåståenden bär fil:rad. Där jag inte kunnat mäta står **obekräftat**.
>
> **Ingen kod har ändrats.**

## Sammanfattning

| Del | Läge |
|-----|------|
| Schemadrift (kod → objekt som saknas) | ✅ **Noll.** Snapshoten (135 poster) = prod (132 tabeller + 3 vyer). `lint:schema` gör sitt jobb |
| Tomma-men-existerande tabeller | 🔴 **73 av 132 tabeller har 0 rader.** 47 av dem läses av monterad kod |
| Delade React Query-nycklar | 🟡 UX8-fixen håller. Två nya fynd: en föräldralös invalidering och fem nycklar för samma CV |
| JSONB-former | 🟢 Mestadels rätt. Ett fält läses som inte finns (`career_goals.skills`) |
| Tysta fel | 🔴 **96 ställen** i `client/src` gör saknad data oskiljaktig från fel |
| Migrationer vs prod | 🔴 **pg_cron är inte installerat i prod.** Ingen schemalagd jobb finns. H2:s lagning kan aldrig leverera |

**Det tyngsta fyndet är inte en tabell — det är `pg_cron`.** Se M1.

---

## 1. Tomma men existerande tabeller

Rådata (utdrag, `count(*)` mot prod 2026-08-04):

```
notifications 0 · user_notifications 0 · job_notifications 0 · job_alerts 0
user_activities 0   (jfr user_activity_log 736)
interview_sessions 0 · consultant_goals 0 · consultant_meetings 0 · consultant_journal 0
consultant_placements 0 · consultant_settings 0 · consultant_job_collections 0
career_paths 0 · user_skills 0 · saved_educations 0 · network_contacts 0
networking_events 0 · favorite_occupations 0 · user_credentials 0
relocation_preferences 0 · salary_searches 0
personal_brand_audit 0 · personal_brand_audits 0 · elevator_pitches 0
portfolio_items 0 · visibility_progress 0 · content_calendar 0
weekly_goals 0 · gratitude_entries 0 · journal_entries 0 · mood_history 0
exercises 0 · exercise_steps 0 · exercise_questions 0 · exercise_categories 0
  (men exercise_answers 20)
profile_documents 0 · user_drafts 0 · shared_jobs 0 · application_contacts 0
application_reminders 0 · user_streaks 0 · quests 0 · job_applications 0
platsbanken_saved_jobs 0 · notification_settings 0 · notification_preferences 0
email_queue 0 · email_notifications 0 · article_categories 0
```

Totalt **73 av 132 tabeller är tomma**. Nedan bara de där en **monterad** kodväg
läser dem och visar noll som om det vore ett faktum.

---

### SD1 — Notifikationsklockan kan strukturellt aldrig visa något

**Allvarlighet: HÖG** (den syns på varje sida)

**Bevis.**
- `notifications` = **0 rader** (`count(*)`, prod 2026-08-04).
- Läsare: `client/src/hooks/useNotifications.ts:127` (`select … limit 50`).
- Konsument: `client/src/components/notifications/NotificationBell.tsx:230` — monterad
  i **`client/src/components/layout/TopBar.tsx:158`** och **`client/src/components/Layout.tsx:201`**,
  dvs. på varje inloggad sida.
- Enda skrivaren i klienten: `useNotifications.ts:461` `createNotification(...)` — den har
  **noll anropare**:
  ```
  $ grep -rn "createNotification" client/src --exclude=*.test.*
  client/src/hooks/useNotifications.ts:450:export async function createNotification(
  ```
- Enda övriga skrivaren i hela repot: `supabase/functions/learning-progress/index.ts:118`.
  Den funktionen är en av de sex callerlösa `learning-*`-edge-funktionerna
  (ROADMAP C4, låst i vänteläge) — noll anrop från `client/src`.

**Vad användaren ser i stället för sanningen.** En klocka i toppfältet som alltid är tom.
Det är inte fel *data* — det är en avisering­sfunktion utan producent. Den signalerar
"det finns inget nytt till dig" varje gång, för alltid.

**Föreslagen åtgärd.** Bestäm: (a) koppla en producent (t.ex. konsulentmeddelande,
delat jobb, ny bevakning) eller (b) dölj klockan tills det finns en. Att låta en tom
klocka sitta kvar är samma klass som spår B:s "UI visar något annat än vad som hände".
**Storlek: S** (dölj) / **M** (koppla producent).

---

### SD2 — Tre parallella aviseringslager, alla tomma, ett omonterat

**Allvarlighet: MEDEL** (arkitekturskuld som gör SD1 svår att laga rätt)

**Bevis.**

| Lager | Tabell | Rader | Läsare | Monterad? |
|-------|--------|-------|--------|-----------|
| A | `notifications` | 0 | `hooks/useNotifications.ts` | ✅ TopBar + Layout |
| B | `user_notifications` | 0 | `services/notificationsService.ts:347`, `client/api/job-alerts.js:385` | ❌ enda konsumenten `components/NotificationsCenter.tsx` importeras av **ingen** |
| C | `job_notifications` | 0 | `services/jobAlertEmailService.ts:63,86,105,125,146`, `client/api/job-alerts.js:451` | via AlertsTab (jobbhubben) |
| D | localStorage | — | `services/notificationsService.ts:100-101` (`'job-alerts'`, `'job-notifications'`) | ❌ samma omonterade väg |

`cloudStorage.ts:859-915` har dessutom ett femte, parallellt `notifications`-API.

**Vad användaren ser.** Inget — men nästa utvecklare som ska "laga aviseringarna" har
fyra ställen att välja mellan och ingen sanning. Det är exakt mönstret som gjorde
`mood_logs`-röran (C14) dyr.

**Föreslagen åtgärd.** Utse **en** ägare (`notifications` + `useNotifications`), arkivera
`NotificationsCenter.tsx` + `notificationsService.ts` + `cloudStorage`-notifications,
och låt `job-alerts.js` skriva till den utsedda tabellen. **Storlek: M**

---

### SD3 — Intervjusimulatorn skriver lokalt, Söka jobb-hubben läser databasen

**Allvarlighet: HÖG** (deltagarens arbete syns inte)

**Bevis.**
- `interview_sessions` = **0 rader** i prod.
- **Läsaren:** `client/src/hooks/useJobsokHubSummary.ts:62`
  ```ts
  supabase.from('interview_sessions').select('id, score, created_at')
    .eq('user_id', userId).not('completed_at','is',null)
    .order('created_at',{ascending:false}).limit(8),
  ```
  Hubben `/jobb` är monterad och live.
- **Skrivaren som faktiskt körs:** `client/src/pages/InterviewSimulator.tsx:15,459`
  importerar `saveSimulatorSession` — som sparar i **localStorage** under
  `'interview_simulator_sessions'` (`services/interviewService.ts:464` +
  kommentaren på rad 440-448: *"Vi sparar därför denna variant separat, lokalt"*).
- De två DB-skrivarna (`saveInterviewSession`, `saveInterviewSessionWithScore`,
  `services/interviewService.ts:352,380`) anropas bara från
  `client/src/components/interview/MockInterviewSession.tsx:54` — det gamla
  MOCK_INTERVIEWS-flödet.

**Vad användaren ser i stället för sanningen.** Deltagaren övar intervju, får betyg och
AI-feedback — och Söka jobb-hubben visar noll genomförda intervjuövningar. Byter hen
enhet eller rensar webbläsaren är övningarna borta helt. Samma familj som H4:s
`MyConsultant` (läste fel tabell → visade alltid noll), fast åt andra hållet.

**Föreslagen åtgärd.** Antingen låt hubben läsa localStorage-formen, eller (bättre) låt
`saveSimulatorSession` skriva till `interview_sessions` — kolumnerna finns redan
(`score` NUMERIC, `score_breakdown` JSONB, `completed_at`). **OBS:** det innebär att
intervjusvar molnlagras — samma GDPR-avvägning som H6 gjorde för röstinspelningar.
Beslutet är Mikaels. **Storlek: M**

---

### SD4 — `user_activities` har noll skrivare men tre läsare — och matar AI-assistenten

**Allvarlighet: MEDEL–HÖG** (fabricerade siffror når användaren)

**Bevis.**
- `user_activities` = **0 rader**. Systertabellen `user_activity_log` = **736 rader**.
- Skrivaren `activityApi.logActivity` (`client/src/services/activityApi.ts:16`) har
  **noll anropare**:
  ```
  $ grep -rn "logActivity\|activityApi\." client/src --exclude=*.test.*
  client/src/hooks/useDashboardData.ts:183:    activityApi.getActivities().catch(() => []),
  client/src/hooks/useDashboardData.ts:184:    activityApi.getCount('application_sent').catch(() => 0),
  ```
  Två läsanrop, noll skrivanrop.
- Fler läsare: `services/insightsService.ts:181`, `services/learningService.ts:272,337,390`.
- `useDashboardData` bygger sedan:
  ```ts
  // hooks/useDashboardData.ts:269-271
  applications: { total: applicationCount,
    statusBreakdown: { applied: applicationCount, interview: 0, rejected: 0, offer: 0 } }
  // :306
  activity: { weeklyApplications: applicationCount, streakDays: … }
  // :221
  const streakDays = calculateStreak(activities)   // alltid 0
  ```
- Konsumenter av `useDashboardData`: `components/dashboard/MatchingScoreWidget.tsx` och
  `components/dashboard/WeeklySummary.tsx` — **båda omonterade** (noll importörer utanför
  test) — samt **`components/ai/AIAssistant.tsx:155`, som ÄR monterad** via
  `pages/Exercises.tsx:791,842`.

**Bonusfynd i samma komponent — fabricerad analys.** `AIAssistant.tsx:158-163` matar
`analyzeBehavior()` med tre **hårdkodade** aktiviteter (`login`, `cv_update`,
`job_search` med påhittade tidsstämplar), och funktionen returnerar
`mostActiveDay: 'tuesday'`, `mostActiveHour: 10`, `optimalEnergyLevel: 'medium'` — alla
konstanter (`AIAssistant.tsx:100-104`), plus en `predictedInterviewChance` räknad på
`applications.total`, som alltid är 0.

**Vad användaren ser i stället för sanningen.** "Din mest aktiva dag är tisdag",
"Din chans till intervju är X %" — presenterat som personlig analys, byggt på tre
påhittade rader och en död tabell. Detta är precis vad spår B (Ärlighet i produkten)
städade bort på andra ställen; den här överlevde för att den bor på Övningar-sidan.

**Föreslagen åtgärd.** (1) Peka `useDashboardData`s ansökningsräkning på
`applicationsApi` (samma fix som H4 gjorde för `MyConsultant`). (2) Ta bort eller
avfabricera `analyzeBehavior` — konstanterna får inte presenteras som mätning.
(3) Arkivera `activityApi` + de två omonterade widgetarna. **Storlek: M**

---

### SD5 — Jobbevakningen är lagad i schemat men har fortfarande noll rader — och ingen cron

**Allvarlighet: HÖG** (se även M1)

**Bevis.**
- `job_alerts` = **0**, `job_notifications` = **0**, `email_notifications` = **0**,
  `email_queue` = **0**.
- H2 (2026-07-27) skapade tabellerna och `user_preferences.job_alert_email_enabled`
  — verifierat: kolumnen finns (`information_schema.columns`, 1 träff).
- Men: `select count(*) from pg_extension where extname='pg_cron'` → **0**.
  Cron-schemat existerar inte i prod.

**Vad användaren ser i stället för sanningen.** AlertsTab är live i Söka jobb-hubben.
En deltagare kan skapa en bevakning; inget mejl och ingen avisering kan någonsin
skickas, eftersom producenten aldrig körs. Att `job_alerts` står på 0 rader efter fyra
månader betyder antingen att ingen provat, eller att skapandet failar — **obekräftat**,
jag har inte kunnat repro:a skapandeflödet utan ett testkonto.

**Föreslagen åtgärd.** Blockeras av M1 (pg_cron) och A6 (Resend DPA). Tills dess bör
AlertsTab säga sanningen: "Bevakningen sparas, men utskicken är inte igång än."
**Storlek: S** (ärlig text) / **L** (hela kedjan i drift)

---

### SD6 — Personal Brand-modulen: fyra monterade flikar, sex tomma tabeller

**Allvarlighet: LÅG–MEDEL** (ingen felaktig data — men H8:s oavgjorda dubblett kan nu avgöras)

**Bevis.**
- `personal_brand_audit` = 0, `personal_brand_audits` = 0, `elevator_pitches` = 0,
  `portfolio_items` = 0, `visibility_progress` = 0, `content_calendar` = 0.
- Monterade konsumenter: `pages/personal-brand/BrandAuditTab.tsx:24`,
  `PitchTab.tsx:28`, `PortfolioTab.tsx:26`, `VisibilityTab.tsx:27` — alla via
  `personalBrandApi` (`services/cloudStorage.ts:1633`).
- `hooks/useKarriarHubSummary.ts:34` läser `personal_brand_audits` (plural).

**Vad användaren ser.** Tomtillstånd — korrekt. Ingen lögn.

**Varför det ändå är ett fynd.** H8 lämnade `personal_brand_audit` vs
`personal_brand_audits` som "oavgjort — kräver konsolidering, inte radering". Det
antagandet byggde på att båda hade levande data. **Båda är tomma.** Konsolideringen
kostar därför noll datamigrering: välj pluralformen (den hubben och grinden redan
använder), peka om `personalBrandApi`, släpp singularen. **Storlek: S**

---

### SD7 — Karriärspårets nio tabeller: allt tomt

**Allvarlighet: LÅG** (usage-signal, inte bugg — men relevant för Art 30 och feature-sunset)

**Bevis.** `career_paths` 0 · `user_skills` 0 · `saved_educations` 0 ·
`network_contacts` 0 · `networking_events` 0 · `favorite_occupations` 0 ·
`user_credentials` 0 · `relocation_preferences` 0 · `salary_searches` 0.
Alla har monterade skrivare via `services/careerApi.ts` →
`pages/career/{PlanTab,NetworkTab,CredentialsTab,RelocationTab,AdaptationTab}.tsx`.

Samma bild i profildata: `profiles.career_goals` är ett **tomt objekt (`{}`) i 91 av 92
rader** och `profiles.desired_jobs` en **tom array i 90 av 92**.

**Vad användaren ser.** Tomtillstånd. Korrekt — men det betyder att hela karriär­spåret
har noll faktisk användning efter månader i drift.

**Föreslagen åtgärd.** Inte kod. Detta är underlag för Q4-punkten "feature-sunset
(<5 % användning)" och för H7: `network_contacts` (där deltagaren lagrar **tredje
personers** uppgifter) står i Art 30-registret som en aktiv behandling som i praktiken
aldrig skett — enklaste vägen ut ur den GDPR-frågan är att avveckla fliken.
**Storlek: S** (beslut) / **M** (avveckling)

---

### SD8 — Övningsschemat har aldrig fungerat; deltagarna svarar på övningar som inte finns i databasen

**Allvarlighet: LÅG** (fallbacken är korrekt och medveten)

**Bevis.**
- `exercises` 0 · `exercise_steps` 0 · `exercise_questions` 0 · `exercise_categories` 0
  — men **`exercise_answers` = 20 rader**.
- `services/contentApi.ts:377-397`:
  ```ts
  if (exercisesRes.error || !exercisesRes.data || exercisesRes.data.length === 0) {
    apiLogger.debug('No exercises in database, using mock data')
    return mockExercises
  }
  ```
- `article_categories` = 0 medan `articles` = 133 (`contentApi.ts:286`).

**Vad användaren ser.** Rätt övningar (från `data/exercises.ts`, 5 053 rader lokal data).
Fallbacken gör att inget syns.

**Föreslagen åtgärd.** Fyra tomma tabeller + `article_categories` är dödschema som
blåser upp Art 30-bilagan. Antingen seeda dem eller släpp dem och gör den lokala datan
till uttalad sanning. **Storlek: S**

---

### SD9 — `user_activities` vs `user_activity_log`: dubblettpar H8 inte tog

**Allvarlighet: MEDEL** (se SD4 för konsekvensen)

**Bevis.** `user_activities` 0 rader / 0 skrivare / 3 läsare.
`user_activity_log` 736 rader, skrivs via RPC från `hooks/useAchievementTracker.ts:4`.
H8 (ROADMAP) listade fem dubblettpar; det här paret finns inte med.

**Föreslagen åtgärd.** Utse `user_activity_log`, arkivera `activityApi.ts` +
`insightsService`/`learningService`s aktivitetsläsningar. **Storlek: S**

---

### SD10 — `job_applications` finns kvar med en migration som aldrig körts

**Allvarlighet: LÅG**

**Bevis.** `job_applications` finns i prod (`information_schema.tables`, 1 träff),
0 rader. `supabase/migrations/PENDING_20260728_drop_job_applications.sql` har
`PENDING_`-prefix och har aldrig körts. Noll `.from('job_applications')` finns kvar i
kod (endast kommentarer: `hooks/useAchievementTracker.ts:33`, `pages/MyConsultant.tsx:821`,
`services/cloudStorage.ts:1058`, `services/workflowApi.ts:111,261`).

**Föreslagen åtgärd.** Kör droppen. Tabellen är den som gav UX8-buggen; så länge den
finns kan någon peka på den igen. **Storlek: S**

---

### SD11 — Dagbokens sidotabeller tomma

**Allvarlighet: LÅG**

**Bevis.** `weekly_goals` 0, `gratitude_entries` 0, `journal_entries` 0, `mood_history` 0
— mot `diary_entries` 1, `mood_logs` 4, `diary_streaks` 1.
Läsare: `services/diaryApi.ts:367-469` (weekly_goals ×7), `:488-549` (gratitude ×4),
monterade via `hooks/useDiary.ts:210,301`.
`journal_entries` och `mood_history` är redan avgjorda som förlorare i H8.

**Vad användaren ser.** Tomtillstånd — korrekt.

**Föreslagen åtgärd.** Ingen kodåtgärd. Notera som usage-signal. **Storlek: S**

---

## 2. Delade React Query-nycklar

Kartan över alla `queryKey:` / `setQueryData(` i `client/src` (ca 120 träffar).

### QK0 — UX8-fixen håller ✅ (verifierat, inte antaget)

`hooks/useJobsokHubSummary.ts:88-99` har **noll** `setQueryData`. Kommentaren i koden
dokumenterar varför. De enda kvarvarande `setQueryData`-anropen utanför tester är:

| Fil:rad | Nyckel | Skriver | Ägare av nyckeln |
|---------|--------|---------|------------------|
| `hooks/useDiary.ts:60` | `['diary-entries']` | `DiaryEntry[]` | samma fil (`:43`) ✅ |
| `hooks/knowledge-base/useArticles.ts:90,100` | `['article-bookmarks']` | `string[]` (optimistisk) | samma fil (`:37`) ✅ |
| `hooks/useOnboardedHubsTracking.ts:47` | `OVERSIKT_HUB_KEY(userId)` | patchar befintligt objekt | `hooks/useOversiktHubSummary.ts:59` — **skriver samma form** ✅ |

**Ingen nyckel skrivs längre med fel form.** En nyckel = en form = en ägare håller.

### QK1 — Föräldralös invalidering: `['coverLetters']`

**Allvarlighet: MEDEL**

**Bevis.**
```ts
// client/src/components/focus/steps/FocusCoverLetter.tsx:189
queryClient.invalidateQueries({ queryKey: ['coverLetters'] })
```
Ingen `useQuery` i repot använder nyckeln `['coverLetters']` (camelCase). De faktiska
nycklarna för personliga brev är:
- `['cover-letters']` — `hooks/useDocuments.ts:47`, `staleTime: 5 min`
- `['cover-letters-count']` — `components/knowledge-base/tabs/MyJourneyTab.tsx:57`
- `['cover-letter-status']` — `components/knowledge-base/tabs/GettingStartedTab.tsx:51`
- `['cover-letter', id]` — `hooks/useDocuments.ts:78`

**Vad användaren ser i stället för sanningen.** En deltagare skriver ett personligt brev
i **fokusläget** (tillgänglighetsläget för NPF-användare), sparar, går till
Dokument/Min resa — och brevet finns inte där på upp till fem minuter. Det ser ut som
att sparningen misslyckades. Samma grupp och samma flöde som G3-buggen
(`showToast is not a function`) drabbade.

**Föreslagen åtgärd.** Byt till `['cover-letters']`, eller bättre: exportera nycklarna
från `useDocuments.ts` så camelCase-varianten inte går att skriva av misstag.
**Storlek: S**

### QK2 — Fem nycklar hämtar samma CV; bara en invalideras vid sparning

**Allvarlighet: MEDEL**

**Bevis.** Alla fem kör `cvApi.getCV()`:

| Nyckel | Fil:rad | staleTime | Invalideras vid CV-sparning? |
|--------|---------|-----------|------------------------------|
| `['cv']` | `components/focus/steps/FocusCV.tsx:65`, `components/cv/FocusCVBuilder.tsx:59` | default | ✅ `hooks/useCVAutoSave.ts:75`, `FocusCV.tsx:100`, `FocusCVBuilder.tsx:87` |
| `['cv-data']` | `components/knowledge-base/tabs/MyJourneyTab.tsx:34` | 30 s | ❌ |
| `['cv-status']` | `components/knowledge-base/tabs/GettingStartedTab.tsx:19` | 30 s | ❌ |
| `['cvForMatching']` | `hooks/useJobMatching.ts:382` | **5 min** | ❌ |
| `['cv-versions']` | `hooks/useDocuments.ts:33` | 5 min | ❌ |

**Vad användaren ser i stället för sanningen.** Efter att ha lagt till kompetenser i CV:t
kör jobbmatchningen på det gamla CV:t i upp till fem minuter — deltagaren ser samma
matchningar och drar slutsatsen att kompetenserna inte spelade någon roll. Det är den
funktion vars hela värde är att reagera på vad deltagaren just gjorde.

Detta är **inte** UX8-buggen (fel form på delad nyckel) utan dess spegelbild:
**samma form, olika nycklar, ingen invalidering**.

**Föreslagen åtgärd.** En `cvKeys`-modul (`all`, `matching`, `versions`) och en
`invalidateCV()`-helper som `useCVAutoSave` anropar. **Storlek: S–M**

### QK3 — Hub-nycklarna är rena ✅

`['hub','oversikt',uid]`, `['hub','jobsok',uid]`, `['hub','karriar',uid]`,
`['hub','min-vardag',uid]`, `['hub','resurser',uid]` — var och en har exakt en ägar-hook
och en form (`hooks/hubSummaryTypes.ts`). `hooks/useAchievementTracker.ts:97-98`
invaliderar `['dashboard']` och `['hub']` som prefix; båda matchar korrekt
(`useDashboardData.ts:542` = `['dashboard']`, hub-nycklarna börjar på `'hub'`).

---

## 3. Kolumnformer (JSONB)

Körd mot prod: `jsonb_typeof(kol)` + `jsonb_typeof(kol->0)` + `jsonb_object_keys()`
för samtliga JSONB/ARRAY-kolumner på tabeller med rader.

```
k                                   | outer  | elem   | n
------------------------------------+--------+--------+----
cvs.skills                          | array  | object | 16
cvs.skills                          | array  | NULL   |  9   (tom array)
cvs.work_experience                 | array  | object | 17
cvs.education                       | array  | object | 16
cvs.languages                       | array  | object | 17
cvs.links                           | array  | object |  4
cvs.certificates                    | array  | object |  4
cvs.references                      | array  | object |  2
cv_versions.data                    | object | —      | 10
profiles.career_goals               | object | —      | 92
profiles.desired_jobs               | array  | object |  2
profiles.interests                  | array  | string |  4
saved_jobs.job_data                 | object | —      | 25
skills_analyses.skills_comparison   | array  | object |  2
igh.top_occupations                 | array  | object | 10
interest_results.recommended_jobs   | array  | string |  1
user_preferences.dashboard_widgets  | array  | string | 10
unified_profiles.career_goals       | object | —      | 21
```

### JS1 — `useAITeamContext` läser ett fält som inte finns i prod

**Allvarlighet: MEDEL** (AI-coachen får sämre underlag, tyst)

**Bevis.**
```ts
// client/src/hooks/useAITeamContext.ts:130-135
if (profile.career_goals) {
  …
  shortTerm: profile.career_goals.shortTerm,
  longTerm:  profile.career_goals.longTerm,
  targetSkills: profile.career_goals.skills,     // ← finns inte
```
Faktiska nycklar i prod (`jsonb_object_keys` över alla icke-tomma `career_goals`):
`longTerm`, `preferredRoles`, `shortTerm`, `targetIndustries`, `updatedAt`.
**Ingen `skills`-nyckel.** Skrivaren bekräftar det:
`services/unifiedProfileApi.ts:331-336` sätter `shortTerm/longTerm/preferredRoles/targetIndustries/updatedAt`.

Dessutom: `if (profile.career_goals)` är sant för **alla 92 profiler**, eftersom kolumnen
är `{}` (tomt objekt, truthy) i **91 av 92**:
```
empty career_goals objects | 91
non-empty career_goals     |  1
```

**Vad användaren ser i stället för sanningen.** AI-teamet får ett `careerGoals`-objekt med
tre `undefined`-fält för i princip alla användare, och tror sig ha karriärkontext.
Coachen svarar generellt där den kunde varit specifik — och inget i loggen avslöjar det.
`targetSkills` kan aldrig fyllas, ens för den enda användare som har karriärmål.

**Föreslagen åtgärd.** Ta bort `targetSkills` eller läs `preferredRoles`/`targetIndustries`
i stället; lägg till en tomhetskontroll (`Object.keys(...).length > 0`) innan blocket.
**Storlek: S**

### JS2 — `cvs.skills` är objekt i 16 av 16 icke-tomma CV:n ✅ (bekräftar 2026-08-03)

**Bevis.** `jsonb_object_keys(skills->0)` → `id`, `name`, `level`, `category` i alla 16.
Noll CV:n har sträng-arrayer. Lärdomen från 2026-08-03 (`cvOptimizer.ts` kastade
`TypeError`) är alltså korrekt beskriven, och ingen legacy-form ligger kvar i prod.
Samma sak för `work_experience`/`education`/`languages`/`links`/`certificates`/
`references`: alltid `array` av `object`, aldrig sträng. **Ingen åtgärd.**

### JS3 — Blandad form på "rekommenderade jobb"

**Allvarlighet: LÅG** (kodvägen är avaktiverad)

**Bevis.** `interest_results.recommended_jobs` = array av **strängar** (1 rad).
`interest_guide_history.top_occupations` = array av **objekt** (10 rader).
```ts
// client/src/pages/sta/components/Del3PortalIntegration.tsx:83
const jobs = (rec.recommended_jobs ?? rec.recommendations ?? rec.top_occupations) as …
```
Tre olika källor med två olika elementformer bakom en `??`-kedja. Typas
korrekt som `string[]` i `lib/supabase.ts:128` och `pages/Resources.tsx:135` för
`recommended_jobs`-vägen.

**Vad användaren ser.** Inget — `pages/sta/` monteras inte sedan 2026-08-03
(`MODULES.STA` av). Fyndet är en fälla för den som slår på flaggan igen.

**Föreslagen åtgärd.** Ingen nu. Notera i STA-återupptagningen. **Storlek: S**

### JS4 — Widgetkonfiguration bor på tre ställen

**Allvarlighet: LÅG**

**Bevis.** `dashboard_preferences.visible_widgets` (ARRAY) + `.widget_order` (ARRAY) +
`.widget_sizes` (JSONB), 14 rader — och `user_preferences.dashboard_widgets`
(array av strängar, 10 rader) + `user_preferences.dashboard_widget_config` (JSONB).
Efter widget-arkiveringen (C1/C10) finns ingen widget-grid längre; hubbarna byggs med
`HubPage`-funktionskort.

**Föreslagen åtgärd.** Kandidat för samma städning som `user_widget_layouts` fick i H3.
**Obekräftat** vilken av de tre som fortfarande läses — jag har inte spårat alla tre.
**Storlek: S**

---

## 4. Tysta fel

Två mönster, båda gör "det finns ingen data" oskiljaktigt från "anropet gick fel":

**A. `if (error) { console.error(...); return [] | null | 0 | false }`** — 63 träffar / 12 filer:

| Fil | Antal |
|-----|-------|
| `services/cloudStorage.ts` | 24 |
| `services/diaryApi.ts` | 18 |
| `services/jobAlertEmailService.ts` | 6 |
| `hooks/useDashboardData.ts` | 4 |
| `services/learningService.ts` | 3 |
| `services/jobSharingService.ts` | 2 |
| `services/{userApi,personalBrandAuditsApi,insightsService,coverLetterApi,applicationsApi}.ts`, `pages/Settings.tsx` | 1 vardera |

**B. `catch { return [] | null | 0 | false }`** (fångar även auth- och nätverksfel) —
33 träffar / 19 filer, tyngst `services/profileEnhancementsApi.ts` (6),
`hooks/useUnifiedProgress.ts` (5), `hooks/useDashboardData.ts` (4).

**Summa: 96 ställen.**

### TF1 — Onboardingchecklistan säger "du har inget CV" när nätverket strular

**Allvarlighet: HÖG** (den ljuger om deltagarens eget arbete)

**Bevis.**
```ts
// client/src/components/knowledge-base/tabs/GettingStartedTab.tsx:19-34
queryKey: ['cv-status'],
queryFn: async () => {
  try { … return { hasCV: hasContent } }
  catch { return { hasCV: false } }      // ← nätverksfel = "inget CV"
}
```
Samma mönster i `MyJourneyTab.tsx:34-51` (`catch { return { hasCV: false, completeness: 0 } }`),
`:19-30` (sparade jobb → `{count: 0}`) och `:57-66` (brev → `{count: 0}`).
`GettingStartedTab.tsx:38-50` gör detsamma för intresseguiden.

**Vad användaren ser i stället för sanningen.** "Kom igång: skapa ditt CV" — till någon som
redan har ett. För målgruppen (långtidsarbetslösa, ofta med låg tillit till egen förmåga)
är beskedet "ditt arbete finns inte" det dyraste möjliga felet. Och eftersom felet sväljs
tyst syns det varken i Sentry eller i loggen.

**Föreslagen åtgärd.** Skilj på `null` (kunde inte läsas → visa "Kunde inte läsas just nu")
och `false` (finns inte → visa uppmaningen). Exakt det H4 gjorde för `MyConsultant`.
**Storlek: M** (mönstret återkommer på 4-6 ställen i onboardingen)

### TF2 — `diaryApi` sväljer 18 fel mot fyra tabeller varav tre är tomma

**Allvarlighet: MEDEL**

**Bevis.** `services/diaryApi.ts:367-469` (`weekly_goals`, 7 st) och `:488-549`
(`gratitude_entries`, 4 st) följer alla mallen:
```ts
if (error) { console.error('Error fetching weekly goals:', error); return [] }
```
Båda tabellerna är tomma i prod (SD11). Det betyder att **ingen kan skilja på**
"deltagaren har inga veckomål" och "RLS/schema hindrar läsningen" — och just den
osäkerheten är varför de tomma tabellerna i §1 är svåra att bedöma.

**Föreslagen åtgärd.** Låt `diaryApi` kasta vidare och låt `useDiary` visa fel.
**Storlek: M**

### TF3 — `jobAlertEmailService` sväljer sex fel mot en kedja som ändå inte kan leverera

**Allvarlighet: MEDEL** (kombinerat med SD5/M1)

**Bevis.** `services/jobAlertEmailService.ts:63-146` — sex `if (error) → return []`/`false`
mot `job_notifications`. Kombinerat med att pg_cron inte finns (M1) betyder det att
aviseringsfunktionen är tyst på tre nivåer samtidigt: inget skickas, inget loggas,
inget fel visas.

**Föreslagen åtgärd.** Se SD5. **Storlek: S** (ärlig text i UI:t först)

---

## 5. Migrationer vs prod

### M1 — pg_cron är inte installerat i prod. Ingenting schemalagt körs. ⚠️

**Allvarlighet: KRITISK** (gör tre färdigmärkta funktioner verkningslösa och ett
compliance-dokument osant)

**Bevis.**
```sql
select count(*) from pg_extension where extname='pg_cron';   -- 0
select count(*) from pg_class where relname='job'
  and relnamespace=(select oid from pg_namespace where nspname='cron');  -- 0
```
Cron-schemat existerar inte alls. Konsekvenser, var och en verifierad mot kod:
- `supabase/migrations/20260515_retention_cron.sql` — gallringsjobben körs aldrig.
- `supabase/functions/send-inactivity-warning` — köar mot `email_queue` (0 rader);
  inget anropar den.
- Jobbaviseringarna (H2) — tabellerna finns, producenten körs aldrig.
- `docs/RETENTION-POLICY.md` beskriver automatisk gallring som inte sker. H7 rättade
  tre påståenden där; **premissen "cron aktiveras" är fortfarande inte uppfylld**, och
  Art 30-registret ska beskriva faktiska behandlingar.

**Vad användaren ser i stället för sanningen.** Ingenting — och det är problemet.
Persondata gallras inte enligt policy. Deadline för compliance-paketet var 2 aug 2026.

**Föreslagen åtgärd.** Aktivera pg_cron i Supabase-projektet och schemalägg jobben,
eller stryk automatikpåståendena ur RETENTION-POLICY och Art 30 och ersätt dem med
manuell rutin. Beslutet är Mikaels (A6). **Storlek: M**

### M2 — Ingen schemadrift ✅

**Bevis.** Prod: 132 basrelationer + 3 vyer = **135**.
`supabase/schema-snapshot.json` (genererad 2026-08-03 16:50, committad i `e2f644d9`):
**135** poster. Punktkontroller mot `information_schema`:

| Objekt | Migration | Finns i prod |
|--------|-----------|--------------|
| `get_my_consultant()` | `20260803100000` | ✅ 1 |
| `email_queue` | `20260727130000` | ✅ |
| `user_preferences.job_alert_email_enabled` | `20260727120000` | ✅ |
| `data_sharing_audit`-policyer | `20260728100000` | ✅ 2 |
| `participant_data_sharing`-policyer | `20260723120000` | ✅ 2 |

`lint:schema` (H1) gör alltså sitt jobb. **Den enda migrationsfilen som inte körts är
`PENDING_20260728_drop_job_applications.sql`**, och den är avsiktligt prefixad.

### M3 — RLS-läget är intakt ✅

**Bevis.**
```
rls disabled tables      | 0
tables with zero policies| 3   → email_notifications, email_queue, rate_limits
```
Alla tre är avsiktliga: `email_notifications` och `email_queue` är service-role-only
(H2/H6, 0 grants till anon och authenticated), `rate_limits` nås via RPC.
`anon` har SELECT på 128 tabeller — det är Supabase-standard och RLS är guarden;
`20260723100000_revoke_anon_grants.sql` avsåg bara `cvs` och `user_preferences`
(verifierat i filen), inte en generell revoke. **Ingen åtgärd.**

---

## 6. Rekommenderad ordning

| # | Åtgärd | Fynd | Varför | Storlek |
|---|--------|------|--------|---------|
| 1 | **Aktivera pg_cron — eller stryk automatikpåståendena** | M1 | Gallring sker inte enligt policy; tre funktioner är verkningslösa; compliance-dokument är osanna | M |
| 2 | **Skilj "kunde inte läsas" från "finns inte" i onboardingen** | TF1 | Portalen säger till deltagaren att hens arbete inte finns | M |
| 3 | **Intervjusimulatorn: en lagringsplats, inte två** | SD3 | Deltagarens övningar syns inte i hubben och försvinner vid enhetsbyte | M |
| 4 | **Avfabricera AI-assistenten + peka ansökningsräkningen på `applicationsApi`** | SD4 | Hårdkodad "analys" presenteras som mätning — spår B-klass | M |
| 5 | **Notifikationsklockan: koppla producent eller dölj** | SD1, SD2 | Tom klocka på varje sida; fyra parallella lager | S/M |
| 6 | **`['coverLetters']` → `['cover-letters']` + samla CV-nycklarna** | QK1, QK2 | Fokusläget ser ut att inte spara; matchning kör på gammalt CV | S |
| 7 | **`career_goals.skills` bort + tomhetskontroll** | JS1 | AI-coachen tror sig ha kontext den saknar | S |
| 8 | **Städa dödschema:** `job_applications`, exercises×4, `article_categories`, `personal_brand_audit`, `user_activities` | SD6, SD8, SD9, SD10 | Krymper Art 30-bilagan; avgör H8:s sista oavgjorda par gratis | S |
| 9 | **Beslut om karriärspåret och `network_contacts`** | SD7 | Noll användning + tredjepartsdata utan rättighetsutövande | S (beslut) |

---

## 7. Vad jag *inte* granskade

- **Inloggade UI-flöden i webbläsare.** Inga Playwright-körningar. Att en tabell är tom
  och att koden som läser den är monterad är verifierat i SQL och kod — inte på skärm.
- **Varför `job_alerts` har 0 rader.** Kan vara noll användning eller ett trasigt
  skapandeflöde. **Obekräftat** — kräver ett testkonto.
- **`supabase/functions/`s deployade kod** mot main (senast verifierat i A9).
- **Vilken av de tre widgetkonfigurationslagren som fortfarande läses** (JS4) —
  **obekräftat**.
- **`client/api/` och `api/`** granskades bara där de rör de tabeller §1 handlar om
  (`job-alerts.js`); ingen fullständig genomgång.
- **Kolumnformer på tomma tabeller** — `jsonb_typeof` på noll rader ger inget svar.
