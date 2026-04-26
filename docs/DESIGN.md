# Designprinciper för jobin.se

## Kontext
Vår målgrupp är personer i jobbsökar- eller rehabprocess.
Många är i en utsatt situation. Tonen ska vara stödjande,
inte stressande. Tänk Headspace, inte Linear.

## Färgsystem
En enda varumärkesfärg: turkos #0F6E56.
Används i fyra intensiteter:

| Token | Hex | Användning |
|-------|-----|------------|
| `brand-900` | `#0F6E56` | Solid — CTA, aktiva tillstånd, progress, status "bra" |
| `brand-300` | `#9FE1CB` | Mid — borders på tintade ytor |
| `brand-100` | `#E1F5EE` | Ljus — aktivt menyval, "positiv" KPI-tint |
| `brand-zone` | `#F0F9F5` | Tona — zon-bakgrund för grupperade kort |

### Status
- **Orange** — varning, notiser
- **Röd** — destruktivt (ta bort, logga ut är INTE destruktivt)
- **Grön** — undviks (krockar med accent)

## Färg som semantik
Tinten är inte dekoration. Den används bara när något hör ihop:
- Två kort som är samma "tema" (utveckling, hälsa, ekonomi) får samma tint
- Ett KPI-kort med positivt värde får tint, ett med 0 får inte
- En CTA-knapp får solid färg, en sekundär knapp får inte

**Om du inte kan motivera färgen semantiskt — använd vit/grå.**

## När pastellfärger är tillåtna

Pastellfärger är ett verktyg för KATEGORISERING, inte dekoration.
De används bara när:

1. Det finns 3-6 distinkta, jämbördiga kategorier
   (inte mer, inte färre)
2. Användaren behöver kunna sortera/skanna visuellt
3. Kategorierna är meningsfullt olika
   (inte bara "olika kort" utan "olika typer av saker")

När pastell används:
- Samma färg på filterknapp som på kort av samma kategori
- Färgen ska vara TYDLIG nog att fungera
  (en 4px remsa eller solid bakgrund på taggen, inte bara en hint)
- Max 6 kategorier. Behöver du fler — gruppera dem.
- Varje kategorifärg dokumenteras i DESIGN.md med namn och hex-värde

Pastell är INTE tillåtet för:
- KPI-kort (de mäter samma sak)
- Statusmarkeringar (använd semantiska färger)
- "Snyggare" — om färgen inte särskiljer en kategori, är den dekoration

### Kategorifärger (tillåtna pasteller)

| Namn | Bakgrund | Text |
|------|----------|------|
| Blå | `#DBEAFE` | `#1E40AF` |
| Grön | `#D1FAE5` | `#065F46` |
| Rosa | `#FCE7F3` | `#9F1239` |
| Lila | `#EDE9FE` | `#5B21B6` |
| Gul | `#FEF3C7` | `#92400E` |
| Orange | `#FFEDD5` | `#9A3412` |

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
