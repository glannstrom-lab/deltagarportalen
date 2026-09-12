# Data Protection Impact Assessment (DPIA) — Deltagarportalen

**Lagkrav:** GDPR Art 35 + IMY:s vägledning om konsekvensbedömning.
**Datum:** 2026-09-13 (företagskonto AG6 — ny §1.6 och riskerna R12–R14; föregående
2026-09-08 AS3, 2026-08-21 funktionsförutsättningar som Art 9-kategori och R11, 2026-05-15)
**Status:** Utkast — kräver formellt godkännande av personuppgiftsansvarig + ev. konsultation med IMY (Art 36) om hög residualrisk.

> **Revision 2026-08-21.** Granskningen av Intresseguiden visade att portalen samlar in en
> Art 9-kategori som den här bedömningen inte kände till — självskattade
> funktionsförutsättningar (ork, koncentration, motorik, sinnesintryck, kognition,
> kommunikation) — och att samtyckesgrinden för den satt i gränssnittet i stället för vid
> lagringen. Se **R11** i §3.1. Bedömningen är uppdaterad i §1.2, §1.3, §3.1, §3.2 och §4.
> Totalbedömningen är höjd från "MEDEL → LÅG efter implementation" till **MEDEL**, eftersom
> den tidigare siffran vilade på ett åtgärdspåstående som inte höll.
>
> **Revision 2026-09-08 (AS3).** Projektgenomgången 2026-09-07 fann en Art 9-nära kategori
> som bedömningen saknade: `consultant_work_placements.internal_adaptation_notes`, skriven
> av konsulenten om deltagaren, utan samtyckesgrind. Tillagd i §1.2 och §1.3 med ett
> ställningstagande om rättslig grund. Residualrisken i §4 påverkas inte i dag (0 rader),
> men grunden är inte uppfylld förrän beslutet i §1.3 är taget.
>
> **Revision 2026-09-13 (AG6 företagskonto).** Portalen har fått ett företagskonto — en
> **ny mottagare** (det namngivna företaget) och en **ny kategori registrerade**
> (företagskontakter). Ny **§1.6** beskriver flödet, var samtycket sitter och vad företaget
> strukturellt aldrig får. Rader tillagda i §1.2, §1.3, §1.4 och §1.5; riskerna **R12–R14**
> i §3.1, §3.2 och §4. Totalbedömningen är oförändrad (**MEDEL** — R11 håller den uppe):
> företagskontot tillför ingen ny Art 9-behandling, men rättslig grund för
> företagskontaktens egna uppgifter är inte avgjord (AG9 avtal) och gallringsregel för
> `employer_*` saknas i `RETENTION-POLICY.md`.

---

## Sammanfattning

| Aspekt | Bedömning |
|---|---|
| Personuppgiftsansvarig | Glänne & Söner, enskild firma (innehavare Mikael Glännström), som driver jobin.se — beslut 2026-09-12 |
| Personuppgiftsbiträden | Supabase Inc., Vercel Inc., OpenRouter Inc., Functional Software Inc. (Sentry) |
| Behandlingens namn | Deltagarportalen — AI-driven jobbsökarportal för långtidsarbetslösa |
| Geografisk omfattning | Sverige (primärt) |
| Antal registrerade (estimat) | 1000-10000 första året, kan skala till 100k+ |
| Behandlingstyper | Profilering, AI-rekommendationer, hälsodata, känsliga personuppgifter |
| Sannolikhet för hög risk | **HÖG** — flera trigger-faktorer |
| DPIA-skyldighet | **JA** (obligatorisk) |
| Krav på IMY-samråd (Art 36) | **NEJ** efter åtgärder, **JA** före åtgärder |

---

## 1. Beskrivning av behandlingen

### 1.1 Ändamål
Hjälpa arbetssökande (särskilt långtidsarbetslösa med fysiska/psykologiska utmaningar) att:
- Skapa CV och personliga brev
- Hitta jobb som matchar deras profil
- Träna inför intervjuer
- Få stöd från arbetskonsulenter
- Reflektera över mående/energi och kognitiva utmaningar

### 1.2 Behandlade kategorier av personuppgifter

| Kategori | Exempel | Källa |
|---|---|---|
| Identitet | Namn, email, telefon, profilbild | Användaren själv |
| Demografi | Ålder, ort, språk, utbildningsnivå | Användaren |
| Yrkesliv | CV, arbetshistorik, kompetenser, kvalifikationer | Användaren |
| **Hälsodata (Art 9)** | Energinivå, mående, kognitiva utmaningar, anpassningsbehov | Användaren — separate consent (`HealthConsentGate`) |
| **Funktionsförutsättningar (Art 9)** | Självskattad ork, koncentration, motorik, hantering av sinnesintryck, kognition och kommunikation — åtta frågor i Intresseguiden, plus den härledda profilen | Användaren — samtyckesgrindad sedan 2026-08-21, se §3.1 R11 |
| **Wellness (Art 9)** | Mood-loggar, dagboksinlägg, gratitude-listor | Användaren — separate consent (`WellnessConsentGate`) |
| **Anpassningsbakgrund vid arbetsplacering (Art 9-nära)** | `consultant_work_placements.internal_adaptation_notes` — konsulentens fritext om *varför* en praktik-/arbetsträningsplats behöver anpassas (funktionsnedsättning, diagnosnära bakgrund). Skild från `employer_instructions` (*vad* arbetsplatsen ska göra, utan orsak), som får delas | **Konsulenten, inte deltagaren** — den enda Art 9-nära kategorin i tabellen som skrivs av någon annan än den registrerade. Ingen samtyckesgrind vid skrivning (varken UI eller RLS). Deltagaren kan läsa raden (RLS `Deltagaren ser sina platser`). Når aldrig arbetsgivaren: allowlisten `byggArbetsgivarUnderlag()` + vakttest i `placeringarApi.test.ts`. Kolumnen verifierad i prod 2026-09-08; 0 rader. Se ställningstagandet under §1.3 (AS3) |
| Intressen | RIASEC-resultat, yrkesintressen, drömjobb | Användaren |
| Beteende | Inloggningstider, klick, AI-promptar | Automatiskt loggat |
| Konsulentkoppling | Vilken konsulent som är tilldelad | Konsulent eller AF |
| **Företagskontakter (ny kategori registrerade, AG6 2026-09-13)** | Namn, e-post, telefon hos ett företag som tar emot förslag om praktik/arbetsträning; företagets namn och org.nr | Konsulenten (inbjudan via `employer_invitations`) eller en kollega i företaget; personen själv när kontot skapas. Se §1.6 |

### 1.3 Rättslig grund per behandling

| Behandling | Rättslig grund | Hänvisning |
|---|---|---|
| Konto-skapande och kärnfunktioner | Avtal (Art 6.1.b) | Användaren behöver konto för att använda portalen |
| AI-funktioner | Samtycke (Art 6.1.a + 9.2.a för Art 9) | Separate gates innan användning |
| Hälsodata (energy, mood) | Uttryckligt samtycke (Art 9.2.a) | `HealthConsentGate`, `WellnessConsentGate` |
| Funktionsförutsättningar (Intresseguiden) | Uttryckligt samtycke (Art 9.2.a) | `profiles.health_consent_at` kontrolleras före lagring i `TestTab`. **Grinden ligger i applikationskoden, inte i RLS** för `interest_guide_progress`/`interest_guide_history` — se R11 |
| Konsulent-datadelning | Samtycke (Art 6.1.a) — granulärt per kategori | `participant_data_sharing`-tabell |
| Anpassningsbakgrund vid arbetsplacering (`internal_adaptation_notes`) | **Arbetshypotes: uttryckligt samtycke (Art 9.2.a)** genom konsulentsamtycket (`grant_consultant_consent`), villkorat av `participant_data_sharing.share_health_data`. **Inte uppfylld i dag** — se ställningstagandet nedan | Ingen grind vid skrivning. Samtyckestexten (`consultant.consent.seesList`) nämner "anteckningar och mål som konsulenten skriver om dig" men inte hälsa, och `share_health_data` kontrolleras inte när fältet sparas |
| Delning av deltagaruppgifter till ett namngivet företag (AG5/AG6, 2026-09-13) | **Uttryckligt samtycke per delning (Art 6.1.a)** — deltagaren svarar ja per förslag och per fält. Beviset är raden i `consent_history` (`consent_type = 'employer_share'`, `reference_id` = förslaget). Ingen generell brytare "dela med arbetsgivare" finns, med flit; återkallbart (`withdrawn`) | `respond_to_share_proposal` + guarden `guard_share_proposal_after_decision`: bara deltagaren själv kan flytta ett förslag från `pending` (fail closed även för service role). Se §1.6 |
| Företagskontaktens egna uppgifter (namn, e-post, telefon, org.nr) | **Bedömning krävs, se AG9 avtal.** Kandidater: avtal (Art 6.1.b) när företaget tecknat avtal om kontot; annars berättigat intresse (Art 6.1.f) för inbjudan och kontakt inom konsulentens uppdrag. Org.nr är personuppgift för enskild firma, inte för aktiebolag | `organizations` (kind `arbetsgivare`), `organization_members`, `employer_places.contact_*`, `invitations.metadata` (kind `arbetsgivare`). Se §1.6 |

> **Ställningstagande AS3 (2026-09-08).** Fältet skapades 2026-08-31 (AG1) med
> uttrycklig avsikt att *hålla isär* orsak från instruktion, och migrationen hänvisar
> till den här DPIA:n som grund för att aldrig serialisera det mot en arbetsgivare.
> Men DPIA:n kände inte till fältet: raden "Hälsodata" ovan anger *Användaren själv*
> som källa, och det stämmer inte här — det är konsulenten som skriver, om deltagaren.
>
> *Varför Art 9:* en anteckning om att en person behöver anpassning "på grund av" något
> är en uppgift om hälsa eller funktionsnedsättning i Art 9.1:s mening, oavsett om
> diagnosen nämns. Att fältet är fritext gör det värre, inte bättre.
>
> *Vilken grund:* Art 9.2.b (arbetsrätt/social trygghet) kräver stöd i svensk lag
> för just den personuppgiftsansvarige; portalen är leverantörens verktyg, inte
> Arbetsförmedlingens, och ingen sådan bestämmelse är identifierad. Art 9.2.h
> (yrkesmedicin, social omsorg) förutsätter tystnadsplikt enligt lag. Det som återstår,
> och som är konsekvent med hur portalen behandlar varje annan Art 9-kategori, är
> **uttryckligt samtycke (9.2.a)** från deltagaren. Det samtycket finns delvis redan:
> deltagaren godkänner konsulentkopplingen och att konsulenten "skriver anteckningar om
> dig", och kan separat ge `share_health_data`. Men ingen av grindarna hindrar att
> fältet fylls i utan samtycke — samma klass som R11.
>
> *Vad som krävs för att grunden ska hålla (beslut Mikael, inte taget här):*
> (1) en RLS-`WITH CHECK` på `consultant_work_placements` som kräver att
> `internal_adaptation_notes IS NULL` om deltagaren inte gett `share_health_data`, och
> (2) att samtyckestexten säger att anteckningarna kan röra hälsa och anpassningsbehov.
> Alternativet är att ta bort fältet och låta orsaken stanna i konsulentens journal, som
> redan är samtyckesgrindad. Tills något av det är gjort är residualrisken för fältet
> densamma som R11:s: **Medel**, med 0 rader i prod som enda mildrande omständighet.
| Säkerhetsloggar (Sentry) | Berättigat intresse (Art 6.1.f) — efter cookie-consent | Intresseavvägning bifogad |
| Analytics | Samtycke (Art 6.1.a) | Cookie-banner |
| Email-notiser | Avtal + samtycke | Användaren slår på per notistyp |
| Marknadsföring | Samtycke (Art 6.1.a) | `marketing_consent_at` — UI saknas idag (gap) |

### 1.4 Mottagare av personuppgifter

| Mottagare | Roll | Land | Rättslig grund för överföring |
|---|---|---|---|
| Användaren själv | Registrerad | EU | — |
| Tilldelad konsulent | Auktoriserad användare med begränsad åtkomst | EU | Avtal + samtycke. För Art 9-data krävs `participant_data_sharing.share_health_data = true` — villkoret gäller sedan 2026-08-21 även intresseguidens funktionsprofil, se R11 |
| **Det namngivna företaget** (organisation av slaget `arbetsgivare`, AG6 2026-09-13) | Mottagare av **bara de fält deltagaren godkänt** för just det förslaget, via vyn `employer_proposals`. Självständigt personuppgiftsansvarigt för det det tar emot | EU | Deltagarens uttryckliga samtycke per delning (Art 6.1.a), bevis i `consent_history` typ `employer_share`. Företagets skyldigheter regleras i avtal (AG9, ej tecknat). Se §1.6 |
| Supabase Inc. | Personuppgiftsbiträde — DB, Auth | EU (Irland) | Art 28 DPA, EU-region |
| Vercel Inc. | Personuppgiftsbiträde — hosting, AI-functions | EU (Frankfurt fra1 från 2026-05-15) | Art 28 DPA, EU-region |
| Vercel Blob | Filhosting | **Verifieras** — EU eller USA | Art 28 DPA + SCC om USA |
| OpenRouter Inc. | Personuppgiftsbiträde — AI inferens | **USA** | Art 28 DPA + SCC + TIA — behöver verifieras |
| Sentry (Functional Software) | Personuppgiftsbiträde — error tracking | Multi-region | Lazy-loadad bakom consent (E9). EU-instans rekommenderad |
| Arbetsförmedlingen API | Mottagare av sökning | Sverige | Public API — inga persondata utgående |
| Bolagsverket API | Mottagare av sökning | Sverige | Public API — inga persondata utgående |
| Google Calendar | Mottagare av kalenderhändelser | USA | OAuth, opt-in, separate consent |
| LinkedIn | Mottagare av profilimport-data | USA | OAuth, opt-in, separate consent |

### 1.5 Gallringstider (retention)

| Datatyp | Retention | Motivering |
|---|---|---|
| Aktivt konto | Tills användaren raderar | Avtal |
| Inaktivt konto | Varning efter 18 mån, radering efter 24 mån | Storage limitation (Art 5.1.e) |
| AI-promptar (`ai_usage_logs`) | 90 dagar | Säkerhets-/missbruksanalys |
| Sentry-events | 90 dagar | Vendor default |
| Audit-loggar (`consent_history`, `data_sharing_audit`) | 5 år | Accountability (Art 5.2) |
| Uppladdade bilder | Tills användaren tar bort | Avtal |
| Dagbok/Mood-loggar | Tills användaren raderar | Avtal |
| Intresseguidens svar och profiler | Tills användaren raderar kontot | Avtal. `interest_guide_progress`, `interest_guide_history`, `interest_results` och `user_adaptations` har alla `ON DELETE CASCADE` (verifierat mot `pg_constraint` 2026-08-21) och ingår i dataexporten, som härleder tabellistan ur `information_schema`. **Gap:** ingen väg alls att radera historikposter. `interestGuideApi.reset()` ("Gör om testet") raderar bara raden i `interest_guide_progress`; en grep över hela klienten visar **noll** raderingsanrop mot `interest_guide_history`. Enda vägen är kontoradering (Art 17, ROADMAP IG-H) |
| Email-notiser i kö | 30 dagar | Driftsändamål |
| Företagskontots data (`employer_share_proposals`, `employer_messages`, `employer_checkins`, `employer_profiles`, `employer_places`) | **Ingen regel skriven.** Förslag, meddelanden och avstämningar cascadar i praktiken med placeringens gallring (`retention-placements`, 2 år från `end_date`); pågående placeringar raderas aldrig, och företagsprofil/platser har ingen gallring alls | Ska in i `RETENTION-POLICY.md` — öppen rad tillagd där 2026-09-13. Samtyckesbeviset i `consent_history` följer audit-raden ovan (5 år) och överlever förslaget med flit. Se §1.6 |

**Gap:** Ingen automatisk gallring implementerad. Action: cron-job i Supabase för 90-dagars `ai_usage_logs`-rotation.

### 1.6 Företagskonto (AG6, 2026-09-13)

Företagskontot är en organisation av slaget `arbetsgivare` i `organizations` (migration
`supabase/migrations/20260913100000_ag6_foretagskonto.sql`, körd i prod 2026-09-13).
Företagets personer är vanliga USER-konton med medlemsrollen `arbetsgivare`. Det som
förändras i den här bedömningen är att en **ny mottagare** (ett namngivet företag) och en
**ny kategori registrerade** (företagskontakter) tillkommer — inte att någon ny datakälla om
deltagaren tillkommer. Villkoren (`terms.noScreening.*`, AG4 2026-09-01) beskrev förbudet
villkorat, "om portalen ger ett företag ett konto". Nu finns kontot, och villkoren gäller.

**Flödet, och var samtycket sitter:**

1. Konsulenten föreslår en namngiven deltagare för en plats hos ett namngivet företag
   (`employer_share_proposals`, AG5) och väljer per fält vad som får delas — `show_contact`,
   `show_summary`, `show_skills`, `show_experience`, `show_education`, `show_documents`, alla
   `DEFAULT false` (opt-in, till skillnad från `profile_shares`).
2. Deltagaren får frågan (notis `foretag_forslag`) och svarar ja eller nej via
   `respond_to_share_proposal`. Ett ja skrivs som rad i `consent_history` med
   `consent_type = 'employer_share'` och `reference_id` = förslaget — art. 7.1-bevis för
   *vilket* samtycke, *till vem*, *för vad*. Ett nej loggas inte och syns aldrig för
   företaget. Deltagaren kan återkalla (`withdrawn`); företaget ser då inte längre förslaget.
3. Först då läser företaget de godkända fälten — genom **vyn `employer_proposals`**, ägd av
   postgres med vitlistade kolumner, filtrerad på `status = 'accepted'`, mottagarföretag,
   giltighetstid och visningstak. Företaget läser aldrig `employer_share_proposals`,
   `consultant_work_placements`, `profiles` eller `cvs` direkt.

**Vad företaget strukturellt aldrig får** (saknas i vyerna — inte bara dolt i UI):
`ai_summary` (fältet "sammanfattning" är personens egen CV-text), matchnings-/ATS-poäng,
intresseprofil, mående, dagbok, `internal_adaptation_notes`, `participant_supervision_need`,
`supervision_notes`, `notes`, `employer_future_needs`, `employer_hiring_interest`, ett nej
(`declined`), och andra deltagare än den föreslagna. Det finns ingen lista över personer,
ingen sökfunktion och ingen AI som väljer eller rangordnar (se `AI-ACT-CLASSIFICATION.md`,
avsnittet "Företagskonto").

**Kontaktvägar:** meddelanden går per förslag mellan företaget och konsulenten
(`employer_messages`, `sender_kind` ∈ {`foretag`, `konsulent`}) — **aldrig till deltagaren**.
Företaget kan lämna avstämningar om en pågående placering (`employer_checkins`: vad som går
bra, farhågor, intresse att fortsätta), som konsulenten läser och notifieras om.

**Lagring:** `employer_share_proposals` cascadar från placeringen, `employer_messages` från
förslaget och `employer_checkins` från placeringen — så de följer i praktiken gallringen av
`consultant_work_placements` (2 år från `end_date`, jobbet `retention-placements`). Men ingen
regel är skriven för `employer_*`: pågående placeringar (`end_date IS NULL`) raderas aldrig,
och `employer_profiles`/`employer_places` (företagets egen text, kontaktpersoner) har ingen
gallring alls. **Gallringsregeln saknas i `RETENTION-POLICY.md` och ska in** — en öppen rad
är tillagd där 2026-09-13.

**Risker:** R12–R14 i §3.1, åtgärder i §3.2, residual i §4.

---

## 2. Nödvändighet och proportionalitet

### 2.1 Är behandlingen nödvändig?
Ja — portalens kärnändamål kräver behandling. Utan CV-byggande, hälsodata för anpassning, och AI-vägledning kan inte tjänsten levereras.

### 2.2 Dataminimering
- AI-funktioner får bara den data som behövs (t.ex. personligt brev får inte hälsodata)
- Konsulent ser bara deltagare hen är kopplad till (RLS)
- Sentry får bara `user.id`, inte email
- Frontend skickar pseudonymiserat där möjligt

### 2.3 Korrekthet
- Användaren kan när som helst rätta egna uppgifter (Settings)
- AI-genererad output presenteras som "förslag" — användaren godkänner innan användning

### 2.4 Lagringsbegränsning
Se 1.5. **Gap att åtgärda:** automatisk gallring.

---

## 3. Risker för registrerades rättigheter och friheter

### 3.1 Identifierade risker

| Risk | Sannolikhet | Konsekvens | Riskpoäng |
|---|---|---|---|
| **R1:** Hälsodata exponeras vid breach | Låg | Mycket allvarlig | **HÖG** |
| **R2:** AI-rekommendation styr individ mot fel jobb | Medel | Allvarlig | **MEDEL** |
| **R3:** Algoritmisk diskriminering (bias) | Medel | Mycket allvarlig | **HÖG** |
| **R4:** Konsulent missbrukar tillgång till deltagardata | Låg | Allvarlig | **MEDEL** |
| **R5:** Tredjelandsöverföring (OpenRouter USA) | Hög | Medel | **MEDEL** |
| **R6:** Användaren förstår inte AI-användning | Hög | Medel | **MEDEL** |
| **R7:** Profilering utan möjlighet att invända | Medel | Medel | **MEDEL** |
| **R8:** Otillräcklig tillgänglighet (WCAG-brister) | Hög | Medel | **MEDEL** |
| **R9:** Data-export används av arbetsgivare för screening | Låg | Mycket allvarlig | **MEDEL** |
| **R10:** Sekundär användning (modellträning hos OpenRouter) | Låg | Allvarlig | **MEDEL** |
| **R11:** Art 9-data lagras eller delas utan uttryckligt samtycke, för att grinden sitter på fel nivå | ~~Låg~~ **Inträffad** | Mycket allvarlig | **HÖG** |
| **R12 (AG6, 2026-09-13):** En konsulent delar för mycket — fler fält än uppdraget kräver, eller fel person, till ett företag | Låg | Allvarlig | **MEDEL** |
| **R13 (AG6):** Företaget använder mottagna uppgifter för att jämföra eller sortera personer (screening) | Låg | Mycket allvarlig | **MEDEL** |
| **R14 (AG6):** Företaget tar direktkontakt med deltagaren utanför konsulentens uppdrag | Medel | Medel | **MEDEL** |

> **R11 är inte hypotetisk — den var verklig fram till 2026-08-21.** Granskningen av
> Intresseguiden hittade tre fel som förstärkte varandra:
>
> 1. `HealthConsentGate` omslöt bara **renderingen** av funktionsavsnittet. Skrivningen var
>    ogrindad, så självskattad kognition, koncentration, motorik, sensorik och ork lagrades
>    oavsett samtycke. Vid granskningen: **10 sådana rader, en profil med samtycke satt.**
> 2. RLS-grinden `check_health_consent()` fanns på `interest_results` men neutraliserades av en
>    `FOR ALL`-policy utan `WITH CHECK` på samma tabell — permissiva policyer OR:as, så det
>    effektiva villkoret blev `auth.uid() = user_id`. Grinden kunde inte fälla någon skrivning.
> 3. Grinden vaktade dessutom fel tabell: `interest_results` skrivs inte av någon kodväg (1 rad),
>    medan datan låg i `interest_guide_progress` och `interest_guide_history`. Konsulentpolicyn på
>    den senare krävde inte `share_health_data`, tvärtemot vad Art 30-registret påstod.
>
> Åtgärdat samma dag, verifierat i `pg_policies` mot produktion. Se revisionsnoten i
> `GDPR-ART30-REGISTER.md` för exakt vad som ändrades och vad som kvarstår.
>
> **Lärdomen för den här DPIA:n:** en samtyckesgrind i gränssnittet är inte en samtyckesgrind.
> Varje Art 9-behandling i §1.3 bör kunna besvara frågan *"vilken rad i `pg_policies` fäller en
> skrivning utan samtycke?"* — och svaret ska verifieras mot databasen, inte mot koden.

### 3.2 Åtgärder för att minska risker

| Risk | Åtgärd | Implementation |
|---|---|---|
| R1 | RLS, AES-256 at rest, TLS, separate consent | 🟡 RLS och kryptering på plats. "Separate consent" stod som ✅ men gällde bara gränssnittet — se R11 |
| R2 | Transparens "AI är vägledning", möjlighet att invända | 🟡 UI-text bra, opt-out saknas |
| R3 | Bias-test vid modelländring + årligen | ❌ Att etablera |
| R4 | `data_sharing_audit`, granulärt samtycke per kategori | ✅ Implementerat |
| R5 | Region fra1 + verifiera OpenRouter DPF + SCC + TIA | 🟡 Fra1 klar, OpenRouter att verifiera |
| R6 | Privacy-sida, AI-policy, AI-disclosure i UI | 🟡 Sidor finns, AI Act Art 50-märkning saknas |
| R7 | Settings-toggle "AI-funktioner PÅ/AV" | ❌ Att implementera |
| R8 | WCAG 2.1 AA-audit + tillgänglighetsredogörelse | 🟡 Delvis |
| R9 | ToS-förbud, ingen bulk-API | ✅ Ingen bulk-API. **ToS omskrivet 2026-09-01 (AG4)** — förbudet namnger handlingarna (söka, filtrera, rangordna, jämföra), slår fast att ett företagskonto bara kan ta emot ett förslag om en namngiven person efter dennes ja, att ingen AI väljer person åt en arbetsgivare, och att AI-resultat om en person aldrig lämnas ut till en arbetsgivare. Lydelsen i `terms.noScreening.*`, vaktad av `juridiska-sidor-i18n.test.ts` |
| R10 | OpenRouter-villkor förbjuder modellträning | 🟡 Verifieras med OpenRouter |
| R11 | Grinden i RLS, inte bara i UI. Konsulentåtkomst villkorad av `share_health_data` | 🟡 Rättat för `interest_results` och för konsulentåtkomsten till `interest_guide_history` (migration körd 2026-08-21, utfall verifierat i `pg_policies`). **Kvarstår:** `interest_guide_progress`, `interest_guide_history` och `user_adaptations` grindas fortfarande av applikationskoden vid lagring. `user_adaptations` har ingen samtyckesgrind alls |
| R12 | Opt-in per fält (`show_*` `DEFAULT false`); deltagaren ser exakt vilka fält innan hon svarar; vitlistad vy i stället för tabellåtkomst; guarden låser fälten efter beslut; ett förslag gäller en person och ett företag | ✅ Migrationerna AG5 + AG6 körda 2026-09-13, vy och policyer verifierade i prod enligt migrationens verifieringsblock. Bevis per delning i `consent_history` (`employer_share`, `reference_id`) |
| R13 | Ett förslag i taget, ingen lista, ingen sökfunktion, inga AI-resultat i vyn; ToS-förbud (`terms.noScreening.*`, AG4) som nu gäller ett konto som finns; inbjudningsmejlet säger det rakt ut ("Det finns ingen sökfunktion bland personer — det är ett medvetet val") | ✅ Strukturellt — vyn kan inte returnera andra personer än den föreslagna, och `employer_share_proposals` har inget poäng- eller rangordningsfält. ToS vaktat av `juridiska-sidor-i18n.test.ts`. **Kvar:** AG9-avtal med företaget som gör förbudet bindande mellan parterna |
| R14 | Ingen meddelandeväg företag → deltagare: `employer_messages` går bara företag ↔ konsulent, och notiser från företaget går till konsulenten. Kontaktuppgifter lämnas bara om `show_contact` | 🟡 Strukturellt i portalen. Utanför portalen kan ingen teknik hindra det — då gäller avtalet (AG9) och konsulentens uppdrag |

---

## 4. Residualrisk efter åtgärder

Efter implementation av samtliga åtgärder i tabell 3.2:

| Risk | Residualrisk |
|---|---|
| R1, R4 | Låg |
| R2, R6, R7, R8 | Låg |
| R3 | Medel (kvarstår tills första bias-test är klar) |
| R5 | Låg–Medel (USA-överföring elimineras inte helt) |
| R9, R10 | Låg |
| R11 | **Medel** — grinden är rättad där den kan vara det i RLS, men tre tabeller med Art 9-data skyddas fortfarande av applikationskoden vid lagring, och `user_adaptations` inte alls. Sänks till Låg först när grinden flyttats till RLS eller ICF-delen brutits ut i en egen tabell |
| R12, R13 | Låg — så länge vyn `employer_proposals` förblir vitlistad och ingen listvy byggs. Höjs till Medel om vyn får en `SELECT *`-väg, om något AI-fält läggs i den, eller om ett företag kan se mer än ett förslag i en jämförbar vy |
| R14 | Låg–Medel — kan inte sänkas tekniskt; beror på avtalet (AG9) |

**Total residualrisk:** **MEDEL** — R11 håller den uppe tills lagringsgrinden ligger i databasen.
Var **MEDEL → LÅG** i föregående version; den bedömningen byggde på att R1:s "separate consent"
var implementerad, vilket den inte var på lagringsnivå.

**Behov av IMY-samråd (Art 36):** Kan undvikas om alla åtgärder implementeras inom 90 dagar. Om implementationen drar ut på tiden eller om jurist bedömer att bias-risk inte kan reduceras till acceptabel nivå utan validering — då bör IMY-samråd genomföras.

---

## 5. Övervakning och uppföljning

- **DPIA-omprövning** vid varje större ny funktion eller modelländring (minimum årligen).
- **Bias-test** av AI-rekommendationer vid varje deployment av ny modell.
- **Incident-loggning** med 72h-anmälan till IMY enligt Art 33.
- **DPO** (om utsedd) granskar månadsvis.
- **Användarfeedback** via "Rapportera ett problem" i UI — kanaliseras till DPO.

---

## 6. Slutsats

Behandlingen är **godtagbar förutsatt att åtgärderna i sektion 3.2 implementeras inom 90 dagar**. Residualrisken är efter åtgärd LÅG-MEDEL.

Inga åtgärder kan eliminera all risk — sårbar målgrupp + AI + hälsodata utgör inherent risk. Vår strategi: minimera, vara transparent, ge användaren maximal kontroll, dokumentera.

**Godkänt av:** _____________ (personuppgiftsansvarig)
**Datum:** _____________
**Nästa revision:** 2027-05-15 eller vid större förändring.

---

## Bilaga A: Underlag

- `docs/COMPLIANCE-AUDIT-2026-05-15.md` — grundlig audit
- `docs/AI-ACT-CLASSIFICATION.md` — klassificering per AI-funktion
- `docs/RLS_VERIFICATION.md` — RLS-policies
- `docs/HOSTING-REGIONS.md` — region-policy
- `client/src/pages/Privacy.tsx` — integritetspolicy
- `client/src/pages/AiPolicy.tsx` — AI-policy
- Migrationerna `20260327100000_user_consent.sql`, `20260328100000_health_data_consent.sql`, `20260327110000_delete_account.sql`
