# Designgranskning av jobin.se

**Datum:** 2026-05-10
**Granskare:** *Världsklass-designer-perspektiv* — referensramen är Headspace, Calm, Klarna, Spotify, Linear, Notion. Designens uppdrag är att tjäna en utsatt målgrupp, inte att imponera.
**Underlag:** 75 audit-screenshots från produktion (desktop + mobil)
**Format:** Strategisk rapport. Inga kodförändringar, inga fix-listor.

---

## Övergripande intryck

Det finns ett **modernt grundutförande** här. Sidobarens hub-struktur är pedagogisk. Översikten andas. Färgsystemet (5 pasteller) är väl tänkt. Tillgänglighet (44px touch-targets, fokusringar, kontrast) verkar vara prioriterat. Detta är ett portal-bygge som **skiljer sig positivt** från svenska myndighets- och socialtjänst-portaler — där reser jobin.se en kvalitetsribba.

Men: portalen är **i tre lägen samtidigt.** Hub-landningssidorna (Översikt, Söka jobb, Karriär, Resurser, Min vardag) är *Headspace-aktigt lugn*. Underliggande verktygssidor (CV, LinkedIn-optimering, Lön & Förhandling, Karriär) är *Linear-aktigt tools-orienterade*. Empty-states och hjälp-sidor är *Bootstrap-2018-aktigt funktionella*. Det är tre olika produkter som råkar dela header.

**Den största designutmaningen är inte färg eller typografi. Det är att designen tappar sin emotionella ton när användaren går djupare in i portalen.** Det är där detta kommer att skriva sig själv som "ännu en svensk myndighetsportal" snarare än "verktyget som hjälpte mig genom min svåraste tid".

---

## 1. Identitetsproblemet: Vad VILL portalen vara?

### Observation
Login (`02-login.png`) sätter ett tydligt löfte: *"Jobin — Din väg till nytt jobb"*. Det är personligt, varmt, lugnt. Logotypen är en mjuk grön kub. Hela formuläret andas Headspace.

Register (`03-register.png`) bryter omedelbart mot detta löfte. En annan logotyp (rund, pixelig "JOBIN" med ljusstrålar — 2014-aktigt). Tonen blir generisk SaaS-onboarding.

Översikten (`11-hub-oversikt.png`) återupprättar Headspace-känslan: mjuk mint-hero, "Välkommen tillbaka", "Vad vill du göra idag?".

Söka jobb-huben (`12-hub-jobb.png`) byter helt skepnad — full persika-hero, "HUB · SÖKA JOBB", kall typografisk struktur. Det skriker "verktygsapp", inte "stöd".

Knowledge Base (`50-knowledge-base.png`) introducerar ännu en estetik: solida mörkblå sektionsbanderoller, kategori-kort med dubbla badges, tät informationsdensitet. Det är en helt annan produkt.

### Min diagnos
Portalen har **ingen central designprincip om vad den ÄR** — bara om vad den *gör*. DESIGN.md beskriver fina implementationsregler (hub-färger, 4px vänsterkant, pasteller), men inget om **tonen**. Resultatet är att 5 olika designers (eller 5 olika dagar för samma designer) har gjort 5 olika sidor som råkar dela samma färgpalett.

### Rekommendation
Skriv en **Design Manifesto** som första kapitel i DESIGN.md, FÖRE färgsystemet:

> **Jobin är inte en jobbportal. Det är en följeslagare genom en svår tid.**
> Allt vi designar ska kännas som det är skrivet av en lugn, kunnig vän som har all tid i världen att hjälpa dig. Aldrig som en LinkedIn-recruiter. Aldrig som ett myndighetsformulär. Aldrig som en gamification-app.

Konkretisera sedan vad detta betyder visuellt:
- **Inga prestation-mätningar i hjälteposition** — t.ex. "12 av 50 ansökningar" hör inte hemma över fold.
- **Mer mellanrum, färre data-points per skärm** — målgruppen kämpar med kognitiv belastning.
- **Tonläget i copy är obrutet vänligt** — "Du har inga ansökningar än" är OK; "0 aktiva ansökningar" är inte OK.

Detta löser nästan alla andra problem nedan.

---

## 2. Hjältesektionen — det stora missförståndet

### Observation
DESIGN.md säger "neutral grå hero på alla utom Översikt". Verkligheten visar **fyra hub-färgade hjältesektioner** (`12-hub-jobb`, `13-hub-karriar`, `14-hub-resurser`, `15-hub-vardag`) plus en lila-mint Översikt. Det är fem olika "starter".

På underliggande sidor (`23-applications`, `35-linkedin`, `36-salary`) blir hjältesektionen **neutralt grå** — där följer den DESIGN.md.

### Min åsikt
**Den nuvarande implementationen är estetiskt bättre än DESIGN.md föreskriver, men inkonsekvensen är problemet.** Hub-färgade hjältesektioner ger emotionell signal: "Du är på Karriär-sidan, här är det rosa och det betyder eftertanke". Det fungerar.

Men sedan landar användaren på `/skills-gap-analysis` (under Karriär-huben) och möts av en neutralt grå header utan rosa accent. Hub-tillhörigheten *försvinner*. Och så landar de på `/career` — där är hela hjältesektionen rosa igen. Sidor inom samma hub har olika hjälte-stilar.

### Rekommendation
**Två tydliga lägen, inga kompromisser:**

**Läge A — Hub-landningssidor** (`/oversikt`, `/jobb`, `/karriar`, `/resurser`, `/min-vardag`):
Full pastell-hero i hub-färgen. Stor titel. Mjuk gradient-glow tillåts som dekorativt lager (inte i knappar). Detta är "ankommandet" till en zon.

**Läge B — Verktygssidor inom hub** (allt under hub-landningen):
Neutral grå header med 4px vänsterkant i hub-färgen (som DESIGN.md säger). Detta är "arbetet i zonen" — verktyget ska inte tävla med innehållet.

**Skriv om DESIGN.md** så hub-landningssidor får sin egen sektion: "Hub-hero: full pastell-bakgrund, stor titel, dekorativ gradient tillåten."

Bonus: tag bort "HUB · SÖKA JOBB"-eyebrow-texten på hub-headers. Den är teknisk och tar plats. Användaren VET att de är på en hub eftersom sidobaren och URL säger det. Lita på sammanhanget.

---

## 3. Färgsystem — bra grund, men fördelningen är fel

### Observation
Career-sidan (`30-career.png`) har **fyra olika pastellfärger på KPI-kort i samma vy**: mint, grön, persika, lavendel. Det är konfetti, inte hierarki.

Översikten har **fyra hub-färger på samma sida** (en per HubCard). Det är medvetet och fungerar — där SKA användaren se alla zoner samtidigt.

Knowledge Base har **engelska tagg-badges** (Komma igång, Karriärväxling) i pastellfärger, men kategorititel-banderoller i solid mörkblå. Två färgspråk på samma sida.

Min vardag-huben (`60-wellness.png`) har lavendel-pasteller i innehållet, men "Spara reflektion"-knappen är så ljus lavendel att den knappt syns. Den ska vara solid `--c-solid`.

### Min åsikt
**60-30-10-fördelningen i DESIGN.md är korrekt principiellt men följs inte.** I praktiken är det 40-40-20: för mycket pastell, för lite neutral, för lite solid accent.

Jämför med Headspace: 70% off-white canvas, 25% en (1) hub-färg som mjuk pastell, 5% solid accent på CTA. Resultat: lugn, navigerbar, visuell hierarki utan ansträngning.

Career-sidans 4-färgade KPI-grid borde vara EN hub-färg (rosa, eftersom det är Karriär-huben). Differentieringen mellan "lediga jobb" / "ökar" / "som senast" / "dagar i anställning" ska komma från typografi och ikon — inte från fyra olika pasteller.

### Rekommendation
**Lägg till en regel i DESIGN.md:**
> **En sida = en hub-färg.** Alla pastell-element på en sida (KPI-kort, sektionsbakgrunder, ikon-tiles) använder samma hub-färg. Variationen kommer från intensitet (50/200/700) och ikon, inte från olika hubars pasteller.
>
> *Undantag: Översikt-sidan, där 4 hub-färger samexisterar för att visa zoner.*

Detta löser Career, Skills Gap, Personal Brand, Salary i ett slag.

---

## 4. Gradient-knappar — den döda hästen som måste begravas

### Observation
- Intresseguide: stor lila→rosa-gradient-knapp "Starta Intresseguiden"
- Skills Gap: gradient-knapp "Analysera gapet"
- Profile onboarding: gradient-modal-header (turkos→blå→lila→rosa)
- AI Team onboarding: gradient cyan→mint avatarbakgrund
- Mina resurser (`51-resources`): hela Stat-banner är gradient blå→lila

### Min åsikt
Gradient-knappar var en estetisk val ca 2018-2020 (Stripe-eran). De har **inte åldrats väl**. Idag signalerar de:
- "Vi är osäkra på vår identitet"
- "Det här ska se viktigt ut, men vi har inte arbetat med hierarki"
- "AI-feature 2024" (en ny klyscha)

DESIGN.md förbjuder dem redan — men de finns kvar på 5+ ställen.

### Rekommendation
Gör en sweep. Inga undantag. Ersätt med:
- Solid hub-färg (`--c-solid`) för primär CTA
- Vit + border för sekundär
- Ghost (text only) för tertiär

Ta också bort gradient-bakgrunden på "Mina resurser"-stat-banner. En vit yta med 4 KPI-kort i hub-färgad pastell skulle göra precis samma jobb och passa resten av portalen.

---

## 5. Empty states — brutalt inkonsekventa

### Observation
Jag räknade **fem olika tomtillstånd-mönster**:

1. **Översikt HubCard** (`11-hub-oversikt`): liten dimmad text "Inga händelser än — börja utforska". Mjukt, inbjudande.
2. **Min konsulent** (`64-my-consultant`): grå abstrakt avatar + rubrik + texten **"myConsultant.noConsultantFullDesc"** *(en oöversatt i18n-key — RIKTIG bugg, inte design)*.
3. **Mina ansökningar** (`23-applications`): pipeline-skelett MED 4 tomma kolumner OCH stor empty-state-Card under (du har redan fixat detta).
4. **Nätverk** (`54-network`): KPI-kort med "0" + tomt nätverks-card med "Du har inga kontakter ännu" + tom event-lista med "Inga kommande event" — tre tomtillstånd staplade i samma vy.
5. **Översikt-historik** (`11b`): stor sida med en enda rad "Du uppdaterade ditt CV — Idag". 95% blank. Inget CTA, inget nästa steg.

### Min åsikt
Tomtillstånd är ett av designens viktigaste mikro-mönster, särskilt för en utsatt målgrupp som **lättast lämnar en sida när det inte finns något att göra**. Här finns inget enhetligt sätt att hantera dem.

### Rekommendation
**Definiera EN empty-state-komponent** med tre delar (alltid):
1. **Lugn ikon** (inte gråtom, inte spinner — illustrativ. Tänk Notion's empty-state-illustrationer.)
2. **Mänsklig rubrik** ("Här bygger du ditt nätverk", *inte* "Du har inga kontakter")
3. **EN tydlig nästa-handling-knapp** ("Lägg till första kontakten")

Inga staplade tomtillstånd. Aldrig "0" som primär information. Och kör en automatisk sweep som flaggar i18n-keys som `noConsultantFullDesc` om de läcker till UI.

Översikt-historik är ett särskilt fall: en *nästan tom historiksida* är ett designval — inte ett tomtillstånd. Den ska visa **kontextualiserade förslag**: "Du har bara en aktivitet ännu. Här är 3 saker du kan utforska först:" + 3 launch-cards.

---

## 6. Information density — Wellness-sidan vs. Career-sidan

### Observation
Wellness (`60-wellness.png`) är ett av portalens visuellt starkaste sidor. Lugn lavendel, **ett** mood-val överst med 5 emojis, sedan ett quote, sedan dagens 4 aktiviteter, sedan 4 tips-kort, sedan reflektionsfält. Det andas. Hierarki via typografi och vitrymd. **Detta är jobin.se-tonen.**

Career (`30-career.png`) är motsatsen. KPI-grid med 4 olika färger, "Eftertraktade kompetenser"-tabell med 8 rader, "Mest sökta yrken"-tabell med 5 rader, "Jobb per region"-stat-grid med 5 städer + delta-siffror. Det är ett affärsverktyg, inte ett karriärstöd. **Detta är en utsatt-användares mardröm av siffror.**

Övningar (`63-exercises.png`) är ännu värre: 60+ kort i 3-kolumnsgrid utan kategorisering, sökfilter eller progression. Det är ett helkylskåp till en hungrig person. Vart börjar man? Vad är "bra"?

### Min åsikt
Career- och Övningar-sidorna är gjorda för **en användare som vet exakt vad de letar efter**. Det är inte målgruppen.

### Rekommendation
**Career-sidan**: Reducera till tre sektioner:
1. *"Hur ser arbetsmarknaden ut för dig?"* — en (1) huvudsiffra + en kontextuell mening ("48 298 lediga jobb just nu — det är fler än förra månaden").
2. *"Vad är hett just nu?"* — top 5 yrken som textchips, inte tabell.
3. *"Var finns jobben?"* — en mini-Sverigekarta eller top 3 städer med antal.

Inga delta-procentpilar, inga "+5%"-arrows. Det är finansapp-språk.

**Övningar-sidan**: Lägg till **en kuraterad rad överst**: "För dig idag: 3 övningar som passar din situation". Resten kategoriserat, kollapsbart, sekundärt. Använd Headspace-modellen: aldrig fler än 5-7 alternativ synliga utan att användaren har "valt en avdelning".

---

## 7. Onboarding — för många, för olika, för intrusiva

### Observation
Jag mötte onboarding-modaler/turer på minst:
- Profil (welcome-modal med gradient-header)
- CV-byggare (orange "Steg 1 av 7"-tour overlay)
- AI Team (blå/cyan gradient-modal med 4 steg)
- Förmodligen fler om jag klickade djupare

Var och en har egen visuell stil. CV-touren är overlay-prickar. Profile är full modal. AI Team är full modal med karusell.

### Min åsikt
För en **återkommande inloggning** känns det som om appen bombarderar användaren. Och inkonsekvensen gör det ännu mer förvirrande — användaren kan inte lära sig "OK, det här är en intro, jag vet vad jag ska göra".

För en **ny användare** är 4+ separata onboardings för många. Var och en bryter flow.

### Rekommendation
**En enda onboarding-komponent.** En enda visuell stil. Och den ska:
- Aldrig visas mer än en gång per session (även om man besöker en ny sektion)
- Alltid vara dismissable från första klicket
- Aldrig blockera handling — använd hellre **inline-tips** ("💡 Tips: börja här") än modaler

**Ännu bättre**: ta bort onboardings helt på kärnsidor och investera istället i självförklarande UI. CV-byggaren behöver ingen tour om steg-indikatorn säger "Steg 1 av 5: Välj design — klicka en mall för att börja". Wellness behöver ingen tour om sidan i sig är så lugn att den inbjuder.

Onboardings är ofta ett symptom på att UI:t inte talar för sig självt. Lös grundproblemet, inte symptomet.

---

## 8. Personalisering saknas — användaren är anonym

### Observation
I sidobaren står "claude-playwright-test" + "Deltagare". Det är användarens enda glimt av sig själv. Resten av portalen säger "Du", "Dina kontakter", "Ditt CV" — generiskt.

Översikten säger "Välkommen tillbaka" — utan namn. Inget "Hej Anna! Du har inte loggat in på 3 dagar — välkommen tillbaka".

### Min åsikt
Detta är **lågt hängande frukt** för empatisk design. Klarna säger "Hej Mikael 👋". Headspace säger "Good evening, Mikael". Det skapar en känsla av att appen *känner* användaren — vilket är kritiskt för en utsatt målgrupp.

### Rekommendation
- Översikten: "Hej Anna" som primär hero-rubrik på morgon, "God kväll, Anna" på kväll.
- Notiser: "Anna, du har en intervju på torsdag" istället för "Du har en intervju".
- Empty states: "Anna, du har inte börjat din intresseguide än" — inte "Du har inte börjat...".

Det är 30 minuters arbete och ger en helt annan emotionell ton.

---

## 9. Mikrokopians ton — variation utan medvetenhet

### Observation
Genomgång av rubriker och knappar:

| Plats | Text | Ton |
|---|---|---|
| Översikt hero | "Vad vill du göra idag?" | ✅ Vänlig, öppen |
| Söka jobb hero | "Hitta och söka jobb" | ⚠️ Funktionell ("söka" är slarvigt) |
| Karriär hero | "Planera min karriär" | ✅ Personligt |
| Resurser hero | "Hantera resurser" | ❌ Som en filhanterare |
| Min vardag hero | "Mina vardagliga rutiner" | ⚠️ Lite kliniskt |
| Career sub | "Svensk arbetsmarknad" | ❌ Tabloid-rubrik |
| Spontanansökan | "Sök företag" | ⚠️ Kommando, inte erbjudande |
| Wellness | "Hur mår du idag?" | ✅ Empatiskt |
| Help banners | "FAQ", "Vanliga frågor" | ⚠️ Standard |

### Min åsikt
Tonen vackrar mellan **varm vänskap** och **funktionsetikett**. På samma portal. Resultatet är att de varma sidorna känns som undantag — som om någon var snäll just där, men "egentligen" är portalen administrativ.

### Rekommendation
Skriv en **Voice & Tone Guide** (max 1 sida). Tre regler:
1. **Rubriker är inviter, inte etiketter.** "Hantera resurser" → "Dina sparade resurser". "Sök företag" → "Hitta företag att kontakta".
2. **Aldrig administrationsspråk.** "Aktivera", "Konfigurera", "Inställning" → "Slå på", "Ändra", "Justera".
3. **Aldrig prestationsspråk i UI för deltagare.** "12% klart" är OK i wizard-progress. "0 av 5 mål uppnådda" är inte OK i hero.

Konsulent- och admin-vyer kan ha annan ton (mer effektiv) — men det ska vara EN tydlig switch, inte slumpartat genom appen.

---

## 10. Mobilen är inte tänkt klart

### Observation
- Mobile-oversikt (`mobile-oversikt.png`): visuellt OK, men HubCards är staplade vertikalt utan en "intro-text" — användaren får 5 lika viktiga val.
- Mobile-CV: extremt lång scroll med 11+ mall-kort i en kolumn. Ingen swipe, ingen filtrering. 6356px hög sida.
- Bottennav fungerar (verifierat i fix B3) men endast 5 hubs — när man är inne i en hub-undersida (t.ex. `/cv`) finns ingen mobil sub-tab-navigation. Användaren måste tillbaka till hub.

### Min åsikt
Mobilen är **desktop minskat till 390px**, inte mobil-tänkt. För målgruppen (många använder smartphone som primär enhet) är detta kritiskt.

### Rekommendation
- Hub-landningssidor på mobil: lägg till en kort intro-mening överst ("Vart vill du ta vägen idag? Här är dina fyra zoner.").
- CV-byggar mobil: horisontell snap-scroll-galleri för mallar (Tinder-modell), inte vertikal lista. Eller filterbart 2-kolumnsgrid.
- Sub-tabs på mobil: när man är på `/cv` ska de 5 CV-flikarna vara tillgängliga via en horisontell scroll-bar under header.

Detta är **inte ett kvick-fix**. Det är en mobil-pass som behöver designtid.

---

## 11. Detaljer som skär i ögonen

Listan är inte uttömmande, bara symptom på samma underliggande problem (designsystem-koherens):

- **Logotyp**: Login = mjuk grön kub. Register = pixelig rund "JOBIN" med strålning. Topbar = "j" + "jobin.se". Footer i Landing = ännu en variant. *Du har redan fixat Login/Register.*
- **Datum-disc** på alla huvar säger "SÖN 10" — varför är "SÖN" versaler och "10" inte? Det skär. Antingen båda versaler eller ingen.
- **Sökrutor**: Spontanansökan har persika-fokusring, Skills Gap har lila, Help har ingen tydlig fokusring. Alla bör ha hub-färgad.
- **Tabb-aktiv-stil**: vissa sidor har bakgrundsfyllning på aktiv tabb (Karriär), andra har bara understreck (Job Search). Ingen visuell konsistens.
- **Knapp-radius**: 6px på vissa, 12px på andra, 14px på pills. Ofta inkonsekvent på samma sida.
- **Ikon-tile-storlek på HubCards** (Översikt) är 48×48 men ikon-tiles på Söka-jobb-hub-feature-cards är 36×36. Ingen tydlig skala.
- **"AI-samtycke krävs"-banner** på Nätverk, Salary, Diary ser likadan ut men har olika syften. Behöver visuell differentiering eller konsolidering.

Detta är arbete för ett designsystem-pass där alla komponenter granskas mot ett centralt token-system.

---

## 12. Det som faktiskt fungerar — bevara medvetet

För att rapporten inte ska kännas som "allt är dåligt":

- **Sidobarens hub-struktur** är exemplarisk. Sub-items som expanderar bara för aktiv hub är smart pedagogik.
- **Översikt-sidans HubCard-grid** är portalens vackraste skärm. 4 likvärdiga zoner i vita kort med 4px topp-accent. Detta är portalens visuella DNA.
- **Wellness-sidan** är emotionellt rätt. Tonen, mood-checkin, "Varje steg framåt är ett steg närmare ditt mål"-quote, dagens 4 aktiviteter. Det här är vad jag skulle dra inspiration från för resten av portalen.
- **CV-mallgalleriet** är välformat, bra screenshots, tydliga val. Det visuellt mer mogna än många konkurrenters CV-tools.
- **Hub-bottennav på mobil** med 5 ikoner är klart designat och respekterar safe-area.
- **Login-sidan** är ren, lugn, minimalt friktion. Bra första intryck.

---

## 13. Vad jag skulle göra om jag fick tre veckor

I prioritetsordning, eftersom du frågar:

**Vecka 1 — Identitet och ton**
- Skriv Design Manifesto + Voice & Tone Guide (½ dag, klar i ett möte).
- Inventera och fixa alla i18n-läckor (`myConsultant.noConsultantFullDesc` osv) — 1 dag.
- Logo-pass: en logo överallt, en favicon, en touch-icon — 1 dag.
- Personalisering: "Hej {namn}" på Översikten, alla hub-headers — 1 dag.

**Vecka 2 — Designsystem-pass**
- En empty-state-komponent — 1 dag design + 1 dag implementation.
- Förbjud gradient-knappar maskinellt (eslint-rule + audit) — ½ dag.
- En-färg-per-sida-regel: gå genom Career, Skills Gap, Personal Brand, Salary — 2 dagar.
- Tabb-, knapp-, fokusring-konsistens — 1 dag.

**Vecka 3 — Innehållsdensitet och mobil**
- Career, Övningar: redesign till "max 5-7 saker synliga utan val" — 2 dagar.
- Mobil-pass: hub-intros, CV-mallgalleri som swipe, sub-tabs på mobil — 3 dagar.

Det är 15 arbetsdagar. Resultatet är **portalens andra version** — inte i feature-bemärkelse utan i designidentitet.

---

## Avslut

jobin.se har ett bra fundament. Det som saknas är **medvetenheten om tonen**. Just nu dirigerar 5 olika tonarter en tonart i taget. Om grundprincipen "lugn vän, inte myndighet, inte tools-app" sätts som första filter — och alla andra designval underordnas det — kommer många av de specifika problemen ovan lösa sig själva.

Det är inte ett radikalt nytt designsystem som behövs. Det är en **gemensam tonhöjd** för det som redan finns.

— *Designgranskning utförd 2026-05-10. Diskutera gärna varje punkt enskilt — jag har sannolikt fel i en del bedömningar och säkert rätt i andra.*
