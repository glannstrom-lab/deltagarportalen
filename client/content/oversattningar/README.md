# Engelska översättningar av enskilda artiklar

Kunskapsbankens engelska bor i kolumnerna `title_en`, `summary_en` och `content_en` i
prod-tabellen `articles` (se `docs/innehallsoversattning.md` §3). De 24 artiklar som
översattes 2026-09-08 gjordes i ett svep utan skript; den här mappen är spåret för
översättningar som görs **en artikel i taget** efteråt.

Per artikel: `<slug>.en.md` (brödtexten, samma markdownstruktur som svenskan) och
`<slug>.en.json` (titel, sammanfattning, regler). `_backup.json` bär värdena som stod
i prod innan senaste skrivningen.

**Skrivningen** görs med `npx supabase db query --linked -f <fil>` och en dollar-citerad
`UPDATE articles SET title_en=…, summary_en=…, content_en=… WHERE slug=…`, med
**CRLF** i `content_en` (prod bär CRLF i de engelska kolumnerna, LF i de svenska —
uppmätt 2026-09-08; strängmatchning måste använda fältets egna radslut). Torrkör genom
att först läsa raden och jämföra längder; verifiera efteråt med `length(content_en)`
och `left(content_en, 80)`.

**Reglerna** (samma som i `new-articles/BRIEF.md` och `sprakparitet.test.ts`): B1-engelska
för läsare med varken svenska eller engelska som modersmål; svenska myndighets- och
begreppsnamn översätts aldrig bort utan förklaras i parentes vid första förekomsten;
inga belopp, procentsatser eller villkor som inte står i svenskan; rubriker, listor,
tabeller och länkar identiska med svenskan (kontrollera med en strukturjämförelse
innan skrivning).

**Var engelskan syns:** i portalens artikelvy (`contentApi.ts` väljer `*_en` när
språket är engelska, annars svenska). De prerenderade guidesidorna i `dist/guider/` är
svenska med flit (SEO-yta) och läser inte `content_en`.

| Slug | Skriven | Tecken sv → en |
|---|---|---|
| `aktivitetskrav-forsorjningsstod` | 2026-09-12 | 6 303 → 7 401 (7 318 med LF) |
