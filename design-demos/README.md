# Design-demos — välj riktning

Tre standalone-HTML som visar samma tre sidor (Dashboard, Wellness, Jobbsökning) i tre olika designriktningar. Öppna varje fil i webbläsaren och växla mellan sidorna med fliken nere till höger.

## Filerna

| Fil | Riktning | Vad du ser |
|-----|----------|------------|
| `demo-A-design-md-as-spec.html` | **A — DESIGN.md som specen säger** | Turkos primär, 5 domänfärger som faktiskt syns (rosa Wellness, blå Jobb), inga skuggor, borders + tints. "Headspace, inte Linear." |
| `demo-B-violet-as-built.html` | **B — Calm & Capable Violet** | Violet primär överallt. Inga domänfärger. Skuggor, gradienter, hover-animationer. Modernt SaaS-utseende. Det här är förmodligen vad koden faktiskt renderar idag. |
| `demo-C-hybrid-3-domains.html` | **C — Hybrid: 3 domäner** | Turkos primär. 3 domäner istället för 5: Action (turkos), Reflektion (lila), Utåtriktat (persika). Sidor grupperade i sidebar. Subtila hover-elevations tillåtna. |
| `demo-C-pastell.html` | **C-Pastell — mjukare intensitet** | Samma struktur som C-hybrid, men mjukare: solid CTA i 700-nyans (ej 900), bakgrunder ljusare än 50, varmare canvas, lättare borders. Text behåller 900 för WCAG-kontrast. |

## Vad du ska titta efter

1. **Sidebar:** Hur tydligt grupperar den vad sidan handlar om?
2. **Page header:** Domänfärgsbandet — känns det som identitet eller dekoration?
3. **KPI-kort:** Är de lugna eller livliga? Skuggor vs borders.
4. **Wellness-sidan:** Demo A=rosa, B=violet, C=lila. Hur olika känns det?
5. **Jobbsökning:** Demo A=blå, B=violet, C=persika. Vilken stämmer bäst för "utåtriktad aktivitet"?
6. **Hover-rörelser:** Demo B har skuggor som lyfter — irriterande eller piggt?

## Snabbjämförelse

|  | A — Spec | B — Bygd | C — Hybrid |
|---|---|---|---|
| Primärfärg | Turkos | Violet | Turkos |
| Domänfärger | 5 (action/info/activity/wellbeing/coaching) | 0 | 3 (action/reflection/outbound) |
| Skuggor | Nej | Ja, prominent | Subtil hover |
| Gradienter | Nej | Ja | Nej |
| Sidebar-grupp | Platt | Platt | Grupperad per domän |
| Underhåll | Hög (5 paletter) | Låg (1 palett) | Medel (3 paletter) |
| Risk | Aggressiv färgskillnad mellan sidor | Allt känns likadant | Balans, men kräver disciplin |

## Efter du valt

Säg "kör A", "kör B" eller "kör C" så bygger jag implementationsplanen för det valet (uppdaterad DESIGN.md, refactor-strategi, estimat). Mappen `design-demos/` kan raderas när beslutet är fattat.
