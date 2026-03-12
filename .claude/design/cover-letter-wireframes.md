# 📝 Personligt Brev - Wireframes & Designförslag

**Datum:** 2026-03-11  
**UX-Designer:** Agent  
**Status:** Förslag för granskning

---

## 📐 Övergripande Struktur

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Personligt Brev                    [+ Skapa nytt brev]        │ │
│  │  Skriv övertygande brev med AI-hjälp  [📋 Klistra in annons]   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  TABS (PageTabs-komponent)                                           │
│  [Alla brev] [Nytt brev] [Ansökningar] [Mallar] [Statistik]         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CONTENT AREA (varierar per tab)                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ TAB: Alla brev

### Layout: Kort-baserad lista (likt Mina CV)

```
┌─────────────────────────────────────────────────────────────────────┐
│  FILTERBAR                                                           │
│  ┌────────────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ 🔍 Sök brev...         │  │ Alla företag ▼   │  │ Nyast ▼     │ │
│  └────────────────────────┘  └──────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  ┌────┐                                                          │ │
│  │  │📄  │  Butikssäljare på ICA Maxi              [📝] [📋] [⋮]  │ │
│  │  │v  │  ICA Maxi • Butik & Handel                          │ │
│  │  └────┘  Skapat 12 mars • Använt 3 gånger • 320 ord           │ │
│  │       [Aktiv] [Standard]                                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  ┌────┐                                                          │ │
│  │  │📄  │  Kundtjänstmedarbetare                  [📝] [📋] [⋮]  │ │
│  │  │v  │  Tele2 • Kontor & Admin                             │ │
│  │  └────┘  Skapat 8 mars • Använt 1 gång • 280 ord              │ │
│  │       [Utkast]                                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  ┌────┐                                                          │ │
│  │  │📄  │  Lagerarbetare - Sommarjobb             [📝] [📋] [⋮]  │ │
│  │  │v  │  DHL • Lager & Logistik                             │ │
│  │  └────┘  Skapat 1 mars • Använt 0 gånger • 250 ord            │ │
│  │       [Utkast]                                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  TIPS-KORT                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  💡 Tips: Återanvänd dina brev                                  │ │
│  │  Ett bra personligt brev kan anpassas för flera liknande jobb.  │ │
│  │  Duplicera och ändra bara företagsnamn och specifika detaljer.  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Komponent-specifikation: Cover Letter Card

```typescript
interface CoverLetterCardProps {
  id: string
  title: string              // "Butikssäljare på ICA Maxi"
  company: string            // "ICA Maxi"
  jobTitle?: string          // "Butikssäljare"
  category: string           // "Butik & Handel"
  createdAt: Date
  updatedAt: Date
  usageCount: number         // Hur många gånger använt
  wordCount: number
  status: 'draft' | 'active' | 'archived'
  isDefault?: boolean        // Standard-brev för kategori
  hasAIHelp?: boolean        // Om AI användes
}
```

### Actions per brev (i dropdown-meny)

| Ikon | Action | Beskrivning |
|------|--------|-------------|
| 📝 | Redigera | Öppna i editorn |
| 📋 | Duplicera | Skapa kopia |
| 📨 | Skicka | Koppla till ansökan |
| 🌟 | Sätt som standard | Använd som mall för kategori |
| 📥 | Ladda ner | PDF eller Word |
| 🗑️ | Radera | Flytta till papperskorg |

---

## 2️⃣ TAB: Nytt brev

### Layout: Steg-för-steg guide (wizard)

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP INDICATOR                                                      │
│  ┌─────○─────○─────○─────○─────┐                                    │
│  │  1  │  2  │  3  │  4  │  5  │                                    │
│  │ ●───○───○───○───○          │  (Step 1 aktiv)                    │
│  │Info │Mall │Fyll │AI   │Klar │                                    │
│  └─────────────────────────────┘                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STEP 1: Jobbinformation                                             │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Först behöver vi veta lite om jobbet du söker                  │ │
│  │                                                                  │ │
│  │  Jobbtitel *                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │ Butikssäljare                                             │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                  │ │
│  │  Företag *                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │ ICA Maxi                                                  │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                  │ │
│  │  Bransch                                                        │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │ Butik & Handel ▼                                          │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                  │ │
│  │  🚀 Snabbväg: [📋 Klistra in hela jobbannonsen här]            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│                                    [Nästa steg →]                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2: Välj mall

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Välj en mall som passar                                     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Filtrera: [Alla] [Offentlig] [Kreativ] [Tech] [Vård] [Ny]      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │  📄          │ │  🏢          │ │  🎨          │                 │
│  │  Standard    │ │  Offentlig   │ │  Kreativ     │                 │
│  │  ─────────── │ │  ─────────── │ │  ─────────── │                 │
│  │  "Jag skriver│ │  "Jag vill    │ │  "När jag    │                 │
│  │   med stort  │ │   härmed söka│ │   såg er     │                 │
│  │   intresse...│ │   tjänsten...│ │   annons..." │                 │
│  │              │ │              │ │              │                 │
│  │  ✓ Välj denna│ │  [Välj]      │ │  [Välj]      │                 │
│  └──────────────┘ └──────────────┘ └──────────────┘                 │
│                                                                      │
│  [← Föregående]                      [Nästa steg →]                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 3: Fyll i innehåll

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Skriv ditt brev                                             │
│                                                                      │
│  ┌────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │  🎯 TONALITET          │  │  VY: [Redigera] [Förhandsgranska]   │ │
│  │  ○ Formell             │  │                                      │ │
│  │  ● Professionell       │  │  Hej,                                │ │
│  │  ○ Personlig           │  │                                      │ │
│  │                        │  │  Jag skriver med stort intresse för  │ │
│  │  ✨ AI-HJÄLP           │  │  tjänsten som Butikssäljare på ICA   │ │
│  │  [💡 Förbättra text]   │  │  Maxi.                               │ │
│  │  [🔄 Formulera om]     │  │                                      │ │
│  │  [🎭 Ändra ton]        │  │  [Förslag på fortsättning...]        │ │
│  │                        │  │  ─────────────────────────────────   │ │
│  │  📊 STATUS             │  │  Med min erfarenhet av...            │ │
│  │  245/350 ord ✓         │  │  [Acceptera förslag]                │ │
│  │  Läsbarhet: Bra        │  │                                      │ │
│  │                        │  │  Jag ser fram emot att...            │ │
│  │  ⚠️ TIPS              │  │                                      │ │
│  │  Nämn varför just      │  │  Med vänliga hälsningar              │ │
│  │  detta företag!        │  │  [Ditt namn]                         │ │
│  └────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                      │
│  [← Föregående]                      [Nästa steg →]                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 4: AI-förbättring (valfritt)

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: Förbättra med AI                                            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  🤖 AI-analys av ditt brev                                      │ │
│  │                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │  STYRKA: Bra inledning som visar intresse               +3   │ │
│  │  │  STYRKA: Tydlig struktur                                +2   │ │
│  │  │  TIPS: Nämn specifikt varför ICA Maxi (inte bara ICA)   +1   │ │
│  │  │  TIPS: Lägg till ett konkret exempel på kundservice     +2   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                  │ │
│  │  Poäng: 7/10 ⭐⭐⭐⭐☆                                          │ │
│  │                                                                  │ │
│  │  [✨ Förbättra brevet automatiskt med AI]                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [← Hoppa över]                      [✨ Förbättra & fortsätt →]      │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 5: Klart!

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✅ Ditt brev är klart!                                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │              🎉                                                 │ │
│  │                                                                  │ │
│  │       "Butikssäljare på ICA Maxi"                               │ │
│  │        är sparat och redo att användas!                         │ │
│  │                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │  📄 PDF                                                │   │ │
│  │  │  Ladda ner för att skicka via mejl                     │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │  📨 Koppla till ansökan                                │   │ │
│  │  │  Spara i jobbtracker                                   │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │  📝 Skapa nytt brev                                    │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ TAB: Ansökningar

### Layout: Kanban/Pipeline-vy

```
┌─────────────────────────────────────────────────────────────────────┐
│  ÖVERSIKT                                                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │   12       │  │    5       │  │    2       │  │    1       │     │
│  │  Sparade   │  │  Skickade  │  │  Intervju  │  │   Svar     │     │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  KANBAN-VY                                                           │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐      │
│  │  💾 SPARADE  │  📨 SKICKADE │  📅 INTERVJU │  ✅ SVAR     │      │
│  │     (3)      │     (2)      │     (1)      │     (1)      │      │
│  ├──────────────┼──────────────┼──────────────┼──────────────┤      │
│  │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │      │
│  │ │Lager-    │ │ │Kund-     │ │ │Butiks-   │ │ │Vårdbitr- │ │      │
│  │ │arbetare  │ │ │tjänst    │ │ │säljare   │ │ │äde       │ │      │
│  │ │DHL       │ │ │Tele2     │ │ │Willys    │ │ │Attendo   │ │      │
│  │ │──────────│ │ │──────────│ │ │──────────│ │ │──────────│ │      │
│  │ │⏰ 3 dagar │ │ │📅 5 mars │ │ │📅 15/3  │ │ │❌ Avslag │ │      │
│  │ │           │ │ │   🟡    │ │ │   🟢    │ │ │          │ │      │
│  │ │[📨Ansök] │ │ │[Se brev] │ │ │[Förbered]│ │ │[Nytt förs]│      │
│  │ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘ │      │
│  │ ┌──────────┐ │ ┌──────────┐ │              │              │      │
│  │ │Kassa-    │ │ │Sjukskö-  │ │              │              │      │
│  │ │biträde   │ │ │terska    │ │              │              │      │
│  │ │Coop      │ │ │Sahlgren- │ │              │              │      │
│  │ │          │ │ │ska       │ │              │              │      │
│  │ │⏰ 1 vecka│ │ │📅 2 mars │ │              │              │      │
│  │ │          │ │ │   🟢    │ │              │              │      │
│  │ │[📨Ansök] │ │ │[Se brev] │ │              │              │      │
│  │ └──────────┘ │ └──────────┘ │              │              │      │
│  └──────────────┴──────────────┴──────────────┴──────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Application Card (detaljerad vy)

```
┌─────────────────────────────────────────────────────────────────────┐
│  EXPANDERAT KORT                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  ┌────┐  Butikssäljare - Willys                                │ │
│  │  │🏪  │  Willys • Butik & Handel • Göteborg                    │ │
│  │  └────┘  ───────────────────────────────────────────────────── │ │
│  │                                                                  │ │
│  │  📅 Timeline:                                                   │ │
│  │  Skickad: 12 mars 2025                                          │ │
│  │  Intervju: 15 mars kl 14:00 (bekräftad)                        │ │
│  │                                                                  │ │
│  │  📎 Dokument:                                                   │ │
│  │  [📄 CV-Butik.pdf] [📝 PB-Willys.pdf]                           │ │
│  │                                                                  │ │
│  │  📝 Anteckningar:                                               │ │
│  │  "Kontakt: Anna, HR. Ring om frågor. Ta med ID."               │ │
│  │                                                                  │ │
│  │  ⏰ Påminnelser:                                                │ │
│  │  🔔 Intervju imorgon kl 14:00!                                 │ │
│  │                                                                  │ │
│  │  [Ändra status] [Redigera] [Ta bort]                           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4️⃣ TAB: Mallar

### Layout: Grid med kategorier

```
┌─────────────────────────────────────────────────────────────────────┐
│  FILTER & SÖK                                                        │
│  ┌────────────────────────┐  ┌────────────────────────────────────┐ │
│  │ 🔍 Sök mallar...       │  │ [Alla] [Offentlig] [Kreativ] [Tech]│ │
│  └────────────────────────┘  └────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🏢 OFFENTLIG SEKTOR (3 mallar)                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │                 │
│  │ │██████████│ │ │ │██████████│ │ │ │██████████│ │                 │
│  │ │██████████│ │ │ │██████████│ │ │ │██████████│ │                 │
│  │ │██████████│ │ │ │██████████│ │ │ │██████████│ │                 │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │                 │
│  │ Kommunalt    │ │ Myndighet    │ │ Vård         │                 │
│  │ 4.8★ (124)   │ │ 4.5★ (89)    │ │ 4.7★ (156)   │                 │
│  │ [Använd]     │ │ [Använd]     │ │ [Använd]     │                 │
│  └──────────────┘ └──────────────┘ └──────────────┘                 │
│                                                                      │
│  🎨 KREATIVA YRKEN (2 mallar)                                        │
│  ┌──────────────┐ ┌──────────────┐                                  │
│  │ ┌──────────┐ │ │ ┌──────────┐ │                                  │
│  │ │  🎨  🖌️  │ │ │ │  📐  ✏️  │ │                                  │
│  │ │  🎯  💡  │ │ │ │  🎬  🎭  │ │                                  │
│  │ └──────────┘ │ │ └──────────┘ │                                  │
│  │ Design       │ │ Media        │                                  │
│  │ 4.9★ (203)   │ │ 4.6★ (67)    │                                  │
│  │ [POPULÄR]    │ │ [Använd]     │                                  │
│  │ [Använd]     │ │              │                                  │
│  └──────────────┘ └──────────────┘                                  │
│                                                                      │
│  💻 TECH & IT (2 mallar)                                             │
│  ┌──────────────┐ ┌──────────────┐                                  │
│  │ Developer    │ │ IT-Support   │                                  │
│  │ [Använd]     │ │ [Använd]     │                                  │
│  └──────────────┘ └──────────────┘                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Mall Preview Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  MALL: Kommunalt brev                                          [×] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  PREVIEW                     │  │  INFO                        │ │
│  │  ┌────────────────────────┐  │  │                              │ │
│  │  │                        │  │  │  ⭐ 4.8/5 (124 betyg)        │ │
│  │  │   [Mallens utseende    │  │  │  📥 1,234 nedladdningar      │ │
│  │  │    renderas här som    │  │  │                              │ │
│  │  │    en preview-bild]    │  │  │  📝 Beskrivning:            │ │
│  │  │                        │  │  │  Formell ton för kommunal   │ │
│  │  │  "Jag vill härmed..."  │  │  │  verksamhet. Fokuserar på   │ │
│  │  │                        │  │  │  samhällsnytta.             │ │
│  │  └────────────────────────┘  │  │                              │ │
│  │                              │  │  🏷️ Taggar:                  │ │
│  │  [◀] Förhandsgranska [▶]    │  │  #kommun #formell #offentlig │ │
│  │                              │  │                              │ │
│  └──────────────────────────────┘  │  💡 Tips för denna mall:      │ │
│                                    │  • Anpassa för specifik kommun│ │
│                                    │  • Nämn erfarenhet av service │ │
│                                    │  • Var formell men inte stel  │ │
│                                    │                              │ │
│                                    │  [📝 Använd denna mall]       │ │
│                                    └──────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ TAB: Statistik

### Layout: Dashboard med grafer och insikter

```
┌─────────────────────────────────────────────────────────────────────┐
│  ÖVERBLICK - Mina siffror                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │     15       │  │     8        │  │     3        │  │     40%      ││
│  │  Brev        │  │  Skickade    │  │  Intervjuer  │  │ Svarsfrekvens││
│  │  skrivna     │  │  ansökningar │  │  bokade      │  │  (3/8)       ││
│  │   📄         │  │    📨        │  │    📅        │  │    📊        ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  AKTIVITET ÖVER TID          │  │  STATUSFÖRDELNING            │ │
│  │                              │  │                              │ │
│  │  8│      ╱╲                  │  │         ██                   │ │
│  │  7│     ╱  ╲                 │  │    ██  ████  ██             │ │
│  │  6│    ╱    ╲    ╱╲          │  │   ████ ████ ████            │ │
│  │  5│   ╱      ╲  ╱  ╲         │  │   ████ ████ ████            │ │
│  │  4│  ╱        ╲╱    ╲        │  │   ████ ████ ████            │ │
│  │  3│ ╱                ╲       │  │   ████ ████ ████            │ │
│  │  2│╱                  ╲      │  │   Spar Skick Interv         │ │
│  │  1└────────────────────      │  │   (5)  (3)   (2)            │ │
│  │    V9 V10 V11 V12 V13        │  │                              │ │
│  │                              │  │                              │ │
│  │  ─ Skickade ansökningar      │  │  [📅 Visa kalender]          │ │
│  │  ─── Svar                    │  │                              │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  🏆 MINA FRAMGÅNGAR                                             │ │
│  │                                                                  │ │
│  │  [🥇 5 brev skrivna!] [🥈 Första intervjun bokad!]              │ │
│  │  [🥉 40% svarsfrekvens - bättre än snittet!]                    │ │
│  │                                                                  │ │
│  │  Nästa milstolpe: 10 skickade ansökningar (2 kvar!)             │ │
│  │  ████████████████████████░░░░░░░░░░  8/10                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  💡 INSIGHTS FRÅN DIN DATA                                      │ │
│  │                                                                  │ │
│  │  • Du skriver flest brev på tisdagar (3 av 8)                   │ │
│  │  • Butiks-jobb ger dig högst svarsfrekvens (60%)                │ │
│  │  • Brev med AI-hjälp har 15% högre svarsfrekvens                │ │
│  │  • Du är mest aktiv mellan 10-12 på förmiddagen                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ AI-HJÄLP MODAL

### Steg 1: Klistra in annons

```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 AI-Hjälp för Personligt Brev                               [×] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  STEG 1/4                                                        │ │
│  │  ████░░░░░░░░░░░░░░░░                                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Klistra in jobbannonsen                                             │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  [Textarea med placeholder:]                                    │ │
│  │  "Klistra in hela jobbannonsen här.                             │ │
│  │   AI:n analyserar annonsen för att skapa ett personligt         │ │
│  │   brev som matchar jobbets krav."                               │ │
│  │                                                                  │ │
│  │  ─────────────────────────────────────────────────────────────  │ │
│  │  ELLER                                                           │ │
│  │  ─────────────────────────────────────────────────────────────  │ │
│  │                                                                  │ │
│  │  📎 Ladda upp PDF/Word från din dator                          │ │
│  │                                                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [Avbryt]                            [Analysera →]                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Steg 2: Analys pågår

```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 AI-Hjälp för Personligt Brev                               [×] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  STEG 2/4                                                        │ │
│  │  ████████░░░░░░░░░░░░                                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Analyserar annonsen...                                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │         ⚙️                                                       │ │
│  │                                                                  │ │
│  │  Letar efter nyckelord...       ✅                              │ │
│  │  Analyserar krav...             ✅                              │ │
│  │  Identifierar företagskultur... ⏳                              │ │
│  │                                                                  │ │
│  │  [████████████░░░░░░░░] 65%                                     │ │
│  │                                                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  💡 Visste du att...                                                 │
│  "Brev som nämner specifika färdigheter från annonsen får            │ │
│   40% fler svar!"                                                   │ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Steg 3: Granska analys

```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 AI-Hjälp för Personligt Brev                               [×] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  STEG 3/4                                                        │ │
│  │  ████████████░░░░░░░░░░                                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ✅ Analys klar! Här är vad vi hittade:                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  🔑 NYCKELKOMPETENSER (4 hittade)                               │ │
│  │                                                                  │ │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      │ │
│  │  │ Kundservice    │ │ Kassahantering │ │ Lagerarbete    │      │ │
│  │  │ Viktigast!     │ │ Viktigt        │ │ Meriterande    │      │ │
│  │  └────────────────┘ └────────────────┘ └────────────────┘      │ │
│  │                                                                  │ │
│  │  📋 FORMELLA KRAV                                               │ │
│  │  • Svenska i tal och skrift ✓                                   │ │
│  │  • Körkort B (meriterande)                                      │ │
│  │                                                                  │ │
│  │  🏢 FÖRETETSKULTUR                                               │ │
│  │  "ICA Maxi värderar teamwork och personlig service"             │ │
│  │                                                                  │ │
│  │  🎯 MATCHNINGSGRAD: 75% (Bra match!)                            │ │
│  │  ████████████████████████████░░                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [← Ändra]                           [Generera brev →]               │
└─────────────────────────────────────────────────────────────────────┘
```

### Steg 4: Genererat brev

```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 AI-Hjälp för Personligt Brev                               [×] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  STEG 4/4                                                        │ │
│  │  ████████████████████████░░░░░░░░░░                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ✅ Ditt brev är klart!                                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  PREVIEW                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │  Hej,                                                   │   │ │
│  │  │                                                         │   │ │
│  │  │  Jag skriver med stort intresse för tjänsten som        │   │ │
│  │  │  Butikssäljare på ICA Maxi Göteborg. Med min            │   │ │
│  │  │  erfarenhet av kundservice och kassahantering...        │   │ │
│  │  │                                                         │   │ │
│  │  │  [Genererad text fortsätter...]                         │   │ │
│  │  │                                                         │   │ │
│  │  │  Med vänliga hälsningar                                 │   │ │
│  │  │  [Ditt namn]                                            │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │  🤖 AI-analys av brevet:                                │   │ │
│  │  │  • 4/4 nyckelord inkluderade ✅                         │   │ │
│  │  │  • Matchar företagskultur ✅                            │   │ │
│  │  │  • Längd: 320 ord (optimal) ✅                          │   │ │
│  │  │  • Svenska normer: Formell ton ✅                       │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [🔄 Generera om]  [✏️ Redigera]  [💾 Spara & använd]                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design-System Användning

### Färger
- **Primär:** Indigo-600 (`#4f46e5`)
- **Sekundär:** Violet-500 (`#8b5cf6`)
- **Success:** Green-500
- **Warning:** Amber-500
- **Error:** Red-500
- **Background:** Slate-50
- **Card:** White med slate-200 border

### Komponenter att återanvända
- `PageTabs` - För navigation mellan flikar
- `Card` - För alla kort/boxar
- `StatCard` - För statistik-siffror
- `InfoCard` - För tips och information
- `ActionCard` - För klickbara mallar
- `SkeletonCard` - För loading states

### Ikoner (Lucide)
- `FileText` - Personligt brev
- `Building2` - Företag
- `Briefcase` - Jobb
- `Send` - Skicka ansökan
- `Sparkles` - AI-hjälp
- `ClipboardPaste` - Klistra in
- `CheckCircle2` - Klart/Success
- `Clock` - Väntar/Påminnelse
- `MessageSquare` - Intervju

---

## 📱 Responsivt beteende

### Desktop (> 1024px)
- Fulla flikar synliga
- Sidopaneler för AI-hjälp och preview
- Grid med 3-4 kolumner för mallar

### Tablet (768px - 1024px)
- Flikar i rad
- 2-kolumns grid för mallar
- Komprimerad preview

### Mobile (< 768px)
- Dropdown för flikar
- 1 kolumn för alla listor
- Fullskärms modal för AI-hjälp
- Touch-vänliga knappar (minst 44px)

---

## ✅ Checklista för implementation

- [ ] Skapa `CoverLetterPage.tsx` med 5 flikar
- [ ] Implementera `AllCoverLetters.tsx` komponent
- [ ] Implementera `NewCoverLetter.tsx` med wizard
- [ ] Implementera `Applications.tsx` med kanban-vy
- [ ] Implementera `CoverLetterTemplates.tsx` (kan återanvända befintlig)
- [ ] Implementera `CoverLetterStats.tsx` med grafer
- [ ] Implementera `AIHelpModal.tsx` med 4 steg
- [ ] Lägg till routing i App.tsx
- [ ] Lägg till länk i Sidebar
- [ ] Testa responsivitet
- [ ] Accessibility-review (WCAG)

---

*Wireframes skapade av UX-designer*  
*För review av Product Manager och Frontend-utvecklare*
