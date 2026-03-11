# Fas 1 - Team Briefing
## Quick Wins: 3 Integrationer på 4 veckor

---

## 🎯 Översikt

Fas 1 fokuserar på de snabbaste vinsterna som ger mest värde för deltagarna. Tre tydliga features som minskar tiden från jobbhittat till ansökan.

**Tidsram:** 4 veckor  
**Budget:** ~60 000 kr  
**Mål:** 70 min → 30 min per ansökan

---

## 📋 De 3 Featuresna

### 1. "Skapa Ansökan"-flöde 
*Vecka 1-2*

**Vad:** Knapp på varje jobbkort som öppnar en modal för att skapa hela ansökan.

**Flöde:**
```
Jobbkort → "Skapa ansökan" → Modal med:
  1. CV-optimering (visa matchning %)
  2. Personligt brev (AI-generera)
  3. Jobbtracker (auto-logga)
→ Klar! Allt sparat på en gång.
```

**Tekniskt:**
- Ny komponent: `CreateApplicationModal.tsx`
- Ny API-endpoint: `POST /api/workflow/create-application`
- Modifiera: `JobCard.tsx`, `JobSearch.tsx`

---

### 2. Dashboard "Nästa Steg"
*Vecka 2-3*

**Vad:** Smart widget som visar exakt vad deltagaren bör göra härnäst.

**Scenarier:**
| Om du har... | Visa detta |
|--------------|-----------|
| Inget CV | "Skapa ditt första CV" |
| CV men inga sparade jobb | "Sök jobb - 12 nya idag" |
| Sparade jobb utan ansökan | "Skapa ansökan för [Jobb X]" |
| Aktivt sökande | "Fortsätt momentumet" |

**Tekniskt:**
- Ny komponent: `NextStepWidget.tsx`
- Ny hook: `useNextStep.ts`
- Logik för att avgöra nästa steg

---

### 3. Kontextuella Quick Actions
*Vecka 3-4*

**Vad:** Snabbknappar på rätt ställe vid rätt tid.

**Exempel:**
- Efter att CV sparats: "Sök jobb med detta CV"
- I jobbtracker: "Skriv personligt brev för detta jobb"
- I kunskapsbanken: "Tillbaka till jobbsökning"

**Tekniskt:**
- Ny komponent: `QuickActionBanner.tsx`
- Modifiera: `CVBuilder.tsx`, `JobTracker.tsx`

---

## 📁 Nya Filer att Skapa

```
client/src/
├── components/workflow/
│   ├── CreateApplicationModal.tsx
│   ├── ApplicationStepper.tsx
│   ├── NextStepWidget.tsx
│   └── QuickActionBanner.tsx
├── hooks/
│   └── useNextStep.ts
├── services/
│   └── workflowApi.ts
└── lib/
    └── workflowLogic.ts
```

## 📝 Modifierade Filer

```
client/src/
├── pages/
│   ├── JobSearch.tsx (lägg till action-knappar)
│   ├── Dashboard.tsx (lägg till next step widget)
│   ├── CVBuilder.tsx (lägg till quick actions)
│   └── JobTracker.tsx (lägg till quick actions)
└── components/job-search/
    └── JobCard.tsx (lägg till "Skapa ansökan"-knapp)
```

---

## 🔄 Veckoplanering

### Vecka 1: "Skapa Ansökan"-grund
- **Måndag-Tisdag:** Skapa modal-komponenten
- **Onsdag-Torsdag:** Lägg till knappar i jobbsökningen
- **Fredag:** Bygg API-endpoint

### Vecka 2: Dashboard-widget
- **Måndag-Tisdag:** Logik för nästa steg
- **Onsdag-Torsdag:** Bygga widget-komponenten
- **Fredag:** Integrera i Dashboard

### Vecka 3: Quick Actions
- **Måndag-Tisdag:** QuickActionBanner
- **Onsdag-Torsdag:** Placera på rätt ställen
- **Fredag:** UI/UX-polish

### Vecka 4: Test & Deploy
- **Måndag-Tisdag:** Testning
- **Onsdag:** Användartester
- **Torsdag:** Buggfixar
- **Fredag:** Deploy!

---

## ✅ Success Metrics

Efter Fas 1 ska vi mäta:

| Metric | Före | Mål | Efter |
|--------|------|-----|-------|
| Tid per ansökan | 70 min | 30 min | ? |
| Sidbyten per ansökan | 8+ | 3-4 | ? |
| Användning av tracker | Baseline | +50% | ? |
| Användarnöjdhet | ? | 4/5 | ? |

---

## 🚀 Nästa Steg

1. **Teamet:** Granska specifikationen (`FAS1_IMPLEMENTATION_SPEC.md`)
2. **Tech Lead:** Sätt upp utvecklingsmiljö för nya komponenter
3. **Designer:** Skapa high-fidelity mockups för modalen
4. **Product Owner:** Prioritera om något behöver justeras

**Startdatum:** Nästa måndag (vecka 1)

---

**Frågor?** Se detaljerad specifikation i `FAS1_IMPLEMENTATION_SPEC.md`
