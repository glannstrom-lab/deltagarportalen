# Persona-genomgång: deltagaren Dana — prod 2026-09-12 (lördag kväll)

**Vem:** Dana, 34, försörjningsstöd, aktivitetskrav från kommunen sedan i höst, kopplad till konsulenten Kim (Testkommun). Begränsad ork, läser korta texter, mobilen först, orolig för vad kommunen ser.
**Hur:** inloggad som `km-deltagare@jobin.test` i prod. 36 sidor på mobil 390 (ljust), 12 av dem i mörkt läge med axe `color-contrast`, samtliga på desktop 1440. Skript: `e2e/persona-deltagare-2026-09-12.cjs`. Mätvärden i `logg.json`, ARIA-snapshots i `snap/`, skärmdumpar `m-*` (mobil), `m-dark-*` (mörkt), `d-*` (desktop).
**Muterat:** ingenting bestående. Incheckning fanns inte att göra (inget pass på lördag). Dagboken kräver hälsosamtycke som jag inte gav. AI-anropet gjordes aldrig — verktyget vägrade själv utan CV (se nedan).

## 1. Funktion för funktion

| Funktion | Fungerar | Syns (mobil) | Upplevs som Dana | Bild |
|---|---|---|---|---|
| Översikt: hälsning, nästa steg, kategorier | ja | ja, tydlig | Lugn. "God kväll Dana", ett steg ("Börja med ditt CV"), inviter i stället för nollor ("hitta ditt första jobb") | m-oversikt, d-oversikt |
| Min vecka: passen, närvaro, jobbsökande | ja | ja | Passen är tydliga, incheckning kl 17:53 syns. Men "Du har 15 av 30 timmar" är oförklarat, "Frånvaro" står utan orsak och utan knapp, och det finns ingen väg att anmäla sjukdom | m-min-vecka, d-min-vecka |
| Min konsulent: kontakt, meddelande, vad hen ser, läslogg, uppsägning | ja | ja | Det bästa i portalen för en orolig person: "Det här ser din konsulent" + "Vem har öppnat dina uppgifter" med tidsstämplar. Uppsägningen är förklarad innan knappen | m-my-consultant |
| Notiser | ja | ja (7 olästa) | Alla sju är aktivitetsnotiser — bra, men ingen prioritering | m-notiser |
| Mobilmenyn / Min profil | ja | ja | Full lista, sektionerna utfällda. `inert` när stängd — korrekt för skärmläsare | snap/meny-mobil |
| Krisstöd-knappen | finns i huvudet | ja | Klicket hann inte i skriptet; panelen finns i trädet | — |
| Lätt svenska | delvis | — | Finns som **innehåll** (Kunskapsbank "Lätt svenska — 31 artiklar", planens överlägg) men **inget val Dana själv kan göra** i inställningarna | snap/settings-detalj-mobil |
| Språkbyte till engelska | **nej på mobil** | nej | "Välj språk" finns bara i desktop-toppnaven. Mobilhuvudet, Min profil-dialogen och Inställningar saknar språk. Min `localStorage`-genväg tog inte — mätningen "13 svenska ord kvar" i loggen är ogiltig | snap/settings-desktop:27 |
| Fokusläge / Lugnare läge | ja på desktop | delvis | På mobil finns bara "Lugnare läge"-panelen längst ner, och den saknas på 7 sidor — bl.a. **Min vecka** och **CV** | m-oversikt (längst ner) |
| Söka jobb-hubben + Sök jobb | ja | ja | Sökning, filter, artiklar med Spara/Skriv brev/Ansök | m-jobb, m-job-search |
| CV | ja | ja | Guiden "Välkommen till CV-byggaren" först; Snabb-CV lovar "30 sekunder" men namnfältet är tomt med platshållaren "Anna Andersson" fast Dana är inloggad | m-cv, m-dark-cv |
| Personligt brev | ja | ja | Utan CV vägrar verktyget låta AI:n gissa och ger en mall med 5 luckor, ärligt märkt "Det här är en mall, inte ett färdigt brev". Rätt beteende, men Dana får inget brev | d-brev-steg2, d-brev-genererat |
| Ansökningar, Intervju, Lön, LinkedIn, Spontanansökan, Ny i Sverige | ja | ja | Verktygsnamn ("Intervju-simulator", "LinkedIn-optimering") snarare än inviter | m-applications, m-interview, m-salary … |
| Karriär: plan, intresseguide, kompetensanalys, personligt varumärke, utbildningar | ja | ja | Hubben säger "inte påbörjat" — bra. Sidorna är textrika för mobil | m-karriar, m-career, m-interest-guide … |
| Resurser: kunskapsbank, sparade, externa, AI-team, nätverk | ja | ja | Sparade resurser visar tre nollor som KPI. AI-teamet: fem agenter, tydlig "AI"-märkning | m-resources, m-ai-team, m-knowledge-base |
| Din vardag: hälsa, dagbok, kalender, övningar | ja | ja | Hälsa och dagbok är helt låsta bakom samma samtyckesruta för känslig hälsodata. Övningar: "0 Påbörjade / 0 Aktiva / 119 Ej påbörjade" | m-diary, m-wellness, m-exercises |
| Profil | ja | ja | "Profilstatus 17 %" + "Nästa steg: Telefon" — en procent i hjälteposition | m-profile |
| Inställningar | ja | ja | "Roll och behörigheter", "Aktiv roll", "Dina rättigheter är en kombination av alla dina roller", projektval "Rusta och Matcha" med "Sidor för projektet kommer i en kommande uppdatering" | m-settings, d-settings |
| Hjälp, integritetspolicy, tillgänglighetsredogörelse, om oss | ja | ja | Om oss säger vem som står bakom (Glänne & Söner). Redogörelsen listar kända brister | m-help, m-privacy, m-tillganglighet, m-om-oss |
| Rådgivarna | ja | ja (infogade) | Ett råd i taget infogat ("Andreas, jobbcoach"), kolumn på desktop | d-radgivare-utfalld |
| Mörkt läge | ja | — | 12 sidor mätta med axe: 9 utan kontrastfel; CV 5, Dagbok 2, Hälsa 2 (se nedan) | m-dark-* |
| Sidledsscroll / råa i18n-nycklar / engelska ord i svenskt läge | inga | — | 0 träffar på 36 sidor, båda bredderna | logg.json |

## 2. Fynd

### KRITISKT — hindrar, ljuger eller skrämmer

1. **Ingen språkväxling på mobil.** "Välj språk" finns bara i desktop-toppnaven (`snap/settings-desktop.yaml:27`). Mobilhuvudet har sök, sparade, notiser, profil, meny; Min profil-dialogen har Min profil/Inställningar/Logga ut; Inställningar har sektionerna Profil, Tillgänglighet, Notifikationer, Utseende, Integritet — ingen språk. Portalens uttalade engelska läsare är nyanländ och på mobil. Väntat: språk i Inställningar → Tillgänglighet eller i Min profil-dialogen. Ägare: `components/layout/TopBar.tsx` (mobilhuvudet), `pages/Settings*`.
2. **Aktivitetskravet utan väg att anmäla frånvaro.** Min vecka visar "Frånvaro" på måndagens pass (`snap/min-vecka-mobil-ljust.yaml`) utan orsak, utan möjlighet att förklara, och utan knapp för att anmäla sjukdom eller förhinder inför ett pass. För Dana kan en oanmäld frånvaro påverka försörjningsstödet. Meddelandefunktionen finns på Min konsulent, inte där passen är. Väntat: "Jag kan inte komma" på varje kommande pass, med orsak som når konsulenten och syns i närvaron. Ägare: `pages/MinVecka.tsx`, KM-närvaron.

### VIKTIGT

3. **"Du har 15 av 30 timmar den här veckan. Och 5 timmar för eget jobbsökande."** Oförklarat: timmar av vad, är 30 kravet, vad räknas, vad händer vid mindre. Väntat: en rad som säger vad kravet är och vad som återstår, med länk till guiden om aktivitetskravet. (`pages/MinVecka.tsx`)
4. **Snabb-CV: namnfältet tomt med platshållaren "Anna Andersson"** trots att Dana är inloggad och profilen har namnet (`#quick-fullName`, `pages/CVBuilder.tsx`). Ett påhittat namn i ett fält som borde vara ifyllt. Samma kort ger **5 kontrastfel i mörkt läge**: `text-white/80` på den bruna bakgrunden = 3,79:1, inputens vita text på `bg-white/20` = 3,43:1 (`m-dark-cv.png`).
5. **Nollor som nyckeltal i deltagarvyer.** Resurser: "Sparade jobb 0 / Dokument 0 / Bokmärken 0" som klickbara KPI:er (`pages/Resources.tsx`); Övningar: "119 Övningar totalt / 0 Påbörjade / 0 Aktiva / 119 Ej påbörjade" (`pages/Exercises.tsx`). DESIGN.md §2/§7: ett tomt fält är en invit, inte en nolla. Översikt gör det rätt ("inget sparat än") — samma sida-familj, olika regler.
6. **Inställningar talar administrationsspråk till en deltagare.** "Roll och behörigheter", "Aktiv roll", "Dina rättigheter är en kombination av alla dina roller", "Välj vilket arbetsmarknadsprojekt du tillhör" med alternativet "Rusta och Matcha" (Dana är kommundeltagare) och löftet "Sidor för projektet kommer i en kommande uppdatering". (`pages/Settings*`, `lib/programs.ts`)
7. **Samtyckesrutan pekar på en flik som inte finns.** Dagbok och Hälsa säger "Din konsulent ser det först om du själv slår på delning under Inställningar > Sekretess" — fliken heter **Integritet**. Och att skriva en vanlig dagboksrad kräver samtycke till "Humör, Energinivåer, Sömnkvalitet, Dagboksanteckningar, Tacksamhetsnoteringar" i ett svep. Dana som vill anteckna att hon sökt ett jobb ska inte behöva samtycka till sömndata. (`components/wellness/WellnessConsentGate*`)
8. **Lugnare läge saknas där det behövs mest på mobil.** Panelen finns på 29 av 36 sidor men inte på Min vecka, CV, Hjälp, Nätverk, Om oss, Integritetspolicy, Tillgänglighet. Fokuslägesknappen i toppnaven finns bara på desktop. (`components/radgivare/LugnarePanel.tsx`, `PageLayout`)
9. **Mörkt läge, samtyckesrutan:** länken "integritetspolicy" i rosa (`text-pink-400`) ger 4,13:1 mot rutans bakgrund på Dagbok och Hälsa (`m-dark-diary.png`, `m-dark-wellness.png`).
10. **Profilstatus 17 %** i profilens hjälteposition, med "Nästa steg: Telefon". En procent på en person som just börjat. (`components/profile/ProfileHeader.tsx`)
11. **Läsloggen säger inte vad som öppnades.** Fyra rader "Din konsulent öppnade dina uppgifter 12 sep. kl 20:50 / 20:49 / 20:04 / 20:03" — bra att den finns (ÖV1), men "dina uppgifter" är allt eller inget. Väntat: "din journal", "ditt CV", "dina sparade jobb".

### SKAV

12. Den flytande runda "Gå tillbaka"-knappen ligger över logotypen på alla undersidor på mobil (`m-min-vecka.png`, `m-cv.png`), och bokmärkes-knappen (FAB) ligger över Snabb-CV:ts namnfält.
13. Verktygsnamn som rubriker: "Intervju-simulator", "LinkedIn-optimering", "Kompetensanalys", "Ditt personliga varumärke", "Ditt AI-team Ny!" — DESIGN.md §2 vill ha inviter.
14. Personligt brev utan CV: mallen är ärlig, men "Skriv ett nytt utkast" ger samma mall igen — knappen lovar något annat än den gör.
15. Min vecka: "Nästa vecka" visar tomma dagar utan att säga om planen inte är lagd än eller om det är ledigt.
16. Notiserna är alla lika viktiga (7 aktivitetsnotiser); passet i morgon borde ligga överst.

## 3. Förslag på nya funktioner — ur Danas vardag under aktivitetskravet

1. **"Jag kan inte komma"** på varje kommande pass i Min vecka: orsak (sjuk, vård av barn, möte hos myndighet, annat), fri text, når konsulenten som meddelande och syns i närvaron som anmäld frånvaro. Saknades helt (fynd 2).
2. **Kravet förklarat på plats:** "Du har 15 av 30 timmar" → "Kommunen kräver 30 timmar i veckan. 15 är planerade av din konsulent, 5 räknar vi från ditt jobbsökande här, 10 återstår att fylla" med länk till guiden `/guider/aktivitetskrav-forsorjningsstod/` (som redan finns, även på engelska). Och räkna jobbsökartimmarna automatiskt från sparade jobb/ansökningar i stället för "Inget registrerat än".
3. **Påminnelse kvällen innan ett pass** (notis, valfritt SMS/e-post nu när mejl fungerar) med adress som länk till karta — "Hjernet, Malmgatan 4" är bara text i dag.
4. **Språk och Lätt svenska som Danas eget val**, på mobil, i Inställningar → Tillgänglighet: engelska, lätt svenska (överlägget finns redan i KM11 men styrs av konsulenten), större text. Mobil först.
5. **Närvarointyg för månaden** som PDF från Min vecka — Dana kan själv visa handläggaren på försörjningsstöd vad hon deltagit i, utan att gå via konsulenten. Konsulentens plan-PDF finns; deltagarens kvitto finns inte.
6. **Anteckning utan hälsosamtycke:** en "vanlig anteckning" (jobbsökardagbok: vad jag sökte, vem jag pratade med) skild från mående/sömn, så tröskeln till dagboken inte är ett art. 9-samtycke.
7. **Incheckning som tål dålig täckning:** köa "Jag är här" offline (PWA:n finns) och skicka när nätet är tillbaka — arbetsplatser i källarplan är vanliga.
8. **Fråga konsulenten från passet:** meddelandefältet från Min konsulent inbäddat i Min vecka ("Fråga Kim om det här passet").

## 4. Inte prövat

- Incheckning ("Jag är här"): inget pass på lördag. Måste köras en vardag med pass.
- Dagbok/Hälsa/Övningarnas hälsokategorier: kräver hälsosamtycke som jag inte gav för testkontot.
- AI-generering: verktyget vägrade utan CV (rätt), så ingen modell anropades. Ett AI-anrop med CV på plats återstår.
- Språkbyte: går inte att göra på mobil; desktopvägen ("Välj språk") klickades inte.
- Uppsägning av konsulentkopplingen: läst, inte klickad.
- Krisstödspanelen och mobilmenyn: klicken hann inte i skriptet (30 s) — troligen notispanelen som låg kvar öppen; båda finns i tillgänglighetsträdet.
- Surfplatta, skärmläsare, tangentbordsnavigering i mobilmenyn.
