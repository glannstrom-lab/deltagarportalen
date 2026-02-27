# 🎯 Strategimöte: Deltagarportalens Framtid

**Datum:** 2026-02-27  
**Tid:** 13:00-15:00 (2 timmar)  
**Format:** Hybrid (fysisk + digital närvaro)  
**Facilitator:** COO (Kimi)

---

## 📋 Närvarande

### Teamet (Internt)
| Roll | Namn | Närvaro |
|------|------|---------|
| VD/CEO | Mikael | ✅ |
| COO | Kimi (AI) | ✅ |
| CTO | (Agent) | ✅ |
| CPO | (Agent) | ✅ |
| Product Manager | (Agent) | ✅ |
| UX Designer | (Agent) | ✅ |
| Fullstack-utvecklare | (Agent) | ✅ |
| QA/Testare | (Agent) | ✅ |

### Advisory Board (Externa)
| Roll | Perspektiv | Närvaro |
|------|------------|---------|
| Långtidsarbetssökande | Tillgänglighet, psykologisk säkerhet | ✅ |
| Karriäromställare | Effektivitet, professionalitet | ✅ |
| Jobbcoach/Arbetskonsulent | Arbetsmarknadskoppling | ✅ |
| Psykologiforskare | Evidensbaserad design | ✅ |
| Arbetsterapeut | Arbetsanpassning, realistisk återgång | ✅ |

---

## 📝 Agenda

| Tid | Punkt | Ansvarig |
|-----|-------|----------|
| 13:00-13:10 | Välkommen & intro | COO |
| 13:10-13:30 | Nuvarande läge - Sprint 3 sammanfattning | CPO |
| 13:30-14:00 | Teknisk genomgång - CORS-lösning & Edge Functions | CTO |
| 14:00-14:30 | **Workshop:** Prioritering av framtida funktioner | Alla |
| 14:30-14:50 | Advisory Board input & perspektiv | Externa |
| 14:50-15:00 | Sammanfattning & next steps | COO |

---

## 📊 Nuvarande Läge (Sprint 3 ✅)

### Vad vi har byggt

| Funktion | Status | Användarperspektiv |
|----------|--------|-------------------|
| 🔍 **Jobbsökning** | ✅ Live | Realtidsdata från Platsbanken |
| 🔔 **Notifikationer** | ✅ Live | Jobbbevakningar med browser-notifikationer |
| 💡 **Yrkesrekommendationer** | ✅ Live | Relaterade yrken baserat på sökning |
| 🎯 **CV-matchning** | ✅ Live | Matchningspoäng och kompetensanalys |
| 📊 **Marknadsstatistik** | ✅ Live | Trender och löneinformation |
| ⚡ **Snabbansökan** | ✅ Live | Mallar för personligt brev |
| 💼 **CV-generator** | ✅ Live | ATS-optimerade mallar |
| 🧭 **Intresseguiden** | ✅ Live | Holland-kod test med yrkesförslag |

### Teknisk Status

**✅ Klart:**
- 5 Supabase Edge Functions deployade (af-taxonomy, af-trends, af-jobed, af-jobsearch, af-enrichments)
- CORS-problem löst för Arbetsförmedlingen API:er
- Bygg fungerar (1.7MB bundle)
- Timeout-hantering implementerad (10s)

**⚠️ Utmaningar:**
- Supabase Edge Functions kan vara långsamma vid kallstart
- Viss API-latens från Arbetsförmedlingen
- Ingen mock-data fallback (endast riktig data)

---

## 🚀 Förslag på Framtida Utveckling

### A. Omedelbara Prioriteringar (Sprint 4 - Mars 2026)

#### 1. Prestanda & Stabilitet
| Funktion | Beskrivning | Påverkan | Komplexitet |
|----------|-------------|----------|-------------|
| **Caching-lager** | Redis/cache för API-svar | 🔴 Hög | 🟡 Medium |
| **Offline-support** | PWA med lokal lagring | 🔴 Hög | 🔴 Hög |
| **Retry-logik** | Automatiska återförsök vid timeout | 🟡 Medium | 🟢 Låg |
| **Loading states** | Bättre feedback vid laddning | 🟡 Medium | 🟢 Låg |

#### 2. Kartan - Visuell Jobbsökning
```
Förslag: Interaktiv Sverigekarta som visar:
- Antal lediga jobb per region
- Möjlighet att zooma till kommunnivå
- Filtrera efter avstånd från hemadress
- Pendlingsmöjligheter (kollektivtrafik)
```

**Advisory Board input:**
- Långtidsarbetssökande: "Kartor kan vara överväldigande, men enkel distansvisning är bra"
- Karriäromställare: "Viktigt för att se möjligheter i närliggande orter"
- Jobbcoach: "Hjälper till att bredda sökningen geografiskt"

#### 3. Dela Jobb med Konsulent
```
Förslag: "Dela med konsulent"-knapp på varje jobb:
- Skicka jobb till arbetskonsulenten
- Lägg till personlig kommentar
- Konsulent får notifikation
- Möjlighet att boka samtal direkt
```

**Advisory Board input:**
- Jobbcoach: "Kritisk funktion! Så mycket tid går åt att dubbelkolla jobb"
- Långtidsarbetssökande: "Skulle kännas tryggt att få godkännande från konsulenten"

---

### B. Kortsiktiga Förbättringar (Q2 2026)

#### 4. PDF-export & Dokumenthantering
| Funktion | Beskrivning | Advisory Board |
|----------|-------------|----------------|
| **PDF-export av CV** | Professionell utskrift | Karriäromställare: "Måste se professionellt ut" |
| **Ansökningshistorik** | Export för egen dokumentation | Jobbcoach: "Viktigt för att se aktivitet" |
| **Spara jobbannonser** | PDF av annons innan den försvinner | Alla: "Annonser försvinner snabbt" |

#### 5. LinkedIn-integration
```
Förslag:
- Importera profil från LinkedIn
- Synka ansökningsstatus
- Dela jobb på LinkedIn
- Nätverkssuggestions
```

**Advisory Board input:**
- Karriäromställare: "Sparar enormt med tid - ingen vill skriva in samma info igen"
- Psykologiforskare: "Varning för social jämförelse - behöver hanteras varsamt"

#### 6. Intervjuförberedelse
```
Förslag baserat på evidens:
- Vanliga intervjufrågor per yrke
- Video-intervjuträning
- AI-baserad mock-intervju
- Feedback på kroppsspråk
```

**Advisory Board input:**
- Psykologiforskare: "Mastery experiences är nyckeln - öva i trygg miljö"
- Arbetsterapeut: "Viktigt att träna på specifika situationer"

---

### C. Strategiska Satsningar (Q3-Q4 2026)

#### 7. AI-driven Karriärvägledning
```
Förslag:
- Personlig AI-coach tillgänglig 24/7
- Prediktiv analys av framgångsfaktorer
- Individuell handlingsplan baserat på data
- Early warning system vid risk för avbrott
```

**Advisory Board input:**
- Psykologiforskare: "AI kan skala evidensbaserad coachning, men får inte ersätta mänsklig kontakt"
- Jobbcoach: "Bra som komplement, men personlig relation är avgörande"

#### 8. Arbetsgivarportal (B2B)
```
Förslag:
- Arbetsgivare kan se anonymiserade profiler
- Direktkontakt med matchade kandidater
- Söka baserat på kompetenser
- Enkel bokning av intervjuer
```

**Advisory Board input:**
- Jobbcoach: "Bryggan mellan deltagare och arbetsgivare är kritisk"
- Långtidsarbetssökande: "Känns läskigt att vara synlig, men bra om det leder till jobb"

#### 9. Mobilanpassning & PWA
```
Förslag:
- Native-app känsla
- Push-notifikationer
- Offline-läge
- Snabb åtkomst för daglig användning
```

**Advisory Board input:**
- Långtidsarbetssökande: "Många använder bara mobil - måste fungera perfekt där"
- Arbetsterapeut: "Viktigt med tillgänglighet även för de med begränsad teknisk erfarenhet"

---

## 🎨 Designprinciper (Advisory Board-godkända)

### Psykologisk Säkerhet
> *"Ingen ska behöva känna sig mindre värd för att de har det svårt"* - Långtidsarbetssökande

- ✅ Icke-dömande språk
- ✅ Normalisera motgångar
- ✅ Positiv förstärkning utan att kännas barnsligt
- ✅ Kontroll över egen data

### Energinivåanpassning
| Nivå | Andel av funktioner | Exempel |
|------|---------------------|---------|
| 🟢 Låg | 50% | Läsa resultat, spara jobb |
| 🟡 Medium | 30% | Enkla formulär, sökning |
| 🔴 Hög | 20% | CV-skrivning, ansökningar |
| ⚫ Spärr | 0% | Tidsbegränsningar, komplexa val |

### Tillgänglighet
> *"Max 20% får vara 🔴 energikrävande"* - Långtidsarbetssökande

- Fungerar i sängläge med mobil
- Stöd för röststyrning
- Pausa och återuppta utan dataförlust
- Tydliga instruktioner utan att vara nedlåtande

---

## 💰 Affärsmodell & Hållbarhet

### Nuvarande Kostnader (månadsvis)
| Tjänst | Kostnad | Notering |
|--------|---------|----------|
| Supabase | $25 | Kan skala upp vid behov |
| Arbetsförmedlingen API | Gratis | Öppna data |
| Vercel/Hosting | $20 | Frontend |
| **Totalt** | **~$45/mån** | Mycket låg driftkostnad |

### Intäktsmöjligheter
1. **Kommunal licensing** - Sälja till kommuner som verktyg
2. **Arbetsgivarabonnemang** - B2B för direktrekrytering
3. **Premium-features** - Avancerade AI-funktioner för självgående
4. **Finansieringsmöjligheter** - Arbetsförmedlingen, ESF, social impact funds

---

## 📊 Prioriteringsmatris

### Röstning (Team + Advisory Board)
Betygsätt 1-5 på: **Användarvärde**, **Teknisk genomförbarhet**, **Strategisk vikt**

| Funktion | Användarvärde | Genomförbarhet | Strategisk vikt | Totalt |
|----------|---------------|----------------|-----------------|--------|
| Dela med konsulent | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **14** |
| Prestanda/caching | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **13** |
| Kartan | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | **10** |
| PDF-export | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | **12** |
| Intervju-träning | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | **12** |
| LinkedIn-integration | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | **9** |
| AI-coach | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | **11** |
| Arbetsgivarportal | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | **12** |

---

## 🎯 Rekommenderad Roadmap

### Sprint 4 (Mars 2026)
1. **Dela jobb med konsulent** - Högsta användarvärdet
2. **Prestandaoptimering** - Caching och retry-logik
3. **Loading states** - Bättre användarfeedback

### Q2 2026 (April-Juni)
1. **PDF-export** - Professionella dokument
2. **Kartan** - Visuell jobbsökning
3. **Intervju-träning** - Evidensbaserad förberedelse

### Q3 2026 (Juli-September)
1. **AI-coach (MVP)** - 24/7-stöd
2. **LinkedIn-integration** - Importera profil
3. **Mobilapp/PWA** - Native känsla

### Q4 2026 (Oktober-December)
1. **Arbetsgivarportal (B2B)** - Ny intäktskälla
2. **Avancerad AI** - Prediktiv analys
3. **Skalning** - Fler kommuner/användare

---

## 📋 Action Items från Mötet

### Omedelbart (vecka 1)
- [ ] Teamet: Skatta teknisk komplexitet för topp 3-prioriteringar
- [ ] CTO: Underska Supabase caching-alternativ
- [ ] CPO: Skriva user stories för "Dela med konsulent"

### Kortsiktigt (vecka 2-4)
- [ ] UX Designer: Wireframes för kartan
- [ ] Advisory Board: Granska "Dela med konsulent"-design
- [ ] VD: Utforska finansieringsmöjligheter för Q3-Q4

### Långsiktigt
- [ ] Teamet: Planera B2B-pilot med 2-3 arbetsgivare
- [ ] Advisory Board: Delta i användartester för AI-coach
- [ ] Alla: Månatlig uppföljning av roadmap

---

## 💬 Avslutande Ord från Advisory Board

> **Långtidsarbetssökande:** *"Det viktigaste är att portalen känns som ett stöd, inte en övervakning. Jag vill ha hjälp, inte bli bedömd."*

> **Karriäromställare:** *"Ge mig verktygen och låt mig sköta resten. Jag behöver inte handhållning - jag behöver effektivitet."*

> **Jobbcoach:** *"Varje funktion som sparar tid för mig eller deltagaren är värd investeringen. Tiden är vår mest begränsade resurs."*

> **Psykologiforskare:** *"Bygg vidare på det som redan fungerar. Små vinster leder till stora förändringar. Och kom ihåg - evidens är inte tråkigt, det är vad som faktiskt fungerar."*

> **Arbetsterapeut:** *"Realism är nyckeln. Det är bättre att hjälpa någon till ett rimligt jobb än att drömma om det perfekta. Små steg, hållbara framsteg."*

---

## 📞 Next Steps

**Nästa möte:** 2026-03-27 (månatligt Advisory Board-möte)

**Kontakt:**
- Daglig kommunikation: #advisory-board (Discord/Slack)
- Akuta frågor: COO (Kimi)
- Strategiska beslut: VD (Mikael)

**Dokumentation:**
- Denna fil uppdateras efter mötet
- Beslut loggas i #beslut-kanalen
- Uppföljning nästa möte

---

*"Tillsammans bygger vi en portal som verkligen gör skillnad - för alla oavsett var de befinner sig i livet."*

**Mötesprotokoll skrivet av:** COO (Kimi)  
**Nästa uppdatering:** Efter mötet 2026-02-27
