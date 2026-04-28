# Designprinciper för Deltagarportalen

> **Status:** Aktiv från 2026-04-29. Ersätter "C-Pastell 3-domän"-spec.
> **Riktning:** 5 ljusa pastellfärger som lever i innehållet — uniform neutral grå hjälte/header på alla sidor.

## Kontext

Vår målgrupp är personer i jobbsökar- eller rehabprocess. Många är i en utsatt situation — utmattning, NPF, långtidsarbetslöshet, fysiska och psykiska utmaningar. Tonen ska vara **stödjande, inte stressande**. Tänk Headspace, inte Linear.

WCAG 2.1 AA är minimikrav. Pastell-intensiteten är vald för att minska visuell trötthet vid daglig användning.

---

## Bärande designidé

| Princip | Konsekvens |
|--------|-----------|
| **Hjältesektion = neutral grå** | Alla sidors `PageHeader` använder `--header-bg` (varm grå). Ingen domänfärg och ingen gradient i toppen. En 4px vänsterkant i domänfärg ger subtil identifiering. |
| **Pasteller bor i innehållet** | KPI-kort, sektionsbakgrunder, tabs, ikon-badges använder pastellerna. Inte rubrikbanderoller. |
| **Inga gradients i återkommande UI** | Gradient-bakgrunder (from-X to-Y) är förbjudna i KPI-kort, sektionsheaders, knappar. En platt pastell räcker. Gradient endast tillåten för dekorativa hjältebilder. |
| **5 distinkta domäner** | Färgen kommunicerar **vad sidan är** — inte enbart "vilken accent finns på sidan". |

---

## Färgsystem — Fem semantiska domäner

Färger representerar **aktivitetsdomäner**, inte dekoration. Varje domän har en egen ljus pastellfärg som används konsekvent i innehållet, aldrig i hjälte/header.

### Domäner

| Domän | Färg | Soft bg | Accent | Solid (CTA) | Text | Sidor |
|-------|------|---------|--------|-------------|------|-------|
| **Action** | Mint/Turkos | `#ECF7F1` | `#C5E5D4` | `#1F8A66` | `#155F47` | Dashboard, AI-Team, Inställningar, Profil, Min konsulent |
| **Info** | Sky/Blå | `#ECF4FA` | `#C8DEEF` | `#2F7DB5` | `#1F5985` | Help, Resources, KnowledgeBase, Nätverk, ExternalResources |
| **Activity** | Persika | `#FCF1E6` | `#F5D3B5` | `#C97A2E` | `#8B5418` | JobSearch, Applications, Spontanansökan, LinkedIn, Salary, International |
| **Wellbeing** | Lavendel | `#F2EDF8` | `#D4C5EB` | `#7058A8` | `#4F3D7C` | Wellness, Diary, Calendar |
| **Coaching** | Rosa/Coral | `#FBEEEF` | `#F2C8CD` | `#B85363` | `#843845` | CV, Cover Letter, Career, InterestGuide, SkillsGap, PersonalBrand, Education, InterviewSimulator, Exercises |

### Bakåtkompatibilitet

`reflection` aliasar till `wellbeing` och `outbound` aliasar till `activity` (CSS-aliasing i `tokens.css`).
Detta så att sidor som migrerades till det korta 3-domän-systemet fortsätter fungera utan kodändringar.

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

Implementerade i `client/src/styles/tokens.css`. Aktiveras per sida via `<div data-domain="...">`.

```css
:root {
  --c-bg:     var(--action-bg);
  --c-accent: var(--action-accent);
  --c-solid:  var(--action-solid);
  --c-text:   var(--action-text);
}

[data-domain="info"]      { --c-bg: var(--info-bg); ... }
[data-domain="activity"]  { --c-bg: var(--activity-bg); ... }
[data-domain="wellbeing"] { --c-bg: var(--wellbeing-bg); ... }
[data-domain="coaching"]  { --c-bg: var(--coaching-bg); ... }
```

### Fördelning (60/30/10)

- **60 %** Neutrala (canvas, surface, header-bg, stone)
- **30 %** Pastell soft-bg (domänens 50-mix som zon-bakgrund i innehållet)
- **10 %** Solid accent (domänens 700-nyans för CTA, ikoner, progress)

---

## Header / Hjältesektion

**Uniform över alla sidor.** Detta är den största förändringen i detta system.

```
┌──────────────────────────────────────────────┐
│▌ Title                            [actions]  │  ← border-left 4px = --c-solid (domän)
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
- Vänsterkant: 4px `--c-solid` (subtil domän-identifiering)
- Titel: `--header-text`
- Undertext: `--header-muted`
- Tabs: vit underyta i `--header-border`-ram, accent-färg på aktiv tab är `--c-bg` (domänens pastell)

### Vad som FÖRBJÖD

- Inga gradients i header
- Ingen pastell-bakgrund i header (det skapar flera olika "hero"-kulörer som skriker)
- Inga shadow på header (border räcker)

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
- **Tinted:** `bg-[--c-bg]`, `border-[--c-accent]`. Används när kortet hör tematiskt till sidans domän.
- **Förbjudet:** gradient-bakgrund i kort.

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
- Aktiv/Domän: `bg-[--c-bg]`, `text-[--c-text]`, `border-[--c-accent]`
- Status (amber/röd): semantisk färg + matchande tint

### Progress

- Bar: `--c-solid` på `stone-100` bakgrund
- Text: procent i `--c-text` om > 50 %

### Sidebar

Grupperad i 3 navigationsblock med små färgpunkter (sidebar-domänerna är förenklade jämfört med sid-domänerna):

```
ACTION ●         (turkos punkt)
  Dashboard
  AI-Team
  ...

REFLEKTION ●     (lila/lavendel punkt)
  CV
  Personligt brev
  Wellness
  ...

UTÅTRIKTAT ●     (persika punkt)
  Jobbsökning
  Ansökningar
  ...
```

Aktiv länk: `bg-[--c-bg]`, `text-[--c-text]`, vänsterkant 3px `--c-solid`.

---

## Tillgänglighet

- **Fokusring:** `outline: none; box-shadow: 0 0 0 3px var(--c-bg), 0 0 0 4px var(--c-solid);` — synlig på alla domäner, ingen hårdkodad färg.
- **Kontrast:** WCAG 2.1 AA minimum. Pastell-bakgrunderna är medvetet ljusa — text MÅSTE använda 900-nyansen för att klippa minst 7:1 kontrast.
- **Touch targets:** minst 44px.
- **prefers-reduced-motion:** alla animationer reduceras till 0.01ms via `@media`.
- **prefers-contrast: high:** byt till mörkare nyanser av domänfärgerna automatiskt.

---

## Motion

Tre tids-tokens, definierade i `tokens.css`:

- **Fast** `150ms` — micro-interaktioner (hover, focus, button press)
- **Standard** `300ms` — page enter, fade in/out, panel toggle
- **Slow** `600ms` — major layout shift, drawer open

Inga animationer över 600ms. Float, spin-slow och liknande bortkastade-uppmärksamhet-animationer **ska inte finnas** (NPF-användare blir distraherade).

---

## Vad som ändrats från föregående DESIGN.md (3-domän, 2026-04-28)

| Område | 3-domän | 5-pastell (nu) |
|--------|---------|----------------|
| Antal domäner | 3 (Action/Reflektion/Utåtriktat) | 5 (Action/Info/Activity/Wellbeing/Coaching) |
| Header | Gradient i domänfärg `from-[--c-bg] via-white to-sky-50` | Uniform `--header-bg` (varm grå), 4px vänsterkant i domänfärg |
| Gradients i UI | Tillåtet på KPI, sektionsheaders | Förbjudet på återkommande UI |
| Solid-fyllning | 700-nyans | 700-nyans (oförändrat) |

---

## Referens

- Tokens: `client/src/styles/tokens.css`
- Domän-mappning: `client/src/lib/domains.ts`
- PageHeader (uniform): `client/src/components/layout/PageTabs.tsx::PageHeader`

*Senast uppdaterad: 2026-04-29*
