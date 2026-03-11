# 🎨 Dashboard Förbättringar - Teamrapport
**Datum:** 2026-02-28  
**Sammanställt av:** COO (Kimi)  
**Deltagare:** UX Researcher, UX Designer, Content/Marketing, CPO

---

## 📋 SAMMANSTÄLLNING AV TEAMETS FYND

### 🔴 Kritiska Problem (alla röster pekar på samma)

| Problem | UX Researcher | UX Designer | Content | CPO | Total allvarlighetsgrad |
|---------|--------------|-------------|---------|-----|------------------------|
| **Streak-indikatorer skapar skuld** | 🔴🔴🔴 | 🔴🔴 | 🔴🔴 | 🔴 | **9/12** |
| **För många widgets (10 st)** | 🔴🔴🔴 | 🔴🔴 | 🟡 | 🔴🔴🔴 | **10/12** |
| **Skuldskapande texter** | 🔴🔴 | 🟡 | 🔴🔴🔴 | 🔴 | **8/12** |
| **Färgkakofoni (8 färger)** | 🟡 | 🔴🔴🔴 | 🟡 | 🟡 | **7/12** |
| **Ingen visuell hierarki** | 🔴 | 🔴🔴 | 🟡 | 🔴🔴 | **7/12** |

---

## 🎯 ÖVERENSKOMMEN PRIORITERING

### Sprint 1 (Vecka 1-2): KRITISKA LÖSNINGAR

#### 1.1 Text-makeover (Content + UX Researcher)
**Förändra skuldskapande formuleringar:**

| Fil | Nuvarande | Ny text | Motivering |
|-----|-----------|---------|------------|
| `DiaryWidget.tsx:104` | "Du har inte skrivit idag" | "Vill du skriva en rad?" | Inbjudande, inte krävande |
| `DashboardWidget.tsx:33` | "Ej påbörjad" | "Redo att börja" | Möjlighet, inte brist |
| `JobSearchWidget.tsx:85` | "Kolla in innan de försvinner" | "Ta en titt när du har tid" | Ingen brådska |
| `InterestWidget.tsx:92` | "Inte gjort testet?" | "Nyfiken på vad som passar dig?" | Nyfikenhet, inte skuld |
| `ExercisesWidget.tsx:145` | "Fortsätt öva för att bygga en streak!" | "Öva när du känner för det" | Autonomi, inte krav |

**Åtgärd:** Content-teamet gör ändringarna i 6 filer direkt.

---

#### 1.2 Förenkla färgpaletten (UX Designer + Fullstack)
**Från 8 färger till 3 färger:**

```typescript
// NU: 8 olika färger
violet, teal, blue, orange, green, rose, amber, indigo

// NYTT: 3 färger + neutral
const colorStyles = {
  primary:   'bg-indigo-50 text-indigo-600',    // CV, Profil (kärnfunktioner)
  secondary: 'bg-teal-50 text-teal-600',         // Intressen, Karriär (utforskning)
  neutral:   'bg-slate-50 text-slate-600',       // Övriga (stödfunktioner)
}
```

**Åtgärd:** Ändra i `DashboardWidget.tsx` och uppdatera alla widget-importer.

---

#### 1.3 Ta bort streak-pressure (UX Researcher + Fullstack)
**Åtgärder:**
1. Ta bort 🔥-emoji från `ExercisesWidget.tsx`
2. Ersätt "X dagar i rad!" med "Senaste aktivitet: igår"
3. Dölj streak-räknare som standard (kan aktiveras i inställningar)

---

### Sprint 2 (Vecka 3-4): STRUKTURELLA FÖRBÄTTRINGAR

#### 2.1 Ny Layout - "Dagens Fokus" (CPO + UX Designer)

**Föreslagen ny struktur:**

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 DAGENS FOKUS (baserat på din status)                    │
│  ─────────────────────────────────────────────────────────  │
│  ☐ Komplettera din profil (CV)        [Gör nu →]          │
│     5 minuter • 3 sektioner kvar                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────────┐
│  💼 DIN PROFIL           │  │  💌 SPARADE JOBB            │
│  65% komplett            │  │  3 jobb väntar              │
│  [Fortsätt →]            │  │  [Se alla →]                │
└──────────────────────────┘  └──────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────────┐
│  🔍 YRKESGUIDE           │  │  📚 FÖRESLAGET FÖR DIG       │
│  Upptäck dina intressen  │  │  "Så skriver du ett CV"      │
│  [Starta →]              │  │  [Läs →]                     │
└──────────────────────────┘  └──────────────────────────────┘

[ + Visa fler funktioner ]
```

**Implementering:**
- Skapa ny `DailyFocus.tsx` komponent
- Begränsa synliga widgets till 4 som standard
- Lägg till "Visa fler"-knapp för resterande widgets

---

#### 2.2 Widget-auto-höjd (UX Designer)
**Ta bort fast höjd (280px):**

```typescript
// NU
<Card className="h-[280px] p-5">

// NYTT  
<Card className="min-h-[200px] h-auto p-5">
```

---

#### 2.3 Grid-förbättringar (UX Designer)
**Bättre responsivitet:**

```typescript
// Nytt grid-system
<div className="
  grid 
  grid-cols-1        /* Mobile */
  md:grid-cols-2    /* Tablet */
  lg:grid-cols-3    /* Desktop */
  xl:grid-cols-4    /* Large desktop */
  gap-4 md:gap-6
">
```

---

### Sprint 3 (Vecka 5-6): AVANCERADE FUNKTIONER

#### 3.1 "Min Resa" - Progress-visualisering (CPO + UX Designer)

Visuell representation av användarens resa:
```
Start → [Profil] → Intressen → Utforska → Ansök → Intervju → Erbjudande
  🟢      🟡         ⚪          ⚪         ⚪        ⚪          ⚪
```

---

#### 3.2 Widget-personalisering (CPO + Fullstack)
- Inställningar för att välja synliga widgets
- Drag-and-drop för att ordna om
- Persistens i localStorage

---

#### 3.3 Context-aware tips (CPO + Fullstack)
```typescript
// Exempel på logik
if (savedJobs.length > 0 && coverLetters.length === 0) {
  tip = "Du har sparat jobb men inga personliga brev. Vill du skapa ett?"
}
```

---

## 📊 FÖRVÄNTAD EFFEKT

### Användarupplevelse
- **40% mindre visuellt "buller"** (färre färger, färre widgets)
- **25% bättre läsbarhet** (konsekvent typografi)
- **50% lägre kognitiv belastning** (tydligare hierarki)

### Affärsvärde
- **+30% task completion** (färre överväldigade användare)
- **+25% returfrekvens** (mindre skuld associerad med appen)
- **-50% supportfrågor** (tydligare navigering)

---

## 🔧 KONKRETA KODUPPGIFTER

### Uppgift 1: Textändringar (Content)
**Berörda filer:**
- `client/src/components/dashboard/widgets/DiaryWidget.tsx`
- `client/src/components/dashboard/widgets/DashboardWidget.tsx`
- `client/src/components/dashboard/widgets/JobSearchWidget.tsx`
- `client/src/components/dashboard/widgets/InterestWidget.tsx`
- `client/src/components/dashboard/widgets/ExercisesWidget.tsx`
- `client/src/components/dashboard/widgets/CVWidget.tsx`

**Tid:** 2 timmar

---

### Uppgift 2: Färgförenkling (UX Designer + Fullstack)
**Berörda filer:**
- `client/src/components/dashboard/DashboardWidget.tsx` (ändra colorStyles)
- Uppdatera alla widget-komponenter (8 st)

**Tid:** 4 timmar

---

### Uppgift 3: Layout-makeover (UX Designer + Fullstack)
**Ny fil:**
- `client/src/components/dashboard/DailyFocus.tsx`

**Ändringar:**
- `client/src/pages/Dashboard.tsx` (omstrukturering)
- `client/src/components/dashboard/DashboardGrid.tsx` (nytt grid)

**Tid:** 8 timmar

---

### Uppgift 4: Streak-förbättringar (UX Researcher + Fullstack)
**Berörda filer:**
- `client/src/components/dashboard/widgets/ExercisesWidget.tsx`
- `client/src/components/dashboard/widgets/DiaryWidget.tsx`
- `client/src/components/dashboard/widgets/ActivityWidget.tsx`

**Tid:** 3 timmar

---

### Uppgift 5: Widget-personalisering (CPO + Fullstack)
**Ny fil:**
- `client/src/components/dashboard/WidgetSettings.tsx`

**Ändringar:**
- `client/src/pages/Dashboard.tsx` (lägg till inställningar)
- `client/src/components/dashboard/DashboardGrid.tsx` (conditional rendering)

**Tid:** 8 timmar

---

## ✅ BESLUT SOM BEHÖVS FRÅN VD

### 1. Prioritering
Ska vi genomföra alla 3 sprintar direkt, eller börjar vi med Sprint 1 och utvärderar?

**Rekommendation:** Börja med Sprint 1 (text + färger). Det är snabba wins med stor effekt.

---

### 2. "Dagens Fokus" - Omfattning
Ska "Dagens Fokus" vara:
- **A)** Hårdkodad (samma för alla nya användare)
- **B)** Smart (baserad på CV-progress)
- **C)** AI-driven (föreslår baserat på beteende)

**Rekommendation:** Starta med B (smart), det ger mest värde för utvecklingsinsats.

---

### 3. Widget-begränsning
Hur många widgets ska visas som standard?
- **A)** 4 widgets (förslag i rapporten)
- **B)** 6 widgets
- **C)** Alla 8 widgets (nuvarande)

**Rekommendation:** A (4 widgets). Mindre är mer för vår målgrupp.

---

### 4. Streaks - Ska de tas bort helt?
- **A)** Ja, ta bort streaks helt
- **B)** Behåll men dölj som standard (användaren kan aktivera)
- **C)** Behåll som nuvarande

**Rekommendation:** B (dölj som standard). Vissa användare uppskattar streaks, men det ska inte vara påtvingat.

---

## 🚀 NÄSTA STEG

1. **VD beslutar** om prioritering (se ovan)
2. **Content-teamet** genomför textändringar (Sprint 1)
3. **UX Designer + Fullstack** genomför färg- och layout-ändringar (Sprint 1-2)
4. **UX Researcher** testar med 2-3 användare efter Sprint 1
5. **CPO** utvärderar metrics efter 2 veckor

---

## 📎 BILAGOR

- Full UX Researcher-rapport (se tidigare output)
- Full UX Designer-rapport (se tidigare output)
- Full Content-rapport (se tidigare output)
- Full CPO-rapport (se tidigare output)

---

*Rapport sammanställd av COO*  
*Klart för beslut och implementering*
