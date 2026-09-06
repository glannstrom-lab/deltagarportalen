# Kannibaliseringskarta — spår SE1/SE2

Mätt 2026-09-06 mot `client/content/articles.snapshot.json` (240 artiklar,
`generatedAt: 2026-09-06`, hämtad ur prod-tabellen `articles`; 238 av dem är
publicerade enligt `client/content/publish-list.json` — `forsta-veckan-checklista`
och `komma-igang-intro` är onboarding och ligger utanför den publika
`/guider/`-ytan).

**Detta dokument slår inget ihop.** Det är beslutsunderlaget K8 (Search
Console) ska prövas mot, så att sammanslagningen går att göra på en
eftermiddag den dagen indexeringsdatan finns. Ingen artikel, databasrad eller
byggfil är ändrad av det här arbetet.

## Metod

1. Extraherat `slug/title/summary/category_key/subcategory/difficulty/content`
   ur snapshoten och räknat ordantal (`content.split(/\s+/)`) och rubriker
   (`## `-rader) per artikel — se `articles_extract.json` i arbetskatalogen.
2. Räknat **inlänkar** = hur många andra artiklar som har slugen i sin
   `related_article_slugs` (motsvarar byggets egen internlänkning; jag har
   inte räknat länkar från navigation/hubbsidor, bara artikel→artikel).
3. Kört en bag-of-words Jaccard-likhet mellan titel+ingress+rubriker+slug,
   parvis inom samma `category_key` (svenska stoppord och portalspecifika
   fyllnadsord borttagna). Detta gav **537 kandidatpar över tröskeln 0,12**,
   varav de allra flesta var **falska positiva** — se avsnittet "Kontrollerat
   och friskförklarat" nedan för vilka mönster som slog ut brett utan att
   vara kannibalisering.
4. Varje kandidat med verklig ämnesöverlappning är **läst i sin helhet**
   (titel, ingress, rubriker, utgående länkar) innan den togs med — se
   tabellen. Ordantal och inlänkar är mätta, inte uppskattade; kommandot för
   varje mätning finns i `dump.cjs`/`similarity.cjs` i arbetskatalogen
   (skrivs inte till repot, bara scratchpad).

## Del 1 — Den fulla kartan: 23 kluster (roadmapen kände till 2 vid namn)

Formatet är **kluster**, inte strikta par, eftersom flera ämnen har tre eller
fyra konkurrerande sidor (roadmapens egen text undertexter är delvis
föråldrade på just antalet — se noterna). "Kriterium" anger vad som avgjorde
vinnaren; **fetstil** i kolumnen "Åtgärd" markerar de kluster där kriterierna
pekar åt olika håll och Search Console verkligen behövs.

| # | Kluster | Sidor (ord / inlänkar) | Föreslagen vinnare | Åtgärd | Avgörande kriterium |
|---|---|---|---|---|---|
| 1 | **CV, lättläst** (SE1) | `latt-svenska-cv` (180/0) · `lattsvenska-cv` (313/7) · `lattsvenska-vad-ar-cv` (278/0) · `lattsvenska-tips-bra-cv` (300/1) | `lattsvenska-vad-ar-cv` (definition) + `lattsvenska-cv` (hur-till) | Slå ihop `latt-svenska-cv` → `lattsvenska-vad-ar-cv` (near-dublett, samma fråga "vad ska stå/är ett CV", 0 inlänkar, fel kategori `job-search/cv-writing` i stället för `easy-swedish/cv`). **Slå ihop `lattsvenska-tips-bra-cv` → `lattsvenska-cv`** (tips är en delmängd av hur-till, ingen egen sökintention påvisad) | Ordantal + inlänkar entydiga för `latt-svenska-cv`-delen. Tips-delen: **svagt, se nedan** |
| 2 | **Intervju, lättläst** (SE1) | `latt-svenska-intervju` (220/0) · `lattsvenska-intervju` (423/3) · `lattsvenska-fragor-intervju` (426/0, länkar till `lattsvenska-intervju`) | `lattsvenska-intervju` | Slå ihop `latt-svenska-intervju` → `lattsvenska-intervju`. `lattsvenska-fragor-intervju` är redan strukturerad som underordnad (länkar TILL `lattsvenska-intervju`) med egen sökintention ("vanliga intervjufrågor") → **särskilj, rör inte** | Ordantal + inlänkar entydiga |
| 3 | **Avslag, lättläst** — NY, inte i roadmapen | `latt-svenska-avslag` (184/0, länkar `hantera-avslag`) · `lattsvenska-avslag` (307/0, länkar `hantera-avslag-motivation`) | `lattsvenska-avslag` | **Slå ihop** — låg säkerhet, båda är föräldralösa (0 inlänkar vardera) | Endast ordantal + kategori-konsekvens (`easy-swedish/wellbeing` matchar familjens mönster; `wellness/rejection` gör det inte) |
| 4 | **SE2**: `funktionsnedsattning-jobbsokning` (623/1) vs `jobbsokning-funktionsnedsattning` (879/1) | | `jobbsokning-funktionsnedsattning` | Slå ihop | Ordantal (879 vs 623) + slug/titel-konsekvens: båda titlarna inleds "Jobbsökning med funktionsnedsättning…", men bara den andra sluggen har samma ordföljd som sin egen titel. Inlänkar oavgörande (1=1) men **ingen kriterium pekar åt andra hållet** |
| 5 | `anpassningar-arbetsplats` (611/**9**) vs `anpassningar-arbetsplatsen` (841/1) | | — | **Väntar på Search Console** | Inlänkar pekar starkt på `arbetsplats` (9 mot 1 — etablerad i navigeringen), ordantal/djup pekar på `arbetsplatsen` (841 ord, fler rubriker: "Vanliga frågor", "Stöd från Arbetsförmedlingen"). Rakt motsatta signaler |
| 6 | `sociala-medier-jobbsokning` (745/0) vs `sociala-medier-jobsokning` (498/0, **stavfel** — saknar ett b) | | `sociala-medier-jobbsokning` | Slå ihop, redirecta stavfelssluggen | Rättstavad slug + fler ord. Inlänkar oavgörande (0=0) men stavfelet är i sig ett SEO-fel oavsett kannibalisering |
| 7 | **Löneförhandling** ×3: `loneforhandling-guide` (1436/**4**) · `loneforhandling-komplett` (808/1) · `loneforhandling-tips` (624/2) | | `loneforhandling-guide` | Slå ihop de två andra in i guiden | Entydigt på båda kriterier (flest ord, flest inlänkar) |
| 8 | **ATS** ×3: `ats-optimering` (471/**5**) · `ats-system-guide` (668/3) · `ats-system-tips` (1185/**0**) | | — | **Väntar på Search Console** | `ats-optimering` leder på inlänkar, `ats-system-tips` leder rejält på djup (1185 ord, myter, checklista) men har noll inlänkar. Rakt motsatta signaler |
| 9 | **Personlighetstyper** ×3: `personlighetstyper-arbete` (579/1) · `personlighetstyper-i-arbetslivet` (1118/1) · `personlighetstyper-jobb` (1261/1) | | `personlighetstyper-jobb` (svag) | **Väntar på Search Console** — inlänkar diskriminerar inte alls (1/1/1), bara ordantal ger en riktning | Enda mätbara kriteriet är ordantal; för svagt ensamt |
| 10 | **Mental hälsa** ×2: `mental-halsa-guide` (885/2) vs `mental-halsa-jobbsokning` (531/1) | | `mental-halsa-guide` | Slå ihop | Entydigt — identiska utgående länkar (`hantera-avslag, stresshantering, motivation-langsiktig`) i båda, ren dublett |
| 11 | **Stresshantering** ×3 (roadmapen sa 2 — det är 3): `stresshantering` (661/**7**) · `stresshantering-jobbsokning` (586/0) · `mindfulness-stresshantering-jobbsokare` (1028/0) | | `stresshantering` | Slå ihop `stresshantering-jobbsokning` in i `stresshantering`. Mindfulness-sidan har en tydlig egen vinkel (andningsövningar, appar) → **särskilj, rör inte** | Inlänkar entydiga (7 mot 0) för huvudparet |
| 12 | **Motivation** ×2: `motivation-jobbsokning` (**1350**/0) vs `motivation-langsiktig` (678/**8**) | | — | **Väntar på Search Console** — det tydligaste exemplet i hela kartan | Ordantal pekar starkt på den ena (dubbelt så lång, egen handlingsplan-sektion), inlänkar pekar lika starkt på den andra (8 mot 0) |
| 13 | `kompetensinventering-guide` (764/3) vs `kompetensutvardering` (1176/3) | | — | **Väntar på Search Console** | Ordantal favoriserar `kompetensutvardering`, inlänkar oavgjort (3=3), men `kompetensutvardering`s EGEN titel ("Kompetensinventering: Kartlägg dina färdigheter") matchar inte dess slug alls — ett fristående fel som bör rättas oavsett vinnare |
| 14 | **Värderingar** ×3 (roadmapen sa 2 — det är 3): `hitta-dina-varderingar` (469/2) · `varderingar-i-arbetslivet` (523/0) · `varderingar-karriarval` (928/0) | | `varderingar-i-arbetslivet` säkert bort | `varderingar-i-arbetslivet` är svagast på alla mått (tunnast av de tre relevanta, noll inlänkar) och kan tas bort oavsett. Vinnaren mellan de andra två: **väntar på Search Console** | `hitta-dina-varderingar` leder på inlänkar (2 mot 0), `varderingar-karriarval` leder på djup (928 ord) |
| 15 | `natverk-underhall` (648/0) vs `underhall-kontakter` (633/0) | | — | **Väntar på Search Console** — svagast signal i hela kartan | Båda 0 inlänkar, ordantal nästan identiskt (15 ords skillnad). `natverksbyggande-guide` (1474/0) är en bredare pelarsida som nämner samma ämne som ett delavsnitt — **lämna den orörd**, den konkurrerar inte på samma sökfras |
| 16 | **Ordlistor** ×2: `jobbsokar-ordlista` (716/0) vs `ordlista-jobbsokning` (601/0) | | `jobbsokar-ordlista` (svagt) | Slå ihop — låg säkerhet | Bara ordantal skiljer (0=0 på inlänkar). Olika format (alfabetisk vs tematisk) — värt att bevara den bästa strukturen manuellt, inte bara den längsta |
| 17 | **Checklistor** — roadmapen sa 2, det är 3 varav en är fel träff: `checklista-ansoka-jobb` (603/1) vs `checklista-innan-ansokan` (589/0) — **samma ämne** (kontrollera ansökan innan den skickas). `checklista-fore-intervju` (634/1) är **ett annat ämne** (dagen före intervjun) | | `checklista-ansoka-jobb` | Slå ihop de två första. `checklista-fore-intervju` → **lämna, felträff** | Ordantal + inlänkar båda (svagt) för `checklista-ansoka-jobb` |
| 18 | `hantera-avslag` (1086/**9**) vs `hantera-avslag-motivation` (665/5) | | `hantera-avslag` | Slå ihop | Entydigt — flest ord, flest inlänkar |
| 19 | **Styrkor/svagheter** — roadmapen sa 2, det är 3: `styrkor-svagheter` (1276/4) vs `upptack-dina-styrkor` (1771/**5**) — **samma ämne**. `styrkor-svagheter-intervju` (566/2) är en egen, smalare sökintention (den klassiska intervjufrågan) | | `upptack-dina-styrkor` | Slå ihop `styrkor-svagheter` in i `upptack-dina-styrkor`. `styrkor-svagheter-intervju` → **särskilj, rör inte**. Bonusfynd: `styrkor-svagheter`s egen titel nämner bara "styrkor", aldrig svagheter — sluggen lovar mer än innehållet håller, oavsett sammanslagning | Ordantal + inlänkar båda för `upptack-dina-styrkor` |
| 20 | **LinkedIn** — NY, inte i roadmapen: `linkedin-optimering` (1350/**11**) vs `linkedin-profil-optimering` (669/1) | | `linkedin-optimering` | Slå ihop — lägsta risken i hela listan | Överväldigande på båda mått (11 inlänkar mot 1) |
| 21 | **Digital närvaro** — NY: `digital-narvaro-rensning` (532/0) vs `googla-dig-sjalv` (651/**1**) | | — | **Väntar på Search Console + redaktionellt beslut** | `digital-narvaro-rensning`s FÖRSTA rubrik är bokstavligen "Steg 1: Googla dig själv" — den ena sidan innehåller den andras hela ämne som sitt första steg. Ordantal/inlänkar pekar svagt på `googla-dig-sjalv`, men pelare-eller-undersida-logiken pekar åt andra hållet |
| 22 | **Personligt varumärke** — NY: `bygg-ditt-personliga-varumarke` (579/**5**) vs `personligt-varumarke` (**1208**/2) | | — | **Väntar på Search Console** | Inlänkar för den ena (5 mot 2), ordantal för den andra (1208 mot 579) — motsatta signaler igen |
| 23 | **Arbetsmiljö** — gränsfall, hittat via svepet: `arbetsmiljo-guide` (661/**8**) vs `arbetsmiljo-kultur-guide` (905/3) | | — | **Särskilj (rekommenderas), inte akut** | Delvis samma ämne (röda flaggor, utvärdera arbetsplats innan anställning) men olika tyngdpunkt (fysisk arbetsmiljö/rättigheter vs. företagskultur specifikt). Redaktionell översyn räcker — ingen brådska |

## Del 2 — Kontrollerat och friskförklarat (falska positiva)

Likhetssvepet (537 kandidatpar) slog ut brett på mönster som **inte** är
kannibalisering. Läst och avfärdade, med skäl:

- **21 `jobba-som-*`/`jobba-inom-*`/`jobba-i-*`/`jobba-med-*`-sidor** —
  en yrkesguide per yrke (personlig assistent, lokalvårdare, väktare,
  lagerarbete, …). Delad mall ger hög bag-of-words-likhet men det är 21
  olika yrken, inte samma ämne.
- **`branschguide-it-tech` / `branschguide-vard-omsorg`** — samma mönster,
  olika branscher.
- **`adhd-i-arbetslivet` / `autism-och-arbete` / `dyslexi-i-ansokan-och-pa-jobbet`**
  — tre olika diagnoser i en gemensam artikelserie (uppdaterade i samma
  batch 2026-09-06), delad struktur men olika ämnen.
- **`etableringsprogrammet` / `jobb-och-utvecklingsgarantin` /
  `jobbgaranti-for-ungdomar` / `rusta-och-matcha`** m.fl. — olika
  Arbetsförmedlings-program, delar bara myndighetsvokabulär.
- **`a-kassa-sa-fungerar-det`** matchade brett mot nästan alla
  ersättnings-/bidragsartiklar — samma orsak, generisk vokabulär.
- **`arbetsprov-och-case` / `arbetspsykologiska-tester`** — olika
  bedömningsformer (arbetsprov vs. begåvnings-/personlighetstest), korslänkar
  varandra korrekt som **relaterat**, inte samma sida.
- **`intervju-forberedelser` / `intervju-fragor`** — detta är **rätt
  arkitektur**, inte kannibalisering: `intervju-forberedelser` (1993 ord, 13
  inlänkar, portalens mest länkade artikel) länkar uttryckligen vidare till
  `intervju-fragor` för den smalare frågan. Pelare-och-kluster, inte dublett.
- **`cv-utan-gymnasieexamen` / `luckor-i-cv`** — olika specifika situationer
  (ingen gymnasieexamen vs. uppehåll i CV:t), länkar varandra som relaterat.
- **`dromjobbsanalys` / `karriarplanering-guide`** — `dromjobbsanalys` länkar
  uttryckligen vidare till `karriarplanering-guide` (drömjobbsanalys som
  första steg, karriärplanering som uppföljning). Trappstegsstruktur.
- **`telefonintervju-tips` / `videointervju-tips`** — olika intervjuformat
  (telefon vs. video), länkar varandra korrekt.
- **`fragor-att-stalla-till-arbetsgivaren` / `varfor-ska-vi-anstalla-dig` /
  `varfor-slutade-du-pa-forra-jobbet` / `arbetspsykologiska-tester` /
  `lonekrav-i-ansokan`** — varje sida täcker en specifik, namngiven
  intervjufråga. Samma familj som `intervju-fragor` ovan, inte inbördes
  dubbletter.

## Del 3 — Sammanfattning: vad som går att avgöra idag

**Beslutbart nu (kriterierna är eniga), 10 kluster:**
CV lättläst (delvis — se rad 1), Intervju lättläst, Avslag lättläst (svagt),
SE2, Sociala medier (stavfel), Löneförhandling, Mental hälsa, Stresshantering,
Hantera avslag/motivation, Styrkor/svagheter, LinkedIn.

**Väntar uttryckligen på Search Console (kriterierna pekar åt olika håll), 9 kluster:**
Anpassningar arbetsplats, ATS, Motivation, Kompetensinventering/-utvärdering,
Värderingar (delvis), Nätverksunderhåll, Digital närvaro/googla dig själv,
Personligt varumärke, samt ATS-radens svagare syskon Personlighetstyper och
Ordlistor (för svagt signal för att kalla "beslutbart", men inte en hård
konflikt heller — se tabellen för nyansen per rad).

**Lämna (ingen kannibalisering, verifierat), utöver hela Del 2-listan:**
Checklista dagen-före-intervju, Nätverksbyggande-guide (pelarsida),
Arbetsmiljö-paret (gränsfall, rekommenderas särskiljas redaktionellt men
ingen brådska).

## Del 4 — De gamla URL:erna: redirect-mekanismen

**Det finns i dag ingen `redirects`-nyckel i `client/vercel.json`.** Filen har
`rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]` som SPA-
fallback. Guidesidorna byggs statiskt av `client/scripts/prerender-guides.cjs`
till `dist/guider/<slug>/index.html` (bekräftat i skriptet, rad 91/100/124/158
m.fl.) — Vercel serverar den filen direkt om den finns, **innan** rewrite-
regeln någonsin prövas (statiska filer går alltid före `rewrites` i Vercels
routningsordning).

**Det är precis där faran ligger.** Tas en artikels katalog bort ur
`dist/guider/` utan en redirect, finns ingen statisk fil kvar på den gamla
sökvägen → Vercel faller igenom till SPA-fallbacken → `/index.html` svarar
**200** på den döda guide-URL:en. Det är en mjuk 404: en indexerbar
app-shell utan innehåll, på en URL som fortfarande kan ligga kvar i Googles
index och i externa länkar. Ingenting i bygget larmar om detta —
`prerender-guides.cjs` kontrollerar att länkade guider *finns*, inte att en
borttagen guide får en efterföljare.

**Den konkreta raden som behövs i `client/vercel.json`**, en post per
avpublicerad slug, före `rewrites`-blocket (ordningen spelar roll — Vercel
prövar `redirects` före `rewrites`):

```json
"redirects": [
  { "source": "/guider/latt-svenska-cv", "destination": "/guider/lattsvenska-vad-ar-cv", "permanent": true },
  { "source": "/guider/latt-svenska-intervju", "destination": "/guider/lattsvenska-intervju", "permanent": true }
]
```

`permanent: true` ger en 308 (Vercels form av 301) — rätt val när sidan är
borta för gott, vilket det här alltid är per definition (annars hade paret
inte slagits ihop). **Testa både med och utan avslutande snedstreck** mot en
riktig deploy innan sammanslagningen går live — `dist/guider/<slug>/` är en
katalog, och `check-vercel-config.cjs` validerar bara att mönstret går att
parsa, inte att exakt den formen matchar den borttagna katalogens URL i
praktiken.

**Glöm inte:** varje sida som pekar på den borttagna sluggen i sin egen
`related_article_slugs` måste uppdateras i databasen (inte bara URL:en
omdirigerad) — annars visar den nya sidan en trasig "relaterat"-länk till en
guide som inte längre finns på den vägen. `prerender-guides.cjs` har redan
en kontroll som fäller bygget om en länkad guide saknas (se rad 176/183/212)
— den kontrollen kommer att göra sitt jobb och stoppa en slarvig
sammanslagning, men bara om `related_article_slugs` faktiskt pekar på den
nya sluggen och inte den gamla.

## Del 5 — Tidsuppskattning för genomförandet

Baserat på antalet kluster och vad var och en kräver:

- **10 "beslutbart nu"-kluster** (varav flera är enkla par): läsa igenom
  vinnarens och förlorarens innehåll, flytta över unikt stoff (t.ex.
  `lattsvenska-fragor-intervju`s exempelsvar redan säker, `stresshantering`s
  "När oron kommer på natten"-avsnitt), radera förloraren, lägga till
  redirect-rad, uppdatera `related_article_slugs` som pekade på den gamla
  sluggen, köra `npm run content:new`-liknande verifiering. **Cirka 15–25
  minuter per kluster → 2,5–4 timmar totalt.**
- **9 "väntar på Search Console"-kluster**: samma arbete per kluster, men
  först måste SC-datan avgöra vinnaren (ingen extra tid utöver
  genomförandet, förutsatt att SC-rapporten är färdig innan man börjar).
  **Samma 15–25 min/kluster → 2,5–3,5 timmar**, plus tiden att läsa och
  tolka SC-exporten (uppskattas separat, beror på hur K8 levereras).
- **Redirect-blocket i `vercel.json`**: en commit, ~15 minuter inklusive
  `npm run lint:vercel`-verifiering.
- **Total uppskattning när SC-datan finns:** en (1) arbetsdag, inte en
  eftermiddag som roadmapens ursprungliga tidsestimat för SE1+SE2 antog —
  eftersom den fulla kartan är 23 kluster, inte 2.

## Del 6 — Öppna frågor kvar till redaktören (inte tekniska)

- CV-klustret (rad 1): är "vad är ett CV" / "hur skriver du ett" / "10 tips"
  tre legitima sökintentioner eller en konstlad uppdelning av tunt innehåll
  (180–313 ord vardera)? Ingen av portalens andra lättläst-ämnen har den
  här tredelningen — det är i sig ett tecken på att den är onödig, men
  Search Console avgör om någon av de tre faktiskt får klick på sin egen
  fråga.
- `kompetensutvardering`s slug matchar inte dess egen titel
  ("Kompetensinventering: …") — detta bör rättas **oavsett** vilken sida
  som vinner sammanslagningen, eftersom det är ett fristående SEO-fel.
- `styrkor-svagheter` levererar aldrig på ordet "svagheter" i sin egen titel
  eller rubriker — värt att notera för redaktören oavsett sammanslagning.
