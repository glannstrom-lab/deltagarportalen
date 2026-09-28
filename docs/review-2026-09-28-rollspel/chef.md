# Rollspel: "Maria", enhetschef för arbetsmarknadsenheten i en kommun — prod 2026-09-28

Konto: `demo@jobin.se` (org-roll `chef` i "Demokommun (påhittade personer)"; profilroll CONSULTANT, samma
`/consultant`-UI som en konsulent). Inloggad via engångslänk (superadmin "Visa som"). Organisationen har tre
medlemmar: Demo Konsulent/chef (jag, 5 egna deltagare), Kim Kollega (arbetskonsulent, 2 deltagare) och Hanna
Handläggare (ekonomiskt bistånd, 0 deltagare).

Skript: `e2e/rollspel-2026-09-28-chef-step1-desktop.cjs` … `-step5-mobil.cjs` (kopior i
`C:\Users\Mikael\AppData\Local\Temp\claude\...\scratchpad\`, körda via `e2e/rollspel-2026-09-28.cjs`).
Belägg: `chef/d-NN-*.png` + `chef/txt/*.txt` (dator, 1366×900), `chef/m-NN-*.png` (mobil, 390×844).
`chef/natverk.txt` finns inte — inga nätverksfel ≥400 under hela passet.

**Muterat i demon:** inget som kvarstår. Jag öppnade dialogen "Överlämna deltagare…" för Kim Kollegas rad och
valde inget mottagarnamn (se CH4) — bekräfta-knappen förblev inaktiverad och ingen överlämning gick igenom;
verifierat efteråt (`d-18-caseload-oforandrad.png`): Kim har fortfarande 2 deltagare. Jag rörde inte
AI-brytaren, tog inte bort någon kollega och skickade ingen inbjudan.

## Helhetsintryck (Maria)

Jag loggade in och fick på under en minut en bra bild av *min egen* grupp — Min dag, dagens pass, vem som
kräver uppmärksamhet. Problemet är att jag är chef, inte konsulent, och det jag faktiskt ska göra i oktober är
redovisa *hela enhetens* siffror för nämnden. De hittar jag inte. Nämndrapporten och IVO-kvartalsunderlaget
heter precis rätt saker och ser proffsiga ut, men de räknar bara mina egna fem deltagare — Kims två syns
ingenstans i rapporten, trots att jag loggat in som chef. Den enda vyn som visar alla tre i min enhet
("Caseload" under Inställningar) ligger begravd under personliga UI-inställningar, och på mobilen tappar jag
bort tre av fyra kolumner i just den tabellen — inklusive knappen för att flytta ärenden när någon blir sjuk.
Om jag ska visa det här för socialnämnden måste jag i praktiken logga in som varje konsulent för sig och räkna
ihop siffrorna för hand. Det är precis det jag skulle vilja slippa genom att köpa licenser för hela enheten.

**De 3 viktigaste:**
1. **Nämndrapport/IVO-underlag/månadsunderlag räknar bara chefens egna deltagare, aldrig enhetens** (CH1) —
   fungerar för en konsulent, inte för en chef som ska redovisa helheten.
2. **Den enda helhetsvyn (Caseload per konsulent) ligger dold under Inställningar**, inte på Översikt eller i
   en egen ingång (CH2) — chefsperspektivet är eftertänkt, inte inbyggt.
3. **På mobilen försvinner tre av fyra kolumner i Caseload-tabellen**, inklusive "Överlämna deltagare…" (CH3)
   — en snabb koll eller en omfördelning går inte att göra från telefonen.

Antal fynd: **Kritiskt 1 · Viktigt 3 · Skav 3 · Förslag 6.**

## Tidsåtgång / friktion (chefens vanligaste uppgifter)

| Uppgift | Tid/klick | Var man tvekar |
|---|---|---|
| "Läget för hela enheten" | Aldrig helt uppnått | Översikt visar bara mina 5; måste till Inställningar → scrolla förbi fem andra sektioner → "Caseload" |
| Generera nämndrapport | 2 klick till dialogen (Rapporter → "PDF-rapport" → välj "Nämndrapport (kvartal)") | Ingen förklaring i dialogen av skillnaden mot "Konsultrapport" förrän man öppnat den; siffrorna bakom är redan fel innan man ens kommer dit (CH1) |
| Ladda ner IVO-underlag | 1 klick ("Ladda ner som TSV") efter att år/kvartal är valt | Filen heter TSV men produkten kallar det "Excel" på annat håll i portalen (känt sedan RK9, kvarstår som mönster) |
| Se vem som har för många deltagare | Kräver Inställningar → Caseload, sedan egen bedömning | Ingen riktlinje/tak visas för kommun (bara för Rusta och matcha-leverantörer, FFU §4.5.2) — bara råa tal, ingen signal om vad som är "för mycket" |
| Fördela om vid sjukdom (överlämning) | Dialog öppen på 1 klick | Mottagarlistan för Kims rad innehåller bara mig själv (se CH4) — med bara en kollega och en handläggare i demot går ingen verklig avlastning att testa |

## Kritiskt

**CH1. Rapporter (nämndrapport, IVO-kvartalsunderlag, månadsunderlag) räknar bara chefens egen caseload, aldrig hela enheten.** · nytt
Var: `/consultant/analytics` som `demo@jobin.se` (org-roll chef, 3 medlemmar i Demokommun).
Belägg: `chef/txt/d-02-rapporter.txt` och `chef/txt/d-13-efter-exportera-rapport.txt` — "Totalt deltagare 5",
IVO-tabellen "Arbetslös 2 · Med ogiltig frånvaro 1"; matchar exakt caseload-raden för "Demo Konsulent" i
`chef/txt/d-04-installningar.txt` ("5 · 2 · 1"). Kim Kollegas två deltagare (Sara Påhitt, Johan Exempelsson) och
Hanna Handläggares ärenden räknas aldrig med — trots att inloggad användare är chef för hela organisationen.
Fil: `client/src/pages/consultant/consultantParticipantsQuery.ts:47` (`.eq('consultant_id', user.id)`), samma
mönster upprepat i `client/src/pages/consultant/AnalyticsTab.tsx:319,325,331,339,354,362`. `kundtypsVisning`
(`AnalyticsTab.tsx:218-230`) styr bara om IVO-underlaget eller avtalskravet *visas* — ingen kod någonstans
breddar frågan till hela organisationen när den inloggade har org-rollen `chef`.
Konsekvens: en nämndrapport eller ett IVO-kvartalsunderlag som chefen genererar är inte enhetens siffror, bara
hennes egna — och om en enhetschef (till skillnad från demots konsulent-chef) själv inte har några deltagare
skulle rapporten visa noll för hela enheten. Det här är exakt det underlag Maria ska basera sin föredragning
för socialnämnden på i oktober.

## Viktigt

**CH2. Den enda vyn som visar hela enheten (Caseload per konsulent) ligger dold under Inställningar.** · nytt
Var: `/consultant/settings` → "Din organisation" → sektionen "Caseload", sist på sidan, efter personliga
UI-inställningar (standardvy, tidszon, veckostart, inaktivitetsvarning) och AI-brytaren.
Belägg: `chef/txt/d-04-installningar.txt`, `chef/m-03-installningar.png`.
Fil: `client/src/components/consultant/OrganisationSektion.tsx`, monterad i `SettingsTab.tsx`.
Ingenting i Översikt, huvudnavigeringen eller Rapporter länkar hit eller nämner att vyn finns. En chef som
loggar in första gången har ingen anledning att gå till "Inställningar" för att hitta sin enda helhetsbild.

**CH3. Mobil: Caseload-tabellen visar bara namn och deltagarantal — "Aktiva planer", "Ogiltig frånvaro 30 d"
och knappen "Överlämna deltagare…" faller utanför skärmen utan synlig scrollindikation.** · nytt
Var: `/consultant/settings` på 390×844 (mobil).
Belägg: `chef/m-03-installningar.png` (bara "Kim Kollega · Arbetskonsulent · 2" syns), jämfört med
`chef/txt/m-03-installningar.txt` som visar att alla kolumner finns i sidans text (`overflow-x-auto`, inte
dolda i DOM:en — bara utanför synligt fält).
Fil: `client/src/components/consultant/OrganisationSektion.tsx:167` (`<div className="relative overflow-x-auto">`)
— ingen skugga, pil eller annan visuell ledtråd om att tabellen går att svepa i sidled.
Konsekvens: en chef som gör en snabb koll på mobilen (precis det jag testade) ser bara namn och totalt antal
per kollega — inte om någon har ogiltig frånvaro, och kan inte hitta "Överlämna deltagare" om hon inte råkar
prova att svepa en tabell hon inte vet är skrollbar.

**CH4. Ingen riktlinje/tak för caseload hos en kommun — bara råa tal, ingen signal om vad som är "för mycket".** · nytt
Var: `/consultant/settings` → Caseload.
Belägg: `chef/txt/d-04-installningar.txt`.
Fil: `client/src/components/consultant/caseloadKapacitet.ts:26-27` — `kapacitet()` returnerar `{ visas: false }`
för alla `kind !== 'leverantor'`; kommentaren säger uttryckligen "Kommunen har inget tak i lag; där visas bara
antalet". Rimligt att det inte finns ett lagstadgat tak för kommun (FFU §4.5.2 gäller bara Rusta och matcha),
men brief-uppgiften "veta vem som har för många deltagare" går inte att svara på med bara tre råa tal — Maria
har ingen inbyggd jämförelsepunkt, bara sin egen magkänsla.

## Skav

**CH5. Handover-dialogens mottagarlista för Kim Kollega innehöll bara mig själv ("Demo Konsulent · Chef").** · nytt
Var: `/consultant/settings`, "Överlämna deltagare…" för Kim Kollegas rad.
Belägg: körlogg `options ["Välj kollega","Demo Konsulent · Chef"]`, `chef/d-15-dialog-oppen.png`.
Fil: `client/src/components/consultant/OrganisationSektion.tsx:227` (`arMottagarroll`) — filtrerar medvetet
bort rollen `handlaggare` som mottagare, vilket är rimligt (en handläggare tar inte över ett ärende). Men i en
organisation med bara en chef och en konsulent blir konsekvensen att en verklig avlastning ("konsulent blir
sjuk, fördela om till kollegor") inte går att testa eller visa förrän en tredje arbetskonsulent finns i
organisationen — och dialogen förklarar inte varför listan bara har ett namn.

**CH6. Ingen möjlighet att lämna över EN deltagare — bara hela caseloaden.** · kvarstår (dokumenterat i koden, inte tidigare rapporterat ur chefens synvinkel)
Var: samma dialog som CH5. Texten säger rakt ut: "Alla 2 deltagare flyttas till den du väljer."
Fil: `client/src/services/orgApi.ts:343` (`handover(orgId, fromConsultantId, toConsultantId)`) tar ingen
deltagar-id, bara två konsulent-id:n. Ingen kod någonstans (grep av `ParticipantDetailPage.tsx`, `orgApi.ts`)
stödjer att flytta en enskild deltagare mellan konsulenter.
Konsekvens: en chef som vill avlasta EN tung deltagare från en överbelastad konsulent till en annan (utan att
rubba resten av caseloaden) kan inte göra det. Enda vägen är allt-eller-inget per konsulent.

**CH7. "Se detaljer" på Målöversikt och notisklockan testades inte fullt ut.** · nytt (öppen fråga, inte fynd)
Notisklockans badge gick från 3 till 5 mellan två sidladdningar utan att jag klickade på något — troligen
annan samtidig aktivitet i demot (flera agenter spelar just nu), inte en bugg. Flaggar det ändå ifall det
återkommer i en körning utan samtidig trafik.

## Förslag (utveckling)

**CH8. En riktig "chefsvy": enhetens helhet på Översikt, inte en tabell under Inställningar.**
Vad: när org-rollen är `chef`, visa en sammanfattningskort-rad överst på Översikt — totalt antal deltagare i
HELA enheten, fördelat per konsulent, plus samma nyckeltal (CV-komplettering, ogiltig frånvaro, mål) aggregerat
över alla konsulenter. För vem: enhetschefer som loggar in en gång i veckan, inte varje dag (brief: "Hon är
inte i portalen varje dag"). Värde: det här är hela säljargumentet för att en kommun ska köpa licenser för fler
än en person — annars är varje konsulentkonto en isolerad ö. Storlek: 1–2 dagar (databasfråga finns redan i
`organization_caseload`-vyn, bara ny sammanställning + UI).

**CH9. Nämndrapport och IVO-underlag ska kunna genereras för hela enheten, inte bara inloggad konsulent.**
Vad: en valbar omfattning i rapportdialogen ("Mina deltagare" / "Hela enheten") när användaren är chef, som
byter `consultant_id`-filtret mot ett `org_id`-filter över alla konsulenter i organisationen. För vem: chefer
och kommunkonsulenter med personalansvar. Värde: gör CH1 till en faktisk lösning, inte bara ett känt fel.
Storlek: ~1 dag om `organization_caseload`-vyn redan har rätt kolumner (verifiera RLS: chef ska få läsa
kollegors deltagardata i aggregerad form, inte per person — samma "bara tal"-princip som Caseload-tabellen
redan följer).

**CH10. Text att klistra in i en tjänsteskrivelse.**
Vad: en kort, färdigformulerad sammanfattningstext under nämndrapporten ("X deltagare var anvisade under
kvartalet, Y hade ogiltig frånvaro, underlag lämnat i Z fall") som chefen kan kopiera rakt in i ett
tjänsteskrivelse-utkast, byggd av samma siffror som PDF:en (så de aldrig kan säga olika, jfr KS6-lärdomen i
`ReportGeneratorDialog.tsx`). För vem: Maria explicit ("text hon kan klistra in i en tjänsteskrivelse"). Värde:
sparar den tid som annars går åt att själv formulera om tabelldata till löptext inför nämnden. Storlek: en
dag — mest textmall, siffrorna finns redan uträknade i `namndrapportUnderlag`.

**CH11. Jämförelse över tid för nämnden ("är vi bättre eller sämre än förra kvartalet?").**
Vad: IVO-kvartalsunderlaget visar bara valt kvartal. En liten delta-rad ("föregående kvartal: X → nu: Y") vore
precis det en nämnd frågar näst. För vem: chefer som föredrar resultat kvartalsvis. Värde: nämnden frågar
nästan alltid om trend, inte bara ögonblicksbild. Storlek: någon dag — `kvartalGranser`/`ivoKvartal.ts` har
redan periodlogiken, bara en andra fråga mot föregående period.

**CH12. Visuell jämförelse mellan kollegor (diagram, inte bara tabellrader).**
Vad: ett enkelt stapeldiagram i Caseload-sektionen (deltagare per konsulent, ogiltig frånvaro per konsulent)
i stället för bara siffror i en tabell. För vem: Maria ska "föredra" resultatet — ett diagram läses snabbare än
en tabell i ett möte. Värde: matchar brief-uppgiften "diagram, jämförelse över tid" rakt av; Rapporter-fliken
har redan diagramkomponenter (`BarChart`/cirkeldiagram) som går att återanvända. Storlek: någon dag.

**CH13. Flytta EN deltagare mellan konsulenter, inte bara hela caseloaden.**
Vad: bygg vidare på CH6 — en enkel "byt konsulent"-åtgärd på enskild deltagarnivå (kräver antagligen ett UI på
en deltagares sida, synlig bara för chef/admin), separat från den befintliga hel-caseload-överlämningen. För
vem: chefer som ska jämna ut belastning utan att rubba en hel caseload vid enstaka personalförändringar.
Värde: mindre trubbigt verktyg än dagens allt-eller-inget. Storlek: 2–3 dagar (ny UI + RLS-kontroll av att
mål/journal/möten hanteras konsekvent, samma fråga som redan är olöst för hel-överlämning: "arkiveringsbeslut
KS2" nämnt i `OrganisationSektion.tsx`-kommentaren).

## Vad jag inte hann pröva

Att faktiskt genomföra en överlämning (CH5/CH6 byggde på att öppna dialogen och läsa mottagarlistan — jag valde
att inte bekräfta en hel-caseload-flytt av Kims två deltagare eftersom funktionen inte stödjer att flytta bara
Johan Exempelsson, och en flytt av hela Kims caseload till mig själv inte går att återställa exakt utan att
även flytta med mina egna fem). "Lägg till kollega"-formuläret, borttagning av en kollega och AI-brytaren
rördes inte alls (utanför mandatet). Integritetspolicy-sidans GDPR-text öppnades inte i detalj — bara
sammanfattningarna på Inställningar-sidan ("Exporten omfattar deltagare du har en aktiv relation till", som har
samma per-konsulent-begränsning som CH1) lästes.
