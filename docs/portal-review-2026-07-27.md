# Portalgranskning 2026-07-27 — schemaintegritet, prestanda, kodkvalitet

> **Metod:** egen genomgång (ingen agentfan-out) med mätning före påstående. Alla siffror nedan är körda på main @ `44780074` den 2026-07-27, och alla schemapåståenden är verifierade mot **produktionsdatabasen** via `npx supabase db query --linked` — inte mot migrationsfilerna.
>
> **Varför den här granskningen ser annorlunda ut än de tre föregående:** 2026-07-10 och 2026-07-22 granskade *koden*. Den här granskningen jämförde koden mot **verkligheten i prod-databasen**, och där ligger den återstående skulden. Elva tabeller som koden skriver till finns inte. Trettiosju tabeller som finns används inte.

---

## 1. Hälsoläget — det som är bra

| Grind | Mätning 2026-07-27 | Status |
|-------|--------------------|--------|
| Enhetstester | 846 gröna / 57 filer, 21 s | ✅ |
| `typecheck:critical` | 0 crash-fel | ✅ |
| ESLint | **0 errors**, 164 warnings | ✅ / 🔶 |
| `lint:design` (gradienter) | 52 = baseline, inga nya | ✅ |
| Produktionsbygge | grönt | ✅ |
| `npm audit --omit=dev` | 0 sårbarheter (A14) | ✅ |
| RLS | påslaget på **samtliga** 147 tabeller/vyer | ✅ |

Spår A–F i roadmapen är i allt väsentligt betalda. Säkerhetsarbetet 23/7 (A7/A10–A15) höll: inga nya öppna policyer, inga oskyddade endpoints, ingen IDOR i `job-alerts.js` (den ignorerar redan `userId` i body och använder JWT-subjektet).

---

## 2. Huvudfyndet: schemadrift mellan kod och produktion

Koden refererar **123** tabellnamn. Prod har **147** tabeller/vyer. Skärningen stämmer inte:

```
11 tabeller som koden läser/skriver finns INTE i prod
37 tabeller i prod som ingen .from() i koden rör
```

### 2.1 De elva fantomtabellerna

| Tabell | Kodväg | Migration finns? | Konsekvens |
|--------|--------|------------------|------------|
| `job_notifications` | `jobAlertEmailService` (5 anrop) + `client/api/job-alerts.js:451` | ✅ `20260412110000` — **aldrig körd** | Jobbaviseringar kan aldrig visas eller skapas |
| `email_notifications` | `client/api/job-alerts.js:371` | ❌ ingen | Utskickslogg failar |
| `email_queue` | `supabase/functions/send-inactivity-warning` | ✅ i `20260515_retention_cron.sql` — **aldrig körd** (= A6) | Inaktivitetsvarningar kan inte köas |
| `interview_recordings` | `useAudioRecorder.ts:242` | ✅ `20260412120000` — **aldrig körd** | Ljuduppladdning i intervjusimulatorn failar |
| `wellness_entries` | `MyConsultant.tsx:793` | ❌ ingen | "Det här delar du med din konsulent" visar tomt mående |
| `cv_data` | `useAchievementChains.ts:451` | ❌ ingen | CV-poäng alltid 0 |
| `interest_guide_results` | `useAchievementChains.ts:475` | ❌ ingen | RIASEC räknas aldrig som klar |
| `user_achievement_chains` | `useAchievementChains.ts:531,553` | ❌ ingen | Kedjeframsteg sparas aldrig |
| `user_settings` | `userApi.updateSettings` | ❌ ingen | Dödkod — **0 anropare** (dubblett av `settingsStore` → `user_preferences`) |
| `salary_lookups` | `scbSalaryApi.ts:280` | ❌ ingen | Lönesöks-analytics failar tyst |
| `journey_goals` | `consultantService.ts:550` | ❌ ingen | Rest efter C9-arkiveringen |

**Rotorsak.** `CLAUDE.md` föreskriver (korrekt) att migrationer körs manuellt med `db query --linked` eftersom `db push` failar på konflikter. Priset är att **inget hindrar en migrationsfil från att aldrig köras** — och inget upptäcker att kod skrivs mot en tabell som aldrig funnits. Tre av elva har en migrationsfil som glömdes. Åtta har aldrig haft någon.

Detta är exakt samma buggklass som B3:s `participant_consultants` (2026-07-10) och UX7:s kolumnnamnsbugg (2026-07-23). Tredje gången samma sak — mönstret, inte instanserna, är problemet.

### 2.2 Drift finns även på kolumnnivå

`jobAlertEmailService` läser och skriver `user_preferences.job_alert_email_enabled` och `.job_alert_frequency`. Prod-`user_preferences` har 24 kolumner — **ingen av de två**.

Och UI:t döljer det:

```ts
// AlertsTab.tsx:213
const handleSave = async () => {
  setIsSaving(true)
  await updateNotificationPreferences({ emailEnabled, frequency })  // returnerar false
  setIsSaving(false)
  onClose()                                                        // stänger som om det gick bra
}
```

Returvärdet kastas. Deltagaren ställer in aviseringsfrekvens, modalen stänger, ingenting sparades. Samma falsk-framgång-mönster som UX5 (Snabb-CV).

### 2.3 Nettoeffekten: jobbevakning är en trasig funktion, inte en långsam

Hela kedjan är bruten i tre led samtidigt — tabellen för aviseringar, loggtabellen och preferenskolumnerna. `AlertsTab` är live i Söka jobb-hubben, `getUnreadCount()` returnerar alltid 0 via sin `catch → return 0`. Bevakningar går att skapa (`job_alerts` finns), men ingen avisering kan någonsin nå deltagaren.

Det är värt att notera vad detta är: **en av portalens få icke-AI-funktioner som skapar återkommande värde** — något som hämtar deltagaren tillbaka utan att hen måste komma på att logga in. Den har varit ur funktion sedan 12 april.

### 2.4 De 37 oanvända tabellerna

Cirka tio nås legitimt utan `.from()` — `rate_limits` och `account_deletion_requests` via RPC, `milestones`/`user_milestones`/`user_gamification` via poäng-RPC:erna, `consultant_notes` via realtime-prenumerationen, revisionstabellerna via triggers.

Kvar ≈27 verkligt oanvända, varav:

- **13 `community_*`-tabeller** (feed, topics, replies, likes, groups, group_messages, buddies, buddy_checkins …). Noll kodrader rör dem. Tre av dem — `community_topics`, `community_replies`, `community_likes` — har `USING (true)`-policyer för `SELECT` och `anon` har SELECT-grant. Tomma idag, men det är ett publikt läsbart användargenererat-innehåll-schema för en funktion som inte finns i produkten och inte står i CLAUDE.md:s funktionslista.
- `articles_backup` — backup-tabell som blivit permanent.
- `user_widget_layouts` — kvarleva efter widget-arkiveringen (C1/C10).
- `achievements`, `user_achievements`, `quests`, `user_goals`, `user_interests`, `daily_tasks`, `application_templates`, `article_course_links`, `job_interest_matches`, `user_consent_status`, `user_recommended_courses`, `login_attempts`, `data_export_logs`, `data_sharing_audit`.

**Compliance-vinkeln:** `GDPR-ART30-REGISTER.md` och `RETENTION-POLICY.md` är daterade 2026-05-15. Ett Art 30-register ska beskriva de faktiska behandlingarna, och retention ska täcka de faktiska lagringsplatserna. Med 147 tabeller i prod är det osannolikt att de två dokumenten är kompletta — och deadline är 2 augusti. Att avveckla ~27 tabeller före signering gör registret både mindre och sannare.

---

## 3. Prestanda: PDF-stacken

Fyra PDF-bibliotek i klienten, plus ett på servern:

| Chunk | Rå storlek | Används av |
|-------|-----------|-----------|
| `vendor-react-pdf` | **1 510 kB** | `CoverLetterPDF.tsx` — *en* fil |
| `vendor-jspdf` | 401 kB | CV/STA/rapport-export |
| `vendor-html2canvas` | 194 kB | jspdf-vägen |
| `pdf-lib` | (i STA-chunk) | ifyllning av AF:s blanketter |
| `puppeteer-core` + `@sparticuz/chromium` | serversidan | `api/cv-pdf.js` |

Allt är korrekt lazy-laddat — ingen entry-belastning. Men en deltagare som exporterar sitt personliga brev laddar **1,5 MB JavaScript för att rendera ett textbrev på en sida**. `jspdf` finns redan i bundlen och klarar den layouten. Målgruppen har uttalat äldre enheter och sämre uppkopplingar; det här är den enskilt största onödiga nedladdningen i produkten.

Övriga chunkar (oförändrat sedan E6/E10, alla medvetna): entry 523 kB, `contentApi` 996 kB (on-demand), `xlsx` 477 kB, `en.json` 282 kB, `sentry` 255 kB.

---

## 4. Kodkvalitet

**Två ograndade skuldposter:**

- **687 strict-typfel** i `npm run typecheck` (E7 mätte ~751; långsam förbättring men ingen grind). `typecheck:critical` fångar bara crash-klassen. Det betyder att typsystemet inte skyddar mot precis den buggklass som kapitel 2 handlar om.
- **164 ESLint-warnings**, ingen `--max-warnings`-grind. Dominerande regel: `no-console` i services (`bolagsverketApi`, `contentApi` m.fl.).

**Filer långt över CLAUDE.md:s 150-radersregel:**

| Fil | Rader |
|-----|-------|
| `pages/sta/StaConsultant.tsx` | 4 416 |
| `pages/ExternalResources.tsx` | 3 519 |
| `pages/sta/StaParticipant.tsx` | 2 523 |
| `services/cloudStorage.ts` | 2 431 |
| `components/cv/templates/CVTemplates.tsx` | 1 790 |
| `services/pdfExportService.ts` | 1 466 |

(`articleData.ts` 19 197 och `exercises.ts` 5 053 är innehållsdata, inte logik — de räknas inte.)

`StaConsultant.tsx` är samtidigt den fil som bär 22 av de 45 kvarvarande literala aria-labels och hela F11-luckan (STA har ingen i18n). Den är mogen för uppdelning, och uppdelningen bör bära i18n-arbetet.

**Dubblerade datalager** (utöver kända C14 mood ×3):

- `personal_brand_audit` **och** `personal_brand_audits`
- `notifications` **och** `user_notifications`
- `notification_preferences` **och** `notification_settings`
- `journal_entries` **och** `diary_entries`
- `platsbanken_saved_jobs` vid sidan av `saved_jobs`

---

## 5. Ärlighet — två nya fynd

Spår B städade fejk-AI och maskerade fel. Två kvarstår, båda av typen "UI visar något annat än vad som hände":

1. **Aviseringsinställningar sparas inte men ser sparade ut** (§2.2).
2. **`MyConsultant` visar deltagaren fel bild av vad konsulenten ser.** Vyn läser mående från `wellness_entries` (finns inte → tomt) och räknar ansökningar från `job_applications` (den utfasade tabellen från E12 → alltid 0). Det är precis den sida vars syfte är förtroende genom transparens — G13 vill bygga vidare på den, men den behöver lagas först.

   > **Åtgärdat 2026-07-27 (H4 + G13).** Måendet läses ur `mood_logs`, ansökningarna via `applicationsApi`. Vid genomgången hittades tre fel till: "Sparade jobb" räknade hela `saved_jobs` (inkl. skickade ansökningar), varje post var hårdkodad `isShared: true` oavsett faktiskt samtycke i `participant_data_sharing`, och kortets rubrik pekade på en i18n-nyckel som var ett objekt → **den råa nyckeln renderades i produktion**. Se ROADMAP H4/G13.

---

## 6. Rekommenderad ordning

| # | Åtgärd | Varför först |
|---|--------|-------------|
| 1 | **Schemadriftgrind** — skript som extraherar varje `.from()`/`rpc()`/kolumnreferens ur koden och validerar mot prod-`information_schema`; kör i CI | Utan den återkommer fyndet en fjärde gång. Hade fångat B3, UX7 och alla elva |
| 2 | **Laga jobbevakningskedjan** — kör de två glömda migrationerna, lägg till `email_notifications` + de två `user_preferences`-kolumnerna, låt `handleSave` visa fel | Trasig deltagarfunktion sedan april; låg insats |
| 3 | **Avveckla `community_*` + `articles_backup` + `user_widget_layouts`** | Krymper Art 30-registret före 2 aug och stänger tre publika läspolicyer |
| 4 | ~~**Laga `MyConsultant`** (wellness + ansökningsräkning)~~ | ✅ Klar 2026-07-27 tillsammans med G13 |
| 5 | **Radera fantomkoden** som inte ska lagas — `useAchievementChains`, `userApi.updateSettings`, `journey_goals`-resten, `salary_lookups`-loggningen | Dödkod som aktivt vilseleder nästa granskning |
| 6 | **Personligt brev → `jspdf`**, ta bort `@react-pdf/renderer` | −1,5 MB för målgruppens tyngsta nedladdning |
| 7 | Art 30 + retention mot verkligt schema | Deadline 2 aug |
| 8 | `StaConsultant.tsx`-uppdelning som bärare av F11 (STA-i18n) | Största enskilda kvalitetsposten |

---

## 7. Vad jag *inte* granskade

- **Inloggade UI-flöden i webbläsare.** Ingen Playwright-körning mot prod ingick; §2 bygger på kodläsning + databasfrågor, inte på observerat beteende i gränssnittet. Att `getUnreadCount()` returnerar 0 är verifierat i kod och schema, inte på skärm.
- **Dark mode** (F1 — fortfarande Mikaels beslut, `theme`-kolumnen finns i `user_preferences`).
- **AI-svarskvalitet** — inga prompts kördes skarpt. Modell-låsningen (`openai/gpt-oss-120b`) är intakt, 16 funktioner i `ai.js` med rate limits.
- **Edge-funktionernas deployade kod** vs. main (verifierades senast i A9, 2026-07-10).

---

*Fynden är införda i `docs/ROADMAP.md` som spår H (H1–H8). Inga nya plandokument.*
