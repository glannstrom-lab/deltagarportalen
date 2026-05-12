# STA — Rapportinventering

**Skapad:** 2026-05-12
**Syfte:** Komplett inventering av alla rapporter, mallar och dokument i `sta/`-mappen som ska skickas till Arbetsförmedlingen (AF) eller som utgör underlag för dessa.

---

## Översiktstabell — rapporter till AF

| Rapport | Filnamn | Del | Tidpunkt | Format | Antal sektioner | Manuell-andel |
|---------|---------|-----|----------|--------|-----------------|---------------|
| **Initial planering** | (AF blankett — inkomst efter start) | 1 | Efter start | PDF | ~6 | ~50% |
| **Delredovisning Del 1** | `Delredovisning del 1.pdf` (Af 00825 3.0) | 1 | Vid avslut | PDF | 8 | ~40% |
| **Delredovisning Del 2** | `Delredovisning del 2.pdf` (Af 00826 3.0) | 2 | Vid avslut | PDF | 10 | ~45% |
| **Delredovisning Del 3** | `Delredovisningar del 3 - Steg till arbete 20240930.pdf` (Af 00827 3.0) | 3 | Vid avslut | PDF | 3 | ~30% |
| **Delredovisning Del 4 / Slutredovisning** | `Delredovisningar del 4 - Steg till arbete 20240930.pdf` (Af 00828 3.0) | 4 | Vid avslut | PDF | 3 | ~25% |
| **Anmälan arbetsprövning** | `Anmälan arbetsprövning steg till arbete april 2024.pdf` | 3, 4 | Innan AP-start | PDF | ~5 | ~85% |
| **Information från arbetsprövningsplats** | `Information från respektive arbetsprövningsplats - Steg till arbete 20240930kor.pdf` | 3, 4 | Efter AP | PDF | ~6 | ~60% |
| **Åtgärdsplan vid utebliven AP** | `Mall för Åtgärdsplan vid utebliven arbetsprövning.docx` | 3 | Vid avbrott | Word | ~4 | ~90% |
| **Informativ rapport om hjälpmedel** | (refererad i instrumentbeskrivning) | 3, 4 | Vid upptäckt behov | PDF | ~3 | ~70% |

## Skattningsblanketter (bilagor till delredovisningar)

| Skattning | Filnamn | Del | Vem skattar | Manuell-andel |
|-----------|---------|-----|-------------|---------------|
| **DOA — Dialog om arbetsförmåga** | `DOA - WRI - MOHOST Skattningar del 1.pdf`, `DOA - sammanställningsformulär ifyllbar` | 1, 3 | Deltagare (självskatt) + AT | 15% (skala-baserad) |
| **WRI — Worker Role Interview** | `WRI - sammanställningsformulär ifyllbar` | 1, 3 | AT (intervju) | 20% |
| **MOHOST — Screening av delaktighet** | `MOHOST - sammanställningsformulär ifyllbar` + summering | 1, 2, 3, 4 | AT (efter observation) | 15% |
| **AWP — Assessment of Work Performance** | `AWP x3 -MOHOST Skattningar del 2.pdf`, `AWP-2.0-Sammanstallningsblankett-ifyllningsbar` | 2, 3, 4 | AT × 3 aktiviteter (Del 2) eller 2 per AP (Del 3-4) | 10% |
| **AWC — Assessment of Work Characteristics** | `AWC-1.1-Sammanstallningsblankett-ifyllningsbar` | 2, 3, 4 | AT per arbetsstation/AP | 10% |

---

## Fältstruktur per delredovisning

### Delredovisning Del 1 (`Af 00825 3.0`)

**Header (100% strukturerad):**
- Deltagarens namn, personnummer
- Leverantörens kontaktuppgifter
- Datum

**Strukturerade fält (radio/checkbox/dropdown):**
- Fokusyrke fastställt? Ja/Nej
- Yrkesområde kort/lång sikt (kortform)
- Lämplig utbildning? Ja/Nej
- Hjälpmedel (8 alternativ)
- Tolkbehov (4 alternativ)
- Språkstöd (7 alternativ — arabiska, somaliska, tigrinja, dari, pashtu, m.fl.)
- Anpassningar miljö (6 alternativ)
- Aktivitetsomfattning timmar/vecka (intervall)
- Föreslagen nästa del (Del 2 eller Del 3)

**Fritextfält (AI-utkast lämpligt):**
- Motivering fokusyrke
- Motivering nästa del
- Beskriv deltagarens övriga resurser
- Progression i aktivitetsomfattning under del 1 (**obligatoriskt** — krävs alltid)
- Sammanfattande observationer av resurser och stödbehov

### Delredovisning Del 2 (`Af 00826 3.0`)

**Header:** Samma som Del 1

**Strukturerade fält:**
- Yrkesområde kort/lång sikt
- Aktivitetsomfattning start/avslut
- Faktorer som påverkat aktivitetsökning (8 checkboxar)
- Orsaker till ingen ökning (9 checkboxar)
- Timmar/vecka introduction/handledning (återkommande/sporadiskt)

**Fritextfält:**
- Tre bästa aktiviteter (vad fungerade?)
- Orsaker fungerat bäst (analys)
- Kompetenser och resurser
- Introduktionsbehov
- Handledningsbehov
- Miljöanpassningar

**Konsulent-bara:**
- Nästa dels start-timmar
- Bedömning av Del 3-lämplighet

### Delredovisning Del 3 (`Af 00827 3.0`)

**Binär logik:**
- Är Del 4 aktuell? Ja/Nej
- Uppnått anställning/studier? Ja → pausar ifyllning

**Strukturerade fält:**
- Aktivitetsomfattning start/avslut (intervall 1–10, 11–20, 21–30, 31–40 tim/vecka)
- Anledning ej Del 4 (4 alternativ: arbete, studier, hälsa, annat)

**Fritextfält:**
- Bidragande orsaker ej uppnådd anställning/studier
- Hur förutsättningar ska se ut framöver
- Pedagogiskt stöd-behov

> Samma rapport fungerar som **slutredovisning** om Del 4 inte påbörjas.

### Delredovisning Del 4 / Slutredovisning (`Af 00828 3.0`)

**Binär:** Uppnått anställning/studier under Del 4?

**Fritextfält:**
- Bidragande orsaker till resultat
- Pedagogiskt stöd-behov
- Sammanfattning av resurser, stöd och anpassningar inför fortsatt matchning (konsulent-bara, riktas till AF för fortsatt insats)

**Strukturerade fält:**
- Start/avslut aktivitetsomfattning (samma intervall som Del 3)

---

## Stödjande dokument (ej till AF direkt)

| Dokument | Filnamn | Användning |
|----------|---------|------------|
| **Startsamtal** | `Rutin och beskrivning startsamtal.docx` + `steg-till-arbete-informationsblad april 2024.pdf` | Utgör underlag för Initial planering. Dokumenteras idag i Zynca. |
| **Förstärkt språkstöd** | `Rutin och beskrivning av förstärkt språkstöd eller kommunikationsstöd.docx` | Vägledning för konsulent + AT |
| **Arbetsdagbok en dag** | `Dagbok en dag - symboler anpassad.docx` | Fylls dagligen av deltagare vid AP |
| **Arbetsdagbok fem dagar** | `Dagbok fem dagar anpassad.docx` | Samma |
| **Veckodagbok med skattning** | `Veckodagbok med skattning anpassad.docx` | Samma |
| **Stödfrågor uppföljning AP** | `Stödfrågor till uppföljning av Arbetsprövning.docx` | Checklista för konsulent inför uppföljningsmöte |
| **Handledarutbildning AP** | `Handledarutbildning inför arbetsprövning.docx` | För arbetsgivare som tar emot deltagare |
| **Information till AG** | `Arbetslivsresurs Arbetsprövning - till Arbetsgivare 2024-02 A4.pdf` | Bifogas anmälan om AP |
| **Mall upptrappning AP** | `Mall Upptrappning aktivitetsomfattning arbetsprövning del 3.docx` | Internt planeringsverktyg |
| **Kompetenskartläggning** | `Kompetens kartläggning.docx` | Underlag tidigt i Del 1 |

---

## Slutsats — automatiseringspotential

**Hög lämplighet (70-95% automatiserbar):**
- Alla 4 delredovisningarna (datum, deltagaruppgifter, skattningsdata, aktivitetslista är strukturerad)
- Alla 5 skattningsblanketter (skalor är data; sammanfattande kommentarer är AI-utkast)
- Anmälan arbetsprövning (mestadels checkboxar och mallad text)

**Medel lämplighet (40-60%):**
- Information från arbetsprövningsplats (rubriker fasta, innehåll AI-utkast)
- Initial planering (kortare men strukturen är fast)

**Låg lämplighet (under 30%):**
- Åtgärdsplan vid utebliven AP (konsulent-driven bedömning)
- Informativ rapport om hjälpmedel (specifik bedömning)

---

*Detaljerade fältlistor från PDF-extraktion ligger i `sta/Del [n]/Skattningar + [RD/DR] Del [n]/` per dokument.*
