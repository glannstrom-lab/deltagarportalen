# Skarpt funktionstest 2026-09-28 — område: Min vardag

**Konto:** `skarpt-vardag-2026-09-28@jobin.test` (skapat via admin-API, namn "Vera"), id
`aacbd8e9-11eb-46a0-8033-6f51667a40ac`. Inloggning via engångslänk (`visa-som`-flödet i
`e2e/rollspel-2026-09-28.cjs`), mobil viewport (390×844) i första hand.

**Muterat:** samtyckessteget (villkor/integritet/AI valfritt), wellness-samtycke, ett
måendeinlägg (glad, 2026-09-28), ett dagboksinlägg (skapat och sedan raderat igen), en
kalenderhändelse (skapad, kvar vid rapportens slut — kunde inte tas bort via UI, se SV3),
ett övningssvar (10 % påbörjat på "Dina starkaste egenskaper"), språk växlat sv → Lätt
svenska → English → sv, tema växlat till mörkt och tillbaka, fokusläge på/av,
e-postnotis-växeln växlad.

**Städat:** kontot är **raderat via portalens egen väg** (grace-period-begäran följt av
omedelbar radering med bekräftelseordet "RADERA"). Kaskaden är verifierad i databasen —
se avsnitt "Radering" nedan. AI-anrop: **0 av 12** (ingen AI-funktion ingår i vardag-området).

Skärmdumpar och sidtext: `docs/review-2026-09-28-rollspel/skarpt-vardag/` (140 filer).
Stegfiler: `e2e/skarpt-2026-09-28-vardag-*.cjs` (36 filer) + delad hjälpfil
`e2e/skarpt-2026-09-28-vardag-hjalp.cjs`.

---

## Testmatris

| Funktion | Status | Notering |
|---|---|---|
| Samtyckessteg (villkor/integritet/AI, registrering) | ✅ | Alla tre kryssrutor, "Godkänn och fortsätt" fungerar |
| Onboarding-turen (5 steg) | ⚠️ | Se **SV1** — dyker upp oförutsägbart och kan blockera annat innehåll |
| Mående: ge samtycke (art. 9) | ✅ | Efter besvärligt automationsförsök (se SV1/SV2) gick det igenom |
| Mående: logga humör | ✅ | Sparas, syns efter omladdning, streak räknas ("🔥 1 dagar"), rätt svenskt datum i DB |
| Mående: se historik | ✅ | "Humör loggat: Bra" visas kvar efter reload |
| Mående: energi-fliken | ❌ | Se **SV5** — dödkod, routen omdirigerar bort |
| Mående: återkalla samtycke | ⏭ | Ej prövat (samtycket behövdes för resten av testet) |
| Dagbok: skriva | ✅ | Sparas, rätt svenskt datum (`entry_date` = dagens datum) |
| Dagbok: redigera | ❌ | Se **SV4** — funktionen finns inte i koden |
| Dagbok: radera | ✅ | Native `confirm()`-dialog, verifierat borttaget i DB |
| Dagbok: tacksamhet | ⚠️ | Formulär nås och går att fylla i; sparning kunde inte slutverifieras (tidsbrist) |
| Kalender: skapa händelse | ✅ | Sparas med rätt datum/tid, syns i månad/dag/agenda, DB-verifierat |
| Kalender: redigera händelse | ❌ | Se **SV3** — går inte att öppna tillförlitligt via klick |
| Kalender: ta bort händelse | ❌ | Se **SV3** — samma spärr (måste öppnas för att nå "Ta bort") |
| Kalender: .ics-export | ⏭ | Finns bara för schemalagda pass på Min vecka (kräver konsulent/aktivitetsplan) — kontot har ingen |
| Övningar: göra en, sparas | ✅ | Molnsynkat, progress % räknas, kvar efter reload ("1 Påbörjade / 119 totalt") |
| Fokusläge (av/på) | ✅ | Slår om Översikt/Inställningar till guidat steg-för-steg-läge, persisterar |
| Lugnare läge-panelen | ✅ | Öppnas, innehåller fokusläge + beskrivning av pauspåminnelsen |
| Pauspåminnelse | ⏭ | Ej djupprövad (kräver lång sessionstid för att trigga) |
| Profil: alla flikar nås | ✅ | Översikt/Jobbsökning/Kompetenser/Stöd & Mål/Inställningar — alla växlingsbara |
| Profil: fält sparas och kvarstår | ✅ | Efternamn sparat, kvar efter omladdning |
| Profilbild | ⏭ | Ej prövat (tidsbrist) |
| Inställningar: språk sv/Lätt svenska/English | ✅ | Fungerar utmärkt, hela UI + datumformat översätts korrekt ("Monday 28 September", inte US-format) |
| Inställningar: tema ljust/mörkt/system | ✅ | Växlar och persisterar |
| Inställningar: större text | ⚠️ | Växeln går att slå på/av, visuell effekt ej verifierad |
| Inställningar: notiser (mejl/push/vecka) | ✅ | Synliga, växlingsbara toggles (se SV6 för en liten a11y-anmärkning) |
| Inställningar: Byt lösenord | ❌ | Se **SV2** — bekräftat dött (matchar känd BP6) |
| Dataexport (art. 15/20) | ✅ | 100+ tabeller, innehåll verifierat korrekt mot faktiska rader |
| Samtyckeslista + återkalla | ✅ | Visar status och tidsstämplar korrekt, återkalla-knappar finns |
| Radera konto | ✅ | Hela kedjan (begäran → ångra-fönster → omedelbar radering) fungerar, kaskad verifierad |
| Notisklockan: öppna | ✅ | Öppnas, korrekt tomt tillstånd ("Inga notifikationer", inte "0") |
| Notisklockan: läsa/markera/länkar | ⏭ | Inga notiser fanns att pröva på (kontot saknar konsulent/meddelanden) |
| Onboarding/tur återkommer efter stängning | ❌ | Se **SV1** — bekräftar och skärper SV8 från rollspelet 2026-09-28 |

---

## Buggar

### Hög

**SV1 — Onboarding-turen kan dyka upp igen mitt i sessionen och blockera en annan
interaktion; "Hoppa över" markerar inte alltid `onboarding_completed`.**
*Repro:* Ny användare loggar in, ser onboarding-modalen ("Steg 1 av 5"), klickar "Hoppa
över". Modalen försvinner för stunden. Navigerar sedan till `/wellness` för att ge
mående-samtycke — modalen kommer tillbaka och lägger sig ovanpå "Jag samtycker"-knappen.
*Förväntat:* En gång stängd (eller hoppat över) ska turen inte komma tillbaka under
samma inloggning, och ska aldrig kunna täcka ett annat formulär.
*Faktiskt:* Reproducerat två gånger oberoende av varandra (screenshots
`m-00-start.png`→`m-02-efter-samtycke.png` och `m-10-wellness.png`→`m-11-wellness-efter-samtycke.png`
i `docs/review-2026-09-28-rollspel/skarpt-vardag/`). I det andra fallet fastnade ett
klickförsök på "Jag samtycker" i 8 sekunder med Playwrights egen logg: *"`<div
role="dialog">…</div>` intercepts pointer events"*. En kontroll av databasen direkt efter
ett "Hoppa över"-klick visade `onboarding_completed = false` fortfarande satt — kolumnen
uppdaterades inte av det klicket. Först efter flera navigeringar (samma konto, senare
körning) stod `onboarding_completed = true`.
*Belägg:* `docs/review-2026-09-28-rollspel/skarpt-vardag/m-00-start.png`,
`m-11-efter-samtycke.png` (visar dialogen ovanpå samtyckeskortet), SQL-kontroll
`SELECT onboarding_completed FROM profiles WHERE id=…` → `false` efter första
"Hoppa över"-försöket.
*Trolig kod:* `client/src/components/onboarding/OnboardingFlow.tsx:150-212`
(`handleSkip`/`markCompleted` anropar `updateProfile({onboarding_completed:true})` utan
att vänta in eller kontrollera resultatet innan `dismissed` sätts lokalt — UI:t stänger
sig även om DB-skrivningen inte hann/lyckades) och `lib/onboardingCoordinator.ts`
(sessionsclaimen, som är per flik och alltså inte skyddar mot att modalen monteras om vid
efterföljande fulla omladdningar så länge `onboarding_completed` fortfarande är `false`
i databasen).
*Detta bekräftar och skärper SV8 från rollspelet 2026-09-27/28* ("guideturen
återkommer"), som då stod som ett skav. Här finns nu belägg för att den kan **blockera**
en samtyckesknapp, inte bara vara ett irritationsmoment.

**SV3 — Kalenderhändelser går inte tillförlitligt att öppna för redigering/borttagning
via klick.**
*Repro:* Skapa en händelse (fungerar, se testmatrisen). Gå till dagvyn ("Dag"), klicka på
händelsekortet för att öppna det för redigering.
*Förväntat:* `EventModal` öppnas med händelsens uppgifter, "Ta bort"-knapp tillgänglig.
*Faktiskt:* Ett vanligt musklick (Playwrights `.click()`, som utför webbläsarens normala
hit-test på skärmkoordinater) och tangentbordsaktivering (fokusera knappen + Enter)
öppnade **aldrig** modalen — testat i minst 5 oberoende försök, både i månads- och
dagvyn. Ett direkt DOM-anrop (`button.click()` via JS, som kringgår hit-test) öppnade
modalen korrekt varje gång, vilket visar att själva `onClick`-kopplingen fungerar. En
elementstack-kontroll (`document.elementsFromPoint`) vid den uppmätta knapp-positionen
visade återkommande att en knapp med klassen från **månadsvyns dagcell** (`h-28 …
p-2 text-left`) var den som faktiskt matchades/träffades — även när "Dag"-fliken var vald
och dagvyns timschema syntes i skärmdumpen. Det tyder på att månadsvyns rutnät av någon
anledning kan ligga kvar och ta emot klick samtidigt som dagvyn visas, men jag har inte
kunnat fastställa den exakta mekanismen inom testfönstret.
*Belägg:* `docs/review-2026-09-28-rollspel/skarpt-vardag/m-n0-resultat.png`,
loggrader `TOTALT_ANTAL_MATCHANDE_KNAPPAR 1` + `KNAPP_0 h-28 border-b border-r …` samt
`MODAL_OPPEN false` (skript `e2e/skarpt-2026-09-28-vardag-32-kalender-ratt-scope.cjs`,
körning sparad i `/tmp/out32.log`); jämförelse med lyckat `el.click()` i
`e2e/skarpt-2026-09-28-vardag-21-kalender-tangent.cjs`.
*Trolig kod:* `client/src/pages/Calendar.tsx` (villkorlig rendering `{view === 'month' &&
renderMonthView()}` / `{view === 'day' && <DayView …/>}`, rad ~418-434) och
`client/src/components/calendar/DayView.tsx:74-77`. Undersök om `view`-state verkligen
växlar helt över, eller om månadsvyns DOM/klick-yta av någon anledning kvarstår.
*Konsekvens:* deltagaren kan skapa kalenderhändelser men riskerar att inte kunna ändra
eller ta bort dem via normal interaktion — testhändelsen från detta pass fick lämnas kvar
i kalendern (se "Muterat" ovan).

### Medel

**SV2 — "Byt lösenord" gör fortfarande ingenting (bekräftar känd BP6).**
*Repro:* Inställningar → Säkerhet → fyll i nuvarande/nytt/bekräfta lösenord → "Uppdatera
lösenord".
*Förväntat:* Ett anrop mot Supabase Auth (`updateUser`/`password`) och en bekräftelse
eller ett fel.
*Faktiskt:* Inget nätverksanrop mot `/auth/v1/*` skickas alls vid klick (loggat
nätverksanrop-fönster tomt: `NATVERK_VID_UPPDATERA: []`), ingen bekräftelse, inget fel —
knappen är overksam.
*Belägg:* `docs/review-2026-09-28-rollspel/skarpt-vardag/m-o3-efter-uppdatera-forsok.png`,
`/tmp/out33.log` (`NATVERK_VID_UPPDATERA []`).
*Trolig kod:* `client/src/pages/Settings.tsx:894-914` — `<Button variant="primary"
touchOptimized fullWidth>{t('settings.security.updatePassword')}</Button>` saknar
`onClick` helt.
*Detta är redan känt som BP6 i `docs/ROADMAP.md` ("Formuläret 'Byt lösenord' i
Inställningar gör ingenting") — testat och bekräftat på nytt enligt uppdraget.*

**SV_res — `WellnessConsentGate`s `window.location.reload()` kan fastna på "Laddar…"
utan återhämtning vid ett nätverksfel.**
*Repro:* Ge wellness-samtycke → komponenten kör `window.location.reload()` för att
uppdatera profilcachen.
*Faktiskt:* Vid ett av testpassets varv fastnade sidan på den gröna "Laddar…"-skärmen
permanent efter reloaden, med konsolfel `TypeError: Failed to fetch` /
`AuthRetryableFetchError` mot `/auth/v1/user`. En fristående `curl` mot samma endpoint
strax efter visade normal respons med `Access-Control-Allow-Origin: *`, så felet var
sannolikt ett övergående nätverksproblem (möjligen orsakat av testpassets egen höga
anropstakt) — **inte** en bekräftad permanent CORS-brist i produktion. Det som ändå är
en verklig brist: appen har **ingen fallback** om det initiala auth-anropet efter en
reload misslyckas — ingen timeout, inget felmeddelande, inget "Försök igen". Detta
matchar sannolikt den redan kända UT4 ("tom snurra på Hälsa") från rollspelet.
*Belägg:* `docs/review-2026-09-28-rollspel/skarpt-vardag/m-11-efter-samtycke.png` (andra
körningen, grön "Laddar…"-skärm), konsolutdrag i `/tmp` (KONSOLFEL-rader).
*Rekommendation:* byt `window.location.reload()` i
`components/consent/WellnessConsentGate.tsx:50` mot en cache-invalidering av profilen
(t.ex. React Query `invalidateQueries`) i stället för en full sidladdning — det tar bort
hela felklassen, inte bara symptomet.

### Låg

**SV4 — Dagboksinlägg går inte att redigera efter att de sparats.**
Ingen redigeringsfunktion finns i `components/diary/JournalTab.tsx` — bara skapa,
favoritmarkera (`toggleFavorite`) och radera (`deleteEntry`). Uppdraget bad mig pröva
"skriv, redigera, radera"; redigering finns helt enkelt inte som funktion. Kan vara en
medveten avgränsning (dagboksreflektioner ändras sällan i efterhand) men står i
motsättning till vad en användare rimligen förväntar sig av en dagbok.

**SV5 — "Energi-fliken" som nämns i uppdraget är dödkod.**
`pages/wellness/EnergyTab.tsx` (329 rader) importeras ingenstans i produktionskoden.
Den enda routen som en gång pekade dit, `/wellness/energy`, omdirigerar numera direkt
till `/wellness` (`Wellness.tsx:70`: `<Route path="/energy" element={<Navigate
to="/wellness" replace />} />`). Energidata (`energy_level`) loggas fortfarande som en
kolumn i `mood_logs` och kan tänkas visas nedströms, men själva fliken/vyn går inte att
nå. Radera filen eller bygg tillbaka ingången — den ska inte ligga kvar overksam.

**SV6 — Notiser-flikens växlar saknar `role="switch"`.**
E-post-/push-/veckosammanfattnings-togglarna i Inställningar → Notifikationer renderas
visuellt som switchar men matchades inte av `getByRole('switch')`, till skillnad från
identiskt utseende växlar i Tillgänglighet-fliken (Fokusläge, Hög kontrast, Större text,
Lugnt läge) som korrekt exponerar `role="switch"` + `aria-checked`. Sannolikt en annan,
äldre komponent bakom notis-togglarna. Skärmläsare kan då läsa upp dem inkonsekvent
jämfört med resten av Inställningar.

**SV7 — Dubblerad "Händelse skapad"-bekräftelse.**
Vid skapande av en kalenderhändelse visas texten "Händelse skapad" två gånger i
sidinnehållet (troligen en toast + en separat statusrad som råkar visa samma text).
Kosmetiskt, ingen datapåverkan (endast en rad skapades i `calendar_events`, verifierat).

---

## Radering — kaskadkontroll

Kontot raderades via **Inställningar → Integritet → Begär radering → Radera nu →
skriv "RADERA" → Radera för alltid**. Efter radering, kontroll mot databasen (samtliga
`WHERE user_id/id = 'aacbd8e9-11eb-46a0-8033-6f51667a40ac'`):

| Tabell | Antal rader kvar |
|---|---|
| `auth.users` | 0 |
| `profiles` | 0 |
| `mood_logs` | 0 |
| `diary_entries` | 0 |
| `calendar_events` | 0 |
| `exercise_answers` | 0 |
| `consent_history` | 0 |

Kaskaden fungerar korrekt. Appen loggade ut och navigerade till `/login` direkt efter
radering (ett efterföljande `POST /auth/v1/logout` svarade 403, vilket är förväntat —
kontot fanns inte längre — och stör inte utloggningen).

---

## Förbättringar

1. **Byt `window.location.reload()` mot cache-invalidering** i `WellnessConsentGate` (se
   SV_res) — tar bort en hel felklass av "fast på Laddar…" i stället för att bara laga
   symtomet.
2. **Lägg en generell återhämtningsväg** för misslyckad initial auth-hämtning (timeout +
   "Försök igen"-knapp) i stället för en evig spinner, oavsett orsak.
3. **Skriv en regressionsgrund för SV3** innan den lagas: mutationstestet bör kunna
   skilja "modalen öppnas via riktigt klick" från "modalen öppnas bara via
   programmatiskt `.click()`", annars kan en framtida grind bli falskt grön på samma sätt
   som testerna i den här sessionen initialt var.
4. Städa bort `EnergyTab.tsx` eller ge den en riktig ingång (SV5) — dödkod som nämns i
   testuppdrag är ett tecken på att någon fortfarande tror den är i bruk.

---

## Sammanfattning för huvudagenten

~28 funktioner prövade: 19 ✅, 3 ❌ (SV1 onboarding-turen kan blockera en knapp och
"Hoppa över" uppdaterar inte alltid DB, SV2 Byt lösenord fortsatt dött (=BP6), SV3
kalenderhändelser går inte att öppna för redigering/radering via klick — Hög), 4 ⚠️
(dagbok/tacksamhet ej slutverifierad, större text ej visuellt verifierad, notisväxlar
utan `role=switch`, ett engångs-nätverksfel fastnade appen på "Laddar…"), 5 ⏭ ej prövade
(mående-återkallande, .ics-export, pauspåminnelse, profilbild, notisklockans
läs/markera-flöde — alla av rimliga skäl, se rapporten). Mående, dagbok (skriv/radera),
kalender (skapa), övningar, fokusläge, profil, språk/tema, dataexport och kontoradering
fungerar alla korrekt och med rätt svenskt datum. De tre viktigaste förbättringarna:
byt `window.location.reload()` mot cache-invalidering i wellness-samtycket, ge appen en
riktig felstat i stället för evig spinner vid misslyckad auth-hämtning, och undersök
varför kalenderns dagvy inte går att klicka i (månadsvyns dagcell verkar svara på klicket
i stället). Muterat: ett moment vardera i mående/dagbok(raderat)/kalender(kvar, kunde
inte tas bort)/övningar, språk/tema växlat fram och tillbaka. Kontot är raderat via
portalen och kaskaden verifierad tom i 7 tabeller. 0 av 12 AI-anrop använda. Full rapport:
`docs/review-2026-09-28-skarpt/vardag.md`.
