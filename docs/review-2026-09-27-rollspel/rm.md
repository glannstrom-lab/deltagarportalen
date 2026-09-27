# Rollspel: "Jonas", jobbcoach hos en Rusta och matcha-leverantör. Prod 2026-09-27

Konto: `demo-leverantor@jobin.se` (chef i "Demoleverantör (påhittade personer)"). Deltagare: Sara, Jonas Demo, Amina och Peter.
Skript: `e2e/rollspel-2026-09-27-rm-*.cjs` (login, tur, deltagare, mote, placering, journal-export, pdf-mobil, mobilkort).
Belägg: `docs/review-2026-09-27-rollspel/rm/` (skärmdumpar, plan-PDF:en och Excel-filen som de laddades ner).
Nätverksfel (4xx/5xx) och konsolfel: 0 i alla körningar.
Det här ändrade jag i demodatan: ett fysiskt möte med Jonas Demo 30/9 kl. 10, en journalanteckning på Jonas Demo, Aminas 3-månadersuppföljning ikryssad och en placering för Sara (Demobageriet AB, provanställning från 19/10). Allt nollställs i natt.

## Helhetsintryck (som Jonas)

Jobin är närmare ett R&M-verktyg än något kalkylark jag haft. Aktivitetsloggen per vecka, mötesflaggan i deltagarlistan och den ärliga texten om att portalen inte kan skicka något till Arbetsförmedlingen är saker jag inte hittat någon annanstans. Men portalen är fortfarande byggd för kommunen. Min plan-PDF heter "enligt socialtjänstlagen 12 kap.", två vyer ger olika svar om samma vecka, och allt som rör pengar (placering, uppföljning, resultatersättning) är i dag en kryssruta. Därför kan jag ännu inte lita på siffrorna när jag gör den periodiska rapporten.

**De tre viktigaste sakerna:**
1. **RR1.** Aktivitetsloggen räknar deltagarens eget jobbsökande hemma som aktivitetstid. Därför står Jonas Demo på "3 av 4 veckor uppfyllda", medan hans Aktivitet-flik säger "Närvaro 0 h" och "ogiltig frånvaro" för samma vecka.
2. **RR2.** Kommunens juridik syns i leverantörens flöde: plan-PDF enligt socialtjänstlagen, försörjningshinder, socialnämnden, IVO-underlaget och en nämndrapport.
3. **RR3 + RR5–RR7.** Översikten säger "Inga brådskande punkter" medan en deltagare varken haft möte på 33 dagar eller klarat timkravet. Placering och uppföljning bär inget av det underlag resultatersättningen kräver.

Antal fynd: **Kritiskt 4 · Viktigt 8 · Skav 11 · Förslag 6.**

Märkning: **nytt** = inte känt i roadmapen eller konsulentgenomgången 2026-09-12; **kvarstår** = känt fynd som inte är åtgärdat; **planerat** = har en öppen roadmappost (RM1/RM6/NF2/NF3 osv.).

---

## Kritiskt (ljuger eller hindrar arbetet)

**RR1. Aktivitetsloggen och Aktivitet-fliken ger olika svar om samma vecka, och loggen räknar deltagarens eget jobbsökande som aktivitet.**
*Var:* Rapporter → "Aktivitetsloggen mot avtalskravet", september, jämfört med Jonas Demo → Aktivitet, vecka 21–27 sep.
Loggen säger att Jonas Demo klarat timkravet 3 av 4 veckor. Jag räknade passen i hans tidslinje. Varje vecka han "klarar" består enbart av passet *Eget jobbsökande* (hemifrån, 1 h, deltagarens egen redovisning). Alla gruppträffar på kontoret, alltså leverantörens aktiviteter, har han missat (ogiltig frånvaro 28/8, 11/9 och 25/9). Veckan 1–6 sep underkänns bara för att även det egna jobbsökandet var ogiltigt. På Aktivitet-fliken står samma vecka 21–27 sep som "Närvaro 0 h · Eget jobbsökande 1 h · Ogiltig frånvaro 1 pass", med rubriken "Ogiltig frånvaro i veckan". Rapporter räknar den veckan som uppfylld. Sara stämmer: 8 av 8 pass, 4 av 4 veckor. Jag kan alltså inte föra över Jonas Demos siffra till MSFA utan att räkna om för hand. Jag bör också verifiera mot FFU om egen jobbsökning alls räknas som aktivitet hos leverantören. Min läsning är att den inte gör det.
*Belägg:* `04-rapporter-avtalskrav.png`, `12-jonas-aktivitet-narvaro-0h.png`, `13-jonas-tidslinje.png`, `11-sara-tidslinje.png`
*Fil:* `client/src/services/aktivitetslogg.ts` räknar allt med `present`/`external` och gör inget undantag för `activity_type === 'jobsearch_own'`, medan `components/consultant/AktivitetsplanSektion.tsx:443` särbehandlar just den typen. **Nytt.**

**RR2. Kommunens juridik syns för en R&M-leverantör.**
*Var:* Deltagare → Aktivitet, plus "Plan som PDF" och "Lämna underlag".
- Plan-PDF:ens rubrik är **"Individuell plan för aktivitet enligt socialtjänstlagen 12 kap."**. Sidfoten säger "Beslut om försörjningsstöd fattas av socialnämnden" och underskriftsraden gäller "Handläggare".
- Aktivitet-fliken har väljaren "Försörjningshinder" (Sjukskriven med läkarintyg, Sjuk- eller aktivitetsersättning …), "Underlag till handläggaren" och texten "Beslut om nedsättning fattas av socialnämnden, inte här".
- Underlagsdialogen säger "Räknas i IVO-underlaget för kvartalet".

Om den här PDF:en lämnas till en deltagare eller en AF-handläggare pekar den på fel lag och fel myndighet. Kundtypsstyrningen (`orgTypVisning`) finns redan, men den används bara i Rapporter.
*Belägg:* `44-planpdf-socialtjanstlagen.pdf`, `10-sara-aktivitet.png`, `41-underlag-socialnamnd-ivo.png`
*Fil:* `components/consultant/AktivitetsplanSektion.tsx`, `UnderlagDialog.tsx`, planens PDF-generator. `orgTypVisning.ts` används bara i `pages/consultant/AnalyticsTab.tsx:226`. **Nytt.** Kundtypsstyrningen kom 2026-09-27 men täcker inte deltagarsidan.

**RR3. Översikten säger "Inga brådskande punkter idag" om en deltagare som varken haft möte på 33 dagar eller klarat timkravet.**
*Var:* Översikt → Min dag och "Kräver uppmärksamhet".
Jonas Demo har rött chip i deltagarlistan ("Senaste möte 33 dagar sedan · inget fysiskt än"), har aldrig haft något fysiskt möte och ligger under timkravet och under 50 % fysiskt. Ändå listar "Kräver uppmärksamhet" bara "CV saknas" för Amina och Peter. Amina är dessutom anställd. Möteskadensen (RM3) och avtalskravet (RM4) syns alltså bara om jag själv går till rätt flik. Det är på Översikten jag börjar dagen.
*Belägg:* `01-oversikt.png`, `02-deltagarlista.png`, `23-oversikt-efter-bokning.png`
*Fil:* `pages/consultant/OverviewTab.tsx` ("Kräver uppmärksamhet" och Min dag). **Nytt.** RM3 byggde chipet bara i listan.

**RR4. "Genomsnittlig placeringstid: 1 dagar – Från start till jobb" mäter hur sent placeringen registrerades, inte tiden till jobb.**
*Var:* Rapporter, nyckeltalskortet.
Före min ändring stod det "1 dagar". Kohorttabellen på samma sida säger 69 dagar för samma placering (Amina). Sedan registrerade jag Saras placering med startdatum 19/10, och då blev snittet "11 dagar". Talet följer alltså startdatum minus registreringsdag, med golvet 1 (koden kommenterar själv "Simplified calculation"). Det är ett påhittat nyckeltal som följer med i Excel-exporten till uppdragsgivaren.
*Belägg:* `04-rapporter-avtalskrav.png` (1 dagar mot kohortens 69), `35-rapporter-placeringstid-11.png`, `45-excel-ar-tsv.xlsx`
*Fil:* `pages/consultant/AnalyticsTab.tsx:416–425`. **Nytt.**

---

## Viktigt (kostar tid, pengar eller förtroende)

**RR5. 3-månadersuppföljningen är en kryssruta utan datum, utfall eller underlag.**
*Var:* Rapporter → Placeringar → Amina → "3-månadersuppföljning gjord".
Kryssrutan gick att sätta 10 dagar före uppföljningspunkten. Det syns inte vem som gjorde uppföljningen, när den gjordes, om Amina fortfarande är anställd eller vilket underlag som finns (anställningsbevis eller lönespecifikation). "6-månadersuppföljning gjord" går att kryssa före 3-månaders. Uppföljningspunkten räknas som 90 dagar (9/7 → 7/10) och inte som tre kalendermånader (9/10). Resultatersättningen betalas ut efter 3 och 6 månader, så det här underlaget avgör om jag får betalt.
*Belägg:* `30-amina-uppfoljning-fore.png`, `31-amina-uppfoljning-kryssruta.png`
*Fil:* `pages/consultant/AnalyticsTab.tsx:1110–1130`, `pages/consultant/placeringsmatt.ts:52` (`FOLLOWUP_3M_DAYS = 90`). **Planerat** (RM1/NF3). Att det är en kryssruta utan tidsordning är **nytt**.

**RR6. Placeringen syns inte på deltagaren.**
*Var:* Aminas och Saras deltagarsidor.
Amina är anställd sedan 9/7, men hennes sida visar "Aktiv", "CV saknas" och ett tomt mål-kort. Varken placering, arbetsgivare eller uppföljning syns. Ingen av de fem flikarna nämner den, utom en journalanteckning i Tidslinjen. Efter att jag registrerat Saras placering står hon fortfarande kvar som "Aktiv" utan spår av placeringen. Placeringar finns bara som en lista längst ned i Rapporter.
*Belägg:* `14-amina-oversikt-ingen-placering.png`, `32-amina-sida-efter.png`, `34-sara-efter-placering.png`
*Fil:* `pages/consultant/ParticipantDetailPage.tsx`. **Nytt.**

**RR7. "Registrera placering" saknar R&M:s utfall.**
*Var:* Deltagarsida → Registrera placering.
De enda typerna är tillsvidare-, tidsbegränsad och provanställning. Det finns inget val för **studier**, som också ger resultatersättning, och inga fält för omfattning, slutdatum eller nivå A/B/C. En placering med startdatum om tre veckor räknas direkt i "Placeringar 2 · 50 % placeringsgrad".
*Belägg:* `33-sara-registrera-placering.png`, `35-rapporter-placeringstid-11.png`
*Fil:* `components/consultant/PlacementDialog.tsx:55–58`. **Planerat** (RM1/NF3). Att studier och omfattning saknas är **nytt**.

**RR8. Det finns ingen väg från aktivitetsloggen till den periodiska rapporten.**
*Var:* Rapporter → Excel och PDF-rapport.
Kortet har ingen export och ingen kopieringsknapp. Excel-filen innehåller bara nyckeltal: inga veckor, ingen fysisk andel, inga möten och inga avvikelser. Den är dessutom tabbseparerad text med ändelsen `.xlsx`, så Excel varnar eller vägrar öppna den. Samma fel är redan lagat i `BulkActionsDialog`. PDF-dialogen erbjuder "Konsultrapport" och "Nämndrapport (kvartal)" men ingen periodisk rapport. "Exportera rapport" på Översikt gav ingen nedladdning.
*Belägg:* `45-excel-ar-tsv.xlsx`, `43-pdf-namndrapport.png`, `04-rapporter-avtalskrav.png`
*Fil:* `pages/consultant/AnalyticsTab.tsx:596–602`, `components/consultant/ReportGeneratorDialog.tsx`. **Planerat** (RM6/NF2). TSV-felet i Rapporter är **nytt**. PDF-dialogen **kvarstår** från V1.

**RR9. Inställningar och rapporter talar kommunens språk.**
*Var:* Inställningar → Din organisation, och PDF-rapportdialogen.
När jag lägger till en kollega är rollerna "Handläggare (ekonomiskt bistånd)", "Arbetskonsulent" och "Chef". Platshållaren i e-postfältet är `@kommun.se`. Caseload-kolumnen heter "Ogiltig frånvaro 30 d", som är kommunens begrepp. Rapporttypen "Nämndrapport (kvartal)" visas för en leverantör.
*Belägg:* `07-installningar.png`, `43-pdf-namndrapport.png`
*Fil:* `components/consultant/OrganisationSektion.tsx:608`, `ReportGeneratorDialog.tsx`. **Nytt.**

**RR10. Saras praktik finns inte under Platser.**
*Var:* Platser jämfört med Saras Aktivitet-flik.
Platser säger "0 totalt · Inga platser registrerade än". Saras plan heter ändå "Praktik + jobbsökarträff" med pass på Demobageriet två gånger i veckan. Praktikplatsen finns bara som fritext i platsfältet. Formuläret "Ny plats" är fylligt: fysiska krav, handledning, och uppdelningen VAD/VARFÖR mot arbetsgivaren är riktigt bra. Men ingenting kopplar ihop plan, plats och placering.
*Belägg:* `03-platser-tom.png`, `10-sara-aktivitet.png`, `36-ny-plats-dialog.png`
*Fil:* `pages/consultant/PlatserTab.tsx`, `AktivitetsplanSektion.tsx`. **Nytt.**

**RR11. Mötesbokningen är inte anpassad efter mötesregeln.**
*Var:* Jonas Demo → Boka möte → deltagarlistan.
Mötestypen är förvald till **Video**, trots att Jonas Demo aldrig haft ett fysiskt möte och regeln kräver fysiskt. Efter att jag bokat ett fysiskt möte 30/9 är chipet i listan oförändrat rött ("33 dagar sedan · inget fysiskt än"), utan något "fysiskt möte bokat 30/9". Jag kan inte se att saken är omhändertagen, och kollegor kan det inte heller. Ingen bekräftelse syntes efter bokningen.
*Belägg:* `20-boka-mote-video-default.png`, `21-boka-mote-fysiskt.png`, `22-lista-efter-bokning.png`
*Fil:* `components/consultant/MeetingSchedulerDialog.tsx:74`, `services/moteskadens.ts`. **Nytt.**

**RR12. Konsultvyn på mobil (390 px) har tre problem.**
*Var:* Rapporter och Deltagare.
- Det klibbiga toppfältet lägger sig över Avtalskravskortet och döljer månadsväljaren.
- Tabellen är 602 px bred i 316 px och scrollar i sidled utan ledtråd, så kolumnen "Andel fysiska" syns inte.
- Mötes-chipet klipps ("inget fysiskt ä…"). Bottennavigeringen är deltagarens (Söka jobb, Karriär, Din vardag).

Ingen sida scrollar horisontellt som helhet (scrollWidth 390).
*Belägg:* `55-mobil-avtalskrav-kort.png`, `52-mobil-rapporter.png`, `51-mobil-deltagare.png`
*Fil:* `components/consultant/AvtalskravKort.tsx`, `components/layout/HubBottomNav.tsx`. Bottennavigeringen **kvarstår** från V8. Tabellen och överlappet är **nya**.

---

## Skav

- **RR13.** "Möten denna vecka: 2" räknar mötena 29/9 och 30/9, men i dag är det söndag 27/9 och de mötena ligger i nästa vecka. Belägg: `23-oversikt-efter-bokning.png`. `OverviewTab.tsx`. **Nytt.**
- **RR14.** Deltagarhuvudet visar ett grönt "4 / Senaste kontakt" utan enhet, medan listan visar rött för 33 dagar sedan senaste möte. Två fakta som ser motsägelsefulla ut. Belägg: `24-jonas-huvud-senaste-kontakt.png`. `ParticipantDetailPage.tsx:~880`. **Kvarstår** (S2/V10).
- **RR15.** Journalvarningen säger "Skriv inget du inte kan stå för att **hon** läser", också på Jonas. Belägg: `40-journal-hon.png`. `ParticipantJournal.tsx`. **Nytt.**
- **RR16.** Språkfel: "1 dagar" (Rapporter), "1 timmar per vecka" (plan-PDF), "CV uppdaterat 27 sep.." (dubbelpunkt, Aktivitet). Belägg: `04-…`, `44-…pdf`, `10-sara-aktivitet.png`. **Nytt.**
- **RR17.** Resurser → Målmallar säger "Inga mallar matchade din sökning" utan att jag sökt, medan dialogen "Skapa mål" visar fem mallar. Belägg: `06-resurser-malmallar-tom.png`, `42-mal-dialog.png`. `ResourcesTab.tsx`. **Nytt.**
- **RR18.** Kommunikation: "Snabbmeddelanden" står lösa under en tom lista. Belägg: `05-kommunikation.png`. **Kvarstår** (S4).
- **RR19.** Mörkt läge, Aktivitet: etiketten "Underlag till handläggaren" krockar med Försörjningshinder-väljaren, och "Avsluta plan" har mycket låg kontrast. Belägg: `61-mork-sara-aktivitet.png`. **Nytt.**
- **RR20.** Aminas Översikt har rubriken "Aktiva mål · Se alla" men ett tomt kort utan tomläge och utan invit. Belägg: `14-amina-oversikt-ingen-placering.png`. **Nytt.**
- **RR21.** På mobil ligger deltagarens krisknapp ("Du är inte ensam", Självmordslinjen) i konsultens toppfält. Den är rätt för deltagaren men är brus i mitt arbetsverktyg. Belägg: `54-mobil-krisdialog-i-konsultvy.png`. **Nytt.**
- **RR22.** "Avslutade veckor 1–27 september" bedömer innevarande vecka (21–27/9) som avslutad redan på söndagen. Belägg: `04-rapporter-avtalskrav.png`. `aktivitetslogg.ts`. **Nytt.**
- **RR23.** Mötes-chipet förklarar inte regeln. Sara är gul vid 12 dagar, eftersom RM3 räknar 14 dagar för individuellt möte och 28 för fysiskt. Samma möte visas som "12 dagar sedan" och "fysiskt 1 v sedan". Min egen bild av kravet var "var fjärde vecka", så jag behöver regeln i en tooltip. Belägg: `02-deltagarlista.png`. `moteskadens.ts`. **Nytt.**

---

## Förslag på utveckling (det jag skulle betala för)

- **RR24. MSFA-vy per deltagare och period.** Samma ordning som i Mina sidor för fristående aktörer: timmar per vecka, fysisk andel, möten med datum och typ, avvikelser. Kopieringsknapp per fält och en markering "förd till MSFA 2026-10-05 av Jonas". Då blir disclaimern ett arbetsflöde. **Planerat** (NF2/RM6). Det här preciserar formen.
- **RR25. Resultatklockan på deltagarsidan.** Nivå A/B/C, placeringsstart, 3- och 6-månaderspunkter i kalendermånader, uppladdat underlag (anställningsbevis eller lönespec), status väntar/verifierad/fakturerad och belopp enligt FFU §5.1. Deltagaren byter status till "Placerad" när placeringen registreras. **Planerat** (NF3/RM1).
- **RR26. "Min vecka mot avtalet" som startvy.** "2 deltagare under timkravet · 1 utan fysiskt möte · 1 uppföljning inom 14 dagar", där varje rad leder direkt till åtgärden (boka fysiskt, ring, registrera uppföljning). Ersätter "Inga brådskande punkter". **Nytt.**
- **RR27. Pass märkta leverantörsledd/egen och fysisk/digital.** Två flaggor per pass, så att loggen räknar rätt (RR1) och 50 %-andelen blir ett faktum och inte en gissning utifrån platsfältet. Kräver migration. **Kvarstår** (RM4 `is_physical`).
- **RR28. R&M-variant av underlaget.** Ersätt "Underlag till handläggaren / socialnämnden" med en avvikelserapport till AF-handläggaren enligt FFU §4.4: datum, typ, orsak och om AF underrättats. Då kan leverantörer använda samma kodväg utan kommunens ord. **Nytt** (relaterat till RM2).
- **RR29. Kapacitetsmätare i Caseload.** Deltagare per handledare mot taket 50 per heltid (FFU §4.5.2), proportionellt vid deltid. **Planerat** (RM5).

## Det här kunde jag inte pröva

- **PDF-rapportens förhandsgranskning och nedladdning.** Dialogen öppnades, men jag klickade inte vidare genom förhandsgranskningen.
- **Skicka meddelanden och inbjudningar.** Inga utskick, enligt gränserna.
- **AI-rapportutkast.** Avstängt för organisationen, vilket UI:t säger ärligt.
- **Om det bokade mötet syns i deltagarens egen vy.** Jag loggade bara in som coach.
