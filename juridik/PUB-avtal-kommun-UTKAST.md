# Personuppgiftsbiträdesavtal — kommun som personuppgiftsansvarig, Jobin som biträde

**Status: UTKAST 2026-09-11. Inte juridiskt granskat. Skrivet för att ha ett underlag att lägga
på bordet i första kommunmötet, inte för att signeras som det är.** Klamrar `[…]` är luckor bara
Mikael kan fylla i. Strukturen följer SKR:s mall för personuppgiftsbiträdesavtal (som kommunernas
dataskyddssamordnare känner igen) och artikel 28.3 GDPR. Där portalen avviker från vad en kommun
brukar kräva står det uttryckligen under rubriken *Avvikelser att förhandla*, inte gömt i
löptexten.

---

## 1. Parter

| | Personuppgiftsansvarig | Personuppgiftsbiträde |
|---|---|---|
| Part | `[Kommunens namn]`, genom `[nämnd, t.ex. socialnämnden / gymnasie- och arbetsmarknadsnämnden]` | `[Jobins juridiska person — fyll i]` |
| Org.nr | `[212000-XXXX]` | `[fyll i]` |
| Adress | `[…]` | `[…]` |
| Kontaktperson | `[namn, roll]` | Mikael Glännström |
| Dataskyddsombud | `[kommunens DSO]` | `[utse, eller dokumentera varför inte krävs]` — i dag dpo@jobin.se |

## 2. Bakgrund och syfte

Kommunen använder tjänsten Jobin (www.jobin.se) som stöd i arbetet med deltagare som omfattas av
aktivitetskravet i försörjningsstödet (socialtjänstlagen 2025:400, 12 kap. 4 a–6 a §§) och i annat
arbetsmarknadsstöd. Kommunen bestämmer ändamål och medel för behandlingen och är
personuppgiftsansvarig. Jobin behandlar personuppgifter för kommunens räkning och är
personuppgiftsbiträde. Avtalet gäller den behandling som sker i konsulentvyn, i deltagarens
konto när deltagaren är kopplad till kommunens konsulent, och i de underbiträden som listas i
bilaga 2.

**Avgränsning som ska sägas rakt ut:** deltagaren skapar sitt konto själv och använder portalen
för egna ändamål (CV, jobbsökning, dagbok). För den behandling som deltagaren gör för egen räkning
utan koppling till kommunens konsulent är Jobin personuppgiftsansvarig enligt portalens
integritetspolicy, inte biträde. Gränsen går vid kopplingen konsulent–deltagare
(`consultant_participants`) och det samtycke deltagaren ger i portalen.

## 3. Instruktioner (art. 28.3 a)

Jobin behandlar personuppgifter endast enligt kommunens dokumenterade instruktioner. Detta avtal
med bilagor är instruktionen. Ytterligare instruktioner lämnas skriftligt av kommunens
kontaktperson. Om Jobin bedömer att en instruktion strider mot dataskyddsförordningen ska Jobin
omedelbart informera kommunen.

Överföring till tredjeland sker endast enligt bilaga 2 (OpenRouter, USA, för AI-funktioner) och
endast om kommunen inte stängt av AI-funktionerna för sina deltagare, se punkt 11.

## 4. Sekretess (art. 28.3 b)

Personer hos Jobin som behandlar personuppgifterna omfattas av tystnadsplikt genom avtal.
Kommunens uppgifter om enskilda i ärenden om ekonomiskt bistånd omfattas av socialtjänstsekretess
(26 kap. OSL) hos kommunen; Jobin får inte lämna ut uppgifterna till någon utanför detta avtal.

## 5. Säkerhet (art. 28.3 c, art. 32)

Tekniska och organisatoriska åtgärder beskrivs i bilaga 3. I korthet: radnivåsäkerhet i databasen
som avgränsar varje konsulent till sina egna deltagare och varje deltagare till sina egna uppgifter,
kryptering under överföring och i vila hos Supabase, inloggning med lösenord (BankID eller SSO
finns inte i dag, se avvikelser), loggning av åtkomst i den omfattning som anges i bilaga 3, och
kontinuerlig automatisk kontroll av att koden inte pekar på databasobjekt eller rättigheter som
ändrats.

## 6. Underbiträden (art. 28.2, 28.4)

Kommunen godkänner de underbiträden som listas i bilaga 2. Jobin ska informera kommunen skriftligt
minst **30 dagar** innan ett underbiträde läggs till eller byts ut. Kommunen har rätt att invända;
kan parterna inte enas har kommunen rätt att säga upp avtalet utan kostnad. Jobin ansvarar fullt ut
för underbiträdenas behandling.

## 7. Bistånd till kommunen (art. 28.3 e–f)

Jobin ska bistå kommunen med att uppfylla den registrerades rättigheter (tillgång, rättelse,
radering, begränsning, dataportabilitet). Deltagaren kan själv ta ut sina uppgifter och radera sitt
konto i portalen; kommunen kan begära uttag för en deltagare från Jobin, som lämnar det inom
**10 arbetsdagar**. Jobin bistår vid konsekvensbedömning (DPIA) och förhandssamråd med IMY med det
underlag som finns i bilaga 3 och i Jobins egna dokument (DPIA, Art 30-register, AI-akt-klassning).

## 8. Personuppgiftsincidenter (art. 33)

Jobin ska underrätta kommunens kontaktperson **utan onödigt dröjsmål och senast inom 24 timmar**
efter att Jobin fått kännedom om en personuppgiftsincident som rör kommunens uppgifter, med den
information som behövs för kommunens anmälan till IMY inom 72 timmar. Jobins interna rutin finns i
`docs/INCIDENT-RESPONSE.md`.

## 9. Radering och återlämnande (art. 28.3 g)

När avtalet upphör raderar Jobin, efter kommunens val, kommunens personuppgifter eller återlämnar
dem i maskinläsbart format (JSON/CSV) och raderar därefter, senast **30 dagar** efter upphörandet.
Deltagarens eget konto och de uppgifter deltagaren behandlar för egen räkning (punkt 2) berörs inte
av detta; kopplingen till kommunens konsulent tas bort och konsulentens journal, mål, planer och
närvaro för kommunens deltagare hanteras enligt bilaga 1.

**Avvikelse att förhandla:** automatisk gallring i portalen är inte driftsatt (ingen schemalagd
körning finns, se `docs/RETENTION-POLICY.md`). Gallring enligt bilaga 1 görs i dag manuellt av Jobin
på kommunens begäran, med skriftlig bekräftelse.

## 10. Granskning (art. 28.3 h)

Kommunen har rätt att en gång per år, eller vid skälig misstanke om brist, granska Jobins
efterlevnad genom skriftlig förfrågan, genom tredjepartsgranskning eller genom besök efter
överenskommelse. Jobin lämnar då tillgång till den dokumentation som anges i bilaga 3. Jobin har
ingen ISO 27001- eller SOC 2-certifiering.

## 11. AI-funktioner och tredjelandsöverföring

Portalens AI-funktioner (CV-hjälp, personligt brev, intervjuträning, AI-team) behandlas hos
OpenRouter Inc. i USA med stöd av EU-kommissionens standardavtalsklausuler och en
överföringskonsekvensbedömning (`juridik/SCC_TIA_OpenRouter.docx`). Fem funktioner går vidare till
Perplexity (sökmodell) och gör en webbsökning på det som skrivits in; det står inte i portalens
integritetspolicy i dag och ska in före signering, eller så stängs de funktionerna av för kommunens
deltagare.

**Följande gäller alltid:**
- Varje AI-funktion kräver deltagarens eget samtycke per funktion innan något skickas.
- Kommunen kan begära att AI-funktionerna stängs av för samtliga deltagare kopplade till kommunens
  konsulenter. Brytaren finns per organisation (`organizations.ai_enabled`, 2026-09-12) och gäller
  i båda AI-backenderna oavsett deltagarens egen inställning; Jobin sätter den på kommunens begäran.
- **Ingen AI används i kedjan schema → närvaro → underlag till beslut om bistånd.** Schemamallar,
  plan, närvaro, veckosaldo och kvartalsunderlag är deterministiska beräkningar. Beslut om
  nedsättning eller nekande av försörjningsstöd fattas av socialnämnden i kommunens eget system.
  Portalen är därmed inte ett högrisksystem enligt AI-förordningen bilaga III p. 5 a, och Jobin
  åtar sig att inte införa AI i den kedjan utan skriftligt godkännande från kommunen.

## 12. Ersättning

Enligt huvudavtalet. `[Pilot: kostnadsfri till och med 2027-03-31 / därefter enligt prislista]`

## 13. Ansvar

`[SKR:s standardformulering om ansvarsfördelning och regress; juridisk granskning krävs.]`

## 14. Avtalstid

Avtalet gäller så länge huvudavtalet gäller och därefter till dess att radering enligt punkt 9
har bekräftats.

---

## Bilaga 1 — Behandlingens art, ändamål, kategorier och lagringstid

| | |
|---|---|
| **Ändamål** | Stöd i kommunens arbetsmarknadsinsatser och i aktivitetskravet: planering av aktiviteter, uppföljning av närvaro, underlag till handläggare och till IVO-rapportering, kommunikation konsulent–deltagare |
| **Registrerade** | Deltagare (kommunens klienter/invånare i arbetsmarknadsinsats), kommunens konsulenter och handläggare |
| **Kategorier — deltagare** | Namn, e-post, telefon; CV, ansökningar, sparade jobb; individuell aktivitetsplan (mall, veckomål, tid för jobbsök, försörjningshinder som kategori, beslutsdatum); pass med närvaro (närvarande, giltig/ogiltig frånvaro, sjuk med läkarintyg inkommet ja/nej, extern); egen incheckning; anteckningar och mål konsulenten skriver; meddelanden; placeringar (praktik, anställning) |
| **Känsliga uppgifter (art. 9)** | Hälsa: status "sjuk" och "läkarintyg inkommet" på ett pass; mående och dagbok delas bara om deltagaren ger separat samtycke i portalen och ingår annars inte. Rättslig grund hos kommunen: art. 9.2 b/h i förening med socialtjänstlagen `[kommunen bekräftar]` |
| **Kategorier — personal** | Namn, e-post, roll i organisationen, caseload (antal) |
| **Behandling** | Lagring, läsning, sammanställning (veckosaldo, kvartalsunderlag), export (PDF till akt, TSV till IVO-underlag), notiser i portalen |
| **Plats** | EU (Irland, Frankfurt). USA endast för AI-funktioner enligt punkt 11 |
| **Lagringstid** | Under avtalstiden. Efter avslutad koppling konsulent–deltagare: `[2 år — bekräftas mot kommunens dokumenthanteringsplan]`, därefter radering enligt punkt 9. Journal, mål och möten låses för båda parter när kopplingen upphör (portalens nuvarande läge) tills kommunen begärt uttag eller radering |

## Bilaga 2 — Underbiträden

| Underbiträde | Behandling | Land/region | Överföringsmekanism | Status |
|---|---|---|---|---|
| Supabase Inc. | Databas, inloggning, fillagring | Irland (EU) | — | DPA på supabase.com |
| Vercel Inc. | Webbhotell, serverfunktioner | Frankfurt (EU); lagring av profilbilder (Vercel Blob) `[region verifieras]` | — | DPA på vercel.com |
| OpenRouter Inc. | AI-inferens (bara om deltagaren slår på AI-funktion) | USA | SCC + TIA (`juridik/SCC_TIA_OpenRouter.docx`) | `[DPA verifieras]` |
| Perplexity AI (via OpenRouter) | Sökmodell i fem AI-funktioner, gör webbsökning på inmatad text | USA | SCC | **Inte i integritetspolicyn i dag — åtgärdas före signering eller stängs av** |
| Functional Software Inc. (Sentry) | Felrapportering, laddas bara efter cookiesamtycke | Multi-region `[EU-instans rekommenderad]` | DPA på sentry.io | — |
| Resend Inc. | E-postutskick (aviseringar, inbjudningar) | `[verifieras]` | `[verifieras]` | Utskick fungerar inte i dag (DNS); tas i bruk först när DPA och region är klara |

## Bilaga 3 — Tekniska och organisatoriska åtgärder

- **Åtkomstkontroll i databasen:** radnivåsäkerhet (RLS) på samtliga 141 tabeller. Konsulenten når
  bara deltagare med en aktiv koppling; deltagaren bara sina egna rader; chef i organisationen ser
  kollegor och caseload som tal, aldrig deltagarnas journal, mående eller dagbok. Kontrollerat med
  automatiska grindar vid varje kodändring (`lint:schema`, `lint:grants`) och med
  rullade-tillbaka tester som inloggad roll vid varje ny policy.
- **Inre sekretess:** rollerna handläggare, arbetskonsulent, chef och administratör per
  organisation. `[Beskriv vad handläggaren ser: närvaro och avvikelser, inte journal.]`
- **Kryptering:** TLS under överföring; kryptering i vila hos Supabase och Vercel.
- **Autentisering:** e-post och lösenord via Supabase Auth; Google-inloggning som tillval.
  `[BankID/SSO finns inte — avvikelse.]`
- **Loggning:** åtkomst- och ändringslogg för konsulenthändelser i den omfattning som anges i
  `docs/security-audit.md`; deltagaren ser själv vem som öppnat hens uppgifter (läslogg i
  Min konsulent, 2026-09-12).
- **Underleverantörernas säkerhet:** enligt respektive DPA.
- **Incidenthantering:** `docs/INCIDENT-RESPONSE.md`, 24 timmar till kommunen.
- **Sårbarhetshantering:** beroendeskanning i varje bygge (`npm audit` på produktionsberoenden),
  kodgranskning före driftsättning.
- **Ingen AI i beslutskedjan:** se punkt 11.
- **Tillgänglighet:** WCAG 2.1 AA som mål, redogörelse på jobin.se/#/tillganglighet med DOS-lagen
  (2018:1937) och EN 301 549 som referens; ingen oberoende granskning gjord.

## Avvikelser att förhandla (läs innan mötet)

1. **Organisationsnummer och juridisk person för Jobin** saknas i alla dokument. Utan det finns
   ingen motpart. `[Mikael]`
2. **Perplexity** är inte redovisat i integritetspolicyn. Antingen in i policyn eller av för
   kommunens deltagare.
3. **Automatisk gallring** är inte driftsatt. Manuell gallring på begäran tills vidare.
4. **BankID/SSO** finns inte. Kommunens IT kommer fråga.
5. ~~Brytare för AI per organisation~~ — finns sedan 2026-09-12.
6. ~~Läslogg för deltagaren~~ — finns sedan 2026-09-12.
7. **Certifieringar** finns inte; granskning enligt punkt 10 i stället.
8. **Journal, mål och möten** vid byte av konsulent: låses i dag. Kommunen kommer vilja att de följer
   med eller arkiveras — produktbeslut.

---

*Källor i repot: `docs/GDPR-ART30-REGISTER.md`, `docs/HOSTING-REGIONS.md`, `docs/DPIA-PORTAL.md`,
`docs/AI-ACT-CLASSIFICATION.md` (avsnittet om bilaga III p. 5 a), `docs/RETENTION-POLICY.md`,
`docs/INCIDENT-RESPONSE.md`, `docs/security-audit.md`, migrationerna `20260911*` och `20260912*`.*
