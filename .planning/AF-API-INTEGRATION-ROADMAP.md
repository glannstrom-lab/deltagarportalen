# Arbetsförmedlingen API Integration Roadmap

> 62 förslag för att integrera Arbetsförmedlingens API:er i Jobin.se

## Bekräftade API:er

| API | URL | Data | Antal poster |
|-----|-----|------|--------------|
| **JobSearch** | jobsearch.api.jobtechdev.se | Aktiva jobb | ~50,000 |
| **Historical** | historical.api.jobtechdev.se | Historiska jobb | 7,800,000+ |
| **JobAd Links** | links.api.jobtechdev.se | Externa jobb | ~51,000 |
| **Taxonomy** | taxonomy.api.jobtechdev.se | Yrken, kompetenser | 1000+ koncept |
| **JobEd Connect** | jobed-connect-api.jobtechdev.se | Utbildning→Yrke | Relationsdata |

---

## JOBBSÖKNING (10 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 1 | **Geografisk Jobbkarta** | JobSearch | ❌ REMOVED | Borttagen - inte tillräckligt användbar |
| 2 | **Ett Jobb Om Dagen** | JobSearch | ✅ DONE | Presentera ETT noggrant utvalt jobb per dag för att minska överväldigande |
| 3 | **Energianpassad Sökning** | JobSearch | ✅ DONE | Filtrera på deltid/distans när användaren har låg energi |
| 4 | **Dolda Jobbmarknaden** | JobAd Links + JobSearch | ✅ DONE | Visa 51,000 jobb från LinkedIn/Indeed som inte finns på Platsbanken |
| 5 | **Röstbaserad Jobbsökning** | JobSearch + Taxonomy | ✅ DONE | Sök jobb genom att prata - tillgängligt för synskadade/dyslektiker |
| 6 | **Förenklade Jobbkort** | JobSearch | ✅ DONE | Progressiv information - visa först titel/plats, expandera för mer |
| 7 | **Geografisk Komfortzon** | JobSearch | ❌ REMOVED | Borttagen tillsammans med jobbkartan |
| 8 | **Konkurrens-Indikator** | Historical + JobSearch | ✅ DONE | Visa uppskattad konkurrens baserat på hur länge annonser ligger uppe |
| 9 | **Säsongsanpassade Jobb** | Historical + JobSearch | ✅ DONE | Visa sommarjobb/julextra vid rätt tidpunkt automatiskt |
| 10 | **Språkbaserad Matchning** | Taxonomy + JobSearch | ✅ DONE | Hitta jobb där dina språkkunskaper efterfrågas |

---

## CV & PERSONLIGT BREV (6 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 11 | **CV-Optimerare mot Annonser** | JobSearch + Taxonomy | ⬜ TODO | Extrahera must_have från annonser och föreslå CV-ändringar |
| 12 | **Personligt Brev med Annonsanalys** | JobSearch | ⬜ TODO | Generera brev som direkt adresserar varje krav i annonsen |
| 13 | **Kompetensvalidering** | Historical + Taxonomy | ⬜ TODO | "Din kundservice-erfarenhet efterfrågades i 45,000 annonser" |
| 14 | **Nyckelords-Scanner** | JobSearch | ⬜ TODO | Identifiera de vanligaste nyckelorden i din bransch |
| 15 | **ATS-Optimerare** | Taxonomy + JobSearch | ⬜ TODO | Använd exakt samma terminologi som arbetsgivare använder |
| 16 | **Erfarenhets-Booster** | Taxonomy | ⬜ TODO | Översätt icke-arbetsrelaterad erfarenhet till kompetenser |

---

## KOMPETENSANALYS (8 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 17 | **Smart Kompetens-Gap** | Taxonomy + JobSearch | ⬜ TODO | Visa exakt vilka kompetenser som saknas för drömyrket |
| 18 | **Utbildnings-ROI-Kalkyl** | JobEd Connect + Historical | ⬜ TODO | "Excel-kurs ökar matchande jobb från 45 till 180" |
| 19 | **Dolda Superkrafter** | Taxonomy | ⬜ TODO | Hitta överförbara kompetenser från oväntade erfarenheter |
| 20 | **Mikro-Lärande** | JobSearch + Taxonomy | ⬜ TODO | Identifiera snabbt lärda kompetenser som ofta efterfrågas |
| 21 | **Kompetens-Trend-Analys** | Historical | ⬜ TODO | "Python-efterfrågan ökat 340% sedan 2019 i din region" |
| 22 | **Gap-Bryggan** | Taxonomy + JobSearch | ⬜ TODO | Visa kortaste vägen (minsta gap) till nytt yrke |
| 23 | **Framtidssäkra Profilen** | Historical + Taxonomy | ⬜ TODO | Vilka kompetenser kommer efterfrågas om 2-5 år? |
| 24 | **Certifierings-Prioriterare** | JobSearch | ⬜ TODO | Vilka certifieringar ger störst jobbboost? |

---

## KARRIÄR & ARBETSMARKNAD (8 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 25 | **Bransch-Radar** | Historical + JobSearch | ✅ DONE | Visa växande/krympande branscher med 8 års data |
| 26 | **Regional Jobbpuls** | JobSearch | ⬜ TODO | Live-statistik: nya jobb idag, trender per region |
| 27 | **Yrkesradar** | Historical + JobSearch | ⬜ TODO | Trender över tid för specifika yrken med grafer |
| 28 | **Karriärvägs-Kartläggare** | Historical + Taxonomy | ⬜ TODO | "Personer med din bakgrund gick ofta vidare till..." |
| 29 | **Utbildning-till-Jobb Navigator** | JobEd Connect + JobSearch | ⬜ TODO | Visa konkreta jobb baserat på din utbildning |
| 30 | **Framgångs-Prediktor** | Historical + Taxonomy | ⬜ TODO | Sannolikhet för anställning inom olika tidsramar |
| 31 | **Bransch-Barometer** | Historical | ⬜ TODO | Är branschen på uppgång eller nedgång? |
| 32 | **Säsongsmönster** | Historical | ⬜ TODO | När rekryterar olika branscher mest? |

---

## LÖN & FÖRHANDLING (4 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 33 | **Dynamisk Lönekalkylator** | JobSearch + Historical | ⬜ TODO | Löneutveckling över tid per yrke och region |
| 34 | **Förhandlingsunderlag** | Historical | ⬜ TODO | Datadrivna argument: "Andelen fast lön ökat med X%" |
| 35 | **Regional Lönejämförelse** | JobSearch | ⬜ TODO | Jämför löneläge mellan regioner för samma yrke |
| 36 | **Lönetrend-Prognos** | Historical | ⬜ TODO | Prognos baserad på 8 års historisk data |

---

## SPONTANANSÖKAN & FÖRETAG (6 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 37 | **Företags-Insiktsverktyg** | JobSearch + Historical | ⬜ TODO | Visa företagets rekryteringsmönster och efterfrågade kompetenser |
| 38 | **Arbetsgivar-Bevakare** | JobSearch + Historical | ⬜ TODO | Identifiera företag som regelbundet rekryterar |
| 39 | **Dolda Rekryterare** | JobAd Links | ⬜ TODO | Företag som annonserar externt men inte på AF |
| 40 | **Rekryteringscykel** | Historical | ⬜ TODO | När brukar företaget anställa? Optimal tidpunkt för kontakt |
| 41 | **Bransch-Företagslista** | JobSearch | ⬜ TODO | Alla arbetsgivare inom en bransch i din region |
| 42 | **Kontaktpersons-Analys** | JobSearch | ⬜ TODO | Vanliga titlar på rekryterande chefer per bransch |

---

## INTERVJU (3 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 43 | **Branschspecifika Intervjufrågor** | Taxonomy + JobSearch | ⬜ TODO | Generera frågor baserat på vanliga kompetenskrav |
| 44 | **Företagsspecifik Förberedelse** | JobSearch + Historical | ⬜ TODO | Vad brukar företaget efterfråga? |
| 45 | **Kompetensbevis-Genererare** | Taxonomy | ⬜ TODO | Förslag på STAR-svar för varje efterfrågad kompetens |

---

## ANSÖKNINGSHANTERING (3 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 46 | **Smart Deadline-Tracker** | JobSearch | ⬜ TODO | Prioritera baserat på matchning, tid kvar, konkurrens |
| 47 | **Batch-Ansökningar** | JobSearch | ⬜ TODO | Hitta liknande jobb och ansök till flera samtidigt |
| 48 | **Ansöknings-Statistik** | Historical | ⬜ TODO | Jämför din aktivitet med genomsnitt för yrket |

---

## WELLNESS & DAGBOK (4 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 49 | **Dagbok med Marknadskontext** | JobSearch + Historical | ⬜ TODO | "Det finns 2,340 liknande jobb - konkurrensen är hög" |
| 50 | **Framstegsfiering** | JobSearch | ⬜ TODO | "Du har sökt fler jobb än genomsnittet för din yrkesgrupp" |
| 51 | **Jobb Som Dig** | Historical | ⬜ TODO | "423 personer med liknande bakgrund söker också jobb" |
| 52 | **Hopp-Indikatorn** | Historical | ⬜ TODO | "67 personer med din profil fick jobb förra månaden" |

---

## KONSULTVERKTYG (8 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 53 | **Deltagaröversikt med Marknadspuls** | JobSearch + Historical | ⬜ TODO | "3 nya jobb inom Annas område denna vecka" |
| 54 | **Smart Jobb-Pushare** | JobSearch | ⬜ TODO | Automatisk matchning varje morgon för alla deltagare |
| 55 | **Dokumentations-Assistent** | JobSearch | ⬜ TODO | Auto-genererade uppföljningstexter med marknadsdata |
| 56 | **Batch-Sökaren** | JobSearch | ⬜ TODO | "Vilka av mina deltagare matchar detta jobb?" |
| 57 | **Motivations-Trigger** | JobSearch | ⬜ TODO | Alert när perfekt jobb dyker upp för deltagare |
| 58 | **Grupp-Workshop-Generator** | JobSearch + Taxonomy | ⬜ TODO | Skräddarsytt workshopmaterial baserat på deltagargrupp |
| 59 | **Realistiska Förväntningar** | Historical | ⬜ TODO | Genomsnittlig tid till anställning per yrke/region |
| 60 | **Gruppmatchning** | Taxonomy | ⬜ TODO | Identifiera deltagare med liknande mål för gruppaktiviteter |

---

## INTERNATIONELLT (2 förslag)

| # | Namn | API | Status | Beskrivning |
|---|------|-----|--------|-------------|
| 61 | **Språkvärde-Kalkylator** | Taxonomy + JobSearch | ⬜ TODO | Hur många fler jobb öppnas om du lär dig ett språk? |
| 62 | **Integrationsvägar** | JobEd Connect + JobSearch | ⬜ TODO | Vilka yrken är lättast att komma in i som nyanländ? |

---

## Implementeringsordning

### Fas 1: Jobbsökning ✅ KLAR
- [x] #1 Geografisk Jobbkarta
- [x] #2 Ett Jobb Om Dagen
- [x] #3 Energianpassad Sökning
- [x] #4 Dolda Jobbmarknaden
- [x] #5 Röstbaserad Jobbsökning
- [x] #6 Förenklade Jobbkort
- [x] #7 Geografisk Komfortzon
- [x] #8 Konkurrens-Indikator
- [x] #9 Säsongsanpassade Jobb
- [x] #10 Språkbaserad Matchning

### Fas 2: CV & Personligt Brev
- [ ] #11-16

### Fas 3: Kompetensanalys
- [ ] #17-24

### Fas 4: Karriär & Arbetsmarknad
- [ ] #26-32 (25 redan klar)

### Fas 5: Övriga sidor
- [ ] Lön, Spontan, Intervju, Ansökningar, Wellness, Konsult, International

---

## Progress Tracker

- **Total:** 62 förslag
- **Klara:** 9 (14.5%)
- **Borttagna:** 2
- **Kvar:** 51

### Implementerade funktioner (Fas 1 - Jobbsökning):
- ❌ ~~Geografisk Jobbkarta~~ (borttagen - inte tillräckligt användbar)
- ✅ Ett Jobb Om Dagen för användare som behöver ta det lugnt (DailyJobTab)
- ✅ Energianpassad Sökning med deltid/distans-filter (EnergySearch)
- ✅ Dolda Jobbmarknaden via JobAd Links API (HiddenJobsTab)
- ✅ Röstbaserad Jobbsökning med Web Speech API (VoiceSearch)
- ✅ Förenklade Jobbkort med progressiv disclosure (EnergySearch)
- ❌ ~~Geografisk Komfortzon~~ (borttagen tillsammans med jobbkartan)
- ✅ Konkurrens-Indikator baserat på annonsålder (SmartFilters)
- ✅ Säsongsanpassade Jobb (sommar/jul) (SmartFilters)
- ✅ Språkbaserad Matchning för flerspråkiga (SmartFilters)
- ✅ Bransch-Radar med marknadsdata (LaborMarketTab - redan implementerad)

*Senast uppdaterad: 2026-04-17*
