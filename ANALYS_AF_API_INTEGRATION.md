# Analys: Arbetsförmedlingen API-integrationer i Deltagarportalen

## 📋 Bakgrund
Arbetsförmedlingen tillhandahåller flera öppna API:er via:
- **Job Search API**: `https://jobsearch.api.jobtechdev.se` (redan integrerad)
- **Taxonomi API**: Begrepp, yrken, kompetenser, utbildningar
- **Historiska data**: JobSearch Trends
- **JobAd Enrichments**: AI-baserad annonsanalys
- **JobEd Connect**: Koppling utbildning ↔ yrke

Full dokumentation: https://data.arbetsformedlingen.se/

---

## 🔍 Tillgängliga API:er och förslag på användning

### 1. Job Search API (REDAN INTEGRERAD) ✅
**Endpoint**: `https://jobsearch.api.jobtechdev.se/search`

**Nuvarande användning**:
- Sök jobb på "Sök jobb"-sidan
- Filtrera på kommun och län
- Filtrera på anställningsform
- Filtrera på publiceringsdatum

**Föreslagna utökningar**:
- **Spara sökningar** - Bevaka nya jobb som matchar kriterier
- **Jobbaviseringar** - Notifiera när nya jobb publiceras
- **Direktansökan** - Ansök via AF direkt från portalen
- **Dela jobb** - Dela intressanta jobb till jobbcoach

---

### 2. Taxonomi API 🏷️
**Beskrivning**: Hela AF:s begreppsstruktur (SSYK, yrken, kompetenser)

**Förslag på användning**:

#### A. Intresseguide (förbättrad)
**Var**: `/interests` eller ny sida
**Hur**:
- Använd SSYK-strukturen för att visa yrkeshierarki
- Koppla intressen till specifika yrkesgrupper
- Visa relaterade yrken baserat på taxonomin

**API-endpoints**:
- `/taxonomy/concept-types` - Hämta begreppstyper
- `/taxonomy/concepts` - Hämta yrken, kompetenser
- `/taxonomy/relations` - Se kopplingar mellan begrepp

#### B. CV-byggare (förbättrad)
**Var**: `/cv-builder`
**Hur**:
- Autocomplete för yrkestitlar (standardiserade från AF)
- Föreslå kompetenser baserat på yrke
- Validera yrkesbenämningar mot SSYK

**Användarupplevelse**:
```
Användare skriver: "programme..."
→ Förslag: "Programmerare", "Programvaruutvecklare", "Systemutvecklare"
→ Kopplas automatiskt till rätt SSYK-kod
```

#### C. Kompetensprofil
**Ny funktion**: Visa kompetensgap gentemot yrkeskrav
**Hur**:
- Jämför användarens kompetenser mot yrkets krav från AF
- Visa vilka kompetenser som efterfrågas mest
- Föreslå utbildningar för att täcka gap

---

### 3. JobAd Enrichments API 🤖
**Beskrivning**: AI-analys av jobbannonser - extraherar kompetenser, nyckelord

**Förslag på användning**:

#### A. Förbättrad jobbmatchning
**Var**: "Sök jobb"-sidan
**Hur**:
- Analysera jobbannonser automatiskt
- Extrahera nyckelkompetenser
- Matcha mot användarens CV

**Fördelar**:
- Mer träffsäker matchning
- Identifiera dolda krav i annonser
- Bättre förslag på förbättringar av CV

#### B. Personligt brev-generator (förbättrad)
**Var**: `/cover-letter`
**Hur**:
- Använd berikade annonser för att skräddarsy brevet
- Lyft fram kompetenser som matchar extraherade nyckelord
- Föreslå formuleringar baserat på vanliga uttryck i branschen

---

### 4. JobEd Connect API 🎓
**Beskrivning**: Kopplar utbildningar till yrken och kompetenser

**Förslag på användning**:

#### A. Utbildningsvägledning
**Ny sida**: `/education-path` eller integrera i intresseguide
**Hur**:
- Användaren anger intresserat yrke
- Visa vilka utbildningar som leder dit
- Visa vilka kompetenser varje utbildning ger

**Användarupplevelse**:
```
"Jag vill bli sjuksköterska"
→ Visa: "Sjuksköterskeutbildning (3 år)" 
→ Visa: "Undersköterska + påbyggnad (2+1 år)"
→ Visa relaterade kompetenser som krävs
```

#### B. Kompetensbaserad vägledning
**Hur**:
- Användaren anger sina kompetenser
- Få förslag på yrken som matchar
- Se vilka utbildningar som kompletterar

---

### 5. JobSearch Trends API 📈
**Beskrivning**: Populära sökningar och trender från Platsbanken

**Förslag på användning**:

#### A. Marknadsinsikter (förbättrad)
**Var**: `/market-insights` (redan en flik på "Sök jobb")
**Hur**:
- Visa de mest efterfrågade kompetenserna just nu
- Visa vilka yrken som växer mest
- Geografisk efterfrågan per län

**Data som kan visas**:
- Top 10 kompetenser i efterfrågan
- Yrken med störst tillväxt
- Län med flest lediga jobb
- Genomsnittlig tid till anställning per yrke

#### B. Personliga rekommendationer
**Hur**:
- Baserat på användarens CV och sökningar
- Föreslå kompetenser att utveckla baserat på trender
- Varna för yrken med minskad efterfrågan

---

### 6. Historiska data / Statistik 📊
**Beskrivning**: Aggreggerad data om arbetsmarknaden

**Förslag på användning**:

#### A. Dashboard-widget (ny)
**Var**: Dashboarden
**Visa**:
- "Så här många jobb matchar din profil just nu"
- "Din bransch växer med X%"
- "Genomsnittlig lön för ditt yrke: X kr"

#### B. Löneinsikter
**Var**: Jobbkort eller separat sida
**Hur**:
- Visa lönestatistik per yrke
- Jämför löner mellan regioner
- Visa löneutveckling över tid

---

## 📍 Sid-förslag med API-integrationer

### Dashboard (Startsida)
| Nuvarande | Förslag med AF API |
|-----------|-------------------|
| Generella tips | **Personliga jobbrekommendationer** baserat på CV |
| Mock-statistik | **Reell statistik** från AF om matchande jobb |
| Tom aktivitetsfeed | **Nya jobbaviseringar** som matchar profilen |

### Intresseguide
| Nuvarande | Förslag med AF API |
|-----------|-------------------|
| Statiska frågor | **Dynamiska frågor** baserade på SSYK-taxonomi |
| Generiska resultat | **Specifika yrkesförslag** med lediga jobb |
| Ingen utbildningsinfo | **Länk till relevanta utbildningar** (JobEd Connect) |

### CV-byggare
| Nuvarande | Förslag med AF API |
|-----------|-------------------|
| Fritext yrke | **Autocomplete** med standardiserade yrken |
| Egna kompetenser | **Förslag på kompetenser** per yrke |
| Ingen validering | **ATS-optimering** baserat på vanliga nyckelord |
| Manuell inmatning | **Importera från LinkedIn** + matcha mot AF-taxonomi |

### Sök jobb (REDAN DELVIS)
| Nuvarande | Förslag med AF API |
|-----------|-------------------|
| Sökning | ✅ Implementerat |
| Filtrering | ✅ Kommun & län |
| Jobbkort | **Förbättra** med data från JobAd Enrichments |
| Matchningsanalys | **Förbättra** med AI-baserad analys |
| Spara jobb | ✅ Implementerat i Supabase |

### Personligt brev
| Nuvarande | Förslag med AF API |
|-----------|-------------------|
| Mallbaserat | **Anpassa** efter berikad annonsdata |
| Generiskt | **Nyckelordsoptimerat** för varje jobb |
| Manuell matchning | **Automatisk** matchning CV ↔ jobbkrav |

### Marknadsinsikter (förbättra)
| Nuvarande | Förslag med AF API |
|-----------|-------------------|
| Mock-data | **Reell data** från JobSearch Trends |
| Statiska diagram | **Dynamiska** baserat på användarens profil |
| Generella tips | **Personliga rekommendationer** |

---

## 🔧 Tekniska överväganden

### Fördelar med AF API-integrationer
- ✅ **Kostnadsfritt** - Öppna API:er
- ✅ **Aktuell data** - Realtidsuppdateringar
- ✅ **Trovärdigt** - Sveriges officiella arbetsmarknadsdata
- ✅ **Ingen backend krävs** - Direktanrop från frontend

### Utmaningar
- ⚠️ **CORS** - Kan kräva proxy för vissa anrop
- ⚠️ **Begränsningar** - Rate limits på vissa endpoints
- ⚠️ **Komplexitet** - Taxonomin är omfattande
- ⚠️ **Prestanda** - Flera API-anrop kan göras sekvensiellt

### Lösningsförslag
```
Föreslagen arkitektur:

┌─────────────────────────────────────────────┐
│           Deltagarportalen (React)          │
├─────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐         │
│  │   AF API     │  │   Supabase   │         │
│  │  (jobbdata)  │  │  (userdata)  │         │
│  └──────────────┘  └──────────────┘         │
├─────────────────────────────────────────────┤
│        Lokal cache (React Query)            │
└─────────────────────────────────────────────┘
```

---

## 📋 Rekommenderad prioritering

### Hög prioritet (Sprint 1)
1. **Förbättra "Sök jobb"** med fler filter (yrkesgrupper)
2. **Taxonomi-autocomplete** i CV-byggare
3. **Marknadsinsikter** med riktig data

### Medel prioritet (Sprint 2)
4. **JobAd Enrichments** för bättre matchning
5. **JobEd Connect** för utbildningsvägledning
6. **Kompetensgap-analys**

### Låg prioritet (Sprint 3+)
7. **Trendanalyser** på dashboard
8. **Löneinsikter**
9. **Automatiska jobbaviseringar**

---

## 🤝 Frågor till teamet

### Produkt & UX
1. Vilken data skulle vara mest värdefull för användarna?
2. Ska vi fokusera på "push" (aviseringar) eller "pull" (sök)?
3. Hur mycket automatisering är för mycket?

### Teknik
1. Ska vi bygga en backend-proxy för AF API:er?
2. Hur hanterar vi caching av taxonomi-data?
3. Ska vi använda React Query för server state?

### Innehåll
1. Vilka yrkesgrupper ska vi prioritera initialt?
2. Ska vi visa all AF-data eller filtrera?
3. Hur förklarar vi SSYK-taxonomin för användare?

---

## 📚 Resurser

- **Job Search API Docs**: https://jobsearch.api.jobtechdev.se/
- **Taxonomi**: https://data.arbetsformedlingen.se/taxonomi/
- **JobEd Connect**: https://data.arbetsformedlingen.se/jobedconnect/
- **JobAd Enrichments**: https://data.arbetsformedlingen.se/jobad-enrichments/

---

*Dokument skapat: 2024-02-27*
*Förslag: Diskutera på nästa teammöte*
