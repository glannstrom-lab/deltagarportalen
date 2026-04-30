# Designprinciper för Deltagarportalen

> **Status:** Aktiv från 2026-04-30. Ersätter tidigare "action/reflektion/utåtriktat"-modell (3-domän) — den är borttagen som koncept.
> **Riktning:** Hubbarna är organiseringsprincipen. 4 hubbar (**Söka jobb**, **Karriär**, **Resurser**, **Min vardag**) + **Översikt** har var sitt färgschema. Undersidor ärver moderhubbens färg.
> **Redesignstatus:** Bara de 5 hub-landningssidorna är klara med redesignen. Underliggande sidor (CV, Wellness, JobSearch m.fl.) väntar fortfarande på pass.

## Kontext

Vår målgrupp är personer i jobbsökar- eller rehabprocess. Många är i en utsatt situation — utmattning, NPF, långtidsarbetslöshet, fysiska och psykiska utmaningar. Tonen ska vara **stödjande, inte stressande**. Tänk Headspace, inte Linear.

WCAG 2.1 AA är minimikrav. Pastell-intensiteten är vald för att minska visuell trötthet vid daglig användning.

---

## Bärande designidé

| Princip | Konsekvens |
|--------|-----------|
| **Hjältesektion = neutral grå** | Alla sidors `PageHeader` använder `--header-bg` (varm grå). Ingen hub-färg och ingen gradient i toppen. En 4px vänsterkant i hub-färgen ger subtil identifiering. (Översikt-hero är dokumenterat undantag — se nedan.) |
| **Pasteller bor i innehållet** | KPI-kort, sektionsbakgrunder, tabs, ikon-badges använder pastellerna. Inte rubrikbanderoller. |
| **Inga gradients i återkommande UI** | Gradient-bakgrunder (from-X to-Y) är förbjudna i KPI-kort, sektionsheaders, knappar. En platt pastell räcker. Gradient endast tillåten för dekorativa hjältebilder. |
| **Undersidor ärver moderhubbens färg** | En sida under `/jobb`-hubben (t.ex. CV, Applications) använder persika. En sida under `/karriar` använder rosa. Färgen säger **vilken hub du är i**, inte vilken specifik sida. |

---

## Färgsystem — Fem hub-färgscheman

Varje hub har **ett färgschema** som dess landningssida och alla undersidor delar. Färgen säger "var i portalen är du?" — inte "vad gör den här sidan?".

### Hub-färger

| Hub | Path | Färg | Soft bg | Accent | Solid (CTA) | Text |
|-----|------|------|---------|--------|-------------|------|
| **Översikt** | `/oversikt` | Mint/Turkos | `#ECF7F1` | `#C5E5D4` | `#1F8A66` | `#155F47` |
| **Söka jobb** | `/jobb` | Persika | `#FCF1E6` | `#F5D3B5` | `#C97A2E` | `#8B5418` |
| **Karriär** | `/karriar` | Rosa/Coral | `#FBEEEF` | `#F2C8CD` | `#B85363` | `#843845` |
| **Resurser** | `/resurser` | Sky/Blå | `#ECF4FA` | `#C8DEEF` | `#2F7DB5` | `#1F5985` |
| **Min vardag** | `/min-vardag` | Lavendel | `#F2EDF8` | `#D4C5EB` | `#7058A8` | `#4F3D7C` |

### Hub-medlemskap (vilka sidor ärver vilken färg)

Sanning: `client/src/components/layout/navigation.ts::navHubs[].memberPaths`. **En sida får bara tillhöra en hub** — ingen dubblering tillåten.

| Hub | Undersidor som ärver hub-färgen |
|-----|----------------------------------|
| **Översikt** | Bara `/oversikt` (och `/` som redirect) |
| **Söka jobb** | JobSearch, Applications, Spontanansökan, CV, Cover Letter, Interview Simulator, Salary, International, LinkedIn Optimizer |
| **Karriär** | Career, Interest Guide, Skills Gap, Personal Brand, Education |
| **Resurser** | Knowledge Base, Resources, Print Resources, External Resources, AI-team, Nätverk |
| **Min vardag** | Wellness, Diary, Calendar, Exercises, My Consultant, Profile |

Sidor utanför hubbarna (Help, Settings, AdminPanel, Login) använder neutral grå utan hub-accent.

### CSS-tokennamn (implementation)

Hub-färgerna implementeras i `tokens.css` via tekniska tokennamn som *inte* speglar hub-namnen 1-till-1. Detta är ett implementationsspår från tidigare arkitektur — använd hub-namnet när du resonerar, tokennamnet när du skriver kod:

| Hub | `data-domain`-värde | Token-prefix |
|-----|---------------------|--------------|
| Översikt | `action` | `--action-*` |
| Söka jobb | `activity` | `--activity-*` |
| Karriär | `coaching` | `--coaching-*` |
| Resurser | `info` | `--info-*` |
| Min vardag | `wellbeing` | `--wellbeing-*` |

> **Nedlagda koncept:** Den tidigare 3-domän-modellen (`action`/`reflection`/`outbound`) är **borttagen som designkoncept**. CSS-aliaser för `reflection` (→ wellbeing) och `outbound` (→ activity) finns kvar i `tokens.css` så gammal kod inte kraschar, men ska **inte** användas i ny kod eller refereras i designval.

### Pastell-intensitetsregler

1. **Soft bakgrund** = ljus mix (50-nyans), används som zon-bakgrund i innehållet
2. **Accent/border** = 200-nyans, för subtila ramar runt pastell-kort
3. **Solid CTA-fyllning** = 700-nyans (mjukare än 900), för knappar och progress-fyllning
4. **Text på pastell-bakgrund** = 900-nyansen (för WCAG-kontrast — får inte mjukas upp)
5. **Text på solid-bakgrund** = vit (#FFF)

### Neutrala färger

| Token | Hex | Användning |
|-------|-----|------------|
| `canvas` | `#FBFAF6` | Sidobakgrund (varmare än ren vit) |
| `surface` | `#FFFFFF` | Kortbakgrund |
| `header-bg` | `#F5F4F0` | **Uniform header-bakgrund** (alla sidor) |
| `header-bg-strong` | `#ECEAE3` | Header-variant med mer kontrast |
| `header-border` | `#DDD9D0` | Header-border |
| `header-text` | `#2C2C2A` | Header-titel |
| `header-muted` | `#6A6864` | Header-undertext |
| `stone-50` | `#F5F4F0` | Sektionsbakgrund |
| `stone-150` | `#EAE8E2` | Mjuk border |
| `stone-500` | `#9A9892` | Sekundär text |
| `stone-700` | `#6A6864` | Body sekundär |
| `stone-900` | `#2C2C2A` | Primär text |

### Status-färger (undantag från domäner)

- **Amber** `#D97706` — varning, notiser, "kompletteringsbehov"
- **Röd** `#DC2626` — destruktivt (radera, logga ut är **inte** destruktivt)
- **Emerald** — endast för "completed/success"-bekräftelser, semantiskt skild från Action-mint

### CSS-tokens

Implementerade i `client/src/styles/tokens.css`. Aktiveras per sida via `<div data-domain="...">` — sätts av `PageLayout` som läser routens hub-tillhörighet från `lib/domains.ts`.

```css
:root {
  /* Default = Översikt (action/mint) */
  --c-bg:     var(--action-bg);
  --c-accent: var(--action-accent);
  --c-solid:  var(--action-solid);
  --c-text:   var(--action-text);
}

[data-domain="action"]    { /* Översikt-hubben */ }
[data-domain="activity"]  { /* Söka jobb-hubben */ }
[data-domain="coaching"]  { /* Karriär-hubben */ }
[data-domain="info"]      { /* Resurser-hubben */ }
[data-domain="wellbeing"] { /* Min vardag-hubben */ }
```

Komponenter konsumerar **alltid** `--c-bg` / `--c-accent` / `--c-solid` / `--c-text` — aldrig en specifik hubs token direkt. Det enda undantaget är `HubOverview.tsx` där 4 olika hub-färger visas samtidigt (HubCard-griden) och behöver direktreferenser.

### Fördelning (60/30/10)

- **60 %** Neutrala (canvas, surface, header-bg, stone)
- **30 %** Pastell soft-bg (hubbens 50-mix som zon-bakgrund i innehållet)
- **10 %** Solid accent (hubbens 700-nyans för CTA, ikoner, progress)

---

## Header / Hjältesektion

**Uniform över alla sidor.** Detta är den största förändringen i detta system.

```
┌──────────────────────────────────────────────┐
│▌ Title                            [actions]  │  ← border-left 4px = --c-solid (hub)
│  Subtitle                                     │
│  ┌──────────────────────────────────────┐    │
│  │ Tab1  Tab2  Tab3  Tab4               │    │  ← tabs i vit underyta
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
   bg = --header-bg (varm grå)
   border = --header-border
```

Implementeras i `client/src/components/layout/PageTabs.tsx::PageHeader`.

- Bakgrund: `--header-bg` (samma på alla sidor)
- Vänsterkant: 4px `--c-solid` (subtil hub-identifiering)
- Titel: `--header-text`
- Undertext: `--header-muted`
- Tabs: vit underyta i `--header-border`-ram, accent-färg på aktiv tab är `--c-bg` (hubbens pastell)

### Vad som FÖRBJÖD

- Inga gradients i header
- Ingen pastell-bakgrund i header (det skapar flera olika "hero"-kulörer som skriker)
- Inga shadow på header (border räcker)

### Undantag: Översikt-hero (Launchpad)

Översikt (`/oversikt`) är **launchpad-sidan** och får ett särskilt hero-mönster — inte standard PageHeader:

```
┌──────────────────────────────────────────────────────┐
│  ◉ profilbild     Hej Mikael            ◉ TIS       │
│  (80×80, vit)     ↳ Besök din profil →   28          │
│                                                       │
│  ─────────────────────────────────────────            │
│  Vad vill du göra idag?                              │
└──────────────────────────────────────────────────────┘
   bg = --c-bg (action/mint)        ← undantag från neutral header
   border = --c-accent              radius 24px
   subtil radial-glow i --c-accent  ← dekorativ gradient (tillåten)
```

- Hero-bakgrund: `--c-bg` (action-mint) — **enda sidan** där hjältesektionen får domänfärg.
- Profilbild + datum-disc: 80×80, `bg-white`, `border-2 border-[--c-accent]`, runda.
- Subtil radial-gradient (top-right) i `--c-accent` är tillåten som **dekorativ** lager (konsekvent med gradient-undantaget för dekorativa hero-bilder).
- Implementation: `client/src/pages/hubs/HubOverview.tsx`. Aktiveras med `<PageLayout showHeader={false} ...>` så standard-PageHeader inte renderas.

Övriga hub-sidor (`/jobb`, `/karriar`, `/resurser`, `/min-vardag`) använder **standard neutral PageHeader** med 4px vänsterkant i sin hub-färg.

---

## Form

- **Border:** 1px solid `stone-150` (mjukare än `stone-200`)
- **Radius:** 6px småknappar, 8px kort, 12px paneler, 14px pills/badges, 16px hero-block
- **Skuggor:** Inga statiska. **Subtil hover-elevation** tillåten på interaktiva element (`0 2px 6px rgb(0 0 0 / 0.05)`). Strukturell elevering ska komma från border + tint, inte skugga.

---

## Hierarki

- **En primär CTA per vy.** Den får solid `--c-solid`.
- Övriga handlingar är `secondary` (vit + border) eller `ghost` (endast text).
- KPI-kort: siffran bär vikten. Etikett liten/grå (`stone-500`), siffra stor/mörk (`stone-900` eller `--c-text`).
- Sektionsrubriker: 14px, weight 600.

---

## Komponenter

### Knappar

- **Primär:** `bg-[--c-solid]`, vit text. Ej skugga (eller mycket subtil), hover ger `filter: brightness(1.08)`.
- **Sekundär:** vit bakgrund, `--c-text`-text, `stone-150` border. Hover: `bg-stone-50` + `border-color: --c-accent`.
- **Ghost:** endast text i `--c-text`. Hover ger `bg-[--c-bg]`.
- **Förbjudet:** gradient-knappar (`bg-gradient-to-r from-X to-Y`). Använd platt `--c-solid`.

### Kort

- **Default:** `bg-white`, `border-stone-150`, radius 12px. Ingen skugga. Hover: subtil elevation.
- **Tinted:** `bg-[--c-bg]`, `border-[--c-accent]`. Används när kortet hör tematiskt till sidans hub.
- **Förbjudet:** gradient-bakgrund i kort.

### HubCard (på Översikt)

Hub-kortet är ett distinkt mönster — **vitt kort** med hub-accent bara på toppstrecket, ikon-tilen och aktivitets-pricken. Inte tintat. Det skapar lugn yta där 4 olika hub-färger kan samexistera utan att skrika.

```
┌──────────────────────────────────────┐
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔     │  ← 4px topp-accent i hub-solid
│  ┌──┐  Hitta och söka jobb           │
│  │🧳│  ↳ ikon i hub-pastell-tile     │  ← 48×48 rounded-14, bg = hub-bg
│  └──┘                                 │
│        Matcha din profil, ansök ...   │
│  ─────────────────────────────────    │
│  ● 3 aktiva ansökningar     2d sen   │  ← prick i hub-solid
└──────────────────────────────────────┘
   bg = white, border = stone-200, radius 18px, min-height 200px
   hover: y -2px + shadow-md
```

- Implementation: `HubOverview.tsx::HubCard`.

### Hub-feature-page (`/jobb`, `/karriar`, `/resurser`, `/min-vardag`)

De 4 hub-landningssidorna renderas via `HubPage.tsx` och är de enda hub-sidorna som är klara med redesignen. De följer **standard neutral PageHeader** + grid av feature-kort (en per member-path). Hubbens färg används som accent på vänsterkant, ikon-tile och aktiv-tab — aldrig som hero-bakgrund.

**Undersidor (CV, Wellness, JobSearch m.fl.) är ännu inte redesignade** men ska när de migreras ärva moderhubbens färg via `data-domain` på `PageLayout`.

### KPI-kort

- **Positivt värde:** `--c-bg`-bakgrund, `--c-accent`-border, värde i `--c-text`.
- **Neutralt/noll:** vit bakgrund, `stone-150`-border, värde i `stone-900`.
- **Inget**: gradient. Använd platt pastell.

### Tabs

- **Aktiv:** `bg-[--c-bg]`, `text-[--c-text]`, vänsterkant `--c-solid` 3px.
- **Inaktiv:** transparent, hover `bg-stone-50`.

### Pills/Badges

- Radius: 14px
- Default: `bg-stone-50`, `text-stone-700`, `border-stone-150`
- Aktiv/Hub: `bg-[--c-bg]`, `text-[--c-text]`, `border-[--c-accent]`
- Status (amber/röd): semantisk färg + matchande tint

### Progress

- Bar: `--c-solid` på `stone-100` bakgrund
- Text: procent i `--c-text` om > 50 %

### Sidebar

5 hub-länkar i fast ordning. Varje länk wrappas i `<div data-domain="...">` så hover/aktiv-färg matchar respektive hubs pastell.

```
●  Översikt        (mint)
●  Söka jobb       (persika)
   ├─ Sök jobb
   ├─ Mina ansökningar
   ├─ ... sub-items syns BARA för aktiv hub
●  Karriär         (rosa)
●  Resurser        (sky)
●  Min vardag      (lavendel)
```

- **Aktiv hub:** `bg-[--c-bg]`, `text-[--c-text]`, vänsterkant 2px `--c-solid`, font-semibold.
- **Inaktiv hover:** `bg-[--c-bg]/40`, `text-[--c-text]` — hover på en hub förhandsvisar dess färg.
- **Sub-items (bara aktiv hub):** indragna med vänster-rail i `border-[--c-accent]`, samma hover/aktiv-regler — så ankaret visuellt knyter ihop hubben med dess undersidor.
- **Hub-uppslag:** `getActiveHub(pathname)` mot `pageToHub`-mappen (byggd från `navHubs[].memberPaths`). **Aldrig** URL-prefix-matchning — det knäcker djup-länkar.

#### Konsulent-/Admin-sektioner

- Konsulent-blocket: använder lavendel via äldre `data-domain="reflection"`-alias (kvar tills konsulent-flödet redesignas).
- Admin-länkar: semantisk amber (status-färg, **inte** hub) — visuellt åtskild för att signalera elevated permissions.

> **Implementation:** `client/src/components/layout/Sidebar.tsx` har även en legacy-renderingsväg bakom `VITE_HUB_NAV_ENABLED=false` — den är dödkod i prod och ska inte refereras i designval.

---

## Tillgänglighet

- **Fokusring:** `outline: none; box-shadow: 0 0 0 3px var(--c-bg), 0 0 0 4px var(--c-solid);` — synlig på alla hubbar, ingen hårdkodad färg.
- **Kontrast:** WCAG 2.1 AA minimum. Pastell-bakgrunderna är medvetet ljusa — text MÅSTE använda 900-nyansen för att klippa minst 7:1 kontrast.
- **Touch targets:** minst 44px.
- **prefers-reduced-motion:** alla animationer reduceras till 0.01ms via `@media`.
- **prefers-contrast: high:** byt till mörkare nyanser av hub-färgerna automatiskt.

---

## Motion

Tre tids-tokens, definierade i `tokens.css`:

- **Fast** `150ms` — micro-interaktioner (hover, focus, button press)
- **Standard** `300ms` — page enter, fade in/out, panel toggle
- **Slow** `600ms` — major layout shift, drawer open

Inga animationer över 600ms. Float, spin-slow och liknande bortkastade-uppmärksamhet-animationer **ska inte finnas** (NPF-användare blir distraherade).

---

## Designhistorik

| Version | Datum | Modell |
|---------|-------|--------|
| **Hub-färg (nu)** | 2026-04-30 | 5 hub-färgscheman (Översikt + 4 hubbar). Hubbar är organiseringsprincipen. Undersidor ärver moderhubbens färg. |
| 5-pastell-domän | 2026-04-29 | 5 abstrakta domäner (action/info/activity/wellbeing/coaching). Bytt namn — koncept lever kvar som CSS-tokens. |
| 3-domän | 2026-04-28 | Action/Reflektion/Utåtriktat. **Borttaget koncept.** CSS-aliaser kvar för rollback. |

### Vad är klart (2026-04-30)

- ✅ **Översikt** (`/oversikt`) — launchpad-hero, 4 HubCards
- ✅ **Söka jobb** (`/jobb`) — landningssida
- ✅ **Karriär** (`/karriar`) — landningssida
- ✅ **Resurser** (`/resurser`) — landningssida
- ✅ **Min vardag** (`/min-vardag`) — landningssida
- ✅ Sidebar (hub-läge med pastellfärger per hub)

### Vad återstår

- ⏳ **Undersidor** (CV, Wellness, JobSearch, Career, m.fl. ~25 sidor) — ska migreras till neutral PageHeader + ärva moderhubbens färg via `data-domain`.
- ⏳ Konsulent- och Admin-flöden (egen designvärdering när de tas upp).
- ⏳ Mobil bottom nav (HubBottomNav) — fungerar tekniskt men inte designgranskad.

---

## Referens

- Tokens: `client/src/styles/tokens.css`
- Hub→`data-domain`-mappning: `client/src/lib/domains.ts`
- Hub-definitioner: `client/src/components/layout/navigation.ts::navHubs`
- PageHeader (uniform): `client/src/components/layout/PageTabs.tsx::PageHeader`
- Översikt-hero: `client/src/pages/hubs/HubOverview.tsx`
- Hub-landningssidor: `client/src/pages/hubs/HubPage.tsx`
- Sidebar: `client/src/components/layout/Sidebar.tsx`

*Senast uppdaterad: 2026-04-30*
