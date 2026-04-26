# Designprinciper för jobin.se

## Färgfilosofi

Vi använder en varumärkesfärg (turkos) i fyra intensiteter. Tinten används som grupperande signal för zoner som hör ihop tematiskt, inte som dekoration. Solid accent används för CTA, status och progress. Neutral vit/grå reserveras för data utan emotionell laddning.

## Färgskala (60/30/10-fördelning)

| Token | Hex | Användning |
|-------|-----|------------|
| `brand-900` | `#0F6E56` | Solid accent: CTA-knappar, aktiva ikoner, progress-bars, checkmarks |
| `brand-300` | `#9FE1CB` | Borders på tintade ytor |
| `brand-100` | `#E1F5EE` | Aktiva menyval, positiv KPI-tint, markerad rad |
| `brand-50` | `#F5FBF9` | Lättaste tinten, hover-state |
| `brand-zone` | `#F0F9F5` | Zon-bakgrund för grupperade kort (t.ex. "Kom igång" + "Intresseprofil") |

### Status
- **Orange:** varning/notis
- **Röd:** destruktiva åtgärder
- **Grön:** undviks (krockar med accent)

### Bakgrund
- **Vit** (`#FFFFFF`): primär, neutral data
- **Ljusgrå** (`#F5F5F4`): sekundär
- **brand-zone**: utvecklingszoner, grupperade kort

## Form

- **Border:** `0.5px solid` neutral (`#E7E5E4`), inte färgad
- **Radius:**
  - `6px` småknappar
  - `8px` kort
  - `12px` paneler
- **Skuggor:** Undviks. Använd border istället för att skapa separation.

## Hierarki

- En primär CTA per vy (solid `brand-900` bakgrund)
- Positiva KPI-kort får `brand-50` bakgrund med `brand-300` border
- Neutrala KPI-kort: vit bakgrund
- Utvecklingszoner (Kom igång, Intresseprofil) grupperas med `brand-zone` bakgrund
- Sektionsrubriker i versaler/spärrad (`uppercase tracking-wider`)

## Komponenter

### Knappar
- **Primär:** `bg-brand-900` (`#0F6E56`), vit text
- **Sekundär:** Vit bakgrund, `brand-900` text
- **Ghost:** Endast text, hover ger `brand-50` bakgrund

### Ikonknappar (topbar)
- Storlek: `32px`
- Bakgrund: transparent
- Hover: `background-secondary`

### Taggar/Pills
- Alltid neutral grå bakgrund
- Ingen kategorifärg utan semantisk anledning

### Tabs
- Aktiv: `brand-100` bakgrund, `brand-900` text
- Inaktiv: transparent, hover `brand-50`

### Sidebar
- **Aktivt menyval:** `brand-100` bakgrund, `brand-900` text och ikon
- **Inaktiva menyval:** ikoner i `brand-900`, text i `stone-700`
- **Användarblock:** `brand-zone` bakgrund, turkos avatar
- Grupprubrik i versaler, dämpad färg

### KPI-kort
- **Positiva värden:** `brand-50` bakgrund, `brand-300` border, värde i `brand-900`
- **Neutrala värden:** vit bakgrund, `stone-200` border
- Status med liten färgad prick (● Uppdaterat)

## Typografi

- **Rubriker:** `font-semibold` eller `font-bold`
- **Brödtext:** `text-stone-600` (dark: `text-stone-400`)
- **Dämpad text:** `text-stone-500`
- **Länkar:** `text-brand-900`, understruken vid hover

## Spacing

- Konsekvent 4px-grid (`p-1` = 4px, `p-2` = 8px, etc.)
- Sektioner: `gap-6` (24px)
- Inuti kort: `p-4` eller `p-5`

## Tillgänglighet

- Fokusring: `ring-2 ring-brand-900 ring-offset-2`
- Kontrast: WCAG 2.1 AA minimum
- Touch targets: minst 44px
