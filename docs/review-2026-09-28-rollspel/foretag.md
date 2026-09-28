# Rollspel: "Ali", lagerchef och ägare, Nordfrakt Logistik (demo) — prod 2026-09-28

Konto: `foretag.demo@example.com` (organisationstyp `arbetsgivare`, roll-mapp `foretag`), inloggad via engångslänk (`/#/visa-som`).
Skript: `e2e/rollspel-2026-09-28-foretag-ali.cjs` (huvudrundan), `-foretag-ali2.cjs` (uppföljning), `-foretag-dark.cjs` (mörkt läge),
`-foretag-coach.cjs` (konsulentsidan, `demo-leverantor@jobin.se`), `-foretag-peter.cjs` (deltagarsidan, `peter.testsson@example.com`).
Belägg: `foretag/m-NN-namn.png` + `txt/` (sidtext), `foretag-coach/d-NN-*.png`, `foretag-peter/m-NN-*.png`. Ingen tidigare rollspelsrapport
finns för den här rollen (2026-09-27 täckte kommunkonsulent, R&M-coach och deltagare, inte företagskontot).

**Muterat i demon (nollställs i natt):** Som Ali — svarade "Vi vill gå vidare" på Omars förslag (med meddelande), gjorde en avstämning på
Omars placering ("vecka 12", går bra / inget oroar / vill fortsätta), skickade ett meddelande i Annas tråd. Öppnade "Bjud in kollega" och
avbröt (inget mejl skickat). Ändrade inget i företagsprofilen (den var redan ifylld, se FT-not nedan). Som Demo Coach (annan roll, uttryckligen
godkänt i uppdraget) — skapade en plats-koppling och ett delningsförslag för **Peter Testsson** mot Nordfrakts plats "Lagermedarbetare,
dagtid". Som Peter — godkände förslaget. Rörde ingen annan deltagare än Peter (min tilldelade person för det här experimentet).

## Helhetsintryck (Ali)

Det här är första gången jag känner att en digital tjänst faktiskt fattar hur det är att ta emot praktikanter: jag ser vem som föreslås, jag
svarar med en knapptryckning mellan två leveranser, jag vet vem jag ringer om något strular, och stödsidan säger rakt ut vilka bidrag som
finns utan att gissa på belopp — precis det jag frågar Arbetsförmedlingen om varje gång. Men jag hittade en sak som oroar mig på riktigt:
när jag sa ja till Omar för lagerjobbet stod platsen kvar som "Öppen", och en helt annan förmedling kunde föreslå en till person för exakt
samma jobb utan att någon varnade. Om jag inte loggar in och manuellt stänger platsen kan jag stå med två personer och en plats. Och för
personer utan ifyllt CV (vilket är många i början) ser jag bara en mening — ingen kompetenslista, ingen erfarenhet — trots att rutan för det
var ikryssad. Fixa de två så är jag såld, och då säger jag gärna åt kollegan på grannlagret att prova.

**De 3 viktigaste:**
1. **Platsen flaggas inte "Tillsatt" när jag tackat ja — dubbelbokning reproducerad live** (FT1). Jag sa ja till Omar för "Lagermedarbetare,
   dagtid"; platsen stod ändå kvar som "Öppen", och en konsulent från en helt annan organisation kunde föreslå Peter Testsson för samma
   plats utan varning.
2. **En ikryssad delning kan visa ingenting** (FT2) — "Kompetenser" och "Erfarenhet" försvinner tyst, utan ens en "inget inlagt"-text, när
   personen inte fyllt i något. Hände för både Omar och Peter — troligen normalfallet för nya deltagare, inte ett undantag.
3. **Notisklockan följer inte med det jag faktiskt gör** (FT3) — den stod kvar på samma antal genom hela passet, trots att jag läst,
   svarat, gjort en avstämning och skickat två meddelanden.

Antal fynd: **Kritiskt 2 · Viktigt 2 · Skav 2 · Förslag 5.**

## Tidsåtgång / friktion (Alis vanligaste uppgifter)

- **Svara på ett förslag:** från Översikt → "Läs presentationen" → "Vi vill gå vidare" → skriva meddelande → skicka: fyra tryck, under en
  minut. Går även direkt från Översikt-kortet med "Tacka nej" utan att öppna hela presentationen — bra för den som bara har trettio sekunder.
- **Avstämning (check-in):** från Pågående → "Gör en avstämning" → tre fält → skicka: cirka en minut. Matchar konsulentens eget meddelande
  ("det tar fem minuter") — stämmer, snarare mindre.
- **Meddelande till konsulenten:** en tråd per förslag, tydligt vem som skrev vad och när. Inga överraskningar.
- **Hitta rätt stöd (lönebidrag, nystartsjobb):** Stöd och regler-fliken svarade direkt på min fråga, utan att en enda krona eller procent
  stod påhittad — bara "Beslut om stöd fattas av Arbetsförmedlingen. Er konsulent hjälper er med ansökan." Exakt rätt nivå för mig.
- **Lägga till en plats:** formuläret är långt men går snabbt — fysiska krav, handledningsnivå och sjukanmälan i samma flöde är precis det
  jag annars glömmer berätta för en praktikant förrän första dagen.

## Kritiskt (fel, lögn eller tyst dataförlust)

**FT1. Platsstatus uppdateras aldrig automatiskt när ett förslag accepteras — dubbelbokning möjlig och reproducerad live.** · nytt
Var: `/foretag/platser`, `/foretag/forslag`, konsulentsidan `/consultant/platser`.
Jag (Ali) svarade "Vi vill gå vidare" på Omars förslag för platsen "Lagermedarbetare, dagtid" (2026-09-28). Platsen stod ändå kvar som
"Öppen" i både ljust och mörkt läge (`m-dark-19-dark-oversikt.png`). Jag loggade sedan in som en helt annan konsulent
(`demo-leverantor@jobin.se`, ett annat leverantörskonto) och kunde utan varning skapa en ny placering och ett nytt delningsförslag för
Peter Testsson mot **exakt samma plats** — platsväljaren i konsulentens formulär listade den som valbar eftersom den bara filtrerar på
`status === 'oppen'`. Peter accepterade, och förslaget landade hos mig som ett andra "väntar på svar"-kort för samma jobb
(`m-18-peter-detalj.png`). Ingenstans i koden sätts `employer_places.status` till `'tillsatt'` automatiskt — jag verifierade att ingen
trigger eller tjänstefunktion gör det (`grep tillsatt` i `foretagApi.ts`, migrationen och edge-funktionerna ger bara typdefinitionen).
Belägg: `foretag/m-06-forslag-omar-efter-svar.png` (jag har svarat ja), `foretag/m-dark-19-dark-oversikt.png` (platsen ändå "Öppen"),
`foretag-coach/d-04-foretagsplats-vald.png` (platsen valbar för en annan konsulent), `foretag/m-18-peter-detalj.png` (Peters förslag
landar för samma jobb).
Fil: `client/src/components/consultant/PlaceringFormModal.tsx:181` (`fp.status === 'oppen'`, ingen koppling till redan accepterade förslag),
`client/src/services/foretagApi.ts:30` (statustyperna finns, ingen automatik sätter dem), `supabase/migrations/20260913100000_ag6_foretagskonto.sql:288`.

**FT2. En ikryssad delning ("dela kompetenser/erfarenhet") kan renderas som ingenting, utan att skilja mellan "inget delat" och "inget att dela".** · nytt
Var: `/foretag/forslag?id=…` (presentationsvyn).
Omars förslag har `show_skills=true` och `show_experience=true` (verifierat i databasen), men presentationen visar bara en
"ERFARENHET"-rubrik (han har en anställning i CV:t) och ingen "KOMPETENSER"-rubrik alls — han har noll rader i `profile_skills`. Jag
byggde ett kontrollerat andra fall: som konsulent kryssade jag i BÅDA "Kompetenser" och "Arbetslivserfarenhet" för Peter Testsson, som
saknar både kompetenser och CV-erfarenhet helt. Resultatet: presentationen visar varken "KOMPETENSER" eller "ERFARENHET" — bara
konsulentens fritext och logistik (`m-18-peter-detalj.png`). Som Ali kan jag inte se skillnaden mellan "personen valde att inte dela det
här" och "det finns inget att visa" — jag ser bara att rubriken saknas. För en ny deltagare utan ifyllt CV, vilket rimligen är vanligt,
blir hela presentationen bara en mening från konsulenten plus schema. Det är för tunt för att jag ska känna mig trygg med vem jag tar emot.
Belägg: `foretag/m-04-forslag-omar-detalj.png`, `foretag/m-18-peter-detalj.png`; databaskontroll: `profile_skills` och `cvs.work_experience`
tomma för båda Omar och Peter trots `show_skills`/`show_experience` = true på båda förslagen.
Fil: `client/src/components/foretag/ForslagDetalj.tsx:160-168` (sektionerna `Kompetenser`/`Erfarenhet`/`Utbildning` renderas bara om
`f.participant_skills`/`f.participant_experience`/`f.participant_education` är sanna — `null` döljer hela sektionen, ingen fallback-text
trots att `Kompetenser`-komponenten faktiskt HAR en sådan text ("Inga kompetenser inlagda.") som aldrig nås). Grundorsaken ligger i vyn:
`supabase/migrations/20260913100000_ag6_foretagskonto.sql:487-491` — `jsonb_agg(...)` och CV-underfrågorna returnerar `NULL` (inte en tom
lista) när personen saknar rader, och `CASE WHEN esp.show_skills THEN (...) END` saknar `COALESCE` till `'[]'::jsonb`.

## Viktigt

**FT3. Notisklockan (bell) speglar inte det jag faktiskt gjort.** · nytt
Var: toppnaven, alla sidor.
Klockan visade "4" redan vid inloggning (två "väntar på svar"-notiser, varav en för Annas förslag som redan besvarats den 13 september —
alltså en vecka gammal och inaktuell redan innan jag rörde något). Genom hela passet — läste Omars presentation, svarade "vi vill gå
vidare", gjorde en avstämning, skickade två meddelanden — låg siffran kvar oförändrad (och steg till "5" när Peters förslag kom in). Jag
hittade ingen koppling mellan att faktiskt agera på ett förslag och att notisen om det markeras läst; det verkar kräva att jag öppnar
klockan specifikt och klickar där. För någon som kollar portalen i korta stötar mellan leveranser lär det här mig snabbt att ignorera
badgen helt, vilket är precis tvärtom mot vad den ska göra.
Belägg: `foretag/m-02-oversikt.png` (klocka visar 4 före svar), `foretag/m-dark-19-dark-oversikt.png` (klocka visar 5, efter allt arbete);
databaskontroll: notisraden för Annas förslag (`foretag_forslag`, skapad 2026-09-28, gäller ett beslut fattat 2026-09-13) står kvar `read:
false`.
Fil: `client/src/components/notifications/NotificationBell.tsx` (markering som läst sker bara vid klick i själva klockan/`markAllAsRead`,
ingen koppling från `foretagApi.svara`/avstämning/meddelande-mutationerna till notistabellen).

**FT4. Föreslå-dialogen (konsulentsidan) använder hårdkodat "hon" oavsett deltagarens kön.** · nytt, upptäckt "från andra hållet"
Var: `/consultant/platser`, dialogen "Föreslå [namn] för [företag]" — konsulentsidan, syns aldrig direkt för Ali men formar texten Peter
läser och därför indirekt det Ali litar på i processen.
Dialogtexten står "Företaget ser inget förrän **hon** sagt ja, och bara det **hon** kryssat i" och "Deltagaren läser texten innan **hon**
svarar" — oavsett att jag testade med Peter Testsson, ett mansnamn. Litet i sig, men lätt att missa eftersom det aldrig syns i Alis eget
gränssnitt.
Belägg: `foretag-coach/d-06-foresla-dialog.png`, `foretag-coach/d-07-foresla-dialog-ifylld.png`.
Fil: `client/src/components/consultant/ForeslaDialog.tsx:142,190`.

## Skav

**FT5. "vecka 0" för en placering som inte börjat än.** · nytt
Var: `/foretag/pagaende`. Omars placering (start 8 oktober, inte påbörjad) visas som "Lagermedarbetare, dagtid · Praktik · vecka 0" i
stället för något i stil med "börjar om 10 dagar". "Vecka 0" läser lätt som en bugg snarare än "har inte börjat än".
Belägg: `foretag/m-08-pagaende.png`, `foretag/m-dark-19-dark-oversikt.png`.
Fil: `client/src/services/foretagApi.ts:529` (`vecka = dagar < 0 ? 0 : …`, inget särfall för framtida start i UI:t).

**FT6. Avstämningens föreslagna milstolpe (vecka 12) syns bredvid platsens egen veckoräknare (t.ex. "vecka 2 av 12") — två olika tal med
samma "12" av en slump, lätt att blanda ihop.** · nytt
Var: `/foretag/pagaende`, Anna Exempels kort: "vecka 2 av 12" (platsens längd i veckor) står precis ovanför "Avstämningen vid vecka 12 och
24 går till konsulenten" (milstolpe räknad från start). För Anna råkar båda vara 12, men det är två helt olika betydelser av samma
siffra och blir förvirrande så fort en placering har en annan total längd än 12 veckor.
Belägg: `foretag/m-08-pagaende.png`, `foretag/m-09-avstamning-dialog.png`.
Fil: `client/src/pages/foretag/PagaendeFlik.tsx:34` (`foreslagenVecka`) vs. `client/src/services/foretagApi.ts:520` (`veckaAvTotal`).

## Förslag (utveckling)

**FT-F1. Push- eller e-postavisering vid nytt förslag och när ett förslags svarsfönster ("visas till") snart går ut.**
Vad: en riktig avisering utanför portalen — jag kollar inte jobin.se proaktivt, jag kollar mejlen och SMS mellan leveranser.
För vem: alla företagskonton, men särskilt den som (som jag) inte sitter vid skärm hela dagen.
Varför: Omars förslag hade redan väntat 3 dagar när jag först loggade in (se `m-02-oversikt.png`, "det äldsta sedan 3 dagar") — om jag
inte råkat logga in hade fönstret kunnat gå ut (`visas till 12 oktober`) utan att jag ens sett det. Hänger ihop med FT3: badgen i sig
räcker inte.
Storlek: medel — kräver en aviseringskanal (e-post finns redan via Resend för andra flöden, SMS är nytt); logiken för VAD som ska
utlösa den finns redan i notistriggrarna.

**FT-F2. Markera platsen "Tillsatt" automatiskt när jag svarar "Vi vill gå vidare", och varna en konsulent som försöker föreslå någon för
en plats som redan har ett accepterat förslag.**
Vad: direkt uppföljning av FT1 — antingen sätta `employer_places.status = 'tillsatt'` i samma transaktion som `employer_response =
'interested'`, eller åtminstone visa en tydlig flagga ("redan accepterad kandidat") i platsväljaren (`PlaceringFormModal.tsx`).
För vem: mig som företag (slipper hålla reda på det manuellt) och konsulenterna (slipper föreslå in i en stängd dörr).
Värde: förtroende. Det här är den typen av krångel jag hade med Arbetsförmedlingen förut ("ingen visste vem som redan tagit platsen") —
om Jobin gör samma miss tappar jag förtroendet direkt.
Storlek: liten — en databastrigger plus en kontroll i formuläret.

**FT-F3. Garantera att en presentation alltid visar något konkret, även när deltagaren saknar ifyllt CV.**
Vad: fallback-text ("Inget inlagt än") i stället för att sektionen tyst uteblir (koden har redan en sådan text i `Kompetenser`-komponenten
— den bara nås aldrig), plus ett fritextfält i föreslå-dialogen där konsulenten kan skriva en kort styrkelista själv när personen inte
hunnit fylla i CV.
För vem: alla företag, men mest relevant för nya deltagare (troligen den vanligaste gruppen som föreslås tidigt i en insats).
Värde: jag kan bedöma fler kandidater med förtroende i stället för att bara läsa en mening och gissa.
Storlek: liten (fallback-text) till medel (nytt fritextfält + delningslogik).

**FT-F4. Ett "det här har fungerat"-avsnitt på Översikt när en placering avslutas.**
Vad: en enkel sammanfattning — antal avslutade placeringar, hur många av avstämningarnas "Vill ni fortsätta?"-svar som blev ja — byggd
av data som redan samlas in (`employer_checkins.continue_interest`) men aldrig visas tillbaka.
För vem: mig, och framför allt den kollega på grannlagret jag skulle rekommendera Jobin till.
Värde: det är exakt vad jag skulle visa en annan företagare för att övertyga dem — "vi har haft tre praktikanter, två stannade av eget
intresse." I dag finns ingen historik alls, bara det pågående.
Storlek: medel — kräver en "avslutade placeringar"-vy och en aggregering av redan lagrad data.

**FT-F5. Ett enda ställe att se vad jag väntar på totalt, sorterat efter hur bråttom det är** (kopplar ihop FT1/FT3/FT-F1: obesvarat
förslag med kort tid kvar, plats som saknar accepterad kandidat trots svar, olästa meddelanden) i stället för att behöva klicka igenom
Förslag/Pågående/Meddelanden var för sig för att veta om något brådskar.
För vem: mig, med två minuter mellan lass.
Värde: minskar risken att något viktigt (som det tickande svarsfönstret) missas i bruset.
Storlek: liten till medel — mest en ny sammanställning av data som redan finns i respektive flik.
