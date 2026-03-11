# Team-granskning: Onboarding för nya användare

## Sammanfattning av expertanalyser

### Deltagare i granskningen:
- **UX Researcher** (Långtidsarbetssökande) - Tillgänglighet & empati
- **Product Owner** - Agil utveckling & user journeys  
- **Fullstack-utvecklare** - Kodkvalitet & arkitektur
- **Business Analyst** (Arbetskonsulenten) - Arbetsmarknad & deltagarstöd

---

## 🔴 KRITISKA PROBLEM (Måste åtgärdas omedelbart)

### 1. Dubbelinmatning av namn och e-post
**Problem:** Användaren fyller i namn/e-post vid registrering, sedan igen i onboarding steg 2.

**Påverkan:** 
- Känns meningslöst och frustrerande
- Signal att "systemet inte fungerar"
- Slöseri med energi för låg energi-användare

**Åtgärd:** 
```typescript
// Hämta automatiskt från authStore istället
const { user } = useAuthStore();
// Visa: "Hej [Namn]! Din profil är kopplad till [Email]"
```

### 2. "Hur mår du idag?" - Ångestutlösande formulering
**Problem:** Frågan om energinivå skapar skuldkänslor.

**Som användare tänker man:**
> *"Om jag säger att jag har låg energi, kommer de då tycka att jag inte är redo för jobb?"*

**Åtgärd:** Byt till fokus på VAL istället för tillstånd:
```
❌ "Hur mår du idag?" / "Låg / Behöver vila"
✅ "Vilket tempo passar dig idag?" / "Utforska lugnt"
```

### 3. "10 minuter" - Skapar stress
**Problem:** Tidsuppskattning är skrämmande för personer med kronisk smärta/ångest.

**Åtgärd:** 
- Ta bort "10 minuter" helt
- Ersätt med: "Du kan pausa och fortsätta när du vill"
- Visa istället tid EFTERÅT: "Det tog 3 minuter - bra jobbat!"

### 4. CV tvingas som första steg
**Problem:** Alla skickas till CV-byggaren, men många vet inte ens vad de vill jobba med.

**Som arbetskonsulenten noterar:**
> *"CV är ett VERKTYG, inte ett MÅL. Målet är att hitta rätt jobb."

**Åtgärd:** Erbjud tre vägar:
1. **"Jag vet inte vad jag vill"** → Intresseguide (DEFAULT)
2. **"Jag behöver ett CV"** → CV-byggaren
3. **"Jag är redo söka jobb"** → Jobbsökning

### 5. Teknisk skuld - 637 rader i en fil
**Problem:** `Onboarding.tsx` är för stor, har race conditions, sparar bara i localStorage.

**Åtgärd:** Refaktorera till:
```
features/
└── onboarding/
    ├── components/
    │   ├── OnboardingModal.tsx
    │   ├── steps/
    │   │   ├── WelcomeStep.tsx
    │   │   ├── EnergyStep.tsx
    │   │   └── PathSelectionStep.tsx
    │   └── shared/
    ├── hooks/
    │   └── useOnboarding.ts
    └── services/
        └── onboardingApi.ts
```

---

## 🟡 HÖG PRIORITET (Bör åtgärdas snart)

### 6. Saknas förklaring av portalens syfte
**Inget steg förklarar:**
- Vad är Deltagarportalen?
- Är det kopplat till Arbetsförmedlingen?
- Vad kan jag göra här?
- Är det frivilligt eller obligatoriskt?

**Lösning:** Nytt steg 1:
```
"Välkommen till Deltagarportalen!"

Detta är din plattform för att hitta rätt yrke och jobb.
Du kan:
• Gör intresseguiden för att hitta yrken som passar dig
• Skapa professionellt CV med vår byggare  
• Sök tusentals jobb från Arbetsförmedlingen
• Få stöd av din arbetskonsulent

Detta är frivilligt och för DIN skull.
```

### 7. Ingen information om stöd/konsulenter
**Problem:** Användaren vet inte att hjälp finns tillgänglig.

**Lösning:** Lägg till steg eller info om:
- Din arbetskonsulent finns tillgänglig
- Support i portalen
- Det är okej att be om hjälp

### 8. Dubbla onboarding-komponenter
**Problem:** Både `Onboarding.tsx` och `OnboardingFlow.tsx` finns - förvirrande.

**Lösning:** 
- Slå ihop till EN komponent
- Markera `OnboardingFlow.tsx` som deprecated
- Använd `Onboarding.tsx` som bas men bryt ut i mindre delar

---

## 🟢 MEDEL/LÅG PRIORITET (Kan vänta)

### 9. Tillgänglighetsproblem
- Emojis utan aria-label
- Ingen fokus-fälla i modal
- Ingen live-region för celebrations

### 10. Lösenordskraven vid registrering är strikta
- 10 tecken + stor/liten + siffra + specialtecken
- Kan vara barrier för vissa användare

### 11. Demo-konto skapar problem
- Skapar nytt konto varje gång
- Kan fylla databasen med skräp

---

## 📋 KONKRET HANDLINGSPLAN

### Sprint 1: Omedelbara fixar (4-6 timmar)

| # | Åtgärd | Fil | Tid |
|---|--------|-----|-----|
| 1 | Ta bort steg 2 (dubbelinmatning) | Onboarding.tsx | 1h |
| 2 | Ändra "Hur mår du?" till "Vilket tempo?" | Onboarding.tsx | 30min |
| 3 | Ta bort "10 minuter"-text | Onboarding.tsx, OnboardingReminder | 30min |
| 4 | Fixa `window.location.href` → `useNavigate` | Onboarding.tsx | 30min |
| 5 | Lägg till null-checks för filuppladdning | Onboarding.tsx | 1h |
| 6 | Uppdatera OnboardingReminder text | Onboarding.tsx | 30min |

**Resultat:** Mindre frustrerande onboarding omedelbart.

### Sprint 2: Ny struktur (8-12 timmar)

| # | Åtgärd | Tid |
|---|--------|-----|
| 1 | Skapa nytt "Välkommen"-steg med syfte-förklaring | 2h |
| 2 | Skapa "Välj din väg"-steg med 3 alternativ | 3h |
| 3 | Lägg till "Stöd och hjälp"-steg | 1h |
| 4 | Backend: Lägg till onboarding-kolumner i profiles | 2h |
| 5 | Skapa onboardingApi.ts för backend-sync | 2h |
| 6 | Uppdatera Dashboard att läsa vald väg | 2h |

**Resultat:** Onboarding leder användaren till rätt verktyg.

### Sprint 3: Refaktorering (10-15 timmar)

| # | Åtgärd | Tid |
|---|--------|-----|
| 1 | Skapa features/onboarding/-struktur | 2h |
| 2 | Bryt ut steg till separata komponenter | 4h |
| 3 | Skapa useOnboarding-hook | 3h |
| 4 | Migrera från localStorage till backend | 3h |
| 5 | Tester | 3h |

**Resultat:** Underhållbar kod, progress synkas över enheter.

---

## 🎯 NYCKELTAL ATT MÄTA

| Mått | Nuvarande | Mål |
|------|-----------|-----|
| Onboarding completion rate | ~40% | 80% |
| Avhopp vid steg 2 | ~60% | <20% |
| Tid till första värde | 15 min | 3 min |
| Användare som väljer intresseguide först | N/A (tvingas till CV) | 50% |

---

## 💬 EXPERTCITAT

> *"CV är ett VERKTYG, inte ett MÅL. Målet är att hitta rätt jobb."*  
> — Business Analyst (Arbetskonsulenten)

> *"Om jag säger att jag har låg energi, kommer de då tycka att jag inte är redo för jobb?"*  
> — UX Researcher (Långtidsarbetssökande persona)

> *"637 rader i en fil med 8 olika localStorage-nycklar - detta är en teknisk skuld som kommer bita oss."*  
> — Fullstack-utvecklare

> *"Användaren behöver förstå värdet INNAN de investerar sin tid."*  
> — Product Owner

---

## ✅ REKOMMENDATION

**Börja med Sprint 1 omedelbart** - det är snabba vinster som eliminerar uppenbara problem utan att riskera nya buggar.

Därefter **Sprint 2** för att rikta användarna till rätt verktyg (intresseguide först för de flesta).

**Sprint 3** kan vänta tills vi har tid för större refaktorering.
