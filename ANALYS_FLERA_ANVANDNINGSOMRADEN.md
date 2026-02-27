# Fler användningsområden för Arbetsförmedlingens API:er

*En analys för teamet med konkreta förslag på nya funktioner*

---

## 🎯 Översikt: Vilka API:er har vi tillgång till?

### 1. Job Search API ✅ (Integrerad)
**Vad det gör:** Söker lediga jobb i Platsbanken  
**Nuvarande användning:** Jobbsökning med filter

### 2. Taxonomi API ✅ (Integrerad)
**Vad det gör:** Hela AF:s begreppsstruktur (SSYK, yrken, kompetenser)
**Nuvarande användning:** Yrkesautocomplete, utbildningsvägledning

### 3. JobEd Connect API ✅ (Integrerad)
**Vad det gör:** Kopplar utbildningar till yrken
**Nuvarande användning:** Utbildningsfliken på Sök jobb

### 4. JobAd Enrichments API ✅ (Integrerad)
**Vad det gör:** AI-analys av jobbannonser (kompetenser, nyckelord)
**Nuvarande användning:** Förberedd för CV-matchning

### 5. JobSearch Trends API ✅ (Integrerad)
**Vad det gör:** Populära sökningar, marknadstrender
**Nuvarande användning:** Marknadsinsikter-fliken

### 6. Historiska data / Statistik API
**Vad det gör:** Aggreggerad arbetsmarknadsdata över tid
**Status:** Tillgänglig via data.arbetsformedlingen.se

---

## 💡 Nya användningsområden per sida

### 1. Dashboard (Startsida)

#### A. "Din Matchningsgrad"-widget
**Beskrivning:** Visa hur väl användarens CV matchar dagens arbetsmarknad
```
┌─────────────────────────────────────┐
│ 🎯 Din matchningsgrad               │
│                                     │
│ Du matchar 68% av alla lediga jobb  │
│ inom din bransch                    │
│                                     │
│ [3 nya jobb sedan igår]             │
│                                     │
│ Top 3 efterfrågade kompetenser:     │
│ • Python (↑ 25%)                    │
│ • Projektledning (↑ 12%)            │
│ • Agil utveckling (→)               │
└─────────────────────────────────────┘
```

**Tekniskt:**
- Kombinera `jobsApi.search()` + `enrichmentsApi.calculateCVMatch()`
- Cachas i Supabase (daglig uppdatering)

#### B. "Dagens Jobbtips"
**Beskrivning:** 3-5 jobb som matchar användarens profil extra väl
- Baserat på CV-data och tidigare sparade jobb
- Uppdateras dagligen

**Tekniskt:**
- Använd sparade sökningar + matchningsalgoritm
- Skicka notifikationer (om användaren aktiverat det)

#### C. Kompetensgaps-analys
**Beskrivning:** Visa vilka kompetenser som efterfrågas men saknas i CV
```
Du har 8 av 10 vanliga kompetenser för "Systemutvecklare"

Saknade kompetenser:
• Azure (efterfrågad i 65% av annonser)
• CI/CD (efterfrågad i 48% av annonser)

Rekommenderade utbildningar:
→ Azure Fundamentals (YH, 3 mån)
→ DevOps Engineering (YH, 6 mån)
```

---

### 2. CV-byggare (Stor förbättringspotential!)

#### A. Yrkesval med autocomplete ✅ (Redan förberett)
**Status:** Komponent finns, behöver integreras

#### B. Kompetensförslag
**Beskrivning:** När användaren väljer yrke, föreslå vanliga kompetenser
```
Steg 2: Kompetenser

Valt yrke: Systemutvecklare

Vanliga kompetenser för detta yrke:
☑ Python     ☐ Java      ☑ JavaScript
☑ Git        ☑ SQL       ☐ Azure
☑ Agilt      ☐ AWS       ☐ Docker

[ ] Visa fler kompetenser (20+)
```

**Tekniskt:**
```typescript
const skills = await taxonomyApi.getSkillsForOccupation(occupationId);
```

#### C. ATS-optimeringskontroll
**Beskrivning:** Analysera CV mot vanliga nyckelord i branschen
```
ATS-analys för "Systemutvecklare":

✅ Bra: Du har med "Python" och "Agilt"
⚠️  Saknas: "CI/CD", "Docker", "Microservices"

Ditt CV kommer förmodligen att:
✅ Passera automatisk screening
⚠️  Men kan förbättras med fler nyckelord

[Tips för att förbättra]
```

**Tekniskt:**
```typescript
// Hämta vanliga nyckelord för yrket
const enrichment = await enrichmentsApi.analyzeJobText(
  jobAds.map(ad => ad.description).join(' ')
);
```

#### D. Benchmark mot marknaden
**Beskrivning:** Jämför användarens CV med "genomsnittligt" CV för yrket
```
Din CV jämfört med andra Systemutvecklare:

Antal år erfarenhet:     Du: 3 år    Genomsnitt: 5 år
Antal kompetenser:       Du: 8 st    Genomsnitt: 12 st
Utbildningsnivå:         Du: YH       Vanligast: Universitet

Du är konkurrenskraftig men kan utvecklas inom:
• Utbildning (högskola ger +15% högre lön)
• Certifieringar (AWS, Azure)
```

---

### 3. Intresseguide (Stor potential!)

#### A. Yrkesutforskare baserat på intressen
**Beskrivning:** Istället för statiska frågor, använd SSYK-taxonomin
```
Välj områden som intresserar dig:

☑ Teknik & IT          ☐ Vård & Omsorg
☑ Kreativt arbete      ☐ Ekonomi & Affärer
☑ Människokontakt      ☐ Natur & Djur
☑ Praktiskt arbete     ☐ Ledarskap

Baserat på dina val rekommenderar vi:

1. Frontend-utvecklare
   • Matchar dina intressen: Teknik, Kreativt
   • 450 lediga jobb i ditt län
   • Genomsnittslön: 42 000 kr
   [Läs mer] [Se utbildningar]

2. UX-designer
   • Matchar dina intressen: Teknik, Kreativt, Människokontakt
   • 120 lediga jobb i ditt län
   • Genomsnittslön: 45 000 kr
```

**Tekniskt:**
- Mappa intressen till SSYK-kategorier
- Använd `trendsApi.getPopularSearches()` för jobbdata

#### B. Realtidsdata i resultatet
**Beskrivning:** Visa aktuell efterfrågan för rekommenderade yrken
```
Ditt resultat: Systemutvecklare

📊 Marknadsläget just nu:
• 850 lediga jobb i Sverige
• ↑ 15% fler jobb än förra året
• 8.2 sökande per jobb (medelkonkurrens)
• Genomsnittlig lön: 52 000 kr/mån
• 92% får jobb inom 3 månader

[Se alla jobb] [Se utbildningar] [Jämför med liknande yrken]
```

#### C. "Dag i livet"-simulering
**Beskrivning:** Använd data från jobbannonser för att beskriva yrket
```
En vanlig dag som Systemutvecklare:

Morgonmöte med teamet (scrum)
↓
Programmering i Python/JavaScript (4h)
↓
Code review med kollegor
↓
Planering av nästa sprint

Vanliga arbetsuppgifter (baserat på 500+ annonser):
• Programmera nya funktioner (nämns i 98% av annonser)
• Underhålla befintlig kod (89%)
• Samarbeta i team (95%)
• Dokumentera lösningar (67%)

Vanliga arbetsplatser:
• IT-konsultbolag (35%)
• E-handelsföretag (25%)
• Myndigheter (15%)
• Startups (25%)
```

**Tekniskt:**
- Använd `enrichmentsApi.analyzeJobText()` på många annonser
- Extrahera vanliga arbetsuppgifter

---

### 4. Sök jobb (Ytterligare förbättringar)

#### A. Smarta filter för kompetenser
**Beskrivning:** Låt användaren filtrera på specifika kompetenser
```
Filter:

Kompetenser:
[_______________] [+ Lägg till]
• Python     [x]
• React      [x]
• AWS        [x]

Visar 45 jobb som matchar alla valda kompetenser
```

#### B. Spara sökningar + Bevakningar
**Beskrivning:** Användaren kan spara sökningar och få notifieringar
```
Dina bevakningar:

1. "Systemutvecklare i Stockholm"
   • 12 nya jobb denna vecka
   • [Visa jobb] [Ändra bevakning] [Pausa]

2. "Sjuksköterska i Göteborg"
   • 5 nya jobb idag!
   • [Visa jobb] [Ändra bevakning] [Pausa]

[Lägg till ny bevakning]
```

**Tekniskt:**
- Spara sökparametrar i Supabase
- Kör daglig kontroll via cron (backend eller Supabase function)

#### C. Jämför jobb
**Beskrivning:** Välj flera jobb och jämför sida vid sida
```
Jämför 3 valda jobb:

                  Jobb A    Jobb B    Jobb C
Lön              45 000    48 000    42 000
Avstånd          5 km      15 km     Remote
Matchning        85%       72%       90%
Förmåner         Bra       Mycket    Standard
                 bra                 
Anställningstyp  Tillsvid. Tillsvid. 6 mån
Företagsstorlek  50+       500+      10

[Ansök på A] [Ansök på B] [Ansök på C]
```

#### D. "Liknande jobb"
**Beskrivning:** Visa jobb som liknar det användaren tittar på
```
Systemutvecklare på Spotify

Du kanske också är intresserad av:
• Frontend-utvecklare på Klarna (92% match)
• Fullstack-utvecklare på Tink (88% match)
• DevOps Engineer på Etsy (85% match)
```

**Tekniskt:**
- Använd samma SSYK-kod eller liknande kompetenser
- `taxonomyApi.getRelatedConcepts(occupationId)`

---

### 5. Personligt brev-generator (Stora förbättringar!)

#### A. Automatisk analys av jobbannons
**Beskrivning:** När användaren klistrar in en annons, analysera den automatiskt
```
Klistra in jobbannons:
[                                          ]
[Vi söker en erfaren Python-utvecklare    ]
[som har erfarenhet av Django och AWS...   ]
[                                          ]
          [Analysera annons]

Analys:
🔍 Nyckelkompetenser identifierade:
• Python (essentiell)
• Django (essentiell)
• AWS (essentiell)
• Agil utveckling (önskvärd)

Din matchning:
✅ Python - Du har 3 års erfarenhet
✅ Agilt - Nämns i ditt CV
⚠️  Django - Saknas i ditt CV
⚠️  AWS - Saknas i ditt CV

Föreslagna fokusområden i brevet:
1. Lyft fram dina Python-projekt
2. Nämn relaterad erfarenhet (t.ex. Flask istället för Django)
3. Uttryck intresse för att lära AWS

[Generera personligt brev]
```

#### B. Mallbibliotek baserat på bransch
**Beskrivning:** Förberedda mallar för olika typer av jobb
```
Välj mall:

🔹 Standard (fungerar för de flesta)
🔹 Karriärsbyte (för dig som byter bransch)
🔹 Tillbaka efter paus (för dig som varit borta)
🔹 Nyanställd (för dig med lite erfarenhet)
🔹 Specialist (för seniora roller)
🔹 Kort och konkret (för enkla roller)

Mallen anpassas automatiskt baserat på:
• Jobbets bransch
• Din erfarenhetsnivå
• Matchningsgrad
```

---

### 6. Ny sida: Karriärcoachen 🤖

**Koncept:** En AI-driven coach som ger personliga råd baserat på data

#### A. Karriärvägsplanerare
**Beskrivning:** Hjälp användaren planera nästa steg i karriären
```
Var är du nu?         Var vill du?         Vad behövs?
[UX-designer]    →   [UX-lead]      →    [Ledarskap]
3 år erfarenhet       +2 år                [Strategi]
                      +15 000 kr           [Fler projekt]

Rekommenderade steg:
1. Ta lead på ett större projekt (6 mån)
2. Gå en ledarskapsutbildning (3 mån)
3. Bygg nätverk inom branschen
4. Ansök till UX-lead roller

[Se lediga UX-lead jobb] [Hitta utbildningar]
```

**Tekniskt:**
- Använd `taxonomyApi` för att hitta relaterade yrken
- `trendsApi` för lönedata och efterfrågan
- `jobEdApi` för utbildningsförslag

#### B. Kompetensutvecklingsplan
**Beskrivning:** Skapa en personlig plan för kompetensutveckling
```
Din kompetensutvecklingsplan 2024

Q1: Azure Fundamentals (certifiering)
     → Efterfrågad i 65% av jobb du sparat
     → Ökar din lönpotential med +8%
     → 3 månader, kostnad: 0 kr (studiestöd)

Q2: Bygg portfolio-projekt
     → Visar praktisk erfarenhet
     → ökar matchning med 15%

Q3: Nätverka på branschevent
     → 40% av jobb tillsätts via kontakter

[Skapa påminnelser] [Hitta utbildningar]
```

---

### 7. Ny sida: Löneinsikter 💰

**Koncept:** Utforska lönestatistik för olika yrken

```
Löneinsikter

Sök yrke: [Systemutvecklare________] 🔍

För Systemutvecklare i Sverige:

Medianlön:        52 000 kr/mån
25-percentil:     42 000 kr/mån  (nybörjare)
75-percentil:     62 000 kr/mån  (erfarna)

Per region:
Stockholm:        58 000 kr (+12%)
Göteborg:         54 000 kr (+4%)
Malmö:            50 000 kr (-4%)
Remote:           55 000 kr (+6%)

Per erfarenhet:
0-2 år:   38 000 kr
3-5 år:   52 000 kr  ← Du är här
6-10 år:  60 000 kr
10+ år:   68 000 kr

Så ökar du din lön:
• Certifieringar: +5-10%
• Byta jobb: +10-15%
• Specialistkompetens: +15-20%
• Ledarskap: +20-30%

[Se jobb med högre lön] [Hitta utbildningar]
```

**Tekniskt:**
```typescript
const salaryStats = await trendsApi.getSalaryStats('Systemutvecklare');
```

---

### 8. Ny funktion: Jobbcoach-dashboard 👥

**För vem:** Jobbcoacher som använder portalen med sina klienter

```
Mina klienter (Jobbcoach-vy)

👤 Anna Andersson        🟢 Aktiv
   • 85% CV-komplett
   • 12 sparade jobb
   • 3 ansökningar denna vecka
   • Rekommendation: Fokusera på Azure-cert

👤 Erik Eriksson         🟡 Behöver stöd
   • 45% CV-komplett
   • 2 sparade jobb
   • Ingen aktivitet på 7 dagar
   • Rekommendation: Boka uppföljning

👤 Maria Svensson        🟢 Aktiv
   • 100% CV-komplett
   • 5 intervjuer bokade
   • Rekommendation: Förbered intervjufrågor

[Se alla klienter] [Skicka gruppmeddelande]
```

---

## 📊 Prioriteringsmatris

| Funktion | Användarvärde | Komplexitet | Rekommendation |
|----------|---------------|-------------|----------------|
| CV: Kompetensförslag | ⭐⭐⭐⭐⭐ | Låg | **Gör först** |
| Dashboard: Matchningsgrad | ⭐⭐⭐⭐⭐ | Medel | **Gör först** |
| Sök: Spara bevakningar | ⭐⭐⭐⭐⭐ | Medel | Sprint 2 |
| Löneinsikter-sida | ⭐⭐⭐⭐ | Låg | Sprint 2 |
| Intresseguide: Realtidsdata | ⭐⭐⭐⭐ | Låg | Sprint 2 |
| CV: ATS-optimering | ⭐⭐⭐⭐ | Medel | Sprint 3 |
| PB: Analys av annons | ⭐⭐⭐⭐ | Medel | Sprint 3 |
| Karriärcoachen | ⭐⭐⭐⭐⭐ | HÖG | Sprint 4+ |
| Jobbcoach-dashboard | ⭐⭐⭐ | Medel | Senare |

---

## 🛠️ Teknisk genomförbarhet

### Låg komplexitet (Kan göras snabbt)
1. Kompetensförslag i CV-byggare
2. Löneinsikter-sida
3. Realtidsdata i intresseguide
4. Jämför jobb-funktion

### Medel komplexitet (Kräver mer arbete)
1. Matchningsgrad-widget (beräkningar)
2. Spara bevakningar (cron-jobb)
3. ATS-optimering (analyslogik)
4. PB-analys (AI-integration)

### Hög komplexitet (Stora projekt)
1. Karriärcoachen (AI + logik)
2. Jobbcoach-dashboard (nya roller)
3. Kompetensutvecklingsplan (algoritm)

---

## 💬 Nästa steg för teamet

### Diskussionsfrågor:
1. Vilka funktioner skapar mest värde för långtidsarbetslösa?
2. Ska vi fokusera på "jobb nu" eller "karriär på sikt"?
3. Hur mycket automation är för mycket?
4. Ska jobbcoacher ha tillgång till all data?

### Rekommenderad roadmap:
**Vecka 1-2:**
- ✅ Kompetensförslag i CV-byggare
- ✅ Matchningsgrad på Dashboard

**Vecka 3-4:**
- Spara bevakningar
- Löneinsikter-sida

**Vecka 5-6:**
- ATS-optimering
- PB-förbättringar

**Vecka 7+:**
- Karriärcoachen (stort projekt)

---

*Dokument version 1.0 - 2024-02-27*
*Förslag: Teamdiskussion vid nästa sprint planning*
