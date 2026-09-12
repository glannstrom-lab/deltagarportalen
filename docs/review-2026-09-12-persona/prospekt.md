# Persona: Per, enhetschef på en kommuns arbetsmarknadsenhet — 20 minuter i prod, 2026-09-12

Skript: `e2e/persona-prospekt-2026-09-12.cjs` (publika sidor 1440 + 390, demokontot) plus tre
detaljrundor i demot (skärmdumpar 22–29). Allt mot https://www.jobin.se, oinloggad först, sedan
demokontot exakt som det står på B2B-sidan. Inga inbjudningar, inga meddelanden, inga inställningar.
Nedladdat: `nedladdning-aktivitetsplan-anna-exempel-2026-09-12.pdf` (12 850 byte).

## 1. Pers frågor → var svaret fanns → höll det?

| Fråga | Var svaret fanns | Höll det? | Skärmdump |
|---|---|---|---|
| Vad kostar det? | Startsidan (prissektionen) och B2B-sidans FAQ: 2 990 kr/mån + 290 kr per aktiv konsulent, deltagaren gratis; B2B lägger till "kostnadsfri pilot hösten 2026" | Ja, samma siffror på båda. Startsidans per-konsulent-kort räknar upp "Chattfunktion, Delad kalender, Jobbmatchning, CV-granskning" som jag inte kunde belägga i demot (se SKAV 3) | 01-startsida, 02-b2b-kommun |
| Vem är leverantören? | /om-oss/ (Glänne & Söner, enskild firma, Mikael Glännström) och integritetspolicyn | Ja, konsekvent. B2B-sidan säger det däremot inte alls — Per måste hitta sidfoten | 03-om-oss, 05-integritetspolicy |
| Var lagras data? | B2B "Klart i dag": Supabase Irland, Vercel Frankfurt, AI hos OpenRouter i USA; om oss; startsidans "EU-data" | Ja, och ärligt om USA för AI | 02-b2b-kommun, 03-om-oss |
| Kan vi ha SSO? | **Ingenstans.** Ordet förekommer inte på B2B-sidan, om oss eller startsidan | Nej — obesvarat (beslut SSO1 finns internt, inget publikt) | 02-b2b-kommun |
| Vad ser konsulenten? | B2B-listan "Vad du som konsulent ser i /consultant" + demokontot | Ja. Demot visar översikt, deltagare, platser, rapporter med IVO-kvartalsunderlag, kommunikation, inställningar; aktivitetsplan med veckosaldo och plan-PDF fungerade | 12-demo-konsulentvy, 25-detalj-aktivitet, 27-plan-pdf-klick |
| Vad ser deltagaren? | B2B "Vad deltagaren får" (lista) | Delvis. Demot kan inte visa det: /#/oversikt som demokonsulent säger "Du är inloggad som arbetskonsulent. Det här är deltagarvyn" och är tom | 21-demo-oversikt-som-konsulent |
| Hur kommer vi igång? | B2B FAQ: "biträdesavtal tecknas innan första deltagaren läggs in", "boka en visning", pilot | Halvt. Inget steg-för-steg (avtal → konton → inbjudan → mall → plan), ingen tidsuppskattning | 02-b2b-kommun |
| Vad händer med aktivitetskravet? | B2B FAQ + guiden /guider/aktivitetskrav-forsorjningsstod/ + demots plan | Ja, tydligt och med rätt ansvarsfördelning ("beslut om nedsättning fattas av socialnämnden, inte här") | 04-guide-aktivitetskrav, 25-detalj-aktivitet |
| Rapporter till nämnden? | Demots Rapporter: Excel, PDF-rapport (sektioner: nyckeltal, kohortanalys, deltagardetaljer, språkval), IVO-kvartalsunderlag | Ja, men PDF-rapportens sista steg (Förhandsgranska → nedladdning) hann jag inte bevisa; plan-PDF:en bevisad | 15-demo-rapporter, 18-demo-export-klick |

## 2. Fynd

### KRITISKT (skulle stoppa affären eller är osant)
1. **Demots översikt motsäger sig själv.** Kortet "Kräver uppmärksamhet" visar **0**, men listan under det visar alla fem deltagarna med "CV saknas" — trots att seedningen lade in tre CV:n och deltagarlistan visar CV-poäng "2" på Anna. En köpare som ser en nyckeltalsruta som säger 0 bredvid en lista med fem drar slutsatsen att siffrorna inte går att lita på. Trolig orsak: översiktens "CV saknas" läser en annan källa än CV-poängen (has_cv i vyn vs `cvs`-tabellen). Skärmdump 12-demo-konsulentvy. Ägare: `consultant_dashboard_participants`-vyn / `OverviewTab`.
2. **SSO finns inte som svar någonstans publikt.** Första frågan från kommunens IT. Beslutet (Entra ID för personalen) är taget internt 2026-09-12 men står inte på B2B-sidan. Ägare: `client/content/b2b.json` (avsnittet "Personuppgifter och AI — så är läget" har redan en "Pågår"-lista där det hör hemma).

### VIKTIGT
3. **Fliken på deltagardetaljen heter "Dagbok"** men innehållet är "Deltagarjournal" (konsulentens anteckningar). B2B-sidan lovar i samma andetag "en dagbok bara deltagaren själv ser". En köpare som klickar på "Dagbok" i demot tror att konsulenten läser deltagarens privata dagbok. Skärmdump 25-detalj-dagbok. Ägare: `ParticipantDetailPage.tsx` (fliketikett).
4. **"Rapportutkast (AI)" visas i demot fast AI är av för organisationen.** Knappen öppnar dialogen "Rapportutkast från journalen" med "Skapa utkast"; nästa klick hade gett 403. Bannern säger "Ingen AI … härifrån" — knappen säger motsatsen. Skärmdump 28-rapportutkast-ai-klick. Ägare: journalfliken; läs `my_ai_policy` och göm/inaktivera med förklaring.
5. **Demot kan inte visa deltagarens sida av portalen.** Per vill se vad hans deltagare möter (plan, "Jag är här", Min vecka). Det enda som finns är konsulentens egen tomma deltagarvy. Ägare: demoseedningen (`seed_demo_org`) + B2B-texten.
6. **B2B-sidan saknar "så kommer ni igång".** Avtal, konton, inbjudan, aktivitetskatalog, mall, plan — stegen finns var för sig i konsulentvyn men ingen berättar ordningen eller hur lång tid det tar. Ägare: `b2b.json`.

### SKAV
7. Inställningar → "Projekt" erbjuder "Rusta och Matcha" för ett kommunkonto. För en kommun är det brus. Skärmdump 17-demo-installningar.
8. Startsidans per-konsulent-kort listar "Chattfunktion", "Delad kalender", "Jobbmatchning", "CV-granskning". I demot fann jag Kommunikation (meddelanden) och möten, men ingen delad kalender eller jobbmatchning per konsulent. Kontrollera varje punkt mot koden innan de står kvar (ärlighetsregeln). Ägare: `landing.pricing.*`.
9. B2B-sidan nämner inte vem som står bakom (namnet finns på /om-oss/ och i sidfoten "Integritet · Tillgänglighet", men inte som länk "Om oss" i guidesidornas sidfot).
10. Rapporternas PDF-modal säger "Den här vyn har ingen tidsavgränsning — rapporten visar aktuella totalsummor" trots att sidan har knappar "Senaste veckan/månaden/kvartalet/året". Ärligt, men förvirrande: periodknapparna ser ut att styra rapporten.
11. Demokontots "Min dag — Inga brådskande punkter" en lördag är rimligt, men "Möten denna vecka 1" pekar på ett seedat möte som inte syns i Min dag. Liten sak.
12. Mobil 390: B2B-sidan läses bra i en kolumn; demouppgifterna står i löptext utan kopiera-knapp — ett långt lösenord på mobil är pillrigt.

## 3. Förslag på funktioner/innehåll som en kommunköpare saknar
- **Demodeltagare att logga in som** (t.ex. `anna.exempel@…` med lösenord på B2B-sidan, samma nattliga reset): svarar på "vad ser deltagaren", som demot i dag inte kan. Motiveras av fråga 6.
- **"Så kommer ni igång"-avsnitt på B2B-sidan** med fem steg och en realistisk tid (avtal, chefskonto, kollegor, katalog/mall, första planen), gärna med skärmdumpar ur demot. Motiveras av fråga 7.
- **SSO-rad under "Pågår"** på B2B-sidan: "Inloggning med kommunens Microsoft-konto (Entra ID) för personal — planerad; deltagare loggar in med e-post". Motiveras av fråga 4.
- **Nämndrapport som mall**: en PDF-rapport med fast periodval (kvartal) som innehåller IVO-underlaget + antal planer/närvarograd per försörjningshinder, alltså det nämnden faktiskt frågar efter, i stället för kohortanalys. Motiveras av fråga 9.
- **Kopiera-knapp för demouppgifterna** på B2B-sidan och en "Prova demokontot"-knapp som förfyller e-posten på inloggningen (`/#/login?email=demo@jobin.se`). Motiveras av SKAV 12.
- **Konsulentens journalflik döps om till "Journal"** och deltagarens privata dagbok nämns i en rad under den ("Deltagarens dagbok är privat och syns inte här"). Motiveras av VIKTIGT 3.

## 4. Vad jag inte kunde pröva
- PDF-rapportens sista steg (Förhandsgranska → fil): modalen öppnades men jag hann inte bevisa en nedladdning; plan-PDF:en bevisad i stället.
- Inbjudningar, gruppmeddelanden, "Boka möte" — förbjudet i uppdraget (mejl/mutationer).
- Excel-exporten (knappen finns på Rapporter, inte klickad).
- Deltagarens vy med en riktig plan — inget demodeltagarkonto finns.
- Om demokontots reset faktiskt återställer mina spår (första körningen 01:00 UTC i natt).
