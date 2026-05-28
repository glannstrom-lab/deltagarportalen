# Steg till arbete — förbättringsförslag (deltagarvyn)

Skapad 2026-05-28 av Claude tillsammans med Mikael. Listan dokumenterar idéer
som dykt upp under DOA-arbetet och som vi vill ha tillgängliga för framtida
sessioner.

## Kontext (det viktiga som påverkar prioritering)

- **AF tar över STA på 31 orter från jan 2026.** Pågående deltagare slutför insatsen i max 12 mån. Nya deltagare slutar komma, men kvaliteten för de som är inne måste hålla i mål.
  - [Sveriges Arbetsterapeuter](https://www.arbetsterapeuterna.se/tidningen/tidigare-nummer/artikelarkiv/artiklar-2025/arbetsfoermedlingen-tar-hem-steg-till-arbete-paa-31-orter/)
  - [Riksrevisionen 2025](https://www.riksrevisionen.se/granskningar/granskningsrapporter/2025/arbetsformedlingens-stod-till-personer-med-funktionsnedsattning.html)
- **Riksrevisionens kritik:** undermåliga lokaler, deltagare får inte praktik, svag identifiering av funktionsnedsättning, försämring över tid.
- **Arbetsterapeut-enkäten:** "Hinner inte ha samtal med deltagaren — gör bara det absolut nödvändiga, inget som främjar deltagarens process." ([enkätrapport](https://www.arbetsterapeuterna.se/media/rq0ovpat/enkaetrapport-steg-till-arbete.pdf))
- **Kognitiv tillgänglighet** (ISO 21801, [Begripsam](https://www.begripsam.se/lar-dig-mer/rekommendationer-for-digital-kognitiv-tillganglighet)): 11 områden — bl.a. autonomi, motivation, organisation/tid, trygghet/tillit, hjälp vid misstag.

**Strategisk slutsats:** Jobins värde framåt är att (a) avlasta arbetsterapeuten så hen får tid till samtalet, och (b) göra deltagarens framsteg synliga så insatsen känns meningsfull även när lokalerna är gråa.

---

## A. Snabba vinster (1–3 dagar vardera)

### ✅ A1. "Din profil växer fram" — insiktssammanfattning på Översikt
**Implementerad 2026-05-28**

**Problem:** Deltagaren har gjort pulse-checks, fyllt i kompetenskartläggning, provat arbetsstationer, skrivit reflektioner — men ser inget av det samlat. Det enda framstegsmåttet är "Dag 7 av 15".

**Förslag:** Ett insiktskort på Översikt som visar:
- 3–5 styrkor från `sta_quick_notes`
- Topp 3 mönster från pulse checks ("Du har mest energi på onsdagar")
- Senaste reflektioner från arbetsstationer/dagsslinga
- Eventuellt fokusyrke + motivering

### ✅ A2. Övergångsskärm Del→Del
**Implementerad 2026-05-28**

**Problem:** Idag märks det inte när Del 1 slutar — räknaren bara stannar.

**Förslag:** När `currentDay > totalDays` (eller AT markerar Del 1 klar), visa firande + sammanfattning: "Du har klarat Del 1. Här är vad du tar med dig till Del 2." Lista konkret: styrkor, fokusområden, anpassningar.

### ✅ A3. Energi-historik (visualisering av pulse + weekly check-in)
**Implementerad 2026-05-28**

**Problem:** Deltagaren skickar pulse-check varje dag men ser aldrig sin egen kurva.

**Förslag:** Liten sparkline-graf på Översikt: "Senaste 14 dagarna" med emoji-mönster. Bygger självkännedom och ger AT konkret samtalsunderlag.

### ✅ A4. Bättre tomtillstånd för icke-kopplade deltagare
**Implementerad 2026-05-28**

**Problem:** `NoEnrollmentEmptyState` säger bara "Kontakta din konsulent".

**Förslag:** Visa istället en förhandsvisning: "Det här kommer du se: en veckoplan, dagliga övningar, din konsulent…". Förväntan-styrning enligt Begripsam Trygghet/tillit.

### A5. Push-/e-postpåminnelser för dagens övning (opt-in)
Portalen har redan `send-invite-email` edge function — utöka med dagspåminnelse: "Imorgon dag 6 — Karriärvägledning del 2." Tidsstöd är topp-rankat under kognitiv tillgänglighet (ISO 21801).

### A6. Frånvarodagar förskjuter dagsslingan i UI
Idag räknar `weekdaysSinceStart` bara vardagar — frånvaro tas inte med. Resultat: deltagare som var sjuk dag 4 ser inte att dagen ligger kvar att göra. Fix: filtrera bort `absences` med `kind='sick'` ur räkningen.

### A7. Konsulent-statusindikator
Visa när AT senast var inloggad / läste deltagarens reflektioner. Bygger förtroende — deltagaren vet att någon faktiskt ser.

---

## B. Medelstora investeringar (1–2 veckor vardera)

### ✅ B1. DOA-självskattning för deltagaren
**Implementerad 2026-05-28** — se `supabase/migrations/20260528_sta_participant_doa_self_save.sql` + `DoaSelfAssessment.tsx`.

Inkluderar AI-sammanfattning för AF-blankett sida 4 (Mål och planering + 5 kategori-rutor) via `sta-doa-sammanfattning` endpoint (gpt-oss-120b).

**Kvarstår från ursprungligt förslag:**
- Voice-over per item (Web Speech API)
- Sida 4 Mål och planering — markera "Förbered svar inför nästa möte" så AT vet att det är dialogmaterial

### B2. Karriärvägledning som strukturerad övning, inte bara KB-länk
Idag pekar dag 5–6 på en KB-artikel och en exercise. Materialet i `sta/Del 1/Del 1 arbetsuppgifter/Karriärvägledningshäfte 1-3/` är tre häften med konkreta övningar.

**Förslag:** 3-stegsflöde i portalen:
- Del 1: vem är jag, vad har format mig
- Del 2: vad är viktigt för mig, vilka värderingar
- Del 3: vilka yrkesområden matchar — output: 3 fokusyrken med motiveringar

Sista steget kopplas till Del 3-flikens `focus_occupation` automatiskt.

### B3. Voice-input för dagliga reflektioner
Bygg mic-knapp som transkriberar via Whisper. Spara både ljud (Vercel Blob) och transkription. Kraftigaste enskilda tillgänglighetsvinsten för långtidsarbetslösa med kognitiva utmaningar.

### B4. Kompendium-läsmiljö (inte bara PDF-länk)
- Lättläst-toggle
- TTS-uppläsning per avsnitt
- Anteckningsruta som sparas i `sta_quick_notes`
- Miniquiz "Kollade jag att jag förstod?"

Börja med: Kompendium 1 STA, Kompendium 2 Hälsoskola, Karriärvägledningshäfte 1.

### B5. Konsulent-transparens-sida ("Det här ser Linda")
GDPR + förtroende. En sida som listar allt som delas med konsulenten + möjlighet att lägga till en kommentar eller korrigera.

### B6. AI-coach som verkligen läst deltagarens data
När AI-coachen öppnas från STA-sidan får backend en sammanfattning av kompetenskartläggning, senaste 7 pulse checks, senaste 5 reflektioner, aktuell del + dag, fokusyrke.

**Lås kvar:** modellen är `openai/gpt-oss-120b`. Bara prompt-konstruktionen ändras.

### B7. Veckoplaneringsläge för Del 3/4
Bygg veckoplanering där deltagaren tillsammans med AT lägger in: "Mån-tor på TechCorp 09–14, fre möte 10:00 med Linda." Visas i Översikts veckoplan istället för "Innan start".

---

## C. Strategiska initiativ (3–6 veckor)

### C1. "Visa min utveckling"-rapport
PDF-rapport "Min resa hittills" som deltagaren genererar och kan visa familj, handläggare eller framtida arbetsgivare. Använd `staPdfExport.ts`-infrastruktur + CVPrintLayout-mönster (gradient-baserad print, inte JS-paginering).

### C2. Hälsoaktiviteter som faktisk delkomponent (inte bara KB-länkar)
- Sömndagbok (material: dag 7 Sömndagbok.pdf)
- Stressdagbok kopplad till pulse-checks
- 5-faktorer-övning (dag 9 har konkret arbetsblad)

AT ser sammanfattning: "Anna sov sämre vecka 2 — kan vara kopplat till start på stationsövningar."

### C3. Strukturerad "arbetsprövningsplats-portal" för Del 3/4
- Kontaktperson + telefon
- Schema (veckan)
- Snabblänk: ring sjuk
- Frågor jag vill ta upp på uppföljningen
- Vad arbetsgivaren behöver veta om mig (anpassningar)
- Mitt arbetsmiljöansvar (AF-info)

Materialet finns i `sta/Del 3/Arbetsprövning/Riktlinjer för arbetsprövningsplats.docx`.

### C4. Språkstöd som faktiskt fungerar (inte bara en flagga)
Översätt 14 dag-titlar + dagsslinga-instruktioner till arabiska, somaliska, tigrinja, dari, pashtu. TTS-stöd. AT-side: "Skicka veckosammanfattning på arabiska".

### C5. "Förbered nästa möte"-genväg
Tre dagar före nästa AT-möte: en notis med strukturerad input som blir agendapunkter: Vad har gått bra / Vad har varit svårt / Frågor jag har / Beslut jag vill ta.

---

## Vad jag INTE skulle bygga

- **Gamification med poäng/badges** — direkt mot DESIGN.md §1 Manifestet
- **AI som ersätter konsulenten** — coach ja, ersättare nej
- **Push-notiser default på** — opt-in only
- **Heavy onboarding-wizard** — StaOnboardingModal räcker; lägg till mikro-introduktioner per ny del istället

---

## Prioritetsordning för fortsatt arbete

Klart: A1, A2, A3, A4, B1.

Nästa naturliga steg (om Mikael vill plocka):
1. **B3 — Voice-input för reflektioner** (störst tillgänglighetsvinst för målgruppen)
2. **C5 — "Förbered nästa möte"** (avlastar AT direkt — det Riksrevisionen sa fattades)
3. **B2 — Karriärvägledning som strukturerad övning** (koppling Del 1 → Del 3 fokusyrke)
4. **A5 — Dagspåminnelser via e-post** (snabb vinst, befintlig infrastruktur)
5. **B5 — Konsulent-transparens-sida** (GDPR + förtroende)
