# Granskning 2026-08-09 — den publika ytan (jobin.se)

**Omfattning:** startsidan, `/verktyg/` (K6), `/guider/` (K2–K5, K9, K10), SEO-teknik, prestanda, konverteringsflödet och läckagekontroll.
**Metod:** mätt mot **prod** (`https://www.jobin.se`, commit `f2877dcb`) med curl, Playwright 1.59.1 (Chromium, 1440×900 och 390×844), axe-core 4.x och `npx supabase db query --linked`. Inga ändringar gjorda i kod, databas eller befintliga dokument.
**Skärmdumpar:** `docs/review-2026-08-09/bilder/` (filnamn anges vid varje fynd).

---

## 1. Sammanfattning

Den prerenderade delen av den publika ytan är **teknisk sett mycket bra**: 139 av 139 sitemap-URL:er svarar 200, canonical stämmer på varenda en, JSON-LD är valid, axe-core hittar **noll WCAG-överträdelser** på sju sidor × två breddpunkter, och LCP på guidesidorna är 436–708 ms även på strypt Slow 4G. K1–K6, K9 och K10 håller vad de lovar — lästiderna är verifierade (1 av 133 avviker ≥2 min).

Problemen ligger inte i motorn utan i **vad ytan säger och vart den leder**.

Startsidan påstår **5 000+ aktiva användare, femstjärnigt betyg och 30+ kommuner** — prod har **92 konton, varav 7 aktiva senaste 30 dagarna** och ingen organisationstabell alls. Tre "verkliga historier" under rubriken *Omdömen* är påhittade personer. Trustmärket **"Servrar i EU. Ingen data lämnar EES"** motsägs av projektets eget `docs/HOSTING-REGIONS.md`. Detta är exakt det spår B och K6 sa nej till, fast på den sida som når flest.

Och tratten är bruten i båda ändar: startsidans `<title>` säljer B2C men sidan är B2B, startsidan länkar **inte** till någon av de 137 prerenderade sidorna, och **varje CTA på alla 138 prerenderade sidor** leder till en inloggningsskyddad route där gästen tyst dumpas på B2B-säljsidan.

---

## 2. Fynd

### 1. KRITISK — Startsidan påstår 5 000+ användare, femstjärnigt betyg och 30+ kommuner. Prod har 92 konton.

**Bevis.** Renderad text på `https://www.jobin.se/` (sektion 1):

```
5 000+ | aktiva användare | betyg från användare (5 fyllda stjärnor) | 30+ | Kommuner
```

Källa: `client/src/pages/Landing.tsx:412` (`5 000+`), `:426` (`30+`), `:417-421` (fem hårdkodade `<Star className="fill-amber-400">`). Etiketterna i `client/src/i18n/locales/sv.json` → `landing.socialProof.users`, `landing.socialProof.rating`, `landing.trust.municipalities`.

Mätning mot prod:

```
$ npx supabase db query --linked "select (select count(*) from profiles) as profiles,
                                         (select count(*) from auth.users) as authusers;"
 profiles | authusers
 92       | 92

$ npx supabase db query --linked "select count(*) from profiles where updated_at > now() - interval '30 days';"
 recent_active
 7
```

Ingen tabell i `public` matchar `%organi%`, `%kommun%` eller `%tenant%` — det finns ingen datakälla som ens skulle kunna underbygga "30+ kommuner". Betyget har ingen insamlingsmekanism någonstans i koden.

`5 000+` mot 92 är en faktor **54**. Skärmdump: `start-desktop-full.png`.

**Åtgärd.** Ta bort hela social-proof-sektionen (`Landing.tsx:407-431`). K6-raden i ROADMAP formulerade redan regeln — *"Ingen påhittad social bevisning: inga användarsiffror, inga omdömen, inga betyg"* — den behöver bara gälla även startsidan. **S**

---

### 2. KRITISK — Tre påhittade omdömen presenteras som "Verkliga historier från människor som hittat sin väg tillbaka till arbetslivet"

**Bevis.** Renderad sektion 8 (`claim-omdomen.png`):

```
OMDÖMEN
Det här säger våra användare
Verkliga historier från människor som hittat sin väg tillbaka till arbetslivet.

"Jobin gjorde att jag kunde komma tillbaka i min takt."  — Anna, 47, Deltagare, Stockholm
"Jag har 22 deltagare och ser deras framsteg på en skärm." — Lars, Arbetskonsulent, Göteborg
"Vi går från 60 till 200 deltagare nästa kvartal."         — Maria, VD, jobbcoachföretag
```

Personerna är hårdkodade fallbacks i `client/src/pages/Landing.tsx:838-853`. Ingressen kommer från `sv.json` → `landing.testimonials.description`. Det finns dessutom **en andra, helt annan uppsättning påhittade omdömen** i samma fil (`landing.testimonials.quote1`–`quote4`: *Anna 34, Marcus 41, Sofia, Erik 52*) som inte renderas — två parallella fiktiva persongallerier.

Koden själv avslöjar problemet: `Landing.tsx:832` har fallbacken *"Citaten nedan är hämtade från användarintervjuer 2026."* Användarintervjuer står i `docs/ROADMAP.md` §4 som en **planerad** Q4-aktivitet ("användarintervjuer (5 deltagare + 3 konsulenter)"). De har inte genomförts.

Med 92 konton och 7 aktiva finns det ingen Lars med 22 deltagare. "Vi går från 60 till 200 deltagare nästa kvartal" är en tillväxtprognos tillskriven en påhittad VD.

**Åtgärd.** Radera sektionen (`Landing.tsx:824-856`) och båda i18n-uppsättningarna. Återkom när intervjuerna faktiskt är gjorda och personerna har godkänt citaten. **S**

---

### 3. KRITISK — "Servrar i EU. Ingen data lämnar EES" är falskt enligt projektets eget dokument

**Bevis.** Renderad sektion 6 på startsidan:

```
SÄKERHET OCH REGELEFTERLEVNAD
GDPR-kompatibel | All data hanteras enligt EU:s dataskyddsförordning
EU-data         | Servrar i EU. Ingen data lämnar EES.
AF-integration  | Direkt koppling till Arbetsförmedlingens API:er
```

`docs/HOSTING-REGIONS.md` (rad 9–17), projektets egen policy:

| Tjänst | Region | Status |
|---|---|---|
| OpenRouter (AI-modell `gpt-oss-120b`) | **USA** | **❌ NON-EU** |
| Sentry | Multi-region (**USA default**) | ⚠️ |
| Vercel Blob (profilbilder) | ⚠️ **måste verifieras manuellt** | ⚠️ |

Samma dokument, rad 60: *"Beslut 2026-05-15: Behåller `gpt-oss-120b` av kostnadsskäl. Avvikelsen dokumenteras i samtyckesgaten."* Avvikelsen är alltså känd, beslutad och dokumenterad — men startsidan säger motsatsen utan förbehåll. **All** AI-funktionalitet i portalen går genom den vägen.

Till det: startsidan hämtar ett stylesheet från Google **innan** något cookie-val gjorts.

```
$ (Playwright, ny kontext, inga cookies, ingen consent-klick)
200 stylesheet https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700
                &family=Playfair+Display:...&family=Source+Sans+3:...&display=swap
```

IP-adress och user-agent går till Google (USA) vid första besöket på just den sida som påstår att ingen data lämnar EES.

FAQ-svaret förvärrar: `sv.json` → `landing.faq.a4` säger *"servrar i EU"* och *"dina texter skickas till OpenAI"*. Personuppgiftsbiträdet är **OpenRouter**, inte OpenAI (`connect-src https://openrouter.ai` i CSP:n bekräftar vägen).

**Åtgärd.** Tre delar: (1) skriv om EU-badgen till det som är sant ("Konto och data i EU. AI-bearbetning sker hos leverantör i USA — du samtycker separat"), (2) rätta `faq.a4` till rätt biträde, (3) självhosta typsnitten (de ligger redan som `preconnect` i `index.html` — byt till lokala `.woff2`, vinner både GDPR och render-blocking). **M**

---

### 4. KRITISK — Varje CTA på de 138 prerenderade sidorna leder till en skyddad route; gästen dumpas tyst på B2B-säljsidan

**Bevis — reproducerat i webbläsare.** Från `/guider/ai-jobbsokning-guide/`, klick på primär-CTA "LinkedIn-hjälpen — kom igång":

```
after CTA url: https://www.jobin.se/#/linkedin-optimizer
h1:            [ 'Stärk dina deltagare mot jobb' ]
body:          KOMPLETT PLATTFORM FÖR ARBETSMARKNADSTJÄNSTER | Stärk dina deltagare mot jobb |
               En komplett digital plattform för jobbcoacher och arbetsmarknadsaktörer...
```

Ingen inloggningsruta, ingen förklaring, ingen väg tillbaka. Samma sak för `/#/cv`, `/#/oversikt` och `/#/knowledge-base` (skärmdumpar `anon___cv.png`, `anon___oversikt.png`, `anon___knowledge-base.png`, `funnel-2-cta-target-mobil.png`).

**Orsak i koden.** `client/src/App.tsx:116-117`:

```tsx
if (!isAuthenticated) {
  return <Navigate to="/" replace />
}
```

Ingen `returnTo`, ingen `state.from`. `Login.tsx` läser heller inget sådant. `RootRoute` (`App.tsx:164-173`) renderar `<Landing />` för gäster — alltså B2B-säljsidan.

**Omfattning.** `client/scripts/lib/guides.cjs:23`:

```js
const appUrl = (route) => `${SITE}/#${route}`
```

Alla CTA:er i `guide-template.cjs` byggs med den (`:237`, `:253`, `:263`, `:264`, `:284`, `:347`, `:355`). 133 guidesidor + `/guider/` + `/guider/lattlast/` + 5 verktygssidor = **138 sidor** vars samtliga primär-CTA:er landar här.

**Premissgranskning.** Byggrinden `validateRoutes()` som K6 införde kontrollerar att routen *finns* i `App.tsx` — inte att en **gäst** kan nå den. Grinden är grön och tratten är bruten samtidigt.

**Åtgärd.** Antingen (a) skicka CTA:erna till `/#/register?next=<route>` och låt `Login`/`Register` navigera vidare efter inloggning, eller (b) låt `ProtectedRoute` rendera en liten "logga in för att fortsätta"-vy som bevarar målet i stället för `<Navigate to="/">`. Utöka `validateRoutes()` till att också kräva att routen är gästnåbar **eller** går via register-CTA. **M**

---

### 5. HÖG — `<title>`, description och OG säljer B2C; sidan är B2B

**Bevis.**

```
<title>Jobin — verktyg och stöd för dig som söker jobb</title>
<meta name="description" content="Jobin hjälper dig som söker jobb: skriv CV och personligt
      brev, öva inför intervjun och håll koll på dina ansökningar — med stöd hela vägen.">
<meta property="og:title" content="Jobin — verktyg och stöd för dig som söker jobb">
```

Renderad H1 (både 1440 px och 390 px):

```
KOMPLETT PLATTFORM FÖR ARBETSMARKNADSTJÄNSTER
Stärk dina deltagare mot jobb
En komplett digital plattform för jobbcoacher och arbetsmarknadsaktörer. Ge dina
deltagare moderna verktyg ... med full insyn och uppföljning för dig som konsulent.
```

Skärmdumpar: `start-desktop.png`, `start-mobil.png`.

Google-snippet och delningskort lovar alltså en jobbsökarsajt; klicket levererar en säljsida för arbetsmarknadsaktörer. Det är samtidigt den **enda** sidan i sitemapen som inte matchar sin egen titel, och den sida all varumärkessökning ("jobin") landar på.

**Fem-sekunderstestet:** en arbetssökande får inom fem sekunder veta att *någon annan* ska stärka *sina* deltagare. Kortet "Jag söker jobb" ligger cirka 1 100 px ned, under fold på både desktop och mobil.

**Åtgärd.** Bestäm vem startsidan är till för. Med B2C-först-beslutet (ROADMAP K, 2026-08-05) borde hjälten tala till den arbetssökande och B2B ligga på K7-sidan. Kortsiktigt minimum: låt `<title>`/description/OG beskriva den sida som faktiskt visas. **M**

---

### 6. HÖG — Startsidan länkar inte till någon av de 137 prerenderade sidorna

**Bevis.** Fullständig lista över `<a href>` på renderad startsida (Playwright, efter cookie-val):

```
#main-content, #/, #/login, #/register, #/privacy, #/terms, #/ai-policy, #/tillganglighet,
mailto:demo@jobin.se, mailto:sales@jobin.se, mailto:support@jobin.se
```

Noll träffar på `/guider/` och noll på `/verktyg/`. Footerkolumnen "Funktioner" listar *CV-generator*, *Intresseguide*, *Jobbsök* — alla tre pekar på `#/register`, inte på de publika verktygssidorna som finns för exakt de sökorden.

Konsekvens: hela den prerenderade korpusen (131 guider + `/guider/` + `/guider/lattlast/` + 5 verktygssidor) är **föräldralös från rot**. Enda upptäcktsvägen är `sitemap.xml`. Internt länkvärde från startsidan — den enda sida som har externa länkar — flödar ingenstans.

**Åtgärd.** Lägg in `/guider/` och `/verktyg/` i toppnav och footer, och peka footerns funktionslänkar på verktygssidorna i stället för på register. **S**

---

### 7. HÖG — Startsidan är den enda sidan på sajten som failar Core Web Vitals

**Bevis.** Playwright + CDP, Slow 4G (1,6 Mbit/s ned, 150 ms RTT) och 4× CPU-strypning, 390×844:

| Sida | FCP | LCP | Tid till första riktiga H1 |
|---|---|---|---|
| `/` | 856 ms | **4 368 ms** | **4 310 ms** |
| `/guider/cv-grunder/` | 436 ms | 436 ms | 742 ms |
| `/verktyg/cv/` | 708 ms | 708 ms | 828 ms |

4 368 ms ligger i **Poor**-bandet (>4 000 ms). FCP på 856 ms är spinnern, inte innehåll — `/` levererar noll serverrenderat innehåll:

```
$ curl -s https://www.jobin.se/ | sed -n '/<body/,/<\/body>/p' | sed 's/<[^>]*>//g'
   <div id="initial-loader" ...> ... Laddar Jobin...
$ curl -s https://www.jobin.se/ | grep -c noscript
0
```

Kostnaden: 172 kB brotli JS + 38 kB brotli CSS + 14 `@font-face` från Google — för att måla en marknadsföringssida.

```
$ curl -H 'Accept-Encoding: identity' /assets/index-BDJfxm85.js  → 543 244 B
$ curl -H 'Accept-Encoding: br'       /assets/index-BDJfxm85.js  → 172 290 B
$ curl -H 'Accept-Encoding: br'       /assets/index-DyVYzPZT.css →  37 761 B
```

Skärmdumpar: `slow4g-_.png` (spinner efter navigering) mot `slow4g-_guider_cv-grunder_.png`.

Utan JS finns startsidan inte alls — varken för Google eller för en användare med tung uppkoppling. Motorn för att lösa det finns redan i repot (`prerender-guides.cjs`).

**Åtgärd.** Prerendera startsidan med samma motor som guiderna, eller lägg minst hjälten som statisk HTML i `index.html` under `#initial-loader`. Självhosta typsnitten (se fynd 3). **M**

---

### 8. HÖG — På mobil täcker cookierutan den primära CTA:n

**Bevis.** Hit-test på 390×844 efter full laddning, utan att röra något:

```json
{"rect":{"t":470,"b":528},"inViewport":true,
 "topElementAtCenter":"DIV.p-6","blocked":true}
```

"Skapa konto gratis" ligger i viewporten (y 470–528), men `document.elementFromPoint` på knappens mittpunkt returnerar cookiemodalens `DIV.p-6`. Knappen går alltså inte att klicka. Skärmdumpar: `start-mobil.png`, `mobil-cookie-blocks-cta.png`.

Samma familj som lärdomen 2026-08-04 (UX16): ett fixerat lager lades över ett annat och verifieringen kollade det som lagades, inte det som täcktes. Här är det den primära konverteringsknappen som täcks, på den viewport där de flesta besökare kommer.

**Åtgärd.** Flytta cookiebannern till en bottenfäst remsa i stället för en centrerad modal på små skärmar, eller flytta hjälte-CTA:n ovanför bannerns yta. Lägg till hit-testet som e2e-regression. **S**

---

### 9. HÖG — Två CTA:er på startsidan gör inte vad de säger

**Bevis.** `client/src/pages/Landing.tsx:381-387`:

```tsx
<button onClick={() => scrollToSection('audience')} ...>
  {t('landing.hero.ctaSecondary', 'Boka 30 min demo')}
</button>
```

Hjältens sekundära CTA — den mest exponerade B2B-knappen på sajten — **skrollar nedåt**. Verifierat i webbläsare: klick ger `url = https://www.jobin.se/`, oförändrad H1. Två andra knappar med *identisk* etikett (`:543`, `:902`) är riktiga `mailto:demo@jobin.se`. Samma ord, tre knappar, två beteenden.

`Landing.tsx:507-513`:

```tsx
<button onClick={() => scrollToSection('faq')} ...>
  {t('landing.audience.consultant.cta', 'Se konsulentvyn')}
</button>
```

"Se konsulentvyn" skrollar till FAQ. Konsulentvyn (`/consultant`, portalens enda enligt CLAUDE.md) är inloggningsskyddad och visas aldrig.

Det här är spår B rakt av: knappar som lovar mer än de gör, på den yta där förtroendet ska byggas.

**Åtgärd.** Gör hjälteknappen till samma `mailto:` som de andra två, eller döp om den till det den gör ("Se vem Jobin är för"). Byt "Se konsulentvyn" mot en riktig demobild/skärmdump eller ta bort den. **S**

---

### 10. HÖG — Kannibalisering: två parallella lättläst-familjer och två identiska `<title>`

**Bevis.** Slug-analys av de 131 publicerade guiderna (jämförelse med `difflib`, tröskel 0,80):

```
0.98  latt-svenska-intervju        | lattsvenska-intervju
0.97  latt-svenska-cv              | lattsvenska-cv
0.97  latt-svenska-avslag          | lattsvenska-avslag
0.98  sociala-medier-jobbsokning   | sociala-medier-jobsokning
0.96  anpassningar-arbetsplats     | anpassningar-arbetsplatsen
0.88  personlighetstyper-arbete    | personlighetstyper-i-arbetslivet
0.83  personlighetstyper-arbete    | personlighetstyper-jobb
```

Två separata namnfamiljer täcker samma nisch: `latt-svenska-*` (5 st) och `lattsvenska-*` (10 st). Inom dem finns **tre** CV-artiklar (`latt-svenska-cv`, `lattsvenska-cv`, `lattsvenska-vad-ar-cv`, plus `lattsvenska-tips-bra-cv`) och **tre** intervjuartiklar.

Två sidor har **exakt samma `<title>`** (full genomsökning av alla 139 URL:er):

```
'Vad är ett CV? — Jobin'
    /guider/latt-svenska-cv/
    /guider/lattsvenska-vad-ar-cv/
'Hitta dina värderingar – nyckeln till rätt jobb — Jobin'
    /guider/hitta-dina-varderingar/
    /guider/varderingar-i-arbetslivet/
```

Texterna är **inte** kopior (kroppslikhet 0,06–0,26) — det är fyra separata texter som konkurrerar om samma sökning. Google väljer en och nedvärderar resten; signalerna splittras. `sociala-medier-jobsokning` är dessutom en felstavad slug (`jobsokning` saknar b).

Det slår hårdast i **precis den nisch K5 pekade ut som strategisk**.

**Åtgärd.** Slå ihop paren till en sida per intent, 301:a den svagare till den starkare (kräver en redirect-regel i `vercel.json` — behöver Mikaels ja) eller sätt `<link rel="canonical">` till vinnaren. Lägg en byggrind som failar på identisk `<title>` mellan två publicerade slugs. **M**

---

### 11. MEDEL — Varje URL som inte finns svarar 200 med indexerbar SPA-shell

**Bevis.**

```
/denna-sida-finns-inte-xyz        → 200  text/html  11404 B
/guider/finns-inte-alls/          → 200  text/html  11404 B
/verktyg/finns-inte/              → 200  text/html  11404 B
/assets/index-BDJfxm85.js.map     → 200  text/html  11404 B
```

11 404 B är `index.html` — samma svar som `/`, med `<meta name="robots" content="index, follow">`. Vilken felstavad, gammal eller påhittad URL som helst blir en 200-sida som Google får crawla. Att canonical pekar på `https://www.jobin.se/` dämpar effekten men skapar i stället soft-404:or i Search Console och slösar crawlbudget på 131 sidor som behöver den.

Positivt sidofynd: samma test visar att **inga sourcemaps är publicerade** (`.map` → SPA-shell, inte JS).

**Åtgärd.** Servera `dist/404.html` med riktig 404-status för allt utom kända SPA-routes, eller lägg `<meta name="robots" content="noindex">` på fallbacken. Rör `client/vercel.json` → kräver Mikaels ja. **M**

---

### 12. MEDEL — `/guider/lattlast/` är föräldralös från guideindexet

**Bevis.**

```
guide-länkar på /guider/:                            131
i sitemapen men INTE länkade från /guider/:            1
   /guider/lattlast/
grep -c 'lattlast' på /guider/:                        0
```

K5:s ingångssida — den sida som ROADMAP kallar "strategisk nisch" och som ger de 15 lättläst-artiklarna sin extra interna länkning — nås inte från guidekatalogen. Den nås inte heller från startsidan (fynd 6). Enda vägen dit är sitemapen.

**Åtgärd.** Lägg `/guider/lattlast/` som ett framhävt kort överst på `/guider/` (`guide-template.cjs`, indexsidan). **S**

---

### 13. MEDEL — Guider och verktyg är två silor som inte korsar varandra

**Bevis.** `/guider/` innehåller **noll** länkar till `/verktyg/*`. Genomgång av 14 guidesidor gav dessa unika interna länkmål:

```
/  ·  /guider/  ·  /guider/<43 olika slugs>  ·  /#/privacy  ·  /#/tillganglighet
```

Ingen guide länkar till en verktygssida. Riktningen är enkelriktad: `/verktyg/` → `/guider/` finns, `/guider/` → `/verktyg/` finns inte.

Det betyder att de 131 sidor som ska dra in trafik saknar väg till de 5 sidor som ska konvertera den. Guidernas verktygs-CTA:er går i stället direkt in i den skyddade appen (fynd 4) — alltså förbi konverteringssidan och rakt in i en vägg.

**Åtgärd.** Låt `verktygFor()` i `guides.cjs` peka på `/verktyg/<verktyg>/` i stället för `appUrl(route)` för de fyra verktyg som har en publik sida. Ett byte, löser halva fynd 4 på köpet. **S**

---

### 14. MEDEL — Prissidan har "Populärast"-badge men ingen väg att köpa

**Bevis.** Renderad sektion 7 (`claim-priser.png`): *Organisationslicens 2 990 kr/månad* med badgen **"Populärast"**, *Per konsulent 290 kr/månad*, *Deltagare Gratis*. CTA på de två betalda: `mailto:sales@jobin.se`. Avslutande sektion: *"Ingen bindningstid. Inga startavgifter. Kom igång inom 24 timmar."*

Ingen betalningsintegration finns i repot — sökning på `stripe|klarna|swish|checkout.session` i `client/src`, `client/api` och `supabase/functions` ger inga träffar i faktisk betalningskod. Ingen organisations- eller licenstabell finns i prod (se fynd 1). "Populärast" är samma sorts påstående som 5 000+ användare: en jämförelse mellan tre alternativ där inget har sålts.

FAQ-svaret (`sv.json` → `landing.faq.a1`) upprepar priserna som fastställt faktum.

**Åtgärd.** Ta bort "Populärast" (`sv.json` → `landing.pricing.mostPopular`). Behåll priserna — de kan mycket väl vara Mikaels avsedda prislista — men verifiera att "Kom igång inom 24 timmar" är ett löfte som går att hålla. **S**

---

### 15. MEDEL — Registreringen är den hårdaste grinden i hela tratten

**Bevis.** `/#/register`, fältinventering i webbläsare (`register-desktop.png`):

```
Förnamn · Efternamn · E-postadress · Lösenord · Bekräfta lösenord
+ 3 checkboxar (villkor*, integritetspolicy*, AI-behandling)

Lösenordskrav: Minst 12 tecken · En stor bokstav · En liten bokstav
               · En siffra · Ett specialtecken (!@#$%^&* etc)
```

Fem textfält och tre kryssrutor, med ett lösenordskrav på 12 tecken och fyra teckenklasser. Sammansättningsregler av den typen avråds numera uttryckligen (NIST SP 800-63B) eftersom de sänker faktisk säkerhet och höjer avhoppen.

För portalens målgrupp — långtidsarbetslösa, ofta med kognitiva eller psykologiska utmaningar — är det den brantaste punkten i hela flödet, och den ligger sist. Verktygssidornas FAQ säger samtidigt: *"Du skapar ett konto med e-post, och sedan är allt öppet."*

Google-registrering finns som genväg och är rätt lösning, men den ligger visuellt jämsides och inte före.

**Åtgärd.** Lyft Google-registreringen till primär väg. Överväg magisk länk via e-post. Sänk lösenordskravet till längd (12+ utan teckenklasskrav) om det inte finns ett externt krav som styr. Slå ihop förnamn/efternamn till ett fält. **M**

---

### 16. MEDEL — Samtyckestexten på registreringen namnger fel personuppgiftsbiträde

**Bevis.** Renderad text på `/#/register`:

> "Vi använder AI för att hjälpa dig skriva CV och personliga brev. **Din data kan behandlas av tredje part (OpenAI).** Detta samtycke är valfritt men krävs för AI-funktioner."

Biträdet är **OpenRouter** — `docs/AI_MODEL_LOCKING.md` och `docs/HOSTING-REGIONS.md` rad 14 ("OpenRouter (AI-modell `gpt-oss-120b`) — USA"), och CSP:n i prod har `connect-src ... https://openrouter.ai` men inte `api.openai.com`. Modellen heter `openai/gpt-oss-120b`, men *leverantören* är inte OpenAI.

Ett samtycke som namnger fel mottagare är inte informerat. Texten nämner inte heller att överföringen går till USA — vilket samma dokument (rad 60) säger uttryckligen ska framgå av samtyckesgaten.

**Åtgärd.** Rätta till "OpenRouter (USA)" och lägg till överföringsgrunden. Samma rättelse behövs i `sv.json` → `landing.faq.a4`. **S**

---

### 17. MEDEL — `/landing.html`: en 40 kB föräldralös marknadsföringssida ligger live

**Bevis.**

```
GET /landing.html → 200  text/html  40 489 B
<title>Jobin - Din väg till jobbet | Gratis verktyg för arbetssökande</title>
<h1>Din väg till <span>jobbet</span> börjar här</h1>
canonical:    (saknas)
meta robots:  (saknas)
```

En komplett, självständig B2C-landningssida med egen inbäddad CSS (`--color-primary: #6366f1` — indigo, inte Jobins gröna) och ett helt annat budskap än den live-startsida som ligger på `/`. Ingen canonical, ingen noindex. `robots.txt` disallowar den, men disallow hindrar bara crawl — en extern länk räcker för att URL:en ska indexeras, och robots.txt är dessutom offentlig och pekar rakt på filen:

```
# Föräldralös statisk landningssida utan inlänkning. Ligger kvar tills den
# ersatts av de riktiga landningssidorna i K6.
Disallow: /landing.html
```

K6 är levererad. Villkoret i kommentaren är uppfyllt.

Ironin: `/landing.html` är den B2C-sida som `<title>` på `/` faktiskt lovar (fynd 5).

**Åtgärd.** Radera `client/public/landing.html` och raden i `robots.txt`. Om innehållet är värt något — det är en färdig B2C-hjälte — återanvänd texten i fynd 5 i stället för att låta filen ligga kvar. **S**

---

### 18. MEDEL — De prerenderade sidorna har ingen visuell koppling till varumärket

**Bevis.** `/verktyg/` och guidesidorna hämtar **1 request totalt** (uppmätt: `reqCount: 1`, `byType: {document: 1}`) — ingen CSS-fil, inga typsnitt, **inga bilder**. All styling är inline och typsnittet är systemets. Startsidan laddar däremot Crimson Pro, Playfair Display och Source Sans 3 (14 `@font-face`).

Resultatet syns direkt: `verktyg-index-desktop-full.png` mot `start-desktop-full.png`. Blå länkar och rubriker i stället för Jobins gröna, ingen logotyp (bara ordet "Jobin" i text), inga hub-färger, ingen illustration. Enligt DESIGN.md §3–4 ska en verktygssida ha neutral grå hero med 4 px vänsterkant i hub-färgen — det finns inte.

En besökare som kommer från Google till `/verktyg/cv/` och sedan klickar sig in i portalen möter två olika sajter. Prestandan (fynd 7) är argumentet för att hålla sidorna lätta — men logotyp som inline-SVG, rätt färgtokens och ett självhostat `.woff2` kostar nästan ingenting och köper igenkänning.

**Åtgärd.** Lägg Jobins färgtokens och logotypen (inline SVG) i `guide-template.cjs`. Ett självhostat typsnitt om budgeten tål det. **S**

---

### 19. MEDEL — Startsidan saknar strukturerad data helt

**Bevis.**

```
$ curl -s https://www.jobin.se/ | grep -c 'application/ld+json'
0
```

Ingen `Organization` (namn, logotyp, kontakt, `sameAs`), ingen `WebSite`. Guidesidorna har `Article` + `BreadcrumbList` och verktygssidorna `WebApplication` + `FAQPage` — allt valid JSON-LD. Bara roten, den sida som definierar entiteten "Jobin" för Google, saknar det.

Startsidans FAQ-sektion (sex frågor, fullt ut FAQPage-material) är dessutom osynlig för Google eftersom hela sidan är klientrenderad (fynd 7).

**Åtgärd.** Lägg `Organization` + `WebSite` som statisk JSON-LD i `client/index.html`. Kostar noll runtime. **S**

---

### 20. LÅG — Ingen hreflang, inget engelskt publikt lager

**Bevis.** `grep -c hreflang` ger 0 på `sitemap.xml`, på `/` och på `/guider/cv-grunder/`. Alla sidor har `<html lang="sv">` och `og:locale = sv_SE`.

Portalen är tvåspråkig (i18next, sv/en) och har en hel `international/`-modul för nyanlända — men den publika ytan är enspråkigt svensk. Det är sannolikt rätt prioritering just nu (målgruppen söker på svenska), men de 15 lättläst-artiklarna riktar sig delvis till samma personer som skulle söka på engelska eller arabiska.

**Åtgärd.** Ingen nu. Notera som beslut i ROADMAP K så att det är valt och inte glömt. **S**

---

### 21. LÅG — Guidernas verktygs-CTA matchar inte alltid ämnet

**Bevis.** `/guider/ai-jobbsokning-guide/` — en guide om att använda ChatGPT för CV, personligt brev och intervjuförberedelse — har primär-CTA **"LinkedIn-hjälpen — kom igång"** (`funnel-1-guide-mobil.png`). Guidens egna avsnitt heter *1. CV-förbättring*, *2. Personligt brev*, *3. Intervjuförberedelse*, *4. Research*. LinkedIn nämns i ett stycke av tjugo.

Matchningen görs av `verktygFor()` i `client/scripts/lib/guides.cjs` utifrån `related_tools` i databasen.

**Åtgärd.** Punktkorrigera `related_tools` för de guider där primärverktyget är fel. En stickprovsgranskning av alla 131 är rimligare än en algoritmändring. **S**

---

### 22. LÅG — Stale artefakter: `/404.html` från GitHub Pages, och identisk `lastmod` på alla 139 URL:er

**Bevis.** `client/public/404.html` ligger live på `https://www.jobin.se/404.html` (200, 818 B):

```html
<title>Single Page Apps for GitHub Pages</title>
var pathSegmentsToKeep = 1; // Keep 'deltagarportalen' in the path
```

En omdirigeringsshim från en tidigare GitHub Pages-hosting, som skriver om sökvägen utifrån ett projektnamn som inte längre används. Den fyller ingen funktion på Vercel och kan inte fylla den (fynd 11 visar att Vercel aldrig når den).

Sitemapen: alla 139 `<lastmod>` är `2026-08-05`, inklusive `/` som enligt `Last-Modified` ändrades `Fri, 07 Aug 2026`. Värdet kommer från `articles.updated_at` (`generate-sitemap.cjs:40`) med `today` som fallback (`:64`) — korrekt konstruerat, men det gör att roten och verktygssidorna aldrig får ett sant datum.

**Åtgärd.** Radera `client/public/404.html`. Låt `/` och `/verktyg/*` få byggdatum i stället för att ärva artikeldatumet. **S**

---

## 3. Förbättrings- och utvecklingsförslag

Det här är inte buggar utan saker den publika ytan borde kunna men inte kan.

**1. Verktygen borde gå att prova utan konto.** Den starkaste konverteringen för den här målgruppen är inte ett löfte utan ett resultat. En publik CV-byggare som låter någon fylla i tre fält och se en riktig PDF-förhandsvisning — och först då ber om ett konto för att spara — vänder hela tratten rätt. Det löser också fynd 4 och 15 i ett drag: CTA:n leder till något som fungerar, och kontot skapas när användaren redan har något att förlora. Tekniskt är det mest arbete på klientsidan; `api/cv-pdf.js` är redan rate-limitad.

**2. Guiderna behöver kunna sökas och filtreras.** `/guider/` är en lista med 131 länkar. Det finns 13 kategorier och tre svårighetsnivåer i datat (`category_key`, `difficulty`) som inte används på indexsidan. En statisk filtrering per kategori (`/guider/kategori/<key>/`) ger både bättre navigering och 13 nya indexerbara sidor som fångar bredare sökningar — och den ger `/guider/lattlast/` sällskap i stället för att lämna den ensam (fynd 12).

**3. B2B-ytan finns inte för Google.** K7 är obyggd, och den B2B-text som finns ligger på en klientrenderad startsida. En kommun eller Rusta-och-matcha-leverantör som söker "digital plattform arbetsmarknadsenhet" hittar ingenting. En enda prerenderad `/for-arbetsmarknadsenheter/`-sida med rätt ton, GDPR-läget ärligt beskrivet och en riktig demoknapp skulle vara den mest värdefulla sidan på sajten per besökare. Den behöver också bära det som fynd 3 och 14 tar bort — men i sann form.

**4. Guidesidorna borde bära ett ljudalternativ.** Portalens kunskapsbank har uppläsning (CTA:n på guidesidorna säger *"Alla guider samlade, med ljuduppläsning"*), men de publika sidorna har det inte. För lättläst-nischen är uppläsning inte en extrafunktion utan själva poängen. Webbläsarens `SpeechSynthesis` räcker och kostar noll i bandbredd.

**5. Sätt upp mätningen innan nästa innehållsomgång.** K8 står öppen och K4 säger uttryckligen "ingen batch utan mätning från den föregående". Utan Search Console-data går det inte att avgöra vilken sida i varje kannibaliseringspar (fynd 10) som ska vinna. Det är den billigaste åtgärden på hela listan och den som låser upp flest andra.

**6. En "vad är detta"-rad överst för den som kommer från Google.** En besökare landar mitt i en guide om ATS-optimering utan att veta vad Jobin är. Guidesidorna har en verktygsruta men ingen enrading som svarar på frågan. Två meningar i brödsmulenivå kostar ingenting och besvarar femsekundersfrågan där den faktiskt ställs — på guidesidan, inte på startsidan.

---

## 4. Vad jag inte hann granska

- **Faktakontroll av guideinnehållet.** Jag har läst struktur, rubrikhierarki och metadata på 14 av 131 guider men inte sakgranskat påståenden om AF-regler, anställningsformer, LAS eller ersättningsnivåer. `nystartsjobb-guide` och `branscher-brist` är medvetet inte utbyggda i K9 av just det skälet — men de **är** publicerade och innehåller uppgifter som människor fattar försörjningsbeslut på.
- **Faktisk indexeringsstatus.** Jag har ingen åtkomst till Search Console. Om K1:s sitemap är inlämnad, hur många av de 139 URL:erna som är indexerade, och om soft-404:orna (fynd 11) redan syns där — okänt. ROADMAP K1 listar detta som "kvar hos Mikael".
- **Skärmläsartest.** axe-core gav noll överträdelser på sju sidor × två breddpunkter, men automatiska verktyg fångar ungefär en tredjedel av WCAG-problemen. Ingen manuell NVDA/VoiceOver-genomgång är gjord, och läsordningen på guidesidornas CTA-boxar (som bryter in mitt i brödtexten) är inte verifierad med skärmläsare.
- **Genomklickning hela vägen till konto.** Jag stannade vid ifyllt registreringsformulär och skapade inget konto, enligt uppdraget. Verifieringsmejl, onboarding och första-intryck-i-portalen är därför ogranskade — och det är där tratten fortsätter efter fynd 15.
- **Övriga 117 guidesidor.** Metadata (titel, description, canonical, og:image) är kontrollerad på **alla 139** URL:erna maskinellt. Rubrikhierarki, tabellrendering, interna länkars giltighet och mobilläsbarhet är stickprov på 14 sidor. Inga rubrikhopp och inga döda interna länkar hittades i det urvalet.
- **Lighthouse-körning.** Jag mätte LCP/CLS/FCP direkt via Performance-API med CDP-strypning i stället. CLS var 0 på samtliga sidor och båda breddpunkterna; INP/TBT är inte mätta.

---

## 5. Verifierat och grönt (för protokollet)

Så att nästa granskare inte mäter om det:

| Kontroll | Resultat |
|---|---|
| Alla 139 sitemap-URL:er | **200**, samtliga |
| Canonical stämmer med URL | **139/139** |
| Duplicerade meta-descriptions | **0** |
| `og:image` saknas | **0 sidor** |
| axe-core WCAG 2.1 A/AA, 7 sidor × 2 bredder | **0 överträdelser** |
| Horisontell scroll på 390 px | **0 px** på samtliga testade sidor |
| Konsolfel på publika sidor | **0** |
| JSON-LD parsar och validerar | Article, BreadcrumbList, WebApplication, FAQPage — alla OK |
| `robots.txt` | 200, `text/plain`, korrekt sitemap-rad (K1-grinden håller) |
| Säkerhetsheaders i prod | CSP, HSTS (`includeSubDomains; preload`), X-Frame-Options DENY, Referrer-Policy, `frame-ancestors 'none'` — alla närvarande |
| Apex → www | 307 till `https://www.jobin.se/`, canonical pekar samma väg |
| Sourcemaps publicerade | **Nej** |
| Hemligheter i bundlen | Endast Supabase **anon**-nyckel (`"role":"anon"`) — by design |
| Tredjepartsanrop före samtycke | Endast `fonts.googleapis.com` (se fynd 3). Ingen Sentry, ingen analytics, inga cookies satta |
| K10: lästider mot faktisk ordmängd | **132 av 133** inom 1 min. Enda avvikaren: `karriarplanering-guide` (6 angivet, 8 beräknat) |
| Brotli-komprimering | Aktiv på HTML, CSS och JS |
| LCP prerenderade sidor, Slow 4G + 4× CPU | 436–708 ms |
