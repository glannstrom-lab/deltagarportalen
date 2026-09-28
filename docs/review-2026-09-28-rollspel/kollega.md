# Rollspel: "Kim Kollega" (nyanställd arbetskonsulent) och "Hanna Handläggare" (försörjningsstöd) — prod 2026-09-28

Konton: `kim.kollega.demo@example.com` (Arbetskonsulent, mobil 390×844) och `hanna.handlaggare.demo@example.com`
(Handläggare ekonomiskt bistånd, dator 1366×900), båda i "Demokommun (påhittade personer)", inloggade via
engångslänk (`/#/visa-som`). Skript: `e2e/rollspel-2026-09-28-kollega-kim-*.cjs`, `-hanna-*.cjs` (se scratchpad,
kopior kan återskapas ur denna rapport). Belägg: `kollega/m-NN-namn.png` (Kim, mobil), `kollega/d-NN-namn.png`
(Hanna, dator). `kollega/natverk.txt` fanns inte efter körningen — noll nätverksfel ≥400 i hela passet.

**Muterat i demon (nollställs i natt), bara Sara Påhitt:** en aktivitetsplan tillämpad ur "Demomall: jobbsökning +
motivation" (28/9–20/12, 11 h/vecka, deltid, motivering till avvikelsen ifylld), närvaro markerad på måndagens
Jobbsökarverkstad, en journalanteckning, ett mål ("Skicka 10 ansökningar per vecka"), och ett lämnat underlag till
"Hanna Handläggare, ekonomiskt bistånd" för perioden 1–28 september. Erik Testsson rördes inte — han hör till
"Demo Konsulent"s caseload och var inte nåbar från vare sig Kims eller Hannas konto (se KH1/KH4). Ingen AI, inga
mejl.

## Helhetsintryck

**Kim (arbetskonsulent, första veckan):** När det väl går, går det bra — att markera närvaro är ett klick, journalen
känns rätt (jag ser att det är *min* anteckning, och att Sara kan läsa den), och att lämna underlag till Hanna tog
under en minut. Men vägen dit var inte självklar: Sara hade ingen aktivitetsplan alls, bara en gammal
journalanteckning, så mitt första riktiga jobb var att skapa en plan från grunden — och när jag klickade "Skapa
plan" hände ingenting, tre gånger, utan felmeddelande jag såg. Och när jag letade hjälp för mig själv fick jag
CV-tips för deltagare.

**Hanna (handläggare, försörjningsstöd):** Jag loggade in för att se vad Kim lämnat till mig och landade på exakt
samma sida som en konsulent utan en enda deltagare skulle se: "0 deltagare", "Bjud in din första deltagare",
"Inga mål satta än". Jag klickade mig igenom varje flik — Deltagare, Platser, Rapporter, Kommunikation — och alla
sa samma sak: tomt, och alla uppmanade mig att göra saker som inte är mitt jobb. Det enda stället där "Handläggare
(ekonomiskt bistånd)" ens nämns är under Inställningar → Din organisation. Jag hittade aldrig underlaget Kim
lämnade. Om jag var en riktig handläggare hade jag ringt henne.

**De 3 viktigaste:**
1. **Hanna har ingen väg alls till det underlag konsulenten lämnar** (KH1) — samma tomma konsulentvy som en
   nyanställd utan deltagare, på varje flik, inklusive den som är byggd just för aktivitetskravet.
2. **Underlagets mottagare är fri text, inte en riktig koppling** (KH2) — även om Hanna fick en läsvy i morgon
   skulle dagens underlag inte hitta dit, för det finns ingen länk mellan handovern och hennes konto.
3. **"Skapa plan" kan misslyckas helt tyst** (KH5) — ingen toast, ingen scroll till felet, bara ett dött klick, på
   den allra första uppgift en ny konsulent gör för en deltagare utan plan.

## Tidsåtgång / friktion

| Uppgift (Kim) | Tid/klick | Kommentar |
|---|---|---|
| Hitta sina två deltagare | 2 klick, ~2 s | Deltagarfliken, tydlig lista |
| Skapa plan åt en deltagare utan plan | **3 misslyckade klick + felsökning, flera minuter** | Se KH5 — validering syns inte |
| Markera närvaro på dagens pass | 1 klick | Direkt, ingen bekräftelsedialog behövs |
| Skriva journalanteckning | ~15 s | Ny anteckning → skriv → Spara |
| Sätta ett mål | ~10 s | Mall-kort → Skapa mål |
| Lämna underlag + ladda ner PDF | ~15 s | Mottagare (fritext) → Lämna underlag → Ladda ner |
| Hitta hjälp för sin egen roll | **Hittade aldrig** | Hjälp-sidan är 100 % deltagarinnehåll (KH6) |

| Uppgift (Hanna) | Tid/klick | Kommentar |
|---|---|---|
| Se om något underlag väntar | **Omöjligt** | 5 flikar avsökta, alla tomma, ingen leder till underlaget |
| Förstå sin egen roll i appen | 3 klick (Inställningar → Din organisation) | Enda stället rollen syns |
| Hitta Erik Testsson (annan konsulents deltagare) | **Omöjligt** | Deltagarlistan filtreras på `consultant_id = mitt konto` |

## Kritiskt

**KH1. Handläggaren har ingen väg till underlaget — varje flik visar samma tomma konsulentvy.** · nytt
Var: Hanna, dator, alla flikar efter inloggning. Översikt: "Totalt deltagare 0 · 0 aktiva", "Alla deltagare följs
upp!", "Ingen aktivitet ännu". Deltagare: "Inga deltagare ännu — Du har inte tilldelat några deltagare ännu — Bjud
in din första deltagare". Platser: "Platserna samlas här — Lägg först till en deltagare". Rapporter (byggd just
för aktivitetskravet, RK8/RK34 2026-09-27): "Totalt deltagare 0", "Inga anvisade planer i kvartalet — underlaget
visar –", "Ingen plan i månaden" i välj-deltagare-listan för månadsunderlaget. Kommunikation: "Inga meddelanden".
Orsak: `useConsultantParticipants()` frågar `consultant_dashboard_participants` filtrerat på
`.eq('consultant_id', user.id)` — samma nyckel alla fem flikar delar (KK4-kommentaren i filen säger uttryckligen
"en nyckel, en form, en ägare"). Ingen deltagare är någonsin tilldelad *till en handläggare* (seedfunktionen
`seed_demo_org` sätter aldrig `consultant_participants.consultant_id = Hannas id`), så frågan är strukturellt
tom för varje konto med rollen `handlaggare` — inte bara i demon.
Belägg: `kollega/d-01-landning.png`, `d-02-deltagare.png`, `d-03-rapporter.png`, `d-07-platser.png`,
`d-13-kommunikation-flik.png`. Kod: `client/src/pages/consultant/consultantParticipantsQuery.ts:41-49`.

**KH2. Underlagets mottagarfält är fri text — det finns ingen koppling till handläggarens konto.** · nytt
Var: Kim → Lämna underlag → fältet "Mottagare" är ett vanligt textfält (`sara.pahitt@example.com`-liknande, ingen
autokomplettering mot organisationens medlemmar). Jag skrev "Hanna Handläggare, ekonomiskt bistånd" för hand.
Även om Hanna i morgon fick en riktig läsvy (RK34-rest) skulle den behöva matcha på fri text för att hitta det
underlag jag just lämnade — det finns inget `recipient_user_id`, bara en sträng. Rollen "Handläggare (ekonomiskt
bistånd)" finns redan som organisationsmedlem (KH1 visar att kopplingen till kön saknas, det här visar att kopplingen
till *raden* också saknas).
Belägg: `kollega/m-32-underlag-dialog.png`, `m-35-efter-underlag-lamnat-flik.png` ("Lämnat 28 september 2026 till
Hanna Handläggare, ekonomiskt bistånd" som fri text). Kod: `client/src/components/consultant/UnderlagDialog.tsx`
(mottagare-fältet), `client/src/services/aktivitetApi.ts:817,830,914-924` (`recipient: string`).

## Viktigt

**KH3. Ingen mejl, ingen notis, ingen indikator — leveransen av underlaget är 100 % ett telefonsamtal.** · nytt
Dialogen säger det rakt ut: "Ladda ner det som PDF och skicka det till handläggaren på det sätt ni brukar —
Jobin skickar det inte själv." Jag letade i Kommunikation och på klockikonen i toppmenyn hos Hanna — ingen notis,
inget meddelande, ingen räknare. Kims enda spår av att något lämnats är raden under planen ("Lämnat 28 september
2026 till Hanna Handläggare…"). Svaret på uppdragets fråga — vad Hanna behöver för att slippa ringa konsulenten —
är: hela kedjan mellan "Lämna underlag" och att Hanna vet att något väntar.
Belägg: `kollega/m-34-underlag-lamnat.png`, `d-14-notiser.png` (ingen notis), `d-13-kommunikation-flik.png`.
Kod: `client/src/components/consultant/UnderlagDialog.tsx:2-17` (docstring säger det själv).

**KH4. Handläggaren (och konsulenten) når bara sin egen tilldelade caseload — aldrig organisationens.** · nytt
Var: Hanna kan inte se Erik Testsson, Anna, Omar, Lisa eller Fatima — de är tilldelade "Demo Konsulent", inte
henne. Kim ser bara sina två (Sara, Johan). Det är rätt för en konsulent (en caseload ska vara privat), men fel
för en roll vars hela jobb är att ta emot underlag *från flera konsulenter*. En handläggare i en kommun handlägger
inte bara en konsulents ärenden.
Belägg: `kollega/m-40-rapporter.png` ("Totalt deltagare 2" — Kims egen caseload, inte kommunens), `d-03-rapporter.png`
("Totalt deltagare 0" — Hannas). Kod: samma som KH1, `consultantParticipantsQuery.ts:41-49`.

**KH5. "Skapa plan" ger inget synligt tecken när det misslyckas — knappen ser död ut.** · nytt
Var: Kim → Sara → Aktivitet → Tillämpa schemamall → fyll i formuläret (allt förifyllt korrekt) → Skapa plan.
Dialogen ligger kvar, identisk, inga färgade fält, ingen toast, ingen scroll. Orsaken: mallen "Demomall: jobbsökning
+ motivation" ger ett veckomål på 11 h, lagens förslag är 40 h → fältet "avviker", vilket kräver en
"Motivering till avvikelsen" — ett textfält som ligger längre ned i en dialog med egen intern scroll
(`overflow-y-auto`, `max-h-[90vh]`), så det syns inte i den del av formuläret man ser efter att ha fyllt i de
översta fälten. Klicket sätter `forsokt = true` och stannar i `skapa()` (`if (harFel || !mall) return`) — utan
någon `role="alert"`-sammanfattning högst upp eller autoscroll till första felet. Jag klickade tre gånger innan jag
förstod att något krävdes längre ned. En nyanställd utan kod att läsa hade inte vetat varför.
Belägg: `kollega/m-16-efter-klick.png` (dialogen oförändrad efter klick), `m-20-dialog-efter-klick-diagnos.png`
(hela dialogtexten, "Motivera varför målet avviker från lagens förslag" syns bara vid scroll).
Kod: `client/src/components/consultant/TillampaMallDialog.tsx:98-105` (`fel`-objektet), `:117-119` (`skapa()`
returnerar tyst vid `harFel`), `:224-234` (motiveringsfältet visas bara när `avviker`).

**KH6. Hjälp-sidan för en konsulent är samma sida som för en deltagare — inget om konsulentens egna uppgifter.** · nytt
Var: Kim öppnar hamburgermenyn → Hjälp. Sidan (`Hjälp & Support`) visar Kunskapsbank/Intresseguide/Skapa CV/Sök jobb
och FAQ om CV-versioner, ATS-analys, jobbsökning och Intresseguiden — allt för en arbetssökande. Ingenting om hur
man markerar närvaro, skriver journal enligt SoL, tillämpar en schemamall eller lämnar underlag. "Hittade du inte
svaret? Kontakta din arbetskonsulent" — riktat till en deltagare, inte till konsulenten själv. `Help.tsx` (204
rader) har ingen rollgrening alls; samma sida renderas oavsett `profile.role`.
Belägg: `kollega/m-38-hjalpsida.png`. Kod: `client/src/pages/Help.tsx` (ingen förekomst av `CONSULTANT`/`role`).

## Skav

**KH7.** Mobilnavigeringen har två parallella flikrader med identiska etiketter samtidigt: en horisontell rad direkt
under bannern (Översikt/Deltagare/Platser/Rapporter/Kommunikation) och en fast raden längst ned på skärmen med
samma fem. Ingen av dem är bara för scroll-positionering — båda är klickbara, båda pekar på samma flikar. På 390 px
bredd äter den övre raden skärmyta som den nedre redan ger. · nytt. `kollega/m-01-landning.png`.

**KH8.** `?tab=settings` i URL:en gör ingenting — en direktnavigering till `/#/consultant?tab=settings` landar på
Översikt, för både Kim och Hanna. Att dela eller bokmärka en specifik flik i konsultvyn går inte. · nytt.
`kollega/d-06-installningar.png` (samma som `d-01-landning.png` trots query-parametern).

**KH9.** Ny mål-dialogen förvalde redan "Jobbsökning · Skicka 10 ansökningar per vecka" med grön kantmarkering innan
jag klickade något — ser ut som ett redan valt mål, men kräver ändå ett klick till för att bekräfta. Lätt att missa
att ett andra steg krävs. · nytt. `kollega/m-29-mal-dialog.png`.

**KH10.** Kims sidoflik "Rapporter" saknar all kontext om att siffrorna bara gäller hennes egna två deltagare —
"Totalt deltagare 2" ser ut som hela kommunens underlag, inte en persons caseload. Samma etikett som Hannas
identiska men tomma sida. · nytt. `kollega/m-40-rapporter.png`, `d-03-rapporter.png`.

## Förslag på utveckling

**KH11. Bygg handläggarens läsvy (RK34-rest), och koppla den till verkliga underlag — inte bara till UI.**
Konkret: (a) ett underlagsflöde där "Mottagare" väljs bland organisationens `handlaggare`-medlemmar
(dropdown, med fri text som reserv för externa mottagare), så `activity_plan_handovers` får ett riktigt
`recipient_user_id`; (b) en egen startsida för rollen `handlaggare` — "Mottagna underlag", filtrerad på org och
`recipient_user_id = mitt konto`, med period, deltagare, konsulent, PDF-länk och kvittensstatus; (c) dölj eller
byt ut de konsulent-specifika flikarna (Bjud in deltagare, Skapa mål, Deltagare-CTA:n "Bjud in din första
deltagare") för den rollen. Värde: i dag existerar ingen digital väg mellan konsulent och handläggare — allt går
via telefon/mejl utanför portalen, vilket är precis det uppdraget skulle mäta. Storlek: 2–4 dagar (databasändring
+ ny vy + rollgrenad routing).

**KH12. Ge validering av formulär en synlig konsekvens vid submit.** Ett generellt mönster (gäller sannolikt fler
dialoger än TillampaMallDialog): när ett klick på en primärknapp inte kan fullfölja på grund av
klientvalidering, visa en sammanfattning ("3 fält behöver fyllas i") och scrolla till det första felfältet.
Värde: en förstaveckans-konsulent tappar annars förtroende för hela plan-flödet efter tre döda klick. Storlek:
0,5–1 dag för TillampaMallDialog; mönstret kan brytas ut till en delad hjälpfunktion för fler dialoger.

**KH13. Rollmedveten Hjälp-sida.** Filtrera `Help.tsx`-innehållet (eller gör en separat väg) på `profile.role`:
konsulent/kollega/handläggare ska se hur man tar över en deltagare, markerar närvaro, skriver journal enligt SoL
och lämnar underlag — inte CV-tips. Värde: direkt svar på "var finns hjälp/instruktioner", som en nyanställd
konsulent i dag inte har något svar på alls. Storlek: 1–2 dagar för ett första konsulentavsnitt.

**KH14. Ta bort den dubbla mobilnavigeringen.** En flikrad räcker — antingen den övre eller den fasta nedre, inte
båda samtidigt. Värde: mer synligt innehåll på en 390 px-skärm, mindre risk att användaren tvekar mellan två
identiska kontroller. Storlek: någon timme.

## Vad jag inte prövade

- Hannas väg om ett underlagspaket redan hade legat där (rollen har inte existerat tillräckligt länge för att
  ha historik före denna omgång — Sara var Hannas första och enda mottagna underlag i denna körning).
- Skicka meddelande/gruppmeddelande — avsiktligt (inga mejl).
- Skärmläsare eller tangentbordsnavigering rakt av — bara visuell och muskontroll denna gång; se
  `docs/review-2026-09-27-rollspel/konsulent.md` RK5 för en tidigare tangentbordsgranskning av samma flikmönster.
- Kims mobila upplevelse av att *ta emot* en överlämning från en kollega (inget sådant flöde triggades i denna
  omgång eftersom Sara redan var tilldelad Kim av seeden).
