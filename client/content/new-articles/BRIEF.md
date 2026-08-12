# Brief: nya guider för Jobin (spår K, innehållsomgång 3)

Du skriver **publika guidesidor** som ska ranka på Google och leda arbetssökande till jobin.se.
Sidorna prerenderas till statisk HTML under `https://www.jobin.se/guider/<slug>/` och visas
samtidigt inne i portalen. Läsaren är oftast **inte inloggad** — hon kom från en sökning.

## Vem läser

Arbetssökande i Sverige. Många är långtidsarbetslösa, en del har fysiska eller psykiska
utmaningar, en del är nyanlända, en del har begränsad ork just den dagen. De söker något
konkret ("hur fyller jag i aktivitetsrapporten") och behöver ett svar, inte en pepptalk.

## Ärlighetsreglerna — de här är hårda

Portalens dyraste återkommande fel har varit påhittade uppgifter. En läsare fattar beslut om
sin försörjning utifrån det här. Därför:

1. **Skriv aldrig ut belopp, procentsatser, dagantal, åldersgränser eller inkomsttak.**
   Inte "du får 80 % av din tidigare lön", inte "i 300 dagar", inte "minst 6 månaders arbete".
   Sådant ändras, och en föråldrad siffra är värre än ingen siffra. Beskriv **mekanismen** —
   vad som avgör, vem som beslutar, i vilken ordning det sker — och hänvisa till källan för
   det exakta.
2. **Hitta inte på statistik, undersökningar eller "forskning visar".** Om du inte kan namnge
   källan, skriv inte påståendet.
3. **Hitta inte på omdömen, användarsiffror eller framgångshistorier.** Ingen "9 av 10 som…".
4. **Hitta inte på egenskaper hos Jobin.** Du får hänvisa till verktygen i listan längst ner
   och inget annat.
5. **Osäker på en regel? Utelämna den.** En kortare artikel som stämmer slår en längre som
   kanske inte gör det.
6. Källhänvisningar skrivs som vanliga länkar till myndighetens **startsida eller stabila
   avdelningssida** — `https://arbetsformedlingen.se`, `https://www.forsakringskassan.se`,
   `https://www.skatteverket.se`, `https://www.uhr.se`, `https://www.1177.se`,
   `https://www.av.se`, `https://www.do.se`. Djuplänka inte till sidor som kan ha flyttat.

Du får använda WebSearch för att kontrollera **hur något fungerar**. Men ta aldrig med en
siffra du hittar där — mekanismen är tålig, siffran är färskvara.

## Röst och ton (ur docs/DESIGN.md §2)

- **Lugn vän, inte myndighet och inte reklam.** Skriv som någon som suttit bredvid en person
  som fyller i blanketten, inte som någon som beskriver blanketten.
- **Ingen prestationston.** Aldrig "du måste bli bättre på", "de flesta misslyckas med".
- **Inget administrationsspråk.** "Aktivera" → "slå på". "Konfigurera" → "ändra".
  "Vederbörande" → "du".
- **Rubriker är inviter, inte etiketter.** "Ersättningsformer" → "Vem betalar vad, och när".
- **Du-tilltal genomgående.** Korta stycken. Ett stycke = en tanke.
- **Erkänn det svåra utan att dramatisera.** "Det här steget stoppar många, och det är inte
  för att de är oduktiga — blanketten är otydlig."
- Inga emojis. Inga utropstecken. Inga em-streck som stilmarkör (använd vanligt tankstreck
  `–` sparsamt).

## Format på texten

Filen innehåller **bara brödtexten i markdown**. Ingen `# H1` — titeln sätts av metadatan.

- Öppna med **en till tre meningars ingress** som svarar på frågan direkt. Läsaren ska veta
  inom fem sekunder att hon hamnat rätt. Den här ingressen är också det Google ofta visar.
- Därefter `## `-rubriker (5–8 stycken), `### ` där det behövs.
- Punktlistor och numrerade listor där innehållet är en sekvens.
- Tabeller där något jämförs (`| a | b |` med `|---|---|`). Renderas korrekt på guidesidorna.
- **Fetstil** för det som är lätt att missa. Ingen kursiv för betoning.
- Avsluta med ett avsnitt som svarar på "vad gör jag nu" — konkret nästa steg, inte en
  sammanfattning av artikeln.
- Har ämnet återkommande frågor: lägg ett `## Vanliga frågor` med `### ` per fråga. Det ger
  oss `FAQPage`-uppmärkning senare.

**Längd: 700–1200 ord** för vanliga guider. **250–450 ord** för lättläst (se nedan).

### Om du skriver lättläst (kategorin `easy-swedish`)

Andra regler, och de är inte förhandlingsbara:
- Korta meningar. **En tanke per mening.** Sällan mer än 12–15 ord.
- Inga inskjutna bisatser. Inga liknelser. Inga bildliga uttryck.
- Vanliga ord. Förklara varje myndighetsord första gången: "A-kassa betyder
  arbetslöshetskassa. Det är en förening som betalar pengar till dig när du inte har jobb."
- Radbryt ofta. Korta stycken, två till fyra rader.
- Rubriker som frågor: "Vad är a-kassa?", "Hur gör jag?"
- Inga tabeller. Punktlistor är bra.

## SEO — vad som faktiskt räknas här

- **Titeln ska innehålla det man söker på**, och läsas som en mening en människa skrivit.
  "Aktivitetsrapport till Arbetsförmedlingen – så fyller du i den" är rätt.
  "Allt om aktivitetsrapportering" är fel (ingen söker så).
- **`summary` är meta description**: max 155 tecken, säger vad läsaren får ut, inte vad
  artikeln "handlar om". Skriv den som en anledning att klicka.
- Sökordet ska finnas i ingressen — naturligt, en gång. **Ingen upprepning för Googles skull.**
  Textens jobb är att vara den bästa sidan om ämnet, inte den mest ordfyllda.
- Täck **närliggande frågor** i egna `## `-rubriker. Det är så här sidor fångar långsvansen.
- **Skriv inte om något som redan finns.** Din klusterspec listar de befintliga sluggarna du
  inte får överlappa. Krockar ditt ämne med en befintlig artikel: skriv i stället om den
  vinkel som saknas, och länka till den befintliga.

## Metadata per artikel

Skriv en gemensam `_meta.<kluster>.json` med en post per slug:

```json
{
  "aktivitetsrapport-guide": {
    "title": "Aktivitetsrapport till Arbetsförmedlingen – så fyller du i den",
    "summary": "Vad som ska stå i aktivitetsrapporten, när den ska in och vad som händer om du missar den.",
    "category_key": "job-search",
    "subcategory": "arbetsformedlingen",
    "tags": ["aktivitetsrapport", "Arbetsförmedlingen", "ersättning"],
    "difficulty": "easy",
    "energy_level": "low",
    "related_article_slugs": ["ansokningsstrategi", "struktur-jobbsokning"],
    "related_tools": ["/applications"],
    "checklist": ["Skriv ner varje sökt jobb samma dag", "…"],
    "actions": [
      { "href": "/applications", "label": "Håll koll på dina ansökningar", "type": "primary" }
    ]
  }
}
```

Fältregler:
- `category_key` — **måste** vara en av: `job-search`, `interview`, `career-development`,
  `job-market`, `wellness`, `self-awareness`, `networking`, `digital-presence`,
  `employment-law`, `accessibility`, `tools`, `easy-swedish`. Ingen ny kategori.
- `difficulty` — `easy`, `medium`, `detailed` eller `easy-swedish` (bara för lättläst).
- `energy_level` — `low`, `medium` eller `high`. **Tänk efter**: hur mycket ork kräver det
  att läsa och göra det här? En blankettguide är `low`, en karriäromläggning är `high`.
- `related_article_slugs` — 2–4 stycken, **måste finnas** i listan i din klusterspec.
  Krossmatcha gärna mellan kluster om du känner till sluggen därifrån.
- `related_tools` — 0–2 stycken ur **routelistan** nedan. Bara verktyg som verkligen hjälper
  med just det här. Hellre noll än ett påklistrat.
- `checklist` — 0 eller 4–8 korta punkter, imperativ form, en handling per punkt. Bara när
  ämnet är en sekvens man kan bocka av. Skriv strängar, id sätts av skriptet.
- `actions` — 1–2. Första `"type": "primary"`. `href` **måste** finnas i routelistan.
  Aldrig `/knowledge-base` som primär (att skicka en läsare till en lässida är ingen åtgärd).
  Etiketten säger vad man får, inte vad man klickar: "Bygg ditt CV", inte "Gå till CV".

### Godkända `href`/`related_tools`-värden (routes som finns i App.tsx)

```
/cv                     CV-byggaren, 13 mallar, PDF-export
/cover-letter           Personligt brev
/interview-simulator    Intervjusimulator med tal-till-text
/skills-gap-analysis    Kompetensgap mot ett drömjobb
/interest-guide         Intresseguide, hittar yrken som passar
/job-search             Sök och spara jobb
/applications           Håll ordning på ansökningar
/salary                 Löneläge
/education              Utbildning
/career                 Karriär
/linkedin-optimizer     LinkedIn-profil
/personal-brand         Personligt varumärke
/spontanansökan         Hitta företag och skicka spontanansökan
/nätverk                Nätverk
/wellness               Mående och energi
/diary                  Dagbok
/exercises              Övningar
/calendar               Kalender
/resources              Resurser
/externa-resurser       Externa länkar
/international          Jobb utomlands / internationellt
/knowledge-base/article/<slug>   annan guide (sluggen måste finnas)
```

Allt annat är en död länk och fäller byggrinden.

## Leverans

Skriv till `client/content/new-articles/`:
- en `<slug>.md` per artikel (bara brödtext, som ovan)
- en `_meta.<kluster>.json` med alla dina slugs

Sluggen: gemener, bindestreck, inga å/ä/ö (skriv `a`/`a`/`o`), inga årtal. Den blir URL:en
för all framtid — `https://www.jobin.se/guider/<slug>/`.

**Kontrollera innan du är klar:**
- [ ] Ingen slug krockar med en befintlig (listan står i din klusterspec)
- [ ] Ingen siffra som är en regel, ett belopp eller en tidsgräns
- [ ] Varje `href` finns i routelistan ovan
- [ ] Varje `related_article_slugs` finns i klusterspecens lista
- [ ] `summary` ≤ 155 tecken
- [ ] Ordantal inom spannet
- [ ] Ingen `# H1` i .md-filen
