# STA — förbättringsförslag och Jobin-data-integration

**Skapad:** 2026-05-12
**Källor:** `docs/sta-material-deep-dive.md` (sta-mapp-inventering) + djupkännedom om Jobin-portalens befintliga moduler
**Syfte:** Vägleda nästa iteration av deltagar- och konsulent-sidorna

---

## Del A — Konkreta förbättringar baserat på materialinventeringen

### För deltagar-sidan

#### A1. Korsreferera befintliga KB-artiklar — fyll bara luckorna
**Bakgrund:** Kunskapsbanken har redan **136 artiklar** som täcker i princip alla teman i Morgans 15 föreläsningar — motivation, stresshantering, självkänsla, mål, konflikthantering, mental hälsa, anpassningar. Att duplicera materialet skulle bara skapa underhållsbörda och förvirring.

Den verkliga skillnaden är **inramning**: Jobins KB är skriven för "jobbsökaren" ("Stresshantering **för arbetssökande**", "Motivation **under långtidssökande**"). STA-deltagare i Del 1-2 har ofta inte börjat söka jobb och är inte i den fasen — de rehabiliterar sig.

**Förslag (tre delar):**

1. **Korsreferens, inte duplicering.** Varje dag i STA-slingan (Dag 1-14) länkar till **befintliga** KB-artiklar och övningar med kort STA-kontextualisering. Dag 11 (Motivation) öppnar "Behåll motivationen under långtidssökande" med en intro: *"Den här texten är skriven för aktiva jobbsökare men principerna gäller dig redan idag."*

2. **Fyll luckorna med ~5 nya artiklar.** Teman där KB faktiskt saknar något:
   - Hard Talk — svåra samtal på jobbet (KB har bara intervju-kontext)
   - Att säga nej — gränssättning utan dåligt samvete
   - Återhämtning från utmattning (KB har förebyggande stress, inte recovery)
   - Fem faktorer för hållbar aktivitet (specifik metod, inte i KB)
   - Sömn när livet är ostrukturerat (KB nämner sömn men inte i rehabiliteringskontext)

3. **De interaktiva verktygen är det unika bidraget.** Sovdagbok, Arbetsdagbok och Karriärvägledningshäfte 1-3 är inte artiklar utan ifyllbara övningar. Lägg till motsvarande övningar i Övningar-sidan — där tillför STA-materialet något KB inte har alls.

**Vad det löser:** Deltagaren får relevant material direkt i sin dagsslinga utan duplicerad innehållsförvaltning. Konsulenten kan länka in befintliga artiklar i meddelanden istället för PDF-bilagor.

#### A2. Dagsslinga med riktig artikel-vy per dag
**Bakgrund:** Vår nuvarande mockup visar 14 dagsrutor i ett rutnät men inget händer vid klick. I sta-mappen har varje dag (Dag 1, Dag 2, Dag 3...) körschema + arbetsblad + ofta en PowerPoint.

**Förslag:** Varje dagsruta öppnar en artikel-vy med tre flikar:
- **Vad vi gör idag** (45–60 min läsbar genomgång, anpassad från körschemat)
- **Övning** (arbetsbladet, ifyllbart i portalen — sparas till deltagarens reflektioner)
- **Spara till mig själv** (kort reflektionsfält + känsla)

**Vad det löser:** Deltagaren kan göra övningen själv vid behov (frånvaro, kortare pass), och konsulenten ser i realtid vad som är gjort.

#### A3. Sömndagbok + Arbetsdagbok som riktiga digitala verktyg
**Bakgrund:** Sömndagboken (Del 1) och Arbetsdagböckerna (Del 3/4 — en dag, fem dagar, veckodagbok) finns idag som PDF.

**Förslag:** Bygg som komponenter (likt befintliga Diary/Wellness-modulerna). Inlägg knyts till STA-aktivitet, datum och en kort skala (1–5). Konsulenten ser sammanställd kurva.

**Vad det löser:** Tar bort manuell inmatning, ger trenddata för Del 3-uppföljning, kopplar deltagarens vardag till bedömningar (DOA/MOHOST).

#### A4. Karriärvägledningshäfte 1-3 som progressivt avlåst sektion
**Bakgrund:** Övningshäften som idag introduceras runt Dag 5 men sträcker sig in i Del 3.

**Förslag:** Visa hela vägledningsserien som en "tre-stegs-resa" på deltagarens översikt: Vem är jag → Vad kan jag → Vad vill jag. Stegen låses upp i takt med att deltagaren går framåt och fyller i.

**Vad det löser:** Sätter karriärvägledningen i ett tydligt sammanhang istället för en lösryckt övning.

#### A5. Förstärkt språkstöd som synlig switch — inte gömt CTA
**Bakgrund:** `sta/Del 1/Förstärkt språkstöd och kommunikationstöd/` listar arabiska, somaliska, tigrinja, dari, pashtu plus bildstöd, lättläst, förstorat material.

**Förslag:** Lägg till språkväljare i hero-baren (när deltagaren har en av dessa språk registrerade på sin profil). Visningen växlar mellan översatta texter och bildstödda versioner. Initialt: i18n-shells finns för dessa språk, faktisk översättning kan komma per modul.

**Vad det löser:** Tillgänglighet. Sänker tröskeln för deltagare som har språkbarriär.

### För konsulent-sidan

#### A6. Arbetsstations-bibliotek (Lindas / Arcus / Bank)
**Bakgrund:** I `sta/Del 2/Lindas/`, `Arcus Del 2 arbetsuppgifter/` och `Del 3/Bank AWC arbetsprövning/` finns 20+ konkreta arbetsstation-instruktioner — pallmontering, kvittoredovisning, vika kläder, orderplock bilverkstad m.fl. Var och en har ofta tillhörande AWC-blankett.

**Förslag:** Bygg ett "stationsbibliotek" som konsulenten kan filtrera (inriktning: administration/kundmottagning/lager/produktion) och tilldela en deltagare. När en station tilldelas knyts den befintliga AWC-mallen direkt.

**Vad det löser:** Idag måste konsulenten leta i mappar för att hitta rätt station-instruktion. En tilldelning blir 2 klick istället för 15 minuter.

#### A7. Arbetsprövnings-workflow med tre faser
**Bakgrund:** `sta/Del 3/Arbetsprövning/` har struktur i tre faser — inför / genomförande / efter — med 10+ specifika dokument (handledarutbildning, upptrappnings-mall, info till arbetsgivare, uppföljningsstödfrågor, åtgärdsplan vid utebliven).

**Förslag:** Bygg arbetsprövningen som ett guidat 3-stegs-workflow per deltagare. Konsulenten ser vilken fas hen är i och har alltid rätt mall framme. "Skicka info till arbetsgivare" → bifogar automatiskt `Arbetslivsresurs Arbetsprövning - till Arbetsgivare.pdf`.

**Vad det löser:** Konsulenten missar inte ett steg (typ glömmer skicka information om arbetsmiljöansvar till arbetsgivaren), och alla mallar är där de behövs.

#### A8. Skattningsformulär med rätt instrument per Del
**Bakgrund:** Idag visar konsulent-sidan bara "AWP", "DOA" som chips — utan att klargöra att Del 1 = DOA+WRI+MOHOST och Del 2-4 = AWP+AWC+MOHOST.

**Förslag:** Visa instrumentet med kort förklaring vid hover och låt skattningen ske direkt i portalen (formulär med samma struktur som de ifyllbara PDF:erna). Tidigare delars värden förifylls som jämförelseunderlag (MOHOST Del 2 visar Del 1-värden bredvid).

**Vad det löser:** Datasilo borta — skattningarna är sökbara, jämförbara och kan automatiskt mata Delredovisning.

#### A9. Delredovisning-generator från aktivitetsdata
**Bakgrund:** DR-mallarna är ifyllbara PDF:er utan struktur. Konsulenten skriver manuellt.

**Förslag:** Vid "Skapa delredovisning Del N" populeras utkastet automatiskt med:
- Aktiviteter genomförda (från `sta_activities`)
- Reflektioner (sammanställning av deltagarens egna ord)
- Skattningsresultat (från `sta_assessments`)
- Anpassningar (från `sta_enrollments.adaptations`)

AI sammanfattar i en strukturerad textmall som matchar PDF:en. Konsulent reviderar.

**Vad det löser:** Den största tidstjuven idag — DR tar ofta 1–2 timmar per deltagare per del. Med utkast: 15 minuter granskning.

#### A10. Åtgärdsplan vid utebliven arbetsprövning som väl synligt verktyg
**Bakgrund:** `Mall för Åtgärdsplan vid utebliven arbetsprövning.docx` ligger djupt i Del 3-mappen.

**Förslag:** Visa som ett "varningsläge" på konsulent-sidan: om en deltagare har varit i Del 3 över 4 veckor utan att anmäld arbetsplats är godkänd, blinka en flagga med direktlänk till åtgärdsplan-utkastet.

**Vad det löser:** Förebyggande — fångar deltagare som riskerar fastna i Del 3.

### Övriga insikter (mindre, men värda att notera)

- **Löpande schema 15 dagar** är troligen den nyare versionen av dagsslingan. Vi bör validera med leverantören vilken som är aktuell — sen referera bara till en.
- **"Internt system Zynca"** nämns i startsamtals-rutinen som dokumentationsplats. Portalen skulle kunna ersätta detta helt och hållet.
- **Två versioner av varje material** — med och utan logotyp. Konsulenten behöver bara en uppsättning i portalen, kan generera anpassad version vid behov.

---

## Del B — Jobin-data som komplementerar konsulentens STA-arbete

Konsulenten arbetar idag med en deltagare som bara existerar i AF-systemet plus dokumentation. Men deltagare som har Jobin-konto (kopplat via `linkStatus = 'linked'`) genererar **gigantiska mängder relevant data** redan i portalen — data som är direkt användbar i STA-bedömningarna men idag är osynlig för konsulenten.

### B1. Vad Jobin redan vet om en deltagare

| Jobin-modul | Data | Direkt relevans för STA |
|-------------|------|-------------------------|
| **CV-byggaren** | Arbetslivserfarenhet, utbildning, kompetenser, språk | Underlag för fokusyrke (Del 1), DOA-skattning, kompetenskartläggning |
| **Profile.desired_jobs** | Önskade jobbtitlar, branscher | Yrkesinriktning Del 3, matchning till arbetsprövningsplats |
| **Interest Guide (RIASEC)** | Realistic/Investigative/Artistic/Social/Enterprising/Conventional + Big Five | Direkt input till DOA + kompetenskartläggning. Säger något om vilken arbetsstation som passar (R-typ → lager/produktion, S-typ → kundmottagning, C-typ → administration) |
| **Skills Gap Analysis** | Kompetensgap mot drömjobb | Vad behöver utvecklas i Del 3, vilka utbildningsbehov inför Del 4 |
| **Intervjusimulator** | Inspelade intervjuer + AI-poäng på struktur, tydlighet, självpresentation | **AWP**-relevant — process- och kommunikationsfärdigheter (planering, uthållighet, social kommunikation) |
| **AI-team chat-historik** | Vad deltagaren själv har frågat coach-agenter om | Tematik: vad oroar, vad motiverar, vilka hinder upplevs. (Kräver explicit samtycke via `DataSharingSettings`) |
| **Dagbok** | Reflektioner, känslor, dagliga händelser | Underlag för delredovisning, signaler om mående |
| **Wellness** | Mood logs, energi, sömnskala | **MOHOST**-relevant: aktivitetsmönster, livsstrukturen. Tidiga signaler om risk |
| **Calendar** | Möten, bokningar, närvaro | Hur strukturerad är dagen? Närvaroriskanalys |
| **Saved jobs + spontanansökan** | Vad deltagaren själv kollat på, sökt eller skickat | Konkreta yrkesintressen, initiativförmåga, matchningar i Del 3-4 |
| **LinkedIn-profil** (om kopplad) | Professionellt nätverk, tidigare arbetsgivare | Potentiella arbetsprövningsplatser via deltagarens egna kontakter |
| **Onboarding-progress** | Hur självgående är deltagaren i portalen? | Indikator: behöver mycket guidning eller klarar sig själv |
| **Profile.adaptations** | Anpassningsbehov självrapporterade | Direkt input till `sta_enrollments.adaptations` |

### B2. Konkreta vinster för konsulenten

#### B2.1 Auto-fyllning av STA-dokument

| STA-dokument | Auto-fyllbar från Jobin |
|--------------|-------------------------|
| **Initial planering** | Yrkesintresse (`desired_jobs`), anpassningsbehov (`adaptations`), språk (`languageSupport`), startdata från CV |
| **Startsamtals-anteckning** | Förifylld kompetensöversikt från CV, RIASEC-resultat (om gjort), aktuella anpassningar |
| **Kompetenskartläggning** | Skills + erfarenheter från CV, intresseguide-resultat, ev. skills gap analysis |
| **Delredovisning Del 1** | Aktivitetsloggen + reflektioner från Diary + Wellness-trends + Interest Guide |
| **Delredovisning Del 2** | Allt ovan + AWP-skattningar från intervjusimulator-data + observerade beteenden |
| **Information från arbetsprövningsplats** | Företaget från sparade jobb / spontanansökan om matchning finns |

**Konkret exempel** — Anna börjar Del 1:
> Initial planering-utkastet visar redan: *"Anna har bakgrund som receptionist (3 år), önskar jobba med administration eller bibliotek/arkiv. RIASEC-profil: Conventional (8/12) + Social (7/12). Anpassning: lugna miljöer, kortare pass."*

Konsulenten klickar "se över utkast" och lägger till några rader istället för att börja från noll.

#### B2.2 Tidiga signaler ("early warning")

Konsulenten har idag ingen aning om hur deltagaren mår mellan möten. Jobin-data ger:

- **Wellness-trend som faller** (mood + energi nedåt 3+ dagar) → automatisk flagga: "Anna har låg energi senaste veckan — boka extra möte?"
- **Dagbok visar pessimistiska teman** (AI-sentiment-analys på egna reflektioner, anonymiserad) → "Anna har skrivit om ekonomisk stress 3 gånger"
- **Inaktivitet i portalen** > 5 dagar → "Anna har inte loggat in. Möjlig frånvarorisk."
- **AI-team-chattar tar upp ekonomi/familj/hälsa** (med samtycke) → "Anna har frågat AI-coachen om hur man pratar med chef om sjukfrånvaro"

Allt synliggörs i deltagardrawerns "Snabb status"-sektion.

#### B2.3 Matchningsstöd för yrkesinriktning Del 3

När det är dags att välja yrkesområde i Del 3 har portalen:
- **RIASEC-profil** som föreslår 3-5 yrkesinriktningar som passar (befintlig funktion i Interest Guide)
- **Skills gap** som visar avstånd till önskade jobb
- **Sparade jobb-historik** som visar vad deltagaren själv har visat intresse för

Konsulenten kan klicka "Föreslå yrkesinriktning" och får tre alternativ med dataunderlag.

#### B2.4 Skattningsstöd från objektiv data

- **AWP-process- och kommunikationsfärdigheter** kan delvis informeras av intervjusimulator-poäng (struktur, tydlighet, längd, tonläge)
- **MOHOST-aktivitetsutförande** kan informeras av Wellness-trends och dagboks-aktivitetsnivå
- **DOA-självskattning** kan jämföras med Interest Guide RIASEC + Skills Gap för att fånga inkonsekvenser ("Anna säger att hon är dålig på struktur men har högt Conventional-värde och stabilt schema i Calendar")

#### B2.5 Personligt arbetsplatsnätverk

Deltagarens egna sparade jobb + LinkedIn-kontakter + tidigare arbetsgivare = en lista av potentiella arbetsprövningsplatser som konsulenten kan föreslå istället för att leta från noll.

### B3. AI-utkast som blir mycket bättre

Den AI-veckosammanställning vi har idag använder bara aktivitetslogg + reflektion. Med tillgång till Jobin-data kan utkastet bli:

> *"Anna har genomfört dag 1–6 utan frånvaro. Hennes wellness-data visar stabilt mående tills igår då mood och energi dippade. Hon har skrivit i dagboken om ekonomisk oro. Intervjusimulatorn visar hög struktur men låg självpresentation — överväg modul 'Hard Talk' (Morgans föreläsning). RIASEC-profilen pekar mot Conventional+Social: administration eller kundmottagning skulle passa som inriktning Del 3."*

Det är så mycket rikare än vad vi kan generera utan Jobin-data.

### B4. Säkerhet och samtycke (icke-förhandlingsbart)

**GDPR + befintlig `DataSharingSettings` styr åtkomst:**

- **Open by default (utan särskilt samtycke):** profil, CV, aktiviteter i STA, närvaro
- **Kräver samtycke:** Wellness/mood, hälsa, dagbok, AI-team-chattar
- **Aldrig delat:** privata anteckningar, lösenord, betalningsinfo

**UX-principer:**
- I deltagardrawern markeras varje Jobin-datakälla med en `Delat`/`Privat`-badge
- "Begär åtkomst"-flöde när konsulenten vill se data som inte är delad — deltagaren får notis och kan godkänna eller neka
- Konsulenten ser ALDRIG råa dagbok-rader utan samtycke — bara aggregerad sentiment ("två veckor av övervägande positiva reflektioner")
- Audit-logg över vilken konsulent som sett vilka känsliga data och när

### B5. Risker att tänka på

| Risk | Mitigering |
|------|------------|
| Konsulenten blir lat och litar på AI/Jobin-data utan egen bedömning | AI-utkast markeras tydligt som utkast; konsulenten måste klicka "Granska" för att aktivera |
| Deltagaren känner sig "övervakad" | Transparent "Vad ser min konsulent?"-vy där deltagaren ser exakt vilken data som är delad |
| Felmatchning ger felaktiga slutsatser (t.ex. Wellness-dip pga semesterstress, inte STA-relaterat) | AI-utkast får aldrig vara final — alltid hand-redigerad innan inskick till AF |
| Manuellt tillagda deltagare har ingen Jobin-data | Det är okej. Drawer visar "Begränsad data — koppla Jobin-konto för fler insikter" |
| Samtycke återkallas mitt i Del 3 | Auto-rensning av cachade AI-utkast som baserades på den datan |

---

## Sammanfattning

**Materialinventeringen avslöjar tre stora vinster:**
1. Mycket deltagar-vänligt material (Morgans föreläsningar, kompendier, häften) som idag är osynligt i portalen.
2. Strukturerade workflows för arbetsprövning Del 3-4 som vi inte har modellerat alls än.
3. ~25 konkreta arbetsstationer som kan bli ett stationsbibliotek för Del 2 och Del 3.

**Jobin-data-integrationen ger den största hävstången:**
- Auto-fyllning av varje större STA-dokument
- Tidiga varningssignaler från mood/dagbok/inaktivitet
- Yrkesinriktningsförslag från RIASEC + skills gap + sparade jobb
- AI-utkast som är drastiskt mer användbara

**Rekommenderad prioritering:**
1. **Hög effekt, låg risk:** A1 (Morgans föreläsningar som artiklar), A2 (dagsslinga-artikelvy), B2.1 (auto-fyllning av delredovisning från befintlig data)
2. **Hög effekt, medel risk:** A6 (stationsbibliotek), A7 (arbetsprövningsworkflow), B2.3 (yrkesinriktningsförslag)
3. **Hög effekt, kräver samtycke:** B2.2 (early warning från wellness/dagbok), B2.4 (skattningsstöd från objektiv data)

Allt ovan förutsätter datamodellen i `docs/sta-pages-plan.md` plus utbyggnad av en `sta_external_data_links`-tabell som mappar STA-aktiviteter till befintliga Jobin-datakällor.
