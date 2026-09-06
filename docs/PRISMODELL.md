# Prismodellen — vad som faktiskt står i drift

**Status:** Underlag för beslut, inte ett beslut. Skrivet 2026-09-06 som svar på **DOK5** i
`docs/ROADMAP.md`.

**Premiss (DOK5):** *"Prissättningen står i drift men i inget dokument."* **Håller.** Talen
2 990 kr/mån + 290 kr/konsulent står live på startsidan och i FAQ:n (källor nedan), och en
genomsökning av hela `docs/`-katalogen efter *pris*, *licens*, *avgift*, *kostnad*, *betala*,
`2990`/`2 990` och `290 kr` hittar **noll** dokument som beskriver en prismodell — bara
omnämnanden i granskningsrapporter (`docs/review-2026-08-09/publik-yta.md:368`, som citerar
samma siffror som ett fynd) och i `docs/ROADMAP.md` självt. Det finns alltså inget ställe där
någon kan läsa modellen utan att öppna källkoden. Den här filen är det stället.

---

## 1. Vad som står, ordagrant, med källa

Allt nedan är hämtat ur `client/src/i18n/locales/sv.json` (`landing.pricing.*` och
`landing.faq.a1`) och renderas av `client/src/pages/Landing.tsx` (sektionen `#priser`,
rad ~718–815). Den engelska filen (`en.json`, samma radnummer) bär samma tal med engelsk text
— `2,990`/`290 SEK` — så paritetstestet (`sprakparitet.test.ts`) håller dem i synk.

| Nivå | Pris | Källa (rad i `sv.json`) | Beskrivning i produkten |
|---|---|---|---|
| **Organisationslicens** | **2 990 kr/månad** | `price` rad 7626, `period` rad 7628 | "Grundlicens för din organisation med tillgång till hela plattformen" (rad 7629) |
| **Per konsulent** | **290 kr/månad** | `price` rad 7643, `period` rad 7645 | "Licens per aktiv konsulent/jobbcoach som använder plattformen" (rad 7646) |
| **Deltagare** | **0 kr — "Gratis"** | `price`/`priceLabel` rad 7660/7663 | "Alltid gratis för deltagare – inga kostnader överhuvudtaget" (rad 7664) |

**FAQ (rad 7760–7761, fråga "Vad kostar Jobin?"):**
> "Jobin är alltid gratis för deltagare. Organisationer betalar en fast licens på 2 990 kr/månad
> plus 290 kr per aktiv konsulent. Inga dolda avgifter – alla funktioner ingår."

**Villkorsraden under prissektionen (`landing.cta.noCard`, rad 7788):**
> "Ingen bindningstid. Inga startavgifter. Kom igång inom 24 timmar."

**Call-to-action:** båda betalnivåerna (organisation och konsulent) länkar till
`mailto:sales@jobin.se` (`Landing.tsx:759,787`) — inte till något självbetjänings- eller
kassaflöde. Deltagarnivån länkar till `/register` (`Landing.tsx:813`).

**"Populärast"-märket** (`landing.pricing.mostPopular`, rad 7674) sitter på
**organisationslicensen**, hårdkodat i JSX (`Landing.tsx:735-739`) — det är inte databaserat på
någon faktisk försäljningssiffra, det är en layoutväljare i koden.

### Vad som INTE stod, och som jag letade efter

- Ingen moms nämns någonstans i prissektionen eller FAQ:n (öppen fråga, se §5).
- Ingen bindningstid nämns förutom "Ingen bindningstid" ovan — det är ett löfte, inte en
  avtalsmall (ingen sådan finns i `docs/`, se §5).
- Ingen rabattstege för fler konsulenter eller fler deltagare.
- Ingen skillnad mellan årsbetalning och månadsbetalning.

---

## 2. Vad som ingår — härlett ur produktkopian, inte verifierat mot en spärr i koden

Funktionslistorna nedan är exakt vad `sv.json` säger ingår i respektive nivå
(`landing.pricing.<nivå>.features`, rad 7630–7639 / 7647–7656 / 7665–7674).

| Organisationslicens | Per konsulent | Deltagare |
|---|---|---|
| Obegränsat antal deltagare | Egen konsultvy | AI-stödd CV-byggare |
| Admin-panel med statistik | Hantera egna deltagare | Personligt brev-generator |
| Deltagaruppföljning | Chattfunktion | Intresseguide (RIASEC) |
| Gruppadministration | Anteckningar & uppföljning | Jobbsökning med filter |
| API-integrationer | Delad kalender | Intervjuträning |
| Prioriterad support | Progressrapporter | Karriärcoach |
| SSO-inloggning (tillval) | CV-granskning | Dagbok & välmående |
| Anpassad branding (tillval) | Jobbmatchning | Kunskapsbank |

**Viktig avgränsning, verifierad mot prod-schemat och koden 2026-09-06: det finns ingen teknisk
spärr bakom någon av nivåerna.**

- `information_schema.columns` i prod har **ingen** kolumn som heter `plan`, `tier`, `license`
  eller liknande, på någon tabell. `information_schema.tables` har ingen `organization`-,
  `tenant`-, `team`- eller `company`-tabell.
- Kontot styrs bara av `profiles.active_role` (`PARTICIPANT`/`CONSULTANT`/`ADMIN`/`SUPERADMIN`)
  och en 1:1-relation `profiles.consultant_id` — se **RM5** i `docs/ROADMAP.md:558-566`, som
  redan konstaterat att sökning på `team_id`/`org_id`/`manager`/`handover` i konsulentmodulen
  ger **noll träffar**.
- Konkret: en användare som får rollen `CONSULTANT` (satt manuellt i databasen eller av en
  admin) får konsultvyn, chatten, delad kalender och allt annat i mittenkolumnen ovan —
  **oavsett om någon licens någonsin betalats.** Det är inte en bugg i betydelsen "ska fixas
  brådskande", men det betyder att prissättningen i dag är ett **kommersiellt löfte, inte en
  produktbegränsning**. Vem som får vad avgörs av vem som sätter rollen i databasen, inte av
  ett betalflöde.
- Tre funktioner i organisationslistan har jag **inte** hittat någon kod för alls:
  **SSO-inloggning** (ingen SAML/OIDC/Azure AD-integration i `client/src` eller `client/api` —
  strängen "SSO" förekommer **bara** i de två locale-filernas prissträng, ingen annanstans),
  **API-integrationer** (inget kund-API, ingen API-nyckelutgivning, inga webhooks hittade) och
  **Anpassad branding** (ingen tema-/vitmärkningsmekanism hittad). "Admin-panel med statistik"
  och "Gruppadministration" har åtminstone en motsvarande route (`/admin` →
  `SuperAdminPanel.tsx`), men jag har inte granskat om den panelens innehåll matchar
  löftet "statistik" och "gruppadministration" i detalj — det låg utanför uppdraget.

**Jag skriver ut det här inte för att döma funktionslistan, utan för att §1's krav — skriv
aldrig ett tal du inte kan belägga — gäller lika för påståenden om vad som ingår. Tre punkter
på listan är sålda men obyggda; det är ett faktum, inte en gissning.**

---

## 3. Betalningsinfrastruktur: det finns ingen

Sökt igenom `client/src`, `client/api` och `supabase/functions` efter Stripe, faktura,
"billing" och "subscription" (i betydelsen betalabonnemang, inte Supabase Realtime-tabellen
`subscription`, som är databasmotorns egen infrastruktur och inte har med fakturering att
göra). **Resultat: ingen betalningsintegration existerar.** Alla CTA:er på prissidan går till
`mailto:sales@jobin.se` — försäljningen är manuell, förmodligen ett avtal som tecknas utanför
portalen. Det finns alltså:

- Ingen automatisk mätning av "aktiv konsulent" (se öppen fråga i §5).
- Ingen faktureringsmotor, inget kundnummer, ingen koppling mellan ett Supabase-konto och ett
  betalande företag.
- Inget sätt att i dag verifiera om **någon enda** betalande kund finns, eller om alla 92 konton
  (senast mätt 2026-08-09, se `docs/portal-review-2026-08-09.md`) är oberoende av
  prismodellen.

---

## 4. Kopplingen till RM5 — vad 200 deltagare kostar i praktiken

`docs/ROADMAP.md:558-566` (**RM5**) konstaterar att Rusta och matcha-avtalet (FFU §4.5.2) sätter
**tak på 50 samtidiga deltagare per heltidshandledare, proportionerligt vid deltid**. Priset är
satt per konsulent (290 kr/mån), inte per deltagare — så antalet deltagare en leverantör har
styr indirekt kostnaden, via antalet konsulenter avtalet kräver dem att anställa.

**Räkningen, med avtalets eget tak:**

| Deltagare hos leverantören | Konsulenter avtalet kräver (⌈deltagare / 50⌉) | Konsulentlicenser (à 290 kr) | + Organisationslicens (2 990 kr) | **Summa/månad** |
|---|---|---|---|---|
| 50 | 1 | 290 kr | 2 990 kr | **3 280 kr** |
| 100 | 2 | 580 kr | 2 990 kr | **3 570 kr** |
| 200 | 4 | 1 160 kr | 2 990 kr | **4 150 kr** |
| 500 | 10 | 2 900 kr | 2 990 kr | **5 890 kr** |
| 1 000 | 20 | 5 800 kr | 2 990 kr | **8 790 kr** |

Det här matchar ROADMAP-radens egen slutsats (`docs/ROADMAP.md:744-745`: "en leverantör med 200
deltagare behöver minst fyra, alltså 4 150 kr/mån"). **Notera vad räkningen förutsätter och vad
den inte gör:**

- Den antar att leverantören håller sig **exakt** vid avtalets tak (50/konsulent). En
  leverantör som av arbetsmiljö- eller kvalitetsskäl bemannar glesare (t.ex. 30
  deltagare/konsulent) betalar mer per deltagare än tabellen visar, utan att avtalet kräver det.
- Den räknar bara konsulentlicensen som avtalet i förfrågningsunderlaget kräver — **inte**
  eventuella extra roller (arbetsterapeut, studie- och yrkesvägledare) som samma avtal också
  kan kräva och som skulle vara ytterligare "konsulenter" enligt prissidans definition, om de
  också "använder plattformen" (definitionen är inte snävare än så, se §5).
  Rader RM1–RM6 i roadmapen beskriver flera sådana roller utan att ta ställning till om de
  räknas som "aktiv konsulent" i prismodellen.
- **200 kr/deltagare i månaden vore priset om modellen var per-deltagare** (2 990 kr / 200 +
  290 kr × 4 / 200 = 20,75 kr/deltagare) — alltså betydligt lägre än per-konsulent-modellen ger
  vid full beläggning. Det är matematik på siffrorna i produkten, ingen rekommendation.

**Slutsats att ta med till beslutet:** modellen belönar en leverantör som håller *färre*
konsulenter per deltagare (upp till avtalets tak) med en lägre portalkostnad per deltagare —
samtidigt som avtalet (FFU §4.5.2) sätter en övre gräns för hur glest man får bemanna. De två
regelverken pekar åt samma håll för leverantören (bemanna vid taket), vilket är värt att
veta om prissättningen ska ändras med R&M-marknaden i åtanke.

---

## 5. Öppna frågor — kräver Mikaels beslut

1. **Moms.** Ingen av siffrorna (2 990 / 290) anger om moms ingår eller tillkommer. Ingen
   momsstatus för Jobin AB har hittats i `docs/` (se även öppen fråga om org.nr i BF2-relaterade
   dokument — `client/src/i18n/locales/sv.json:7839` säger uttryckligen "Org.nr: uppgift lämnas
   på begäran").
2. **Bindningstid.** Prissidan lovar "Ingen bindningstid" (rad 7788), men det finns ingen
   avtalsmall i `docs/` att skriva under mot det löftet. Vad händer om en kund vill säga upp
   licensen — är "ingen bindningstid" också "ingen uppsägningstid"?
3. **Vad betyder "aktiv konsulent" tekniskt?** Databasen har ingen sådan status (§3). Räknas en
   konsulent som "aktiv" den dag hen loggar in? Den månad hen har minst en tilldelad deltagare?
   Så länge kontot inte är avstängt? Utan en teknisk definition kan ingen faktura räknas ut ens
   om en betalningsmotor byggdes.
4. **Finns en avtalsmall?** Inget kontrakts- eller avtalsdokument hittades i `docs/` eller
   någon annan katalog i repot. Om `sales@jobin.se` redan används för att teckna avtal —
   var förvaras det avtalet, och stämmer det mot prissidans löften?
5. **Ska de tre obyggda funktionerna (SSO, API-integrationer, anpassad branding) tas bort ur
   listan, byggas, eller kvarstå som "kommer snart"?** I dag säljs de som om de fanns.
6. **Ska organisationsbegreppet byggas innan fler kunder tecknas?** RM5 (`docs/ROADMAP.md:558`)
   flaggar att hela konsulentmodulen saknar organisationsentitet — vilket betyder att två
   betalande kunder i dag skulle dela exakt samma tabellstruktur utan någon spärr mellan dem
   mer än vilken konsulent som är kopplad till vilken deltagare för hand. Är det acceptabelt
   för den första betalande kunden, eller är det en förutsättning som måste lösas före
   fakturering kan starta?
7. **Är talen 2 990/290 fortfarande de som ska gälla, eller är de kvarlämnade** från ett tidigt
   utkast? Den här filen kan inte svara på det — bara på att de är de tal som visas i drift i
   dag (senast verifierat 2026-09-06).

---

*Underlag, inte beslut. Skriv en rad här när Mikael tagit ställning till någon av punkterna i
§5, så att nästa läsning vet vad som är avgjort.*
