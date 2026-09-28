# Rollspel deltagare utan konsulent: Bengt, prod 2026-09-28 (måndag kväll)

**Persona.** Bengt, 58, truckförare/lagerarbetare i 30 år, varslad från ett lager i Jönköping. Ingen
konsulent, ingen kommun, inget projekt — han hittade jobin.se via en Google-sökning ("varsel vad
betyder det") och registrerade sig själv. Låg digital vana: Facebook och BankID, aldrig skrivit ett
CV själv, ingen LinkedIn.

**Metod.** Kontot skapades med admin-API:t (`POST /auth/v1/admin/users`,
`rollspel-bengt-2026-09-28@jobin.test`) sedan ett gäst-pass mot en publik guide gjorts i Playwright
utan att skicka registreringsformuläret. Inloggning skedde därefter med körarens vanliga
engångslänk-flöde. Körningarna gjordes på mobil 390×844 och dator 1366×900, i sammanlagt 26 steg-
och felsökningsskript i `e2e/rollspel-2026-09-28-egen-*.cjs`. Skärmdumparna ligger i `egen/`,
sidtexterna i `egen/txt/`. `natverk.txt` är tom hela passet — inga svar ≥400 mot Supabase/API
förekom, till skillnad från Anna/Sara-passet 2026-09-27. Fem riktiga AI-anrop gjordes (två
personligt brev, tre intervjuträning), inom taket på tio.

**Vad jag muterade i skarp drift, och städningen.** Ett riktigt konto skapades, fyllde i ett CV
(Snabb-CV + en arbetslivserfarenhet), exporterade två PDF:er, sökte och sparade två jobb, skapade en
jobbevakning, skrev och sparade ett AI-brev, och körde en fråga i intervjuträningen. Kontot
raderades sist via portalens egen väg (Inställningar → Integritet → "Begär radering av konto" →
"Radera nu istället" → skriv RADERA → "Radera för alltid"). Verifierat direkt mot databasen efteråt:
`auth.users`-posten ger 404 på admin-API:t, `profiles`-raden är borta, och `cvs`/`cover_letters`/
`saved_jobs`/`job_alerts` ger alla `count = 0` för kontots id. Raderingen (art. 17) fungerar
fullständigt och kaskaderar korrekt.

---

## Helhetsintryck

"Jag fattar vad jag ska göra först — sidan säger rakt ut 'Börja med ditt CV', och det tog mig under
en halvminut att få ihop något med Snabb-CV. Men två gånger under kvällen gjorde jag exakt det jag
brukar göra när jag inte fattar en sida — bytte flik eller laddade om — och båda gångerna försvann
det jag hade väntat på. Ingen sa till mig att det hänt. Och när jag väl var inne och fyllde i mina
uppgifter visste jag inte om jag stod i rätt ruta — allt kändes som samma fält." Portalen möter
Bengt bra i entrén (guide → registrering → översikt → CV är en rak, snabb väg) men förlorar honom i
detaljerna: ett tillgänglighetsfel i CV-formuläret, och två AI-flöden (brev, intervju) som inte tål
att han gör det en person med låg digital vana statistiskt sett ofta gör — laddar om, byter flik,
väntar inte klart.

**De 3 viktigaste:**
1. **Alla sex fält på CV-byggarens "Om dig"-steg delar samma HTML-id** (`cvbuilder-f1`) — etiketterna
   pekar fel för skärmläsare, och `getByLabel`/`for`-koppling går inte att lita på (EG1).
2. **Ett AI-genererat personligt brev kan gå förlorat utan varning** — vid omladdning mitt i
   genereringen (upp till ~49 sekunder) visar en "vi har redan gjort det åt dig"-banner ett tomt
   brev, och även ett färdigt brev sparas ingenstans förrän man aktivt klickar sig till steg 3 och
   trycker Spara (EG2).
3. **CV-byggaren minns aldrig vilket steg man senast var på** — varje sidladdning börjar om på
   mallval, även när fem av sex delar redan är klara och allt är sparat (EG3).

---

## Tidsåtgång / friktion

| Uppgift | Tid / klick | Var man tvekar |
|---|---|---|
| Guide → "Skapa ditt CV" → registreringssidan | ~2,5 s, 1 klick | Ingen — landar rätt på `/register?returnTo=/cv` (TR2 håller) |
| Samtyckessteg (villkor + integritet + AI) | ~2 s efter ikryssning | Ingen |
| Onboardingtur (5 steg) | 4 klick på "Nästa" | Ingen, men se EG4 om vad som händer direkt efter |
| Snabb-CV: namn → yrke → kontakt → CV skapat | ~13–16 s totalt, 3 skärmar, 6 fält | Inget hos Snabb-CV själv — friktionen kommer i nästa steg (EG1, EG4) |
| Lägga till en arbetslivserfarenhet | ~2 s spara, men syns bara efter man hittar "Klar"-knappen längst ner i kortet | Lätt att missa att posten inte är stängd förrän man scrollar ner |
| Exportera PDF (mobil) | 8–9 s per export | Ingen — fungerar, sökbar text, rätt kodning |
| Jobbsök: fritext + län + Spara + Spara som bevakning | ~6,6 s för hela sekvensen | Ingen — `job_alerts.region` fick korrekt NUTS-kod SE211 |
| Personligt brev med AI, från jobb-val till sparat brev | ~40–49 s väntan per generering, plus ett extra steg (3 av 3) för att spara | Stor — se EG2. Utan att förstå att steg 3 krävs riskerar hela väntetiden vara bortkastad |
| Intervjuträning: starta → första frågan | ~2 s | Ingen |
| Intervjuträning: svara → AI-betyg | ~9–10 s | Ingen i en sammanhängande session — se EG5 om omladdning |

---

## Kritiskt

**EG1. Alla sex fält på "Om dig"-steget i CV-byggaren delar id `cvbuilder-f1`.** · *nytt*
- **Var:** `/cv`, steg 2 "Om dig": Förnamn, Efternamn, Yrkestitel, E-post, Telefon, Ort.
- **Belägg:** DOM-utdrag (`egen/txt` saknar denna specifika logg, men se `m-22b-ort-pa-steg2.png` där
  `getByLabel(/^Ort$/i)` läste in värdet "Bengt" — Förnamns-fältets värde, inte Orts). Ett riktat
  `evaluate()`-anrop bekräftade: samtliga sex `<input>` har `id="cvbuilder-f1"`, och samtliga sex
  `<label>` har `for="cvbuilder-f1"`. Webbläsaren binder ett `for`-attribut till det FÖRSTA elementet
  med matchande id i dokumentet — så en skärmläsare som fokuserar t.ex. Ort-fältet kan få det
  uppläst som "Förnamn", och verktyg (inklusive den här testkörningen) som letar upp fält via sin
  etikett hamnar i fel ruta.
- **Fil:** `client/src/pages/CVBuilder.tsx:320-340` — en lokal `Input`-hjälpkomponent i samma fil
  (skild från den delade `components/ui/Input.tsx`, som korrekt använder Reacts `useId()` på rad 38)
  hårdkodar `id="cvbuilder-f1"` och `htmlFor="cvbuilder-f1"` för varje instans. Komponenten används
  på sex ställen: rad 1012, 1013, 1017, 1021, 1022, 1026.
- **Åtgärd:** byt den lokala `Input`-komponenten till `useId()` (som `components/ui/Input.tsx`
  redan gör), eller återanvänd den delade komponenten direkt. WCAG 4.1.1 (unika id:n) och 1.3.1
  (info och relationer).

**EG2. AI-genererat personligt brev kan gå förlorat helt utan varning eller spårbarhet.** · *nytt*
- **Var:** `/cover-letter`, steg 2 "Skriv brevet" → "Skriv ett utkast åt mig".
- **Belägg:** Två separata fynd, båda reproducerade:
  1. **Omladdning mitt i genereringen ger ett tomt "återupptaget" brev.** Jag klickade
     "Skriv ett utkast åt mig", väntade ~17 s (av en generering som enligt loggen tog 39,3 s) och
     laddade om sidan. En banner dök upp: *"Du har ett påbörjat brev här … Vi tog fram det åt dig.
     Fortsätt på det / Börja om."* Klick på "Fortsätt på det" gav ett HELT TOMT brev — samma
     startläge som innan man någonsin klickat på AI-knappen. `d-74-efter-ai-generering.png`,
     `d-76-efter-vantan.png`. Verifierat mot `ai_usage_logs`: anropet lyckades server-side
     (`success=true`, 2743 tokens, 39 318 ms) — AI-kostnaden togs, men användaren fick ingenting.
  2. **Även ett färdigt, synligt brev sparas inte förrän steg 3 uttryckligen avslutas.** Efter en
     lyckad generering (48 s, `d-80-brev-klart-eller-timeout.png`) fanns brevet fullt synligt i
     förhandsvisningen på steg 2 — men `SELECT … FROM cover_letters` gav noll rader. Först efter att
     jag klickat "Nästa" till steg 3 ("Läs igenom och spara") och sedan "Spara brevet" skapades en
     rad i databasen. En användare som läser sitt färdiga brev och stänger fliken — rimligt
     beteende, brevet SER klart ut — förlorar allt utan varning.
- **Fil:** `client/src/components/cover-letter/CoverLetterWrite.tsx` (genereringsflödet och
  återupptagningsbannern), `pages/CoverLetterBuilder`-stegen (spara sker först i steg 3).
- **Obs:** Översiktens nästa-steg-kort ("Skriv ditt första personliga brev") stod kvar oförändrat
  efter båda AI-genereringarna (`d-99-oversikt-efter-allt.png`) — tekniskt korrekt eftersom inget
  brev fanns sparat, men det belyser samma sak: brevet existerar inte för systemet förrän steg 3 är
  klart.

---

## Viktigt

**EG3. CV-byggaren återupptar aldrig senast öppna steg.** · *nytt*
- **Var:** `/cv`, varje ny sidladdning.
- **Belägg:** Efter att ha fyllt i "Om dig" och lagt till en arbetslivserfarenhet (steg 2 och 4
  klara, "Allt sparat") navigerade jag om till `/cv` i ett nytt pass. Sidan visade steg 1 (Design)
  som aktivt steg, med "5 av 6 delar klara" i sidopanelen. `d-61-cv-vid-ankomst-dator.png`,
  `m-20-vid-ateranslutning.png`. Data var korrekt sparad — bara vyn glömde var man var.
- **Fil:** `client/src/pages/CVBuilder.tsx` — `currentStep`/motsvarande initieras alltid till steg 1
  vid mount, oavsett hur långt profilen kommit.
- **Åtgärd:** initiera steget till första ofullständiga del (eller sist besökta), inte alltid 1.

**EG4. En andra guidetur (7 steg) läggs ovanpå framgångstoasten direkt efter Snabb-CV.** · *nytt*
- **Var:** `/cv`, direkt efter "Skapa mitt CV" i Snabb-CV-flödet.
- **Belägg:** `m-13-cv-skapat.png` visar en overlay ("Steg 1 av 7: Välkommen till CV-byggaren!",
  progress-punkter, Tillbaka/Hoppa över/Nästa) direkt ovanpå en grön bekräftelsetoast ("Ditt CV är
  skapat! Du kan nu redigera och lägga till mer information.") som ligger delvis skymd bakom den.
  Två separata UI-lager tävlar om uppmärksamheten i exakt det ögonblick en användare med låg digital
  vana borde få en enkel bekräftelse.
- **Fil:** troligen `components/cv/CVOnboarding.tsx` (importerad i `CVBuilder.tsx`,
  `shouldShowOnboarding`) i kombination med en toast som triggas av samma händelse
  (Snabb-CV-completion).
- **Åtgärd:** vänta med guideturen tills toasten stängts, eller slå ihop de två till en händelse.

**EG5. Intervjuträningens pass finns bara i sidans lokala minne — en omladdning rensar allt.** · *nytt*
- **Var:** `/interview-simulator`, ett pågående pass (fråga visad, ev. svar skrivet).
- **Belägg:** Jag startade en intervju ("Vilken roll ska du intervjua för? = Truckförare /
  lagerarbetare"), fick fråga 1, och laddade om sidan (`h.go` = full navigering, motsvarar F5 eller
  att mobilens webbläsare startar om fliken efter appväxling). Resultatet: tillbaka till
  startskärmen "Starta din intervjuträning" som om inget någonsin hänt — ingen fråga, inget skrivet
  svar, ingen återupptagningsbanner. `m-93` motsvarande `d-93-vid-ateranslutning.png`. Jämför med
  CV-byggaren (full persistens) och personligt brev (försöker återuppta, om än trasigt — EG2). I en
  sammanhängande session fungerar däremot intervjuträningen bra: fråga → svar → AI-betyg 4,0/5 på
  ~10 s (`d-98-efter-svar-feedback.png`).
- **Fil:** troligen `pages/InterviewSimulator.tsx` / tillhörande store — sessionen verkar leva bara i
  React-state, ingen `localStorage`/DB-koppling motsvarande CV:ts autosave.
- **Åtgärd:** spara åtminstone pågående fråga + utkast till svar lokalt (samma mönster som
  personligt brev försöker, men gjort rätt).

---

## Skav

- **EG6:** Knappen "Exempeldata" bredvid Importera CV/Spara CV/Exportera PDF kan first-glance
  förväxlas med en statusetikett ("ditt CV innehåller exempeldata") snarare än en handling ("fyll i
  med exempeldata"). Jag läste den fel själv innan jag hovrade över den. Liten sak, men den sitter
  precis där en riktig varning om ofullständigt/genererat innehåll rimligen skulle stå.
  `d-63-exempeldata-hover.png` · `client/src/pages/CVBuilder.tsx` (knappraden ovanför "Välj en
  mall") · *nytt*

---

## Förslag på utveckling

**EG7: Snabb-CV:s automatiska profiltext och kompetenser saknar en gren för lager-/förar-/
industriyrken.** · **Värde:** Snabb-CV är den snabbaste vägen in i portalen (13–16 s, tre korta
skärmar) och därmed den väg en digitalt ovan användare som Bengt statistiskt sett väljer. Den
genererar automatiskt en profiltext och tre kompetenser baserat på yrkestitel —
`generateProfileSummary`/`generateQuickSkills` i `client/src/components/cv/QuickCVMode.tsx:40-69`
har särskilda, bättre formuleringar för "säljare", "administratör"/"assistent", "lärare"/"pedagog"
och "utvecklare"/"programmerare" (extra tekniska kompetenser för de sistnämnda). Ingen gren finns
för "truckförare", "lager", "chaufför", "lagerarbetare", "logistik" eller liknande — dessa faller
igenom till default-texten *"Motiverad [yrke] som söker nya utmaningar. Bidrar med engagemang,
pålitlighet och vilja att utvecklas i min roll"* och tre generiska mjuka kompetenser
(Kommunikation, Samarbete, Problemlösning) utan en enda yrkesspecifik post (t.ex. truckkort,
lagerhanteringssystem, säkerhetsrutiner). Bekräftat i den exporterade PDF:en
(`egen/bengt-cv-mobil-2.pdf`) — Bengts CV gick ut med exakt denna generiska text, som han aldrig
skrev och aldrig ombads granska särskilt. Jobin riktar sig uttryckligen mot en bred grupp
arbetssökande inklusive lager/logistik/industri (se `jobba-inom-lager-och-logistik`-guiden) — det är
inte en marginell yrkesgrupp. **Storlek:** en eftermiddag — lägg till fler `title.includes(...)`-
grenar (lager, truck, chaufför, städ, vård, bygg, restaurang) med rimliga default-kompetenser per
bransch, samma mönster som redan finns för säljare/administratör/lärare/utvecklare.

**EG8: Nudge att granska/personalisera profiltext och kompetenser innan export.** · **Värde:**
Oavsett EG7 kommer Snabb-CV alltid att producera generisk text för yrken utanför de fyra kända
grenarna, eller för ovanliga yrkestitlar. Just nu finns ingen signal till användaren om att steg 3
("Profil") och steg 5 ("Kompetenser") innehåller autogenererat innehåll som bör läsas igenom — CV-
byggarens stegcirklar visar dem som "klara" (grön bock) på samma sätt som fält användaren själv
fyllt i. En diskret markering ("Förifyllt — värt att läsa igenom") på just de två autogenererade
stegen skulle sänka risken att ett generiskt CV skickas till en arbetsgivare utan att användaren
vet om det. **Storlek:** några timmar — en boolean-flagga i CV-data (`profileIsGenerated`,
`skillsAreGenerated`) satt av `QuickCVMode` och lästa av stegindikatorn.

---

## Fungerar bra nu (för balans)

Gäst→registrering landar rätt (`/register?returnTo=/cv`, TR2 håller). Samtyckessteget fungerar
identiskt för ett admin-skapat konto som för ett vanligt (DP1-grinden gäller lika). Snabb-CV är
snabbt och för över data korrekt till den fulla byggaren (namn, yrke, e-post, telefon). PDF-export
fungerar på mobil, texten är sökbar och rätt kodad (å/ä/ö). Jobbsök i Jönköpings län gav rätt
NUTS-kod (`SE211`) i den sparade bevakningen, och bevakningen namngavs begripligt ("truckförare
lager · Jönköpings län") — AT2 fungerar. Personligt brev-texten (när den väl sparas) är konkret,
grundad i det verkliga CV:t och rätt jobb, och bär AI-Act-varningen ("Detta brev är genererat med
AI-stöd. Granska och redigera innan du använder det"). Intervjuträningen gav en relevant
uppföljningsfråga och ett rimligt betyg (4,0/5) i en sammanhängande session. Kontoraderingen (art.
17) är komplett och kaskaderar korrekt genom cv/cover_letters/saved_jobs/job_alerts — inga
föräldralösa rader kvar. Inga nätverksfel (≥400) förekom under hela passet.

## Inte prövat

Skärmläsare (även om EG1 gör felet uppenbart utan en). Surfplatta. Mörkt läge. Spontanansökan.
Intresseguiden. AI-team-chatt. Vad som händer om man återkommer efter flera dagar (kontot fanns
bara i cirka två timmar innan det raderades).
