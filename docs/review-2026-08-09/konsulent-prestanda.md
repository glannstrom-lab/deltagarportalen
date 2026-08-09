# Konsulentvyn och prestanda — granskning 2026-08-09

**Granskare:** konsulent- och prestandaagenten · **Metod:** Playwright mot riktiga konton i webbläsare, produktionsbygge, prod-databas (endast läsning).
**Bilder:** `docs/review-2026-08-09/bilder/kons-*.png`

## Mätuppställning

| Sak | Värde |
|---|---|
| Konsulentvy | `http://localhost:3000` (dev-server), konsulentkonto ur `.env.test.local`, prod-databas |
| Prestanda | `npm run build` → `npx vite preview --port 4180` — **produktionsbygge**, inte dev-servern |
| CWV | `PerformanceObserver` (LCP/CLS/longtask) + Navigation Timing, kall context per körning, 3 körningar desktop / 2 slow-3G, **median** |
| Slow 3G | CDP `Network.emulateNetworkConditions` 400 kb/s · 400 ms RTT + `Emulation.setCPUThrottlingRate` 4× + viewport 390×844, 45 s observationsfönster |
| Komprimering | `zlib.brotliCompressSync(quality 11)` över `client/dist` — brotli är sanningen över nätet |
| Schema | `information_schema` / `pg_policies` / `pg_get_viewdef` mot prod, inte migrationsfiler |

**Vad som inte gick att mäta:** fältdata (RUM/CrUX) finns inte — allt är labb mot localhost, så TTFB (1–3 ms) säger ingenting om Vercels edge. INP kräver riktig interaktion; TBT rapporteras som proxy. Jag har inte kunnat logga in som den *riktiga* konsulenten med 30 deltagare (inget lösenord) — vyn testades med 1 deltagare och skalbarheten bedömdes via kod + `EXPLAIN ANALYZE` mot den riktiga 30-deltagarkopplingen.

---

# 1. Sammanfattning

Konsulentvyn är funktionellt komplett — sex flikar, alla dialoger öppnar, i18n är fullständig (607/607 nycklar i båda språken) och behörighetsspärren håller. Problemet är inte vad den *gör* utan vad den *påstår*. B10 är bekräftad i webbläsaren: AI-coachen visar tre påhittade deltagare vid namn och svarar i chatten utan ett enda nätverksanrop. Värre är att tre av vyns egna nyckeltal ljuger om verkliga människor: "Loggade in" är egentligen `profiles.updated_at`, "Ej kontaktad på 7 dagar" flaggar alla eftersom `last_contact_at` aldrig skrivs (0 av 31 kopplingar i prod), och samma etikett "CV-kvalitet" visar 0 % på Översikt och 100 % på Rapporter. Kohorttabellen visar "QNaN NaN" och den strängen följer med in i PDF-rapporten till uppdragsgivaren. De sex notisinställningarna sparas men har noll läsare — ingen cron, ingen push, inget mejl.

På prestandasidan är läget statiskt: **P1, P2 och P3 från 2026-08-04 är alla oåtgärdade och praktiskt taget oförändrade.** jsPDF ligger kvar i eager-grafen (107,1 kB brotli), Översikt gör fortfarande 43 Supabase-anrop varav 21 dubbletter, och CV-mallarna väger fortfarande 898 kB. Vid 400 kb/s + 4× CPU tar det 15,4 s innan Översikt visar sin rubrik och 30,4 s till LCP på CV-sidan — där LCP-elementet **är** en mallminiatyr.

---

# 2. Fynd

## DEL A — Konsulentvyn

### K1 — AI-coachen visar tre påhittade deltagare vid namn och fejkar chatten (B10 bekräftad)

**KRITISK · Storlek S (radera) / L (bygga på riktigt)**

Bekräftad i webbläsaren, inte bara i koden. Flytknappen finns på **alla** konsulentsidor (`Consultant.tsx:52`, `<AICoachAssistant context="overview" />` ligger utanför `<Routes>`).

Bevis — `docs/review-2026-08-09/bilder/kons-07-aicoach-insikter.png`, panelens faktiska text:

```
Insikter (3)
Inaktiv deltagare      Maria Lindberg har inte loggat in på 12 dagar. Överväg att kontakta henne.
Föreslå intervjuträning Erik Svensson har uppnått 85% CV-kvalitet. Dags för intervjuträning?
Matchning möjlig       Anna Karlsson's profil matchar 3 nya jobb inom IT-support.
```

Källa: `client/src/components/consultant/AICoachAssistant.tsx:63–125` (`getContextualInsights`, kommentaren över den lyder ordagrant `// Mock AI responses based on context`). Den röda vänsterkanten på första kortet är `priority: 'high'` → `border-l-red-500` (`:196`).

Chatten: jag skrev "Hur mår Maria Lindberg?" och räknade nätverksanrop under svaret. **Noll anrop till `/api/ai`, `functions/v1` eller openrouter** (`kons-08-aicoach-chatt.png`). Svaret kommer ur `generateAIResponse` (`:128–178`) — `setTimeout(1000 + Math.random()*500)` som simulerad tänketid, sedan nyckelordsmatchning på `cv` / `motivat` / `intervju`. Svaret jag fick var `responses.default`.

Skärmdumpen visar dessutom det som gör detta farligt: **den påhittade varningen om "Maria Lindberg" står 20 px från KPI-kortet "Kräver uppmärksamhet: 1", som handlar om en riktig människa.** En konsulent har ingen visuell markör som skiljer dem åt.

Premiss: håller till fullo. Rättelse mot ROADMAP-raden: det är **tre** insikter i `overview`-kontexten, inte fyra — `getContextualInsights` gör `.slice(0, 3)` på rad 124. Den fjärde ("Jonas Berg") är definierad men når aldrig UI:t. Marginellt; problemet är oförändrat.

**Åtgärd:** radera komponenten och dess mount. Den ger noll verkligt värde idag och `InsightsPanel` (K7) är den riktiga, databasdrivna motsvarigheten som redan finns.

---

### K2 — "Loggade in" är i själva verket `profiles.updated_at` — och tre analysmått bygger på det

**HÖG · Storlek M**

Vy-definitionen i prod (`pg_get_viewdef('consultant_dashboard_participants')`), sista raden före `FROM`:

```sql
p.updated_at AS last_login
```

Det är inte en inloggning. Det är när profilraden senast skrevs — vilket sker vid varje profiluppdatering, rollbyte eller bakgrundsskrivning.

Fältet renderas som en påstådd inloggning i `OverviewTab.tsx:494–505`:

```ts
const recentLogins = participantsData
  .filter(p => p.last_login)
  .map((p, i) => ({ type: 'login', description: t('consultant.overview.activity.loggedIn'), timestamp: p.last_login! }))
```

Uppmätt i webbläsaren: *"Senaste aktivitet — Claude Testdeltagare, Loggade in, 16:48"*. Deltagarkontot hade då inte loggat in på flera timmar; 16:48 var när min egen behörighetstest skrev till profilen.

Samma fält driver tre mått till i `AnalyticsTab.tsx`:
- `:344–345` → **Engagemang** (uppmätt: 100 %)
- `:386` → **"Riskerar att fastna"** (21-dagarsgränsen)
- `:627,:635` → **"Insatseffekt"** (jämförelsen med/utan möte)

**Åtgärd:** antingen byt etiketten till "Profil uppdaterad" på alla fyra ställena, eller läs riktig inloggningstid ur `auth.users.last_sign_in_at` och exponera den i vyn. Att låta en konsulent tro att en deltagare varit inloggad idag när hen inte varit det är samma familj som B10 — bara utan mockdata-etikett i källkoden.

---

### K3 — `last_contact_at` skrivs aldrig: 0 av 31 kopplingar i prod har ett värde

**HÖG · Storlek M**

```
select count(*) filter (where last_contact_at is not null), count(*) from consultant_participants;
→ med_kontaktdatum 0 | totalt 31
```

Sökning i hela `client/src`: `last_contact_at` förekommer **19 gånger, samtliga läsningar**. Ingen `insert`, ingen `update`, ingen trigger. Fältet kommer ur `consultant_participants.last_contact_at` och sätts alltså bara om någon skriver direkt i databasen.

Konsekvensen är att varje ställe som frågar "har vi hört av oss?" svarar nej för alla, för alltid, eftersom `null` behandlas som förfallet:

| ställe | kod | följd |
|---|---|---|
| KPI "Kräver uppmärksamhet" | `OverviewTab.tsx:346` `!p.last_contact_at \|\| …` | räknar 100 % av deltagarna |
| "Hör av dig"-listan i Min dag | `OverviewTab.tsx:377` | listar alla deltagare |
| Deltagarlistans klockikon | `ParticipantsTab.tsx:121` | gul varning på alla kort |
| Filtret "Kräver uppmärksamhet" | `ParticipantsTab.tsx:121` | filtrerar bort ingen |
| Detaljvyns "Senaste kontakt" | `ParticipantDetailPage.tsx:533` | status `'bad'` för alla |
| Analytics "Riskerar att fastna" | `AnalyticsTab.tsx:389` | en av två varningssignaler alltid tänd |

Uppmätt med 1 deltagare: Översikt visade *"Kräver uppmärksamhet: 1 — Ej kontaktade 7 dagar"* och *"Hör av dig (1)"*, medan deltagarlistan sa *"Aldrig kontaktad"*. Med 30 deltagare (vilket en konsulent i prod har, se K17) blir hela triagefunktionen en lista på alla.

**Åtgärd:** skriv `last_contact_at` när konsulenten faktiskt kontaktar någon — minst vid meddelandeutskick (`consultantService.sendMessage`/`sendBulkMessage`) och vid genomfört möte. Lägg dessutom till en manuell "Jag har haft kontakt"-knapp: en arbetskonsulent ringer och träffar folk utanför portalen, och utan den vägen blir fältet fel även när skrivningen finns. Använd `assigned_at` som fallback i stället för att låta `null` betyda "förfallet" — en deltagare som kopplades igår ska inte vara röd.

---

### K4 — Kohortanalysen visar "QNaN NaN" och strängen följer med in i PDF-rapporten

**HÖG · Storlek S**

Uppmätt i webbläsaren (`kons-14-kohort-qnan.png`):

```
KOHORT      DELTAGARE  CV-KOMPLETT  PLACERADE  SNITT TID (DAGAR)
QNaN NaN            1         100%         0%                  -
```

Orsak, `client/src/pages/consultant/AnalyticsTab.tsx:522–526`:

```ts
participants.forEach(p => {
  const date = new Date(p.created_at)          // <- finns inte på vyn
  const year = date.getFullYear()              // NaN
  const quarter = Math.floor(date.getMonth() / 3) + 1   // NaN
  const key = `Q${quarter} ${year}`            // "QNaN NaN"
})
```

Vyn har **inget** `created_at` — kolumnlistan är `consultant_id, participant_id, user_id, email, first_name, last_name, phone, avatar_url, status, registered_at, assigned_at, priority, tags, last_contact_at, next_meeting_scheduled, consultant_notes, has_cv, ats_score, cv_updated_at, completed_interest_test, holland_code, saved_jobs_count, notes_count, last_note_date, last_login`.

Filen vet det själv. Rad **298**, 225 rader ovanför buggen:

```ts
// OBS: vyn consultant_dashboard_participants saknar created_at (gav 400/42703 i prod).
// assigned_at = när deltagaren kopplades till konsulenten — rätt mått för perioden.
```

Samma fel finns på `:562` (`new Date(participant.created_at)` i beräkningen av snittid till placering) och `:356–357` (där det gäller `placements`, som *har* `created_at` — den är oskyldig).

Varför `lint:schema` inte fångar det: grinden kontrollerar `.select()`-strängar mot snapshoten, inte egenskapsläsningar på JS-objekt. Samma blinda fläck som lärdomen 2026-08-03 om `Property does not exist`-typfel.

**Detta är inte kosmetiskt.** `AnalyticsTab.tsx:741` skickar in `cohortData` orört i `reportData`, och dialogen "Generera PDF-rapport" har **Kohortanalys förvald** (syns i skärmdumpen). En rapport till uppdragsgivaren får alltså raden "QNaN NaN".

**Åtgärd:** byt `p.created_at` → `p.assigned_at` på `:523` och `:562`. Ett rad-svep, men verifiera i webbläsaren — samma antagande har redan fällt raden en gång (400/42703).

---

### K5 — Samma etikett "CV-kvalitet" visar 0 % på Översikt och 100 % på Rapporter

**HÖG · Storlek S**

Samma konsulent, samma deltagare, samma session, två minuter isär:

| flik | etikett | värde |
|---|---|---|
| Översikt | **CV-kvalitet** | **0 %** — "0 kompletta" |
| Rapporter | CV-komplettering | 100 % — "Har komplett CV" |
| Rapporter → Nyckeltal | **CV-kvalitet** | **100 %** |

Rotorsak: deltagaren har `has_cv = true` men `ats_score = null` (deltagarlistan visar "Ja" i CV-rutan, vilket är `ParticipantsTab.tsx:504`s fallback när `ats_score` saknas), och de två flikarna hanterar det motsatt:

```ts
// OverviewTab.tsx:363 — "CV-kvalitet" = medelvärdet av ats_score
averageProgress: Math.round(participantsData.reduce((acc,p) => acc + (p.ats_score || 0), 0) / …)   // → 0
// OverviewTab.tsx:349 — "kompletta" kräver poäng ≥ 70
const completedCV = participantsData.filter(p => p.has_cv && (p.ats_score || 0) >= 70)             // → 0

// AnalyticsTab.tsx:332,451 — "CV-komplettering" = andel med has_cv
const withCV = participants.filter(p => p.has_cv).length                                            // → 100 %
// AnalyticsTab.tsx:868 — och ringen döps ändå till "CV-kvalitet"
<ProgressRing value={analytics.cvCompletionRate} label={t('…keyMetrics.cvQuality')} />              // → 100 %
```

Tre olika begrepp under två etiketter, varav en etikett används för två av begreppen.

**Åtgärd:** bestäm en definition per begrepp och döp dem isär — "Andel med CV" (has_cv) respektive "Snittpoäng CV" (ats_score, med "—" när poäng saknas i stället för 0 %). Räkna aldrig `null` som 0 i ett snitt; det drar ner måttet för hela gruppen så fort någon saknar poäng.

---

### K6 — De sex notisinställningarna sparas men läses aldrig av någonting

**HÖG · Storlek M–L**

Inställningar-fliken erbjuder sex notiser, var och en med av/på och kanalval Email/Push/Båda (uppmätt i webbläsaren, `kons-06-installningar.png`):

> Ny deltagare tilldelad · Inaktiv deltagare (*"När en deltagare inte loggat in på 7 dagar"*) · Mål-deadline närmar sig · Nytt meddelande · CV uppdaterat · Mötespåminnelse (*"Påminnelse 1 timme före schemalagt möte"*)

De skrivs till `consultant_settings.notifications` (`SettingsTab.tsx:252–263`). Sökning över `client/src`, `client/api`, `api/` och `supabase/functions` ger **tre träffar på `consultant_settings`, alla i `SettingsTab.tsx`** (rad 190, 260, 294 — läs, skriv, exportera). Noll konsumenter.

Kompletterande kontroll: `client/vercel.json` har **inga `crons`**, och sökning efter `pushManager` / `PushSubscription` / `web-push` i `client/src`, `client/public` och `supabase/functions` ger **noll träffar**. Det finns alltså varken schemaläggare eller push-infrastruktur som skulle kunna leverera dem.

Den allvarligaste är "Inaktiv deltagare". En konsulent som slår på den tror rimligen att portalen larmar när någon försvinner — det är precis den signal målgruppen behöver. Ingenting larmar.

**Åtgärd:** antingen bygg leveransen (cron → `send-invite-email`-mönstret finns redan som edge-funktion) eller märk sektionen "kommer i en senare version", som teamsektionen redan gör ärligt på samma sida.

---

### K7 — "Kunde inte hämta insikterna" varje gång: PGRST201 på en tvetydig relation

**HÖG · Storlek S**

Rapporter-fliken visar permanent felrutan *"Kunde inte hämta insikterna — Något gick fel vid hämtningen … Försök igen"*. Konsolen, uppmätt:

```
Failed to load insights: {code: PGRST201, message: Could not embed because more than one relationship
was found for 'consultant_goals' and 'consultant_dashboard_participants',
hint: Try changing 'consultant_dashboard_participants' to one of the following: …}
```

Källa: `client/src/services/consultantInsights.ts:157`

```ts
.select('*, participant:consultant_dashboard_participants!inner(name, user_id)')
```

`consultant_goals` har mer än en möjlig väg till vyn (`participant_id` och `consultant_id`), så PostgREST vägrar gissa. Felet kastas (`:161 if (goalsError) throw goalsError`) och fäller hela `InsightsPanel`, inklusive de insikter som räknats fram *före* raden — inaktivitet, låg CV-poäng, high performers (`:100–151`).

Notera ironin: `InsightsPanel` är den riktiga, databasdrivna insiktsmotorn. Den är trasig, medan den påhittade AI-coachen (K1) alltid fungerar. En konsulent ser alltså mockdata i grönt och verklig analys i rött.

Ytterligare: vyn har ingen kolumn `name` — den har `first_name` och `last_name`. Även efter att relationen disambiguerats kommer selecten att falla.

**Åtgärd:** disambiguera med explicit foreign key-hint (`consultant_dashboard_participants!consultant_goals_participant_id_fkey`) eller hämta deltagarna i en separat fråga och slå ihop i JS. Byt `name` → `first_name, last_name`.

---

### K8 — En deltagare som inte kan hämtas visar föregående deltagares uppgifter

**MEDEL · Storlek S**

Reproducerat: öppna en deltagares detaljsida, navigera sedan till `/#/consultant/participants/00000000-0000-4000-8000-000000000001`. Vyn visar **fortfarande den förra deltagarens** namn, e-post, CV-poäng, sparade jobb och anteckningar (`kons-10-okand-deltagare.png`). Nätverket säger tydligt att den nya inte finns:

```
406 GET /rest/v1/consultant_dashboard_participants?select=*&consultant_id=eq.43dc2019-…&participant_id=eq.00000000-…
```

Orsak, `client/src/pages/consultant/ParticipantDetailPage.tsx:300`:

```ts
if (participantData) {
  setParticipant(participantData)
  …
}
// ingen else — participant-state behålls från förra deltagaren
```

Sidan har en korrekt "hittades inte"-gren på `:441`, men den nås aldrig eftersom `participant` aldrig nollställs. I en HashRouter-SPA är det exakt vad som händer när konsulenten klickar från deltagare A till deltagare B och B:s hämtning failar — B:s sida visar A:s uppgifter. I ett verktyg där man dokumenterar om människor är det en förväxlingsrisk, inte en kosmetisk bugg.

**Åtgärd:** `else { setParticipant(null); setGoals([]); setJournal([]) }`, och nollställ i `useEffect` innan hämtningen så mellanläget inte heller visar fel person.

---

### K9 — Ingen åtkomstlogg över konsulentens läsning av deltagardata

**MEDEL · Storlek M**

`CLAUDE.md` beskriver `/consultant` som "Hantera deltagare, **GDPR-logg**". Den loggen finns inte i vyn. Kommentaren i `SettingsTab.tsx:656` säger varför:

> `Åtkomstlogg-knappen togs bort 2026-06-11: audit_logs har admin-only …`

Verifierat mot prod:

```
select count(*) from audit_logs;  → 0
pg_policies: "Endast admins ser audit logs" (SELECT, role IN SUPERADMIN/ADMIN)
             "Aktör loggar egna handlingar" (INSERT, tillåter CONSULTANT)
```

Konsulenten *får* skriva men inte läsa. Och det enda stället i hela kodbasen som skriver är `consultantService.ts:182` — bulkutskick av meddelanden. Att en konsulent öppnar en deltagares CV, sparade jobb eller profil loggas **inte alls**. Tabellen är tom i prod.

För ett handläggarsystem över långtidsarbetslösa är läsloggen inte pynt: den är hur man i efterhand kan svara på "vem har tittat på mina uppgifter". Det är GDPR art. 5(2)/32-material och står i `docs/GDPR-ART30-REGISTER.md`-spåret.

**Åtgärd:** beslut behövs, inte kod först. Antingen (a) logga konsulentläsningar av deltagardata via en `SECURITY DEFINER`-funktion och ge deltagaren läsrätt på sin egen logg, eller (b) rätta `CLAUDE.md` så det inte påstås att loggen finns. Gör (b) oavsett.

---

### K10 — CV och sparade jobb delas utan samtyckesgrind, medan mående har en

**MEDEL · Storlek M**

Uppmätt genom att köra REST direkt med konsulentens egen session-token:

| tabell | konsulentens läsning | policy |
|---|---|---|
| `profiles` | 2 rader (sig själv + deltagaren) | — |
| `cvs` | **1 rad — deltagarens hela CV** | `profiles.consultant_id = auth.uid()` — ingen samtyckeskontroll |
| `saved_jobs` | **4 rader** | `profiles.consultant_id = auth.uid()` — ingen samtyckeskontroll |
| `diary_entries` | 0 rader ✅ | ingen konsulentpolicy alls |
| `mood_logs` | 0 rader ✅ | `participant_data_sharing.share_wellness_data = true` |

Art. 9-grinden håller — dagbok och mående är korrekt stängda, och `participant_data_sharing` för det här paret har `share_wellness_data: false`. Det fungerar som avsett.

Men samtyckestabellen har bara två kolumner: `share_health_data` och `share_wellness_data`. Det finns ingen spak för CV eller jobbsökning, och `DataSharingSettings.tsx` erbjuder bara de två togglarna. Samtidigt länkar `MyConsultant.tsx:381` deltagaren till `/settings?section=privacy` under rubriken **"Ändra vad du delar"** — en sida som inte kan ändra CV-delningen. Ögon-ikonerna bredvid är ärliga om *att* CV delas; länken lovar en kontroll som inte finns.

Att konsulenten ser CV:t är rimligt och sannolikt avsett. Att transparenssidan säger "ändra" när enda vägen är att bryta hela kopplingen är det inte.

**Åtgärd:** billigast är att skriva ut det: "Ditt CV och dina sparade jobb delas så länge kopplingen finns — vill du sluta dela dem avslutar du kopplingen." Länken kan peka på `RevokeConsultantLinkSection` i stället.

---

### K11 — Anteckningsräknaren räknar en tabell som ingen skriver till

**MEDEL · Storlek S**

Vyn räknar `consultant_notes`:

```sql
COALESCE((SELECT count(*) FROM consultant_notes WHERE consultant_notes.participant_id = p.id), 0) AS notes_count
```

Men "Snabbanteckning → Spara anteckning" i detaljvyn skriver till `consultant_journal` (`ParticipantDetailPage.tsx:368`). Prod: `consultant_notes` 0 rader, `consultant_journal` 0 rader. Ingen kod i `client/src` skriver till `consultant_notes` överhuvudtaget (de enda träffarna är en typdefinition, en realtidsprenumeration i `lib/supabase.ts:312` och ett olikanämnt fält i `jobSharingService.ts`).

Följd: deltagarkortets tredje ruta ("Anteckningar") och vyns `last_note_date` står kvar på 0 hur många anteckningar konsulenten än skriver. `last_note_date` läses inte av något UI idag, så skadan är begränsad till räknaren.

**Åtgärd:** peka vyn mot `consultant_journal`, eller skriv till `consultant_notes`. Välj ett — två tabeller för samma sak är hur den här buggen uppstod.

---

### K12 — Fliken "Tidslinje" i deltagardetaljen är permanent tom

**MEDEL · Storlek M**

`ParticipantDetailPage.tsx:346–352`:

```ts
// Timeline: tidigare visades hårdkodad mock-data … Borttaget 2026-05-09 (P1-skuld).
// user_activities-tabellen finns men RLS:en tillåter bara user_id = auth.uid() …
setTimeline([])
```

Fliken finns kvar i UI:t (uppmätt: knapparna "Översikt · Mål · Dagbok · Tidslinje"). Att ta bort mockdatan var rätt; att lämna kvar en flik som per konstruktion aldrig kan innehålla något är det inte. Samma rotorsak som ROADMAP H14 (`user_activities` har noll skrivare) — så även med rätt RLS skulle fliken vara tom.

**Åtgärd:** dölj fliken tills H14 är löst, eller visa `<EmptyState>` med en ärlig text i stället för ett tomt panelutrymme.

---

### K13 — Behörighetsspärren håller, men avvisar tyst

**LÅG · Storlek S**

Testat med deltagarkontot mot `/consultant`, `/consultant/participants`, `/consultant/analytics`, `/consultant/settings`. Samtliga fyra: omdirigering till `/#/oversikt`, inget felmeddelande, ingen HTTP 4xx, ingen konsolvarning (`kons-11`, `kons-12`). Ingen konsulentdata når klienten.

Bekräftat också att STA-konsulentvyn inte går att nå — vilket är **korrekt** enligt beslutet 2026-08-03, inte en bugg.

Kvarstår som ett litet UX-fynd: en deltagare som klickar en delad länk till `/consultant` hamnar på Översikt utan förklaring. En rad ("Den sidan är för arbetskonsulenter") vore vänligare än tystnad.

---

### K14 — Fyra knappar utan tillgängligt namn och två fält utan etikett på deltagarlistan

**LÅG · Storlek S**

Uppmätt i DOM på `/#/consultant/participants`:

```
imgsUtanAlt: 0 · knapparUtanNamn: 4 · faltUtanEtikett: 2
rubriker: ["H1:Konsultportal", "H3:Claude Testdeltagare"]
```

Fyra `<button>` saknar både text, `aria-label` och `title` (ikonknapparna för vy-växling och sortering). Två formulärkontroller saknar `<label>`, `aria-label` och `placeholder`. Rubrikordningen hoppar från H1 till H3 utan H2.

Konsulentvyn får ha en annan *ton* än deltagarvyn (DESIGN.md §2), men inte en annan tillgänglighetsnivå — WCAG 2.1 AA gäller hela portalen, och arbetskonsulenter kan själva ha funktionsnedsättningar.

---

### K15 — Konsulenten får hela deltagarnavigationen i sidomenyn

**LÅG · Storlek S**

Sidomenyn visar Översikt · Söka jobb · Karriär · Resurser · Din vardag, och först därunder sektionen KONSULENT → Konsultportal (`kons-07-aicoach-insikter.png`). Konsulentens huvudverktyg ligger alltså som sjätte post, under fem hubbar som är byggda för arbetssökande.

Det kan vara avsiktligt (konsulenten bör kunna prova verktygen hen rekommenderar). Men för någon som öppnar portalen 20 gånger om dagen för att arbeta med 30 deltagare är startpunkten på fel plats. Överväg att sätta `/consultant` som landningssida för `role = 'CONSULTANT'` och flytta deltagarhubbarna till en hopfälld "Prova deltagarvyn"-sektion.

---

### K16 — Vyn är begriplig; inga råa i18n-nycklar

**LÅG (positivt fynd) · —**

Automatisk sökning efter nyckelmönster (`x.y.z`) i renderad text på alla sex flikar: **noll** råa nycklar. i18n-paritet: `consultant.*` har 607 nycklar i `sv.json` och 607 i `en.json`, noll saknade.

Tonläget är genomgående konsekvent yrkesspråk ("Hantera och följ upp dina deltagare", "Insatseffekt", "Kohortanalys") — en tydlig switch från deltagarvyns "lugna vän", precis som DESIGN.md §2 tillåter. Två formuleringar är dessutom ovanligt hederliga och bör bevaras som mönster:

> *"För litet underlag för en meningsfull jämförelse — det behövs minst 3 aktiva deltagare i varje grupp."*
> *"Teamhantering kommer i en senare version. Just nu hanterar du dina deltagare som ensam konsulent här."*

Det är exakt det språk K6 saknar.

---

### K17 — Skalbarhet till 30 deltagare: databasen är inte problemet

**LÅG (premissavskrivning) · —**

Prod har **två** konsulenter och **31 kopplingar** — en av dem har **exakt 30 deltagare** (senast tilldelad 2026-06-10). Det är precis scenariot i uppdraget, och det körs skarpt idag.

Jag kunde inte logga in som den konsulenten, så jag mätte frågan i stället. `EXPLAIN (ANALYZE, BUFFERS)` på vyns underliggande select för just det consultant_id:t:

```
Planning Time: 16.167 ms
Execution Time: 22.549 ms
```

Vyns tre korrelerade subfrågor per rad (saved_jobs-count, notes-count, max notes-datum) går på index (`Bitmap Index Scan on idx_consultant_notes_participant`, 30 loops). 22,5 ms för 30 deltagare. Listan filtreras och sorteras klientsidigt (`ParticipantsTab.tsx:107–151`) utan paginering, vilket är rätt val vid den här storleken.

**Premissen "vyn skalar inte till 20–40 deltagare" håller inte tekniskt.** Det som inte skalar är omdömet: med `last_contact_at` alltid `null` (K3) flaggas alla 30 som "kräver uppmärksamhet", och då är triagen värdelös just vid den volym den behövs.

---

## DEL B — Prestanda i den inloggade portalen

### P1 — jsPDF ligger kvar i eager-grafen: 107,1 kB brotli på varje kall sidladdning

**KRITISK · Storlek S · REGRESSION: nej, men oåtgärdad sedan 2026-08-04**

Importgrafen traverserad från `dist/index.html` (endast statiska importer):

| eager chunk | rå kB | **brotli kB** |
|---|---:|---:|
| index-6-NFKzVD.js (entry) | 530,5 | **136,4** |
| **vendor-jspdf-Cc0Oa4Bo.js** | 401,3 | **107,1** |
| vendor-react-BtoxWAtw.js | 187,0 | 50,3 |
| vendor-supabase-CSTfef5T.js | 168,8 | 36,8 |
| vendor-router-hWhl3LKQ.js | 37,0 | 11,8 |
| vendor-query-BakbwGcJ.js | 34,4 | 9,2 |
| vendor-state-BLvTx9ZA.js | 6,5 | 2,6 |
| **EAGER JS** | **1 365,5** | **354,1** |
| eager CSS | 283,9 | 28,3 |
| **EAGER TOTALT** | **1 649,4** | **382,4** |

2026-08-04 mätte 352,8 kB brotli eager JS. Idag 354,1. **Ingenting har gjorts, och entry-chunken har vuxit 5,7 kB rå.** jsPDF står för 30,2 % av all eager JS.

Åtgärden och orsaken står oförändrat i `docs/review-2026-08-04/prestanda.md` P1 (Vites `__vitePreload`-helper hamnade i jsPDF-chunken). Jag har inget att lägga till annat än att bekräfta att den fortfarande gäller, och att den rekommenderade CI-grinden (fryst tak för eager brotli) inte heller är byggd.

### P2 — Översikt gör fortfarande 43 Supabase-anrop varav 21 dubbletter

**KRITISK · Storlek M · REGRESSION: nej, oförändrad**

Uppmätt, median över 3 kalla körningar mot produktionsbygget:

| sida | requests | Supabase-anrop | **dubbletter** |
|---|---:|---:|---:|
| **/oversikt** | 81 | **43** | **21** |
| /min-vardag | 67 | 21 | 8 |
| /jobb | 56 | 17 | 7 |
| /ai-team | 66 | 20 | 7 |
| /karriar | 52 | 14 | 6 |
| /resurser | 53 | 15 | 6 |
| /applications | 65 | 14 | 5 |
| /job-search | 84 | 10 | 3 |
| /cv | 85 | 8 | 2 |
| /exercises | 75 | 9 | 1 |

Dubbletterna på Översikt, siffra för siffra identiska med 2026-08-04:

```
13x GET /rest/v1/profiles?select=*&id=eq.5b0904ac-…
 8x GET /auth/v1/user
 2x GET /rest/v1/cvs?select=id,updated_at&user_id=eq.…
 2x GET /rest/v1/cover_letters?select=id,title,created_at&user_id=eq.…
```

Rotorsaken är oförändrad: `client/src/hooks/useSupabase.ts:13–17` — `useAuth()` är fortfarande rå `useState`/`useEffect`, inte React Query, så de sex hookarna som anropar den får varsin fetch.

**Ny observation:** `/ai-team` har 7 dubbletter (7× `auth/v1/user`, 2× `cvs?select=*`) och mättes inte 2026-08-04. Den ärver samma mönster.

### P3 — CV-mallminiatyrerna är fortfarande 898 kB, och de **är** LCP-elementet på slow 3G

**HÖG · Storlek S · REGRESSION: nej, oförändrad**

`client/dist/templates/` efter `ViteImageOptimizer`:

```
manhattan 98,7 · budapest 91,2 · sidebar 85,1 · executive 83,4 · chicago 82,0
nordic 81,6 · atelier 81,3 · creative 77,4 · rotterdam 75,1 · minimal 71,6 · centered 70,5
SUMMA 898,0 kB   (2026-08-04: 903 kB)
```

Uppmätt i webbläsaren på `/#/cv`: **1 607 kB transferSize totalt, varav 910 kB bilder** (mot 529–776 kB på alla andra sidor). Bilderna är 1588×2246 px och renderas i ≈256 px-rutor.

Det nya beviset är LCP-spåret på slow 3G, som 2026-08-04 inte hade:

```
/cv  LCP-kandidater: 2576:P → 12156:P → 19388:P → 20476:P → 30396:IMG (38 509 px²)
```

Sidans sista och största LCP-kandidat är en `<IMG>` som landar vid **30,4 sekunder**. Mallminiatyrerna är alltså inte bara tung last — de *är* det som gör CV-sidans LCP till 30 s. Åtgärden (omgenerering i 512×724 WebP via `e2e/cv-template-snapshots.cjs`) är den enskilt största hävstången på den sidan.

### P4 — Slow 3G: 15,4 s till rubrik på Översikt, 30,4 s till LCP på CV

**HÖG · Storlek — (åtgärdas via P1/P3/P7)**

400 kb/s · 400 ms RTT · 4× CPU · 390×844 · 45 s observationsfönster · 2 körningar. Spridningen är extremt låg (≤0,4 %), så talen är stabila.

| sida | FCP | **h1 synlig** | LCP | CLS | LCP-spår (ms:element:px²) |
|---|---:|---:|---:|---:|---|
| /oversikt | 2 576 | **15 447** | 15 792 | 0,009 | 2576:P → 12176:P → 15792:P:14030 |
| /cv | 2 576 | **19 050** | 30 396 | 0,018 | … → 20476:P:13984 → **30396:IMG:38509** |
| /job-search | 2 572 | **20 279** | 29 304 | **0,095** | … → 20624:P:6216 → 29208:H3 → 29304:H3 |

Två saker är värda att läsa noga:

1. **FCP är 2,57 s på alla tre sidorna, till tiondelen.** Det är den eagera bundlen som sätter golvet, inte sidans innehåll — precis P1:s poäng, nu med tre oberoende mätpunkter.
2. **Det går 9,6 sekunder mellan FCP (2,6 s) och andra LCP-kandidaten (12,2 s) på samtliga tre sidor.** Under nästan tio sekunder ser användaren en skärm som är målad men tom på innehåll. Det är den period där en person med dålig uppkoppling stänger fliken.

Faktisk överföring på en kall `/oversikt` i prod (brotli, summerat över de resurser som mätningen visar att sidan faktiskt hämtar):

```
index 136,4 · jspdf 107,1 · sentry 71,0 · react 50,3 · supabase 36,8
animation 35,9 · css 28,3 · router 11,8 · coach-widget 11,8 · query 9,2 · PageLayout 4,4
SUMMA ≈ 502,9 kB brotli
```

Av dem behövs 107,1 kB (jspdf, P1) och 71,0 kB (sentry, P7) inte för att visa sidan. **Det är 35 % av lasten, ≈ 3,6 s vid 400 kb/s.**

**Svar på frågan i uppdraget:** nej, portalen är inte rimligt användbar på slow 3G med en gammal telefon. 15–20 sekunder till första rubriken ligger långt över vad någon väntar ut, och LCP-målet i ROADMAP D6 (< 2 500 ms) missas med 6–12×.

**Ärlig reservation om jämförelsen med 2026-08-04:** LCP-talen ser mycket sämre ut (oversikt 13,3 → 15,8 s; cv 13,9 → 30,4 s), men jag observerade i 45 s där förra körningen använde ett kortare fönster — jag fångar därför senare LCP-kandidater som den missade (t.ex. `/cv`:s IMG vid 30,4 s). Det jämförbara måttet är "meningsfullt innehåll"/"h1 synlig", och det är **i praktiken oförändrat**: oversikt 16,1 → 15,4 s, cv 19,5 → 19,1 s, job-search 20,6 → 20,3 s. Läs alltså inte LCP-skillnaden som en regression.

### P5 — TBT vid 4× CPU har försämrats på Översikt; AI-team är värst

**MEDEL · Storlek M · REGRESSION: ja, på /oversikt**

4× CPU, obegränsat nät (isolerar CPU), 3 körningar, median:

| sida | TBT@4x 2026-08-09 | TBT@4x 2026-08-04 | longtasks >50 ms | längsta |
|---|---:|---:|---:|---:|
| /ai-team | **806** | ej mätt | 7 | 366 |
| /job-search | 586 | 1 651 | 8 | 239 |
| /oversikt | **522** | 322 | 5 | 243 |
| /exercises | 407 | 512 | 4 | 205 |
| /cv | 393 | 1 484 | 3 | 269 |

`/oversikt` har gått från 322 → 522 ms (+62 %). Det är en verklig försämring på en sida som är portalens startpunkt.

`/cv` och `/job-search` ser kraftigt förbättrade ut, men 2026-08-04-rapporten flaggade själv att just de två hade extrem spridning (231–1 723 respektive 362–3 079 ms) och kallade sin egen median osäker. Mina körningar är stabila, men jag kan inte belägga att förbättringen är verklig snarare än att förra medianen var brus. **Läs inte de två raderna som en vinst.**

`/ai-team` mättes inte förra gången och är nu den tyngsta sidan för svag hårdvara: 806 ms TBT och en enskild task på 366 ms.

På obegränsad CPU är TBT 0–17 ms på samtliga tio sidor. CPU är alltså bara ett problem på svag hårdvara — vilket är målgruppens hårdvara.

### P6 — CLS: `/exercises` är nytt på listan, `/job-search` når 0,095 på mobil

**LÅG–MEDEL · Storlek S**

Desktop, median över 3 körningar:

| sida | CLS 2026-08-09 | CLS 2026-08-04 |
|---|---:|---:|
| /cv | 0,0789 | 0,079 |
| **/exercises** | **0,0664** | ej i listan |
| /job-search | 0,0147 | 0,0346 |
| /applications | 0,0039 | 0,0039 |
| övriga sex | ≤ 0,0012 | ≤ 0,0012 |

Alla ligger under Googles 0,1 på desktop. **Men på mobil slow 3G mäter `/job-search` 0,0949** — 5 % under gränsen. `/exercises` 0,0664 är nytt sedan sist och bör spåras.

`/cv`:s 0,0789 har samma orsak som P3 (mallminiatyrer utan `width`/`height`) och åtgärdas gratis i samma svep.

### P7 — Sentry laddas på varje sida: 71,0 kB brotli som inte behövs för att rendera

**MEDEL · Storlek S**

Uppmätt via resource timing på alla tre profilerade sidorna: `sentry-CaY6kY0R.js` hämtas alltid, 83 kB gzip / **71,0 kB brotli** / 254,8 kB rå. Den importeras dynamiskt från entry, så den syns inte i den statiska eager-grafen (P1) — men den laddas i praktiken varje gång ändå. Efter jsPDF och entry-chunken är den portalens tredje tyngsta post på en kall sidladdning.

Samma sak gäller `vendor-animation` (framer-motion, 35,9 kB brotli), som 2026-08-04 friade som "inte i eager-grafen". Formellt korrekt, men den hämtas ändå på `/oversikt`, `/cv` och `/job-search` — alltså i praktiken alltid.

**Åtgärd:** skjut upp Sentry-importen till efter `load` (eller `requestIdleCallback`) så den inte konkurrerar med kritisk väg. Vid 400 kb/s är 71 kB ≈ 1,4 s. Att mäta "eager" som "statisk importgraf" missar den här klassen helt — **grinden i P1 bör mäta vad som faktiskt hämtas före LCP, inte bara vad som är statiskt importerat.**

### P8 — DOM-storlek: `/job-search` har krympt, `/exercises` ligger kvar

**LÅG · Storlek —**

| sida | DOM-noder 2026-08-09 | 2026-08-04 |
|---|---:|---:|
| /exercises | 2 699 | 2 713 |
| /job-search | **1 425** | 2 158 |
| /cv | 668 | 634 |
| /applications | 659 | — |
| /ai-team | 521 | — |
| /oversikt | 264 | 339 |

Ingen sida passerar 3 000 noder. 2026-08-04:s slutsats står sig: **bygg inte virtualisering.**

### P9 — Bundle: totalen är oförändrad, inga nya tunga eager-poster

**LÅG · Storlek —**

236 JS/CSS-filer, **8 758,1 kB rå / 2 075,2 kB brotli** (2026-08-04: 238 filer, 8 734,6 / 2 069,7). Toppen är oförändrad — `vendor-react-pdf` 383,2 kB brotli (lazy), `contentApi` 241,5 kB (lazy), entry 136,4 kB (eager), `vendor-jspdf` 107,1 kB (eager, P1). Ingen ny tung eager-post har tillkommit.

---

# 3. Förbättrings- och utvecklingsförslag

## Vad en arbetskonsulent behöver som verktyget inte ger idag

Rangordnat efter vad som skulle förändra en arbetsdag med 30 deltagare mest.

**1. Ett kontaktregister som stämmer.** Det här är den enskilt viktigaste luckan (K3). En arbetskonsulent ringer, träffar folk fysiskt, skickar SMS. Portalen har ingen väg att registrera något av det — `last_contact_at` skrivs aldrig, ens när man skickar meddelande *i* portalen. Utan det kan verktyget aldrig svara på den fråga en konsulent ställer sig varje morgon: *vem har jag inte hört av mig till?* En "Jag har haft kontakt"-knapp med typ (telefon/möte/mejl) och fritextrad, som skriver `last_contact_at` och en journalrad, skulle göra hela triagelagret (KPI, Min dag, filter, detaljvy) fungerande på en gång. **Storlek M. Störst effekt av allt i den här rapporten.**

**2. En bevakning som hör av sig utan att man loggar in.** K6 visar att inställningarna redan finns och beskriver rätt signaler — de gör bara ingenting. Den viktigaste är "deltagare har varit inaktiv i N dagar", eftersom det är den enda signalen ingen människa kan hålla i huvudet för 30 personer. Ett dagligt cron-jobb + `send-invite-email`-mönstret som redan finns räcker. **Storlek M.** Notera beroendet: signalen kräver att K2 löses först, annars larmar den på `profiles.updated_at`.

**3. En veckovy i stället för en dagvy.** "Min dag" visar dagens möten och deadlines inom 7 dagar. En konsulent planerar i veckor: vem ska jag träffa, vem har uppföljning, vilka mål förfaller. En kalendervy med deltagarnamn skulle ersätta det parallella Outlook-schema som med säkerhet används idag.

**4. Anteckningar som är sökbara och tidsstämplade per deltagare.** Journalen finns (`consultant_journal`) men når man den bara via en deltagares detaljsida, och räknaren är kopplad till fel tabell (K11). En konsulent behöver kunna svara på "vad sa vi senast?" utan att klicka sig in — och vid en uppföljning från uppdragsgivaren behöver anteckningarna kunna filtreras på datum och kategori.

**5. Rapport per deltagare, inte bara per portfölj.** Dagens PDF-rapport (`ReportGeneratorDialog`) är aggregerad över hela deltagargruppen. Det som faktiskt efterfrågas av en uppdragsgivare är oftast en avstämning för *en* person: vilka insatser, vilka mål, vilken progress, vilka hinder. `ReportDraftDialog` finns redan i detaljvyn och gör rätt sak GDPR-mässigt (refererar personen som "deltagaren") — bygg vidare på den snarare än på portföljrapporten.

**6. Ett ärligt "vet inte" i stället för ett tal.** K5 (0 % vs 100 %) och K4 (QNaN) har samma grundorsak: koden hellre räknar fram något än erkänner att underlaget saknas. Vyn har redan två förebilder i egen text ("För litet underlag för en meningsfull jämförelse…", "Teamhantering kommer i en senare version"). Gör det till regel: **ett nyckeltal utan underlag ska visa "—" och en rad om varför, aldrig 0 % eller 100 %.** För en konsulent som ska motivera ett beslut om en människa är ett tomt fält användbart och ett påhittat tal skadligt.

**7. Överlämning mellan konsulenter.** Portalen antar en konsulent per deltagare (`profiles.consultant_id`, `consultant_participants`). Sjukdom, semester och byten sker. Det finns ingen väg att lämna över en deltagare, och heller inget team-begrepp (sidan säger det själv ärligt). Det blockerar drift bortom en handfull konsulenter.

## Prestanda — prioriterad ordning

| # | Åtgärd | Vinst | Storlek |
|---|---|---|---|
| 1 | **P1** — `__vitePreload` ur jsPDF-chunken | −107,1 kB brotli **på varje kall sidladdning i hela portalen** (−30 % eager JS), ≈ −2,1 s @ 400 kb/s | S |
| 2 | **P3** — mallminiatyrer i 512×724 WebP | −800 kB på `/#/cv`; tar bort sidans 30,4 s LCP-element helt | S |
| 3 | **P7** — skjut Sentry till efter `load` | −71,0 kB brotli före LCP på varje sida, ≈ −1,4 s @ 400 kb/s | S |
| 4 | **P2** — `useAuth` läser `authStore` | −21 requests på Översikt (−49 %), kortar kedjan från 3 led till 1 | M |
| 5 | Grind: fryst tak för **vad som hämtas före LCP** (inte bara statisk graf) | hindrar att P1 och P7 kommer tillbaka | S |
| 6 | P6 — `width`/`height` på mallminiatyrer | CLS 0,079 → ~0 (görs ihop med P3) | S |
| 7 | P5 — rotorsaka `/ai-team` 806 ms TBT och `/oversikt`-regressionen | okänd tills mätt | M |
| — | ~~virtualisering~~ | **bygg inte** — ingen sida över 3 000 DOM-noder | — |

Punkt 1–3 är alla storlek S och ger tillsammans **−178 kB brotli före LCP på varje sida** plus −800 kB på CV-sidan. Det är ungefär 3,6 s snabbare på 400 kb/s, för mindre än en dags arbete.

---

# 4. Vad jag inte hann granska

- **Konsulentvyn med 30 deltagare i webbläsaren.** Kontot `eef3d71f-…` har 30 kopplingar i prod men jag har inget lösenord. Allt UI testades med 1 deltagare; skalbarhetsbedömningen (K17) vilar på kodläsning + `EXPLAIN ANALYZE`, inte på en skärm med 30 kort. Sortering, bulkmarkering och `BulkActionsDialog` är otestade vid volym.
- **Inbjudningsflödet hela vägen.** Dialogen öppnar och validerar (`kons-13-bjud-in.png`), men jag skickade ingen inbjudan — det hade skrivit till `invitations` och triggat `send-invite-email` mot en riktig adress. Om raden faktiskt skapas och mejlet går fram är overifierat.
- **Kommunikationsfliken i drift.** Inga meddelanden och inga möten finns i testdatan, så jag såg bara tomtillstånden. Mötesbokning, mötespåminnelser och trådvyn är otestade med innehåll. Samma sak för `IncomingSharedJobs` och `JobCollectionDialog`.
- **Att inställningarna faktiskt sparas.** Jag läste sparkoden men klickade inte igenom en spara-och-ladda-om-cykel på Inställningar-fliken.
- **Excel-exportens innehåll.** `konsultrapport-2026-08-09.xlsx` laddades ned men jag öppnade inte filen — om "QNaN NaN" följer med dit också är okänt (i PDF-vägen är det belagt).
- **PDF-rapporten renderad.** Dialogen öppnar och Kohortanalys är förvald, men jag genererade ingen PDF.
- **INP.** Kräver riktig interaktion under mätning; TBT är rapporterat som labbproxy, precis som 2026-08-04.
- **Fältdata.** Ingen RUM/CrUX finns. Alla tal är labb mot `localhost`; Vercels edge-TTFB och verklig fontkostnad (`fonts.gstatic.com` hämtades inte i headless) är omätta.
- **`/ai-team`:s 806 ms TBT rotorsakad.** Jag konstaterade talet men körde ingen profileringstrace.
- **Mörkt läge och mobil layout i konsulentvyn.** Endast desktop 1440×900 granskades.
