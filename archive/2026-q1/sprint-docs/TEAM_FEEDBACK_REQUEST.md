# 🔍 Team Feedback: Dashboard/Översikt-fliken

## Vad vi har byggt

Vi har skapat en ny tab-baserad struktur för dashboard med 5 flikar:

### ✅ Klart och fungerar:

| Flik | Status | Innehåll |
|------|--------|----------|
| **Översikt** | ✅ | Nästa steg-kort, statistik, 4 widgets (CV, Jobb, Välmående, Quests) |
| **Aktivitet** | ✅ | Quests-widget, streak-kort, statistik |
| **Community** | ✅ | Mock-grupper, peer support-knapp |
| **Insikter** | ✅ | AI-prognoser, rekommendationer, mönster |
| **Lärande** | ✅ | Mikro-lektioner, progress, kategorier |

### 🛠️ Tekniska beslut:
- **Inga DashboardWidget-beroenden** - alla widgets är standalone för att undvika krascher
- **Simpel komponent-switch** i Dashboard.tsx istället för nested Routes
- **Real data** från useDashboardData

---

## Frågor till teamet

### 1. Prioritering: Vad bör vi lägga till härnäst?

**A. Veckosummering på Översikt**
- Visa veckans progress
- Motiverande meddelanden
- Veckans mål

**B. Påminnelser på Aktivitet**
- Påbörjade uppgifter
- Streak-risk varningar
- Följ-upp ansökningar

**C. Journey Timeline på Aktivitet**
- Visualisering av jobbsökar-resan
- Milstolpar
- Prognoser

**D. Något annat?**
- [Fyll i förslag]

### 2. Widget-struktur

Ska vi:
- **A)** Behålla nuvarande standalone-widgets (säkrare, men duplicerad kod)
- **B)** Återgå till DashboardWidget-wrapper (mer konsekvent, men risk för krasch)
- **C)** Skapa en ny förenklad wrapper

### 3. Data-integrering

Vissa komponenter använder mock-data:
- **Community** - mock-grupper
- **Insikter** - mock-AI-prognoser
- **Lärande** - mock-lektioner

Ska vi prioritera att koppla dessa till backend?

### 4. Navigation

Nuvarande struktur:
```
/          → Översikt
/activity  → Aktivitet
/community → Community
/insights  → Insikter
/learning   → Lärande
```

Är detta intuitivt, eller vill vi ändra något?

### 5. Buggar/Problem ni ser?

Har ni sett något som inte fungerar eller ser konstigt ut?

---

## Hur ni svarar

Skriv er feedback i denna fil eller i chatten:

```markdown
**Namn/Roll:** [t.ex. UX-designer, Backend, etc.]

**Prioritering:** [A/B/C/D + motivering]

**Widget-struktur:** [A/B/C + motivering]

**Data-integrering:** [Vilka ska vi prioritera?]

**Navigation:** [Fungerar detta eller föreslå ändring]

**Buggar:** [Beskriv vad ni ser]

**Övrigt:** [Fria synpunkter]
```

---

*Senast uppdaterad: [nu]*
*Dashboard är live på: https://www.jobin.se/#/dashboard/*
