# Rollspel deltagare: Anna och Sara, prod 2026-09-27 (söndag eftermiddag)

**Helhetsintrycket.** *Anna:* "Min vecka förstår jag nu. Jag ser vad som krävs, jag kan säga att jag inte kan komma och jag kan ladda ner ett intyg. Men när jag skriver till min konsulent försvinner texten, och ingenting säger att den aldrig kom fram." *Sara:* "Jag hittade Lätt svenska och English direkt i mobilen. Men efter en sida är det vanlig svenska igen. Och sidan säger att kommunen ställer kraven på mig och att jag ska visa intyget för försörjningsstödet, fast jag går hos Rusta och matcha via Arbetsförmedlingen." Portalen har blivit mycket lugnare och tydligare sedan 12 september, men två tysta skrivfel gör att den i dag lovar något den inte håller.

**Det viktigaste:**
1. **Meddelanden till konsulenten kommer inte fram, och ingen får veta det** (RD1). RLS svarar 403. På Min konsulent töms fältet ändå utan felrad.
2. **Profilen går inte att spara** (RD2). `profiles` UPDATE ger 500 "infinite recursion" och ingen felrad visas. Samma fel slår till i bakgrunden vid varje hubbesök.
3. **Sara får fel myndighet och fel regelverk** (RD3). Min vecka och närvarointyget säger kommun, socialtjänstlagen och försörjningsstöd till en Rusta och matcha-deltagare, på alla tre språken.

**Metod.** Anna och Sara loggades in i prod med engångslänk. Körningarna gjordes på mobil 390×844 (ljust och mörkt) och på dator 1366. Skripten ligger i `e2e/rollspel-2026-09-27-deltagare*.cjs` (körare + s1–s13). Axe kördes på 6 sidor i mörkt läge. Skärmdumparna ligger i `deltagare/`, sidtexterna i `deltagare/txt/` och nätverksbeläggen i `deltagare/natverk.txt`.
**Muterat (nollställs i natt):** Anna har checkat in på dagens pass, anmält frånvaro på måndagens pass (vård av barn, ångrat, sedan sjuk), gett AI-samtycke, slagit på och av Större text och fyllt i telefon (sparades inte). Sara har bytt språk till Lätt svenska och sedan English.

---

## Kritiskt

**RD1: Meddelanden till konsulenten avvisas av databasen, och på Min konsulent försvinner texten tyst.** · *nytt*
- **Var:** Min konsulent, "Skriv ett meddelande" + Enter. Min vecka, "Fråga om passet" → Skicka.
- **Belägg:** `anna-m-15-meddelande-skrivet.png` → `anna-m-16-meddelande-skickat.png` (fältet är tomt, "Inga meddelanden ännu"). `anna-m-12-fraga-skickad-ok.png` visar "Frågan gick inte att skicka". `natverk.txt`: `POST consultant_messages → 403 42501`. Som Anna ger `get_my_consultant` Demo Konsulent, men `consultant_participants` för Anna ger `[]`. Portalen visar alltså en konsulent som INSERT-policyn inte känner igen.
- **Fil:** `pages/MyConsultant.tsx` (`handleSend` har `try/finally` utan `catch`, och `setNewMessage('')` körs även när sändningen felar). Policyn "Users can send messages to an active counterpart" (`supabase/migrations/20260924_rls_initplan.sql:358`). `services/konsulentMeddelandeApi.ts`.
- **Obs:** det måste prövas om kopplingsraden saknas bara i demoseedet eller i fler konton. Den tysta tömningen är ett fel oavsett orsak.

**RD2: "Spara ändringar" i profilen misslyckas med 500 och visar ingenting.** · *nytt*
- **Var:** Inställningar → Profil → Telefon → Spara ändringar (Anna). Samma PATCH felar i bakgrunden på Översikt och Din vardag (Sara, `useOnboardedHubsTracking`).
- **Belägg:** `anna-d-52-spara-profil.png` (ingen felrad). `natverk.txt`: `PATCH profiles → 500 42P17 infinite recursion detected in policy for relation "profiles"`. GET på samma rad svarar 200.
- **Fil:** `pages/Settings.tsx`, `hooks/useOnboardedHubsTracking.ts`. Trolig källa är UPDATE-policyn "Users can update own profile safely" med `check_role_change_allowed(...)` (`20260924_rls_initplan.sql:930`). Kontrollera om den läser `profiles` utan SECURITY DEFINER. Policyn är generell, så felet gäller sannolikt alla konton.

**RD3: Sara (Rusta och matcha) får kommunens regelverk: "kommunens krav enligt socialtjänstlagen" och "visa för din handläggare på försörjningsstöd".** · *nytt*
- **Var:** Min vecka, kravrutan och Närvarointyg, på svenska, Lätt svenska och English.
- **Belägg:** `sara-m-latt-min-vecka.png` ("Det är kommunens krav"), `sara-m-en-min-vecka.png` ("kommun's requirement under socialtjänstlagen … handläggare for försörjningsstöd"). Länken går till `/guider/aktivitetskrav-forsorjningsstod/`.
- **Fil:** `pages/MinVecka.tsx:199,217`, `components/minvecka/NarvaroIntyg.tsx`. Texten tar ingen hänsyn till `profiles.program` eller organisationen. För en R&M-deltagare är det Arbetsförmedlingen som ställer kraven, och fel myndighet i en kravtext är både oroande och osant.

## Viktigt

**RD4: Sjukanmälan på morgonpasset säger ingenting om konsulentmötet samma dag kl 12, och mötet syns inte i Min vecka.** · *nytt*
- **Var:** Min vecka, nästa vecka (bara Jobbsökarverkstad 09–12), jämfört med Min konsulent (möte mån 28/9 kl 12:00).
- **Belägg:** `anna-m-05-nasta-vecka.png`, `anna-m-13-sjuk-anmald.png`, `anna-m-14-min-konsulent.png`.
- **Fil:** `pages/MinVecka.tsx` (läser bara `activity_sessions`, inte `consultant_meetings`).

**RD5: Lätt svenska gäller i praktiken bara Min vecka.** Översikt, Min konsulent, CV, Profil och Hjälp är vanlig svenska, med ord som "ATS (Applicant Tracking System)", "Schweiziskt inspirerad design" och "profilering enligt GDPR Art 21". · *kvarstår delvis* (valet finns nu på mobil)
- **Belägg:** `sara-m-latt-oversikt.png`, `sara-m-latt-cv.png`, `sara-m-latt-hjalp.png`, `sara-m-latt-konsulent.png`.
- **Fil:** `i18n/locales/sv-latt.json`. Täckningen behöver mätas mot `sv.json`.

**RD6: English bryter igenom till svenska i CV, Profil, Jobbsök och Min vecka.** Exempel: "Allt sparat · Steg 1 av 6 · ~2 min kvar · 83% klart · Exportera PDF", "Next: Telefon · Importera CV · Ladda ner PDF · 0 av 5", "Slumpjobbet", "intervjuer", månadsväljaren "september/augusti 2026". Datum visas i amerikanskt format (9/27/2026). · *nytt*
- **Belägg:** `sara-m-en-cv.png`, `sara-m-en-profil.png`, `sara-m-en-jobbsok.png`, `sara-m-en-min-vecka.png`.
- **Fil:** `pages/CVBuilder.tsx`, `components/profile/ProfileHeader.tsx`, `pages/JobSearch*`, `components/minvecka/NarvaroIntyg.tsx` (locale), datumformattering med `en-US`.

**RD7: När organisationen har stängt av AI ber AI-teamet Anna att "Godkänna AI-behandling i Inställningar". Hon gör det, och får samma besked igen.** Inställningar säger samtidigt "Avstängt av din organisation". Rådgivarnas länk "Fråga djupare i AI-team" leder till samma återvändsgränd. · *nytt*
- **Belägg:** `anna-d-44-ai-team-svar.png`, `anna-d-46-ai-samtycke.png`, `anna-d-47-ai-team-efter-samtycke.png`.
- **Fil:** `services/aiApi.ts` (felmeddelandet), `pages/AITeam*` / `components/ai-team/AgentChat.tsx`. AI-teamet borde visa organisationens beslut innan hon skriver.

**RD8: Personligt brev visar Annas tre sparade jobb som "Titel saknas i annonsen / Företag saknas i annonsen"**, fast de heter "Lagerarbetare kvällsskift · Demostads Grossist AB" m.fl. på Ansökningar. · *nytt*
- **Belägg:** `anna-m-20-brev.png`, `anna-d-48-brev-steg.png` mot `anna-m-20-ansokningar.png`.
- **Fil:** `components/cover-letter/CoverLetterWrite.tsx:~1225` läser bara `job.job_data.*`. Manuellt tillagda ansökningar och demodata saknar `job_data`.

**RD9: Mörkt läge: text som knappt syns.** På Dagboken har tomläget "Din dagbok är tom" kontrasten 1,47:1. På Min konsulent har ett h3 1,15:1, en brödrad 1,98:1 och "Din arbetskonsulent" vitt på lila 2,1:1. CV har 1,72:1 och 2,28:1. · *kvarstår delvis* (CV hade fel även 12/9; Dagbok och Konsulent är nya)
- **Belägg:** `crop-anna-m-dark-30-dagbok.png`, `crop-anna-m-dark-30-konsulent.png`, `anna-m-dark-30-cv.png`.
- **Fil:** `components/ui/EmptyState*`, `pages/MyConsultant.tsx` (konsulentkortets bakgrund `#bfa9e0`).

**RD10: Notispanelen på mobil är beskuren i vänsterkanten ("otifikationer", "Alla"), och flikarna flyter ihop ("MeddelandenJobb", "DiskussionerVänner").** Flikarna Diskussioner och Vänner motsvarar ingen funktion Anna har. · *nytt*
- **Belägg:** `anna-m-21-notiser.png`.
- **Fil:** `components/notifications/NotificationBell.tsx`.

**RD11: Ingen väg att förklara en markerad "Frånvaro" i efterhand, och den hamnar oförklarad på intyget till handläggaren.** 17/9 står bara som "Frånvaro" i Min vecka och i PDF:en. Anna kan inte skicka med sitt skäl. Intyget visar dessutom inte eget jobbsökande eller incheckningarna, alltså det Anna själv har gjort. · *kvarstår delvis* (frånvaroanmälan framåt finns nu)
- **Belägg:** `anna-m-11-vecka-38.png`, `anna-narvarointyg-s1.png`, `anna-narvarointyg.pdf`.
- **Fil:** `components/minvecka/NarvaroIntyg.tsx`, `components/minvecka/FranvaroAnmalan.tsx` (`kanAnmalaFranvaro` gäller bara kommande pass).

**RD12: Min vecka: "Du har 8 av 11 timmar" samtidigt som veckan visar 20 timmar pass.** Skillnaden beror på att eget jobbsökande inte räknas, vilket bara står i en bisats längre ner. Skälet lyder "Heltidsaktivitet enligt aktivitetskravet.." (dubbelpunkt, och "heltid" om 11 timmar). Dagens pass är 9 timmar eget jobbsökande på en söndag. Det kan varken sjukanmälas ("Jag kan inte komma" saknas för `jobsearch_own`) eller frågas om. · *kvarstår delvis* (texten är mycket bättre än 12/9)
- **Belägg:** `anna-m-02-min-vecka.png`.
- **Fil:** `pages/MinVecka.tsx`, `services/franvaroApi.ts:45`.

## Skav

- **RD13:** Efter en frånvaroanmälan visas passtiden med sekunder, "09:00:00–12:00:00". API-svaret ersätter cacheraden oformaterat. `anna-m-08-franvaro-klar.png` · `pages/MinVecka.tsx` onSaved · *nytt*
- **RD14:** "Fråga om passet" är ifylld med en inledning. Den som suddar den och skriver en kort fråga får "Skriv din fråga efter inledningen", eftersom valideringen jämför längd. `anna-m-10-fraga-skickad.png` · `components/minvecka/FragaOmPasset.tsx:43` · *nytt*
- **RD15:** Målet "Tre ansökningar per vecka" trunkeras till "Tre ansökninga…" på mobil. Det är Annas enda mål och hon kan inte läsa det. "0 av 1 mål avklarade" står i rubrikposition. `crop2-anna-m-dark-30-konsulent.png` · `pages/MyConsultant.tsx` · *nytt*
- **RD16:** Prestationstal i hjälteposition finns kvar: CV "83% klart · ~2 min kvar", Profil "Nästa: Telefon · 0 av 5" och en välkomstguide varje besök, Min konsulent "0 av 1 mål". Din vardag säger att profilen är "Ifylld" medan profilen säger "Nästa: Telefon". `anna-m-20-cv.png`, `anna-m-20-profil.png`, `anna-m-20-vardag-hub.png` · *kvarstår* (fynd 10)
- **RD17:** Inställningarnas sektioner nås på mobil bara via en ☰-ikon i "Profil"-kortet. Tillgänglighet (språk, större text) är alltså svår att hitta. `anna-m-20-installningar.png` · `pages/Settings.tsx` · *nytt*
- **RD18:** Myndighets- och teknikspråk i Inställningar: "gpt-oss-120b via OpenRouter, USA", "GDPR Art 21", "tvåfaktorsauth", "ICF-data (kognitiv, motorisk, sensorisk)", profilsynlighet "Endast jag / Arbetsförmedlare / Alla" (Anna är kommundeltagare, och "Alla" skrämmer). Grafikvalet "Action: … dramatiskt ljus. Matchdag." `anna-d-43-Integritet.png`, `anna-d-43-Utseende.png` · `pages/Settings.tsx`, `sv.json` · *kvarstår delvis* (fynd 6: projektvalet är löst)
- **RD19:** AI-teamet säger "AI-teamet får med sig hur du mår och vad du beskrivit som svårt". För en orolig person låter det som övervakning, och det står utan val. `anna-d-44-ai-team-svar.png` · *nytt*
- **RD20:** Den flytande bokmärkesknappen täcker kontroller: pilen på Lugnare läge och bocken på brevmallen "Professionell". `anna-m-04-incheckad.png`, `anna-m-20-brev.png` · *kvarstår* (fynd 12)
- **RD21:** Hälsa ber fortfarande om samtycke till alla fem kategorierna i ett svep. Dagboken är nu öppen utan samtycke, vilket är bra, men undertiteln lyder "Din personliga dagbok och kalender". `anna-m-20-halsa.png`, `anna-m-20-dagbok.png` · *kvarstår delvis* (fynd 7: flikfelet "Sekretess" är rättat)
- **RD22:** Större text höjer bara roten från 16 till 18 px. Flikraderna har fast `text-[13px]` och växer inte med. `anna-m-51-storre-cv.png` · *nytt*
- **RD23:** "Tryck Enter för att skicka" på mobil (Min konsulent), där Enter-tangenten ofta betyder ny rad. `anna-m-16-meddelande-skickat.png` · *nytt*
- **RD24:** Svensk grammatik i Lätt svenska: "De 1 timmarna" och "1 timmar". `sara-m-latt-min-vecka.png` · pluralisering i `sv-latt.json` · *nytt*

## Förslag på utveckling

- **RD25: "Min plan" för R&M-deltagaren.** Visa leverantör, att det är Arbetsförmedlingen som beslutat, vad aktivitetsrapporten innebär, praktikplatsen (Demobageriet) med handledare och vad som räknas. Sara ser i dag bara "Demo Coach" och ett projektnamn gömt i Inställningar (`sara-m-latt-installningar.png`). Bygg det som en programstyrd variant av kravrutan i Min vecka, vilket löser RD3 på samma gång.
- **RD26: Tyst fel ska inte finnas.** Varje skrivning (meddelande, profil, fråga) ska visa "Det gick inte att skicka. Din text är kvar." och behålla texten. Lägg ett gemensamt mönster i `components/ui` och en grind som fäller `try/finally` utan felväg i skrivhanterare.
- **RD27: Sjukanmälan som tänker på hela dagen.** Anmälan föreslår "Gäller det också mötet med Demo kl 12?" och "Hela dagen / flera dagar". Den ska också gå att göra på eget jobbsökande.
- **RD28: Konsulentmöten i Min vecka** med samma knappar som passen: Jag kan inte komma, Lägg till i kalendern, Fråga.
- **RD29: Egen kommentar på intyget.** Anna ska kunna skriva en rad om en frånvaro. Konsulenten ser den och intyget visar "deltagarens förklaring". Visa också hennes egna incheckningar och sitt eget jobbsökande som egen redovisning.
- **RD30: Lätt svenska och English som en hel väg, inte en sida.** Mät täckningen per sida (sv-latt mot sv, en mot sv) och gör den till en grind. Prioritera Översikt, Min vecka, Min konsulent, CV, Frånvaro och Krisstöd. Visa en rad "Den här sidan finns inte på lätt svenska än" hellre än att tyst byta språk.
- **RD31: Somaliska som läsbarhetsstöd.** Knappen "Översätt sidan" finns redan i toppnaven på dator (`anna-d-41-fokus.png`). Gör den nåbar på mobil i språkmenyn, med en tydlig rad om att maskinöversättning kan bli fel.
- **RD32: AI-teamets tomläge när AI är avstängt.** Visa "Din organisation har valt att inte använda AI. Här är tre saker du kan göra i stället: skriv till din konsulent, läs kunskapsbanken, använd CV-mallen" direkt när sidan öppnas, inte efter att hon skrivit.

## Fungerar bra nu (för balans)

"Jag kan inte komma" med orsaker, frivillig rad och "Det är din konsulent som avgör … anmäl hellre en gång för mycket" (`anna-m-06-franvaro-form.png`). Kravrutan förklarar att "det gör din konsulent tillsammans med dig". Närvarointyget laddas ner som en ren PDF. "Jag är här" ger "Incheckad kl 16:10". Språkmenyn finns på mobil. Läsloggen säger nu vad som öppnades ("din aktivitetsplan och närvaro"). Krisstödet är varmt och har rätt nummer. Fokusmarkeringen är synlig i hela tabbordningen på dator. Ingen sidledsscroll med Större text.

## Inte prövat

Skärmläsare. Rörelse och reduced motion. Surfplatta. Vad konsulenten faktiskt ser av Annas frånvaroanmälan (konsulentens rollspel). Uppsägning av kopplingen (läst men inte klickad). Ett riktigt AI-anrop (avstängt med flit).
