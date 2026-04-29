# Requirements: Deltagarportalen — v1.0 Hub-Navigation

**Defined:** 2026-04-28
**Core Value:** Hjälp utsatta arbetssökande att komma framåt med empati, tillgänglighet och AI-stöd som sänker tröskeln.

## v1.0 Requirements

Hubbarna ersätter den platta 27-sidors-navigationen med 5 domän-orienterade hubbar och smarta widget-kort. Drag/resize är deferred till v1.1.

### Navigation (NAV)

- [x] **NAV-01**: Användaren ser och navigerar via 5 hubbar (Översikt, Söka Jobb, Karriär, Resurser, Min Vardag) i sidebaren
- [x] **NAV-02**: Användaren ser aktiv hubbs undersidor expanderade i sidebaren
- [x] **NAV-03**: Mobilanvändare har 5-fliks bottom-nav på hubb-nivå
- [x] **NAV-04**: Alla 27 befintliga deep-links fungerar oförändrat efter migrering (smoke-tested)
- [x] **NAV-05**: Rollout styrs av environment-flagga (`VITE_HUB_NAV_ENABLED`); båda navigationerna kan köras parallellt under övergång

### Widget-grund (WIDG)

- [x] **WIDG-01**: Användaren ser hub-sidor med widgets grupperade i sektioner med rubriker
- [x] **WIDG-02**: Användaren kan ändra storlek på widget mellan S/M/L/XL via tangentbord-tillgänglig toggle
- [x] **WIDG-03**: En widget med fel eller timeout visar graceful fallback utan att krascha hela hubben

### Hub-innehåll (HUB)

- [x] **HUB-01**: Söka Jobb visar widgets för Sök jobb, Mina ansökningar, Spontanansökan, CV, Personligt brev, Intervjuträning, Lön, Internationellt — alla med riktig data
- [x] **HUB-02**: Karriär visar widgets för Karriärmål, Intresseguide, Kompetensgap, Personligt varumärke, Utbildning, LinkedIn — alla med riktig data
- [x] **HUB-03**: Resurser visar widgets för Mina dokument, Kunskapsbank, Externa resurser, Utskriftsmaterial, AI-team, Övningar — alla med riktig data
- [x] **HUB-04**: Min Vardag visar widgets för Hälsa, Dagbok, Kalender, Nätverk, Min konsulent — alla med riktig data
- [x] **HUB-05**: Översikt visar onboarding/next-step XL-widget + max 6 sammanfattande widgets från övriga hubbar
- [x] **HUB-06**: Alla widget-empty-states har handlingsstöttande kopia (ej bara nollor)

### Backend-persistens (DATA)

- [x] **DATA-01**: Interview-sessionsscore persisteras i Supabase och syns över tid i widget
- [x] **DATA-02**: Personal Brand-audit-score persisteras i Supabase och syns i widget

### Tillgänglighet & empati (A11Y)

- [x] **A11Y-01**: Användaren kan navigera och styra alla hub-funktioner via tangentbord
- [x] **A11Y-02**: Alla widget- och hub-animationer respekterar `prefers-reduced-motion`
- [x] **A11Y-03**: Inga råa procent-KPI:er som läses som otillräcklighet; milstolpe-framing ersätter "75% klart"
- [x] **A11Y-04**: Avslutade/avslagna ansökningar är dolda som default i Mina ansökningar-widget
- [x] **A11Y-05**: All widget-kopia, framing och empty-states är granskade av `arbetskonsulent` + `langtidsarbetssokande` agenter innan Phase 3 ships

### Anpassning (CUST)

- [x] **CUST-01**: Användaren kan dölja och återvisa enskilda widgets per hub
- [x] **CUST-02**: Användaren kan återställa default-layout per hub
- [x] **CUST-03**: Användarens layout (storlekar, dolda widgets) sparas per hub i Supabase och återställs vid återbesök

## v1.1 Requirements

Deferrad till nästa milstolpe. Spårade men inte i nuvarande roadmap.

### Drag & sortering (DRAG)

- **DRAG-01**: Drag-and-drop omsortering av widgets via react-grid-layout
- **DRAG-02**: Tangentbord-tillgänglig sortering (aria-grabbed/aria-dropeffect)
- **DRAG-03**: Per-breakpoint layout-anpassning exponerad till användare

### Widget-katalog (CAT)

- **CAT-01**: Användaren kan lägga till widgets från en katalog/registry-bläddrare

### Smarta förslag (SMART)

- **SMART-01**: Smart contextual suggestions på Översikt baserat på användarens aktivitet

## Out of Scope

Explicit utelämnat. Dokumenterat för att förhindra scope creep.

| Feature | Reason |
|---------|--------|
| Notifikations-prickar per widget | Stress för NPF/utmattnings-användare; max ett badge i nav samtidigt |
| Gamification (poäng, nivåer, leaderboards) | Kontraproduktivt för utsatt målgrupp |
| Procent-progress som dominerande KPI | Läses som "X% otillräcklig"; milstolpe-framing istället |
| Dense multi-axis data visualizations | Kognitiv överbelastning för NPF-användare |
| Comparison till andra användare | Skambaserad design, oförenligt med portal-tone |
| Mandatory wellness-loggning | Alltid "om du vill"-framing |
| Per-användare DB-flagga för rollout | Skapar två navigations-realiteter — omöjligt för konsulent-coachning |
| Egen recharts/chart-lib | Hand-rolled SVG räcker för sparklines (~160 KB sparat) |

## Traceability

Vilka faser täcker vilka requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| NAV-04 | Phase 1 | Complete |
| NAV-05 | Phase 1 | Complete |
| WIDG-01 | Phase 2 | Complete |
| WIDG-02 | Phase 2 | Complete |
| WIDG-03 | Phase 2 | Complete |
| HUB-01 | Phase 3 | Complete |
| HUB-02 | Phase 5 | Complete |
| HUB-03 | Phase 5 | Complete |
| HUB-04 | Phase 5 | Complete |
| HUB-05 | Phase 5 | Complete |
| HUB-06 | Phase 5 | Complete |
| DATA-01 | Phase 3 | Complete |
| DATA-02 | Phase 3 | Complete |
| A11Y-01 | Phase 3 | Complete |
| A11Y-02 | Phase 3 | Complete |
| A11Y-03 | Phase 3 | Complete |
| A11Y-04 | Phase 3 | Complete |
| A11Y-05 | Phase 3 | Complete |
| CUST-01 | Phase 4 | Complete |
| CUST-02 | Phase 4 | Complete |
| CUST-03 | Phase 4 | Complete |

**Coverage:**
- v1.0 requirements: 24 total
- Mapped to phases: 24 ✓
- Unmapped: 0

---
*Requirements definierade: 2026-04-28*
*Last updated: 2026-04-28 — HUB-02..04 remapped to Phase 5 (Phase 3 scope sharpened to JobsokHub only)*
