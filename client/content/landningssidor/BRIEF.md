# Brief: landningssidor för Jobin (spår K, omgång 7 — 2026-09-15)

Du skriver **publika landningssidor** som prerenderas till statisk HTML och ska ranka på
Google. Läsaren är **inte inloggad** — hon kom från en sökning. Sidorna fungerar utan JS.

Tre sidtyper i den här omgången:

| Typ | URL | Fil | Läsare |
|---|---|---|---|
| Situationssida | `/for-dig-som/<slug>/` | `content/situationer.json` | En arbetssökande i en viss livssituation |
| B2B-sida | `/<slug>/` | `content/b2b.json` | En köpare/arbetsgivare, inte en deltagare |
| Verktygssida | `/verktyg/<slug>/` | `content/tools.json` | En arbetssökande som söker ett verktyg |

## Ärlighetsreglerna — hårda, och de har fällt fem omgångar i rad

Portalens dyraste återkommande fel är påhittade uppgifter. En läsare fattar beslut om sin
försörjning utifrån det här.

1. **Aldrig belopp, procentsatser, dagantal, åldersgränser eller inkomsttak.** Inte "80 % av
   lönen", inte "i 300 dagar", inte "minst 6 månaders arbete". Beskriv **mekanismen** — vad
   som avgör, vem som beslutar, i vilken ordning — och hänvisa till myndigheten för det exakta.
   *Undantag:* ett tal som beskriver **portalen själv** och som du verifierat i koden
   (t.ex. antal mallar) är tillåtet.
2. **Ingen påhittad statistik.** Inga "de flesta arbetsgivare", "många upplever",
   "forskning visar", "9 av 10". Kan du inte namnge källan — skriv inte påståendet.
3. **Ingen social bevisning.** Inga användarsiffror, omdömen, betyg, framgångshistorier.
   Portalen har få aktiva användare; ett påstående om motsatsen är en lögn.
4. **Hitta inte på egenskaper hos Jobin.** Varje påstående om vad portalen gör ska gå att
   belägga i koden. Du får läsa koden. Du får inte gissa.
5. **Osäker? Utelämna.** En kortare sida som stämmer slår en längre som kanske inte gör det.
6. Myndigheter länkas till **startsidan eller en stabil avdelningssida** vid första
   förekomsten: `https://arbetsformedlingen.se`, `https://www.forsakringskassan.se`,
   `https://www.skatteverket.se`, `https://www.uhr.se`, `https://www.1177.se`,
   `https://www.av.se`, `https://www.do.se`. Djuplänka aldrig.

**Priset är gratis för deltagaren i dag.** Skriv "kostnadsfritt" bara om deltagarens verktyg.
Skriv aldrig ett pris för organisationer — det är ett öppet beslut (ROADMAP AG9).

## Röst och ton (docs/DESIGN.md §2)

- **Lugn vän, inte myndighet och inte reklam.** Som någon som suttit bredvid personen som
  fyller i blanketten.
- **Ingen prestationston.** Aldrig "du måste bli bättre på", "de flesta misslyckas".
- **Inget administrationsspråk.** "Aktivera" → "slå på". "Konfigurera" → "ändra".
- **Rubriker är inviter, inte etiketter.**
- **Du-tilltal.** Korta stycken, ett stycke = en tanke.
- **Erkänn det svåra utan att dramatisera.**
- Inga emojis, inga utropstecken, inga em-streck (`–` sparsamt).
- *Undantag för B2B-sidan:* köparen tilltalas som yrkesperson — sakligt, konkret,
  fortfarande utan säljspråk. DESIGN.md §2 tillåter uttryckligen den växlingen.

## Gränser som bygget mäter

- `title` ≤ 60 tecken (varumärket " — Jobin" läggs på automatiskt och släpps om det inte får plats)
- `description` 110–155 tecken, en hel mening, ingen avhuggen text
- `h1` ≠ `title` ordagrant, men samma ämne
- `lead` 1–3 meningar
- Varje slug i `guider` **måste finnas i publiceringslistan** — bygget fäller annars
- Varje slug i `verktyg` måste finnas i `content/tools.json`
- Varje `route` måste finnas som `<Route path=…>` i `client/src/App.tsx`
- Slugar är gemener, bindestreck, inga å/ä/ö. **Sluggen blir URL:en för all framtid.**

## Schema — situationssida (`content/situationer.json`)

```json
{
  "sidor": [
    {
      "slug": "langtidsarbetslos",
      "title": "≤60 tecken, sökordet först",
      "description": "110–155 tecken.",
      "h1": "Rubriken på sidan",
      "lead": "1–3 meningar som svarar direkt.",
      "igenkanning": {
        "rubrik": "Invit, inte etikett",
        "punkter": ["3–5 korta rader som beskriver läget utan att döma"]
      },
      "steg": [["Rubrik", "Text, 2–4 meningar"], ["…", "…"], ["…", "…"]],
      "verktyg": ["cv", "intervjutraning"],
      "guider": ["efter-manga-ar-utan-jobb", "…"],
      "faq": [["Fråga?", "Svar, 2–4 meningar."]],
      "ctaLabel": "Kort uppmaning"
    }
  ]
}
```

`steg` = 3 stycken. `verktyg` = 3–5 slugs. `guider` = 4–6 slugs. `faq` = 4–5 par.

## Rapportera mätvärden, inte "verifierat"

Fem omgångar i rad har agenter rapporterat sitt arbete som rent, och fem gånger har egen
mätning hittat fel de missat. Redovisa: teckenlängder per fält, antal poster, vilka slugs du
kontrollerat mot vilken fil, och vilka påståenden du belagt i vilken kodfil med radnummer.
