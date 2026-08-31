# Underlag till AG2 — stödkalkylatorn

> **Vad det här dokumentet är:** research- och källunderlag inför byggandet av AG2, en funktion
> som visar en arbetskonsulent och en arbetsgivare vilka anställningsstöd som **kan vara aktuella**
> för en viss person och en viss anställning. Dokumentet täcker de fyra stödformer Mikael valt:
> Nystartsjobb, Introduktionsjobb, Lönebidrag/OSA, samt SIUS och stödperson.
>
> **Skrivet:** 2026-08-31, av research-agent mot Arbetsförmedlingens egna sidor (WebFetch, ingen
> sökmotor — sessionens sökbudget var slut). Sidorna som citeras nedan saknar synligt
> publicerings- eller uppdateringsdatum (kontrollerat på flera av dem, se noteringar per avsnitt) —
> **2026-08-31 är alltså datumet för hämtningen, inte ett datum AF själva anger för giltighet.**
>
> **⚠️ ALLA belopp, procentsatser och tidsgränser i det här dokumentet MÅSTE kontrolleras mot
> Arbetsförmedlingen innan de visas för en användare eller ett beslut fattas på dem.** Nivåer och
> takbelopp ändras årligen (statsbudget). Varje siffra nedan är märkt **belagt** (med URL) eller
> **ej belagt**. Bygg aldrig en produktionsvisning som visar ett uträknat kronbelopp direkt ur den
> här filen — se avsnittet "Datamodell" om hur belopp ska lagras i stället.
>
> **Detta är inte samma sak som premissgranskningen i CLAUDE.md** (det är ett kodbeslut som tas
> när AG2 faktiskt byggs) — det här dokumentet är underlaget den granskningen ska utgå från.

---

## 1. Nystartsjobb

**Källa:** https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/nystartsjobb (hämtad 2026-08-31, inget publiceringsdatum synligt på sidan)

### Vad stödet är
**Belagt.** "Anställningsstödet nystartsjobb är en ekonomisk ersättning som baseras på hur länge
personen har varit frånvarande från arbetslivet." I en mening för en arbetsgivare: du får en del av
din arbetsgivaravgift tillbaka när du anställer någon som stått länge utanför arbetsmarknaden.

### Vem det gäller (matchningsvillkor)
**Belagt**, med exakt citerade tröskelvärden:

| Grupp | Krav på frånvaro från arbetslivet |
|---|---|
| 20–24 år | Arbetslös på heltid minst **"6 av de senaste 9 månaderna"** |
| 25 år eller äldre | Arbetslös på heltid minst **"12 av de senaste 15 månaderna"** |
| Nyanländ, över 20 år | Arbetslös på heltid minst **"6 av de senaste 9 månaderna"** |
| Flykting/skyddsbehövande med uppehållstillstånd | Inom **max 3 år** i Sverige |
| EES-medborgares familjemedlem med uppehållskort | Inom **max 3 år** |
| Deltagare i etableringsprogram eller jobb- och utvecklingsgarantin | Räknas automatiskt kvalificerande |

**Vad som räknas som "frånvaro från arbetslivet":** inskriven arbetslös hos Arbetsförmedlingen,
deltagit i arbetsmarknadsprogram, haft sjuk-/rehabiliterings-/aktivitetsersättning, eller haft
försörjningsstöd under arbetslöshet. (Belagt, samma källa.)

**Krav vid beslutstillfället:** personen "måste vara inskriven på Arbetsförmedlingen vid
beslutstillfället". (Belagt.)

### Vad arbetsgivaren får
**Belagt, tre ersättningsnivåer** (procent av arbetsgivaravgiften, inte av bruttolönen):

- **1 × arbetsgivaravgiften** — 20–24 år med 6–24 månaders frånvaro; 25+ år med 1–2 års frånvaro;
  deltagare i jobb- och utvecklingsgarantin
- **2 × arbetsgivaravgiften** — 20 år eller äldre med 2–3 års frånvaro
- **2,5 × arbetsgivaravgiften** — 20 år eller äldre med 3+ års frånvaro, eller nyanländ

**Löneunderlagets tak:** "upp till 20 000 kronor per månad vid heltidsarbete" — deltid ger
proportionellt lägre underlag. (Belagt.) **Observera:** det här är ett underlagstak, inte
utbetalt belopp — ersättningen är en multipel av arbetsgivaravgiften på lönedelar upp till
20 000 kr/månad, inte 20 000 kr i sig.

**OBS för kalkylatorn:** sidan anger *multiplar av arbetsgivaravgiften*, inte en färdig kronsumma.
Den faktiska arbetsgivaravgiftens procentsats (som avgör slutbeloppet) finns inte på den här sidan
och är **ej belagt här** — den bestäms av Skatteverkets regler för arbetsgivaravgift, som i sig
varierar med den anställdes ålder. En färdig kalkyl kräver alltså två separata, årligen
föränderliga tal: arbetsgivaravgiftsprocenten och lönetaket 20 000 kr.

### Hur länge
**Belagt.**
- Upp till **1 år**: 20–24 år, eller deltagare i garantiprogram
- Upp till **2 år**: 25+ år, nyanlända, eller etableringsprogram-deltagare
- "Beslut om ersättning fattas som längst ett år i taget" — även en tvåårig rätt betalas ut i
  årsbeslut, inte som ett sammanhängande beslut.

### Vem ansöker, och hur
**Belagt.** Arbetsgivaren ansöker digitalt (kräver e-legitimation) eller på pappersblankett.
**"Anställningen får inte börja innan beslut om stöd för nystartsjobb har fattats."** Ansök
**minst tre veckor innan anställningen börjar**.

### Vad som ofta går fel
**Belagt**, samlat från sidans villkorslista:
- Personen får inte hyras ut till en annan arbetsgivare/annat organisationsnummer (utom
  bemanningsföretag)
- Inget distansarbete från utlandet
- Får inte anställa nära familj med >1/3 ägarandel (aktiebolag) eller familjeägt bolag
  (handelsbolag/enskild firma)
- Får inte ha sagt upp personal på grund av arbetsbrist de senaste 12 månaderna på arbetsplatsen
- Företagets ekonomi måste bedömas räcka för löneutbetalningarna — annars avslag
- Hela lönen måste betalas ut elektroniskt till den anställdas konto under hela stödperioden
- Månatlig deklaration till Skatteverket krävs; **180 dagar** efter arbetsmånadens slut att skicka
  in den
- Förändringar som kan påverka rätten till ersättning måste alltid anmälas

### Kombination med annat stöd
**Ej belagt** på den här sidan — ingen kombinationsregel med praktik/arbetsträning eller andra
stöd nämns. Kräver egen kontroll om AG2 ska varna för/tillåta kombinationer.

---

## 2. Introduktionsjobb

**Källa:** https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/introduktionsjobb (hämtad 2026-08-31, inget publiceringsdatum synligt)

> Introduktionsjobb ersatte **extratjänster** och **instegsjobb** 2023 (bekräftat av Mikael som
> domänexpert; **ej verifierat på AF:s nuvarande sida**, som bara beskriver dagens regelverk och
> inte historiken). Om AG2 ska visa historik eller migrera gammal data från de nedlagda formerna
> behövs en separat kontroll av vilka gamla ärenden som konverterades.

### Vad stödet är
**Belagt** (parafras, ingen exakt AF-mening citerad i utdraget): ekonomisk ersättning för att
anställa personer med etableringssvårigheter på grund av lång arbetslöshet eller att de nyligen
kommit till Sverige.

### Vem det gäller
**Belagt.** Personen ska vara arbetslös, anmäld som arbetssökande hos Arbetsförmedlingen, och
anställningen får inte redan ha börjat. Minst **ett** av följande ska vara uppfyllt:
- Deltar i **jobb- och utvecklingsgarantin**
- Deltagit i **jobbgaranti för ungdomar** i minst **200 dagar** med ersättning
- Nyanländ, 20 år eller äldre, deltar i eller har inom **senaste 12 månaderna** varit anvisad till
  etableringsprogrammet
- Nyanländ, 20 år eller äldre, fått uppehållstillstånd/uppehållskort som familjemedlem till
  EU/EES-medborgare inom **senaste 36 månaderna**

### Vad arbetsgivaren får
**Belagt, delvis.** **"80 procent av lönekostnaden, det vill säga bruttolön, sjuklön,
semesterlön och arbetsgivaravgifter."** **Inget tak i kronor per dag/månad angavs i den hämtade
sidtexten** — det skiljer introduktionsjobb från nystartsjobb och lönebidrag, som båda har ett
uttryckligt 20 000 kr/månad-tak. **Detta måste dubbelkollas direkt mot AF innan kalkylatorn
antar att introduktionsjobb saknar tak** — det är ovanligt att ett anställningsstöd är helt
takfritt, och det är mer sannolikt att sidan har ett tak som inte fångades av utdraget än att
det verkligen saknas ett. Flagga som **ej fullständigt belagt**.

### Hur länge
**Belagt.** Upp till **12 månader** initialt, med möjlig förlängning. Maximal total tid:
**"tjugofyra månader"** (24 månader).

### Vem ansöker, och hur
**Belagt.** Arbetsgivaren gör en **intresseanmälan**. Arbetsförmedlingen kontaktar arbetsgivaren
inom **3 arbetsdagar**. Ett beslutsdokument krävs innan anställningen börjar, och tas fram
gemensamt vid möten (samma mönster som lönebidrag nedan).

### Vad som ofta går fel
**Belagt.**
- Arbetsgivaren måste vara skatteregistrerad och får inte ha skatteskuld över **10 000 kr**
- Ingen uppsägning på arbetsplatsen på grund av arbetsbrist de senaste 12 månaderna
- Den anställda får inte ha väsentligt inflytande (styrelseledamot, delägarskap etc.)
- Distansarbete från utlandet är förbjudet
- Förändringar som påverkar ersättningsrätten ska anmälas **omgående**

### Kombination med annat stöd
**Belagt.** Introduktionsjobb "kan kombineras med studier inriktade mot yrket, kompletterande
gymnasieutbildning eller studier i svenska" — men arbetet måste vara den huvudsakliga delen av
tiden. Ingen uttrycklig regel om kombination med praktik/arbetsträning eller med de andra tre
stödformerna i det här dokumentet.

---

## 3. Lönebidrag och OSA

### 3a. Lönebidrag (tre former)

**Källa:** https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/lonebidrag (hämtad 2026-08-31, inget publiceringsdatum synligt)

AF delar upp lönebidrag i **tre separata faktablad**, länkade som PDF:er från sidan (URL:erna
innehåller en tidsstämpel som del av filnamnet och är därför inte stabila att citera här — hämta
dem på nytt från lönebidrags-sidan när AG2 byggs):
1. **Lönebidrag för anställning**
2. **Lönebidrag för utveckling i anställning**
3. **Lönebidrag för trygghet i anställning**

**Detaljskillnaderna mellan de tre formerna (exakta villkor per form) finns i faktabladen, inte
på huvudsidan, och är därför EJ BELAGT i den här omgången** — huvudsidan beskriver dem bara som
tre namngivna alternativ utan att skilja ut villkor per form. **Innan AG2 kan matcha rätt
lönebidragsform måste dessa tre PDF:er hämtas och läsas separat.**

### Vad stödet är
**Belagt** (gemensamt för de tre formerna): ekonomisk ersättning till arbetsgivaren för
lönekostnader vid anställning av en person med "en funktionsnedsättning som medför nedsatt
arbetsförmåga i relation till det arbete den anställde utför".

### Vem det gäller
**Delvis belagt.** Grundvillkoret (funktionsnedsättning → nedsatt arbetsförmåga i förhållande till
det specifika arbetet) är citerat ordagrant. **De specifika villkoren per lönebidragsform (vad som
skiljer "utveckling", "anställning" och "trygghet" åt) är EJ BELAGT** — de ligger i faktabladen.

### Vad arbetsgivaren får
**Belagt (gemensamt tak, procentsatsen som avgör faktiskt belopp saknas i den hämtade texten):**
"Du kan få bidrag för den del av lönekostnaden som inte är högre än en bruttolön på **20 000
kronor per månad** för heltid." Ett tilläggsbidrag för utvecklingsinsatser kan tillkomma
("utvecklingsbidrag").

> **Luckan om procentsatsen är delvis fylld 2026-08-31 — men av en annan sorts källa, och det
> spelar roll för hur den får användas.**
>
> **Uppgift från Mikael Glännström, arbetskonsulent** (inte hämtad från Arbetsförmedlingen, inte
> verifierad mot ett dokument):
>
> 1. **Regeln:** bidraget sätts **individuellt**, men uppgår till **max 80 procent** av
>    bruttokostnaden för personalen, upp till taket ovan.
> 2. **Erfarenheten:** i praktiken landar lönebidraget på **ungefär 30–50 procent av lönen,
>    beroende på hur hög lönen är**.
>
> **De två är inte samma sorts påstående, och portalen får aldrig blanda ihop dem.** Punkt 1 är
> en regel med ett tak. Punkt 2 är en erfarenhetsbaserad observation av hur besluten brukar falla
> — den är inte en regel, inte en garanti, och får **aldrig** visas som ett förväntat utfall eller
> räknas fram till ett belopp.
>
> **Hur det får användas i AG2:** punkt 1 kan visas som en ram ("bidraget beslutas individuellt
> och kan uppgå till högst 80 % av bruttokostnaden, upp till taket"). Punkt 2 hör hemma i
> konsulentens eget underlag när hon ska sätta förväntningar hos en arbetsgivare — formulerad som
> en erfarenhet, med den utskriven: *"i praktiken brukar det landa lägre; Arbetsförmedlingen
> beslutar individuellt"*. Den ska **inte** finnas i något en arbetsgivare läser som ett besked.
>
> **Kvarstår att belägga hos källan:** vad som exakt skiljer lönebidragsformerna *utveckling*,
> *anställning* och *trygghet* åt, och hur graden av nedsatt arbetsförmåga översätts till en
> procentsats. Det ligger i AF:s faktablad, som inte gick att hämta i den här omgången.

### Hur länge
**Belagt.** Första beslutet: **max 1 år**. Nya perioder är möjliga så länge behovet av
arbetsplatsanpassning kvarstår — ingen absolut bortre gräns angiven i den hämtade texten.

### Vem ansöker, och hur
**Belagt.** Arbetsgivaren gör en **intresseanmälan**. **"Anställningen får inte börja innan
beslut om lönebidrag har fattats."** Process: 1) intresseanmälan → 2) kontakt inom **3
arbetsdagar** → 3) utredning och behovsbedömning → 4) uppföljning efter några månader.

### Vad som ofta går fel
**Belagt.**
- Hela lönen ska betalas ut elektroniskt under hela bidragsperioden
- Förändringar som påverkar bidragsrätten ska anmälas omgående — annars uppstår återbetalningsskyldighet
- Får inte samtidigt få annan ersättning för samma anställning
- Den anställda får inte flyttas till en annan arbetsgivare (utom bemanningsföretag)
- Arbetsplatsen måste uppfylla arbetsmiljökrav
- Arbetsgivaren måste följa beslutets villkor och dokumenterade anpassningar

### Kombination med annat stöd
**Belagt (begränsning):** kan **inte** kombineras med annan ersättning för samma anställning.
Ingen ytterligare kombinationsregel (praktik/arbetsträning) nämnd på sidan.

---

### 3b. OSA — Skyddat arbete hos offentlig arbetsgivare

**Källa:** https://arbetsformedlingen.se/for-arbetssokande/extra-stod/stod-a-o/skyddat-arbete-hos-offentlig-arbetsgivare
(hämtad 2026-08-31, inget publiceringsdatum synligt)

**Viktig skillnad mot de tre andra stödformerna:** OSA hittades **inte** i AF:s
arbetsgivar-sidor under "kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen" — flera URL-gissningar
gav 404 där (`skyddat-arbete-hos-offentlig-arbetsgivare-osa`, `skyddat-arbete-offentlig-arbetsgivare`,
`osa`, m.fl.), och sidan finns i stället under AF:s **arbetssökande-sida**, i A–Ö-listan över stöd
(`/for-arbetssokande/extra-stod/stod-a-o`). Det kan spegla att OSA administrativt är en form av
lönebidrag riktad specifikt mot offentliga arbetsgivare (kommun, region, statlig myndighet), snarare
än ett eget ansökningsflöde för privata arbetsgivare — **detta är min tolkning, inte belagt av
källan**, och bör kontrolleras muntligt med Arbetsförmedlingen eller mot deras
arbetsgivar-sida för offentlig sektor specifikt, som jag inte lyckades hitta.

### Vad stödet är
**Belagt** (parafras): ett tidsbegränsat, anpassat arbete för personer med
funktionsnedsättning, där arbetsgivaren samtidigt får ett lönebidrag.

### Vem det gäller
**Belagt**, minst ett av:
- **"Du har en kognitiv funktionsnedsättning eller har nedsatt arbetsförmåga på grund av
  missbruks- eller beroendeproblem"**
- Rätt till insatser enligt lagen om stöd och service till vissa funktionshindrade (LSS)
- **"Du har inte jobbat tidigare eller har varit borta från arbetslivet under lång tid på grund
  av svår psykisk sjukdom"**

Personen ska dessutom vara inskriven som arbetssökande hos Arbetsförmedlingen.

### Vad arbetsgivaren får
**EJ BELAGT.** Källan säger bara "Den som anställer dig får samtidigt ett bidrag till din lön" —
**ingen procentsats eller kronbelopp anges på den här sidan.** Det är rimligt att anta att samma
20 000 kr/månad-tak som lönebidrag gäller (OSA administreras ofta som en lönebidragsvariant), men
det är en **gissning, inte en källa**, och får inte skrivas in i kalkylatorn som fakta.

### Hur länge
**Belagt.** "Du kan ha ett skyddat arbete i upp till **12 månader**", förlängningsbart vid
fortsatt behov.

### Vem ansöker, och hur
**Belagt.** Ansökan sker via Arbetsförmedlingen, inte direkt av arbetsgivaren. Bedömning och
beslut av Arbetsförmedlingen krävs innan anställningen börjar.

### Vad som ofta går fel / kombination
**Ej belagt** — inget om detta i den hämtade texten.

---

## 4. SIUS och stödperson

**Källa:** https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/sarskild-stodperson-for-introduktions--och-uppfoljningsstod-sius
(hämtad 2026-08-31, inget publiceringsdatum synligt)

### Vad stödet är
**Belagt.** "Särskild stödperson för introduktions- och uppföljningsstöd, SIUS, är ett stöd till
arbetssökande med nedsatt arbetsförmåga" — en av Arbetsförmedlingens egna handläggare/coacher
stöttar personen praktiskt under introduktionen på arbetsplatsen.

**Viktig skillnad mot de andra tre stödformerna:** SIUS är **inte ett ekonomiskt stöd**. Det är en
**person** (en arbetsförmedlare specialiserad på introduktionsstöd), inte pengar. Det här har
konsekvenser för datamodellen — SIUS kan inte representeras som ett belopp eller en procentsats
över huvud taget, bara som "tillgängligt/inte tillgängligt" plus omfattning i tid.

### Vem det gäller
**Belagt.** Personen ska ha nedsatt arbetsförmåga på grund av en funktionsnedsättning eller ett
hälsotillstånd, och ett behov av att öva arbetsuppgifter och andra arbetsrelaterade färdigheter.

### Vad arbetsgivaren/personen får
**Belagt.** En namngiven stödperson, inte pengar: "SIUS roll är ofta att finnas tillgänglig för
arbetssökande och arbetsgivare men det kan också innebära att arbeta bredvid den arbetssökande
under en tid." Arbetsgivaren behåller det fulla ansvaret för arbetsledning och introduktion.
**Ingen extra kostnad utöver lönen.**

### Hur länge
**Belagt, två separata tidsramar:**
- Introduktionsstöd: **max 6 månader**
- Uppföljningsstöd under anställningen: **minst 12 månader**

### Vem ansöker, och hur
**Belagt.** Arbetsgivaren kontaktar Arbetsförmedlingen. En bedömning görs, därefter en
överenskommelse mellan Arbetsförmedlingen, arbetsgivaren och den arbetssökande om omfattning och
upplägg för introduktionen.

### Vad som ofta går fel
**Belagt (ansvarsfördelning, inte "misstag"):** arbetsgivaren har fullt ansvar för arbetsmiljö
enligt arbetsmiljölagen, arbetsorganisation och introduktion av den nyanställda — SIUS-personen
ersätter inte arbetsgivarens eget ansvar.

### Kombination med annat stöd
**Ej belagt** i den hämtade texten. Eftersom SIUS är en personresurs snarare än en ekonomisk
ersättning finns det ingen uppenbar anledning att den skulle utesluta lönebidrag, OSA,
nystartsjobb eller introduktionsjobb — men det är **min bedömning, inte en AF-källa**, och ska
kontrolleras innan kalkylatorn tillåter kombinationer.

---

## 5. Sammanfattande jämförelsetabell

| | Nystartsjobb | Introduktionsjobb | Lönebidrag | OSA | SIUS |
|---|---|---|---|---|---|
| Typ av stöd | Andel av arbetsgivaravgift | 80 % av lönekostnad | Individuellt, max 80 % av bruttokostnad upp till taket ¹ | Bidrag (belopp ej belagt) | Personstöd, ej pengar |
| Lönetak/underlag | 20 000 kr/mån (belagt) | Ej belagt | 20 000 kr/mån (belagt) | Ej belagt | – |
| Längd | 1–2 år | 12 mån, max 24 mån | Max 1 år/beslut, förlängningsbart | Upp till 12 mån, förlängningsbart | 6 mån intro + 12 mån uppföljning |
| Kräver beslut före start | Ja | Ja | Ja | Ja | Ej explicit belagt, men överenskommelse krävs |
| Vem ansöker | Arbetsgivaren | Arbetsgivaren (intresseanmälan) | Arbetsgivaren (intresseanmälan) | Via Arbetsförmedlingen | Arbetsgivaren kontaktar AF |
| Målgrupp | Långtidsarbetslösa, nyanlända | Långtidsarbetslösa, nyanlända, unga | Funktionsnedsättning → nedsatt arbetsförmåga | Kognitiv funktionsnedsättning, missbruk, LSS, psykisk sjukdom | Nedsatt arbetsförmåga, introduktionsbehov |

¹ **Uppgift från Mikael Glännström, arbetskonsulent** — inte hämtad från Arbetsförmedlingen och
inte verifierad mot dokument. Han uppger också att bidraget **i praktiken brukar landa på ungefär
30–50 % av lönen** beroende på lönenivå. **Det talet är en erfarenhet, inte en regel**, och får
aldrig visas som ett förväntat utfall eller räknas fram till ett belopp — se avsnitt 3.

---

## 6. Förslag på datamodell

**Princip, i linje med projektets absoluta regel:** kalkylatorn **matchar och föreslår**, den
**räknar aldrig ut och visar aldrig ett kronbelopp**. Varje förslag ska landa i formuleringen
*"det här stödet kan vara aktuellt — kontrollera med Arbetsförmedlingen"* plus en länk till
respektive AF-sida ovan.

### 6.1 Fält om personen

| Fält | Typ | Art. 9-käns­lighet | Kommentar |
|---|---|---|---|
| `arbetslos_sedan` (datum) | date | Nej | Grund för nystartsjobb/introduktionsjobb-tröskelvärden |
| `alder` | int (härledd ur personnummer/födelsedatum, redan i profilen) | Nej | Flera tröskelvärden är åldersberoende (20, 24, 25 år) |
| `ar_nyanland` + `uppehallstillstand_datum` | bool + date | Nej* | *Uppehållsstatus är känsligt men inte hälsodata — bedöm separat mot art. 9, men det är inte samma kategori som funktionsnedsättning |
| `deltar_i_etableringsprogram` | bool | Nej | |
| `deltar_i_jobb_och_utvecklingsgaranti` | bool | Nej | |
| `deltar_i_ungdomsgaranti_dagar` | int | Nej | Introduktionsjobb kräver ≥200 dagar |
| `har_funktionsnedsattning_som_paverkar_arbetsformaga` | bool | **Ja — art. 9** | Grund för lönebidrag, OSA, SIUS. **Får aldrig lämna portalen till en arbetsgivare.** Kalkylatorn får använda fältet för att avgöra VILKA stöd som ska föreslås, men output till arbetsgivaren ska aldrig avslöja att just detta var skälet — annars röjs hälsodata indirekt. |
| `funktionsnedsattning_typ` (kognitiv / missbruk / psykisk sjukdom / LSS-berättigad / fysisk) | enum | **Ja — art. 9** | Behövs för att skilja lönebidrag/OSA/SIUS-varianter åt, men är extra känslig — helst bara lagrad hos konsulenten, aldrig visad rakt av i ett arbetsgivargränssnitt |
| `anpassningsbehov_beskrivning` | text | **Ja — art. 9 (troligen)** | Fritext om hälsa/funktionsnedsättning räknas som art. 9-data även om den inte har en diagnoskod. Behandla som känslig by default. |
| `inskriven_hos_af` (bool) + `inskrivningsdatum` | bool + date | Nej | Nödvändigt villkor för samtliga fyra stöd |

**Konsekvens för UI:** en arbetsgivarvänd vy av kalkylatorn ska aldrig rendera
`funktionsnedsattning_typ` eller `anpassningsbehov_beskrivning` rakt av. Konsulentens egen vy kan
visa dem, eftersom konsulenten redan har laglig grund (stöduppdraget) för att se dem — samma
gränsdragning som DESIGN.md redan gör mellan deltagarvy och konsulentvy.

### 6.2 Fält om platsen/anställningen

| Fält | Typ | Kommentar |
|---|---|---|
| `arbetsgivartyp` (privat / kommun / region / statlig myndighet) | enum | Avgör om OSA över huvud taget är relevant (offentlig arbetsgivare) |
| `sysselsattningsgrad` (heltid/deltid, %) | int | Lönetak är angivet för heltid, proportionerligt för deltid |
| `anstallningens_planerade_startdatum` | date | Avgör om det ännu är möjligt att hinna få beslut före start — **samtliga fyra stöd kräver beslut/överenskommelse innan anställningen börjar** |
| `organisationsnummer` | string | Behövs för AF:s egna kontroller (skatteskuld, tidigare uppsägningar) — kalkylatorn kan inte verifiera dessa själv, bara påminna om att AF kommer göra det |
| `har_sagt_upp_personal_senaste_12_man` | bool (arbetsgivarens eget svar) | Diskvalificerande för nystartsjobb och introduktionsjobb om sant |
| `planerad_arbetstranings_eller_praktikperiod_forst` | bool | Relevant för ev. kombinationsfrågor — men eftersom kombinationsreglerna till stor del är **ej belagda** i det här underlaget, bör kalkylatorn INTE hårdkoda antaganden om kombinerbarhet förrän det är verifierat per stödpar |

### 6.3 Hur ett förslag ska se ut

**Ett matchningssvar per stödform, aldrig ett totalbelopp:**

```json
{
  "stodform": "nystartsjobb",
  "bedomning": "kan_vara_aktuellt",
  "grund": ["arbetslos_25plus_over_12_av_15_manader"],
  "text": "Nystartsjobb kan vara aktuellt för den här anställningen. Kontrollera villkoren och ansök hos Arbetsförmedlingen innan anställningen börjar.",
  "lank": "https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/nystartsjobb",
  "kraver_beslut_fore_start": true,
  "ansokningsansvarig": "arbetsgivaren"
}
```

Fält som **aldrig** ska finnas i det här svaret: `belopp`, `procent`, `kronor_per_manad`,
`besparing`. Om en siffra någonsin ska visas (se 6.4) ligger den i ett separat, klart uppmärkt
datalager — inte i matchningssvaret.

`bedomning` bör ha minst tre lägen, inte bara sant/falskt — i linje med regeln om att ett tomt
fält inte är en nolla:
- `kan_vara_aktuellt` — villkoren verkar uppfyllda utifrån vad som är ifyllt
- `for_lite_underlag` — obligatoriska fält saknas för att avgöra (t.ex. arbetslöshetsdatum saknas)
- `troligen_inte_aktuellt` — ett känt diskvalificerande villkor är uppfyllt (t.ex. uppsägning
  senaste 12 månaderna)

### 6.4 Var beloppen ska bo, om de någonsin visas

**Aldrig hårdkodat i en komponent eller i matchningslogiken.** Förslag: en egen datafil,
t.ex. `client/src/data/anstallningsstodBelopp.ts`, med en post per belopp:

```ts
export const ANSTALLNINGSSTOD_BELOPP = [
  {
    stodform: 'nystartsjobb',
    faltnamn: 'lonetak_heltid_kr_per_manad',
    varde: 20000,
    kalla: 'https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/nystartsjobb',
    hamtad: '2026-08-31',
    giltigt_fran: null, // ej belagt vilket år beloppet gäller från — kontrollera vid nästa uppdatering
  },
  // ...
] as const;
```

Varje post bär **källa och hämtningsdatum**, aldrig bara ett tal. En CI-grind (i linje med
`lint:schema`/`lint:links`-mönstret som redan finns i projektet) skulle kunna kräva att varje post
i den här filen har både `kalla` och `hamtad` ifyllda — men det är ett förslag för
implementationsfasen, inte något som byggts här.

**Rekommendation:** även om datamodellen tillåter att lagra och visa belopp, bör den **första**
versionen av AG2 medvetet avstå — visa bara matchning + länk till AF, som avsnitt 6.3 beskriver.
Belopp är den del av det här underlaget som är svagast belagd (se lucka i lönebidrag/OSA nedan),
och att visa fel belopp är värre än att inte visa något alls.

---

## 7. Kvarstående luckor — vad som INTE gick att belägga

1. **Lönebidragets faktiska procentsats.** Sidan anger ett lönetak (20 000 kr/mån) men inte hur
   stor andel av den lönekostnaden som täcks — det ligger sannolikt i de tre PDF-faktabladen
   (lönebidrag för anställning / utveckling / trygghet), som inte hämtades i den här omgången.
2. **OSA:s ersättningsbelopp** — källan säger bara att "arbetsgivaren får ett bidrag", utan
   procentsats eller kronbelopp.
3. **Introduktionsjobbets eventuella kronbelopp/tak** — sidan angav bara "80 % av lönekostnaden"
   utan tak; jag bedömer det som osannolikt att det verkligen saknar tak, men det gick inte att
   bekräfta i den hämtade texten.
4. **Villkoren som skiljer de tre lönebidragsformerna åt** (anställning / utveckling / trygghet)
   — de ligger i separata PDF-faktablad som inte hämtades.
5. **Kombinationsregler** mellan de fyra stödformerna, och med praktik/arbetsträning — inget av
   det hämtade materialet tar upp detta uttömmande.
6. **Vilket år** de citerade beloppen (20 000 kr/mån) gäller från. AF:s sidor visar inget
   publicerings- eller uppdateringsdatum, vilket i sig är värt att notera: det går inte att se på
   sidan om 20 000-kronorsuppgiften är från i år eller flera år gammal utan att jämföra mot en
   arkiverad version eller fråga AF direkt.
7. **OSA:s exakta plats i AF:s organisation för arbetsgivare** — den saknas helt i
   arbetsgivar-sektionen av webbplatsen och hittades bara via arbetssökande-sidans A–Ö-lista.
   Det är möjligt att det finns en renodlad arbetsgivarsida för offentlig sektor som inte
   hittades med de sökvägar som prövades.

## 8. Sidor som inte gick att komma åt

- Flera gissade URL:er för en arbetsgivarriktad OSA-sida gav HTTP 404 (se lista i avsnitt 3b).
- AF:s fritextsök (`/sok`) renderas med JavaScript och gav inga läsbara sökträffar via WebFetch.
- Externa sökmotorer (Google, Bing, DuckDuckGo) gick inte att använda för att hitta AF-sidor:
  Google krävde samtyckesflöde, DuckDuckGo visade en captcha, och Bing gav uppenbart felaktiga
  träffar (irrelevanta resultat om stränder i Italien).
- De tre lönebidrags-PDF:erna (faktablad) hämtades inte — deras URL:er innehåller en
  tidsstämpelparameter som gör dem obekväma att hårdlänka till i det här dokumentet; hämta dem på
  nytt direkt från lönebidrags-sidan när de behövs.

## 9. Källförteckning

| Stödform | URL | Hämtad |
|---|---|---|
| Nystartsjobb | https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/nystartsjobb | 2026-08-31 |
| Introduktionsjobb | https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/introduktionsjobb | 2026-08-31 |
| Lönebidrag | https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/lonebidrag | 2026-08-31 |
| OSA (skyddat arbete hos offentlig arbetsgivare) | https://arbetsformedlingen.se/for-arbetssokande/extra-stod/stod-a-o/skyddat-arbete-hos-offentlig-arbetsgivare | 2026-08-31 |
| SIUS | https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/sarskild-stodperson-for-introduktions--och-uppfoljningsstod-sius | 2026-08-31 |
| Översikt anställningsstöd | https://arbetsformedlingen.se/for-arbetsgivare/anstallningsstod | 2026-08-31 |
| A–Ö-lista, extra stöd (arbetssökande) | https://arbetsformedlingen.se/for-arbetssokande/extra-stod/stod-a-o | 2026-08-31 |
