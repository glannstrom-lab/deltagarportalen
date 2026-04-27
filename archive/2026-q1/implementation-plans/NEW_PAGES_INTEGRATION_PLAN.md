# 🗂️ Integrationsplan: Nya Funktioner som Flikar

**Datum:** 2026-03-13  
**Syfte:** Integrera de 10 nya funktionerna som flikar på befintliga sidor istället för fristående sidor

---

## 📊 Översikt: Var Varje Funktion Bör Ligga

| # | Ny Funktion | Föreslagen Sida | Befintliga Flikar → Nya Flikar | Prioritet |
|---|-------------|-----------------|--------------------------------|-----------|
| 1 | 🧘 **Energi & Rutiner** | **Wellness** | Hälsa → Hälsa, **Energi**, **Rutiner** | 🔴 Hög |
| 2 | 🤝 **Nätverks-Tränaren** | **Career** | 3 flikar → +**Nätverk** (4 total) | 🔴 Hög |
| 3 | 🎯 **Arbetsanpassning** | **Career** | 4 flikar → +**Anpassning** (5 total) | 🟡 Medel |
| 4 | 🏆 **Success Stories** | **KnowledgeBase** | 7 flikar → +**Berättelser** (8 total) | 🟡 Medel |
| 5 | 🎮 **Jobbsökar-Quests** | **Dashboard** | Widget-baserat → +**Mina Quests** flik | 🟡 Medel |
| 6 | 📊 **Jobbsökar-Analys** | **JobTracker** | 1 sida → +**Analys** flik | 🔴 Hög |
| 7 | 🎓 **Kompetens-Gap 2.0** | **SkillsGapAnalysis** | Uppgradera befintlig sida | 🟡 Medel |
| 8 | 🧠 **Kognitiv Träning** | **Wellness** | 3 flikar → +**Kognitiv träning** (4 total) | 🟢 Låg |
| 9 | 🏢 **Arbetsgivar-DB** | **Career** | 5 flikar → +**Företag** (6 total) | 🟢 Låg |
| 10 | 🆘 **Crisis Support** | **Wellness** | 4 flikar → +**Akut stöd** (5 total) | 🔴 Hög |

---

## 📍 Detaljerad Integrationsplan

---

### 1. 🧘 Energi & Rutiner → **Wellness-sidan**

**Motivering:** Wellness handlar redan om välmående. Energispårning är ett naturligt komplement.

**Nuvarande struktur:**
```
/Wellness (singel sida, inga flikar)
```

**Ny struktur:**
```
/Wellness
├── 🌱 Hälsa (befintlig)
├── ⚡ Energi (NY)
│   ├── Energi-dagbok
│   ├── Aktivitets-matchning
│   └── Mönster-analys
└── 📅 Rutiner (NY)
    ├── Morgonrutiner
    ├── Jobbsökar-schema
    └── Paus-timer
```

**UI-komponenter som återanvänds:**
- Card-komponenter från befintlig Wellness
- Dagboks-komponenter från Diary
- Progress bars från Dashboard

---

### 2. 🤝 Nätverks-Tränaren → **Career-sidan**

**Motivering:** Nätverkande är en kritisk karriärfärdighet. Career är naturligt nav för yrkesrelaterade aktiviteter.

**Nuvarande struktur:**
```
/Career
├── 🔍 Utforska yrken
├── 🎯 Karriärplan
└── 📊 Kompetensanalys
```

**Ny struktur:**
```
/Career
├── 🔍 Utforska yrken
├── 🤝 Nätverk (NY)
│   ├── Min nätverks-karta
│   ├── Kontakt-prioritering
│   ├── Konversations-mallar
│   └── Uppföljnings-påminnelser
├── 🎯 Karriärplan
└── 📊 Kompetensanalys
```

**UI-komponenter som återanvänds:**
- Sök/filter från JobSearch
- Kort-komponenter från Career
- AI-chat från CoverLetter

---

### 3. 🎯 Arbetsanpassning → **Career-sidan**

**Motivering:** Arbetsanpassning handlar om att matcha individ med yrke - kärnan i Career.

**Ny struktur (bygger på #2):**
```
/Career
├── 🔍 Utforska yrken
├── 🤝 Nätverk
├── ♿ Anpassning (NY)
│   ├── Självbedömnings-verktyg
│   ├── Aktivitetsanalys
│   ├── Anpassnings-förslag
│   └── Dialog-mallar
├── 🎯 Karriärplan
└── 📊 Kompetensanalys
```

**UI-komponenter som återanvänds:**
- Formulär-komponenter från CV
- Quiz-komponenter från InterestGuide
- PDF-export från CV

---

### 4. 🏆 Success Stories → **KnowledgeBase-sidan**

**Motivering:** KnowledgeBase är portalens "innehållsnav". Inspirerande berättelser passar perfekt här.

**Nuvarande struktur:**
```
/KnowledgeBase
├── ✨ För dig
├── 🚀 Komma igång
├── 📚 Ämnen
├── ❓ Snabbhjälp
├── 🛤️ Min resa
├── 🛠️ Verktyg
└── 🔥 Trendar
```

**Ny struktur:**
```
/KnowledgeBase
├── ✨ För dig
├── 🚀 Komma igång
├── 📚 Ämnen
├── ❓ Snabbhjälp
├── 🛤️ Min resa
├── 🛠️ Verktyg
├── 🔥 Trendar
└── 💪 Berättelser (NY)
    ├── Video-intervjuer
    ├── Peer-matching
    ├── Forum/Q&A
    └── Filtrera på bakgrund/yrke
```

**UI-komponenter som återanvänds:**
- Video-spelare (ny komponent)
- Filter från JobSearch
- Kort från Career

---

### 5. 🎮 Jobbsökar-Quests → **Dashboard-sidan**

**Motivering:** Quests är en "meta-funktion" som spänner över hela portalen. Dashboard är navet.

**Nuvarande struktur:**
```
/Dashboard (widget-baserad, inga flikar)
```

**Ny struktur:**
```
/Dashboard
├── 📊 Översikt (widgets)
└── 🎯 Mina Quests (NY flik)
    ├── Dagliga uppdrag
    ├── Veckovisa utmaningar
    ├── Achievements
    ├── XP & Nivåer
    └── Streaks
```

**UI-komponenter som återanvänds:**
- Badge-komponenter från gamification
- Progress bars från Dashboard
- Kort från Exercises

---

### 6. 📊 Jobbsökar-Analys → **JobTracker-sidan**

**Motivering:** JobTracker hanterar ansökningar. Analys är naturlig förlängning av tracking.

**Nuvarande struktur:**
```
/JobTracker (singel sida)
```

**Ny struktur:**
```
/JobTracker
├── 📋 Ansökningar (befintlig)
└── 📈 Analys (NY)
    ├── Konverteringstratt
    ├── Tidsanalys
    ├── ATS-insikter
    └── Benchmark
```

**UI-komponenter som återanvänds:**
- Charts från analytics (nytt bibliotek: Recharts?)
- Filter från JobSearch
- Statistik-kort från Dashboard

---

### 7. 🎓 Kompetens-Gap 2.0 → **SkillsGapAnalysis-sidan**

**Motivering:** Uppgradera befintlig sida istället för ny flik.

**Nuvarande struktur:**
```
/SkillsGapAnalysis (singel sida, grundläggande)
```

**Ny struktur (samma sida, förbättrad):**
```
/SkillsGapAnalysis
├── 🔍 Gap-analys (förbättrad)
│   ├── Auto-scan CV vs jobb
│   └── Kompetens-karta
├── 🎓 Utbildningsförslag (NY)
│   ├── Komvux-kurser
│   ├── Online-kurser
│   └── Certifieringar
└── 📋 Handlingsplan (NY)
    ├── Tidsplan
    ├── Finansierings-guide
    └── Portfolio-guide
```

**UI-komponenter som återanvänds:**
- Formulär från CV
- Kort från KnowledgeBase
- AI-integration från CoverLetter

---

### 8. 🧠 Kognitiv Träning → **Wellness-sidan**

**Motivering:** Kognitiv hälsa är en del av välmående. Passar med övriga Wellness-flikar.

**Ny struktur (bygger på #1):**
```
/Wellness
├── 🌱 Hälsa
├── ⚡ Energi
├── 📅 Rutiner
└── 🧠 Kognitiv träning (NY)
    ├── Minnesträning
    ├── Koncentrationsövningar
    ├── Arbetsmiljö-simulering
    └── Återgångs-plan
```

**UI-komponenter som återanvänds:**
- Övnings-komponenter från Exercises
- Timer från wellness
- Progress tracking från Dashboard

---

### 9. 🏢 Arbetsgivar-DB → **Career-sidan**

**Motivering:** Företag är kopplade till karriärval. Career är naturligt nav.

**Ny struktur (bygger på #2, #3):**
```
/Career
├── 🔍 Utforska yrken
├── 🤝 Nätverk
├── ♿ Anpassning
├── 🏢 Företag (NY)
│   ├── Arbetsgivar-profiler
│   ├── Rekryterings-insikter
│   ├── Spara & Följ
│   └── Användar-recensioner
├── 🎯 Karriärplan
└── 📊 Kompetensanalys
```

**UI-komponenter som återanvänds:**
- Sök från JobSearch
- Kort från Career
- Filter från KnowledgeBase

---

### 10. 🆘 Crisis Support → **Wellness-sidan**

**Motivering:** Akut stöd hör till välmående. Viktigt att ha lättillgängligt.

**Ny struktur (bygger på #1, #8):**
```
/Wellness
├── 🌱 Hälsa
├── ⚡ Energi
├── 📅 Rutiner
├── 🧠 Kognitiv träning
└── 🆘 Akut stöd (NY)
    ├── Ångest-reduktion
    ├── Krisnummer
    ├── Chat-funktion
    └── Dela med konsulent
```

**UI-komponenter som återanvänds:**
- Modal från befintliga komponenter
- Emergency banner (redan i TopBar)
- Chat-komponent (ny)

---

## 🗺️ Visualisering av Alla Sidor med Nya Flikar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DELTAGARPORTALEN                                  │
│                        (Efter Integration)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🏠 DASHBOARD                    📄 CV                       📧 PERSONLIGT BREV  │
│  ├─ Översikt (widgets)           ├─ Skapa CV                 ├─ Skriv brev    │
│  └─ 🎯 Mina Quests (NY)          ├─ Mina CV                   ├─ Mina brev    │
│                                  ├─ Mallar                   ├─ Ansökningar  │
│  🔍 JOBSÖKNING                   ├─ ATS-analys                ├─ Mallar       │
│  ├─ Sök jobb                     └─ CV-tips                  └─ Statistik    │
│  ├─ 📈 Analys (NY)                                                        │
│  └─ Sparade jobb               💼 KARRIÄR                      📊 KUNSKAPSBANK  │
│                                ├─ 🔍 Utforska yrken          ├─ För dig      │
│  📅 DAGBOK                     ├─ 🤝 Nätverk (NY)            ├─ Komma igång  │
│  ├─ Kalender                   ├─ ♿ Anpassning (NY)         ├─ Ämnen        │
│  ├─ Händelser                  ├─ 🏢 Företag (NY)            ├─ Snabbhjälp   │
│  └─ Uppgifter                  ├─ 🎯 Karriärplan             ├─ Min resa     │
│                                ├─ 📊 Kompetensanalys         ├─ Verktyg      │
│  🏋️ ÖVNINGAR                   └─ 🎓 Skills Gap             ├─ Trendar      │
│  ├─ Övningslista                                             └─ 💪 Berättelser│
│  └─ Kategorier                                                              │
│                                                                             │
│  ❤️ WELLNESS                                                                 │
│  ├─ 🌱 Hälsa                                                                │
│  ├─ ⚡ Energi (NY)                                                           │
│  ├─ 📅 Rutiner (NY)                                                          │
│  ├─ 🧠 Kognitiv träning (NY)                                                 │
│  └─ 🆘 Akut stöd (NY)                                                        │
│                                                                             │
│  👤 PROFIL                                                                  │
│  ├─ Min profil                                                             │
│  └─ Inställningar                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Tekniska Överväganden

### Återanvändning av Komponenter

| Komponent | Används på | Återanvänds i |
|-----------|-----------|---------------|
| `DashboardWidget` | Dashboard | Wellness-flikar, JobTracker-Analys |
| `ProgressBar` | CV, Exercises | Energi-tracker, Quests |
| `Card` | Alla sidor | Alla nya flikar |
| `FilterSheet` | JobSearch | Arbetsgivar-DB, Success Stories |
| `AIAssistant` | CoverLetter | Nätverks-Tränaren |
| `QuestionCard` | InterestGuide | Arbetsanpassning, Kognitiv träning |
| `VideoPlayer` | - (ny) | Success Stories |
| `Chart` | - (ny) | Jobbsökar-Analys |

### Nya Dependencies som Kan Behövas

```json
{
  "charts": "recharts",
  "video": "react-player",
  "gamification": "canvas-confetti",
  "calendar-heatmap": "react-calendar-heatmap"
}
```

### Databas-Schema-Utökningar

```sql
-- Energi-logg
CREATE TABLE energy_logs (
  user_id UUID,
  date DATE,
  morning_level INT,
  afternoon_level INT,
  evening_level INT,
  activities JSONB
);

-- Nätverks-kontakter
CREATE TABLE network_contacts (
  user_id UUID,
  name TEXT,
  relationship TEXT,
  last_contact DATE,
  notes TEXT,
  priority INT
);

-- Quests-framsteg
CREATE TABLE quest_progress (
  user_id UUID,
  quest_id TEXT,
  completed BOOLEAN,
  completed_at TIMESTAMP,
  xp_earned INT
);

-- Arbetsgivar-favoriter
CREATE TABLE company_follows (
  user_id UUID,
  company_id UUID,
  followed_at TIMESTAMP,
  notes TEXT
);
```

---

## 📅 Implementeringsordning

### Fas 1: Wellness-utökning (2-3 veckor)
1. Skapa flik-system för Wellness
2. **Energi & Rutiner**-flik
3. **Akut stöd**-flik (högsta prioritet etiskt)

### Fas 2: Career-utökning (3-4 veckor)
1. **Nätverks-Tränaren**-flik
2. **Arbetsanpassning**-flik

### Fas 3: Analys & Insights (2-3 veckor)
1. JobTracker **Analys**-flik
2. Uppgradera SkillsGapAnalysis

### Fas 4: Community & Gamification (3-4 veckor)
1. KnowledgeBase **Berättelser**-flik
2. Dashboard **Quests**-flik

### Fas 5: Avancerade funktioner (4+ veckor)
1. Wellness **Kognitiv träning**-flik
2. Career **Företag**-flik

---

## ✅ Checklista per Flik

### Energi & Rutiner
- [ ] EnergyLog-komponent
- [ ] ActivityMatcher-komponent
- [ ] PatternChart (heatmap)
- [ ] RoutineBuilder

### Nätverks-Tränaren
- [ ] NetworkMap (visualisering)
- [ ] ContactPriority-lista
- [ ] MessageTemplates
- [ ] FollowUpReminders

### Crisis Support
- [ ] BreathingExercise (interaktiv)
- [ ] EmergencyContacts
- [ ] ChatWidget
- [ ] "Dela med konsulent"-knapp

---

*Planen säkerställer att nya funktioner integreras naturligt i befintlig struktur utan att skapa navigationskaos.*
