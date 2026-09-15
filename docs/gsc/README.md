# Search Console-mätningar för jobin.se

Den här katalogen finns för att K8 ska gå att svara på **nästa** gång också.
Roadmapens regel (K4) är att ingen innehållsomgång görs utan mätning från den
föregående. Regeln frångicks fem gånger i rad av ett enkelt skäl: det fanns
ingen mätpunkt att jämföra mot. Nu finns det en.

## Hämta en ny mätning

```bash
node docs/gsc/hamta.mjs docs/gsc          # skriver jobin-gsc.json
```

Kräver att ADC har rätt scope. Engångskommando, öppnar webbläsare:

```bash
gcloud auth application-default login \
  --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/webmasters.readonly
```

Döp om utfallet till `jobin-<ÅÅÅÅ-MM-DD>.json` och **committa bredvid den
gamla** — skriv aldrig över. Det är jämförelsen som är värdet, inte filen.

## Fyra fällor, alla mätta 2026-09-15

1. **ADC kräver `x-goog-user-project`.** Utan headern svarar API:t `403
   accessNotConfigured`, vilket ser ut som saknad behörighet men är ett
   kvotprojekt som inte skickats med. `gcloud auth login --scopes=…` finns
   inte i SDK 584 — flaggan sitter på `application-default login`.

2. **Frågeuttaget sorteras på KLICK, inte exponeringar.** Ett uttag på 1 000
   rader ser ut som "topp 1 000" men är "de 1 000 med flest klick" — och när
   nästan allt har noll klick blir urvalet bland dem godtyckligt. Det första
   uttaget täckte 40 % av exponeringarna och hade en topplista som inte var
   en topplista. Paginera med `startRow` och sortera själv.

3. **Frågedatan täcker aldrig allt.** 1 397 frågor bär 10 016 av 17 211
   exponeringar (58 %). Resten är anonymiserade av Google för att skydda
   sällsynta sökningar. **Använd `sidor` för totalsiffror, aldrig `fragor`.**

4. **Sidsummor kan överstiga totalen** (17 815 mot 17 211, 104 %). Det är
   inte ett fel: en sökning som visar två av våra sidor räknas en gång i
   totalen och två gånger per sida. Dividera aldrig sida/total som en andel.

Egendomen är en **domänegendom** (`sc-domain:jobin.se`), så den täcker både
`www` och apex. Kanonisera ändå bort `www.` och avslutande snedstreck innan
sidor summeras — analysskriptet gör det.

## Mätpunkter

| Fil | Period | Exponeringar | Klick | CTR | Snittposition |
|---|---|---|---|---|---|
| `jobin-2026-09-15.json` | 2026-08-04 → 2026-09-13 (41 dagar) | 17 211 | 75 | 0,44 % | 24,4 |

Historiken börjar 4 augusti 2026 — inte för att sajten var osynlig dessförinnan,
utan för att egendomen verifierades då. Prerenderingen (K1–K6) gick live 5
augusti, så mätningen och motorn är i praktiken jämnåriga. Det finns alltså
**ingen före-bild** att jämföra mot, och kommer inte att finnas.
