# Teknisk skuld ur deltagarens perspektiv (långtidsarbetslös, låg energi)

> **Granskningsdatum:** 2026-05-09
> **Granskare:** `langtidsarbetssokande`-personan (18 mån arbetslös, kronisk värk, ångest, varierande energi, grundläggande teknisk nivå, läser portalen från sängen i mobilen).
> **Källor:** `client/src/components/dashboard/QuickWinButton.tsx`, `SmartQuickWinButton.tsx`, `client/src/components/RouteErrorBoundary.tsx`, `client/src/i18n/locales/{sv,en}.json`, `client/api/ai.js`, `client/src/components/consent/DataSharingSettings.tsx`, `client/src/components/dashboard/GettingStartedChecklist.tsx`, `client/src/hooks/useCVAutoSave.ts`, `client/src/pages/Diary.tsx`, `client/src/pages/Wellness.tsx`, `docs/team-betyg-langtidsarbetssokande.md`.

---

## Sammanfattning

Portalen är på MÅNGA sätt redan en av de mest empatiska jobbsökarsidor jag sett — `Min vardag`-hubben, `Akut stöd`, dagboken och `Min konsulent` är direkt livräddande på dåliga dagar. Quick Win-systemet (både statiskt och kontextkänsligt) är genomtänkt, autospar för CV är solidt med både localStorage och Supabase-broadcast, och felmeddelanden är *nästan* alltid på svenska och börjar med "Kunde inte" istället för "Failed to fetch".

Men det finns mätbar skuld som drabbar **just min målgrupp** hårdast:

1. **Tre Quick Win-implementationer parallellt** (`QuickWinButton`, `SmartQuickWinButton`, energi-`QuickWinButton`, dashboard-`QuickActions`, ai-team-`QuickActions`, workflow-`QuickActionBanner`) — strängar är hårdkodade på svenska, inga via i18n, ingen kan översättas, och de blockerar varandra på små skärmar (`fixed bottom-6 right-6` × 2).
2. **Jargong i sidetiketter och AI-prompts** (`Pipeline`, `Kompetensgap`, `Personligt varumärke`, `ATS`, `streak`) — orden förstärker känslan av att jag är ett projekt som ska optimeras.
3. **Räknare som visar vad jag INTE klarat** (`{completedCount}/{items.length}`, "Du har {{remaining}}% kvar") triggar prestationsångest.
4. **Tonen i AI-promptarna är inkonsekvent** — vissa prompts säger "empatisk coach", andra "expert/karriärexpert/löneexpert" utan emotionell ledning. När jag pratar med Lön-AI:n får jag distansierade råd även om det är sista jag har energi att höra.
5. **Låg textkontrast** — `text-stone-400/500` används 1 445 gånger i komponenter och `text-stone-600 dark:text-stone-600` på beskrivningar (samma färg i dark mode = nästan osynligt).
6. **Felmeddelanden från katastrof-fall** ("Inte inloggad", `Update failed`, `Delete failed`, "Failed to fetch dynamically imported module") går igenom till användaren när Sentry-loggningen kraschar.

---

## Friktionspunkter

### F1. Tre parallella Quick Win-system, två floating-knappar

`client/src/components/dashboard/QuickWinButton.tsx` och `SmartQuickWinButton.tsx` är *båda* `fixed bottom-6 right-6 z-40`. Om båda monteras (vilket sker om både `Dashboard` och annan ägare lägger till) staplas de ovanpå varandra. Den första använder `bottom-20 sm:bottom-6` (justerar för bottenbar), den andra alltid `bottom-6` — på mobil kommer SmartQuickWin täcka bottennav.

**Min upplevelse:** "Två cirkulära knappar som båda säger 'Gör något litet'? Är det en eller två val? Vilken ska jag trycka?"

**Filer:** `client/src/components/dashboard/QuickWinButton.tsx:138-150`, `client/src/components/dashboard/SmartQuickWinButton.tsx:243-258`, `client/src/components/energy/QuickWinButton.tsx`.

### F2. Quick Win-strängar är hårdkodade på svenska

```ts
title: 'Logga ditt humör',
description: 'Hur mår du just nu? Tar bara 30 sekunder.',
// ... 6 förslag, alla utan t()
```

Helt utan `useTranslation`. När en arabisktalande deltagare aktiverar Google Translate ovanpå (vilket är vanligt), får hen en blandning av portalöversättning + Google maskinöversättning som inte är synkad. Engelska saknas helt.

**Filer:** `QuickWinButton.tsx:44-107`, `SmartQuickWinButton.tsx:80-211`.

### F3. "Pipeline", "Kompetensgap", "Personligt varumärke" – konsultjargong

UI-strängar som drabbar mig:

| Plats | Sträng | Mitt intryck |
|---|---|---|
| `sv.json:1797` | `"pipeline": "Pipeline"` | "Pipeline? Är jag en oljeledning?" |
| `sv.json:2300, 2306, 2311, 6243` | `"Kompetensgap"`, `"gap"`, `"Analysera gapet"` | "Gap" = mina brister, namngivna och blottade |
| `sv.json:6202` | `"Skapa personlig varumärkesöversikt"` | "Jag har inget varumärke. Jag är en arbetslös människa." |
| `sv.json:1950` | `"failed"` exponerat som översättning | Direktöversättning från utvecklarspråk |
| `sv.json:3478-3479` | `"errorLoading": "Fel vid laddning av profil:"` följt av rå Supabase-error | Trailing kolon är ful UX |
| `RouteErrorBoundary.tsx:182-184` | `"Något gick fel"` / `"Nätverksproblem"` | OK men ikon `AlertTriangle`/röd cirkel triggar stress |

**Förslag på språkbyte:** `Pipeline → Mina ansökningar`, `Kompetensgap → Vad du redan kan / Vad du kan lära dig`, `Personligt varumärke → Hur du presenterar dig`, `streak → vana`.

### F4. `5/5 klart`-räknare = synlig "ej klar"

`GettingStartedChecklist.tsx:157` visar `{completedCount}/{items.length}` redan i compact-läget. Det är räknare på vad jag INTE har gjort. När jag öppnar dashboarden en dålig dag och ser `1/4` vill jag stänga.

Förslag: visa hellre "Du har börjat — bra jobbat!" tills `completedCount > 0` samt celebration-yta. När 1+ är klar: "Du har avklarat: Intresseguide". Aldrig den nakna kvoten.

### F5. Floating-knappar bryter mot 44×44px på små skärmar

Dashboard-`QuickActionButton`-komponenten hittade jag med `min-h-[44px]` i `Diary.tsx`-tabbar — bra. Men flera floating-knappar har bara `px-4 py-3` (= ~40px höjd på mobil). 1 445 förekomster av `text-stone-400/500` gör också småtexter svårlästa när jag har trötta ögon.

**Verifiering:** Nattläge testas inte tillräckligt. `WellnessConsentGate`, `DataSharingSettings.tsx:155` använder `dark:text-stone-600` (samma färg ljust/mörkt), nästintill osynligt mot `dark:bg-stone-800`.

---

## Empati-skuld

### E1. Inkonsekvent ton i AI-system-prompts

`client/api/ai.js`:

```js
// Bra (uppmuntrande):
'jobbtips': system: 'Du är en empatisk jobbcoach. Ge uppmuntrande råd på svenska.'
'mentalt-stod': system: 'Du är en empatisk coach. Ge stöd på svenska.'
'reflektion-ovning': system: 'Du är en stödjande coach...'
'jobin-chat': system: 'Du är Jobins AI-karriärcoach. Var empatisk och konkret. Svara kortfattat på svenska.'

// Distansierat (samma användare, samma dag, ingen empati):
'cv-optimering': system: 'Du är en expert på CV-skrivning. Ge konstruktiv feedback på svenska.'
'generera-cv-text': system: 'Du är en CV-expert. Skriv professionella CV-texter på svenska.'
'loneforhandling': system: 'Du är en löneexpert. Ge konkreta råd på svenska.'
'karriarplan': system: 'Du är karriärexpert. Svara i JSON: ...'
'kompetensgap': system: 'Du är karriärcoach. Svara ENDAST med JSON i detta format...'
'linkedin-optimering': system: 'Du är LinkedIn-expert. Skriv på svenska.'
'intervju-simulator': system: 'Du är rekryterare som intervjuar kandidater på svenska.'
```

CV-feedback från en "expert" som skall ge "konstruktiv feedback" formulerar saker som *"Du saknar mätbara resultat under Erfarenhet"* — det är tekniskt rätt men landar som kritik. En empatisk variant hade börjat med *"Ditt CV har bra grund. Tre saker som skulle göra det starkare..."*.

**Förslag:** Lyft prefixet `Du är en empatisk coach` till en delad konstant (`EMPATHY_PREFIX`) och prependera den till alla 18 prompts. Säg explicit i varje prompt: *"Börja med en kort positiv observation. Använd 'du' och uppmuntrande språk."*

### E2. Tekniska felmeddelanden går igenom i kanten

`client/src/pages/consultant/CommunicationTab.tsx:793,826,863`, `SettingsTab.tsx:250` kastar `throw new Error('Not authenticated')` — om användaren förlorat session under en handling visas detta råa meddelande. Det är konsulent-vy men deltagare drabbas också via `Calendar.tsx:115,125,150` (`Update failed`, `Create failed`, `Delete failed` — engelska, hårdkodade strängar).

`pages/Profile.tsx:3478` visar `"Fel vid laddning av profil:"` följt av `error.message` rakt från Supabase (kan innehålla SQL-fragment eller `JWT expired`). Hårdkokt.

`useCVAutoSave.ts` mörkar fel mot servern bra (lokal kopia räddar) — men har ingen synlig "vi försöker igen om en stund"-bubbla. Om CV inte sparats på 5 minuter borde användaren se en mjuk indikator.

### E3. `RouteErrorBoundary` är teknisk

```tsx
{errorType === 'chunk' && 'Kunde inte ladda sidan'}
{errorType === 'network' && 'Nätverksproblem'}
{errorType === 'general' && 'Något gick fel'}
```

`"Sidan kunde inte laddas. Detta kan bero på en uppdatering."` förklarar för en utvecklare. För mig: *"Vi håller på att uppdatera portalen — vänta en stund, sen klickar du här så kommer du in igen. Det är inte ditt fel."*

### E4. Saknad "lugna ner-knapp" från fel-tillstånd

När jag är ångestladdad och får ett fel-popup vill jag ofta inte "Försök igen" — jag vill ut. Ge `RouteErrorBoundary` en tredje knapp: *"Ta en paus"* som länkar till `/wellness/breathing` eller `/akut-stod`.

---

## Energianpassning saknas

### EN1. Profilformulär utan energi-anpassning

`pages/Profile.tsx` (`OV1` i betygslistan, `Användbarhet 6`): inga progressindikatorer, inga "spara halvfärdigt"-knappar synliga från CV-byggarens UI. CV har autospar (`useCVAutoSave`) men profilen verkar inte ha det. Filer att kolla: `Profile.tsx`-flow.

### EN2. Spontanansökan saknar lågfriktionsläge

`SP1-3` (Spontanansökan) bedömdes 5/5/4 — för stort kliv på dåliga dagar. Inget steg-för-steg-flöde, inget *"jag är trött, gör jobbet åt mig"*-läge. AI-funktionen `ansokningscoach` finns på backend (`ai.js:268`) men UI-flödet kräver att jag kommer på företag, hittar kontakt, formulerar mig själv.

**Förslag:** lägg till en "AI förslår 3 företag åt dig"-knapp som triggar `mentalt-stod`-AI:n med kontext om mina egenskaper.

### EN3. Pause-och-fortsätt-mönstret saknas i flöden

Intervjusimulatorn (`intervju-simulator` i `ai.js:236`) tar tidigare frågor, men jag hittade ingen spara-position-och-fortsätt-senare i UI för:
- Kompetensanalys (lång input)
- Karriärplan (4-5 steg, ingen `resumeFrom`)
- LinkedIn-optimering

CV och Cover Letter har autospar — bra. Övriga AI-formulär är "fyll allt eller börja om".

### EN4. "Streak" som motiverande mekanik kan svika

`SmartQuickWinButton.tsx:121-133` visar `Rädda din ${streakDays}-dagars streak!` med priority 200 (högsta). På en dålig dag när jag inte loggar in är det första som möter mig nästa gång jag öppnar appen att jag *misslyckats med min vana*. Det är skuld, inte stöd.

**Förslag:** mjuka upp till *"Välkommen tillbaka. Du har varit borta {{n}} dagar — det är okej. Vi börjar om härifrån."*

### EN5. Quick Win filtrerar på `energyLevel` men nivå måste manuellt sättas

`useEnergyStore` har `level: 'low'|'medium'|'high'`. Användaren måste själv sätta nivån. På riktigt dåliga dagar orkar jag inte hitta var den toggles. Förslag: visa en *"Hur är energin idag? 🔋🔋🔋"*-prompt direkt i Översikt-hubben en gång per dag.

---

## Mobile-skuld

### M1. Två floating-knappar konkurrerar om hörnet

`QuickWinButton`: `fixed bottom-20 sm:bottom-6 right-4 sm:right-6`.
`SmartQuickWinButton`: `fixed bottom-6 right-6` (inte mobile-anpassad bottenbar-offset!).

På mobil kommer SmartQuickWin täcka antingen `BottomBar` eller `HubBottomNav`. Kontrollera vilken som monteras var i `App.tsx`/`Layout.tsx` — om båda monteras samtidigt har vi en kollision.

### M2. Modaler öppnar centrerat även på mobil

`QuickWinButton.tsx:159` använder `flex items-center justify-center p-4` — modalen är centrerad och ankrad till mitten även på mobil. Bättre praxis: bottom-sheet på mobil, dialog på desktop. `SmartQuickWinButton.tsx:267` använder `items-end sm:items-center` — gör rätt. Ena gör fel.

### M3. `text-stone-500`/`text-stone-400` i flygande knappar

Sökning gav 1 445 förekomster av `text-stone-400/500/gray-400/500`. På liten skärm i sängen, lutad lampa, blir tons-på-vit kontrasten under WCAG AA. Stickprov: `RouteErrorBoundary.tsx:228,234,267` har `text-stone-500 dark:text-stone-400` på "Försök 1 av 2" och support-text. AA på `bg-white` är borderline; AAA får man inte.

### M4. Hörnknappen "Gör något litet" har label dolt på mobil

`SmartQuickWinButton.tsx:256-257`:

```tsx
<span className="hidden sm:inline">Gör något litet</span>
<span className="sm:hidden">Quick win</span>
```

På mobil står det `Quick win` — en engelsk fras blandad med svensk UI. Behåll svenska: t.ex. "Snabbsteg" eller bara ikonen.

### M5. Hubbens "5 av 5"-räknare och `streak`-flammor på mobil

`GettingStartedChecklist.tsx:157` `{completedCount}/{items.length}` är pyttesmal text på mobil — ofta `text-xs`. Ironiskt: räknaren som triggar prestationsångest är samtidigt svårläst.

---

## Konkreta åtgärder, rangordnade efter användarvärde

### Tier 1 — direkt energianpassning (hög nytta, låg kostnad)

1. **Lyft Quick Win-strängar till `i18n/locales/sv.json` och `en.json`** under `quickWins.*`. Använd `useTranslation()` i `QuickWinButton.tsx` och `SmartQuickWinButton.tsx`. Gör samma sak för `getGreeting()` (`SmartQuickWinButton.tsx:233`).
2. **Konsolidera till ETT Quick Win-system.** Behåll `SmartQuickWinButton`, ta bort `QuickWinButton.tsx` och `energy/QuickWinButton.tsx` (eller gör dem till alias-export). Ett mentalt mål, en floating-knapp.
3. **Mjuka upp jargong i `sv.json`**:
   - `applications.tabs.pipeline: "Pipeline"` → `"Mina ansökningar"`
   - `skillsGapAnalysis.title` och alla `gap`-strängar → `"Vad du redan kan"` + `"Vad du kan lära dig"`
   - `task3: "Skapa personlig varumärkesöversikt"` → `"Beskriv hur du vill presentera dig"`
   - Alla `streak`-strängar → `"vana"` eller `"dag i rad"` (utan flammor på dåliga dagar)
4. **Byt räknarens språk i `GettingStartedChecklist`**: visa `1 av 4 påbörjade`-stil när `completedCount > 0`, tomt-state-text när `=== 0` ("Vi börjar små steg när du orkar"). Aldrig naken `0/4`.
5. **Lägg till EMPATHY_PREFIX i `client/api/ai.js`** — en delad konstant som prependeras alla `system`-prompts:

   ```
   Du pratar med en arbetssökande som kan ha låg energi, ångest eller fysiska
   utmaningar. Börja alltid med en positiv observation. Använd "du" och
   uppmuntrande språk. Undvik jargong som "ATS", "pipeline", "varumärke" — säg
   det enkelt istället.
   ```

   Plus per-prompt: byt `"Du är en löneexpert"` → `"Du är en stödjande löneexpert som pratar med en arbetssökande"`.

### Tier 2 — empati i felmeddelanden

6. **Översätt hårdkodade engelska felfraser i `Calendar.tsx:115,125,150`** till `t('calendar.errors.*')`-nycklar.
7. **Profile.tsx**: ersätt `"Fel vid laddning av profil:"` följt av rå `error.message` med en mjukare default + Sentry-loggning av stack i bakgrunden. Användaren ska inte se Supabase-felkoder.
8. **`RouteErrorBoundary` get a "Ta en paus"-utgång** som tredje knapp länkad till `/wellness` eller `/akut-stod`. Använd amber-färgskala (inte röd) för "general" och "network" — röd är reserverad för katastrof.
9. **`useCVAutoSave`**: visa en synlig "Vi sparar i din webbläsare medan internet är borta"-pill när `!isOnline && hasUnsavedChanges` är sant > 60s.

### Tier 3 — energianpassning på allvar

10. **Daglig energi-prompt** i Översikt-hubben en gång per dag: `<EnergyPicker />` → sätter `useEnergyStore.level`. Komponentstub finns redan i `client/src/components/energy/`.
11. **Lägg "fortsätt senare"-flagga på AI-formulär** (kompetensanalys, karriärplan, LinkedIn). Spara halvifyllt formulär i Supabase `user_drafts` (samma mönster som `cv-draft` i localStorage + servern).
12. **Spontanansökan: ge AI-förslagsläge** ("Hjälp mig hitta 3 företag baserat på min profil") som triggar Bolagsverket-edge function plus AI-rang.
13. **Streak-mekaniken**: skifta från "rädda streak"-skuld till "välkommen tillbaka"-acceptans. Prioritet 200 i `SmartQuickWinButton.tsx:130` är aggressiv; sätt till 60 och ändra ton.

### Tier 4 — kontrast och mobil

14. **Audit `text-stone-400/500` mot `bg-white`** med ett enkelt skript och flytta till `text-stone-600` (eller bättre, en token `--c-text-soft` som testats AA). 1 445 förekomster är för mycket.
15. **`SmartQuickWinButton`-knappens `bottom-6` → `bottom-20 sm:bottom-6`** så den inte täcker `HubBottomNav`.
16. **`QuickWinButton.tsx:159` modal-position** → ändra till `items-end sm:items-center` (matcha SmartQuickWin).
17. **Byt `Quick win`-fallback** på mobil-floaten till svenska (`"Snabbsteg"` eller bara `<Sparkles>`-ikonen).

### Tier 5 — privacy/tillit

18. **Visa explicit för deltagaren vad konsulenten ser** ovanför varje hälsa/wellness/dagbok-yta — `DataSharingSettings.tsx` finns men är gömd i Settings. Lägg en mikro-pill på `Wellness.tsx` och `Diary.tsx` toppen: `"🔒 Bara du ser detta"` eller `"👤 {consultantName} kan läsa detta"` — beroende av `share_*_with_consultant`. Jag måste **veta** innan jag skriver, inte upptäcka det efteråt.

---

**Filsökväg:** `C:\Users\Mikael\Desktop\COWORK\deltagarportal\docs\teknisk-skuld-2026-05\deltagare.md`
