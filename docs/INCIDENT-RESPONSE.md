# Säkerhetsincident — Response Plan

**Lagkrav:** GDPR Art 33 (anmälan inom 72h till IMY) + Art 34 (informera registrerade vid hög risk).
**Datum:** 2026-09-06 — helt omskriven (BF2, `docs/ROADMAP.md`). Föregående version: 2026-05-15.

## Varför den här versionen finns

Föregående version pekade på **DPO**, **backend-team**, **DevOps** och "**[extern
konsult — utse]**" som om de vore roller som redan fanns i organisationen. Ingen av dem gör
det. Kontrollerat mot git-historiken 2026-09-06: **hela repots commit-historik har en enda
författare** (`git log --format='%an <%ae>' | sort -u` ger `Mikael <glannstrom@gmail.com>` och
`glannstrom-lab <glannstrom@gmail.com>` — samma person, två git-identiteter). Det finns inget
"team" att aktivera. `docs/GDPR-ART30-REGISTER.md:489-490` och `docs/DPIA-PORTAL.md:22` har
själva `[Företagsnamn / juridisk person — fyll i]` och `[Namn — utse formellt eller dokumentera
varför inte krävs]` som ifyllnadsfält för samma roller — de är inte bara oifyllda i den här
planen, de är oifyllda **i grunden**.

En plan som ber en overksam roll agera vid en skarp händelse är sämre än ingen plan: den som
läser den mitt i en incident förlorar tid på att leta efter en DPO eller ett backend-team som
inte existerar, i stället för att göra det en person faktiskt kan göra. Den här versionen
beskriver **den verkliga organisationen**: en person, en portal, en handfull namngivna
leverantörer, och en tydlig lista över vad som **inte** finns på plats.

**Vad som är verifierat att INTE finnas, 2026-09-06:**
- Ingen anställd eller kontrakterad DPO. `dpo@jobin.se` är en e-postadress som nämns i
  `Privacy.tsx`/`AiPolicy.tsx` och i GDPR-registret, men ingen person är formellt utsedd —
  ROADMAP-punkten som skulle boka en (**A2**, i planen kallad "boka AI-jurist" på de flesta
  ställen den nämns, se `docs/ROADMAP.md:3954`, men "boka DPO" i just BF2-raden — de två
  uppdragen är **inte samma sak**, och **ingetdera** är gjort) står öppen sedan minst
  2026-05-28.
- Ingen extern säkerhetskonsult eller pentest-leverantör är kontrakterad. Sökt igenom
  `docs/security-audit.md` och hela `docs/ROADMAP.md` efter "pentest", "penetrationstest" och
  "extern konsult" utanför den här filen — inga träffar. Den senaste säkerhetsrevisionen
  (`docs/security-audit.md`) är utförd av Claude Code på uppdrag av Mikael, inte av en
  oberoende tredje part.
- Inget backend-team, inget DevOps-team. Det finns bara en person med tillgång till Supabase-
  och Vercel-dashboardarna: Mikael.
- Ingen av de tidigare radernas återkommande aktiviteter (årlig pentest, kvartalsvis
  backup-restore-test, kvartalsvis RLS-review, halvårsvis tabletop-övning, halvårsvis
  phishing-simulering) har någon spårbar körning i `docs/` eller `docs/ROADMAP.md`. De togs
  bort ur den här planen i stället för att stå kvar som ett löfte ingen håller.

---

## När gäller anmälan?

Personuppgiftsincident = "säkerhetsbrott som leder till oavsiktlig eller olaglig förstöring,
förlust, ändring, obehörigt röjande eller obehörig åtkomst till personuppgifter" (GDPR Art
4.12).

Exempel på vad som triggar:
- Obehörig åtkomst till databasen (bruten RLS, läckt service-role-nyckel)
- Läckt/exponerad API-nyckel (t.ex. den kända öppna punkten **A1** — OpenRouter-nyckeln, öppen
  sedan 2026-05-28, se `docs/ROADMAP.md:3858`)
- Tappad eller felkonfigurerad backup
- Phishing-attack mot ett konto med `CONSULTANT`-roll som lett till åtkomst till andras data
- Ransomware eller annan skadlig kod som krypterar eller förstör persondata
- Felaktig publicering (t.ex. en RLS-policy som av misstag öppnar dagbok, mående eller CV för
  fler än sin ägare — se lärdomen om "permissiva dubblettpolicyer" i `CLAUDE.md`, som redan
  hänt en gång med `profiles`, `mood_logs` och `storage.objects`)
- Vendor-breach hos Supabase, Vercel, OpenRouter, Perplexity eller Resend

---

## Vem upptäcker en incident? (Läs det här innan du litar på att något larmar)

**Det finns inget system som kontinuerligt övervakar portalen och slår larm.** Så här ser
detektionsvägarna faktiskt ut, var och en med sin begränsning:

1. **Sentry (felspårning) — bara för deltagare som tackat ja till analytics-cookies.**
   `client/src/lib/sentry.ts:57`: `shouldEnable` kräver `SENTRY_DSN`, produktionsläge **och**
   `hasAnalyticsCookieConsent()`. Utan samtycke initieras Sentry aldrig i den sessionen. Det
   betyder: **för de flesta deltagare finns ingen automatisk felrapport.** En stor del av
   målgruppen (långtidsarbetslösa, ofta med begränsad digital erfarenhet, se manifestet i
   `docs/DESIGN.md`) har ingen anledning att aktivt leta upp och slå på analytics-samtycke.
   Detta är korrekt GDPR (ingen spårning utan samtycke) — men det är också sant att en trasig
   eller läckande funktion kan gå obemärkt förbi Sentry helt.
2. **Ingen kontinuerlig drifts-/uppetidsövervakning hittad.** `supabase/functions/health/`
   finns och svarar med databas-, auth- och storage-status — men den enda platsen den anropas
   är i `.github/workflows/deploy.yml` (rad ~186–217), **vid deploy**, inte på ett schema.
   Sökt igenom `.github/workflows/*.yml` efter `schedule:` — ingen träff. Det finns ingen
   UptimeRobot, Pingdom eller motsvarande konfigurerad i repot. Om portalen går ner en dag utan
   deploy är det inte säkert att något märker det förrän en användare hör av sig.
3. **Vercel- och Supabase-dashboardarnas egna loggar och (om aktiverade) larm.** Dessa nås bara
   av den som loggar in och tittar, eller om projektets inbyggda alerting är konfigurerad i
   respektive dashboard — **inte verifierat i den här genomgången**, eftersom dashboard-
   konfiguration inte syns i repot. Kontrollera vid nästa tillfälle: Vercel → Project →
   Monitoring/Alerts, Supabase → Project → Reports/Alerts.
4. **En användare mejlar** `support@jobin.se`, `privacy@jobin.se` eller `dpo@jobin.se`
   (adresserna som visas på `Terms.tsx`, `Privacy.tsx`, `AiPolicy.tsx`) — eller använder
   "Rapportera ett problem" i UI, som `docs/DPIA-PORTAL.md:209` nämner kanaliseras till DPO.
   Eftersom ingen DPO finns går den posten i praktiken till Mikael, om den når fram.
5. **Mikael märker det själv** — vid utveckling, vid en manuell granskning, eller för att någon
   av de andra fyra vägarna råkade fånga det.

**Konsekvens att ta med in i resten av planen:** upptäckt är i dag **reaktiv och personberoende**,
inte systematisk. Punkt 2 (ROADMAP **DR6**, `docs/ROADMAP.md:3478`) är en öppen beslutspunkt:
en samtyckesfri, aggregerad felräknare (som inte kräver individuellt samtycke eftersom den inte
spårar en identifierbar person) skulle täcka luckan i punkt 1 utan att bryta mot GDPR.

---

## Vem beslutar — och vad gör man när den personen är den enda som finns

**Det finns en beslutsfattare: Mikael.** Ingen ledningsgrupp, ingen DPO att eskalera till,
ingen jurist under avtal (A2 öppen). Det betyder konkret:

- **Det finns ingen "andra åsikt" inbyggd i processen.** En bedömning av risknivå (låg/hög/
  mycket hög, se klassificeringen nedan) görs av en person utan formell dataskyddsutbildning.
  Vid **P0/P1** (se eskaleringsmatrisen) är rekommendationen att **samma dag** ta kontakt med
  en jurist eller dataskyddskonsult mot betalning för just den händelsen, snarare än att anta
  att en befintlig resurs finns att fråga — för i dag finns ingen sådan under avtal.
- **Om Mikael själv är otillgänglig** (sjukdom, resa) finns i dag **ingen ersättare** med
  tillgång till Supabase service-role-nycklar, Vercel-projektet eller domänen. Det är en
  organisatorisk sårbarhet i sig, inte bara en lucka i den här planen — värt ett eget beslut
  (t.ex. en förseglad "i nödfall"-instruktion hos en betrodd person) men det beslutet är inte
  fattat och den här planen hittar inte på att det är löst.
- **IMY-anmälan (nedan) kräver ingen jurist för att göras i tid.** Anmälningsformuläret är
  byggt för att en ansvarig ska kunna fylla i preliminär information inom 72 timmar och
  komplettera senare (se nästa avsnitt) — låt inte avsaknaden av en jurist försena den delen.

---

## Akut respons — 0–4 timmar

### Steg 1: Bekräfta och innesluta
1. **Mikael hanterar detta ensam**, och tar in extern hjälp (jurist/säkerhetskonsult) samma
   dag vid P0/P1 — se ovan. Det finns inget IR-team att "aktivera".
2. **Stoppa pågående exponering:**
   - Läckt nyckel → rotera den i leverantörens dashboard (OpenRouter, Supabase, Vercel,
     Resend — beroende på vilken).
   - Bruten RLS eller felaktig policy → `npx supabase db query --linked` med ett `REVOKE`/
     policy-fix, verifierat mot `has_function_privilege`/`pg_policies` (se mönstren i
     `CLAUDE.md`, avsnittet om permissiva dubblettpolicyer och `REVOKE … FROM anon`).
   - Trasig endpoint → ta ner den funktionen i Vercel/Supabase-dashboarden, eller deploya en
     blockering.
3. **Bevara bevis:** ladda ner relevanta loggar från Supabase (Logs Explorer) och Vercel
   (Function Logs) **innan** de roterar ur retention-fönstret, skriv ner en tidslinje medan
   den är färsk, ta en kopia av `supabase/schema-snapshot.json` och
   `supabase/grants-snapshot.json` som de såg ut vid tidpunkten (de committas redan i git, så
   `git log -p` på filerna ger historiken gratis).

### Steg 2: Bedöm omfattning

| Fråga | Var svaret finns |
|---|---|
| Vilka tabeller/data berörda? | `supabase/schema-snapshot.json` (kolumner) + `docs/GDPR-ART30-REGISTER.md` bilaga A (kategorisering per tabell, se registret för vilken behandling tabellen hör till) |
| Hur många registrerade? | `npx supabase db query --linked "SELECT count(*) FROM <tabell>;"` |
| Vilka kategorier persondata? | `docs/GDPR-ART30-REGISTER.md` — sök på tabellnamnet |
| Innehåller det Art 9 (hälsodata, funktionsförutsättningar)? | Se särskilt `interest_guide_history`, `interest_guide_progress`, `mood_logs`, `interest_results` — dokumenterade som Art 9-kategorier i `docs/GDPR-ART30-REGISTER.md` (§ om Intresseguiden, reviderad 2026-08-21) |
| Tidsfönster för exponering? | Supabase Logs Explorer (åtkomstloggar), Vercel Function Logs, `git log` för när en trasig migration/policy landade |
| Var stulen data exfiltrerad, eller bara exponerad? | Avgör om Art 34 (information till registrerade) krävs utöver Art 33 (IMY) |

### Steg 3: Klassificera risk
- **Låg risk:** Inga åtgärder krävs mot registrerade. Anmäl ändå till IMY (Art 33 gäller oavsett
  risknivå, bara Art 34 är riskberoende).
- **Hög risk:** Måste informera berörda registrerade utan oskäligt dröjsmål (Art 34).
- **Mycket hög risk** (massiv läcka av Art 9-data — hälsa, mående, funktionsförutsättningar):
  informera registrerade omedelbart, överväg extern jurist samma dag, dokumentera allt extra
  noggrant eftersom målgruppen är sårbar (se `docs/DPIA-PORTAL.md`, som redan klassar
  behandlingen som "sannolikhet för hög risk: HÖG").

---

## 4–72 timmar — formell hantering

### Anmälan till IMY (Art 33)

Görs via:
<https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/anmal-personuppgiftsincident/>

**Innehåll — och var underlaget till varje punkt finns:**

| Krav i anmälan | Underlag |
|---|---|
| 1. Beskrivning av incidenten | Tidslinjen från Steg 1.3 ovan |
| 2. Kategorier och ungefärligt antal registrerade | `docs/GDPR-ART30-REGISTER.md` + en `count(*)`-fråga mot berörd tabell |
| 3. Kategorier och antal poster | Samma källa |
| 4. Sannolika konsekvenser | Bedöm mot att målgruppen inkluderar personer med Art 9-data (hälsa, funktionsförutsättningar) — se `docs/DPIA-PORTAL.md` |
| 5. Vidtagna och planerade åtgärder | Steg 1–3 ovan, plus vad som planeras för att det inte upprepas |
| 6. Kontaktuppgifter | **I dag: Mikael, `dpo@jobin.se`.** Det finns ingen DPO att ange separat — ange den faktiska kontaktvägen, hitta inte på en titel |

**Tidsfrist:** 72 timmar från upptäckt (inte från att incidenten inträffade — se
"Vendor-incidenter" nedan för när klockan startar vid en leverantörsincident). Saknas delar av
informationen: anmäl ändå inom 72h och komplettera senare — ofullständig anmälan i tid är bättre
än fullständig anmälan för sent.

### Information till registrerade (Art 34) — om hög risk

E-post till alla berörda så snart som möjligt, avsändare `dpo@jobin.se` eller
`privacy@jobin.se`:
- Vad har hänt (klarspråk — DESIGN.md:s Voice & Tone-regler om enkelt språk gäller extra starkt
  här, målgruppen ska förstå på första läsningen)
- Vilka data som berörts
- Vilka konsekvenser som kan uppstå
- Vad som görs för att åtgärda det
- Vad användaren själv kan göra (byt lösenord, var uppmärksam på phishing-försök som utger sig
  för att vara Jobin)
- Kontakt för frågor: `dpo@jobin.se`

**Ingen i-app-notis-mekanism för den här typen av meddelande finns byggd.** Den befintliga
`notifications`-tabellen (kolumner verifierade mot prod 2026-09-06: `id`, `user_id`, `type`,
`title`, `message`, `read`, `read_at`, `action_url`, `data`, `created_at`) är byggd för
produktnotiser, inte för ett granskat, juridiskt bindande GDPR-meddelande — skicka via e-post
tills en sådan kanal är avsiktligt byggd och granskad.

---

## Eskaleringsmatris

| Allvarlighetsgrad | Trigger | Åtgärd | Tidsfrist |
|---|---|---|---|
| **P0 — Kritisk** | Massiv läcka av Art 9-data (hälsa, mående, funktionsförutsättningar) | Mikael + extern jurist (kontrakteras samma dag) + IMY akutkanal + överväg polisanmälan om brottsmisstanke | <4h |
| **P1 — Hög** | Bekräftad obehörig åtkomst, antal registrerade > 100 | Mikael + IMY-anmälan + Art 34-information till berörda | <24h |
| **P2 — Medel** | Misstänkt incident, omfattning oklar | Mikael + preliminär IMY-anmälan medan omfattningen utreds | <72h |
| **P3 — Låg** | Mindre fel, ingen bekräftad exponering | Logga, dokumentera, bedöm om GDPR-relevant och anmäl om så | <7 dygn |

Ingen av nivåerna har längre en rad som säger "DPO" eller "IR-team" som om den fanns — varje
rad säger vem som faktiskt gör jobbet i dag.

---

## Vendor-incidenter

Om en personuppgiftsbiträde meddelar en incident hos dem:
- Notera datum/tid för deras notifikation — **vår 72h-klocka börjar då**, inte när deras
  incident inträffade.
- Be biträdet om all information de har.
- Gör en egen bedömning av påverkan på våra registrerade — ett biträdes anmälan till sin egen
  tillsynsmyndighet ersätter inte vår egen anmälan till IMY.
- Anmäl själv till IMY även om biträdet redan anmält i sitt eget land.

**De biträden som faktiskt hanterar persondata i drift, och var de sitter** (verifierat mot
`docs/HOSTING-REGIONS.md` och `client/src/pages/Privacy.tsx`):

| Leverantör | Roll | Region | Kontakt/status vid incident |
|---|---|---|---|
| **Supabase Inc.** | Databas, Auth, Storage — all persistent persondata | **Irland (EU)**, `docs/HOSTING-REGIONS.md:10` | <https://status.supabase.com/>. DPA-status: "OK" enligt `docs/GDPR-ART30-REGISTER.md` |
| **Vercel Inc.** | Hosting, serverless-funktioner (`/api/ai`, `/api/cv-pdf`, `/api/upload-image`, `/api/job-alerts`) | **Frankfurt (EU)** sedan 2026-05-15, `docs/HOSTING-REGIONS.md:11` | <https://www.vercel-status.com/>. Vercel Blob (profilbilder) har en **overifierad** region — se `docs/HOSTING-REGIONS.md:12` |
| **OpenRouter Inc.** | AI-modellen `openai/gpt-oss-120b` — huvudvägen för alla 20 AI-funktioner i `client/api/ai.js` | **USA**, `docs/HOSTING-REGIONS.md:13` | E-postsupport (ingen statussida dokumenterad). Överföringsgrund **inte fastställd** (ROADMAP **A5**, öppen) — vid en incident som rör AI-data, notera detta uttryckligen i IMY-anmälan |
| **Perplexity** | AI-modellen `perplexity/sonar` — används i fem edge-funktioner (`ai-career-assistant`, `ai-commute-planner`, `ai-company-analysis`, `ai-company-search`, `ai-industry-radar`), inklusive en fritextsökning på webben och (i reseplaneraren) användarens hemadress | **Inte dokumenterad** — CLAUDE.md konstaterar uttryckligen att Perplexity **inte** står i `docs/GDPR-ART30-REGISTER.md`, integritetspolicyn eller DPIA:n. **Det betyder att en incident hos Perplexity i dag saknar en förberedd juridisk hantering** — om något händer där, behandla det som en ny, oplanerad leverantörsincident och dokumentera avsaknaden av befintligt avtal i anmälan | Ingen känd kontaktväg för incidenthantering — hittas vid behov |
| **Resend** | Utskick av jobbaviseringar (`client/api/job-alerts.js`) | **"Verifieras"** enligt `docs/GDPR-ART30-REGISTER.md` — varken DPA-status eller region är fastställd i dag | Ingen känd kontaktväg dokumenterad |

**Automatiska databackuper:** Supabase kan erbjuda point-in-time recovery beroende på
projektets prenumerationsnivå. **Vilken nivå portalens Supabase-projekt har, och om PITR är
aktiverat, är inte verifierat i den här genomgången** — kontrollera i Supabase-dashboarden
(Project → Database → Backups) och skriv svaret här när det är gjort. Fram tills dess: anta
inte att en automatisk backup finns vid en dataförluständelse.

---

## Förebyggande — vad som faktiskt görs i dag, och vad som inte gör det

Den gamla tabellen (pen-test årligen, backup-restore kvartalsvis, RLS-review kvartalsvis,
IR-tabletop halvårsvis, phishing-simulering halvårsvis) hade inga körningar att peka på i
`docs/` — de är borttagna i stället för att stå kvar som ett löfte. Det som faktiskt sker:

| Aktivitet | Sker det? | Källa |
|---|---|---|
| Dependency security-scan | **Ja**, vid varje push till `main` | `.github/workflows/ci.yml`, jobbet "Security Scan" (`npm audit`) |
| Schemadrift-kontroll (kod mot prod-databasen) | **Ja**, vid varje push | `npm run lint:schema`, se `CLAUDE.md` |
| Rättighetsgranskning (anon-öppna funktioner, RLS-täckning) | **Ja**, vid varje push, sedan 2026-09-01 | `npm run lint:grants`, se `CLAUDE.md` (**A36**) |
| Extern penetrationstest | **Nej.** Ingen kontrakterad | — |
| Backup-restore-test | **Nej.** Ingen spårbar körning hittad | — |
| Incident-tabletop-övning | **Nej.** Aldrig genomförd | — |
| Phishing-simulering | **Nej.** Ingen att simulera mot — se nästa rad | — |

**Varför ingen phishing-simulering:** simuleringen i den gamla planen riktade sig mot
"konsulenter" som en intern personalgrupp. Konsulentkontona i portalen tillhör **externa
organisationers anställda** (arbetskonsulenter hos kunder), inte Jobins egen personal — Jobin
har i dag ingen anställd att köra en intern phishing-övning mot. Om en konsulents konto
komprometteras hos en kundorganisation är det den incidenttypen ("Phishing-attack mot konsulent
som lett till åtkomst" i listan ovan) planen redan täcker, inte en övning Jobin kan köra i
förväg.

---

## Konkreta första åtgärder per incidenttyp

### Läckt nyckel (API-nyckel, service-role-nyckel, personlig åtkomsttoken)
1. Rotera nyckeln omedelbart i leverantörens dashboard (Supabase → Settings → API,
   Vercel → Environment Variables, OpenRouter → Keys, Resend → API Keys).
2. Uppdatera miljövariabeln i Vercel/Supabase och redeploya.
3. Kontrollera loggarna för om nyckeln användes av någon obehörig innan rotationen — om ja,
   det är en personuppgiftsincident (se klassificering ovan), inte bara städning.
4. **Känd öppen instans att lära av:** ROADMAP **A1** (OpenRouter-nyckeln, känd läckt sedan
   2026-05-28, fortfarande inte roterad vid skrivande stund) och **SK1** (testkontots lösenord
   i klartext i repots publika historik, fortfarande giltigt mot prod). Båda är exempel på att
   "rotera nyckeln" är steg 1, inte hela åtgärden — bekräfta också att den gamla nyckeln slutat
   fungera.

### Obehörig åtkomst (bruten RLS, kringgången auth, rolleskalering)
1. Identifiera vägen in: en policy, en `SECURITY DEFINER`-funktion utan `auth.uid()`-kontroll,
   eller ett client-side-hål. Se mönstren i `CLAUDE.md` (permissiva dubblettpolicyer,
   `REVOKE … FROM anon` som inte gav effekt).
2. Stäng vägen: `REVOKE`/`GRANT`-korrigering eller ny policy, verifierad med
   `has_function_privilege`/`pg_policies`-frågan i `CLAUDE.md`, **inte** bara att migrationen
   gick igenom utan fel.
3. Kör `npm run grants:refresh` och `npm run schema:refresh` efter fixen och committa
   snapshoten i samma commit som fixen (se `CLAUDE.md`).
4. Bedöm omfattning enligt Steg 2 ovan och klassificera enligt eskaleringsmatrisen.

### Dataförlust (raderad data, trasig migration, misslyckad gallring)
1. Kontrollera om Supabase PITR är aktiverat och om ett återställningsfönster täcker
   förlusten (se "Automatiska databackuper" ovan — status okänd, kontrollera i dashboarden
   **innan** en incident, inte under en).
2. Om ingen backup finns: dokumentera exakt vad som gått förlorat (tabell, radantal, tidsfönster)
   mot `supabase/schema-snapshot.json` och senaste kända goda tillstånd (t.ex. tidigare
   `git log -p` på snapshoten, eller loggar).
3. Dataförlust som rör personuppgifter är en incident enligt Art 4.12 ("förlust") — anmäl enligt
   samma process som ovan, även om ingen extern part fått tillgång till datan.

### Leverantörsavbrott (Supabase, Vercel, OpenRouter, Perplexity, Resend nere)
1. Kontrollera leverantörens statussida (se tabellen ovan).
2. Om avbrottet är hos **Supabase** eller **Vercel**: hela portalen eller delar av den är
   sannolikt nere för alla användare — inget att göra förutom att vänta och, om det drar ut på
   tiden, informera användare via en kanal utanför portalen (t.ex. status på en extern sida,
   eftersom portalen själv kan vara onåbar).
3. Om avbrottet är hos **OpenRouter** eller **Perplexity**: AI-funktionerna faller, resten av
   portalen fungerar. Kontrollera att felhanteringen visar ett tydligt, mänskligt fel (inte en
   trasig sida) — se DESIGN.md:s regel om att ett fel aldrig får se ut som en nolla eller en
   tom framgång.
4. Om avbrottet är hos **Resend**: jobbaviseringar och andra utskick köar eller går förlorade.
   Ingen personuppgiftsincident i sig, men värt att verifiera att kön (`email_queue`) inte
   växer obegränsat eller läcker information i felmeddelanden.
5. **Detta är inte en personuppgiftsincident i sig** om ingen data exponerats, ändrats eller
   gått förlorad — men om avbrottet *orsakar* dataförlust (t.ex. en race condition i en
   migration som körs mitt under ett Supabase-avbrott), gäller "Dataförlust" ovan också.

---

## Kontaktlista (vid incident)

- **Beslutsfattare och enda IR-resurs i dag: Mikael** — nås via de kanaler han redan använder
  (portalens egna adresser går till honom: `dpo@jobin.se`, `privacy@jobin.se`,
  `support@jobin.se`).
- **DPO: finns inte.** `dpo@jobin.se` är en adress, inte en utsedd person. ROADMAP **A2**
  (booking av juridisk hjälp) är öppen sedan minst 2026-05-28.
- **Extern jurist/dataskyddskonsult: finns inte under avtal.** Kontraktera vid behov, i första
  hand vid P0/P1 enligt eskaleringsmatrisen ovan.
- **IT-säkerhetskonsult: finns inte.** Ingen pentest-leverantör eller säkerhetskonsult är
  kontrakterad (verifierat, se ovan).
- **Backend-/DevOps-team: finns inte.** En person (Mikael) har tillgång till Supabase- och
  Vercel-dashboardarna.
- **IMY:** 08-657 61 00 / imy@imy.se /
  <https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/anmal-personuppgiftsincident/>
- **Polis:** 114 14 (icke-akut), 112 (akut) — vid misstänkt brottslig gärning (t.ex. intrång,
  utpressning/ransomware).

---

*Detta dokument är levande. Uppdatera det när en roll faktiskt tillsätts (DPO, jurist,
säkerhetskonsult) eller när en detektionslucka (Sentry-samtycke, ingen uppetidsövervakning)
täpps till — skriv då in vad som ändrats och när, i stället för att skriva en ny plan från
scratch. Nästa full genomläsning: när något av ovanstående ändras, annars senast vid nästa
DPIA-revision.*
