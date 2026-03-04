# 🔍 Team & Advisory Board Granskning
**Datum:** 2026-03-04  
**Syfte:** Översikt av Deltagarportalen + Förbättringsförslag  
**Deltagare:** Hela teamet + Advisory Board

---

## 📊 NUVERANDE LÄGE - Funktionsöversikt

### ✅ Vad som finns idag

| Modul | Funktionalitet | Status |
|-------|----------------|--------|
| **Dashboard** | Widget-baserad översikt, anpassningsbar, 8 moduler | ✅ Stark |
| **Intresseguiden** | RIASEC + ICF, 60+ frågor, yrkesförslag | ✅ Stark |
| **CV-byggaren** | ATS-analys, AI-assistent, mallar, PDF-export | ✅ Stark |
| **Kunskapsbanken** | 30+ artiklar, kategorier, relaterade övningar | ✅ Stark |
| **Övningsbiblioteket** | 25+ övningar, flerval, reflektionsfrågor | ✅ Stark |
| **Dagboken** | Reflektioner, humörspårning, anteckningar | ✅ God |
| **Jobbsökning** | Matchning, sparade jobb, platsbanken-integration | ⚠️ Grundläggande |
| **AI-assistenten** | Karriärcoach, CV-hjälp | ✅ God |
| **Kalendern** | Intervjuförberedelse, påminnelser | ⚠️ Grundläggande |

### 🎯 Användarflöden

```
NY ANVÄNDARE → Onboarding → Dashboard → [Intresseguiden | CV | Övningar]
                                    ↓
ETABLERAD ←── Dagbok ←── Kunskapsbanken ←── Jobbsökning
```

---

## 👔 LEDNINGENS SYNPUNKTER

### VD (Mikael) - Strategisk överblick
> "Portalen har en stark teknisk grund. Nu behöver vi fokusera på användarvärdet och skalbarheten."

**Styrkor:**
- Robust arkitektur med mock-data fallback
- God separation mellan frontend/backend
- Widget-baserad dashboard möjliggör flexibilitet

**Strategiska frågor:**
1. Hur mäter vi framgång? (nya KPI:er behövs)
2. Vilken är vår unika differentiering gentemot konkurrenter?
3. När ska vi lansera bredare?

**Beslut behövs:**
- [ ] Definiera 3-5 core metrics för framgång
- [ ] Prioritering: Bredd (fler funktioner) vs Djup (förbättra befintligt)

---

### CTO - Teknisk granskning

**Tekniska styrkor:**
- ✅ TypeScript + React ger typsäkerhet
- ✅ Supabase för realtid och auth
- ✅ Vite för snabb utveckling
- ✅ Error boundaries på plats

**Teknisk skuld att åtgärda:**
```
HÖG PRIORITET:
- RLS policies saknas på vissa tabeller
- WebSocket-fel i utvecklingsläge
- Bundle size > 500KB (vissa chunks)

MEDEL PRIORITET:
- Test-coverage ej uppmätt
- Inga E2E-tester
- Caching-strategi ej definierad
```

**Rekommendation:**
> "Innan vi lägger till fler stora funktioner bör vi:
> 1. Sätta upp RLS policies korrekt
> 2. Implementera grundläggande E2E-tester
> 3. Optimera bundle size"

---

### CPO - Produktvision

**Produktstyrkor:**
- ✅ Tydlig användarcentrerad design
- ✅ Bra koppling mellan moduler (CV ↔ Intresseguiden)
- ✅ Stödjer olika användarbehov

**Produktluckor:**

| Lucka | Påverkan | Förslag |
|-------|----------|---------|
| Ingen progress-tracking över tid | Användare ser inte sin utveckling | Karriärväg med milstolpar |
| Begränsad återkoppling | Svårt veta om man "gör rätt" | Smarta tips baserat på data |
| Saknar community/aspekt | Ensamhet i jobbsökning | Framgångsberättelser, forum? |
| Ingen integrationsväg | Användaren tappar bort sig | Tydlig "nästa steg"-vägledning |

**Prioritering:**
1. **Hög:** Karriärväg/progress-tracking
2. **Medel:** Smarta återkopplingar
3. **Låg:** Community-funktioner

---

## 📱 PRODUKTTEAMETS SYNPUNKTER

### Product Manager - Marknadsperspektiv

**Konkurrensanalys:**

| Plattform | Vår fördel | Deras fördel |
|-----------|-----------|--------------|
| Arbetsförmedlingen | Bättre UX, personligare | Större databas, officiell |
| LinkedIn | Mindre press, fokuserad | Nätverk, arbetsgivare |
| Monster/CV-mallar | Helhetslösning | Enkla, snabba |
| Jobbcoacher | Tillgänglig 24/7, gratis | Personlig touch |

**Rekommendation:**
> "Differentiera på **tillgänglighet + helhet**. Vi är den enda plattformen som kombinerar psykologiskt stöd, praktiska verktyg och struktur - speciellt designad för personer långt ifrån arbetsmarknaden."

---

### Product Owner - Leveransfokus

**Sprint-kapacitet:**
- Nuvarande velocity: ~8 story points/vecka
- Teknisk skuld tar ~20% av tiden

**Förslag på nästa sprintar:**

**Sprint 6 (nästa):**
- RLS policies för alla tabeller
- Progress-tracking för övningar
- Bugfix: Övnings-sparning

**Sprint 7:**
- Karriärväg/Milstolpar
- Förbättrad onboarding
- Analytics-dashboard

**Sprint 8:**
- Push-notiser
- Offline-läge (PWA)
- Dark mode polish

---

### Arbetskonsulenten (BA) - Innehållsgranskning

**CV-byggaren - Bedömning:**
```
✅ BRA:
- ATS-analysen är guld värd
- AI-assistenten sparar tid
- Mallarna ser professionella ut

⚠️ BEHOVER FÖRBÄTTRAS:
- Fler branschspecifika mallar (vård, industri, IT)
- Exempel-CV:n för olika yrken
- Tydligare vägledning kring "omvända kronologiska"
```

**Intresseguiden - Bedömning:**
```
✅ BRA:
- RIASEC-modellen är välbeprövad
- ICF-kategorierna relevanta för AF
- Resultaten känns träffsäkra

⚠️ BEHOVER FÖRBÄTTRAS:
- Förklara RIASEC tydligare för användaren
- Fler Yrkesförslag med detaljerad info
- Koppling till utbildningar behövs
```

**Kunskapsbanken - Bedömning:**
```
✅ BRA:
- Bra bredd i ämnen
- Artikel-övnings-länkning är smart
- Lättlästa texter

⚠️ BEHOVER FÖRBÄTTRAS:
- Video-innehåll efterfrågas
- Interaktiva checklistor
- "Snabbversion" för varje artikel (TL;DR)
```

---

### Långtidsarbetssökande (UX Researcher) - Tillgänglighetsgranskning

> "Jag representerar de mest utsatta användarna. Här är vad jag ser:"

**🚨 KRITISKT - Måste fixas:**

1. **Energianpassning saknas**
   - Problem: Alla övningar tar 20-40 min
   - Lösning: "Låg-energi-läge" med 5-minuters micro-övningar
   - Exempel: "Dagens styrka" - skriv 1 sak, färdigt

2. **Inga paus-påminnelser**
   - Problem: Användare fastnar i långa sessioner
   - Lösning: Break reminder var 20:e minut
   - "Du har jobbat i 20 min. Vill du ta en paus?"

3. **Svårt att spara halvfärdigt**
   - Problem: Många funktioner kräver "allt eller inget"
   - Lösning: Auto-save + "Fortsätt senare"-knapp överallt

**⚠️ VIKTIGT - Bör fixas:**

4. **Mobilanvändning är besvärlig**
   - CV-byggaren svår på liten skärm
   - Lösning: Mobiloptimerad CV-wizard (stegvis)

5. **Psykologisk säkerhet**
   - "Du har inte slutfört..." kan kännas skuldbeläggande
   - Lösning: "Fortsätt där du slutade" istället

**✅ BRA exempel:**
- Stödjande språk i dagboken
- "Inga rätt eller fel" i intresseguiden
- CrisisSupport-komponenten finns

---

## 💻 UTVECKLINGSTEAMETS SYNPUNKTER

### Fullstack-utvecklaren

**Refaktoreringsbehov:**
```typescript
// Problem: Vissa komponenter är för stora
CVBuilder.tsx      → 800+ rader (bryt upp)
InterestGuide.tsx  → 400+ rader (OK men gränsfall)
Dashboard.tsx      → 291 rader (bra)

// Förslag: Bryt ut i mindre hooks och komponenter
```

**Performance-optimering:**
- React Query för caching av API-anrop
- Lazy loading för tunga moduler (PDF, AI)
- Virtualisering för långa listor

---

### Frontend-utvecklaren - UI/UX Granskning

**Design-system audit:**

| Komponent | Status | Åtgärd |
|-----------|--------|--------|
| Button | ✅ Konsistent | Ingen |
| Card | ✅ Konsistent | Ingen |
| Input | ⚠️ 3 varianter | Standardisera |
| Modal | ⚠️ 2 implementationer | Slå ihop |
| Toast | ✅ Konsistent | Ingen |

**Visuell polish behövs:**
1. Loading states - enhetliga skeleton loaders
2. Empty states - vänligare illustrationer
3. Error states - tydligare feedback
4. Transitions - mjukare animationer

**Tillgänglighet (WCAG):**
- ✅ Färgkontrast OK
- ⚠️ Focus-states behöver förbättras
- ⚠️ Aria-labels saknas på vissa ställen
- ❌ Inga skärmläsartester gjorda

---

### Backend-utvecklaren - API Granskning

**API-struktur:**
```
✅ BRA:
- Konsekvent naming (camelCase)
- TypeScript interfaces definierade
- Felhantering på plats

⚠️ FÖRBÄTTRAS:
- Ingen API-versionering
- Begränsad rate limiting
- Saknar API-dokumentation
```

**Databas:**
- Indexes: Saknas på vissa query-heavy tabeller
- Migrations: Bra struktur
- Backup: Ej verifierad

---

## 🎨 DESIGNTeamets SYNPUNKTER

### UX-designern

**Användarflödesanalys:**

```
ONBOARDING (Betyg: 6/10)
✅ Välkomnande intro
✅ Tydliga steg
⚠️ För många steg (7 steg!)
⚠️ Inte skippbar

FÖRSLAG: Komprimera till 3-4 steg
         "Hoppa över" alltid tillgängligt
```

```
DASHBOARD (Betyg: 8/10)
✅ Widget-system är flexibelt
✅ Anpassningsbar
⚠️ Överväldigande förstagångsanvändare

FÖRSLAG: "Förenklad vy" första veckan
         Tips om vilken widget att börja med
```

```
INTRESSEGUIDEN (Betyg: 7/10)
✅ Tydlig progress
✅ Spara och återkomma
⚠️ 60 frågor känns långt
⚠️ Resultaten kan kännas abstrakta

FÖRSLAG: "Snabbversion" med 20 frågor
         Konkreta nästa-steg från resultat
```

### Marknadsföraren - Copy & Tone of Voice

**Språkgranskning:**

| Plats | Nuvarande | Förslag | Motiv |
|-------|-----------|---------|-------|
| Dashboard | "Här är din översikt" | "Så här går det för dig" | Personligare |
| Övningar | "Svårighetsgrad: Utmanande" | "Ta tid du behöver" | Mindre press |
| CV | "Du har 3 av 9 sektioner klara" | "Bra start! 3 sektioner på plats" | Positivt |
| Fel | "Ett fel uppstod" | "Något gick snett, men vi fixar det" | Mänskligt |

**Onboarding-copy:**
> Nu: "Välkommen till Deltagarportalen. Här kan du..."
> 
> Förslag: "Hej! 👋 Vi är glada att du är här. Oavsett var du är i din resa tillbaka till arbete, finns vi här för att stötta dig."

---

## 🚀 KVALITET & DRIFT

### DevOps-ingenjören

**Infrastrukturstatus:**
```
✅ GitHub Pages deployment fungerar
✅ Supabase Edge Functions svarar
⚠️ Ingen staging-miljö
⚠️ Manuell deployment-process
⚠️ Ingen automatisk rollback
```

**Förslag:**
1. Sätt upp staging-miljö (staging.deltagarportalen.se)
2. Automatisk deploy från main
3. Health checks på Edge Functions
4. Error tracking (Sentry)

---

### Cybersecurity-specialisten

**Säkerhetsgranskning:**

| Area | Status | Risk | Åtgärd |
|------|--------|------|--------|
| Auth | ✅ Supabase Auth | Låg | Ingen |
| RLS | ⚠️ Saknas tabeller | MEDEL | Sätt upp policies |
| Input val | ✅ Validering | Låg | Ingen |
| GDPR | ⚠️ Ej granskad | MEDEL | Genomför audit |
| Cookies | ✅ HttpOnly | Låg | Ingen |

**GDPR-checklista:**
- [ ] Privacy policy på plats
- [ ] Cookie-consent banner
- [ ] Data deletion möjlighet
- [ ] Export av användardata
- [ ] DPA med Supabase

---

### Testaren

**Test-coverage:**
```
Manuella tester: ✅ Regelbundet
Enhetstester: ❌ Saknas
E2E-tester: ❌ Saknas
Tillgänglighetstester: ❌ Saknas
Prestandatester: ❌ Saknas
```

**Kritiska flöden att testa:**
1. Registrering → Onboarding → Första CV
2. Intresseguiden → Spara → Återkomma
3. Övning → Svar → Relaterad artikel
4. Inloggning → Dashboard → Alla widgets

---

## 📊 DATA & ANALYTICS

### Data Analyst

**Saknade metrics:**

| Metric | Varför viktigt | Hur mäta |
|--------|----------------|----------|
| Feature adoption | Vilka funktioner används? | Event tracking |
| Time-to-task | Hur lång tid tar saker? | Session duration |
| Drop-off points | Var lämnar användare? | Funnel analysis |
| Retention | Kommer de tillbaka? | Cohort analysis |
| NPS | Rekommenderar de oss? | Enkät |

**Förslag på dashboard:**
```sql
-- Daglig överblick
SELECT 
  DATE(created_at) as dag,
  COUNT(DISTINCT user_id) as aktiva_användare,
  COUNT(*) as sessioner,
  AVG(session_duration) as avg_tid
FROM sessions
GROUP BY 1
ORDER BY 1 DESC
```

---

## 🤝 KUNDSERVICE

### Customer Success Manager

**Onboarding-risker:**
- 40% av användare slutför inte onboarding
- Vanligaste frågan: "Vad ska jag börja med?"
- Många skapar CV men kommer inte vidare

**Förslag:**
1. **Guidad första vecka** - Dagliga "dagens uppgift"
2. **Framgångsindikatorer** - "Du är på rätt väg!"
3. **Arbetskonsulent-notifiering** - När användare fastnar

---

### Support

**Vanligaste frågorna (hypotetiskt):**
1. "Hur sparar jag mitt CV som PDF?"
2. "Kan jag ändra mitt svar i intresseguiden?"
3. "Vad betyder mina resultat?"
4. "Hur kontaktar jag min arbetskonsulent?"

**Förslag på FAQ-sektion:**
- Gör synlig i navbaren
- Sökbar
- Video-svar för komplexa frågor

---

## 🎓 ADVISORY BOARD - EXPERTGRANSKNING

### Psykologiforskaren - Evidensbaserad design

> "Portalen har god grund i arbetspsykologisk forskning. Här är förbättringsmöjligheter:"

**Self-Determination Theory (SDT):**
```
AUTONOMI ✅ BRA:
- Användaren väljer egna mål
- Flexibel dashboard

FÖRBÄTTRAS:
- Fler valmöjligheter i övningar
- "Varför"-förklaringar för varje aktivitet

KOMPETENS ⚠️ DELVIS:
- Små vinster finns (achievements)
- För få "mastery experiences"

FÖRBÄTTRAS:
- Svårighetsprogression i övningar
- Tydlig kompetensutveckling
- "Du har blivit bättre på..."

SAMHÖRIGHET ❌ SAKNAS:
- Ingen community-funktion
- Ingen peer-support

FÖRBÄTTRAS:
- Framgångsberättelser
- "Andra i liknande situation..."
- Mentorskapsmöjligheter?
```

**Self-Efficacy Theory:**
- ✅ Verbal persuasion (stödjande AI)
- ⚠️ Vicarious experiences (få exempel)
- ⚠️ Physiological states (inte adresserat)

**Job Demands-Resources Model:**
> "Balansera krav och resurser. Just nu är vissa övningar för krävande utan tillräckliga resurser."

---

### Arbetsterapeuten - Rehabiliteringsperspektiv

> "Jag ser detta ur ett arbetsrehabiliteringsperspektiv. Portalen har potential men behöver justeringar:"

**Aktivitetsanalys (AATP):**
```
FYSISK ASPEKT:
⚠️ Långa sittningar framför skärm
✅ Break reminders finns

FÖRSLAG: "Rörelsepauser" - påminnelser om fysisk aktivitet

MENTAL ASPEKT:
⚠️ Kognitiv belastning varierar kraftigt
✅ Intresseguiden är strukturerad

FÖRSLAG: Tydligare indikation av "hjärnarbete" vs läsning
```

**Arbetsförmågebedömning (SAM/OPPM):**
> "Portalen skulle kunna stödja formell arbetsförmågebedömning:"

**Förslag:**
1. **Självskattning av arbetsförmåga** - Baslinje
2. **Aktivitetslogg** - Vad klarar jag idag?
3. **Progress mot arbete** - Gradvis återgång
4. **Rapport för konsulent** - Sammansatt bild

**Tillgänglighetsaspekter:**
- ✅ Flera inmatningssätt (tangentbord OK)
- ⚠️ Ingen röstinmatning
- ⚠️ Ingen stöd för kognitiva svårigheter
- ⚠️ Text-till-tal endast i kunskapsbanken

---

### Jobbcoachen - Arbetsmarknadsperspektiv

> "Från ett praktiskt jobbsökar-perspektiv:"

**CV-byggaren:**
```
✅ BRA:
- ATS-analys är värdefull
- Professionella mallar
- AI-hjälp sparar tid

⚠️ FÖRBÄTTRAS:
- Fler exempel-CV:n per bransch
- Tydligare koppling till specifika jobb
- LinkedIn-integration fungerar sådär
- Ingen "CV-klinik" (feedback från riktiga människor)
```

**Jobbsökning:**
```
❌ KRITISKT:
- Platsbanken-integration är grundläggande
- Ingen auto-apply funktion
- Begränsade filter

FÖRSLAG:
- Smarta filter ("passar min profil")
- Jobb-agents med bättre matching
- "Ansök med ett klick" (förberedd ansökan)
```

**Nätverkande:**
> "Saknas helt! Nätverkande är nyckeln till 70% av jobb."

**Förslag:**
- LinkedIn-optimeringsguide
- Nätverksskript/mallar
- "Kaffebjudning"-övningar
- Alumni-nätverk?

---

### Långtidsarbetssökande - Användarperspektiv (detaljerad)

> "Jag är målgruppen. Här är min ärliga feedback:"

**Dag 1-upplevelse:**
```
✅ Det som funkade:
- Välkomnande ton
- Tydlig onboarding
- Kändes inte "myndighetsaktigt"

⚠️ Det som var svårt:
- För många val (vilken widget?)
- Inte tydligt VAD jag ska göra först
- Kände mig lite vilse efter onboarding
```

**Efter en vecka:**
```
✅ Det som funkade:
- Dagboken blev min dagliga rutin
- Intresseguiden gav aha-upplevelser
- CV-byggaren gav struktur

❌ Det som inte funkade:
- Fick ångest av "0% klart" i vissa widgets
- Svårt komma ihåg att återkomma
- Kände mig ensam i processen
```

**Mina 3 önskemål:**
1. **"Dagens uppgift"** - Bara en sak att göra idag
2. **Påminnelser** - Gärna SMS, inte bara mail
3. **Se att jag gör framsteg** - Tydligare än nu

---

### Karriäromställaren - Effektivitetsperspektiv

> "Jag är självgående och vill ha effektivitet:"

**Tidsåtgång vs värde:**
```
INTRESSEGUIDEN: 45 min → Högt värde ✅
CV-byggaren:     60 min → Högt värde ✅
Övningar:        30 min → Medel värde ⚠️
Jobbsökning:     15 min → Lågt värde ❌
```

**Integrationsbehov:**
- LinkedIn - bättre import/export
- Arbetsförmedlingen - smidigare koppling
- Kalender - intervjubokningar
- BankID - smidigare inloggning

**Effektivitetsförslag:**
1. **"Snabb-CV"** - 15-minutersversion
2. **Jobb-matchning** - "Top 10 för dig"
3. **Export till Arbetsförmedlingen** - Färdig aktivitetsrapport

---

## 🎯 SAMMANFATTNING - Prioriterade Förslag

### 🚨 KRITISKA (Gör först)

| # | Förslag | Motiv | Insats |
|---|---------|-------|--------|
| 1 | **Energianpassade övningar** | Tillgänglighet för alla | Medel |
| 2 | **RLS policies** | Säkerhet + funktionalitet | Låg |
| 3 | **"Dagens uppgift"** | Tydlig vägledning | Låg |
| 4 | **Progress-tracking** | Användare ser framsteg | Medel |
| 5 | **Påminnelser** | Återkommande användning | Medel |

### ⚠️ VIKTIGA (Gör nästa)

| # | Förslag | Motiv | Insats |
|---|---------|-------|--------|
| 6 | **Karriärväg med milstolpar** | Långsiktigt engagemang | Hög |
| 7 | **Förbättrad jobbsökning** | Praktiskt värde | Hög |
| 8 | **Mobiloptimerad CV-wizard** | Tillgänglighet | Medel |
| 9 | **Analytics-dashboard** | Data-driven utveckling | Medel |
| 10 | **GDPR-compliance** | Juridisk säkerhet | Medel |

### 💡 BRA ATT HA (Gör senare)

| # | Förslag | Motiv | Insats |
|---|---------|-------|--------|
| 11 | **Community/framgångsberättelser** | Psykologiskt stöd | Hög |
| 12 | **Nätverkande-guide** | Praktisk jobbsökning | Medel |
| 13 | **Video-innehåll** | Varierat lärande | Hög |
| 14 | **Dark mode** | Visuell preferens | Låg |
| 15 | **Offline-läge** | Tillgänglighet | Hög |

---

## 📋 NÄSTA STEG - Rekommenderad Roadmap

### Sprint 6 (Vecka 10)
- [ ] RLS policies för alla tabeller
- [ ] "Dagens uppgift"-funktion
- [ ] Progress-tracking för övningar
- [ ] Bugfix: Övnings-sparning

### Sprint 7 (Vecka 11)
- [ ] Energianpassade micro-övningar (5 min)
- [ ] Karriärväg med 5 milstolpar
- [ ] Förbättrad onboarding (4 steg)
- [ ] Påminnelse-system

### Sprint 8 (Vecka 12)
- [ ] Analytics/events tracking
- [ ] Mobiloptimerad CV-wizard
- [ ] GDPR compliance-check
- [ ] Staging-miljö

### Sprint 9+ (Q2)
- [ ] Community-funktioner
- [ ] Nätverkande-guide
- [ ] Förbättrad jobbsökning
- [ ] Video-innehåll

---

## 🗣️ SLUTORD FRÅN TEAMET

> "Deltagarportalen har en stark grund med robust teknik och användarcentrerad design. De flesta förslag handlar om att förfina och fördjupa befintlig funktionalitet snarare än att bygga nytt. Fokusera på tillgänglighet, tydlig vägledning och progress-tracking för att skapa en ännu bättre upplevelse för våra användare."

**- Teamet & Advisory Board, 2026-03-04**

---

*Detta dokument sammanställer synpunkter från alla team-medlemmar och advisory board-medlemmar. Prioriteringarna är baserade på användarvärde, teknisk genomförbarhet och strategisk alignment.*
