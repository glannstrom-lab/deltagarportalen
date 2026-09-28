# Skarpt funktionstest — leverantörsområdet (SL). Prod 2026-09-28

Konton: `demo-leverantor@jobin.se` (R&M-coach/chef, "Demoleverantör (påhittade personer)"),
deltagarna **Jonas Demo** (`jonas.demo@example.com`) och **Sara Exempel** (`sara.exempel@example.com`),
och `foretag.demo@example.com` (Nordfrakt Logistik (demo)). Inga andra demokonton rörda.

Körare: `e2e/rollspel-2026-09-28.cjs` (samma som gårdagens rollspel). Stegfiler:
`e2e/skarpt-2026-09-28-leverantor-*.cjs` (7 st: 2 företag, 4 coach, 2 deltagare — en kombinerad).
Belägg: skärmdumpar + sidtext i `docs/review-2026-09-28-rollspel/skarpt-leverantor/`.
**Nätverksfel (≥400) mot Supabase/`/api/` och konsolfel: 0, i samtliga sju körningar** (`natverk.txt`
skapades aldrig).

## Vad jag muterade (allt i demoorganisationer som nollställs i natt)

- Nordfrakt: två nya platser, **SL-skarpt Lager 2026-09-28** (praktik) och **SL-skarpt Kontor
  2026-09-28** (arbetsträning).
- Coachen: kopplade Jonas till Lager-platsen och Sara till Kontor-platsen, skickade ett
  delningsförslag för var och en (kompetenser + arbetslivserfarenhet ikryssade). Registrerade en
  placering för Sara (SL-skarpt Kontor AB, Kontorsassistent, tillsvidare, 30 h/vecka, nivå B,
  startdatum backdaterat 100 dagar för att kunna pröva 3-månadersuppföljningen), registrerade den
  uppföljningen (datum/utfall/underlag) och satte betalstatus "verifierad". Markerade Jonas plan
  "förd över till MSFA" för september. Markerade en av Jonas ogiltiga-frånvaro-avvikelser som
  "underrättad AF". Laddade ner CSV-rapporten och Jonas plan-PDF.
- Jonas och Sara: godkände delningsförslaget ("Ja, dela"). Sara bytte språk sv→en→lätt svenska→sv
  för att kontrollera Min vecka på alla tre. Jonas laddade ner sitt närvarointyg.
- Nordfrakt (Ali): svarade "Vi vill gå vidare" på Jonas förslag, "Tacka nej" på Saras. Gjorde en
  avstämning på Jonas plats. Skickade ett meddelande i Jonas tråd.
- **Ostädat med flit**: allt ovan är demodata som nollställs i natt (samma konvention som
  gårdagens rollspel). Ett eget skriptfel (dubblettförslag för Jonas, se SL1) rättades manuellt
  via UI:t (`Ta bort utkast`) i samma pass, verifierat i databasen.
- **Inget eget testkonto skapades** — hela flödet gick att pröva med demokontona.

## Testmatris

| Funktion | Utfall |
|---|---|
| **Coach** | |
| Deltagarlista (Jonas/Sara) | ✅ |
| Aktivitetsloggen mot avtalskravet (RR1: eget jobbsökande räknas inte) | ✅ |
| Resultatklockan / betalstatus (RR25) | ✅ |
| "Markera som förd över till MSFA" (RR24) | ✅ |
| Registrera placering: utfall/omfattning/nivå/studier (RR7) | ✅ |
| 3-månadersuppföljning: datum/utfall/underlag (RR5) | ✅ |
| 6-månadersuppföljning | ⏭ (samma dialog/kodväg som 3-mån, punkten ligger 83 dagar fram — inte nåbar utan ännu en backdatering) |
| Periodrapport-underlag ("Underlag för rapporten") | ✅ |
| Avvikelserapport: visa, markera underrättad, kvarstår efter omladdning (RR28) | ✅ |
| Kapacitet mot taket 50 (RR29) | ✅ |
| Plan-PDF: "Rusta och matcha", inte socialtjänstlagen (RR2) | ✅ |
| Excel/CSV-export: riktig CSV, inte TSV som .xlsx (RK9) | ✅ |
| "Nämndrapport" dold i PDF-dialogens typval för leverantör (RR9 delvis) | ✅ |
| Kollegoroller inte kommunspecifika i synlig vy (RR9 delvis) | ✅ |
| Caseload-kolumnen "Ogiltig frånvaro 30 d" (RR9 rest) | ❌ kvarstår |
| Omfångsraden nämner "nämndrapporten"/"IVO-underlaget" även för leverantör | ❌ kvarstår (ny, se SL5) |
| **Företag (Nordfrakt)** | |
| Skapa ny plats | ✅ |
| Ta emot delningsförslag, kompetenser+erfarenhet ikryssade | ✅ |
| Svara "Vi vill gå vidare" → platsen blir Tillsatt automatiskt (FT1) | ✅ |
| Platsen inte längre valbar för ny placering efter Tillsatt (FT1) | ✅ |
| Svara "Tacka nej" → platsen förblir öppen | ✅ (trivialfall; se anmärkning under SL-not1) |
| Avstämning (check-in) | ✅ |
| Meddelande från företaget → når coachen | ✅ |
| Notisklockan uppdateras av företagets egna handlingar | ❌ kvarstår (FT3) |
| Presentationen: Erfarenhet-fallback ("Inget inlagt") | ✅ (ny, delvis rättat sedan FT2) |
| Presentationen: Kompetenser-sektion när personen saknar kompetenser | ❌ kvarstår (FT2, se SL2) |
| **Deltagare (Jonas/Sara)** | |
| Godkänna delningsförslag ("Ja, dela") | ✅ (× 2) |
| Min vecka: Arbetsförmedlingen/Rusta och matcha, svenska | ✅ |
| Min vecka: samma, engelska | ✅ |
| Min vecka: samma, lätt svenska | ✅ |
| Min vecka: ALDRIG kommun/socialtjänstlagen/socialnämnd, alla tre språk | ✅ |
| Närvarointyg-PDF, nedladdning | ✅ |

**26 prövade: 23 ✅, 2 ❌ (båda kvarstående, kända sedan igår), 1 ⏭.**

## Buggar

### Medel

**SL2 — Kompetens-sektionen visar fortfarande ingenting, trots att Erfarenhet nu har fallback-text (FT2 halvt rättat).**
*Repro:* Som coach, skapa ett delningsförslag för en deltagare utan kompetenser inlagda (Jonas har
0 rader i `profile_skills`) med "Kompetenser" ikryssat. Som företaget, öppna förslaget.
*Förväntat:* Antingen en "KOMPETENSER"-rubrik med "Inga kompetenser inlagda." (texten finns redan i
`Kompetenser`-komponenten), eller att sektionen konsekvent uteblir precis som förr.
*Faktiskt:* "ERFARENHET" visas nu korrekt med fallback-texten "Inget inlagt." (samma mönster som
FT2 efterlyste) — men "KOMPETENSER" saknas helt, ingen rubrik alls.
*Belägg:* `docs/review-2026-09-28-rollspel/skarpt-leverantor/txt/d-03-jonas-detalj.txt` (rad ~68:
"ERFARENHET / Inget inlagt." — ingen "KOMPETENSER" någonstans på sidan). Databaskontroll:
`profile_skills` har 0 rader för Jonas; `cvs.work_experience` är en verklig tom array `[]` (inte
null) — det förklarar asymmetrin: erfarenheten kommer direkt från en kolumn som redan var `[]`,
kompetenserna byggs med `jsonb_agg(...)` över noll rader som ger SQL NULL, inte `'[]'::jsonb`.
*Trolig kod:* `client/src/components/foretag/ForslagDetalj.tsx:160-161` (`f.participant_skills &&`
— gate på sanning, renderar aldrig om värdet är `null`), grundorsaken i vyn
`supabase/migrations/20260913100000_ag6_foretagskonto.sql` (skills-aggregeringen saknar
`COALESCE(..., '[]'::jsonb)` som erfarenhets-fältet tydligen fick).

### Låg

**SL1 — "Föreslå deltagaren för företaget" har ingen spärr mot ett redan väntande förslag för samma placering.**
*Repro:* Klicka "Föreslå deltagaren för företaget" två gånger för samma platskort innan deltagaren
svarat (hände av misstag i den här körningen — knappen försvinner inte och inget varnar).
*Förväntat:* Antingen döljs/inaktiveras knappen medan ett `pending`-förslag redan finns för
placeringen, eller så visas en varning ("Ett förslag väntar redan på svar").
*Faktiskt:* Ett andra `employer_share_proposals`-utkast skapades utan varning — deltagaren hade
fått två identiska frågor om jag inte rättat det manuellt.
*Belägg:* Databaskontroll före rättning: två rader med samma `placement_id`, båda `status=pending`,
för Jonas (`c7a5aa69…`, `2c100461…`). Rättat via UI:ts egen "Ta bort utkast", verifierat efteråt:
en rad per deltagare.
*Trolig kod:* `client/src/components/consultant/PlaceringCard.tsx:192-195` (`onForesla &&`-villkoret
kontrollerar bara att platsen har ett företagskonto, inte om `forslagPerPlats` redan har en
`pending`-rad — den datan finns redan i `PlatserTab.tsx:136-144`).

**SL3 — Notisklockan hos företaget uppdaterades inte av en enda av dagens fyra handlingar (FT3 kvarstår, ny repro).**
*Repro:* Som Nordfrakt: svara på ett förslag, tacka nej till ett annat, gör en avstämning, skicka
ett meddelande — allt i samma inloggning.
*Förväntat:* Badge-siffran ändras (minst för de egna olästa notiserna som besvaras).
*Faktiskt:* Siffran stod på "6" både före och efter samtliga fyra handlingar.
*Belägg:* `docs/review-2026-09-28-rollspel/skarpt-leverantor/txt/d-01-oversikt-fore.txt` och
`d-10-oversikt-efter.txt`, rad 5 i båda: "6".
*Trolig kod:* `client/src/components/notifications/NotificationBell.tsx` — ingen koppling från
`foretagApi.svara`/avstämnings-/meddelandemutationerna till notistabellen (samma fynd som FT3 i
`docs/review-2026-09-28-rollspel/foretag.md`, bekräftat kvarstående).

**SL4 — Caseload-kolumnen "Ogiltig frånvaro 30 d" är fortfarande kommunens begrepp för en leverantör (RR9 rest).**
*Repro:* Som chef hos en leverantör, Inställningar → Din organisation → Caseload-tabellen.
*Förväntat:* En rubrik som passar Rusta och matcha (t.ex. "Avvikelser 30 d" eller kopplad till
FFU §4.4), eftersom rollnamnen och PDF-rapporttyperna redan är gjorda organisationstyp-medvetna.
*Faktiskt:* Kolumnen heter fortfarande "OGILTIG FRÅNVARO 30 D".
*Belägg:* `docs/review-2026-09-28-rollspel/skarpt-leverantor/txt/d-05-installningar-organisation.txt`.
*Trolig kod:* `client/src/components/consultant/OrganisationSektion.tsx` (kolumnrubriken är inte
kopplad till `orgTypVisning.ts`, till skillnad från rollnamnen och rapporttyperna som redan är det).

**SL5 — Omfångsraden på Rapporter nämner "nämndrapporten" och "IVO-underlaget" även för en leverantör.**
*Repro:* Som leverantörens coach, öppna Rapporter.
*Förväntat:* Texten om vad som räknas "hela enheten" ska nämna de dokument som faktiskt finns för
den här organisationstypen (leverantören har varken nämndrapport eller IVO-underlag — de är redan
dolda på rätt ställen).
*Faktiskt:* "IVO-underlaget, nämndrapporten, månadsunderlagen och aktivitetsloggen räknar hela
Demoleverantör…" — en generisk mening som inte matchar vad leverantören faktiskt ser.
*Belägg:* `docs/review-2026-09-28-rollspel/skarpt-leverantor/txt/d-04-rapporter-oversikt.txt`, rad 29.
*Trolig kod:* omfångsraden i `pages/consultant/AnalyticsTab.tsx`/`components/consultant/OmfangRad.tsx`
(sannolikt `rapportOmfang.ts`) — texten är inte villkorad på `regelverk`.

## Anmärkning: en kodväg går inte att pröva via UI

FT1-triggerns "öppna platsen igen när ett ja återkallas" (den andra halvan av logiken i
`20260928_ft1_plats_tillsatt.sql`) går inte att testa via gränssnittet med demokontona: när
företaget väl svarat (ja eller nej) finns ingen väg att ändra svaret (`ForslagDetalj.tsx` visar
bara det slutgiltiga svaret), och konsulenten kan inte dra tillbaka ett redan accepterat förslag
(`ForslagPanel.tsx`: "efter beslut finns ingen raderingsväg (triggern nekar)"). Jag testade det
triviala fallet (tacka nej till en plats som aldrig haft ett ja — förblir öppen, korrekt) men
kunde inte reproducera själva återöppningen. Rekommendation: ett SQL-nivåprov mot triggern direkt
(sätt och dra tillbaka `employer_response` i en transaktion), inte en UI-väg.

## Förbättringar (kort)

1. Koppla notisklockan till de mutationer som faktiskt besvarar en notis (SL3/FT3) — annars lär
   sig användaren att ignorera badgen, precis tvärtom mot syftet.
2. Lägg `COALESCE(..., '[]'::jsonb)` på kompetens-aggregeringen i AG6-vyn (SL2) — samma fix som
   redan verkar finnas för erfarenhet, bara på fel kolumn.
3. Spärra eller varna vid ett andra "Föreslå"-klick medan ett förslag väntar (SL1) — datan
   (`forslagPerPlats`) finns redan i komponentträdet, det är bara `PlaceringCard` som inte får den.
