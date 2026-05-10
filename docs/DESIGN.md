# Designprinciper för jobin.se

> **Status:** Aktiv från 2026-05-10. Ersätter 2026-04-30-versionen.
> **Filosofi:** Ton först, system därefter. Ingen designregel överskrider Manifestet.
> **Hur dokumentet läses:** Avsnitt 1–3 är obligatorisk läsning innan du designar något. Avsnitt 4–9 är referens när du implementerar. Avsnitt 10 är legacy och bakåtkompatibilitet.

---

## 1. Manifestet

> **Jobin är inte en jobbportal. Det är en följeslagare genom en svår tid.**

Användaren är ofta i en utsatt situation — utmattning, NPF, långtidsarbetslöshet, fysiska eller psykiska utmaningar. Skammen över att stå utanför arbetslivet är reell. Stressen över ekonomi är konstant. Energin för att navigera komplex programvara är låg.

Allt vi designar ska kännas som det är skrivet av **en lugn, kunnig vän som har all tid i världen att hjälpa**.

- **Aldrig som en LinkedIn-rekryterare.** Ingen prestationsångest. Inga "12 av 50 mål uppnådda".
- **Aldrig som ett myndighetsformulär.** Inga "Vänligen ange". Inga "Aktivera funktion".
- **Aldrig som en gamification-app.** Inga konfettiexplosioner, inga streak-counters, inga "Nivå upp!".
- **Aldrig som ett tools-SaaS.** Inga gradient-knappar, inga sparkles-emojis i hero, inga "Beta"-badges.

### Manifestets fem konsekvenser

Dessa är de fem operativa regler som hela designen utgår från. Om en regel nedan i dokumentet (avsnitt 4-9) verkar konflikta med en av dessa fem — är det den lägre regeln som är fel.

1. **Lugn före information.** Vi visar hellre 5 saker väl än 15 saker tätt. En tom yta är inte ett problem som måste fyllas.
2. **Inviter före etiketter.** Rubriker bjuder in: *"Vad vill du göra idag?"*, inte *"Sök funktioner"*. Knappar bjuder: *"Skapa ditt CV"*, inte *"Generera"*.
3. **Sammanhang före handling.** Vi förklarar *varför* innan vi visar *hur*. En tom skärm utan kontext är otrygg; en tom skärm med ett välkomnande är öppen.
4. **Personligt före generiskt.** Vi använder användarens namn varhelst vi har det. *"Hej Anna"*, inte *"Välkommen tillbaka"*.
5. **Ett centrum per skärm.** En primär CTA. En huvudfärg. En sak att göra härnäst. Allt annat är sekundärt.

### Tonen i en mening

> Tänk Headspace, inte Linear.
> Tänk handledare, inte algoritm.
> Tänk vänlig vän, inte hjälpsam app.

---

## 2. Voice & Tone Guide

Hur vi skriver är hälften av designen. Den här guiden är obligatorisk för varje rubrik, knapp, tooltip och felmeddelande som hamnar på skärmen.

### De tre språkreglerna

**Regel 1 — Rubriker är inviter, inte etiketter.**

| Inte så här | Så här |
|---|---|
| "Hantera resurser" | "Dina sparade resurser" |
| "Sök företag" | "Hitta företag att kontakta" |
| "Mina vardagliga rutiner" | "Din vardag" |
| "Konfigurera notiser" | "Hur vill du bli kontaktad?" |
| "Mina ansökningar" | "Dina jobbansökningar" |

**Regel 2 — Aldrig administrationsspråk.**

| Inte så här | Så här |
|---|---|
| "Aktivera" | "Slå på" |
| "Konfigurera" | "Ändra" |
| "Inställning" | "Inställningar" *(plural är mjukare)* |
| "Generera" | "Skapa" |
| "Validera" | "Kolla" |
| "Vänligen ange ditt namn" | "Vad heter du?" |

**Regel 3 — Aldrig prestationsspråk i hjälteposition för deltagare.**

Procentbarer i wizard-progress är OK ("Steg 3 av 5"). Procent-mätningar i hero på Översikt är inte OK ("23% klart med din profil").

| Inte så här | Så här |
|---|---|
| "0 aktiva ansökningar" | "Du har inte börjat söka jobb än" |
| "12 av 50 mål uppnådda" | "Du har avklarat 12 mål — fortsätt!" *(om det måste sägas)* |
| "Streak: 0 dagar" | (ta bort) |
| "Du har 87 dagar utan aktivitet" | (ta bort) |

> **Konsulent- och admin-vyer kan ha annan ton** — mer effektiv, mer datadriven. Men det ska vara *en tydlig switch*, inte slumpartat genom appen. Deltagarvyer följer reglerna ovan utan undantag.

### Personalisering

Använd användarens förnamn när det finns. Konstruktioner:

- Översikt-hero: *"Hej Anna 👋"* (morgon: *"God morgon, Anna"*; kväll: *"God kväll, Anna"*)
- Notiser: *"Anna, du har en intervju på torsdag"*
- Empty states: *"Anna, du har inte börjat din intresseguide än"*
- Bekräftelser: *"Sparat, Anna ✓"* (kort, inte påflugen)

Om förnamn saknas: använd vänligt generiskt utan att skylta att det saknas. Skriv aldrig *"Hej {namn}"* med synlig token.

### Empty-state-copy-mall

Tomma listor och nyligen anslutna sidor följer samma copywriting-mall:

```
[Lugn rubrik som beskriver vad sidan ÄR (inte vad som saknas)]
[En mening som förklarar värdet — varför kommer hit-]
[En knapp med konkret nästa steg]
```

| Plats | Inte så här | Så här |
|---|---|---|
| Nätverk | "Du har inga kontakter" | "Här bygger du ditt nätverk" + "Människor som hjälpte mig hitta jobb..." + *Lägg till första kontakten* |
| Diary | "Inga dagboksanteckningar" | "Din dagbok" + "Skriv av dig om dagen — bara du ser det här." + *Skriv idag* |
| Min konsulent | "Ingen tilldelad" | "Du har ingen konsulent ännu" + "När du tilldelas en arbetskonsulent kan ni hålla kontakt här." + *Läs mer om hur det fungerar* |

---

## 3. De två lägena

Portalen designas i två klart åtskilda lägen. **All annan designregel följer av detta.**

### Läge A — Hub-landning *(ankomstet)*

Sidor: `/oversikt`, `/jobb`, `/karriar`, `/resurser`, `/min-vardag`.

Detta är hubbens *hej-läge*. Användaren har precis ankommit till en zon. Hjältesektionen får använda hub-färgen som **full pastell-bakgrund** med stor titel, varm subtitel och eventuellt en dekorativ gradient-glow. Detta är inbjudan till en hel zon.

```
┌──────────────────────────────────────────────┐
│                                              │
│   👋 Hej Anna                                │
│   Här söker du jobb och håller koll          │
│   på dina ansökningar.                       │
│                                              │
└──────────────────────────────────────────────┘
   bg = --c-bg (hub-pastell, full)
   border-radius = 24px
   subtil radial-gradient i --c-accent (top-right) tillåten
```

### Läge B — Verktygssida *(arbetet i zonen)*

Sidor: allt under hub-landningen — `/cv`, `/job-search`, `/wellness`, `/career` osv. (~25 sidor).

Detta är *fokus-läge*. Användaren arbetar med ett verktyg. Hjältesektionen är **neutralt grå** med en 4 px vänsterkant i hub-färgen så användaren ser vilken zon hon är i, men sidans uppmärksamhet ska gå till innehållet.

```
┌──────────────────────────────────────────────┐
│▌ Skapa ditt CV                               │
│  Bygg ett CV som öppnar dörrar.              │
│  ┌────────────────────────────────────┐      │
│  │ Skapa  Mina CV  Anpassa  ATS  Tips │      │
│  └────────────────────────────────────┘      │
└──────────────────────────────────────────────┘
   bg = --header-bg (varm grå)
   border-left = 4px var(--c-solid)
```

### Vad som ALDRIG händer

- Hub-färgad full hero på en verktygssida (det skapar tutti-frutti-känsla).
- Neutral grå hero på en hub-landning (då tappar zonen sin identitet).
- Olika hero-stil mellan två sidor i samma hub (det förvirrar tillhörigheten).

### Hub-tillhörighetstabellen

| Hub | Path | Färg | Soft-bg | Accent | Solid (CTA) | Text |
|-----|------|------|---------|--------|-------------|------|
| **Översikt** | `/oversikt` | Mint | `#ECF7F1` | `#C5E5D4` | `#1F8A66` | `#155F47` |
| **Söka jobb** | `/jobb` | Persika | `#FCF1E6` | `#F5D3B5` | `#C97A2E` | `#8B5418` |
| **Karriär** | `/karriar` | Rosa/Coral | `#FBEEEF` | `#F2C8CD` | `#B85363` | `#843845` |
| **Resurser** | `/resurser` | Sky | `#ECF4FA` | `#C8DEEF` | `#2F7DB5` | `#1F5985` |
| **Min vardag** | `/min-vardag` | Lavendel | `#F2EDF8` | `#D4C5EB` | `#7058A8` | `#4F3D7C` |

Sanning: `client/src/components/layout/navigation.ts::navHubs[].memberPaths`. **En sida tillhör exakt en hub.** Sidor utanför hubbarna (Help, Settings, Login) använder neutral grå utan hub-accent.

| Hub | Undersidor (verktygssidor som ärver hub-färgen) |
|-----|----------------|
| **Översikt** | Bara `/oversikt` (`/` redirectas) |
| **Söka jobb** | JobSearch, Applications, Spontanansökan, CV, Cover Letter, Interview Simulator, Salary, International, LinkedIn Optimizer |
| **Karriär** | Career, Interest Guide, Skills Gap, Personal Brand, Education |
| **Resurser** | Knowledge Base, Resources, Print Resources, External Resources, AI-team, Nätverk |
| **Min vardag** | Wellness, Diary, Calendar, Exercises, My Consultant, Profile |

---

## 4. Färgsystemet

### Den centrala regeln

> **En sida = en hub-färg.**
>
> Alla pastell-element på en sida (KPI-kort, sektionsbakgrunder, ikon-tiles, badges) använder samma hub-färg. Variationen kommer från **intensitet** (50-mix, 200-mix, 700-mix) och **ikon**, inte från olika hubars pasteller.
>
> *Undantag:* Översikt-sidan, där 4 hub-färger samexisterar för att visa zonerna.

Detta löser den vanligaste designmiss vi gör: när en sida har 4 olika pastell-KPI-kort blir det "färg-confetti" som inte kommunicerar något. Differentiering mellan KPI-kort kommer från **typografi** (siffran är stor, etiketten liten) och **ikon** — inte från färgsallad.

### 60-30-10-fördelningen (operationaliserad)

På en typisk sida ska ytan fördelas:
- **60 %** Neutrala (canvas `#FBFAF6`, surface `#FFFFFF`, header-bg, stone-tokens)
- **30 %** Hub-pastell soft-bg som zon-bakgrund i innehållet
- **10 %** Solid hub-färg (`--c-solid`) på CTA, ikoner, progress-fyllning

Om du ser mer än 10 % solid-färg per skärm är det för intensivt. Om du ser mindre än 60 % neutralt är skärmen kakofonisk.

### Pastell-intensitetsregler

1. **Soft-bg** = 50-nyans (ljusast). Används som zon-bakgrund.
2. **Accent/border** = 200-nyans. För subtila ramar runt pastell-kort.
3. **Solid CTA** = 700-nyans (mjukare än 900). För knappar och progress.
4. **Text på pastell-bakgrund** = 900-nyans (för WCAG-kontrast — får inte mjukas upp).
5. **Text på solid-bakgrund** = vit (#FFF).

### Neutrala färger

| Token | Hex | Användning |
|-------|-----|------------|
| `canvas` | `#FBFAF6` | Sidobakgrund (varmare än ren vit) |
| `surface` | `#FFFFFF` | Kortbakgrund |
| `header-bg` | `#F5F4F0` | Verktygssidans header |
| `header-bg-strong` | `#ECEAE3` | Variant med mer kontrast |
| `header-border` | `#DDD9D0` | Header-border |
| `header-text` | `#2C2C2A` | Header-titel |
| `header-muted` | `#6A6864` | Header-undertext |
| `stone-50` | `#F5F4F0` | Sektionsbakgrund |
| `stone-150` | `#EAE8E2` | Mjuk border |
| `stone-500` | `#9A9892` | Sekundär text |
| `stone-700` | `#6A6864` | Body sekundär |
| `stone-900` | `#2C2C2A` | Primär text |

### Status-färger (semantiska, ej hub)

- **Amber** `#D97706` — varning, notiser, "behöver uppmärksamhet". Använd sparsamt.
- **Röd** `#DC2626` — destruktivt (radera). *Logga ut är inte destruktivt.*
- **Emerald** — endast "completed/success"-bekräftelser. Semantiskt skild från Översikt-mint.

---

## 5. Typografi & vertikal rytm

### Skala

| Roll | Storlek | Vikt | Användning |
|------|---------|------|------------|
| Hero-titel | 32-40 px | 700 | Hub-landningens stora rubrik |
| Sidotitel | 22-28 px | 700 | Verktygssidans header-titel |
| Sektionsrubrik | 16-18 px | 600 | "Dagens aktiviteter" |
| Body | 14-16 px | 400 | Normaltext |
| Caption / muted | 12-13 px | 400-500 | Etiketter, hjälptext |
| KPI-siffra | 28-40 px | 700 | Stor siffra i KPI-kort |

Inga andra storlekar utan diskussion. **Skalan är medvetet smal** — det skapar lugn.

### Vertikal rytm

Komponenter staplas med **gap-tokens**, aldrig med marginaler.

- `gap-2` (8 px) — tightaste rytm, t.ex. listpunkter
- `gap-4` (16 px) — innanför kort
- `gap-6` (24 px) — mellan sektioner i en zon
- `gap-8` (32 px) — mellan zoner på en sida
- `gap-12` (48 px) — bara mellan helt orelaterade block

> **Lugn före information.** Om en sida känns trång — öka rytm-tokenet, ta inte bort innehåll först.

---

## 6. Komponenter

### Knappar

- **Primär** — `bg-[--c-solid]`, vit text. Ej skugga (eller mycket subtil hover-elevation `0 2px 6px rgb(0 0 0 / 0.05)`). Hover: `filter: brightness(1.08)`.
- **Sekundär** — vit bakgrund, `--c-text`-text, `stone-150` border. Hover: `bg-stone-50` + `border-color: --c-accent`.
- **Ghost** — endast text i `--c-text`. Hover: `bg-[--c-bg]`.
- **Destruktiv** — solid röd. Ej hub-färg.

### FÖRBJUDET på knappar

- ❌ `bg-gradient-to-r from-X to-Y` — gradient-knappar. Inga undantag. *(Nuvarande lägen: Intresseguide, Skills Gap, Profile-onboarding-modal — ska bort.)*
- ❌ Pastell-fyllning på primär-knapp — då försvinner CTA:n. Pastell är för sekundära ytor.
- ❌ Mer än en primär CTA per vy.

### Kort

- **Default** — `bg-white`, `border-stone-150`, `radius-12`. Ingen skugga. Hover: subtil elevation `0 4px 8px rgb(0 0 0 / 0.04)`.
- **Tinted** — `bg-[--c-bg]`, `border-[--c-accent]`. Används när kortet hör tematiskt till sidans hub.
- **HubCard (Översikt)** — vitt kort, hub-accent BARA på 4 px topp-strecket, ikon-tile och aktivitets-prick. Inte tintat. Skapar lugn yta där 4 hub-färger samexisterar.

### KPI-kort

```
┌─────────────────┐
│ 🎯 Etikett      │  ← liten, stone-500
│ 48 298          │  ← stor, stone-900 eller --c-text
│ + 12% denna v.  │  ← optional delta i amber/emerald
└─────────────────┘
   bg = --c-bg (sidans hub-färg, ljusaste pastell)
   border = --c-accent
   radius = 12 px
```

- Fyra KPI-kort på samma sida ska ha **samma färg**. Differentieringen kommer från ikon och text.
- Inget gradient-bakgrund. Inget shadow. En platt pastell.

### Tabs

- **Aktiv** — `bg-[--c-bg]`, `text-[--c-text]`, vänsterkant `--c-solid` 3 px, `font-semibold`.
- **Inaktiv** — transparent, hover `bg-stone-50`.

Tab-aktiv-stil ska vara *konsekvent* över hela portalen. Just nu varierar implementationen — alla sidor som har tabs MÅSTE använda `<PageTabs>`-komponenten.

### Pills / Badges

- **Default** — `bg-stone-50`, `text-stone-700`, `border-stone-150`, `radius-14`.
- **Aktiv/Hub** — `bg-[--c-bg]`, `text-[--c-text]`, `border-[--c-accent]`.
- **Status** (amber/röd) — semantisk färg + matchande tint.

### Progress

- Bar: `--c-solid` på `stone-100` bakgrund.
- Text: procent i `--c-text` om värdet > 50 %.

### Fokusring

`outline: none; box-shadow: 0 0 0 3px var(--c-bg), 0 0 0 4px var(--c-solid);` — fokusringen är hubbens färg, alltid synlig, aldrig hårdkodad.

---

## 7. Empty states *(en komponent, alltid)*

### Mallen

Varje tomtillstånd på portalen följer samma struktur:

```
        [ illustrativ ikon eller liten illustration, 64px ]

        Mänsklig rubrik som beskriver vad sidan ÄR
        (inte vad som saknas)

        En mening som förklarar värdet — varför kommer
        man tillbaka hit?

        [ EN tydlig CTA-knapp med konkret nästa steg ]
```

### Komponentkontrakt

`<EmptyState>` är **den enda accepterade vägen** att rendera ett tomtillstånd:

```tsx
<EmptyState
  icon={<UsersIcon />}
  title="Här bygger du ditt nätverk"
  description="Människor som hjälpte mig hitta jobb är ofta människor jag redan kände. Lägg till en första kontakt så samlar vi dem här."
  action={{ label: "Lägg till första kontakten", onClick: handleAdd }}
/>
```

### Förbjudet

- ❌ **Staplade tomtillstånd** — t.ex. tom kolumn-skelett OCH stor empty-state-card under (gammalt mönster på Mina ansökningar, fixat 2026-05-10).
- ❌ **"0" som primär information** — visar vi "0 aktiva ansökningar" i hero har vi misslyckats. Visa istället "Du har inte börjat söka jobb än" + CTA.
- ❌ **Oöversatta i18n-keys** — `myConsultant.noConsultantFullDesc` får aldrig läcka till UI. Sweep regelbundet.
- ❌ **Spinner som tomtillstånd** — laddning är inte tomtillstånd. Använd skeleton-komponenten.

### Sidor med "nästan tomt" innehåll

Om en sida tekniskt har data men användaren bara har 1-2 saker (t.ex. Översikt-historik med en enda aktivitet), visa **kontextualiserade förslag** istället för en blank yta:

> "Du har bara en aktivitet ännu. Här är 3 saker du kan utforska:" + 3 launch-cards.

---

## 8. Innehållsdensitet

### Regeln

> **Max 5-7 saker synliga utan att användaren har valt en avdelning.**

Detta är från Miller's Law (7±2 i arbetsminnet) men strängare för vår målgrupp där kognitiv belastning är reell.

### Konsekvenser

- **Career-sidan** — reduceras till 3 sektioner (en huvudsiffra med kontext, top 5 yrken som chips, top 3 städer). Inga delta-procentpilar, inga "+5%"-arrows. *Det är finansapp-språk, inte stödspråk.*
- **Övningar** — överst en kuraterad rad: *"För dig idag: 3 övningar som passar din situation"*. Resten kategoriserat och kollapsbart.
- **Knowledge Base** — kategori-banderoller är pastell, inte solid mörkblå. Max 3 artikelkort synliga per kategori utan "Visa fler".
- **Mina ansökningar** — när 0 ansökningar, dölj pipeline-skelettet och visa enbart empty-state. När >0, visa pipelinen utan separat empty-state.

### En sida = ett centrum

Varje skärm har **ett tydligt fokus**. Ett centrum. Allt annat är sekundärt:

- En primär CTA (solid `--c-solid`)
- En huvudfärg (sidans hub-pastell)
- En sak att göra härnäst

Om du inte kan svara på *"Vad är centrum på den här skärmen?"* är skärmen designmässigt obesvarad.

---

## 9. Mobil — strategiska val, inte responsiv minskning

### Princip

Mobilen är **inte desktop minskat till 390 px**. Många deltagare använder smartphone som primär enhet. Mobil-pass krävs separat.

### Mobil-mönster

- **Hub-landningssidor** har en kort intro-mening överst: *"Vart vill du ta vägen idag?"*. Sedan HubCard-stack. Sedan en personlig rad ("Senaste aktivitet").
- **HubBottomNav** med 5 ikoner är persistent. `pb-safe` för iPhone-notch.
- **Sub-tabs på verktygssidor** — när användaren är på `/cv` ska CV-flikarna vara tillgängliga via en horisontell scroll-bar under header, inte gömda i en meny.
- **Långa gallerier** (CV-mallar, övningar) — horisontell snap-scroll, inte vertikal lista. Tinder-modell.
- **Bottenmarginal** — alla sidor har `pb-20` (80 px) eller `pb-safe + 64px` så bottennav inte överlappar innehåll.

### Touch-targets

Minst 44×44 px (WCAG 2.1 AA SC 2.5.5). Ikon-knappar i toolbar måste ha invisible padding upp till 44 px.

### Backbutton

`<MobileBackButton>` visas på alla undersidor utom hub-rotsidor. 60 px reserverat i mobil-topbar.

---

## 10. Tillgänglighet (WCAG 2.1 AA — minimum)

- **Kontrast** 4.5:1 minimum för normal text, 3:1 för stor text och UI-element. Pastell-bakgrunderna är medvetet ljusa — text MÅSTE använda 900-nyansen.
- **Fokusring** synlig på alla hubbar (se avsnitt 6). Aldrig hårdkodad färg.
- **`prefers-reduced-motion`** — alla animationer reduceras till 0.01 ms via `@media`. Inga undantag.
- **`prefers-contrast: high`** — byt till mörkare nyanser av hub-färgerna automatiskt.
- **Skip-links** på alla sidor till `#main-content`.
- **`aria-current`**, `aria-expanded`, `aria-live` används konsekvent (befintliga regler i CLAUDE.md gäller).

### Kognitiv tillgänglighet

För NPF-/utmattningsmålgruppen tillkommer:
- **Inga autoplay-animationer.** Float, spin-slow, bounce-loop är förbjudna.
- **Inga snabba state-byten.** Allt fade/transform går genom de tre tids-tokens nedan.
- **Inga obetonade overlays.** Modaler ska aldrig öppna utan användarens explicita klick.

---

## 11. Motion

Tre tids-tokens, definierade i `tokens.css`:

- **Fast** `150 ms` — micro-interaktioner (hover, focus, button press)
- **Standard** `300 ms` — page enter, fade in/out, panel toggle
- **Slow** `600 ms` — major layout shift, drawer open

**Inga animationer över 600 ms.** Aldrig.

---

## 12. Onboarding *(en komponent, en stil)*

### Princip

Ny användare ska kunna **avfärda alla onboardings från första klicket**. En engagerad användare ska aldrig se samma tour två gånger.

### Komponentkontrakt

`<OnboardingFlow>` är den enda accepterade onboarding-komponenten. Alla nuvarande sido-specifika onboardings (CV-tour, AI Team welcome-modal, Profile welcome-modal) ska konvergera mot denna.

- Visas högst **en gång per session**, även om användaren besöker flera nya sektioner.
- Modal med backdrop som låser body-scroll.
- "Hoppa över" alltid synlig och primär-storlek (inte gömt nere till vänster).
- Maximalt 3 steg. Vill man säga mer — gör det inline-tips på faktisk sida.

### Hellre inline-tips än modal

> Onboarding är ofta ett symptom på att UI:t inte talar för sig självt. Lös grundproblemet först.

Om CV-byggar-stegindikatorn säger "Steg 1 av 5: Välj design — klicka en mall för att börja" behövs ingen orange tour-overlay. Investera i självförklarande UI.

---

## 13. Logotyp & favicon

**En enda logotyp över hela portalen.** Inga undantag.

| Plats | Asset |
|-------|-------|
| Login | `/logo-icon.svg` |
| Register | `/logo-icon.svg` *(samma)* |
| App-topbar | `/logo-icon.svg` + textlogo "jobin.se" |
| Footer (Landing, mörk bakgrund) | `/logo-jobin-new.webp` *(white-version)* |
| Favicon | derived from `logo-icon.svg` |

Den moderna gröna kub-logon ÄR Jobin. Den runda pixeliga "JOBIN"-logon från äldre version finns kvar i `/public` men ska **inte refereras i ny kod**. Ta bort när alla legacy-uses är borta.

---

## 14. Implementation reference

Det här avsnittet är teknisk dokumentation för utvecklare. Inga designval — bara hur det är kopplat.

### CSS-tokens

Implementeras i `client/src/styles/tokens.css`. Aktiveras per sida via `<div data-domain="...">` — sätts av `PageLayout` som läser routens hub-tillhörighet från `lib/domains.ts`.

```css
:root {
  /* Default = Översikt */
  --c-bg:     var(--action-bg);
  --c-accent: var(--action-accent);
  --c-solid:  var(--action-solid);
  --c-text:   var(--action-text);
}

[data-domain="action"]    { /* Översikt */ }
[data-domain="activity"]  { /* Söka jobb */ }
[data-domain="coaching"]  { /* Karriär */ }
[data-domain="info"]      { /* Resurser */ }
[data-domain="wellbeing"] { /* Min vardag */ }
```

Komponenter konsumerar **alltid** `--c-bg` / `--c-accent` / `--c-solid` / `--c-text` — aldrig en specifik hubs token direkt. Undantag: `HubOverview.tsx` där 4 hub-färger visas samtidigt och behöver direkt-referenser.

### Hub-namn vs token-prefix

| Hub | `data-domain`-värde | Token-prefix |
|-----|---------------------|--------------|
| Översikt | `action` | `--action-*` |
| Söka jobb | `activity` | `--activity-*` |
| Karriär | `coaching` | `--coaching-*` |
| Resurser | `info` | `--info-*` |
| Min vardag | `wellbeing` | `--wellbeing-*` |

> **Nedlagt:** Den tidigare 3-domän-modellen (`action`/`reflection`/`outbound`) är borttagen som koncept. CSS-aliaser för `reflection` (→ wellbeing) och `outbound` (→ activity) finns kvar i `tokens.css` så gammal kod inte kraschar, men ska **inte** användas i ny kod eller refereras i designval.

### Hub-uppslag

`getActiveHub(pathname)` mot `pageToHub`-mappen (byggd från `navHubs[].memberPaths`). **Aldrig** URL-prefix-matchning — det knäcker djup-länkar (PITFALLS.md Pitfall 2).

### Centrala filer

- Tokens: `client/src/styles/tokens.css`
- Hub→`data-domain`-mappning: `client/src/lib/domains.ts`
- Hub-definitioner: `client/src/components/layout/navigation.ts::navHubs`
- PageHeader (verktygssida): `client/src/components/layout/PageTabs.tsx::PageHeader`
- Hub-landning (mall): `client/src/pages/hubs/HubPage.tsx`
- Översikt-hero: `client/src/pages/hubs/HubOverview.tsx`
- Sidebar: `client/src/components/layout/Sidebar.tsx`

### Maskinella regler (eslint / lint-staged)

För att upprätthålla designreglerna föreslås följande lint-regler (markerade som *bör införas*):

1. **Förbud mot `bg-gradient-to-` i client/src/components/ui/Button** — *bör införas*.
2. **Förbud mot direkt referens till `--action-solid` etc. utanför HubOverview.tsx** — *bör införas*.
3. **i18n-key-läckage-detektion** — sweep efter strängar som matchar `\w+\.\w+(?:Desc|Title)\b` i renderad output — *bör införas*.

---

## 15. Checklist innan en sida går i produktion

Använd den här som PR-review:

**Ton (avsnitt 1-2)**
- [ ] Ingen rubrik är en etikett (alla bjuder in)
- [ ] Ingen knapptext är administrationsspråk
- [ ] Ingen prestationsmätning ("0 av 5") i hjälte-position
- [ ] Användarens namn används där det går

**Lägen (avsnitt 3)**
- [ ] Hub-landningssida har full pastell-hero
- [ ] Verktygssida har neutral grå hero med 4 px hub-vänsterkant
- [ ] Inga blandade lägen på samma sida

**Färg (avsnitt 4)**
- [ ] En hub-färg på sidan (utom Översikt)
- [ ] Ingen gradient-knapp
- [ ] 60-30-10-fördelning
- [ ] Inga hårdkodade hub-tokens (utom HubOverview)

**Densitet (avsnitt 8)**
- [ ] Max 5-7 saker synliga utan val
- [ ] Ett tydligt centrum (en primär CTA)

**Empty state (avsnitt 7)**
- [ ] Använder `<EmptyState>`-komponenten
- [ ] Inga "0"-rubriker
- [ ] Inga staplade tomtillstånd
- [ ] Inga oöversatta i18n-keys

**Mobil (avsnitt 9)**
- [ ] `pb-20` eller motsvarande safe-area-marginal
- [ ] Touch-targets ≥ 44×44 px
- [ ] Sub-tabs synliga på mobil (inte gömda i meny)

**Tillgänglighet (avsnitt 10)**
- [ ] Kontrast ≥ 4.5:1 på all text
- [ ] Fokusring synlig
- [ ] `prefers-reduced-motion` respekteras

---

## 16. Designhistorik

| Version | Datum | Förändring |
|---------|-------|------------|
| **3.0** | 2026-05-10 | *Manifest + Voice & Tone först.* Två-läges-arkitektur (hub-landning vs verktygssida) tydliggjord. En-färg-per-sida-regel införd. Empty-state-komponenten kontraktualiserad. Onboarding-konsolidering. Personalisering. Logo-konsolidering. Lint-regler föreslagna. |
| 2.0 | 2026-04-30 | 5 hub-färgscheman (Översikt + 4 hubbar). Hubbar är organiseringsprincipen. Undersidor ärver moderhubbens färg. |
| 1.5 | 2026-04-29 | 5 abstrakta domäner (action/info/activity/wellbeing/coaching). Bytt namn — koncept lever kvar som CSS-tokens. |
| 1.0 | 2026-04-28 | Action/Reflektion/Utåtriktat (3-domän). **Borttaget koncept.** CSS-aliaser kvar för rollback. |

### Vad som är klart efter 3.0-passet

- ✅ Hub-arkitektur med 5 hubbar och tydlig medlemskaps-mappning
- ✅ Translokerade ton- och språkregler
- ✅ Två-läges-system tydliggjort

### Vad som återstår *(följs upp i implementation)*

- ⏳ Hub-landningssidor: implementera "Hej {namn}"-personalisering
- ⏳ Verktygssidor (~25 st): färgrevision så endast en hub-färg används per sida
- ⏳ Empty-state-komponent: konsolidera 5 nuvarande mönster till 1
- ⏳ Onboarding-konsolidering: ersätt 4+ separata onboardings med en
- ⏳ Career, Övningar: redesign till "max 5-7 saker synliga utan val"
- ⏳ Mobil-pass: hub-intros, CV-galleri som swipe, sub-tabs på mobil
- ⏳ i18n-läckage-sweep: hitta och fixa alla `key.subkey`-strängar i UI
- ⏳ Lint-regler: maskinellt förbjuda gradient-knappar och hårdkodade hub-tokens

---

## 17. Hur man läser detta dokument

Om du designar något nytt: läs avsnitt 1–3.
Om du implementerar något: läs avsnitt 4–9.
Om du reviewar en PR: använd avsnitt 15.
Om du undrar var en token finns: läs avsnitt 14.
Om du undrar varför något är som det är: läs avsnitt 16.

Det här dokumentet är inte sanning för evigt. Det är **sanningen idag** och uppdateras när vi lär oss något nytt om vår målgrupp.

*Senast uppdaterad: 2026-05-10*
