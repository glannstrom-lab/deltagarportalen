# Designprinciper för jobin.se

## Färg

- **Accent:** `#0F6E56` (turkos). Endast en accentfärg i hela gränssnittet.
- **Status:**
  - Orange för varning/notis
  - Röd för destruktiva åtgärder
  - Grön undviks (krockar med accent)
- **Bakgrund:**
  - Vit (`#FFFFFF`) primär
  - Ljusgrå (`#F5F5F4`) sekundär
  - Inga pastellfärger på UI-element

## Form

- **Border:** `0.5px solid` neutral (`#E7E5E4`), inte färgad
- **Radius:**
  - `6px` småknappar
  - `8px` kort
  - `12px` paneler
- **Skuggor:** Undviks. Använd border istället för att skapa separation.

## Hierarki

- En primär CTA per vy (den enda färgade ytan)
- KPI-kort är neutrala — siffran bär vikten, inte kortet
- Sektionsrubriker i versaler/spärrad (`uppercase tracking-wider`)
- Status visas med små färgade prickar, inte färgade bakgrunder

## Komponenter

### Knappar
- **Primär:** `bg-brand-600` (`#0F6E56`), vit text
- **Sekundär:** Transparent med border
- **Ghost:** Endast text, hover ger bakgrund

### Ikonknappar (topbar)
- Storlek: `32px`
- Bakgrund: transparent
- Hover: `background-secondary`

### Taggar/Pills
- Alltid neutral grå bakgrund
- Ingen kategorifärg utan semantisk anledning

### Tabs
- Bottom-border för aktiv tab
- Inte upphöjt kort-stil

### Sidebar
- Endast aktivt menyval har bakgrundsfärg (ljusgrå)
- Övriga menypunkter är ren text
- Grupprubrik i versaler, dämpad färg

### KPI-kort
- Vit bakgrund med subtil border
- Rubrik i grått, värde i svart
- Status med liten färgad prick (● Uppdaterat)

## Typografi

- **Rubriker:** `font-semibold` eller `font-bold`
- **Brödtext:** `text-stone-600` (dark: `text-stone-400`)
- **Dämpad text:** `text-stone-500`
- **Länkar:** `text-brand-600`, understruken vid hover

## Spacing

- Konsekvent 4px-grid (`p-1` = 4px, `p-2` = 8px, etc.)
- Sektioner: `gap-6` (24px)
- Inuti kort: `p-4` eller `p-5`

## Tillgänglighet

- Fokusring: `ring-2 ring-brand-600 ring-offset-2`
- Kontrast: WCAG 2.1 AA minimum
- Touch targets: minst 44px
