# Designprinciper för Deltagarportalen

> **Status:** Aktiv från 2026-04-28. Ersätter tidigare violet-baserade "Calm & Capable"-spec.
> **Riktning:** C-Pastell (turkos primär + 3 domäner i pastell-intensitet).

## Kontext

Vår målgrupp är personer i jobbsökar- eller rehabprocess. Många är i en utsatt situation — utmattning, NPF, långtidsarbetslöshet, fysiska och psykiska utmaningar. Tonen ska vara **stödjande, inte stressande**. Tänk Headspace, inte Linear.

WCAG 2.1 AA är minimikrav. Pastell-intensiteten är vald för att minska visuell trötthet vid daglig användning.

---

## Färgsystem — Tre semantiska domäner

Färger representerar **aktivitetsdomäner**, inte dekoration. Varje domän har en egen färg som används konsekvent genom hela appen.

### Domäner

| Domän | Färg | Solid (CTA) | Soft bg | Accent | Text | Sidor |
|-------|------|-------------|---------|--------|------|-------|
| **Action** | Turkos | `#148860` | `#F0F9F5` | `#C8EBD9` | `#0F6E56` | Dashboard, AI-Team, Inställningar, Help, Resources, KnowledgeBase, Network |
| **Reflektion** | Lila | `#7B5FB0` | `#F4F0FA` | `#D4C5EB` | `#5B3F8F` | CV, Personligt brev, Wellness, Diary, Karriär, InterestGuide, SkillsGapAnalysis, PersonalBrand, Education, InterviewSimulator, Calendar |
| **Utåtriktat** | Persika | `#DE8738` | `#FFF5EB` | `#F8D5B5` | `#B05A1A` | Jobbsökning, Ansökningar, Spontanansökan, LinkedInOptimizer, International, Salary, ExternalResources |

### Pastell-intensitetsregler

1. **Solid CTA-fyllning** = 700-nyans (mjukare än 900)
2. **Soft bakgrund** = ljusare mix än 50-nyansen (ger en luftigare känsla)
3. **Accent/border** = 300-nyans
4. **Text på pastell-bakgrund** = 900-nyansen (för WCAG-kontrast — får inte mjukas upp)
5. **Text på solid-bakgrund** = vit (#FFF)

### Neutrala färger

| Token | Hex | Användning |
|-------|-----|------------|
| `canvas` | `#FBFAF6` | Sidobakgrund (något varmare än ren vit) |
| `surface` | `#FFFFFF` | Kortbakgrund |
| `stone-50` | `#F5F4F0` | Sektionsbakgrund |
| `stone-150` | `#EAE8E2` | Mjuk border (ej `stone-200`) |
| `stone-500` | `#9A9892` | Sekundär text |
| `stone-700` | `#6A6864` | Body sekundär |
| `stone-900` | `#2C2C2A` | Primär text |

### Status-färger (undantag från domäner)

- **Amber** `#D97706` — varning, notiser, "kompletteringsbehov"
- **Röd** `#DC2626` — destruktivt (radera, logga ut är **inte** destruktivt)
- **Grön** — aldrig som UI-färg (krockar med Action). Använd Action-färgen för "framgång".

### CSS-tokens

Implementerade i `client/src/styles/tokens.css`. Aktiveras per sida via `<div data-domain="action|reflection|outbound">`.

```css
:root {
  --c-bg: var(--action-bg);
  --c-accent: var(--action-accent);
  --c-solid: var(--action-solid);
  --c-text: var(--action-text);
}
[data-domain="reflection"] {
  --c-bg: var(--reflect-bg);
  --c-accent: var(--reflect-accent);
  --c-solid: var(--reflect-solid);
  --c-text: var(--reflect-text);
}
[data-domain="outbound"] { /* ... */ }
```

### Fördelning (60/30/10)

- **60 %** Neutrala (canvas, surface, stone)
- **30 %** Pastell soft-bg (domänens 50-mix som zon-bakgrund)
- **10 %** Solid accent (domänens 700-nyans för CTA, ikoner)

---

## Form

- **Border:** 1px solid `stone-150` (mjukare än `stone-200`)
- **Radius:** 6px småknappar, 8px kort, 12px paneler, 14px pills/badges
- **Skuggor:** Inga statiska. **Subtil hover-elevation** tillåten på interaktiva element (`0 2px 6px rgb(0 0 0 / 0.05)`). Strukturell elevering ska komma från border + tint, inte skugga.

---

## Hierarki

- **En primär CTA per vy.** Den får solid `--c-solid`.
- Övriga handlingar är `secondary` (vit + border) eller `ghost` (endast text).
- KPI-kort: siffran bär vikten. Etikett liten/grå (`stone-500`), siffra stor/mörk (`stone-900` eller `--c-text` om "positivt värde").
- Sektionsrubriker: 14px, weight 600.

---

## Komponenter

### Knappar

- **Primär:** `bg-[--c-solid]`, vit text. Ej skugga, hover ger `filter: brightness(1.08)`.
- **Sekundär:** vit bakgrund, `--c-text`-text, `stone-150` border. Hover: `bg-stone-50` + `border-color: --c-accent`.
- **Ghost:** endast text i `--c-text`. Hover ger `bg-[--c-bg]`.

### Kort

- **Default:** `bg-white`, `border-stone-150`, radius 12px. Ingen skugga. Hover: subtil elevation.
- **Tinted:** `bg-[--c-bg]`, `border-[--c-accent]`. Används när kortet hör tematiskt till sidans domän.

### KPI-kort

- **Positivt värde:** `--c-bg`-bakgrund, `--c-accent`-border, värde i `--c-text`.
- **Neutralt/noll:** vit bakgrund, `stone-150`-border, värde i `stone-900`.

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

### Page Header

```
┌──────────────────────────────────────────────┐
│ ▌ [icon] Title                  [DOMAIN-TAG] │  ← border-left 4px = --c-solid
│         Subtitle                              │
└──────────────────────────────────────────────┘
```

- Vänsterkant `--c-solid` 4px (visuell domän-anchor)
- Domän-tag uppe till höger (Action / Reflektion / Utåtriktat)
- Subtil bakgrund: vit (default) eller `--c-bg` (tinted för Wellness/känsliga sidor)

### Sidebar

Grupperad i 3 domäner med små färgpunkter:

```
ACTION ●
  Dashboard
  AI-Team
  Inställningar

REFLEKTION ●
  CV
  Personligt brev
  Wellness
  Dagbok
  ...

UTÅTRIKTAT ●
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

## Vad som ändrats från tidigare DESIGN.md

| Område | Tidigare | Nu |
|--------|----------|-----|
| Antal domäner | 5 (Action/Info/Activity/Wellbeing/Coaching) | 3 (Action/Reflektion/Utåtriktat) |
| Primärfärg | Specat turkos, kodat violet | Turkos pastell (konsoliderat) |
| Solid-fyllning | 900-nyans | 700-nyans (mjukare) |
| Skuggor | "Undviks" (men 16 fanns i koden) | Inga statiska, subtil hover OK |
| Canvas | `#FAFAF8` | `#FBFAF6` (något varmare) |
| Borders | `0.5px stone-200` | `1px stone-150` (mjukare ton) |
| Implementation | `data-domain` var dödkod | `data-domain` driver CSS-växling |

---

## Referens

- Demo: `design-demos/demo-C-pastell.html` — visuell referens
- Tokens: `client/src/styles/tokens.css` — implementation
- Domän-mappning: `client/src/lib/domains.ts` — vilka sidor hör till vilken domän

*Senast uppdaterad: 2026-04-28*
