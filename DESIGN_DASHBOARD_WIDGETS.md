# 🎨 Dashboard Widget Design

Detta dokument beskriver den nya widget-baserade dashboard-designen för Deltagarportalen.

---

## 📐 Design-filosofi

Dashboarden är designad med fokus på:

1. **Likstora kort** - Alla funktioner får lika mycket visuell vikt
2. **Tydlig hierarki** - Ikon → Titel → Status → Action
3. **Färgkodning** - Varje sida har en unik färg för snabb igenkänning
4. **Tillgänglighet** - WCAG 2.1 AA-kompliant

---

## 🧩 Komponenter

### DashboardWidget

Huvudkomponenten för varje widget-kort.

```tsx
import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { FileText } from 'lucide-react'

<DashboardWidget
  title="Mitt CV"
  icon={FileText}
  color="violet"
  to="/cv"
  statusText="CV 70% komplett"
  statusDescription="Ditt CV ser bra ut!"
  showProgress={true}
  progressValue={70}
  progressLabel="70% optimerat"
  ctaText="Uppdatera CV"
/>
```

#### Props

| Prop | Typ | Beskrivning |
|------|-----|-------------|
| `title` | `string` | Widget-titel |
| `icon` | `LucideIcon` | Ikon från lucide-react |
| `color` | `WidgetColor` | Färgschema (se nedan) |
| `to` | `string` | Router-länk |
| `statusText` | `string` | Huvudstatus (1 rad) |
| `statusDescription` | `string` | Sekundär text (valfri) |
| `showProgress` | `boolean` | Visa progress-bar |
| `progressValue` | `number` | Progress 0-100 |
| `progressLabel` | `string` | Text under progress |
| `ctaText` | `string` | Knapp-text |
| `badge` | `string` | Badge i hörnet |

### Färger

| Färg | Användning | Hex |
|------|------------|-----|
| `violet` | CV | `#7c3aed` |
| `teal` | Intresseguide | `#0d9488` |
| `blue` | Jobbsök | `#3b82f6` |
| `orange` | Ansökningar | `#f97316` |
| `emerald` | Brev | `#10b981` |
| `amber` | Kunskapsbank | `#f59e0b` |
| `pink` | Karriär | `#ec4899` |
| `purple` | Kalender | `#8b5cf6` |
| `rose` | Välmående | `#f43f5e` |
| `mint` | Övningar | `#14b8a6` |

---

## 📱 Responsivt beteende

### Grid-layout

| Breakpoint | Kolumner | Kort-höjd | Gap |
|------------|----------|-----------|-----|
| < 360px | 2 | 170px | 12px |
| 360-639px | 2 | 180px | 16px |
| 640-1023px | 3 | 200px | 20px |
| 1024-1279px | 4 | 220px | 20px |
| ≥ 1280px | 4 | 220px | 20px |

### Touch-anpassningar

- Klick-ytor minst 44px (WCAG 2.5.5)
- Hover-effekter inaktiverade på touch
- Aktiv-skala (0.98) vid tryck

---

## ♿ Tillgänglighet

### Tangentbordsnavigering

- Alla widgets är fokuserbara
- `Tab` navigerar mellan widgets
- `Enter` aktiverar länken
- Tydlig fokus-indikator (teal ring)

### Screen readers

- `aria-label` på varje widget
- `aria-valuenow` på progress bars
- `role="progressbar"` för progress

### Visuellt

- Kontrast minst 4.5:1 för text
- Ikon-kontrast minst 3:1
- Färg används inte som enda indikator

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Alla animationer inaktiverade */
}
```

---

## 🚀 Implementation

### 1. Installera komponenten

Komponenten finns på:
- `client/src/components/dashboard/DashboardWidget.tsx`
- `client/src/pages/DashboardNew.tsx`

### 2. Uppdatera router (valfritt)

För att aktivera nya dashboarden:

```tsx
// client/src/App.tsx
import DashboardNew from './pages/DashboardNew'

// Byt ut:
<Route index element={<Dashboard />} />

// Till:
<Route index element={<DashboardNew />} />
```

### 3. Anpassa data-hämtning

Widgeten hämtar automatiskt data från:
- `cvApi` - CV-status och progress
- `activityApi` - Aktiviteter och streaks
- `savedJobsApi` - Sparade jobb
- `coverLetterApi` - Personliga brev

### 4. Lägg till nya widgets

```tsx
<DashboardWidget
  title="Ny Funktion"
  icon={NewIcon}
  color="violet"
  to="/new-feature"
  statusText="Beskrivning"
  ctaText="Kom igång"
/>
```

---

## 🎯 Bästa praxis

### Status-text

- Håll det kort (max 40 tecken)
- Använd konkreta siffror
- Var positiv och uppmuntrande

**Bra:**
- "CV 70% komplett"
- "3 yrken matchar"
- "5 aktiva ansökningar"

**Undvik:**
- "Ditt CV behöver arbete"
- "Du har inte gjort klart quizet"

### CTA-knappar

- Verb först: "Skapa", "Uppdatera", "Fortsätt"
- Konsekvent: Samma action = samma text
- Tydlig: Användaren ska veta vad som händer

### Progress bars

- Använd bara för verklig progress
- Visa alltid procent eller bråk
- Animera smidigt (500ms ease-out)

---

## 📊 Widget-data

Varje widget hämtar specifik data:

### CV
- `exists`: Har användaren ett CV?
- `progress`: ATS-score (0-100)
- `lastUpdated`: Senaste ändring

### Intresseguide
- `hasResult`: Har användaren gjort quizet?
- `progress`: Quiz-framsteg
- `matches`: Antal matchande yrken

### Jobbsök
- `savedJobsCount`: Antal sparade jobb
- `newJobsToday`: Nya jobb idag

### Ansökningar
- `activeApplications`: Antal aktiva
- `recentStatus`: Senaste status

### Brev
- `count`: Antal sparade brev
- `lastCreated`: Senast skapat

### Kunskapsbank
- `articlesRead`: Lästa artiklar
- `totalArticles`: Totalt tillgängliga

### Välmående
- `streakDays`: Antal dagar i rad
- `lastMood`: Senaste humör

### Övningar
- `completedThisWeek`: Klara denna vecka
- `weeklyGoal`: Veckans mål

---

## 🔄 Framtida förbättringar

- [ ] Drag-and-drop för att ordna om widgets
- [ ] Anpassningsbar storlek (small/medium/large)
- [ ] Widget-inställningar (dölj/visa)
- [ ] Real-time uppdateringar via WebSocket
- [ ] Personalisering baserat på användarbeteende

---

*Senast uppdaterad: 2026-02-28*
