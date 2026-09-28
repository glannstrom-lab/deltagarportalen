# Skarpt funktionstest 2026-09-28 — område: jobbsok

**Konto:** `skarpt-jobbsok-2026-09-28@jobin.test` (id `699654c0-1a5a-4784-b177-277c5f5dd0b2`), skapat via admin-API,
samtycke (villkor + integritet + AI) genomfört som en användare. Raderat sist via portalens egen väg (se Bugg-sektionen — deletion fungerade helt).

**Vad jag muterade:** ett CV (Snabb-CV → fullständig byggare, mall bytt till Sidokolumn, foto uppladdat, en
arbetslivserfarenhet, en kompetens, ett CV importerat via PDF), ett sparat jobb, en jobbevakning (med och utan
länsfilter), en ansökan flyttad Sparad → Ansökt, en spontanansökan-sökning (företag, ej sparade), ett
personligt brev-försök (se SJ1 — sparades aldrig).

**Vad jag städade:** kontot raderat via Inställningar → Integritet → Begär radering → Radera nu istället →
skrev "RADERA" → Radera för alltid. Verifierat tomt i `auth.users`, `profiles`, `cvs`, `cover_letters`,
`saved_jobs`, `job_alerts`.

**AI-anrop (av 12):** cv-writing (Förbättra) ×2 (första avbruten av omladdning, andra fullföljd och sparad),
cv-import (PDF-tolkning) ×1, personligt-brev ×1–2 (se SJ1 — resultatet gick förlorat), ai-company-search
(spontanansökan) ×2 (första gav 0 träffar på "Äldreboenden/Stockholm", andra gav 10 träffar på
"Restauranger/Göteborg"). Totalt ~6–7 av 12.

## Testmatris

| Funktion | Resultat | Kommentar |
|---|---|---|
| CV: Snabb-CV (3 steg) | ✅ | Namn/titel/kontakt, genererar CV korrekt |
| CV: mallbyte (Design-steget, förhandsvisning) | ✅ | Sidokolumn valdes, autosparades, syns i förhandsvisning |
| CV: "Om dig"-fälten | ✅ | Alla sex fält (EG1-fixen håller — unika id via `useId()`) |
| CV: Profil/sammanfattning + AI-skrivhjälp ("Förbättra") | ✅ | Riktigt AI-anrop (~12–24 s), tydlig AI-märkning, "Använd" skriver till fältet, "Spara CV" persisterar till `cvs.summary` |
| CV: "Börja från en mall" (ny funktion, UT1-fixen) | ✅ | Syns bara när fältet är tomt, infogar hakparentes-text märkt "inte AI", försvinner när fältet fylls |
| CV: Erfarenhet — lägg till jobb | ✅ | Kräver explicit "Klar" + "Spara CV" (autosave-debounce hann inte annars, se Förbättringar) |
| CV: Kompetenser — lägg till | ✅ | Sparas i `cvs.skills` |
| CV: Profilbild-uppladdning | ✅ | Riktig uppladdning till Vercel Blob, `cvs.profile_image` får en riktig URL |
| CV: Importera CV (PDF) | ⚠️ | Namn/titel/erfarenhet-rubrik tolkas rätt — men se **SJ2** (kontaktuppgifter tappas, datum blir ogiltigt) |
| CV: Importera CV (.docx) | ⏭ | Testfil skapad men aldrig körd (tidsbudget) |
| CV: CV-versioner ("Spara nuvarande version", säkerhetskopia före import) | ✅ | Automatisk säkerhetskopia skapades innan import tillämpades |
| CV: PDF-export, kört två gånger | ✅ | Båda lyckades (44 556 byte), SV2 (kallstart-500) reproducerades inte denna gång |
| CV: ladda om mitt i och kontrollera att data finns kvar | ✅ | Data i DB kvar efter reload (steget hoppar till Design/mallvalet varje gång — känt, EG3, ej omrapporterat) |
| Personligt brev: mall + välj sparat jobb | ✅ | |
| Personligt brev: AI-utkast, spara automatiskt i Mina brev | ❌ | **SJ1 — kritiskt.** Sparas aldrig; UI:t ljuger om att det gjorde det |
| Personligt brev: reload mitt i generering → "Utkastet hann inte bli klart" | ✅ (första gången) | Texten och knappen "Skriv utkastet igen" stämmer exakt mot EG2-specen |
| Personligt brev: steg 3 uppdaterar samma rad (inte dubblett) | ⏭ | Kunde inte prövas — ingen rad skapades alls (SJ1) |
| Jobbsök: fritext | ✅ | |
| Jobbsök: län-filter | ✅ | Stockholms län → `SE110` |
| Jobbsök: spara jobb | ✅ | |
| Jobbsök: spara sökning som bevakning | ✅ | `job_alerts.region` = `SE110` (NUTS), och `client/api/job-alerts.js` har en fungerande `NUTS_TILL_LANSKOD`-karta (SE110→01) — den gamla "tyst bevakning"-buggen är fixad |
| Ansökningar: pipeline, statusbyte (Sparad → Ansökt) | ✅ | `saved_jobs.status='APPLIED'`, `application_date` sätts till dagens datum |
| Spontanansökan: AI-företagssökning | ✅ | 10 träffar, verifierade mot Bolagsverket, tydlig AI-disclaimer |
| Översikt: "nästa steg" ändras efter handling | ✅ | Efter CV+sparat jobb blev nästa steg korrekt "Skriv ditt första personliga brev"; "Det som är igång" visade ansökan |
| Radera konto | ✅ | Fullständig kaskad, verifierad tom i sex tabeller |

**Sammanfattning:** 24 prövade, 20 ✅, 1 ❌ (kritisk), 1 ⚠️ (hög), 2 ⏭.

## Buggar

### SJ1 — Kritisk: AI-genererat personligt brev sparas aldrig, och UI:t hävdar att det gjorde det

**Repro:**
1. `/cover-letter` → välj mall + ett sparat jobb → "Skriv brevet"
2. Klicka "Skriv ett utkast åt mig"
3. Ladda om sidan direkt (innan AI-svaret hunnit komma, ~15–50 s)
4. Banner: "Utkastet hann inte bli klart innan sidan laddades om... Skriv utkastet igen" — **korrekt, fungerar**
5. Ladda om sidan igen (utan lyckad ny generering)
6. Banner byter till: **"Vi tog fram det åt dig. Gäller det ett annat jobb kan du börja om."** med knappen "Fortsätt på det"
7. Klicka "Fortsätt på det" → steg 3 "Läs igenom och spara" visas, alla tre stegcirklar markerade klara — men brevrutan är tom och förhandsvisningen visar bara platshållartexten "Här visas brevet när du börjat skriva."
8. `cover_letters` har **0 rader** för användaren. "Dina brev" visar tomt-läget ("Skriv ditt första brev").

**Förväntat:** Ett tomt brev ska aldrig presenteras som klart. Banner-texten "Vi tog fram det åt dig" ska bara visas om `editedLetter`/`generatedLetter` faktiskt har innehåll.

**Faktiskt:** Steg 1–3 markeras klara och en tom text presenteras som ett färdigt, redo-att-spara brev.

**Belägg:**
- Skärmdump `docs/review-2026-09-28-rollspel/skarpt-jobbsok/d-y0-brevtext.png` (tom textruta + tom förhandsvisning, alla tre steg gröna)
- Skärmdump `docs/review-2026-09-28-rollspel/skarpt-jobbsok/d-z0-dina-brev.png`-motsvarande text: "Dina brev" tomt
- SQL: `SELECT * FROM cover_letters WHERE user_id='699654c0-1a5a-4784-b177-277c5f5dd0b2'` → 0 rader
- `docs/review-2026-09-28-rollspel/skarpt-jobbsok/txt/d-w0-efter-reload.txt` (korrekt "hann inte"-läge, för jämförelse)

**Trolig kod och rotorsak:** `client/src/components/cover-letter/CoverLetterWrite.tsx`.
`useAutoSave`s `onRestore` (rad ~371–389) sätter `avbrutenGenerering=true` bara om `saved.genererarSedan` är satt — men **återställer aldrig `genererarSedan` till liveState**. `autoSaveData` (rad 362–369) läser sedan det *nollställda* liveState och skriver tillbaka `genererarSedan: null` till lagringen vid nästa autosave. En andra omladdning ser därför `saved.genererarSedan` som falsy, hoppar över "hann inte bli klart"-grenen, och landar i annars-grenen (rad 953, 968–971) som sätter `aterstalltUtkast` enbart för att `formData.company`/`jobTitle` är ifyllda (rad 382) — **oavsett om `editedLetter` har innehåll**. Det bryter mot filens egen dokumenterade regel (rad 13–14): "en tom textarea är inte ett färdigt brev."

**Föreslagen fix:** antingen (a) inkludera `genererarSedan` i det som `onRestore` skriver tillbaka till liveState, eller (b) villkora `aterstalltUtkast`/banderollens "success"-gren på att `saved.editedLetter?.trim()` faktiskt har innehåll — inte bara att ett jobb är valt.

---

### SJ2 — Hög: CV-import (PDF) tappar e-post/telefon och skriver ogiltiga datum i arbetslivserfarenheten

**Repro:**
1. Skapa/importera ett CV (PDF) med tydlig e-post, telefon och en erfarenhetsrad "2019–2024"
2. "Importera CV" → ladda upp → granska sammanfattningen (visar bara namn/titel/ort, **ingen** e-post/telefon)
3. "Fyll i mitt CV med det här" → "Spara CV"
4. `cvs.email`/`cvs.phone` är **oförändrade** (behåller det gamla värdet — här "jobbi.testsson@example.com"/"0701234567" i stället för PDF:ens "anna.importsson@example.com"/"073-1234567")
5. `cvs.work_experience[0].startDate = "2019-2024"`, `endDate = ""` — ett ogiltigt värde för `<input type="month">`
6. Gå till Erfarenhet-steget efter import: både Startdatum (markerat obligatoriskt med `*`) och Slutdatum visas **tomma**, trots att data "finns" i databasen

**Förväntat:** Import ska antingen fylla e-post/telefon från källdokumentet (eller tydligt visa att de saknas i sammanfattningen, vilket den delvis gör — "Kontakt: Göteborg" utan e-post/telefon antyder att parsern aldrig försökte). Datumintervall ska delas upp i separata start-/slutdatum i `YYYY-MM`-format, inte klämmas in helt i `startDate`.

**Belägg:**
- Skärmdump `docs/review-2026-09-28-rollspel/skarpt-jobbsok/d-k1-efter-spara.png` (E-post/Telefon-fälten visar de gamla värdena efter import)
- Skärmdump `docs/review-2026-09-28-rollspel/skarpt-jobbsok/d-l0-erfarenhet-efter-import.png` (tomma datumfält, Startdatum markerat obligatoriskt)
- SQL: `work_experience[0].startDate = "2019-2024"`, `endDate = ""`; `email`/`phone` oförändrade efter import

**Trolig kod:** CV-importens AI-prompt/parser (serverdelen bakom "Importera CV"-modalen, sannolikt i `client/api/_prompts/` för cv-import-funktionen) — mappar inte käll-CV:ts kontaktfält till resultatet, och validerar/delar inte upp datumintervall till separata `startDate`/`endDate` i `YYYY-MM`.

---

### SJ3 — Låg: CORS-fel mot `/auth/v1/user` loggades två gånger under CV-redigering

**Belägg:** Konsolfel (ej i `natverk.txt`, eftersom en CORS-blockerad fetch aldrig får ett svar att logga):
```
Access to fetch at 'https://odcvrdkvzyrbdzvdrhkz.supabase.co/auth/v1/user' from origin 'https://www.jobin.se'
has been blocked by CORS policy... TypeError: Failed to fetch
```
Ingen synlig funktionsstörning — fälten sparades ändå. Kan vara en godartad race vid token-refresh, men
förtjänar en snabb koll eftersom den upprepades identiskt två gånger på olika sidor.

## Förbättringar

1. **Autosave-debounce för CV-erfarenhet/kompetenser är för långsam för snabba interaktioner** — ett tillagt
   jobb som inte följs av ett explicit "Klar"+"Spara CV" (eller en väntan på några sekunder) riskerar att gå
   förlorat om användaren snabbt navigerar vidare. Värt att mäta debounce-fönstret och överväga att spara
   direkt vid "Klar"-klick i stället för att vänta på nästa periodiska autosave.
2. **CV-importens sammanfattningsruta** ("Namn / Yrkestitel / Kontakt") borde visa e-post och telefon separat
   så att en bortfallen kontaktuppgift syns direkt i förhandsgranskningen, inte bara "Kontakt: Göteborg".
3. **Personligt brev-guiden** bör visa en tydlig fel-status (inte en tyst övergång till "success") om en AI-
   generering aldrig resulterade i sparat innehåll — se SJ1.
