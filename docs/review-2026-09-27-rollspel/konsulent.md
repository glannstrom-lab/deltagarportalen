# Rollspel: "Karin", arbetskonsulent på en kommuns arbetsmarknadsenhet — prod 2026-09-27

Konto: `demo@jobin.se` (chef i "Demokommun (påhittade personer)", 5 fiktiva deltagare), inloggad via engångslänk (`/#/visa-som`).
Skript: `e2e/rollspel-2026-09-27-konsulent-login.cjs` (inloggning, sparar session), `-tur.cjs` (rundtur per vy, 1366/390, ljust/mörkt),
`-utforska.cjs` (en deltagares flikar), `-steg.cjs` (kör en stegfil: närvaro, plan, underlag, journal, möte, mål, exporter).
Belägg: `konsulent/NN-namn.png` (plus `D0x_*.txt` = sidtext vid rundturen). Förra rundan: `docs/review-2026-09-12-persona/konsulent.md`.

**Muterat i demon (nollställs i natt):** Anna — ett pass fre 25/9 "Studiebesök Returbutiken" (ogiltig frånvaro), tis 22/9 sjuk (utan intyg),
tors 24/9 giltig frånvaro, en Oro-anteckning, ett fysiskt möte tis 29/9 10:00, ett "lämnat underlag" till "Handläggare Test".
Omar — aktivitetsplan ur "Demomall" 28/9–20/12. Lisa — mål "Börja SFI-kurs D". Försök att lägga till `karins.kollega@example.com` som kollega (avvisades).
Inga mejl, AI-brytaren orörd. **Obs:** en annan agent spelade samtidigt Anna (söndagspasset 08–17 "Checkade in 16:10" är hennes, inte seed).

## Helhetsintryck (Karin)

Det här har blivit ett verktyg jag faktiskt skulle kunna jobba i: Dagens pass på startsidan, närvaro med fem utfall, plan-PDF med
underskriftsrader, "Lämna underlag" med mottagare och IVO-tabellen per försörjningshinder är precis det aktivitetskravet kräver — och
det mesta från förra rundan är rättat. Men siffrorna jag skulle lämna till handläggaren kan inte litas på än: veckoampeln säger "Under
veckomålet" för en deltagare med full närvaro, underlaget kallar sjukfrånvaro utan intyg för "sjuk med intyg", och en anteckning om
frånvaron kan försvinna utan att jag märker det. Innan vi köper vill jag se att det som går till socialnämnden stämmer med det jag markerat.

**De 3 viktigaste:**
1. **Underlaget till handläggaren/nämnden säger fel om sjukfrånvaro** (RK3) — "sjuk med intyg" fast intyg inte inkommit.
2. **Veckomålet går inte ihop** (RK1, RK2) — ampeln kan aldrig bli grön när målet inkluderar eget jobbsökande, och en ny plan ur mall får 40 h mål mot 8 h schema utan varning — på ett dokument för underskrift.
3. **Passanteckningen försvinner tyst** (RK4) om den skrivs efter markeringen — dokumentationen av ogiltig frånvaro är just den som behövs.

Antal fynd: **Kritiskt 5 · Viktigt 14 · Skav 13 · Förslag 9.**

## Rättat sedan 2026-09-12 (verifierat i dag)

| Förra | Nu |
|---|---|
| K1 påhittade målstaplar | Staplarna bygger på riktiga mål (men se RK24) |
| K2 AI-insikter fel varje gång | Inget fel längre (men se RK12) |
| V1 PDF-rapport utan nedladdning | Dialog → Förhandsgranska → "Ladda ner PDF" fungerar; `namndrapport-2026-Q3.pdf` och `konsultrapport-…pdf` hämtade (men se RK10, RK19) |
| V2 Tidslinjen var ett löfte | Byggd: möten, journal, mål, platser, pass i tidsordning (37) |
| V3 sju fält för ett mål | Titel + deadline räcker, SMART är valfri utfällning (27, 29) |
| V4 mål gick inte att ta bort | Menyn "Åtgärder för mål" → Ta bort mål (28) |
| V5 tom aktivitetskatalog | Fylld (39) |
| V6 "kommande"-löften | Projekt- och notisblocken borta (49) |
| V7 AI-brytare saknades | "AI-funktioner för era deltagare — Av / Slå på AI" i Din organisation (49) |
| S1, S5, S7 | "0 0" borta på Platser; bara Stockholm som tidszon; underlaget visar "Lämnat 27 september till … · av dig · Period" (22) |
| S3 sektionsknappar utan semantik | `tablist`/`tab`/`aria-selected` finns — men tangentbordet bröts, se RK5 |
| Förslag 1, 2, 4, 7 | Dagens pass, underlagsflöde, enkelt mål, tidslinje — alla byggda |

## Tidsåtgång (maskinmätt, Playwright mot prod)

Lägga till ett pass: 2,8 s efter "Lägg till". Markera närvaro: 2,8 s (två klick). Plan ur mall för Omar: 5,3 s från dialog till färdig plan
inkl. ifyllning (48 pass genereras). Journal: 2,2 s. Mål: 2,7 s. Rapporter laddar på 1,5–3,5 s (inte 30 s). För en människa: ett pass +
tre frånvaromarkeringar + underlag ≈ 3–4 minuter — snabbt nog. Det som kostar tid är att **kontrollera** att siffrorna stämmer (se nedan).

---

## Kritiskt (fel, lögn eller blockerar arbetet)

**RK1. Veckoampeln kan aldrig bli grön när veckomålet inkluderar eget jobbsökande.** · nytt
Var: Anna → Aktivitet, vecka 21–27 sep. Före mina ändringar: närvarande på alla fyra anvisade pass (8 h), 12 h eget jobbsökande, veckomål 11 h
(= 8 h anvisat + 3 h eget enligt planen) → chippet "Under veckomålet". `veckoampel()` jämför bara närvaro i anvisade pass med ett veckomål
som inkluderar eget jobbsökande, så en plan byggd så kan aldrig nå "På veckomålet" hur väl deltagaren än sköter sig. Konsulenten läser
chippet som ett kvitto till handläggaren.
Belägg: `10-anna-aktivitet-vecka.png`. Kod: `client/src/services/aktivitetSchema.ts:288` (`veckoampel`) + `:241` (jobsearch_own hoppas över).

**RK2. Plan ur schemamall: veckomålet förifylls 40 h mot mallens 8 h anvisat — utan varning, och så står det på underskriftsdokumentet.** · nytt
Var: Omar → Aktivitet → Tillämpa schemamall. Mallen heter "Demomall … · 11 h/vecka", fältet Veckomål står på 40 ("Förslag enligt lagen").
Planen skapas utan fråga; nästa vecka visar "Planerat 8 h / 40 h". Plan-PDF:en ("Individuell plan för aktivitet enligt socialtjänstlagen
12 kap.", med underskriftsrader) säger "Veckomål 40 timmar", "Motivering till veckomålet -" och längst ned "Planerad anvisad aktivitet: 8 timmar
per vecka". Dessutom: jag angav eget jobbsökande 5 h/vecka, schemat innehåller 3 h — PDF:en säger 5.
Belägg: `15-omar-tillampa-schemamall.png`, `16-omar-mall-ifylld.png`, `18-omar-nasta-vecka-8av40.png`, `19-pdf-plan-omar.png`.
Kod: trolig `client/src/components/consultant/AktivitetsplanSektion.tsx` (tillämpa-dialogen).

**RK3. Underlag och nämndrapport räknar all sjukfrånvaro som "sjuk med intyg".** · nytt
Var: Anna → tisdag 22/9 → Sjuk, rutan "Läkarintyg inkommet" **inte** ikryssad (14). "Lämna underlag" sammanfattar sedan
"1 sjuk med intyg" (21). Nämndrapporten lägger samma pass under "Anmäld frånvaro" (= "giltig frånvaro/sjuk med intyg") (32).
Det är det dokument handläggaren och nämnden fattar beslut på.
Belägg: `14-efter-omladdning-anteckning-borta.png` (intyg ej ikryssat), `21-underlag-sjuk-med-intyg.png`, `32-pdf-namndrapport.png`.
Kod: `client/src/services/aktivitetApi.ts:678` (räknar `sick_certified` oavsett `sick_certificate_received`), `sv.json:7569`
(`sammanfattningRad` "sjuk med intyg"), `client/src/services/namndrapportPdf.ts:58` (`GILTIG` innehåller `sick_certified`).

**RK4. En passanteckning som skrivs efter markeringen försvinner tyst.** · nytt
Var: Anna → torsdag 24/9 → Närvaro → Giltig frånvaro → skriv "Tandläkare, anmält i förväg per telefon." → stäng panelen. Texten står kvar i
rutan (13) — efter omladdning är den tom (14). Platshållaren säger "Sparas med nästa markering", men ingenting varnar när man lämnar
panelen med osparad text. Anteckning skriven *före* markeringen (tisdag, "Ringde in sjuk 08:15.") sparades. Ogiltig frånvaro kräver
ingen anteckning alls.
Belägg: `13-anteckning-skriven-efter-markering.png`, `14-efter-omladdning-anteckning-borta.png`.
Kod: `client/src/components/consultant/AktivitetsplanSektion.tsx` ~rad 445–455 (anteckningen följer bara med `markera()`).

**RK5. Flikarna Aktivitet, Mål, Journal och Tidslinje går inte att nå med tangentbordet.** · nytt (följd av rättelsen av S3)
Var: deltagardetalj. 45 × Tab: bara fliken "Översikt" får fokus; pil höger flyttar varken fokus eller val. Övriga flikar har
`tabIndex=-1` och det finns ingen `onKeyDown`. WCAG 2.1.1 — hela aktivitetskravsflödet är stängt för den som inte kan använda mus.
Belägg: `46-tangentbord-flikar.png`, `46b-tangentbord-tabbordning.png`. Kod: `client/src/pages/consultant/ParticipantDetailPage.tsx:918`.

## Viktigt (kostar tid eller förtroende)

**RK6. På söndagar visar "Möten denna vecka" nästa veckas möten, och Min dag missar dagens.** · nytt
Var: Översikt i dag (söndag 27/9): "Möten denna vecka 3" — mötena ligger 28/9 och 29/9 (varav mitt nybokade), alltså nästa vecka.
`startOfWeek = idag − getDay() + 1` ger måndagen *efter* när `getDay()` är 0.
Belägg: `41-oversikt-efter-ogiltig-franvaro.png`, `38-kommunikation-moten.png`. Kod: `client/src/pages/consultant/OverviewTab.tsx` ~rad 329–340.

**RK7. Ogiltig frånvaro syns inte på Översikt.** · nytt
Var: efter att Anna fått ogiltig frånvaro (och Rapporter/caseload räknar 2 på 30 d): Min dag "Inga brådskande punkter idag", Kräver
uppmärksamhet listar bara "CV saknas" (Erik, Fatima). Under aktivitetskravet är ogiltig frånvaro den viktigaste morgonsignalen.
Belägg: `41-oversikt-efter-ogiltig-franvaro.png`, `49-installningar.png` (caseload "Ogiltig frånvaro 30 d: 2").

**RK8. "Lämna underlag" skapar ingen handling att lämna.** · nytt
Var: Anna → Lämna underlag → "Markera som lämnat". Det blir en rad "Lämnat 27 september till Handläggare Test…" men ingen PDF, ingen utskrift,
inget som når handläggaren. Händelsen syns inte heller i Tidslinjen.
Belägg: `20-lamna-underlag-dialog-omar.png`, `22-underlag-lamnat.png`, `37-tidslinje.png`.

**RK9. "Excel" på Rapporter är tabbseparerad text med ändelsen .xlsx.** · nytt
364 byte UTF-8-text; Excel varnar/vägrar. Samma fel är rättat i `deltagarExport.ts` och `BulkActionsDialog.tsx` — men inte här.
Belägg: `35-excel-ar-tsv.png`, `35-excel-ar-tsv-konsultrapport-2026-09-27.xlsx`. Kod: `client/src/pages/consultant/AnalyticsTab.tsx:602`.

**RK10. PDF-förhandsgranskningen är alltid tom.** · nytt
Konsolen: "Framing '' violates … default-src 'self' … 'frame-src' was not explicitly set". CSP i `client/vercel.json` saknar `frame-src`
för blob-URL:en i `ReportGeneratorDialog.tsx:488`. Nedladdningen fungerar, så man laddar ner blint.
Belägg: `31-pdf-forhandsgranskning-tom.png`.

**RK11. Konsultrapport-PDF:en ljuger med nollor.** · kvarstår (samma klass som 2026-08-09-lärdomen)
"Genomsnittlig placeringstid: 0 dagar" och kohort "Snitt tid 0" (UI säger "–, Inga placeringar än"); "Framsteg över tid: Sep 0%" när
snitt-CV är 70 %; "Engagemang 100%"; avsändare "Konsulent" i stället för namnet.
Belägg: `33-pdf-konsultrapport-s1.png`, `34-pdf-konsultrapport-s2.png`, `D04_consultant_analytics.png`.

**RK12. Rapporter → "AI-insikter: Inga insikter just nu. Alla deltagare ser bra ut!"** · nytt (ersätter K2)
AI är avstängt för organisationen, fliken bredvid heter "Risker (2)" och Översikt säger "Kräver uppmärksamhet 2".
Belägg: `D04_consultant_analytics.png`, `49-installningar.png`. Kod: trolig `client/src/services/consultantInsights.ts`.

**RK13. Rapporter → Placeringar: "Inga placeringar registrerade än. Klicka på 'Registrera placering' högst upp".** · nytt
Ingen sådan knapp finns på Rapporter, och Platser visar 2 platser (Anna, arbetsträning pågående). "Placering" och "plats" är två begrepp för samma sak.
Belägg: `D04_consultant_analytics.png`, `D03_consultant_platser.png`.

**RK14. "Senaste kontakt: 3" — ett tal utan enhet, som inte rör sig.** · kvarstår (V10-familjen)
Efter Oro-anteckning och bokat möte i dag står det fortfarande 3. Dagar? Kontakter?
Belägg: `10-anna-aktivitet-vecka.png`, `42-morkt-oversikt.png`. Kod: `ParticipantDetailPage.tsx:878–887`.

**RK15. Deltagarens egenrapporterade pass räknas utan kvittens, och vyerna behandlar det olika.** · nytt
Annas söndagspass 08–17 "Eget jobbsökande" (9 h, egen redovisning) lyfter veckans "Eget jobbsökande" till 12 h. Detaljsidan ger ingen
närvaroknapp för det ("Egen redovisning"), men Min dag erbjuder Närvarande/Frånvaro/Sjuk på samma pass.
Belägg: `10-anna-aktivitet-vecka.png`, `41-oversikt-efter-ogiltig-franvaro.png`.

**RK16. Schemamallen bär en annan deltagares praktikplats; den riktiga praktiken syns inte i planen.** · nytt
Omars plan fick "Praktikbesök · Fiktiva Logistik AB" (Annas plats). Omars riktiga praktik (Nordfrakt, från 7 okt, 30 h/v) finns på Platser men inte i planen.
Belägg: `19-pdf-plan-omar.png`, `D03_consultant_platser.png`.

**RK17. Mobil: deltagarens meny, och "Boka möte" klipps utanför skärmen.** · kvarstår (V8) + nytt (klippningen)
Bottenmenyn är Översikt/Söka jobb/Karriär/Resurser/Din vardag, "Lugnare läge" ligger längst ned, och knappen Boka möte går utanför kanten på 390 px.
Belägg: `43-mobil-oversikt.png`, `44-mobil-deltagardetalj.png`.

**RK18. Det går inte att bjuda in en kollega, och ett okänt konto ger HTTP 500.** · nytt
"Personen behöver redan ha ett konto på jobin.se" — ingen inbjudan. `karins.kollega@example.com` → `500 POST /rest/v1/organization_colleagues`
(meddelandet är begripligt, men felet borde vara 4xx). Överlämning går därför inte att visa i demon (en konsulent).
Belägg: `47-lagg-till-kollega-500.png`, `48-overlamna.png`.

**RK19. "Exportera rapport" på Översikt gör ingenting.** · kvarstår (V1, halva)
Ingen nedladdning, ingen ny flik, ingen dialog inom 25 s. (PDF-rapport på Rapporter fungerar nu.)
Belägg: `50-oversikt-exportera-rapport.png`.

## Skav

**RK20.** Den övre navigeringen på dator är deltagarens (Söka jobb, Karriär, CV, Intresseguide). · kvarstår (V8). `D01_consultant.png`
**RK21.** Resurser → Målmallar: "Inga mallar matchade din sökning" utan någon sökning, medan måldialogen har fem mallar. · nytt. `D06_consultant_resources.png`
**RK22.** Aktivitetskatalogen visar utvecklartext: "Ur schemamallen … (seedad 2026-09-13, PG18)". Syns för en köpare. · nytt. `39-resurser-aktivitetskatalog.png`
**RK23.** En Oro-anteckning heter "Fråga uppmärksammad" i Senaste aktivitet. · nytt. `42-morkt-oversikt.png`, `sv.json:7625`
**RK24.** Målöversikten på Översikt visar Övrigt/Jobbansökningar/CV, Rapporter och PDF har Kompetensutveckling (2) överst. · nytt. `41-…png`, `34-pdf-konsultrapport-s2.png`
**RK25.** Försörjningshinder-väljarens pil ligger över texten "handläggaren". · nytt. `10-anna-aktivitet-vecka.png`
**RK26.** Språk: "1 aktiva mål", "1 pass i veckan är inte markerade", "CV uppdaterat 27 sep..", Senaste aktivitet visar bara klockslag (10:30) utan dag. · nytt. `29-mal-skapat.png`, `10-…png`, `D01_consultant.png`
**RK27.** Veckan heter "Vecka 21 sep – 27 sep" — utan veckonummer, som hela kommunen planerar i. · nytt. `10-…png`
**RK28.** Lägg till pass: datum förifylls med veckans måndag (redan passerad), inget "upprepa varje vecka", bara fem aktivitetstyper (ingen SFI/studier/hälsa/vägledning). · nytt. `11-lagg-till-pass-dialog.png`
**RK29.** Språkvalet Svenska/English i konsulentinställningarna fast konsulentvyn inte är översatt. · kvarstår (S6). `49-installningar.png`
**RK30.** "Lagen kräver intyg vid sjukfrånvaro" under varje närvaropanel — ingen källa. Intygskravet brukar vara kommunens riktlinje från dag X; kontrollera formuleringen. · nytt. `12-narvaropanel.png`
**RK31.** Boka möte: helger går att välja, ingen varning för krock med deltagarens pass, ingen synlig bekräftelse efter bokning. · nytt. `25-boka-mote-detaljer.png`, `26-mote-bokat.png`
**RK32.** Nämndrapporten "Framtagen: 2026-09-27 av Konsulent" — rollen, inte namnet. · nytt. `32-pdf-namndrapport.png`

## Förslag på utveckling (det en kommunkonsulent skulle be om)

**RK33. Kontroll av veckomålet när planen skapas.** Summera anvisat + eget jobbsökande mot veckomålet, varna vid glapp, och kräv motivering när målet är under 40 h (fältet finns redan på Annas plan). Underlag: RK1, RK2.
**RK34. Ett riktigt underlagspaket till handläggaren.** "Lämna underlag" bör ge en PDF: period, pass per dag, frånvaro med anteckning, intygsstatus, vem som markerat och när, plus kvittens. Rollen "Handläggare (ekonomiskt bistånd)" finns redan i Din organisation; ge den en läsvy för sina ärenden. Underlag: RK8.
**RK35. "Att göra i dag" i Min dag:** ogiltig frånvaro utan anteckning, sjuk utan intyg, pass som inte markerats på två dagar, egenrapporter att kvittera, frånvaro deltagaren anmält i förväg (räkningen "anmälda i förväg" finns redan). Underlag: RK7, RK15.
**RK36. Gruppnärvaro.** Jobbsökarverkstaden har tio deltagare — markera närvaro för hela passet på en skärm i stället för tio deltagarsidor.
**RK37. Planen ska följa verkligheten:** återkommande pass, ändra ett mallpass för alla kommande veckor, och koppla Platser (praktik/arbetsträning) till planen så timmarna räknas. Underlag: RK16, RK28.
**RK38. Journal enligt SoL:** klockslag, kontaktform (telefon/besök/video), författare, ändringslogg — och en kontakt ska uppdatera "Senaste kontakt". Underlag: `24-journal-sparad.png`, RK14.
**RK39. Månadsunderlag per stödmånad.** Aktivitetskravet tillämpas på stöd som avser oktober 2026: ett underlag per kalendermånad (inte "senaste månaden") med veckonummer.
**RK40. Ärendekoppling:** fält för ärende-/dossiernummer i verksamhetssystemet på planen, så underlag och plan går att matcha hos handläggaren utan personnummer i Jobin.
**RK41. Demoorganisationen bör ha två konsulenter och en handläggare**, så att överlämning, caseload per konsulent och handläggarens vy går att visa vid ett köpmöte. Underlag: RK18, `48-overlamna.png`.

## Vad jag inte prövade

- Skicka meddelande/gruppmeddelande, bjuda in deltagare — avsiktligt (inga mejl).
- Rapportutkast med AI — AI är avstängt för Demokommun (Journal: "AI-utkast är avstängt…").
- Överlämning hela vägen — ingen kollega i organisationen (RK18).
- V9 (profildialogen kallar konsulenten "Deltagare") och V10 kontrollerades inte i dag.
- Skärmläsare på riktigt — bara ARIA-snapshot och tangentbord.
