# Deltagarportalen - Integrationsanalys och Förslag

**Framtagen för:** VD, Deltagarportalen  
**Datum:** 2026-03-10  
**Författare:** Produktstrateg  

---

## Sammanfattning för VD

Denna analys identifierar betydande möjligheter att förbättra deltagarresan genom smartare integration mellan portalens moduler. Idag navigerar deltagaren mellan 11+ separata sidor utan sömlösa övergångar. Vårt förslag minskar friktionen avsevärt och skapar en naturlig arbetsflöde från första inloggning till anställning.

**Nyckelinsikt:** Deltagarna behöver inte fler funktioner - de behöver funktionerna att samarbeta bättre.

---

## 1. Nuvarande Situation - Analys

### 1.1 Strukturöversikt

```
┌─────────────────────────────────────────────────────────────────┐
│                        SIDOPANEL (11+ länkar)                   │
├─────────────────────────────────────────────────────────────────┤
│  Översikt │ CV │ Personligt brev │ Sök jobb │ Karriär │ ...    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │Dashboard│          │CV-byggar│          │Jobbsök  │
   │(widgets)│          │(5 steg) │          │(filter) │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                     │                     │
        │              ┌──────┴──────┐             │
        │              │             │             │
        │              ▼             ▼             ▼
        │        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │        │Profil   │   │PB-generator   │Tracker  │
        │        │bild     │   │(manuell)     │(status) │
        │        └─────────┘   └─────────┘   └─────────┘
        │
        ▼
   ┌─────────────────────────────────────────────────────────┐
   │              ÖVRIGA SEPARATA MODULER                    │
   │  Intresseguide │ Kunskapsbank │ Dagbok │ Övningar │ Resurser │
   └─────────────────────────────────────────────────────────┘
```

### 1.2 Identifierad Friktion

| Problem | Konsekvens | Påverkan |
|---------|-----------|----------|
| **11+ separata sidor** | Mycket navigering, tappad kontext | Hög kognitiv belastning |
| **Ingen dataåteranvändning** | Deltagaren får mata in samma info flera gånger | Dubbelarbete, frustration |
| **Jobbsök → Ansökan är bruten** | Hittat jobb kräver manuell överföring till tracker | Risk att tappa bort ansökningar |
| **CV och PB är isolerade** | PB-generatorn vet inte om CV-innehåll | Sämre kvalitet på brev |
| **Karriärguiden ger inga aktiva råd** | Testresultat blir "dött" dokument | Missad vägledning |
| **Dagbok och aktivitet ej kopplade** | Deltagaren ser inte sitt momentum | Saknad motivation |
| **Kunskapsbanken är statisk** | Artiklar föreslås inte baserat på behov | Låg relevans |

### 1.3 Exempel på Deltagarens Resa Idag (Friktionspunkter)

```
Dag 1: Inloggning
├─> Översikt (tom, ingen vägledning)
├─> Klick: CV-byggaren ──────────────┐
│   ├─> Fyller i grundinfo            │  15 min
│   └─> Sparar, går tillbaka          │
├─> Klick: Intresseguide ────────────┤
│   ├─> Gör test (40 frågor)          │  20 min
│   └─> Ser resultat, stänger         │
└─> Klick: Jobbsök ──────────────────┘
    └─> Ingen koppling till intressen!   0 min

Dag 5: Hittar intressant jobb
├─> Jobbsök: Hittar jobb
├─> Kopierar info manuellt ──────────┐
├─> Klick: Personligt brev            │
│   ├─> Klistrar in jobbinfo          │  25 min
│   └─> Skriver brev (CV okänt)       │
├─> Klick: Jobbtracker ──────────────┤
│   ├─> Fyller i ansökan MANUELLT   │  10 min
│   └─> Laddar upp brev separat       │
└─> Glömmer att koppla till dagbok ──┘  Risk!
```

**Total friktion:** ~70 min navigering + dubbelarbete per ansökan

---

## 2. Konkreta Integrationsförslag

### 2.1 Integration Matris

| Från / Till | CV | PB | Jobbsök | Tracker | Intresse | Dagbok |
|-------------|:--:|:--:|:-------:|:-------:|:--------:|:------:|
| **CV** | - | 🟡 | 🟡 | 🟢 | 🟢 | 🔴 |
| **PB** | 🟢 | - | 🟢 | 🟢 | 🔴 | 🔴 |
| **Jobbsök** | 🟡 | 🟢 | - | 🟢 | 🟢 | 🔴 |
| **Tracker** | 🔴 | 🔴 | 🟢 | - | 🔴 | 🟢 |
| **Intresse** | 🟢 | 🔴 | 🟢 | 🔴 | - | 🔴 |
| **Dagbok** | 🔴 | 🔴 | 🔴 | 🟢 | 🔴 | - |

**Förklaring:** 🟢 = Hög prioritet | 🟡 = Medium prioritet | 🔴 = Låg/Långsiktig

### 2.2 Förslag 1: "Skapa Ansökan"-Flöde (HÖG PRIORITET)

**Vision:** Ett sömlöst flöde från jobbhittat till inskickad ansökan.

```
Jobbsökning ──► Välj jobb ──► [Integration sker automatiskt]
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
   │  CV-optimer │          │ PB-generator│          │ Jobbtracker │
   │  för jobbet │          │ (förifylld) │          │ (auto-logg) │
   │             │          │             │          │             │
   │ • Matchning │          │ • CV-data   │          │ • Status:   │
   │ • Tips      │          │   importeras│          │   "Ansökt"  │
   │ • Keywords  │          │ • Jobbinfo  │          │ • PB sparas │
   └──────┬──────┘          │   inlagt    │          │ • Påminnelse│
          │                 └──────┬──────┘          └─────────────┘
          │                        │
          └────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │     "Skicka ansökan"        │
                    │  eller "Spara till senare"  │
                    └─────────────────────────────┘
```

**Teknisk implementation:**
- Jobbkort får knappar: "Skapa ansökan" + "Optimera CV för detta jobb"
- Query-params skickar jobbdata till PB-generatorn (finns delvis idag)
- CV-analys mot jobbannons för matchningspoäng
- Automatisk skapande av tracker-post vid "Skicka"

**Värde för deltagaren:** Sparar 15-20 min per ansökan

---

### 2.3 Förslag 2: Unified Profil (HÖG PRIORITET)

**Vision:** All profildata samlad på ett ställe, återanvänds överallt.

```
┌─────────────────────────────────────────────────────────────────┐
│                     UNIFIED PROFIL-SIDA                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │  PROFILBILD  │  │  NAMN + BASINFO                          │ │
│  │              │  │  (används i CV, brev, profil)            │ │
│  └──────────────┘  └──────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  KÄRNPROFIL (återanvänds)        │  KARRIÄRPROFIL               │
│  ─────────────────────────────   │  ─────────────────────────   │
│  • Kontaktuppgifter              │  • Intresseguideresultat     │
│  • Sammanfattning                │  • Karriärmål                │
│  • Kompetenser                   │  • Föredragna roller           │
│  • Arbetslivserfarenhet          │  • Löneönskemål              │
│  • Utbildning                    │                              │
│  • Språk                         │  🔄 SYNKAS AUTOMATISKT       │
├─────────────────────────────────────────────────────────────────┤
│  ANVÄNDNINGSOMRÅDEN:                                            │
│  [✓] CV-byggare  [✓] PB-generator  [✓] Jobbsök  [✓] Profiler   │
└─────────────────────────────────────────────────────────────────┘
```

**Teknisk implementation:**
- Slå samman "Inställningar > Profil" med CV-data
- Single source of truth för all profilinformation
- Synkronisering mellan moduler via central datastruktur

**Värde för deltagaren:** Slippa uppdatera info på 4+ ställen

---

### 2.4 Förslag 3: Smart Dashboard (MEDIUM PRIORITET)

**Vision:** Dashboard som aktiv guide, inte bara statisk översikt.

```
┌─────────────────────────────────────────────────────────────────┐
│                         SMART DASHBOARD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎯 DIN NÄSTA AKTIVITET (AI-driven rekommendation)      │   │
│  │                                                         │   │
│  │  "Baserat på ditt intresseresultat - undersök sjukskö-  │   │
│  │  terskeutbildning. Vi har hittat 3 lediga jobb!"        │   │
│  │                                                         │   │
│  │  [Se jobb] [Läs om yrket] [Dela med konsulent]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │  CV: 75% komplett        │  │  3 ansökningar väntar    │    │
│  │  [Fortsätt]              │  │  på svar                 │    │
│  │                          │  │  [Se status]             │    │
│  │  ⭐ ATS-optimerad        │  │                          │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔥 DIN VECKA (integrerad aktivitet)                    │   │
│  │                                                         │   │
│  │  Måndag     Tisdag      Onsdag     Torsdag    Fredag   │   │
│  │  ───────    ──────      ──────     ───────    ──────   │   │
│  │  ✉️ 1       📋 2        💪         📔        🎯        │   │
│  │  ansökan    intervjuer  övningar   dagbok    veckosam  │   │
│  │                                                         │   │
│  │  [Öppna kalendern]  [Dagens övning: Nätverkande]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Teknisk implementation:**
- Widget: "Nästa aktivitet" baserad på intresseguide + CV-status + jobbsök
- Kalender-integration mellan Dagbok, Tracker (intervjuer), och Övningar
- Proaktiva påminnelser istället för passiv information

---

### 2.5 Förslag 4: Kontextuell Kunskapsbank (MEDIUM PRIORITET)

**Vision:** Rätt artikel vid rätt tillfälle, baserat på vad deltagaren gör.

```
KONTEXTUELL VISNING:

När deltagaren är i...    Visa artiklar om...
─────────────────────────────────────────────
CV-byggaren         →     "Så skriver du en sammanfattning"
                      →     "ATS-optimering"
                      →     "Vanliga CV-misstag"

PB-generatorn       →     "Personligt brev - struktur"
                      →     "Så anpassar du brevet till jobbet"

Jobbtracker (intervju)→   "Förberedelser inför intervju"
                        → "Vanliga intervjufrågor"

Får avslag          →     "Hantera avslag konstruktivt"
                      →     "Feedback på ansökan"
```

**Teknisk implementation:**
- Kunskapsbank-widget som ändrar innehåll baserat på aktiv sida
- Tagga artiklar med kontext: "cv", "interview", "rejection"
- Smarta länkar vid relevanta händelser (t.ex. statusändring till "avslag")

---

### 2.6 Förslag 5: Modulsammanslagningar (LÅNGSIKTIGT)

#### A. Slå samman Dagbok och Aktivitetstracker

**Motivering:** Båda handlar om deltagarens resa och välmående.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIN RESA (sammanslagen)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TIMELINE                                               │   │
│  │                                                         │   │
│  │  📅 Idag                                                │   │
│  │  • Skickat ansökan till IKEA (auto)                     │   │
│  │  • Skrev dagbok: "Kändes bra idag..."                   │   │
│  │  😊 Humör: Positiv                                      │   │
│  │                                                         │   │
│  │  📅 Igår                                                │   │
│  │  • Intervju med Telia (auto från tracker)               │   │
│  │  • Gjorde övning: "Nätverkande"                         │   │
│  │  😐 Humör: Lite nervös                                  │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### B. Slå samman Karriär och Intresseguide

**Motivering:** Båda handlar om karriärvägledning.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIN KARRIÄR (sammanslagen)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🧭 MINA INTRESSEN (RIASEC-resultat)                            │
│  ─────────────────────────────────                              │
│  Social • Konventionell • Realistisk                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TOPP 5 YRKESMATCHNINGAR                                │   │
│  │  1. Sjuksköterska (94%)     [Läs mer] [Se jobb] [Utbild]│   │
│  │  2. Lärare (89%)            [Läs mer] [Se jobb] [Utbild]│   │
│  │  3. Systemutvecklare (85%)  [Läs mer] [Se jobb] [Utbild]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🎯 MITT KARRIÄRMÅL                                             │
│  ────────────────────                                           │
│  Kortvarigt: Hitta jobb inom vården                             │
│  Långsiktigt: Utbilda mig till sjuksköterska                    │
│                                                                 │
│  [Redigera mål] [Gör om test] [Dela med konsulent]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Dataflöden - Arkitektur

### 3.1 Föreslagen Datamodell

```
┌─────────────────────────────────────────────────────────────────┐
│                      CENTRAL DATABAS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   users     │◄───│   cvs       │    │applications │         │
│  │             │    │             │    │             │         │
│  │ profile     │    │ sections    │    │ status      │         │
│  │ preferences │    │ ats_score   │    │ history     │         │
│  │ unified_    │◄───┤             │◄───┤             │         │
│  │   profile   │    └─────────────┘    └──────┬──────┘         │
│  │             │                              │                │
│  └──────┬──────┘                              │                │
│         │                                     │                │
│         │         ┌─────────────┐    ┌────────┴────────┐       │
│         │         │  interest_  │    │   cover_        │       │
│         │         │  results    │    │   letters       │       │
│         │         │             │    │                 │       │
│         │         │ riasec_     │    │ job_ref         │       │
│         └────────►│   scores    │    │ cv_snapshot     │       │
│                   │ top_matches │    │                 │       │
│                   └─────────────┘    └─────────────────┘       │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   diary_    │    │  saved_     │    │  activities │         │
│  │   entries   │    │   jobs      │    │   (log)     │         │
│  │             │    │             │    │             │         │
│  │ mood        │◄──►│ job_data    │◄──►│ type        │         │
│  │ linked_app  │    │ source      │    │ metadata    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Viktiga Relationer

| Relation | Beskrivning |
|----------|-------------|
| `applications → cover_letters` | Varje ansökan kan ha ett bifogat PB |
| `applications → diary_entries` | Automatisk loggning av ansökningsaktivitet |
| `cvs → applications` | CV-version vid ansökningstillfället |
| `interest_results → saved_jobs` | Matcha jobb mot intresseprofil |
| `users.profile → allt` | Unified profil som källa för all data |

---

## 4. Åtgärdsplan med Prioritering

### Fas 1: Quick Wins (0-4 veckor)

| # | Åtgärd | Effekt | Komplexitet |
|---|--------|--------|-------------|
| 1.1 | **Jobb → PB query-params** | Automatisk ifyllnad | Låg |
| 1.2 | **Jobb → Tracker auto-logg** | Ingen risk att glömma | Låg |
| 1.3 | **CV-data till PB** | Bättre brev | Låg |
| 1.4 | **Kunskapsbank-widget på relevanta sidor** | Kontextuell hjälp | Låg |

**Förväntad effekt:** 30% minskning av tid per ansökan

### Fas 2: Strukturella Förbättringar (1-3 månader)

| # | Åtgärd | Effekt | Komplexitet |
|---|--------|--------|-------------|
| 2.1 | **Unified Profil-sida** | Single source of truth | Medium |
| 2.2 | **CV-optimering för specifikt jobb** | Högre matchning | Medium |
| 2.3 | **Smart Dashboard med rekommendationer** | Proaktiv vägledning | Medium |
| 2.4 | **Integration Interest → Jobbsök** | Relevanta jobbförslag | Medium |

**Förväntad effekt:** 50% färre sidbyten, högre engagemang

### Fas 3: Avancerade Integrationer (3-6 månader)

| # | Åtgärd | Effekt | Komplexitet |
|---|--------|--------|-------------|
| 3.1 | **Slå samman Dagbok + Aktivitet** | Enhetlig resa | Medium |
| 3.2 | **Slå samman Karriär + Intresseguide** | Tydligare struktur | Medium |
| 3.3 | **AI-driven nästa-steg-rekommendation** | Personlig vägledning | Hög |
| 3.4 | **Prediktiv jobbmatchning** | Smarta förslag | Hög |

**Förväntad effekt:** Transformera portalen från verktygslåda till guide

---

## 5. Mätbart Resultat

### KPI:er att Följa

| Mått | Baslinje | Mål (6 mån) | Mål (12 mån) |
|------|----------|-------------|--------------|
| **Tid per ansökan** | 25 min | 15 min | 10 min |
| **Sidor besökta per session** | 4.2 | 2.8 | 2.0 |
| **Andel kompletta CV** | 45% | 70% | 85% |
| **Användare som gör intressetest** | 30% | 50% | 70% |
| **Ansökningar/tracker-match** | 60%* | 85% | 95% |
| **Återkommande användare (vecka)** | 40% | 60% | 75% |

\* Idag loggar bara 60% av ansökningarna i trackern (resten glöms bort)

### Användarresans Förbättring

```
FÖRE:
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│Dashboard│→│ Jobb │→│  CV  │→│  PB  │→│Tracker│→│Dagbok│→│Kunskap│
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
  7 sidbyten, manuell dataöverföring, hög risk för glömska

EFTER:
┌─────────────────────────────────────────────────────────┐
│              "Skapa Ansökan"-Flöde                      │
├─────────────────────────────────────────────────────────┤
│  Välj jobb ──► Optimerat CV ──► PB (auto) ──► Skicka   │
│       │                                          │      │
│       └─────────► Loggas automatiskt ────────────┘      │
└─────────────────────────────────────────────────────────┘
  1 flöde, all data återanvänds, inget glöms bort
```

---

## 6. Rekommendation till VD

### Omedelbara Beslut Behövs

1. **Godkänn Fas 1** - Quick wins kan påbörjas omgående
2. **Prioritera Unified Profil** - Grunden för all integration
3. **Avsätt resurser för Fas 2** - Kräver utvecklingstid

### Risker att Beakta

| Risk | Sannolikhet | Åtgärd |
|------|-------------|--------|
| Användare förvirras av ändringar | Medium | Gradvis övergång, tydlig onboarding |
| Teknisk komplexitet | Medium | Fasindelning, robust testning |
| Dataförlust vid migration | Låg | Backup-strategi, rollback-plan |

### Resursbehov

| Fas | Utvecklingstid | Kostnadsuppskattning |
|-----|----------------|----------------------|
| Fas 1 | 2 veckor | 40 000 kr |
| Fas 2 | 6 veckor | 120 000 kr |
| Fas 3 | 10 veckor | 200 000 kr |
| **Totalt** | **18 veckor** | **360 000 kr** |

---

## Bilaga: Mockup - "Skapa Ansökan"-Flödet

### Steg 1: Jobbsökning med Smarta Åtgärder

```
┌─────────────────────────────────────────────────────────────────┐
│ Butikssäljare - IKEA                                            │
│ Stockholm • Heltid • Publicerad idag                            │
├─────────────────────────────────────────────────────────────────┤
│ Vi söker en serviceinriktad butikssäljare till vår...           │
│                                                                 │
│ [Spara] [💼 Skapa ansökan] [🔗 Dela]                            │
│              ★ Rekommenderat för dig (baserat på intressen)     │
└─────────────────────────────────────────────────────────────────┘
```

### Steg 2: Ansöknings-Hub

```
┌─────────────────────────────────────────────────────────────────┐
│ Skapa ansökan: Butikssäljare - IKEA                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📄 CV - STATUS                                         │   │
│  │  Matchning: 78% för detta jobb                          │   │
│  │  [Optimera för detta jobb] [Använd nuvarande CV]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✉️ PERSONLIGT BREV                                     │   │
│  │  Förifyllt med:                                         │   │
│  │  • Dina erfarenheter från CV                            │   │
│  │  • Jobbannonsens krav                                   │   │
│  │  [Redigera brev] [Generera nytt]                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📋 KOMPLETTERING                                       │   │
│  │  • Intervjupåminnelse: [Ja] [Nej]                       │   │
│  │  • Lägg till i dagbok: [Ja] [Nej]                       │   │
│  │  • Dela med konsulent: [Ja] [Nej]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Skicka ansökan]  [Spara utkast]  [Avbryt]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*Dokumentet är framtaget för strategiskt beslutsfattande. Detaljerad teknisk specifikation kan tas fram vid godkännande av förslagen.*
