# STA — Roadmap för automatiserad rapportgenerering

**Skapad:** 2026-05-12
**Vision:** Konsulenten klickar "Skapa Delredovisning" → får ett 85% förifyllt utkast → granskar och redigerar 15-20 min → laddar ner färdig PDF som matchar AF:s blankett → skickar.

**Relaterade dokument:**
- [`sta-report-inventory.md`](./sta-report-inventory.md) — alla rapporter och fält
- [`sta-pages-plan.md`](./sta-pages-plan.md) — datamodell + sidstruktur
- [`sta-improvements-and-jobin-integration.md`](./sta-improvements-and-jobin-integration.md) — Jobin-data-vinkeln
- [`sta-material-deep-dive.md`](./sta-material-deep-dive.md) — material i sta-mappen

---

## Del A — Vad ska genereras och vad ska skickas?

Sju rapporttyper till AF (detaljerad fältlista i `sta-report-inventory.md`):

1. **Initial planering** (Del 1, vid start) — auto-genereras från startsamtal + profil
2. **Delredovisning Del 1** (slut av Del 1)
3. **Delredovisning Del 2** (slut av Del 2)
4. **Delredovisning Del 3** (slut av Del 3 — fungerar också som slutredovisning om Del 4 ej startar)
5. **Delredovisning Del 4 / Slutredovisning** (slut av Del 4)
6. **Anmälan arbetsprövning** (innan AP-start i Del 3-4)
7. **Information från arbetsprövningsplats** (efter AP i Del 3-4)

Plus 5 skattningsblanketter som bilagor (DOA, WRI, MOHOST, AWP, AWC).

Allt ska gå att exportera som **ifyllbar PDF som matchar AF:s officiella blankett**, så det inte krävs omskrivning i ett annat system.

---

## Del B — Datakällor (vad finns + vad behöver byggas)

### Redan i Jobin (kan användas direkt)

| Datakälla | Fält | Används till |
|-----------|------|--------------|
| `profiles` | namn, personnummer, kontakt, anpassningar, språkstöd | Alla rapport-headers, anpassningssektioner |
| `cvs` | arbetshistorik, utbildning, kompetenser | Initial planering, kompetenskartläggning |
| `interest_results` | RIASEC + Big Five | Kompetenskartläggning, DOA-jämförelse |
| `wellness_logs` | mood, energi | MOHOST-underlag, AI-veckosumma |
| `diary_entries` | reflektioner (med samtycke) | Sammanfattning resurser/stödbehov |
| `consultant_meetings` | datum, närvaro, anteckningar | Aktivitetslista, närvaro |
| `consultant_notes` | konsulentens egna anteckningar | Alla fritextsektioner |
| `saved_jobs`, `spontaneous_companies` | yrkesintressen, AG-kontakter | Fokusyrke, AP-anmälan |

### Behöver byggas (datamodellen från `sta-pages-plan.md`)

| Tabell | Vad den lagrar | Vilka rapporter den matar |
|--------|----------------|---------------------------|
| `sta_enrollments` | aktuell del, fokusyrke, anpassningar, start/slut-datum | Alla |
| `sta_activities` | varje genomförd dag i dagsslingan + reflektion | Aktivitetslista, "progression i aktivitetsomfattning" |
| `sta_assessments` | DOA/WRI/MOHOST/AWP/AWC skattningar | Alla delredovisningar + bilagor |
| `sta_workplaces` | arbetsprövningsplats med AF-status | Anmälan AP, Information från AP |
| `sta_documents` | utkast och inskickade dokument | Historikvy, audit-logg |
| `sta_quick_notes` (**NY**) | snabbanteckningar, taggar, observationer | Fritextsektioner i alla rapporter |
| `sta_pulse_checks` (**NY**) | daglig energi/mood-skala | MOHOST-stöd, trendgrafer |
| `sta_keywords` (**NY**) | kategoriserade observationer (chips) | AI-utkast underlag |

---

## Del C — Datafångst-design: hur får vi in datan utan friktion?

Det här är hjärtat i hela visionen. Om datafångst är jobbig kommer rapporten ändå att skrivas manuellt. Vi behöver göra det **enklare att fånga datan än att skriva rapporten själv**.

### C1. Startsamtals-formulär (ersätter Zynca)

**Idag:** Konsulenten antecknar i externt system "Zynca". Datan är inte tillgänglig för rapportgenerering.

**Förslag:** Strukturerat formulär i portalen direkt vid första mötet:

```
┌─ Startsamtal — [Deltagarens namn]
│
│  📅 Datum: [auto]    📍 Plats: [Zoom / kontor]
│
│  ✅ Genomgångar (klicka för klart):
│     □ Informationsbladet utdelat
│     □ Schema utdelat
│     □ Frånvaro-rutiner gått igenom
│     □ Kontaktuppgifter utbytta
│
│  📝 Aktivitetsomfattning initialt:
│     [slider 0-40 tim/vecka]
│
│  🎯 Fokusyrke:
│     ( ) Redan fastställt: [text]
│     ( ) Identifieras under tjänsten
│
│  🛠 Anpassningsbehov (chips, väljbara + fritext):
│     [Tysta rum] [Kortare pass] [Bildstöd] [Lättläst] [+ Lägg till]
│
│  🌐 Språkstöd:
│     [ ] Arabiska [ ] Somaliska [ ] Tigrinja [ ] Dari [ ] Pashtu
│     [Annat: ___]
│
│  💬 Voice-note (frivilligt):
│     [🎙 Spela in 30-90 sek] → transkriberas automatiskt
│
│  Spara → genererar utkast till Initial planering
└────────────────────────────────────────────────────────
```

**Vad det löser:** Hela startsamtal-datan blir struktur direkt och kan auto-fylla Initial planering 5 min efter mötet är klart.

### C2. Snabbanteckningar med taggar

**Mönster:** "En tanke om en deltagare, mitt under dagen, utan att stoppa flödet."

**UI:**
```
┌─ Snabbanteckning för [Anna Karlsson]
│
│  [Voice-knapp]  eller  [Skriv: Anna verkade pigg idag, frågade om Del 2]
│
│  Snabbtaggar (klick):
│  [🌟 Positiv energi] [⚡ Engagerad] [🌧️ Nedstämd] [😴 Trött]
│  [💭 Frågande] [🚪 Tystlåten] [🎯 Fokuserad] [⏱ Sen]
│  [🔥 Genombrott] [🌪 Stresssignal] [+]
│
│  Synlighet:  ( ) Bara jag  (•) Delas i delredovisning  ( ) Delas med Anna
│
│  Spara (Cmd+Enter)
└────────────────────────────────────────────────────────
```

**Bonus:** Snabbanteckningar visas på deltagardrawer som en tidslinje. AI använder dem som underlag för veckosummering och delredovisning.

**Tagg-katalog (förvald för att inte skapa kaos):**
- **Mående:** Positiv energi, Nedstämd, Stresssignal, Trött, Pigg
- **Engagemang:** Engagerad, Tystlåten, Frågande, Initiativtagande
- **Prestation:** Fokuserad, Distraherad, Snabb, Noggrann
- **Sociala:** Vänlig med andra deltagare, Drar sig undan, Hjälpsam
- **Risker:** Frånvaroaviserad, Sjuk, Kris
- **Genombrott:** Aha-moment, Ny insikt, Beslut

### C3. Voice-to-text överallt

På varje fritextfält i portalen finns en 🎙-knapp. Konsulenten säger in 30-90 sekunder, det transkriberas. Inte perfect transcription nödvändigt — bara nyckelorden behövs för AI-utkast.

**Tekniskt:** Använd `MediaRecorder` API + Whisper-API (eller motsvarande). Spara både audio och transkript.

**Varför:** Att tala är 3× snabbare än att skriva. Konsulenten gör det i bilen efter ett möte.

### C4. Pulse-checks (deltagaren)

**Idé:** Två frågor till deltagaren varje morgon — tar 15 sekunder.

```
Hej Anna 👋

Hur är energin idag?
🔋🔋🔋🔋🔋  (klick på en stapel)

En sak du vill säga:
[korta textfält, frivilligt]
```

**Data lagras:** `sta_pulse_checks` med datum + energi-värde + ev. text.

**Använder:**
- MOHOST-underlag (livsstrukturen är synlig)
- Tidiga varningssignaler (3+ dagar lågt → flagga till konsulent)
- AI-veckosumma har trenddata istället för bara aktiviteter

### C5. Veckoavslutning (deltagaren, fredag eftermiddag)

```
Hej Anna,

Veckan i sammandrag — tar 2 minuter:

1. Hur har veckan känts? 🌤 🙂 😐 😞 🌧

2. Vad var bäst denna vecka?
   [textfält]

3. Vad var jobbigast?
   [textfält]

4. En fråga till din konsulent (frivilligt):
   [textfält]
```

**Data:** Sparas och visas för konsulenten samt feedar AI-veckosumma. Frågorna till konsulenten ger trigger till uppföljning.

### C6. Möte-mode (konsulenten, under möte)

**Idé:** Konsulenten har ett möte med deltagare. På telefon/laptop öppnar hen "Möte-mode" för deltagaren — då visas:

- **Senaste data:** pulse-checks, närvaro, reflektioner
- **Förslag på frågor:** baserat på vad som hänt sedan sist
- **Quick-notes-fält** för anteckningar i realtid
- **Efter mötet:** "Sammanfatta som anteckning" — AI genererar förslag

**Vad det löser:** Konsulenten behöver inte skriva ner mötet efteråt — det är redan dokumenterat.

### C7. Bulk-närvaro (redan i mockup)

Redan designad. Tar 30 sek per dag för alla deltagare.

### C8. Föreslagna observation-fraser

I varje skattningsformulär finns en "Vanliga observationer"-rullist med fraser konsulenten klickar in:

```
Bra fokus i dag                 [klicka för att lägga till]
Behövde kortare pass            [klicka]
Engagerad i diskussionen         [klicka]
Mer tystlåten än normalt        [klicka]
Frågade mycket — nyfikenhet     [klicka]
Klarade arbetsstation utan stöd [klicka]
Behövde upprepade instruktioner [klicka]
```

Klickade fraser läggs till i fritextfältet och kan redigeras. Sparar 80% av skrivtiden.

### Sammanfattning datafångst-principer

1. **Varje moment ska ta < 30 sekunder** — annars händer det inte
2. **Voice-to-text är default för fritextfält** — tala är 3× snabbare än skriva
3. **Taggar och chips före fritext** — strukturerad data är bättre datakälla för AI
4. **Deltagaren bidrar mer än idag** — pulse-checks och veckoavslutning ger ovärderligt underlag
5. **Möte är dokumentationsögonblicket** — inte 2 timmar efter mötet
6. **AI-utkastet är slutprodukten av datafångsten** — inte ett separat moment

---

## Del D — Sju-fas-roadmap

### Fas 1: Foundation — datamodell + grundläggande dataflöden
**Mål:** All STA-data finns i Supabase, sidorna läser riktiga data istället för mock.

**Aktiviteter:**
- Migration: `sta_enrollments`, `sta_activities`, `sta_assessments`, `sta_workplaces`, `sta_documents`
- Migration: `sta_quick_notes`, `sta_pulse_checks`, `sta_keywords`
- RLS-policies (deltagare ser sitt, konsulent ser sina, audit-logg)
- API-endpoints för CRUD på alla tabeller
- Ersätt mockData.ts med real-data-hooks
- Startsamtals-formulär (C1) i portalen — skriver till `sta_enrollments` + `sta_quick_notes`
- Aktivitetsloggning: deltagaren markerar dag som klar → `sta_activities` rad skapas

**Beroenden:** Endast användarens samtycke + befintlig auth.

**Risker:** RLS-policies kan vara tricky när konsulent ska se manuellt tillagda deltagare som inte finns i `profiles` än.

**Tid:** 3 sprintar (6 veckor)

---

### Fas 2: Smidig datafångst — det ska vara enklare att fånga data än att skriva rapport
**Mål:** Konsulenten och deltagaren kan registrera information utan friktion.

**Aktiviteter:**
- **Snabbanteckningar (C2)** med taggchips och voice-input
- **Voice-to-text-knapp (C3)** på alla fritextfält i portalen
- **Pulse-checks (C4)** för deltagaren — daglig 15-sekunders-check-in
- **Veckoavslutning (C5)** — 2-min-formulär på fredag eftermiddag
- **Bulk-närvaro** kopplas till `sta_activities` (closing the loop)
- **Föreslagna observation-fraser (C8)** i skattningsformulär

**Beroenden:** Fas 1 klar.

**Risker:**
- Voice-to-text-kvalitet på svenska
- Pulse-check-trötthet hos deltagare ("ännu en fråga")

**Tid:** 2 sprintar (4 veckor)

---

### Fas 3: Skattningar i portalen
**Mål:** Alla 5 skattningsinstrument (DOA, WRI, MOHOST, AWP, AWC) fylls i direkt i portalen istället för pappersformulär eller PDF.

**Aktiviteter:**
- DOA-formulär med deltagarens självskattning + AT-kommentarer
- WRI-formulär (intervjustruktur)
- MOHOST-formulär med kategori-baserad bedömning
- AWP-formulär per aktivitet/AP
- AWC-formulär per arbetsstation/AP
- **Jämförelseunderlag:** tidigare delars värden visas bredvid (Del 2 MOHOST visar Del 1-värden)
- Skattningar lagras strukturerat i `sta_assessments` (poäng + sammanfattande kommentar per kategori)

**Beroenden:** Fas 1 klar. Fas 2 är inte hård dependency men gör formulären trevligare.

**Risker:**
- Instrumenten har specifika certifieringskrav — vi får inte ändra på frågorna
- Versionshantering: AWP 2.0 vs ny version av instrumentet

**Tid:** 3 sprintar (6 veckor) — fördelat: DOA+WRI+MOHOST första sprint, AWP+AWC andra, polish och jämförelse tredje.

---

### Fas 4: AI-utkast för rapport-fritext
**Mål:** Varje rapport-fritextfält har en "Generera utkast"-knapp som producerar AI-genererad text baserat på all relevant data.

**Aktiviteter:**
- Edge function: `sta-document-draft` — tar `enrollment_id` + `doc_type` + ev. `section` och returnerar utkast
- Edge function: `sta-summary-week` — veckosumma för en deltagare (redan delvis prototypat)
- Prompts per dokumenttyp som tar:
  - Profil + anpassningar + språkstöd
  - Aktivitetslista (vilka dagar, vilka övningar, reflektioner)
  - Skattningar (poäng + AT-kommentarer)
  - Snabbanteckningar och taggar
  - Pulse-checks-trender
  - Konsulentens egna anteckningar
- Modell: `openai/gpt-oss-120b` (låst per projektregel)
- **Klart-markering:** utkast taggas alltid "AI-utkast" tills konsulent godkänt
- **Audit-logg:** vad gick in, vad kom ut, vem godkände

**Prioriterad ordning:**
1. Delredovisning Del 1 (vanligast, mest data tillgängligt)
2. Initial planering (kort, väl-strukturerad)
3. Delredovisning Del 2
4. Övriga delredovisningar
5. Anmälan arbetsprövning
6. Information från arbetsprövningsplats
7. Åtgärdsplan vid utebliven AP

**Beroenden:** Fas 1 + Fas 2 + Fas 3 (för att ha skattningsdata att summera)

**Risker:**
- AI-hallucination — måste granskas
- Konsulenten litar för mycket på AI — bygg in granskningskrav

**Tid:** 2 sprintar (4 veckor) för Del 1 + Initial planering. Sen 1 sprint per ytterligare dokumenttyp.

---

### Fas 5: PDF-fyllning av AF:s blanketter
**Mål:** Exportera till AF:s officiella ifyllbara PDF, med all data ifylld + AI-utkastat fritext.

**Aktiviteter:**
- Använd `pdf-lib` (npm) för att fylla i AF:s ifyllbara PDF-fält
- Per dokumenttyp: mapping `pdf_field_name` → portalens datakälla
- Inventera fältnamn i alla AF-blanketter (kräver att läsa PDF:erna i `pdf-lib`)
- Export-knapp "Ladda ner PDF" på dokument-utkastet
- Förhandsvisning innan nedladdning
- Versionshantering: spara varje version av PDF som genererats

**Beroenden:** Fas 4 (för att ha utkasten)

**Risker:**
- AF-blanketterna kan uppdateras — versions-hantering kritiskt
- Vissa PDF:er kan ha låsta fält eller komplex layout

**Tid:** 1 sprint (2 veckor) för första dokumenttypen. Sen ~1 dag per ytterligare blankett när mönstret är på plats.

---

### Fas 6: Avancerad automation
**Mål:** AI hjälper proaktivt, inte bara på beställning.

**Aktiviteter:**
- **Automatisk veckosumma** per deltagare varje fredag — landar i konsulentens inkorg
- **Tidiga varningssignaler:** 3+ dagar låg pulse-check → flagga; inaktivitet i portalen → flagga; pessimistiska reflektioner → flagga (med samtycke)
- **Förslag på fokusyrke** baserat på RIASEC + skills gap + sparade jobb
- **Förslag på Del-byte:** AI tittar på aktivitetsomfattning + skattningstrend och föreslår tidpunkt för Del 2 → Del 3
- **Arbetsdagbok digital** (Del 3-4) ersätter PDF-dagböckerna
- **Auto-flagga "åtgärdsplan utebliven AP"** efter 4 veckor i Del 3 utan godkänd plats
- **Möte-mode (C6)** — under möte med deltagare visas senaste data + förslag på frågor

**Beroenden:** Fas 1-5

**Risker:**
- För mycket "nudge" från AI blir störande — UX-validering krävs
- Samtycke-flöden måste vara solida för känsliga signaler

**Tid:** 2 sprintar (4 veckor)

---

### Fas 7: AF-integration och kvalitetssäkring
**Mål:** Smidigt flöde från konsulent-redigering till inskickad rapport till AF.

**Aktiviteter:**
- Konsekvenscheck innan export ("Du har 3 obligatoriska fält som är tomma")
- E-postutskick till AF med PDF som bilaga (eller direkt API om sådant öppnas)
- Statushantering: Utkast → Granskning → Inskickad → Bekräftad av AF
- **Audit-trail:** Vem har sett vad? När? Vad ändrade konsulent jämfört med AI-utkast?
- Backup av alla inskickade dokument
- Versionerade rapport-mallar (om AF uppdaterar `Af 00825 3.0` → `4.0`)

**Beroenden:** Fas 5

**Risker:**
- AF:s API är inte öppet idag — kanske aldrig blir
- Backup-strategi för GDPR-känsliga dokument

**Tid:** 2 sprintar (4 veckor)

---

## Del E — MVP-cut

Om vi vill köra **smallest viable product** för att se om visionen faktiskt fungerar:

1. **Fas 1** (datamodell + startsamtals-formulär)
2. **Fas 2** (snabbanteckningar + pulse-checks)
3. **Fas 3 men bara DOA + MOHOST** (i Del 1)
4. **Fas 4 men bara Delredovisning Del 1**
5. **Fas 5 för Delredovisning Del 1**

**Resultat:** Du kan ta en testdeltagare genom hela Del 1 i portalen, samla datan smidigt, och få ut en delvis-autofylld Delredovisning Del 1 som PDF.

**Tid:** 8-10 veckor.

**Vad det bevisar:**
- Att datafångst faktiskt fungerar i konsulenternas vardag
- Att AI-utkast håller tillräcklig kvalitet
- Att PDF-fyllning av AF:s blankett är genomförbar

Efter MVP iterera per dokumenttyp och utöka enligt fasplanen.

---

## Del F — Risker och mitigeringar

| Risk | Mitigering |
|------|------------|
| **AI-hallucinationsrisk** | AI-utkast är aldrig final. Granskningssteg är obligatoriskt i UI. Audit-logg över vad konsulent ändrade. |
| **GDPR-konflikt** | Befintlig `DataSharingSettings` styr åtkomst. Sensitiva data (wellness, dagbok, AI-chat) kräver explicit samtycke. Konsulenten ser aldrig råa dagbok-rader utan samtycke. |
| **AF uppdaterar blankett** | Versionera mallar. När `Af 00825 3.0 → 4.0` testas mappningen om. Notisbanner till konsulenten "Ny version finns". |
| **Konsulent litar för mycket på AI** | UI-design tvingar granskning: AI-utkast har gul ram, "Godkänn"-knapp först aktiv efter ändring eller läs-bekräftelse, klart-stämpel på godkänt. |
| **Voice-to-text på svenska kvalitet** | Använd Whisper API (god svenska). Visa transkript för redigering innan sparande. |
| **Manuellt tillagda deltagare har ingen Jobin-data** | Drawer visar "Begränsad data — koppla Jobin-konto för fler insikter". AI-utkast är kortare men funktionellt. |
| **Konsulenten har för många deltagare och hinner inte granska AI-utkast** | Bygga in **batch-granskning**: Granska 5 utkast i sviten med samma fokus. |
| **Deltagar-trötthet av pulse-checks** | Frivilligt. Gamification om det funkar (streak). Stäng av om obesvarad 3 dagar. |
| **AF accepterar inte digitala signaturer** | I tidigt skede: konsulenten skriver ut PDF:en, signerar för hand, scannar in. Senare: utforska AF:s digitala kanaler. |

---

## Del G — Tidsestimat sammanfattat

| Fas | Innehåll | Tid |
|-----|----------|-----|
| 1 | Datamodell + startsamtal + aktivitetsloggning | 6 veckor |
| 2 | Snabbanteckningar + voice + pulse + bulk-närvaro | 4 veckor |
| 3 | 5 skattningsinstrument i portalen | 6 veckor |
| 4 | AI-utkast (Del 1 + Initial planering först) | 4 veckor |
| 5 | PDF-fyllning av AF:s blanketter | 2 veckor första, sen 1 dag/ny blankett |
| 6 | Avancerad automation (veckosumma, varningar, möte-mode) | 4 veckor |
| 7 | AF-integration + kvalitetssäkring | 4 veckor |

**Total tid till full vision:** ~30 veckor (≈ 7-8 månader)
**Tid till MVP:** ~10 veckor (Fas 1 + 2 + minimerade Fas 3-5 för Del 1)

---

## Del H — Rekommenderad start

**Vecka 1-2:**
1. Granska och godkänn denna roadmap
2. Bekräfta MVP-omfattning (Fas 1+2 + Del 1-flöde)
3. Skapa Supabase-migrationer för Fas 1-tabellerna (utkast finns i `sta-pages-plan.md`)

**Vecka 3-8 (Fas 1):**
4. Implementera datamodell + RLS
5. Bygg startsamtals-formuläret
6. Aktivitetsloggning kopplad till befintliga STA-sidan
7. Snabbanteckningar med taggar

**Vecka 9-12 (Fas 2 + smal Fas 3):**
8. Voice-to-text på fritext-fält
9. Pulse-checks för deltagare
10. DOA + MOHOST-formulär i portalen

**Vecka 13-14 (Fas 4 + 5 för MVP):**
11. AI-utkast för Delredovisning Del 1
12. PDF-fyllning av Delredovisning Del 1-blanketten
13. End-to-end test med en testdeltagare

Efter vecka 14 utvärderar vi MVP och prioriterar nästa fas baserat på vad som faktiskt funkade.
