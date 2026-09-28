# Skarpt funktionstest 2026-09-28 — område: karriar

## 1. Konton, mutationer, städning

- **Testkonto:** `skarpt-karriar-2026-09-28@jobin.test` (skapat via `POST /auth/v1/admin/users`, `email_confirm: true`). Fyllde i samtyckessteget (villkor + integritet + frivilligt AI-samtycke), skapade ett kort CV via QuickCVMode och kompletterade det med "Exempeldata" (arbetslivserfarenhet + utbildning, krävs av Kompetensanalysen).
- **Muterat:** eget CV, en intervjuträningssession, två kompetensanalyser (en misslyckad, en lyckad), 34 svar i Intresseguiden, en LinkedIn-checklistpunkt + rubrikförslag, en löneberäkning, en personligt varumärke-pitch, fem AI-team-konversationer, AI pausades och slogs sedan **inte** på igen (kontot raderades innan dess).
- **AI-anrop:** 11 loggade i `ai_usage_logs` (verifierat) + 1 misslyckat klientsidan (kompetensgap, se BF nedan, loggades ändå server-side som lyckat) = 12 av 12 i budget. Fördelning: `intervju-simulator` ×2, `kompetensgap` ×2 (1 lyckad syns för användaren), `linkedin-optimering` ×1, `career-assistant-salary-compass` ×1 (perplexity/sonar), `ai-team-chat` ×5.
- **Städat:** kontot raderat via portalens egen väg (Inställningar → Radera konto → Begär radering → Radera nu istället → skriv "RADERA" → Radera för alltid). Verifierat tomt: `auth.users` 0, `profiles` 0, `cvs` 0, `interest_guide_history` 0.
- Skärmdumpar/loggar: `docs/review-2026-09-28-rollspel/skarpt-karriar/` (screenshots `d-01`…`d-125`, `natverk.txt`, `txt/*.txt`). Stegfiler: `e2e/skarpt-2026-09-28-karriar-*.cjs`.

## 2. Testmatris

| Funktion | Resultat | Kommentar |
|---|---|---|
| Inloggning (engångslänk) + samtyckessteg | ✅ | Villkor+integritet+AI-kryss sparades via `grant_consent` |
| CV: QuickCVMode (snabb-CV) | ✅ | Namn/titel/kontakt + genererade kompetenser |
| CV: Exempeldata-knappen | ✅ | Fyller arbetslivserfarenhet + utbildning, sparas |
| Intervjusimulator: starta (AI-fråga) | ✅ | |
| Intervjusimulator: svara + AI-betyg/feedback | ✅ | Textfeedback gavs; inget numeriskt betyg gavs för ett medvetet ospecifikt svar — korrekt enligt B12-regeln, inte en bugg |
| Intervjusimulator: ladda om mitt i | ✅ | Utkast + historik återställdes korrekt |
| Intervjusimulator: historik efter avslut | ❌ | **SK1** — avslutat+sparat pass visas som "inte blev klar" vid nästa besök |
| Kompetensanalys: drömjobb → gap | ⚠️ | Krävde CV med arbetslivserfarenhet/utbildning (annars blockerad, korrekt); ett försök gav "Failed to fetch" klientsidan trots att AI-anropet lyckades server-side (se Observation) |
| Kompetensanalys: kurser från JobEd | ✅ | Riktiga YH-utbildningar hämtade och visade |
| Kompetensanalys: "Ta med i plan" + kvarstår vid återbesök | ✅ | |
| Intresseguiden: hela testet (34 frågor) | ✅ | Räckviddsproblem i test-tooling (rangeslider), inget produktfel |
| Intresseguiden: resultat (RIASEC + Big Five + ICF-samtyckesgrind) | ✅ | Art. 9-grinden fungerar: ICF döljs bakom eget samtycke |
| Intresseguiden: sparas till historik | ❌ | **SK2** — historikraden sparas ALDRIG utan hälsosamtycke (NOT NULL-krock), tyst fel |
| Intresseguiden: yrken (matchning) | ✅ | |
| LinkedIn: AI-förslag på rubrik | ✅ | |
| LinkedIn: checklista sparas, kvarstår vid omladdning | ✅ | |
| Lönesidan: beräkning + nettolön/skatt | ✅ | |
| Lönesidan: lönekompass (AI, Perplexity) | ✅ | |
| Karriär-sidan: alla fem flikar | ✅ | Arbetsmarknad, Anpassning, Meriter, Flytta, Plan |
| Karriär: flyttdata | ✅ | Ärligt märkt som handinskrivna uppskattningar (känt sedan tidigare) |
| Utbildning: sök | ✅ | Reella YH/högskoleresultat |
| Personligt varumärke: pitch sparas, kvarstår | ✅ | |
| Internationellt/Ny i Sverige: tre flikar | ✅ | Inga påhittade belopp (avsiktligt, bekräftat) |
| AI-teamet: alla fem agenter svarar | ✅ | Arbetskonsulent, Arbetsterapeut, Studievägledare, Motivationscoach, Digital Coach |
| AI-teamet: streaming | ✅ | |
| AI-teamet: regelverksfrågan ("a-kassa vid sjukskrivning") till Arbetsterapeut | ✅ | Inga belopp/procent ur minnet — hänvisar korrekt till a-kassan/Försäkringskassan |
| AI av i Inställningar → allt AI stängs | ✅ | Chattfält, snabbfunktion i sidopanelen OCH manuellt skickande blockeras alla med tydligt felmeddelande. Rådgivarnas "Fråga djupare i AI-team"-länk försvinner helt. Motsäger öppna **UT3** i ROADMAP — se Observation |
| Kunskapsbanken: sök | ✅ | |
| Kunskapsbanken: öppna artikel | ✅ | |
| Kunskapsbanken: Skriv ut (window.print) | ✅ | |
| Kunskapsbanken: Ladda ner PDF | ✅ | Verklig nedladdning, `lattsvenska-referenser.pdf` |
| Kunskapsbanken: Lyssna (text-till-tal) | ⚠️ | Fungerar, men **SK3** — hårdkodad svenska, ingen översättning |
| Kunskapsbanken: byt till English | ✅ | `document.documentElement.lang` växlade `en`↔`sv` korrekt |
| Kunskapsbanken: öppna artikel på engelska | ⚠️ | Bekräftar känd, öppen **NY4** — Lätt svenska-artikeln visade engelsk ram men svensk brödtext utan förklaring |
| `ai_usage_logs`: anropen loggas | ✅ | 11/11 loggade med rätt `function_name`/`model`/`tokens_used` |
| `ai_usage_logs`: PII-sanering | ⏭ | Tabellen har ingen promptkolumn — går inte att verifiera direkt. Saneringen sker klientsidan (`sanitizeAiPayload` i `aiApi.ts`) innan sändning, enligt kod |
| Radera konto (portalens egen väg) | ✅ | Tvåstegsflöde (begär → radera omedelbart, skriv "RADERA"), verifierat tomt i DB |

**Sammanfattning:** 30 prövade, 25 ✅, 3 ❌/bugg (SK1, SK2, SK3), 2 ⚠️ bekräftade kända/icke-nya, 1 ⏭.

## 3. Buggar

### Hög — SK2: Intresseguidens historik sparas aldrig utan hälsosamtycke (art. 9)

**Repro:** Slutför Intresseguidens 34 frågor på ett konto som INTE gett hälsosamtycke (`profiles.health_consent_at` är null — gäller varje nytt konto som inte aktivt klickat "Jag samtycker" på ICF-rutan). Öppna sedan fliken Historik.

**Förväntat:** Resultatet sparas i historiken utan ICF-delen (`icf_profile: null`) — det är det avsedda beteendet enligt kodkommentaren (fail closed på hälsodata, rättat 2026-08-21).

**Faktiskt:** `POST .../interest_guide_history` svarar 400: `null value in column "icf_profile" of relation "interest_guide_history" violates not-null constraint` (kod 23502). Felet fångas tyst av `.catch(err => console.error(...))` i `TestTab.tsx` — inget felmeddelande visas för användaren. Historikfliken visar "Ingen historik än — När du genomfört testet kommer dina resultat att sparas här" trots att testet just slutförts och visades som klart.

**Belägg:**
- KONSOLFEL i körningen + `natverk.txt`-rad: `2026-09-28T21:27:06.528Z POST 400 .../interest_guide_history?select=*`
- DB-schema: `icf_profile` är `NOT NULL` (`information_schema.columns`, verifierat mot prod)
- SQL: `SELECT count(*) FROM interest_guide_history WHERE user_id=...` → 0 rader trots slutfört test
- Skärmdump `docs/review-2026-09-28-rollspel/skarpt-karriar/d-47-historik.txt` / `d-49-historik-klick.txt`: "Ingen historik än"

**Trolig kod:** `client/src/pages/interest-guide/TestTab.tsx:237` (`icf_profile: harHalsosamtycke ? calculatedProfile.icf : null`) mot en databaskolumn som är `NOT NULL`.

**Fix-förslag:** `ALTER TABLE interest_guide_history ALTER COLUMN icf_profile DROP NOT NULL;` (och committa uppdaterad schema-snapshot), eller skicka `{}` i stället för `null`. Eftersom `interestApi.getResult()` (fallback när `interest_results` är tom) läser just `interest_guide_history`, drabbar felet även möjligheten att se sitt resultat efter att sessionens klientminne är borta — påverkar sannolikt de flesta riktiga nya användare, eftersom de flesta inte aktivt gett hälsosamtycke.

### Medel — SK1: Ett avslutat och sparat intervjupass visas ändå som "inte blev klar"

**Repro:** Starta en intervjuträning, svara på minst en fråga, klicka Avsluta → Ja, avsluta (sessionen sparas, "Bra jobbat!"-skärmen visas). Navigera bort UTAN att klicka "Öva en gång till" (t.ex. stäng fliken eller gå till en annan sida och kom tillbaka senare). Öppna `/interview-simulator` igen.

**Förväntat:** Sidan visar startformuläret och "Dina tidigare övningar" med det just avslutade passet.

**Faktiskt:** Sidan visar BÅDA: en "Du har en övning som inte blev klar — Fortsätt/Börja om"-banner för samma pass (fastän det redan är sparat med status `completed` i DB) OCH passet i "Dina tidigare övningar". Klickar man "Fortsätt" återupptar man ett pass som redan avslutats och sparats.

**Belägg:** Skärmdump/text `docs/review-2026-09-28-rollspel/skarpt-karriar/txt/d-18-atersok-efter-avslutad.txt` visar båda samtidigt. DB: `interview_sessions` hade en rad med `status='completed'` för samma pass.

**Trolig kod:** `client/src/pages/InterviewSimulator.tsx` — `avslutaIntervju()` (rad ~778, rensar utkastet med `rensaSimulatorUtkast()` på rad 808) körs bara när man klickar "Öva en gång till". `handleAvslutaKlick()` (rad ~863, triggas av "Ja, avsluta") sparar sessionen (`saveSimulatorSession`) och visar sammanfattningen, men rensar ALDRIG utkastet i `localStorage`.

**Fix-förslag:** anropa `rensaSimulatorUtkast()` även i `handleAvslutaKlick()`, direkt efter `saveSimulatorSession(...)`.

### Låg — SK3: "Lyssna"-knappen (text-till-tal) i kunskapsbanken är hårdkodad svenska

**Repro:** Byt språk till English, öppna en artikel.

**Faktiskt:** Knappen visar fortfarande "Lyssna"/"Pausa"/"Stoppa" — oöversatt, medan grannknapparna ("Print", "Download") är korrekt engelska.

**Belägg:** `docs/review-2026-09-28-rollspel/skarpt-karriar/txt/d-112-artikel-oppnad.txt`: `Lyssna / Print / Download`.

**Trolig kod:** `client/src/components/knowledge-base/TextToSpeech.tsx:72,77,82,91` — texterna är literalt `'Pausa'`/`'Lyssna'`/`"Stoppa"`, inte routade genom `t()`. Bryter mot CLAUDE.md:s regel att all gränssnittstext ska gå via `t()` och den maskinella nyckelparitetsgrinden ser den aldrig eftersom strängen aldrig blev en i18n-nyckel.

## 4. Bekräftat kända, ej nya

- **NY4** (öppen i ROADMAP): English-läget blandar engelsk ram med svensk brödtext i oöversatta artiklar utan förklaring. Bekräftat igen på en "Lätt svenska"-artikel.
- **UT3** (öppen i ROADMAP, "AI-teamets sidopanel är klickbar men gör ingenting när AI är av"): **kunde INTE reproduceras.** Testade explicit: snabbfunktion i sidopanelen ("LinkedIn-tips") OCH manuellt skicka i chattfältet, båda visade korrekt felmeddelande ("Du har stängt av AI-behandling…") utan nätverksanrop till AI. Rådgivarnas "Fråga djupare i AI-team"-länk försvann helt när AI var av. Roadmap-punkten bör premissgranskas — den verkar redan åtgärdad, eller beskrev ett annat skede av flödet än det jag testade.

## 5. Observationer (ej numrerade buggar — otillräckligt belägg/reproducerbarhet)

- Ett AI-anrop till Kompetensanalysen misslyckades klientsidan (`TypeError: Failed to fetch`), men loggades ändå som **lyckat server-side** i `ai_usage_logs` (2 533 tokens). Andra försöket lyckades och visades korrekt. Enstaka nätverksblipp i testmiljön — men värt att notera att en sådan blipp kostar ett betalt AI-anrop utan att användaren ser något resultat.
- Efter ett avslutat intervjupass anropas `intervju-sammanfattning` (helhetsbedömning) i UI:t, men loggades ALDRIG i `ai_usage_logs` (varken för mitt konto eller någon annan de senaste två timmarna). Kunde inte bekräftas ytterligare inom AI-budgeten (12/12 förbrukade).

## 6. Förbättringar/utveckling

1. Lägg en generell grind (liknande `lint:schema`) som jämför varje `.insert()/.upsert()`-payload mot NOT NULL-kolumner i prod-schemat — samma klass av bugg (SK2) har redan träffat portalen flera gånger enligt CLAUDE.md:s lärdomshistorik, och den här gången var felet helt tyst.
2. `rensaSimulatorUtkast()` bör anropas överallt en session markeras `completed`, inte bara i en av de två avslutsvägarna — sök efter fler ställen med samma "spara men glöm rensa utkastet"-mönster (CV-byggaren, Kompetensanalysen m.fl. har liknande utkastlager).
3. Kör en i18n-svep specifikt efter hårdkodade svenska strängar i `title=`/`aria-label`/literala `<span>`-texter (inte bara saknade `t()`-nycklar) — `TextToSpeech.tsx` visar att den befintliga nyckelparitetsgrinden inte fångar text som aldrig blev en nyckel alls.
