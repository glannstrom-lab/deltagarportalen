# GDPR Art 30 — Register över behandlingar

**Lagkrav:** GDPR Art 30 (registerförteckning över behandlingar).
**Datum:** 2026-08-21 (B4 och B16 rättade efter granskningen av Intresseguiden; föregående
version 2026-07-27, dessförinnan 2026-05-15)
**Personuppgiftsansvarig:** [Företagsnamn — fyll i]
**Kontakt DPO:** dpo@jobin.se

---

## Revisionsnot 2026-08-21 (Intresseguiden — B4 och B16)

Granskningen av `/interest-guide` visade att registret beskrev en skyddsnivå som inte fanns.
Tre påståenden i B4 var osanna, och de hade varit det sedan behandlingen skrevs in.

| Stod i registret | Verkligheten, mätt i produktion |
|---|---|
| Tabeller: `interest_results`, `user_adaptations`, `participant_data_sharing` | `interest_results` hade **1 rad** och skrivs inte av någon kodväg. Den faktiska ICF-datan låg i `interest_guide_history` (10 rader) och `interest_guide_progress` (22 rader) — båda redovisade under **B16 som avtalsdata**, trots att de bär självskattad kognition, koncentration, motorik, sensorik och ork |
| "Mottagare: tilldelad konsulent **endast** om `share_health_data = true`" | Gällde `interest_results`. Policyn på `interest_guide_history` krävde bara konsulentroll + tilldelning — konsulenten kunde alltså läsa deltagarens funktionsförmågeprofil **utan** delningssamtycke |
| "Säkerhetsåtgärder: RLS via `check_health_consent()`" | Funktionen fanns och anropades i en INSERT-policy på `interest_results` — men en `FOR ALL`-policy på samma tabell saknade `WITH CHECK`. Postgres använder då `USING` som check, och permissiva policyer OR:as, så det effektiva villkoret blev `auth.uid() = user_id`. **Samtycket kunde inte fälla någon skrivning.** Samma mönster som lärdomen 2026-08-04 om `profiles`, `mood_logs` och `storage.objects` |

**Vad som gjordes 2026-08-21:**

1. `supabase/migrations/20260821_intresseguide_art9_rls.sql` körd mot produktion. Den tar bort
   `FOR ALL`-policyn på `interest_results` (så samtyckesgrinden blir bindande), lägger
   `share_health_data`-villkoret i konsulentpolicyn på `interest_guide_history`, och tar bort en
   överflödig dubblettpolicy på `interest_guide_progress`. Utfallet är verifierat i `pg_policies`
   — inte kommandots exitkod.
2. Klientkoden (`TestTab`) grindar nu **skrivningen** av ICF-delen på `profiles.health_consent_at`.
   Tidigare omslöt `HealthConsentGate` bara renderingen, så data lagrades oavsett samtycke: vid
   granskningen fanns 10 sådana rader och **en** profil med samtycke satt.
3. B4 utökad med de två tabellerna och med en uttrycklig redovisning av var grinden sitter per
   tabell. B16 hänvisar dit.

**Kvarstår, och är inte dokumentation utan beslut:** för `interest_guide_history`,
`interest_guide_progress` och `user_adaptations` ligger art. 9-grinden i applikationskoden, inte i
RLS. `user_adaptations` har ingen samtyckesgrind alls vid lagring, trots att registret anger
Art 9.2.a som rättslig grund. Se residualrisken i B4 och ROADMAP IG-B.

---

## Revisionsnot 2026-07-27 (ROADMAP H7)

Registret stämdes av mot **produktionsdatabasen** via `supabase/schema-snapshot.json`
(genererad med `npm run schema:refresh`), inte mot migrationsfilerna. Resultatet:

| | Antal |
|---|---|
| Tabeller/vyer i produktion vid revisionen | 150 |
| Namngivna i registret före revisionen | 23 |
| Namngivna men som **inte finns** i produktion | 3 |
| Fanns i produktion men **saknades** i registret | 130 |
| **Tabeller/vyer efter att dött schema raderats (H3, samma dag)** | **135** |

**Rättade felaktiga tabellnamn i befintliga behandlingar:**

| Stod i registret | Verklighet |
|---|---|
| `applications` (B3) | Heter `saved_jobs` — tabellen bär hela ansökningspipelinen, inte bara sparade jobb |
| `energy_history` (B5) | Finns inte. Energidata ligger i `mood_logs.energy_level` och `user_preferences.energy_level` |
| `linkedin_profiles` (B10) | Finns inte. Ingen LinkedIn-import är implementerad — se anmärkning i B10 |

**Nya behandlingar tillagda:** B13–B21 (STA, konsulentverktyg, jobbsökning, karriärplanering,
lärande, nätverk, inbjudningar, drift-/säkerhetsloggar, e-postutskick).

**Ny bilaga A:** fullständig avstämning tabell → behandling för samtliga 150 tabeller, så att
registret kan verifieras mot databasen i stället för att tas på tro. Bilagan är också underlaget
för `RETENTION-POLICY.md`.

> **Vad som fortfarande kräver beslut, inte dokumentation:** rättslig grund och gallringstid för
> de nya behandlingarna är ifyllda utifrån vad koden gör och vad som är rimligt — de är markerade
> `[bekräftas]` där de bör stämmas av med AI-juristen (A2) innan signering. 15 tabeller är döda och
> föreslås raderas före signering (ROADMAP H3), vilket krymper bilagan.

---

## Behandlingar

### B1: Användarkonton & autentisering

| Aspekt | Värde |
|---|---|
| Ändamål | Identifiera användare, säker inloggning, sessionshantering |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare, konsulenter, administratörer |
| Kategorier personuppgifter | Email, namn, lösenordshash, sessionstoken, senaste inloggning |
| Kategorier mottagare | Supabase Auth (biträde), användaren själv |
| Tredjelandsöverföring | Nej (Supabase EU/Irland) |
| Gallring | Tills användaren raderar konto + 30 dagar för säkerhetsloggar |
| Säkerhetsåtgärder | bcrypt-hashing, JWT med kort livstid, RLS på `auth.users` |
| Tabeller | `auth.users`, `profiles` |

### B2: Användarprofil

| Aspekt | Värde |
|---|---|
| Ändamål | Personalisering, deltagaresinformation till konsulent |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare |
| Kategorier personuppgifter | Namn, ort, ålder, telefon, profilbild, språk, utbildning, drömjobb |
| Mottagare | Tilldelad konsulent (om datadelning godkänd) |
| Tredjelandsöverföring | Nej |
| Gallring | Med konto-radering |
| Säkerhetsåtgärder | RLS `auth.uid() = id`, audit via `consent_history` |
| Tabeller | `profiles`. `user_adaptations` stod även här till 2026-08-21 — men den bär arbetsanpassningsbehov och redovisas under **B4** med Art 9.2.a som grund. Samma tabell kan inte ha två rättsliga grunder; B4 gäller |

### B3: CV och jobbansökningar

| Aspekt | Värde |
|---|---|
| Ändamål | Hjälpa användaren skapa CV, bevara historik |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare |
| Kategorier personuppgifter | Yrkeshistorik, utbildning, kompetenser, kontaktuppgifter, fritext |
| Mottagare | Tilldelad konsulent (om delning godkänd), Vercel Blob (CV-PDF) |
| Tredjelandsöverföring | Vercel Blob region måste verifieras (sannolikt EU efter åtgärd) |
| Gallring | Med konto-radering eller manuell borttagning |
| Säkerhetsåtgärder | RLS, AES-256 at rest, magic-byte-validering vid upload |
| Tabeller | `cvs`, `cv_versions`, `cv_analyses`, `cv_shares`, `cover_letters`, `elevator_pitches` |

> Rättat 2026-07-27: registret angav `applications`, en tabell som inte finns. Ansökningar bor i
> `saved_jobs` och dokumenteras i **B14** (jobbsökning och ansökningar).

### B4: Hälsodata (Art 9 — uttryckligt samtycke)

| Aspekt | Värde |
|---|---|
| Ändamål | Anpassa portalen efter användarens energinivå, kognitiva och funktionsmässiga behov |
| Rättslig grund | Uttryckligt samtycke (Art 9.2.a) — `HealthConsentGate` |
| Kategorier registrerade | Deltagare som aktivt slagit på hälsodata-stöd |
| Kategorier personuppgifter | Energinivå, kognitiv kapacitet, kommunikationsstil, motorik, sensorisk bearbetning, koncentration, funktionsanpassningar. **Inklusive intresseguidens självskattning av funktionsförutsättningar** (åtta frågor om ork, koncentration, motorik, sinnesintryck, kognition och kommunikation) samt den härledda profilen |
| Mottagare | Tilldelad konsulent **endast** om `participant_data_sharing.share_health_data = true`. Gäller sedan 2026-08-21 även `interest_guide_history` — se revisionsnoten nedan |
| Tredjelandsöverföring | Nej (lagring i EU). Intresseguidens beräkning sker helt i klienten; inga svar skickas till någon AI-tjänst |
| Gallring | Med samtyckeåterkall eller konto-radering. Samtliga tabeller nedan har `ON DELETE CASCADE` mot `auth.users` respektive `profiles` (verifierat mot `pg_constraint` 2026-08-21) |
| Säkerhetsåtgärder | Se tabellen nedan — grinden ligger på olika nivå för olika tabeller, och det ska framgå |
| Tabeller | `interest_results`, `interest_guide_progress`, `interest_guide_history`, `user_adaptations`, `participant_data_sharing` |

**Var grinden faktiskt sitter** (avstämt mot `pg_policies` i produktion 2026-08-21):

| Tabell | Hälsosamtycke vid lagring | Delningskrav mot konsulent | Anmärkning |
|---|---|---|---|
| `interest_results` | **RLS** — `check_health_consent()` på INSERT | **RLS** — `share_health_data` | Skrivs inte av någon kodväg idag (1 rad i produktion). Läses via fallback till `interest_guide_history` |
| `interest_guide_history` | **Klientkod** — `TestTab` utelämnar `icf_profile` och ICF-svaren när `health_consent_at` saknas | **RLS** — `share_health_data` | 10 rader. Grinden är applikationsnivå, inte RLS — se residualrisk nedan |
| `interest_guide_progress` | **Klientkod** — samma grind | Ingen konsulentåtkomst | 22 rader. `answers` bär de råa ICF-svaren |
| `user_adaptations` | **Ingen** — RLS begränsar bara till egen `user_id` | Ingen konsulentåtkomst via RLS | Anpassningsbehoven lagras utan uttryckligt samtycke. Se residualrisk |
| `participant_data_sharing` | — | — | Bär själva delningsbesluten |

> **Residualrisk, oreglerad:** för `interest_guide_history`, `interest_guide_progress` och
> `user_adaptations` vilar art. 9-grinden på **applikationskoden**, inte på RLS. En annan klient
> med användarens token kan alltså skriva hälsodata utan samtycke. Att flytta grinden till RLS
> kräver antingen en `check_health_consent()`-villkorad INSERT-policy per tabell eller att
> ICF-delen bryts ut i en egen tabell. Det är ett öppet beslut (ROADMAP IG-B).

### B5: Wellness & dagbok (Art 9)

| Aspekt | Värde |
|---|---|
| Ändamål | Användarens egen reflektion, mental hälsostöd |
| Rättslig grund | Uttryckligt samtycke (Art 9.2.a) — `WellnessConsentGate` |
| Kategorier registrerade | Deltagare som aktivt använder wellness-modul |
| Kategorier personuppgifter | Mood-loggar, dagboksinlägg, gratitude-listor, energi-spårning |
| Mottagare | Endast användaren själv (default) |
| Tredjelandsöverföring | Nej |
| Gallring | Med användares borttagning eller konto-radering |
| Säkerhetsåtgärder | RLS, ej delningsbart med konsulent som default |
| Tabeller | `mood_logs`, `diary_entries`, `diary_streaks`, `gratitude_entries`, `writing_prompts` (innehåll, ej persondata) |

> Rättat 2026-07-27: registret angav `energy_history`, som inte finns. Energinivå lagras i
> `mood_logs.energy_level` samt `user_preferences.energy_level`/`energy_updated_at` (B18).
> `mood_history` och `calendar_mood_entries` finns i databasen men är **tomma och utan levande
> skrivare** — se bilaga A och ROADMAP H8/C14.

### B6: AI-funktioner (samtycke)

| Aspekt | Värde |
|---|---|
| Ändamål | Generera CV-text, brev, intervjutips, karriärplaner, coachning |
| Rättslig grund | Samtycke (Art 6.1.a) — `AiConsentGate` |
| Kategorier registrerade | Deltagare som aktiverat AI-funktioner |
| Kategorier personuppgifter | Promptar (kan innehålla CV-data, frågor, kontext), AI-output |
| Mottagare | OpenRouter Inc. (USA — biträde) |
| Tredjelandsöverföring | **JA — USA**. Krav: SCC + TIA. OpenRouters DPF-status MÅSTE verifieras |
| Gallring | `ai_usage_logs` raderas efter 90 dagar (cron) |
| Säkerhetsåtgärder | TLS, OpenRouter-villkor förbjuder modellträning på input, rate-limit, daglig token-cap |
| Tabeller | `ai_usage_logs`, `ai_team_sessions` |

### B7: Konsulent-deltagare-koppling

| Aspekt | Värde |
|---|---|
| Ändamål | Konsulent kan ge stöd till tilldelad deltagare |
| Rättslig grund | Avtal (Art 6.1.b) + samtycke för specifika datakategorier (Art 6.1.a) |
| Kategorier registrerade | Konsulenter, deltagare |
| Kategorier personuppgifter | Konsulent-ID, deltagar-ID, tilldelningsdatum, datakategori-flaggor |
| Mottagare | Konsulentens organisation |
| Tredjelandsöverföring | Nej |
| Gallring | Vid avregistrering av deltagare eller bytet av konsulent |
| Säkerhetsåtgärder | RLS, granulär datadelning per kategori, full audit-trail |
| Tabeller | `consultant_participants`, `participant_data_sharing`, `data_sharing_audit` |

### B8: Säkerhetsloggning (Sentry)

| Aspekt | Värde |
|---|---|
| Ändamål | Felövervakning, säkerhetsincident-detektering |
| Rättslig grund | Berättigat intresse (Art 6.1.f) — efter cookie-consent |
| Kategorier registrerade | Alla användare (efter consent) |
| Kategorier personuppgifter | `user.id` (inte email), error stack traces, browser info |
| Mottagare | Sentry / Functional Software Inc. (multi-region) |
| Tredjelandsöverföring | Sentry sannolikt USA — bör migrera till sentry.io/eu |
| Gallring | 90 dagar (Sentry default) |
| Säkerhetsåtgärder | Lazy-load bakom cookie-consent, PII-strip av email, auth headers, cookies |
| Lokal config | `client/src/lib/sentry.ts` |

### B9: Cookie- och samtyckeshistorik

| Aspekt | Värde |
|---|---|
| Ändamål | Bevisa samtyckesgrund, accountability (Art 5.2) |
| Rättslig grund | Rättslig förpliktelse (Art 6.1.c) — GDPR-krav |
| Kategorier registrerade | Alla användare som ger eller drar tillbaka samtycke |
| Kategorier personuppgifter | User-ID, samtyckestyp, IP, user agent, tidstämpel, version av text |
| Mottagare | Endast intern administration |
| Tredjelandsöverföring | Nej |
| Gallring | 5 år (juridisk preskription) |
| Säkerhetsåtgärder | RLS, ej raderingsbart av användaren själv |
| Tabeller | `consent_history`, `user_consent_status` (vy) |

### B10: Tredjepartsintegrationer (opt-in)

| Aspekt | Värde |
|---|---|
| Ändamål | Användarens valbara integrationer |
| Rättslig grund | Samtycke (Art 6.1.a) per integration |
| Kategorier registrerade | Deltagare som aktiverat integration |
| Kategorier personuppgifter | OAuth-tokens, importerad profildata (LinkedIn), kalenderhändelser (Google) |
| Mottagare | LinkedIn Inc., Google LLC |
| Tredjelandsöverföring | **JA — USA** för båda. Skyddsåtgärd: OAuth, opt-in, lagras pseudonymiserat |
| Gallring | Med integration-borttagning eller konto-radering |
| Säkerhetsåtgärder | OAuth refresh-token, rate-limiting på endpoints |
| Tabeller | `user_credentials`, `calendar_events`, `calendar_goals` |

> Rättat 2026-07-27: registret angav `linkedin_profiles`, som inte finns — **ingen
> LinkedIn-profilimport är implementerad**. LinkedIn-optimeraren skickar text till AI:n (B6) och
> hämtar ingenting från LinkedIn. LinkedIn Inc. ska därför **inte** stå som mottagare förrän en
> import faktiskt byggs. Se även biträdeslistan.

### B11: AF / Bolagsverket / Arbetsförmedlingen-integrationer

| Aspekt | Värde |
|---|---|
| Ändamål | Söka jobb, hämta utbildningsförslag, företagsinformation |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare som söker jobb/företag |
| Kategorier personuppgifter | **Inga utgående persondata** — bara sökord/ID:n |
| Mottagare | Arbetsförmedlingen, Bolagsverket (publika API:er) |
| Tredjelandsöverföring | Nej (svenska myndigheter) |
| Gallring | Bara cache (max 24h) |
| Säkerhetsåtgärder | Edge functions med JWT-check + rate-limit |
| Funktioner | `bolagsverket`, `af-*` edge functions |

### B12: Account-deletion-grace period

| Aspekt | Värde |
|---|---|
| Ändamål | 14-dagars ångerperiod efter användares raderingsbegäran |
| Rättslig grund | Avtal (Art 6.1.b) — del av Art 17-implementation |
| Kategorier registrerade | Användare som begärt radering |
| Kategorier personuppgifter | User-ID, begärandes-tidpunkt, planerad raderingstid |
| Mottagare | Endast intern process |
| Tredjelandsöverföring | Nej |
| Gallring | Vid genomförd radering eller återkall |
| Säkerhetsåtgärder | RLS, edge function `delete-account` med service role |
| Tabeller | `account_deletion_requests`, `admin_audit_log` |

### B13: Steg till arbete (STA) — arbetsprövning

> **Detta var registrets största lucka.** Hela STA-modulen (10 tabeller) saknades, trots att den
> behandlar strukturerade bedömningar av en persons arbetsförmåga — bland det mest känsliga
> portalen hanterar.

| Aspekt | Värde |
|---|---|
| Ändamål | Genomföra och dokumentera arbetsprövning: aktivitetsplan, självskattning (DOA/MOHOST), arbetsplatsuppföljning, veckoavstämning, underlag till AF:s blanketter |
| Rättslig grund | Avtal (Art 6.1.b) för deltagandet. **Bedömningsdata om arbetsförmåga och funktion utgör i praktiken hälsouppgifter → Art 9.2.a uttryckligt samtycke** `[bekräftas med AI-jurist, A2]` |
| Kategorier registrerade | Deltagare inskrivna i STA, arbetskonsulenter, arbetsplatshandledare |
| Kategorier personuppgifter | Inskrivning och fokusyrke, aktiviteter med deltagarens egna reflektioner, självskattningspoäng per funktionsområde, bedömarens poäng och kommentarer, pulskontroller (energi/mående), frånvaroanmälningar, arbetsplats- och handledarkontakter, konsulentens snabbanteckningar, genererade dokumentutkast |
| Mottagare | Tilldelad arbetskonsulent. Dokumentutkast lämnas vidare till **Arbetsförmedlingen** när konsulenten skickar in blanketten |
| Tredjelandsöverföring | Nej för lagringen. **Ja indirekt** när AI används för utkast (B6, OpenRouter/USA) — `sta-document-draft` och `sta-doa-sammanfattning` skickar bedömningsdata |
| Gallring | `[bekräftas]` Förslag: 2 år efter avslutad inskrivning, eller den tid AF:s dokumentationskrav anger |
| Säkerhetsåtgärder | RLS per deltagare/konsulent, SECURITY DEFINER-RPC:er för deltagarens egna skrivningar (`sta_participant_*`), signeringsflöde för bedömningar |
| Tabeller | `sta_enrollments`, `sta_activities`, `sta_assessments`, `sta_pulse_checks`, `sta_weekly_checkins`, `sta_absences`, `sta_workplaces`, `sta_workplace_followups`, `sta_quick_notes`, `sta_documents` |

### B14: Jobbsökning och ansökningar

| Aspekt | Värde |
|---|---|
| Ändamål | Hitta jobb, hålla ordning på ansökningspipelinen, påminnelser, spontanansökningar, jobbevakningar med e-post |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare |
| Kategorier personuppgifter | Sparade och sökta jobb, ansökningsstatus och datum, egna anteckningar, kontaktpersoner hos arbetsgivare (namn, roll, e-post, telefon), intervjudatum, löneuppgifter, bevakningskriterier, e-postadress för aviseringar |
| Mottagare | Tilldelad konsulent (om delning godkänd). **Resend** för utskick av jobbaviseringar |
| Tredjelandsöverföring | `[bekräftas]` Resends region behöver verifieras — se biträdeslistan |
| Gallring | Med konto-radering eller manuell borttagning. Arkiverade ansökningar behålls tills deltagaren raderar dem |
| Säkerhetsåtgärder | RLS per `user_id`; `job_notifications` har egen-rad-policyer och skapas av cron med service role; `email_notifications` är service-role-only |
| Tabeller | `saved_jobs`, `application_contacts`, `application_history`, `application_reminders`, `job_alerts`, `job_notifications`, `shared_jobs`, `spontaneous_companies`, `salary_searches`, `email_notifications` |

### B15: Konsulentens dokumentation och kommunikation

| Aspekt | Värde |
|---|---|
| Ändamål | Konsulenten planerar och dokumenterar sitt stöd: mål, journal, möten, meddelanden, placeringar |
| Rättslig grund | Avtal (Art 6.1.b) + berättigat intresse för professionell dokumentation (Art 6.1.f) `[bekräftas]` |
| Kategorier registrerade | Deltagare, konsulenter |
| Kategorier personuppgifter | Journalanteckningar om deltagaren (fritext, kan innehålla känsliga uppgifter), mål med framsteg, mötesanteckningar och tider, meddelanden mellan konsulent och deltagare, placeringar hos arbetsgivare med uppföljning, konsulentens egna inställningar |
| Mottagare | Konsulentens organisation. **Journalanteckningar visas för deltagaren själv sedan DOK1/KS4** (se nedan) — tidigare rad ("visas inte för deltagaren") var en beskrivning av UI:t, inte av RLS: `consultant_journal` saknade helt en SELECT-policy för `participant_id` |
| Tredjelandsöverföring | **Ja indirekt** — `konsulent-rapportutkast` (B6) skickar journalanteckningar till OpenRouter/USA. Klienten skickar aldrig deltagarens namn; personen refereras som "deltagaren" och PII-sanering körs |
| Gallring | `[bekräftas]` Förslag: 2 år efter avslutat uppdrag. Journalanteckningar kan behöva längre tid av dokumentationsskäl |
| Säkerhetsåtgärder | **Rättat 2026-08-31 (DOK1, KS2/KS4/KS8-granskningen).** Den här raden påstod tidigare att skyddet redan gällde — mätt mot prod var det osant: `consultant_journal` och `consultant_goals` hade policyn `USING (auth.uid() = consultant_id)` **utan** villkor om att relationen i `consultant_participants` fortfarande var aktiv, så `revoke_consultant_link()` (som rör `profiles`/`consultant_participants`/`consultant_consents`/`sta_enrollments`/`sta_documents`, aldrig journal eller mål) stängde INTE av en uppsagd konsulents läs- och skrivrätt. `consultant_journal` saknade dessutom helt en SELECT-policy för deltagaren (art. 15 hade ingen teknisk väg för just denna tabell), och `consultant_messages` gick att skriva till valfri mottagare utan någon relationskontroll i databasen (endast ett UI-filter i `consultant_dashboard_participants` höll konsulenter isär). Migrationen `supabase/migrations/20260831140000_ks_consultant_rls.sql` åtgärdar alla tre — **men är inte körd**. Fram till körning gäller den gamla, otillräckliga policyn. Efter körning: skyddet i den här raden stämmer för `consultant_journal`, `consultant_goals` och `consultant_messages`. Öppet produktbeslut (ej avgjort i migrationen): vad som ska hända med *historiska* journalanteckningar/mål när en relation upphör — arkiveras, raderas eller (nuvarande effekt) låsas kvar oläsbara för alla parter |
| Tabeller | `consultant_goals`, `consultant_goal_templates`, `consultant_journal`, `consultant_notes`, `consultant_meetings`, `consultant_messages`, `consultant_placements`, `consultant_requests`, `consultant_settings`, `consultant_consents`, `consultant_job_collections`, `consultant_dashboard_participants` (vy) |

### B16: Karriärplanering och kompetenskartläggning

| Aspekt | Värde |
|---|---|
| Ändamål | Sätta mål, kartlägga kompetensgap, spara intresseguideresultat, planera utbildning, bygga personligt varumärke |
| Rättslig grund | Avtal (Art 6.1.b) för karriärmål, kompetenser och yrkesintressen. **Intresseguidens funktionsdel (ICF) är art. 9-data och redovisas i B4** — se revisionsnoten 2026-08-21. Formuleringen "kan säga något om personens läggning → hanteras med samma varsamhet som B4 `[bekräftas]`" stod här tidigare; frågan är nu avgjord åt det hållet |
| Kategorier registrerade | Deltagare |
| Kategorier personuppgifter | Karriärmål och milstolpar, kompetensskattningar, RIASEC-profil och svarshistorik, favoritryrken, sparade utbildningar och kursrekommendationer, portfölj, certifikat, flyttvillighet, synlighetsinställningar, pitchtexter, varumärkesgranskningar |
| Mottagare | Tilldelad konsulent (om delning godkänd) |
| Tredjelandsöverföring | **Ja indirekt** — `kompetensgap` och `karriarplan` (B6) skickar CV-text, mål och en kompakt RIASEC-rad till OpenRouter/USA |
| Gallring | Med konto-radering eller manuell borttagning |
| Säkerhetsåtgärder | RLS per `user_id` |
| Tabeller | `career_plans`, `career_milestones`, `career_paths`, `skills_analyses`, `user_skills`, `favorite_occupations`, `saved_educations`, `course_recommendations`, `user_recommended_courses`, `courses`, `portfolio_items`, `user_certifications`, `relocation_preferences`, `personal_brand_audits`, `visibility_settings`, `visibility_progress`, `content_calendar`. **`interest_guide_progress` och `interest_guide_history` flyttade till B4 2026-08-21** — de bär ICF-data och hör under art. 9, inte under avtalsgrund |

### B17: Lärande, övningar och aktivitetslogg

| Aspekt | Värde |
|---|---|
| Ändamål | Visa läsförslag, spara framsteg i artiklar och övningar, visa deltagaren vad hen gjort |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare |
| Kategorier personuppgifter | Lästa och sparade artiklar med läsposition, svar på övningsfrågor (fritext, kan vara personligt), checklistor, aktivitetslogg med tidsstämplar, intervjusimulatorsessioner |
| Mottagare | Endast användaren själv |
| Tredjelandsöverföring | **Ja indirekt** för intervjusimulatorn (B6) — frågor och svar skickas till OpenRouter/USA för feedback och sammanfattning. **Ljudinspelningar lagras inte** i molnet; de laddas ner lokalt på deltagarens enhet |
| Gallring | `[bekräftas]` Förslag: aktivitetslogg 12 månader, övrigt med konto-radering |
| Säkerhetsåtgärder | RLS per `user_id`. Innehållstabellerna (`articles`, `exercises` m.fl.) innehåller inga persondata |
| Tabeller | `article_reading_progress`, `article_bookmarks`, `article_checklists`, `exercise_answers`, `learning_activities`, `user_learning_paths`, `user_activity_log`, `user_activities`, `interview_sessions` |

### B18: Kontoinställningar och tillgänglighetspreferenser

| Aspekt | Värde |
|---|---|
| Ändamål | Spara användarens val: språk, tema, lugnt läge, fokusläge, textstorlek, kontrast, aviseringsval, energinivå, dashboardlayout |
| Rättslig grund | Avtal (Art 6.1.b). **Tillgänglighetsinställningar kan avslöja funktionsnedsättning** → behandlas med samma varsamhet som B4 `[bekräftas]` |
| Kategorier registrerade | Alla användare |
| Kategorier personuppgifter | Språk, tema, lugnt läge, hög kontrast, stor text, fokusläge, energinivå, aviseringsval, jobbaviseringsfrekvens, integrationschecklista, dashboardkonfiguration, senaste inloggning |
| Mottagare | Endast användaren själv |
| Tredjelandsöverföring | Nej |
| Gallring | Med konto-radering |
| Säkerhetsåtgärder | RLS per `user_id` |
| Tabeller | `user_preferences`, `dashboard_preferences`, `notification_settings`, `user_drafts`, `unified_profiles`, `profile_documents`, `profile_skills`, `profile_history` |

### B19: Nätverk och delning

| Aspekt | Värde |
|---|---|
| Ändamål | Deltagaren håller ordning på sitt nätverk och kan dela sin profil via länk |
| Rättslig grund | Avtal (Art 6.1.b) |
| Kategorier registrerade | Deltagare — **och tredje personer** (nätverkskontakter som deltagaren själv lägger in) |
| Kategorier personuppgifter | Kontaktnamn, företag, roll, e-post, telefon, anteckningar om relationen; nätverksevenemang; delningslänkar med visningsräknare |
| Mottagare | Den som får en delningslänk (deltagaren väljer) |
| Tredjelandsöverföring | Nej |
| Gallring | Med konto-radering eller manuell borttagning |
| Säkerhetsåtgärder | RLS. `profile_shares` scopad 2026-07-23 (A7): uppslag via SECURITY DEFINER-RPC `get_shared_profile`, `anon` kan inte enumerera och `password_hash` exponeras inte |
| Tabeller | `network_contacts`, `networking_events`, `profile_shares`, `shared_resources` |
| Anmärkning | Deltagaren blir här personuppgiftsansvarig för sina kontakters uppgifter i praktiken. **Informationstext bör finnas i nätverksvyn** `[åtgärd]` |

### B20: Inbjudningar och kontokoppling

| Aspekt | Värde |
|---|---|
| Ändamål | Konsulent bjuder in deltagare till portalen |
| Rättslig grund | Berättigat intresse (Art 6.1.f) för utskicket, avtal när kontot skapas |
| Kategorier registrerade | Inbjudna personer (innan de är användare) |
| Kategorier personuppgifter | E-postadress, roll, inbjudningstoken, metadata om vem som bjöd in |
| Mottagare | Den inbjudna personen |
| Tredjelandsöverföring | Nej (utskick via Supabase Auth-email) |
| Gallring | `[bekräftas]` Förslag: 90 dagar efter utgången inbjudan |
| Säkerhetsåtgärder | Skärpt 2026-07-23 (A10): öppen `USING(true)`-policy borttagen, tokenmatchad SECURITY DEFINER-RPC `get_invitation_by_token` returnerar bara id/email/roll/metadata, `REVOKE ALL FROM anon` |
| Tabeller | `invitations` |

### B21: Drift-, säkerhets- och leveransloggar

| Aspekt | Värde |
|---|---|
| Ändamål | Skydda tjänsten mot missbruk, kunna utreda incidenter, spåra e-postleverans, hantera dataexport |
| Rättslig grund | Berättigat intresse (Art 6.1.f) + rättslig förpliktelse för accountability (Art 6.1.c) |
| Kategorier registrerade | Alla användare |
| Kategorier personuppgifter | User-ID, IP-adress, tidsstämplar, inloggningsförsök, ratelimit-nycklar, mottagaradresser och innehåll i utskickade mejl, exportbegäranden, administratörsåtgärder, ändringsspår på datadelning |
| Mottagare | Endast intern administration |
| Tredjelandsöverföring | Nej |
| Gallring | `[bekräftas]` Förslag: `login_attempts` och `rate_limits` 30 dagar, `email_notifications`/`email_queue` 90 dagar, revisionsloggar 5 år (jfr B9) |
| Säkerhetsåtgärder | `email_notifications`, `email_queue`, `rate_limits` är service-role-only (RLS på, noll policyer, `REVOKE` från anon och authenticated) — de saknar `user_id` och kan inte scopas per användare |
| Tabeller | `audit_logs`, `admin_audit_log`, `login_attempts`, `rate_limits`, `data_export_logs`, `data_sharing_audit`, `email_notifications`, `email_queue`, `user_sessions`, `notifications`, `user_notifications` |

---

## Bilaga A — avstämning tabell → behandling (samtliga 150)

> Syftet med bilagan är att registret ska kunna **verifieras**, inte tas på tro. Listan genereras
> ur `supabase/schema-snapshot.json`; kör `npm run schema:refresh` och stäm av vid nästa revision.
> Kolumnen "Status" skiljer levande behandling från sådant som finns i databasen utan att användas.

### A.1 Behandlingar med persondata

| Behandling | Tabeller | Antal |
|---|---|---|
| B1 Konton | `profiles` (+ `auth.users`) | 1 |
| B2 Profil | `profiles`, ~~`user_adaptations`~~ | 1 |
| B3 CV | `cvs`, `cv_versions`, `cv_analyses`, `cv_shares`, `cover_letters`, `elevator_pitches` | 6 |
| B4 Hälsodata | `interest_results`, `interest_guide_progress`, `interest_guide_history`, `user_adaptations`, `participant_data_sharing` | 5 |
| B5 Wellness/dagbok | `mood_logs`, `diary_entries`, `diary_streaks`, `gratitude_entries` | 4 |
| B6 AI | `ai_usage_logs`, `ai_team_sessions` | 2 |
| B7 Konsulentkoppling | `consultant_participants`, `participant_data_sharing`, `data_sharing_audit` | 3 |
| B9 Samtycke | `consent_history`, `user_consent_status` (vy) | 2 |
| B10 Integrationer | `user_credentials`, `calendar_events`, `calendar_goals` | 3 |
| B12 Kontoradering | `account_deletion_requests`, `admin_audit_log` | 2 |
| **B13 STA** | 10 `sta_*`-tabeller | 10 |
| **B14 Jobbsökning** | `saved_jobs`, `application_contacts`, `application_history`, `application_reminders`, `job_alerts`, `job_notifications`, `shared_jobs`, `spontaneous_companies`, `salary_searches`, `email_notifications` | 10 |
| **B15 Konsulentdokumentation** | 12 `consultant_*`-tabeller | 12 |
| **B16 Karriär/kompetens** | 17 tabeller (se B16) | 17 |
| **B17 Lärande** | `article_reading_progress`, `article_bookmarks`, `article_checklists`, `exercise_answers`, `learning_activities`, `user_learning_paths`, `user_activity_log`, `user_activities`, `interview_sessions` | 9 |
| **B18 Inställningar** | `user_preferences`, `dashboard_preferences`, `notification_settings`, `user_drafts`, `unified_profiles`, `profile_documents`, `profile_skills`, `profile_history` | 8 |
| **B19 Nätverk** | `network_contacts`, `networking_events`, `profile_shares`, `shared_resources` | 4 |
| **B20 Inbjudningar** | `invitations` | 1 |
| **B21 Driftloggar** | `audit_logs`, `login_attempts`, `rate_limits`, `data_export_logs`, `user_sessions`, `notifications`, `user_notifications`, `email_queue` | 8 |

### A.2 Innehållstabeller — inga personuppgifter

Redaktionellt innehåll och referensdata. Ingen koppling till en identifierbar person, ingen gallring behövs.

`articles`, `article_categories`, `article_course_links`, `exercises`, `exercise_categories`,
`exercise_questions`, `exercise_steps`, `writing_prompts`, `courses`, `career_paths`,
`consultant_goal_templates`, `application_templates`

### A.3 Dött schema — ✅ RADERAT 2026-07-27

15 tabeller identifierades som döda (noll `.from()`, noll RPC, noll realtime-prenumerationer) och
raderades med migration `20260727140000_drop_dead_schema.sql` efter godkännande.
**Databasen gick från 150 till 135 tabeller/vyer** — registret omfattar därmed 135, inte 150.

| Tabell(er) | Varför de fanns | Rader vid radering |
|---|---|---|
| 12 × `community_*` (buddies, buddy_checkins, buddy_preferences, cheers, feed, group_invites, group_members, group_messages, groups, likes, replies, topics) | Community-funktion som aldrig byggdes klart. Tre hade publika SELECT-policyer + `anon`-grant — **den exponeringen är nu borta** | 0 |
| `community_categories` | Seed-kategorier för samma funktion | 5 |
| `articles_backup` | Engångsbackup från artikelmigrering (`articles` hade 133 rader — backupen var ingen enda kopia) | 2 |
| `user_widget_layouts` | Kvarleva efter widget-systemets arkivering (C1/C10) — en användares dashboardlayout från 2026-04-29 | 2 |

De 9 raderna backupades riktat till `_db-backups/h3-data-backup-2026-07-27.json` **utanför
git-repot** (dumpar innehåller persondata). Tabellernas DDL finns i git-historiken.

**Vad detta betyder för registret:** ingen av tabellerna behöver dokumenteras eller gallras, och
`community_topics`/`_replies`/`_likes` var de enda kvarvarande tabellerna med publik läsrättighet
för `anon` utanför de avsedda (`profile_shares` via RPC).

### A.4 Dubbletter — en levande, en död (ROADMAP H8)

Kartlagt 2026-07-27. Den döda halvan går att radera först när koden städats; ingen av dem
innehåller data utom där annat anges.

| Levande | Död dubblett | Bevis |
|---|---|---|
| `mood_logs` (3 rader) | `mood_history` (0), `calendar_mood_entries` (0) | `mood_history` skrivs bara av `MoodCheck`, som ingen sida monterar. `calendarMoodApi` har noll konsumenter. **Detta är C14** |
| `diary_entries` | `journal_entries` (0) | `journalApi` i cloudStorage har noll konsumenter |
| `saved_jobs` (21 rader) | `platsbanken_saved_jobs` (0), `platsbanken_saved_searches` (0) | `platsbankenApi` har bara ett test som konsument |
| `notification_settings` | `notification_preferences` (0) | `notificationPreferencesApi` har noll konsumenter |
| `job_applications` | — | Utfasad i E12; sista läsaren borttagen i H4. Kan raderas, **innehåller ev. data** |
| **Oavgjort:** `personal_brand_audits` vs `personal_brand_audit` | — | **Båda har levande kod** — `personalBrandAuditsApi` + hub-summan mot den ena, `personalBrandApi` (6 konsumenter) mot den andra. Kräver riktig konsolidering, inte bara radering |
| **Oavgjort:** `notifications` vs `user_notifications` | — | `useNotifications` läser den ena, `notificationsService` och `job-alerts.js` den andra |

---

## Personuppgiftsansvarig — kontaktuppgifter

| Roll | Person/funktion | Email |
|---|---|---|
| Personuppgiftsansvarig | [Företagsnamn / juridisk person — fyll i] | [contact-email] |
| Dataskyddsombud (DPO) | [Namn — utse formellt eller dokumentera varför inte krävs] | dpo@jobin.se |
| Tillsynsmyndighet | Integritetsskyddsmyndigheten (IMY) | imy.se |

---

## Personuppgiftsbiträden

| Biträde | Roll | DPA-status | Region | Anmärkning |
|---|---|---|---|---|
| Supabase Inc. | DB, Auth, Storage | DPA på supabase.com | EU/Irland | OK |
| Vercel Inc. | Hosting, serverless functions | DPA på vercel.com | EU/Frankfurt (efter 2026-05-15) | OK |
| Vercel Blob | Filhosting | Del av Vercel-DPA | **Verifieras** | Manuell check |
| OpenRouter Inc. | AI inferens | **Verifieras** | USA | SCC + TIA krävs |
| Functional Software (Sentry) | Error tracking | DPA på sentry.io | Multi-region | EU-instans rekommenderad |
| ~~LinkedIn Inc.~~ | ~~OAuth + profilimport~~ | — | — | **Utgår 2026-07-27:** ingen LinkedIn-import är implementerad. Ska in igen först när en faktiskt byggs |
| Google LLC | OAuth + Calendar | DPA via Google | USA | Opt-in, SCC krävs |
| **Resend** | Utskick av jobbaviseringar | **Verifieras** | **Verifieras** | Används på riktigt i `client/api/job-alerts.js` via `RESEND_API_KEY`. Efter H2 (2026-07-27) finns kedjan i databasen; utskick sker när A6:s cron aktiveras. **DPA + region måste vara klara innan cron slås på** |

---

*Detta register uppdateras vid varje ny behandling, ny mottagare eller ändring av rättslig grund.*
