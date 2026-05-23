# STA — Skattningar, deadlines och PDF-export

**Forskningsfundament för konsulent-skattningsmodulen i Jobin.**
Sammanställer Arbetsförmedlingens (AF) instrumentkrav, tidsfrister, formfältsmappning och Jobin-integration för tjänsten Steg till arbete (STA).

Forskat 2026-05-23 av Claude tillsammans med Mikael (AT/projektägare).

---

## 1. Vision

Jobin är **inte primärt inskickssystem** — AF:s portaler är fortfarande huvudkanalen för dokument-inlämning. Jobins värde är att **minska konsulentens administration** genom att:

1. **Strukturera deltagarens egen input** — DOA-självskattning, dagboksanteckningar, reflektioner ger data direkt
2. **Hybrid skattning** — deltagaren självskattar (där instrumentet stödjer det), AT bedömer på samma items, båda visas i PDF
3. **PDF-export i AF:s officiella ifyllbara mallar** — färdig att laddas ner och skickas in via AF:s portal
4. **AI för utkast i fri-text-fält** — planeras till v2, inte MVP

## 2. Källor

| Dokument | Innehåll |
|---|---|
| `sta/Beskrivning del 1.docx` | Del 1: 3 veckor, syfte, aktiviteter, dokumentation |
| `sta/Beskrivning del 2.docx` | Del 2: 5 veckor, AWP/AWC/MOHOST i arbetsstationer |
| `sta/Beskrivning del 3.docx` | Del 3: max 6 mån, arbetsprövning i reell miljö |
| `sta/Beskrivning del 4.docx` | Del 4: max 6 mån, matchning mot anställning |
| `sta/Del 1/Arbetsterapeutiska instrument steg till arbete 1.5.docx` | Vilka instrument per del + samråd med AT |
| `sta/Del 3/Arbetsprövning/3 .Efter avslutad arbetsprövning/Rutin för dokumentation och skattningar vid och efter arbetsprövning.docx` | AWC/AWP/MOHOST/DOA-rutin per arbetsprövning |
| AF:s ifyllbara PDF-formulär (se §6) | Form-fält som kan auto-fyllas |

## 3. Tidsfrister per del

| Del | Tid | Aktiviteter | Inlämning |
|---|---|---|---|
| **Del 1** | 3 veckor (21 dagar) | Startsamtal, kartläggningssamtal, kompetenskartläggning. Valbart: vägledning, hälsofrämjande, hälsoskola | Initial planering + Delredovisning Del 1 vid faslut. Skattningar in vid avbrott/AF-förfrågan |
| **Del 2** | 5 veckor (35 dagar) | Arbetsliknande aktiviteter i konstruerad miljö, 4 obligatoriska inriktningar (Administration, Kundmottagning, Lager, Produktion). 5 dagar/vecka, upp till 8h/dag. AT med stöd av AK observerar | AWP minst 3 ggr + AWC + ev. MOHOST + Delredovisning Del 2 |
| **Del 3** | Max 6 månader (~180 dagar) | Arbetsprövning på 1+ AF-godkända arbetsplatser. Minst 1 uppföljning/vecka. Max 14 dagars uppehåll OK | AWC/AWP vid 1:a veckan + sista 3 veckorna per arbetsplats. MOHOST+DOA minst 1 gång per arbetsplats. Underlag skyndsamt efter avslut |
| **Del 4** | Max 6 månader (~180 dagar) | Introducerande arbetsprövning inför anställning. Place-then-Train / Supported Employment | AWC/AWP om ny arbetsplats utan tidigare skattning. Anställningsinformation direkt vid avslut |

**Övergångsperiod Del 3 → Del 4:** Deltagaren kan stanna på samma arbetsplats. Slutskattning oavsett vilken del — i dialog med AF.

**Vid kort varsel-anställning under Del 3/4:** AWC + AWP prioriteras framför DOA/MOHOST. Plus Information från arbetsprövningsplatsen + Informativ rapport om hjälpmedel.

`PART_DURATIONS` i `client/src/pages/sta/enrollmentDisplay.ts` (21/35/180/180) matchar AF:s officiella siffror.

## 4. Instrument — komplett översikt

| Kod | Namn | Items | Skala | Hybrid (deltagar+AT)? | Del 1 | Del 2 | Del 3 | Del 4 |
|---|---|---|---|---|---|---|---|---|
| **DOA** | Dialog om arbetsförmåga 4.2/2017 | 34 | 1–5 (låg→hög grad) | **Ja** — egen rekommendation från AF: deltagaren självskattar tidigt i Del 1 | ✅ Självskattning | — | (vid behov) | — |
| **WRI** | Worker Role Interview S 4.0 | 17 | 1–4 + IA/SI | **Nej** — AT-intervju, AT skattar | ✅ | — | (vid kort varsel) | — |
| **MOHOST** | Model of Human Occupation Screening Tool 2.0 | **24** (6 kat × 4 items) | F/I/D/B + IS | **Nej** — AT skattar | ✅ | (vid behov) | ✅ minst 1 gång per arbetsplats | — |
| **AWP** | Assessment of Work Performance 2.0 | 14 (3 kat) | 1–4 + SI/EA | **Nej** — AT observerar | — | ✅ minst 3 ggr | ✅ start+slut | ✅ |
| **AWC** | Assessment of Work Characteristics 1.1 | 14 (3 kat) | 1–4 + SI/EA + EB | **Nej** — AT observerar | — | ✅ | ✅ start+slut | ✅ |

**MOHOST-itemcount korrigerat:** Tidigare värde 25 var fel. Mikael verifierat 24 = 6 kategorier × 4 items.

**EB i AWC = "Ej Bedömt"** (markering om färdigheten inte gick att bedöma).

## 5. Item-strukturer per instrument

### 5.1 DOA — 34 items, 5 kategorier

Skala: **1–5** ("i låg grad" → "i hög grad"). Två kolumner per item: Personens skattning + Bedömarens skattning.

| Kategori | Items | Antal |
|---|---|---|
| Självkännedom, intressen och värderingar | 1–9 | 9 |
| Roller och vanor | 10–17 | 8 |
| Fysisk förmåga | 18–21 | 4 |
| Organisations- och problemlösningsförmåga | 22–27 | 6 |
| Förmåga till samspel och kommunikation | 28–34 | 7 |

Plus: kommentar per item + sista sidans summering (Mål och planering + Resurser/Begränsningar per kategori).

Item-text finns i `client/src/pages/sta/assessmentInstruments.ts`.

### 5.2 WRI-S 4.0 — 17 items, 6 kategorier

Skala: **1–4** (Hindrar / Visst hinder / Visst stöd / Starkt stöd) + **IA** (Inte aktuellt) + **SI** (Saknar information).

| Kategori | Items | Antal |
|---|---|---|
| Uppfattning om den egna förmågan | Förståelse, Tro, Tar ansvar | 3 |
| Värderingar | Engagemang för arbete, Förväntningar | 2 |
| Intressen | Förmåga att utöka intressen | 1 |
| Roller | Identifierar sig med arbetstagare, Andra roller stödjer | 2 |
| Vanor | Arbetsrutiner, Anpassar dagliga rutiner | 2 |
| Omgivning | Arbetsmiljö, Familj, Chef, Kamrater, Arbetskrav, Dagliga rutiner, Fysisk miljö | 7 |

Plus: bedömningsutgångspunkt (kvar/återgå/i allmänhet) + kommentar per item.

### 5.3 MOHOST 2.0 — 24 items, 6 kategorier (4×6)

Skala: **F** (Fungerar) / **I** (Inskränker) / **D** (Delvis hindrar) / **B** (Begränsar) + **IS** (Information saknas).

| Kategori | Items |
|---|---|
| Motivation för aktivitet | Bedömning av förmåga, Förväntningar på framgång, Intresse, Val |
| Aktivitetsmönster | Rutiner, Anpassningsförmåga, Roller, Ansvar |
| Kommunikations- och interaktionsförmåga | Icke-verbal, Verbalt uttryck, Konversation, Sociala relationer |
| Processfärdigheter | Kunskap, Tidsanvändning, Organisering, Problemlösning |
| Motoriska färdigheter | Hållning/rörlighet, Koordination, Styrka, Energi |
| Omgivning | Fysiska utrymmen, Fysiska resurser, Sociala grupper, Krav från aktivitet |

### 5.4 AWP 2.0 / AWC 1.1 — 14 items, 3 kategorier (samma struktur)

Skala: **1** (Inkompetent) / **2** (Begränsat) / **3** (Tveksamt) / **4** (Kompetent) + **SI** + **EA** (Ej aktuellt) + **EB** (Ej Bedömt — endast AWC).

| Kategori | Items |
|---|---|
| Motoriska färdigheter | Kroppställning, Rörlighet, Koordination, Styrka, Fysisk energi |
| Processfärdigheter | Psykisk energi, Kunskap, Tidsorganisation, Planering av arbetssituationen, Anpassning |
| Kommunikations- och interaktionsfärdigheter | Fysisk kommunikation och interaktion, Språk, Sociala kontakter, Informationsutbyte |

**Skillnad AWP vs AWC:**
- **AWP** mäter *deltagarens* aktivitetsutförande
- **AWC** mäter *kravnivån i aktiviteten* (arbetets egenskaper)
- Båda har samma 14 färdigheter + skala
- AWC har "EB - [färdighet]" som extra markering (Ej Bedömt)
- AWC har dessutom 3 datainsamlingsmetoder (Bedömaren har observerat / utfört själv / försökt föreställa sig)

AWP-blanketten stödjer **upp till 4 bedömningar (Skattning 1–4)** i samma blankett — användbart för Del 2 där 3 aktiviteter ska skattas.

## 6. PDF-formulär — form-fält-inventering

Sökt med `pypdf.PdfReader.get_fields()` på alla ifyllbara PDF:er i `sta/`.

### 6.1 Komplett kombinerad blankett — Del 1 (DOA + WRI + MOHOST)

**Fil:** `sta/Del 1/Skattningar + RD Del 1/DOA - WRI - MOHOST Skattningar del 1.pdf`

- **Sidor:** 11
- **Form-fält:** 664
- **Namnmönster:** Numeriska — `11`, `12`, `13` = fråga 1 svarsalternativ 1/2/3 etc. `k1`, `k2`, ... = kommentar 1, 2, ...
- **Metadata-fält:** `Födelsedatum`, `Bedömarens namn` (semantiska namn)
- **Mappning:** Kräver **manuell reverse-engineering** av varje form-fält till instrument+item+alternativ. ~1 dags arbete enligt Mikaels beslut 2026-05-23.

### 6.2 AWC — `AWC-1.1-Sammanstallningsblankett-ifyllningsbar-originalfil-elxaen.pdf`

- **Sidor:** 5, **Form-fält:** 95
- **Namnmönster:** **Semantiskt** (lätt att mappa)
- **Skattningar:** `Skattning N - [färdighet]` för N=1..4 (4 bedömningar i samma blankett, 14 färdigheter vardera = 56 checkboxar)
- **Ej Bedömt:** `EB - [färdighet]` × 14
- **Fri text per färdighet:** `Kroppställning`, `Rörlighet`, ..., `Informationsutbyte` (14 textareas)
- **Metadata:** `Bedömare`, `Datum för bedömning`, `Arbetsuppgift`, `Hjälpmedel/anpassningar`, `Sammanfattande kommentarer`
- **Datainsamlingsmetod:** 3 checkboxar (`1 Bedömaren har observerat...`, `2 ...genomfört själv...`, `3 ...föreställt sig...`) + `Datainsamlingsmetod 1/2/3` (textfält)

### 6.3 AWP — `AWP-2.0-Sammanstallningsblankett-ifyllningsbar-originalfil-fxiizf.pdf`

- **Sidor:** 5, **Form-fält:** 113
- **Namnmönster:** **Semantiskt** (lätt att mappa)
- **Skattningar:** `Skattning N - Färdighet M` för N=1..4, M=1..14 = 56 checkboxar
- **PDF-anomali:** En extra `Skattning 2 - Färdighet 1.0` finns (troligen dubblett — kan ignoreras i koden)
- **Klientdata:** `Namn`, `Personnummer`, `Kön` (Man/Kvinna checkboxar), `Arbetsrelaterad problematik`
- **Bedömningskontext:** `Bedömare`, `Bedömning nr`, `Bedömningssituation`, `Observationstillfälle/period`, `Hjälpmedel/anpassningar`
- **Observationsform:** `Direkt` / `Deltagande` (checkboxar)
- **Fri text per färdighet:** 14 textareas + `Sammanfattande kommentarer`

### 6.4 MOHOST — två formulär

**`MOHOST - sammanställningsformulär ifyllbar.pdf`**
- **Sidor:** 2, **Form-fält:** 56
- **Namnmönster:** `Rad1`–`Rad24` (24 skattningar — bekräftar item-count) + `Text1`–`Text1.23` (24 kommentarer) + metadata
- **Komplexitet:** Medel — rad-indexering är logisk

**`MOHOST - summeringsformulär ifyllbar.pdf`**
- **Sidor:** 2, **Form-fält:** 154
- **Namnmönster:** Hierarkisk — `Dropdown4.X.Y.Z` (23×4-matris av dropdowns + metadata)
- **Anomali:** Visar 23x4 = 92 men nämnda 24 items — kanske en cell tom (egen blankett saknar något item som AF har lagt till senare?)

### 6.5 DOA — två formulär

**`DOA - sammanställningsformulär ifyllbar.pdf`** (AT:s blankett)
- **Sidor:** 4, **Form-fält:** 387
- **Namnmönster:** **Problematiskt** — generiska namn `Text230`, `Knapp237`, numeriska references upp till flera hundra. Vissa semantiska finns (`Namn`, `Födelsdatum`, `Bedömarens namn`, `Datum`).
- **Mappning:** Kräver manuell visuell reverse-engineering

**`DOA - sjalvskattningsformulär ifyllbar.pdf`** (deltagarens blankett)
- **Sidor:** 6, **Form-fält:** 210
- **Namnmönster:** **Problematiskt** — `Kryssruta44`–`Kryssruta99` (56 checkboxar), `Kommentar1`–`Kommentar38` (38 textareas)
- **Mappning:** Kräver manuell reverse-engineering

**Strategi:** För DOA används förmodligen Del 1-kombi-PDF:n (§6.1) istället för dessa separata blanketter. Beslut delvis öppet.

## 7. Jobin-data → AF-blankett mappning

### 7.1 Direkt-mappbar strukturerad data

| AF-fält | Jobin-källa | Typ | Exempel |
|---|---|---|---|
| Namn | `profiles.first_name + last_name` eller `sta_enrollments.external_name` | text | "Anna Andersson" |
| Personnummer | `sta_enrollments.external_personal_id` | text | "197512345678" |
| E-post | `profiles.email` eller `sta_enrollments.external_email` | text | "anna@example.se" |
| Bedömare (AT/AK-namn) | Inloggad `profiles.first_name + last_name` | text | "Linda Konsulent" |
| Datum för bedömning | `sta_assessments.performed_at` eller `signed_at` | date | "2026-06-01" |
| Programstart | `sta_enrollments.started_at` | date | "2026-01-15" |
| Del | `sta_enrollments.current_part` | int | 2 |
| Delens start | `sta_enrollments.part_started_at` | date | "2026-04-01" |
| Hjälpmedel/anpassningar | `sta_enrollments.adaptations` | text | "Skriftliga instruktioner, längre tid" |
| Språkstöd | `sta_enrollments.language_support` (array) | array | `["arabiska", "engelska"]` |
| Kommunikationsstöd | `sta_enrollments.communication_support` (array) | array | `["bildstöd"]` |
| Arbetsplats (AWC/AWP) | `sta_workplaces.company_name` | text | "TechCorp AB" |
| Arbetsuppgift (AWC) | `sta_workplaces.inriktning` eller `sta_activities.activity_key` | text | "Lager/orderplock" |
| Observationsperiod | `sta_workplace_followups.week_start..week_end` | range | "2026-04-15 – 2026-04-19" |

### 7.2 Skattningsvärden (hybrid: person + bedömare)

Nuvarande schema: `sta_assessments.scores` är **JSONB** — kan rymma godtycklig struktur.

**Föreslagen struktur för hybrid (DOA m.fl.):**
```json
{
  "item_1": { "person": 4, "bedomare": 3, "comment": "..." },
  "item_2": { "person": 5, "bedomare": null, "comment": "" },
  ...
}
```

**För instrument utan självskattning (WRI, MOHOST, AWP, AWC):**
```json
{
  "item_1": { "value": 3, "comment": "..." },
  "item_2": { "value": "SI", "comment": "" },
  ...
}
```

**AWC/AWP multiskattning (samma blankett, 4 bedömningstillfällen):**
```json
{
  "bedomningar": [
    { "id": "b1", "datum": "2026-04-15", "arbetsuppgift": "Lager", "items": { "f1": 3, "f2": 4, ... } },
    { "id": "b2", "datum": "2026-05-01", "arbetsuppgift": "Lager", "items": { "f1": 4, "f2": 4, ... } },
    ...
  ],
  "sammanfattning": "..."
}
```

Ingen DB-migration behövs — JSONB tar emot vilken struktur som helst. Migration behövs bara om vi vill ha **column constraints** (typ check att alla items är besvarade innan complete).

### 7.3 Fri text (AI-stödd i framtid, manuell i MVP)

| AF-fält | Jobin-källa | Hur används idag | Framtida AI-stöd |
|---|---|---|---|
| Kommentar per item | Manuell input | AT skriver i Jobin-UI | AI föreslår utifrån consultant_notes, activity reflections |
| Sammanfattande kommentarer | Manuell input | AT skriver fri text | AI föreslår sammanfattning från sta_quick_notes + consultant_notes |
| Bedömningssituation (AWP) | Manuell input | AT skriver | AI föreslår från sta_workplaces + sta_activities |
| Arbetsrelaterad problematik (AWP) | Manuell input | AT skriver | AI föreslår från consultant_notes |
| Mål och planering (DOA sida 4) | Manuell input | AT + deltagare i dialog | Behåll manuell — kräver fysiskt möte |
| Resurser/Begränsningar (DOA sida 4) | Manuell input | AT skriver utifrån dialog | AI föreslår utkast som AT validerar |

## 8. Implementation-roadmap

### Steg 1 — Klart 2026-05-23
- ✅ Instrument-konstanter med korrekta items (`assessmentInstruments.ts`)
- ✅ Item-counts verifierade mot AF-PDF:erna
- ✅ Skattningar-flik med filter, sortering, mobil card-vy
- ✅ AssessmentSignature med `signByArbetsterapeut`
- ✅ `staDeadlines.ts` med PART_DURATIONS från AF

### Steg 2 — Skattnings-UI (deltagare och AT)
- Bygg **DOA-självskattningsvy** för deltagaren (frontend, läs/skriv `sta_assessments.scores`)
- Bygg **AT-bedömningsvy** för samtliga 5 instrument
- JSONB-struktur enligt §7.2 — börja med hybrid-format för DOA, single-value för övriga
- Lägg till **AWP multi-bedömning** för Del 2 (4 bedömningstillfällen i samma rad)
- "Skicka till deltagare för självskattning"-knapp som öppnar deltagarvyn

### Steg 3 — PDF-export (1 instrument i taget)
Prioritetsordning (efter teknisk svårighetsgrad och affärsvärde):

1. **AWP** (semantisk PDF) → använd `pdf-lib` med field-mapping från §6.3
2. **AWC** (semantisk PDF) → samma teknik
3. **MOHOST sammanställningsformulär** (logisk struktur Rad1–Rad24)
4. **MOHOST summeringsformulär** (hierarkisk Dropdown4.X.Y)
5. **DOA-kombi (Del 1-blanketten)** → manuell mappning Text230→item per fält
6. **DOA-separata** → eventuellt skip om kombi täcker behovet

### Steg 4 — Skattnings-specifika deadlines i UI
- Del 2: indikera om "minst 3 AWP-skattningar" är gjorda
- Del 3: per-arbetsplats deadline för "AWC/AWP vecka 1 + sista 3 veckorna"
- Del 3: per-arbetsplats deadline för "MOHOST + DOA minst en gång"
- Utöka `staDeadlines.ts` med arbetsplats-medvetenhet

### Steg 5 — AI-stöd för fri-text-fält (v2, inte MVP)
- Backend: ny prompt-typ per AF-fält (sammanfattande kommentar, bedömningssituation, etc)
- Källdata: consultant_notes, sta_quick_notes, sta_activities.participant_reflection
- UI: "Föreslå text"-knapp per fri-text-ruta i bedömningsvyn

## 9. Tekniska val

**PDF-bibliotek:** `pdf-lib` (npm) — stöder läsning av AF:s ifyllbara PDF:er och programmatisk ifyllnad av form-fält. Lazy-loaded när konsulent öppnar PDF-export.

**Schema:** Ingen migration nödvändig för MVP — `sta_assessments.scores` (JSONB) räcker. Migration först om vi behöver constraints eller index på enskilda items.

**Auth:** Deltagare-självskattning kräver att deltagaren har Jobin-konto (Hybrid-vision från Mikael 2026-05-23). För linked-deltagare räcker befintlig auth. För invited-deltagare som inte registrerat sig ännu — AT fyller i åt dem (tills deltagaren accepterar inbjudan).

## 10. Öppna frågor / kvarstående research

- **MOHOST summeringsformulärets 23×4-matris** — visar 23 items, inte 24. Är detta en äldre PDF-version eller AF:s officiella struktur? Verifiera med Mikael innan vi kodar mot summeringsformuläret specifikt.
- **DOA-PDF-mappning** — kräver visuell reverse-engineering (manuell, ~1 dag enligt Mikael). Beslut: kör först AWP/AWC, ta DOA i senare iteration.
- **WRI ifyllbar:** Bekräftat att Del 1-kombi-PDF:n täcker WRI. Separat WRI ifyllbar har inte hittats. Kombi-PDF räcker.
- **Var deltagaren kan fylla i** — på sin egen Jobin-profil under STA-vyn? Eller en länk konsulenten skickar? UX-beslut för Steg 2.

## 11. Konklusion

Vi har **fullständig kunskap** om:
- AF:s tidsfrister per del
- Vilka skattningar som ska göras när
- Item-strukturer för alla 5 instrument
- Form-fält i alla ifyllbara PDF:er
- Jobins befintliga data och hur den mappar till AF-blanketterna

**Vi har INTE**: själva implementationen av PDF-export. Den följer i Steg 3 ovan.

Dokumentet uppdateras vid varje större arkitekturbeslut eller nytt research-fynd.
