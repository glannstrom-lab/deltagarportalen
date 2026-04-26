# Designprinciper för jobin.se

## Kontext
Vår målgrupp är personer i jobbsökar- eller rehabprocess.
Många är i en utsatt situation. Tonen ska vara stödjande,
inte stressande. Tänk Headspace, inte Linear.

## Färgsystem — Semantiska Domäner

Färger representerar **aktivitetsdomäner**, inte dekoration.
Varje domän har en egen färg som används konsekvent genom hela appen.

### Domänfärger

| Domän | Färg | 50 (bg) | 300 (accent) | 900 (solid) | Användning |
|-------|------|---------|--------------|-------------|------------|
| **Action** | Turkos | `#E1F5EE` | `#9FE1CB` | `#0F6E56` | CTA, brand, primära handlingar |
| **Info** | Blå | `#DCEBFB` | `#9EC5ED` | `#1E5A9C` | Sparade jobb, information, referens |
| **Activity** | Persika | `#FFE8D6` | `#F4B988` | `#B05A1A` | Utåtriktad aktivitet, ansökningar |
| **Wellbeing** | Rosa | `#FBE2EC` | `#F0A8C0` | `#9F1F4D` | Mående, hälsa, personliga känslor |
| **Coaching** | Lila | `#E8E1F4` | `#BFA9E0` | `#5B3F8F` | Självkännedom, reflektion, intresseguide |

### Neutrala färger

| Token | Hex | Användning |
|-------|-----|------------|
| `canvas` | `#FAFAF8` | Sidobakgrund |
| `neutral-50` | `#F1F1EE` | Kortbakgrund, sektioner |
| `neutral-500` | `#888780` | Sekundär text |
| `neutral-900` | `#2C2C2A` | Primär text |

### CSS-tokens (semantiska)

```css
:root {
  --color-action: var(--teal-900);
  --color-action-bg: var(--teal-50);
  --color-info: var(--blue-900);
  --color-info-bg: var(--blue-50);
  --color-activity: var(--peach-900);
  --color-activity-bg: var(--peach-50);
  --color-wellbeing: var(--pink-900);
  --color-wellbeing-bg: var(--pink-50);
  --color-coaching: var(--purple-900);
  --color-coaching-bg: var(--purple-50);
}
```

### Fördelning (60/30/10)

- **60%** Neutrala (canvas, vit, stone)
- **30%** Pastell-tints (domänens 50-nyans som bakgrund)
- **10%** Solid accent (domänens 900-nyans för knappar, ikoner)

### Sidmappning till domäner

Varje sida tillhör en primär domän som bestämmer dess accentfärg:

| Sida | Domän | Färg |
|------|-------|------|
| Dashboard | Action | Turkos |
| Profil | Action | Turkos |
| CV-byggare | Coaching | Lila |
| Personligt brev | Activity | Persika |
| Jobbsökning | Info | Blå |
| Sparade jobb | Info | Blå |
| Ansökningar | Activity | Persika |
| Intresseguide | Coaching | Lila |
| Intervjusimulator | Activity | Persika |
| Kompetensanalys | Coaching | Lila |
| LinkedIn-optimering | Activity | Persika |
| Dagbok | Coaching | Lila |
| Välmående | Wellbeing | Rosa |
| Kalender | Info | Blå |
| Karriär | Coaching | Lila |
| AI-team | Action | Turkos |
| Hjälp | Info | Blå |
| Inställningar | Action | Turkos |

### Status (undantag från domäner)

- **Orange** — varning, notiser
- **Röd** — destruktivt (ta bort, logga ut är INTE destruktivt)
- **Grön** — framgång, slutfört (endast för status, inte domän)

## Form
- **Border:** 0.5px solid neutral
- **Radius:** 6px småknappar, 8px kort, 12px paneler, 14px pill-taggar
- **Skuggor:** undviks. Använd border eller tint istället.

## Hierarki
- En primär CTA per vy. Den får solid turkos.
- KPI-kort: siffran bär vikten. Etikett liten/grå, siffra stor/mörk eller turkos.
- Sektionsrubriker: 14px, weight 500.

## Komponenter

### Knappar
- **Primär:** `bg-brand-900`, vit text
- **Sekundär:** vit bakgrund, `brand-900` text, neutral border
- **Ghost:** endast text, hover ger `brand-50` bakgrund

### Kort
- **Default:** vit bakgrund, `border-stone-200`
- **Tinted:** `bg-brand-zone`, används när kort hör ihop tematiskt

### KPI-kort
- **Positivt värde:** `brand-zone` bakgrund, `brand-300` border
- **Neutralt/noll:** vit bakgrund, `stone-200` border

### Tabs
- **Aktiv:** `brand-100` bakgrund, `brand-900` text
- **Inaktiv:** transparent, hover `brand-50`

### Taggar/Pills
- Radius: 14px
- Neutral grå bakgrund som default
- Tint endast med semantisk motivering

### Progress
- Bar: `brand-900` på `brand-100` bakgrund
- Text: procent i `brand-900` om > 50%

## Tillgänglighet
- Fokusring: `ring-2 ring-brand-900 ring-offset-2`
- Kontrast: WCAG 2.1 AA minimum
- Touch targets: minst 44px
