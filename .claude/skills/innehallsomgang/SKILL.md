---
name: innehallsomgang
description: Kör en komplett innehållsomgång i spår K — mät luckorna i artikelkorpusen, skicka ut Sonnet-agenter som skriver nya SEO-anpassade guider och landningssidor, granska deras arbete oberoende, skriv till prod och verifiera bygget. Använd när Mikael säger "skicka ut sonnetagenter och skriv nya seo anpassade landningssidor och innehåll", "kör en innehållsomgång", "ny omgång", "fler guider", eller ber om nytt publikt innehåll till jobin.se.
---

# Innehållsomgång — spår K

Proceduren är körd sju gånger (omgång 3–6, 8, 9, 10). Följ den. Uppfinn inte en ny.

**Push är deployen.** Den här skillen stannar före `git push` och lämnar
beslutet till Mikael. Artiklarna skrivs däremot till prod-databasen som en del
av omgången — det är reversibelt med `--rollback`.

---

## 1. Städa katalogen

Förra omgångens filer ligger kvar i `client/content/new-articles/` och skulle
fälla valideringen (sluggarna finns nu i snapshoten). Arkivera dem:

```bash
cd client/content/new-articles
mkdir -p omgang-<N-1>
mv _meta.*.json _inlagda.json omgang-<N-1>/
for f in *.md; do [ "$f" = "BRIEF.md" ] || mv "$f" omgang-<N-1>/; done
```

`BRIEF.md` och `_befintliga-slugs.txt` stannar kvar. Uppdatera rubrikraden i
`BRIEF.md` till rätt omgångsnummer.

## 2. Regenerera sluglistan

Agenterna får inte gissa vad som redan finns.

```bash
cd client && node -e "
const fs=require('fs');const s=require('./content/articles.snapshot.json');
const rader=[...s.articles].sort((a,b)=>a.slug.localeCompare(b.slug))
  .map(a=>a.slug.padEnd(46)+a.category_key.padEnd(20)+a.title);
fs.writeFileSync('content/new-articles/_befintliga-slugs.txt',
 '# Alla '+s.articles.length+' slugs som redan finns i prod-tabellen articles.\n\n'+rader.join('\n')+'\n','utf8');
console.log('sluglista:',rader.length);"
```

## 3. Mät luckorna — gissa aldrig

Matcha kandidatämnen mot **titel och ingress**, inte mot brödtext. En
brödtextmatchning ger falskt "FINNS" på varje förbipassering.

```bash
node -e "
const s=require('./content/articles.snapshot.json');
const amnen={'<ämne>':/<regex>/i, /* … */};
for(const [namn,re] of Object.entries(amnen)){
  const t=s.articles.filter(a=>re.test(a.title+' '+(a.summary||'')));
  console.log((t.length?'FINNS ':'LUCKA ')+namn.padEnd(36)+t.map(x=>x.slug).join(', '));
}"
```

Redovisa luckorna för Mikael innan du skriver — de tidigare omgångarnas ämnen
valdes så, och det är därför ingen av dem kannibaliserar en befintlig sida.

## 4. Skicka ut agenterna

Fem innehållskluster à fem artiklar plus en agent för landningssidor är den
storlek som fungerat. Alla `model: sonnet`, alla i **ett** meddelande så de kör
parallellt. Exklusiva filer per agent: en `_meta.<BOKSTAV>.json` var,
landningssideagenten äger `content/tools.json` ensam.

Varje agentuppdrag ska innehålla, ordagrant:

- Läs `BRIEF.md` och `_befintliga-slugs.txt` i sin helhet först.
- Läs en färdig fil ur föregående omgångs katalog som förlaga.
- Exakta slugs och vinklar — låt inte agenten välja ämne själv.
- Sluglistan över vad den **inte** får överlappa, med "länka i stället".
- **Ingen siffra som är en regel.** Mekanism, beslutsfattare, myndighetens
  startsida. Aldrig belopp, dagantal, procent, åldersgränser.
- **Inga obelagda generaliseringar.** "De flesta arbetsgivare", "många
  upplever", "forskning visar". Fem omgångar har fällts på det här.
- Titel ≤ 60 tecken, `summary` ≤ 155, 700–1200 ord (250–450 lättläst).
- Varje "Läs mer om …" ska vara en riktig markdown-länk.
- **Varje myndighet som nämns ska länkas till sin startsida** vid första
  förekomsten. I omgång 6 saknade 14 av 25 artiklar externa källänkar — ett helt
  kluster hade noll, för agenten kopierade förlagans praxis i stället för att
  följa briefen. Det slår hårdast i artiklarna om ersättning och utsatta lägen,
  där läsaren behöver en klickbar väg vidare.
- **Kör inte `content:new`** — det görs centralt.
- Rapportera **mätvärden**, inte "verifierat".

## 5. Granska oberoende — agenternas egenrapport räknas inte

Fem omgångar i rad har agenterna rapporterat sitt arbete som rent, och fem
gånger har egen mätning hittat fel de missat. Kör alltid:

```bash
npm run content:granska    # scripts/granska-nya-artiklar.cjs (2026-09-20)
grep -nE "de flesta|många som|forskning visar|studier visar" *.md
grep -nE "[0-9]" *.md | grep -vE ":[0-9]+:[0-9]+\. "
```

Grinden finns nu på riktigt och är mutationstestad åt båda håll: den fäller på
fjorton olika fel (för få eller för många ord, titel > 60, summary > 155,
slugkrock mot prod, `category_key` utanför mängden, noll externa länkar, rå
`# H1`, obelagd generalisering, `.md` utan meta, meta utan `.md`, dubblett
mellan två `_meta`-filer) och släpper igenom en ren omgång. Den tar en katalog
som argument, så den går att pröva mot en provkatalog utan att röra den skarpa
omgången.

Den **varnar** dessutom — utan att fälla — för siffror som ser ut som regler och
för "Läs mer om …" utan markdown-länk. Varningarna ska läsas, inte hoppas över:
det är där ett belopp eller en död hänvisning slinker igenom.

```bash
# Källänkar: vilka filer saknar dem helt?
for f in *.md; do [ "$f" = "BRIEF.md" ] && continue;   [ "$(grep -c 'https://' "$f")" = "0" ] && echo "0 länkar: $f"; done
```

Kontrollera dessutom **för hand**:
- **läslistan "ATT LÄSA FÖR HAND" som grinden skriver ut.** Sedan omgång 10 listar den varje
  rakt Ja/Nej-svar på en villkorad fråga och varje "normalt"-konsekvens. I omgång 10 pekade
  den ut tre sakfel. Läs varje rad mot källa — tysta den inte.
- **varje regelartikel mot myndighetens egen sida, inte mot agentens källor.** Omgång 10: en
  klickväg på Mina sidor kom från leverantörers webbplatser, inte från Arbetsförmedlingen; en
  sjukanmälan pekade på fel myndighet. Och briefen är ingen källa — en agent rättade min.
- **begrepp ur reformerade regelverk.** A-kassan gjordes om 2025-10-01 (inkomstvillkor i
  stället för arbetsvillkor, ingen grundersättning, månadsansökan i stället för kassakort),
  sanktionerna för programdeltagare 2026-06-01, lönegarantin 2025-02-01,
  etableringsersättningens tillägg 2026-09-01. Hittar du ett gammalt begrepp i en ny text:
  sök den BEFINTLIGA korpusen också, på båda språken (`content_en` finns bara i prod), och
  lägg en rad i `src/test/guides-avskaffade-regler.test.ts`
- **varje fråga av typen "måste jag", "kan jag tacka nej", "förlorar jag".** Omgång 9:
  agenterna lydde sifferförbudet och ersatte regeln med ett lugnande "Nej", "oftast, ja"
  och "normalt en varning" — alla tre fel på ett sätt som kan kosta läsaren ersättningen,
  och ingen grind ser dem. Hittar agenten en regeländring ska den stå i texten, inte bli
  "fråga din handläggare"
- att juridiska begrepp inte är föråldrade (omgång 4 skrev "saklig grund" fyra
  år efter att LAS bytt till "sakliga skäl")
- att programmet/stödet fortfarande finns (omgång 5: extratjänsten och
  studiestartsstödet var avvecklade)
- att sluggen är rättstavad — den blir URL:en för all framtid

## 6. Skriv till prod

```bash
cd client
npm run content:new                    # torrläge, validerar allt
npm run content:new -- --skriv         # skriver till prod
npm run content:refresh                # snapshot ur prod
npm run content:triage -- --skriv      # publiceringslistan
```

## 7. Bygg och verifiera

```bash
npm run build          # prerender + sitemap
npm run verify         # alla tio grindar, inkl. coverage
```

Kontrollera i **byggd HTML**, inte i källkoden: en `<h1>` per sida, `<title>`
och canonical rätt och unika, JSON-LD som parsar, krisstödsblocket närvarande,
ingen rå markdown, sidan i sitemapen, och att varje `/guider/<slug>/`-länk har
en sida i `dist/`. (Portallänkar, `href="/knowledge-base/…"`, fäller bygget
självt sedan omgång 9 — 73 sidor ledde till startsidan i sju veckor innan
någon läste den byggda sidan i stället för källan.)

**Rör aldrig ett tak för att bli grön.** 122 warnings, 356 typfel, 52
gradienter — sänk dem när du betalar av, höj dem aldrig.

Hela släppproceduren, inklusive verifiering av deployen, ligger i skillen
**`slapp`**. Den här skillen stannar före push.

## Fällor som kostat tid

- **En ny prerenderad sidtyp rör fyra ställen:** `prerender-guides.cjs`,
  `generate-sitemap.cjs`, `scripts/lint-links.cjs` och
  `src/test/guides-krisstod.test.ts`. Missar du länkgrinden blir `verify` röd.
- **Varje nytt `t()`-anrop kräver nyckel i BÅDA locale-filerna.** Grinden bor i
  coverage-sviten, inte i `lint:ci` — en agent som kör "linten" ser den aldrig.
  Sätt in nycklarna med `scripts/i18n-infoga-nycklar.cjs` (`addKeys` returnerar
  `{text, insatta, konflikter}`), aldrig genom att serialisera om filen.
- **Länka aldrig till en prerenderad sida med `<Link to>`** — HashRouter gör den
  död. `<a href>` gäller.
- **En ny grind hör hemma i skillen `grind`** — den beskriver hur man gör en
  vakt som faktiskt kan falla, och mutationstestningen som avgör det.
- **K4:s regel:** ingen omgång utan mätning från den föregående. K8 (Search
  Console) har stått öppen sedan 5 augusti och regeln har frångåtts fyra gånger.
  Säg det varje gång, låt Mikael välja.
