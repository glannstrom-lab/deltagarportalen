# Uppdrag: slipa befintliga guider (innehållsomgång 12)

Sidorna syns i Google men får nästan inga klick. Ditt jobb är att göra titel, summary och de
första meningarna till det läsaren faktiskt söker efter, och att rätta det som är fel i texten.

## Läs först
- `client/content/new-articles/BRIEF.md` hela. Ärlighetsreglerna, tonen och formatet gäller här.
- Ditt underlag `client/content/expansions/arkiv-2026-11-om12/_underlag.<KLUSTER>.md`.
- Förtexterna `client/content/expansions/arkiv-2026-11-om12/fore/<slug>.md`.
- Förlaga: `client/content/expansions/arkiv-2026-11/slipat/varning-fran-arbetsformedlingen.md`.
- `client/content/new-articles/_befintliga-slugs.txt` (länka bara till sluggar som finns där).

## Leverans
- `client/content/expansions/<slug>.md`: hela brödtexten, ingen `# H1`.
- `client/content/expansions/_meta.<KLUSTER>.json`: `{ "<slug>": { "title": "...", "summary": "..." } }`.
- Rör inga andra filer. Kör aldrig `apply-expansions`, `content:new` eller något mot prod.

## Regler
- **Titel ≤ 60 tecken, summary ≤ 155.** Använd läsarens ord ur frågelistan, som en mening en
  människa skrivit. Ändra inget som redan fungerar utan skäl.
- **Ingressen svarar direkt** på sidans största fråga, på ett sätt som är sant.
- **Långsvansfrågor** får en egen `## `-rubrik eller en `### ` under `## Vanliga frågor` när de
  hör till sidan. Frågor som inte hör till sidan (till exempel "varumärke byggföretag") ignoreras.
- **Ingen siffra som är en regel.** Inga belopp, procent, dagantal, åldersgränser. Mekanism,
  beslutsfattare, länk till myndigheten. Hittar du en sådan siffra i förtexten: ta bort den.
- **Inga obelagda generaliseringar**: "de flesta", "många upplever", "forskning visar", "oftast",
  "normalt". Finns de i förtexten: stryk eller belägg.
- **Fyll inte ut.** Ingen stor längdökning för Googles skull. Bevara det som är bra.
- **Sakgranskning.** Kontrollera varje regelpåstående mot myndighetens egen sida med WebSearch
  och WebFetch, inte mot leverantörer, fack eller minnet. Briefen är ingen källa. Kan du inte
  belägga något: ta bort det och säg det i rapporten.
- **Frågor av typen "måste jag", "kan jag tacka nej", "förlorar jag":** inget lugnande Ja/Nej
  utan belägg. Sådana svar kan kosta läsaren ersättningen.
- **Reformerade regelverk:** a-kassan 2025-10-01 (inkomstvillkor, månadsansökan, inget
  arbetsvillkor eller kassakort; undvik ordet grundersättning), sanktioner för programdeltagare
  2026-06-01, lönegarantin 2025-02-01, etableringsersättningens tillägg 2026-09-01. LAS säger
  "sakliga skäl". Allmän visstid är ersatt av särskild visstid. Kontrollera stöd och program
  som kan vara avvecklade.
- **Varje myndighet som nämns länkas** till sin startsida eller stabila avdelningssida vid
  första förekomsten. Varje "Läs mer om ..." är en riktig markdown-länk till
  `/knowledge-base/article/<slug>`.
- Ingen kursiv för betoning, inga emojis, inga utropstecken.

## Rapportera mätvärden
Per sida: titel + längd, summary + längd, ord före/efter, antal externa länkar. Lista sedan
**SAKÄNDRINGAR** (vad som var fel, med källa) och vad du inte kunde belägga. Skriv inte "verifierat".
