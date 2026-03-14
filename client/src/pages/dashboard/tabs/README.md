# Dashboard Flikar (Tabs)

Denna mapp innehåller alla flik-komponenter för den nya dashboard-strukturen.

## Struktur

Dashboard är nu organiserad i 5 tydliga flikar istället för en enda lång sida:

### 1. Översikt (`OverviewTab.tsx`)
- **Syfte**: Huvudöversikt och snabbinfo
- **Innehåll**:
  - Välkomstmeddelande baserat på energinivå
  - Nästa steg-widget
  - Snabb-statistik (CV-progress, sparade jobb, ansökningar, quests)
  - Widget-filter för att visa/dölja widgets
  - Huvud-widgets (CV, jobbsök, wellness, quests)
  - Veckosummering

### 2. Aktivitet (`ActivityTab.tsx`)
- **Syfte**: Allt som händer och ska hända
- **Innehåll**:
  - Påminnelser-widget (kommer snart)
  - Dagens quests
  - Streak och statistik-kort
  - Resa-timeline (JourneyTimeline)

### 3. Community (`CommunityTab.tsx`)
- **Syfte**: Peer support och socialt
- **Innehåll**:
  - Mina grupper (med online-status och progress)
  - Föreslagna grupper att gå med i
  - Peer Support chat (öppnas via knapp)

### 4. Insikter (`InsightsTab.tsx`)
- **Syfte**: AI-analys och personliga prognoser
- **Innehåll**:
  - AI-prognos (chans till intervju)
  - Statistik: dagar till intervju, bästa tid, optimal energi
  - AI-rekommendationer (expandable)
  - Personliga mönster
  - AI Assistant (alltid tillgänglig)

### 5. Lärande (`LearningTab.tsx`)
- **Syfte**: Mikro-learning och utbildning
- **Innehåll**:
  - Progress-bar för avklarade lektioner
  - Kategori-filter (Alla, CV, Intervju, Nätverk, Psykologi)
  - Lektionslista med video/artikel-ikoner
  - XP-belöningar för avklarade lektioner
  - Inbäddad videospelare för lektioner

## Teknisk Implementation

### Routing
Dashboard använder nested routing:
```
/              → OverviewTab
/activity      → ActivityTab  
/community     → CommunityTab
/insights      → InsightsTab
/learning      → LearningTab
```

### Energi-anpassning
Alla flikar respekterar användarens energinivå:
- **Låg energi**: Färre widgets, enklare gränssnitt
- **Medel energi**: Standardvy
- **Hög energi**: Fler funktioner synliga

### Animationer
- Framer Motion används för sidövergångar
- `AnimatePresence` för smootha tab-övergångar
- Stagger-effekter på listor

### Komponenter
Varje flik är självständig och kan renderas oberoende:
- Egna data-fetching hooks (useDashboardData)
- Egna states för UI-interaktioner
- Återanvändning av existerande widgets

## Filstruktur

```
client/src/pages/dashboard/
├── Dashboard.tsx          # Huvudkomponent med tab-navigation
├── OverviewTab.tsx        # Gamla översikten (kan tas bort)
└── tabs/
    ├── OverviewTab.tsx    # Ny översikt
    ├── ActivityTab.tsx    # Aktivitet & quests
    ├── CommunityTab.tsx   # Peer support
    ├── InsightsTab.tsx    # AI-analys
    ├── LearningTab.tsx    # Mikro-learning
    └── README.md          # Denna fil
```

## Framtida Förbättringar

- [ ] Spara aktiv flik i URL för bokmärken
- [ ] Lazy-loading av flikar för bättre prestanda
- [ ] Swipe-gester på mobil för att byta flik
- [ ] Badge-notifikationer på flikar (t.ex. "3 nya" på Community)
