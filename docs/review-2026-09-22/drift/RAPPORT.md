# Driftgenomgång 2026-09-22 — hur jobin.se beter sig i skarp drift

Skript: `e2e/drift-genomgang-2026-09-22.cjs` (körs från repots rot, `DRIFT_BARA=` väljer pass).
Mot `https://www.jobin.se`, konton ur `.env.test.local`: `TEST_USER_*` (km-deltagare, "Dana"),
`TEST_CONSULTANT_*` (km-konsulent), `DEMO_EMPLOYER_*` (företagsdemo). Inga skrivande klick —
bara navigering, sidoflikar/`role=tab`, språk- och temaval. Onboardingguider stängdes inte.

**Vilka filer som gäller** (flera pass kördes om efter att två mätfel upptäckts, se sist):

| Pass | Fil |
|---|---|
| Publika sidor, desktop + mobil | `resultat-publik.json` |
| Deltagare desktop sv (+ flikar), företag | `resultat-deltagare-konsulent-foretag.json` |
| Deltagare mobil 375, konsulent desktop/mobil/mörkt | `resultat-mobil-konsulent.json` |
| Deltagare engelska | `resultat-engelska.json` |
| Mörkt läge, deltagare | `resultat-mobil-engelska-mork.json` (bara `mork*`-raderna; mobil- och engelskraderna där är från de felaktiga första körningarna) |
| Totaler | `sammanstallning.json` |

## Domen

Portalen är **tekniskt ren i drift**: 373 sidbesök, 113 unika rutter, 40 flikbyten — **noll
ohanterade JS-fel, noll konsolfel och noll misslyckade API-anrop** i inloggat läge, noll råa
i18n-nycklar, inga `undefined`/`NaN`/`Invalid Date`. Felen ligger på tre andra ställen:
mobillayouten, det engelska läget, och inbjudningslänken.

## Fynd, rangordnade efter hur många som träffas

### 1. KRITISKT — Mobil: varje undersida är 406 px bred på en 375 px-telefon (alla inloggade, alla undersidor)

- **Var:** 65 av 76 deltagarrutter och 8 av 8 konsulentrutter på 375×812. De enda som klarar
  sig är hubbrötterna (`/oversikt`, `/jobb`, `/karriar`, `/resurser`, `/min-vardag`).
  `/consultant/settings` är 478 px.
- **Vad som syns:** Chrome zoomar ut layoutviewporten till 406 px, så hela sidan ritas i ~92 %
  (text och tryckytor krymper), eller får sidledsscroll. Sidhuvudet: menyknappen hamnar vid
  x 358–406. Skärmdumpar: `skarmdumpar/mobil-overflow-*.jpg`, `skarmdumpar/mobil-sidhuvud-konsulent.jpg`,
  `skarmdumpar/konsulent-mobil-overflow-consultant-settings.jpg` (sidan står sidledsscrollad).
- **Bevis:** `overflow.element` pekar i samtliga fall ut `div.flex.items-center.gap-0.5 in header`
  (vänster 108, höger 406). Uppmätt: sex ikonknappar à **48 px**, inte 32.
- **Källa:** `client/src/components/Layout.tsx:626-628` (`MobileTopBar`) lägger `pl-[60px]` när
  tillbakaknappen visas, och ikonknapparna på rad 656–690 har `w-8 h-8` — men den globala regeln
  `client/src/styles/mobile.css:12-20` (`button, a { min-width: 48px }`, utan scope) gör varje
  knapp 48 px. 60 + 28 (logga) + 6×48 + mellanrum ≈ 406. Kommentaren på `Layout.tsx:639-643`
  räknade med "fem ikoner" — det är sex sedan sök och språkval (PG4) lades till.
  `MobileBackButton` visas på alla sidor utom `HUB_ROOT_PATHS` (`components/MobileBackButton.tsx:25`),
  vilket förklarar varför just hubbrötterna klarar sig.
- `/consultant/settings`: tidszons-`<select>` sticker ut ur kortet (`pages/consultant/SettingsTab.tsx:423`).

### 2. KRITISKT — Engelska går inte att behålla: valet återställs till svenska vid varje sidladdning (alla inloggade som väljer engelska)

- **Var:** alla inloggade rutter. Reproducerat: logga in → välj English i språkväljaren (sidan
  blir engelsk, `lang=en`) → klientnavigering behåller det → **omladdning: `language` = `sv`,
  sidan svensk igen**. Skärmdumpar `skarmdumpar/sprak-1-efter-val.jpg`, `sprak-2-efter-omladdning.jpg`.
  Samma sak vid inloggning: satt `language=en` före inloggning → 2 s efter inloggning är den `sv`.
- **Källa:** `client/src/stores/settingsStore.ts:250-253` — `syncWithServer` gör
  `i18n.changeLanguage(data.language)` ur `user_preferences.language` vid varje appstart
  (anropas från `hooks/useAuthInit.ts:30`, monterat i `App.tsx` sedan 2026-09-10). Men
  **ingen språkväljare sparar till servern**: `setLanguage` (`settingsStore.ts:158-162`, den enda
  som gör `_saveToServer({ language })`) har **noll anropare**. `TopBar.tsx:301/323`,
  `LanguageSwitcher.tsx:56` och `settings/SprakVal.tsx:29` anropar `i18n.changeLanguage` direkt,
  som bara skriver localStorage (`i18n/config.ts:57-58`). Serverns värde (default `sv`) vinner alltid.
- **Varför det är allvarligt:** CLAUDE.md: engelskans läsare är oftast nyanländ och på mobil.
  Hon får svenska tillbaka vid varje omstart av webbläsaren/fliken.

### 3. KRITISKT — Inbjudningslänken fungerar inte för någon (alla inbjudna deltagare och företag)

- **Var:** `/#/invite/<token>` (även utan inloggning).
- **Bevis:** `POST /rest/v1/rpc/get_invitation_by_token` → **404 PGRST202** *"Could not find the
  function public.get_invitation_by_token **without parameters**"* — anropet skickas utan
  `p_token`. Sidan visar "ogiltig eller utgången inbjudan" oavsett token.
- **Källa:** `client/src/App.tsx:312` definierar rutten som `/invite/:code`, men
  `client/src/components/auth/InviteHandler.tsx:49` läser `const { token } = useParams()` →
  `undefined` → `{ p_token: undefined }` serialiseras till `{}` (rad 81). Mismatchen infördes i
  `e109b7fe` (2026-05-22). `send-invite-email/index.ts:356` bygger länken som `/#/invite/${token}`,
  så varje utskickad inbjudan landar här. Stämmer med commit `9ed4a6d0`:s iakttagelse att
  inbjudna registreringar "alltid tagit reservvägen" — den här sidan kan aldrig ha fungerat
  sedan maj. Obs: jag testade med en påhittad kod, inte en riktig inbjudan; beviset är att
  parametern saknas i anropet, vilket inte beror på koden.

### 4. VIKTIGT — Personligt brev: rå `{{count}}` och fel text under "Välj hur brevet ska se ut" (alla som öppnar `/cover-letter`)

- **Bevis:** synlig text *"…får du en stomme med {{count}} luckor…"* på `/#/cover-letter`,
  desktop, mobil och engelska. Skärmdump `skarmdumpar/deltagare-cover-letter.jpg`.
- **Källa:** `client/src/components/cover-letter/CoverLetterWrite.tsx:1182` använder nyckeln
  `coverLetter.write.blankTemplateBody` (mallnotens text, avsedd för `MallNot` rad 1427 med
  `count`) i stället för en egen nyckel; fallbacken "Utseendet syns i förhandsvisningen…" visas
  aldrig eftersom nyckeln finns i `sv.json:1412`. Infört `9450e73d2` (2026-08-19). Texten påstår
  dessutom "Vi vet inget om dig ännu" till en användare vars CV är med ("Ditt CV är med").

### 5. VIKTIGT — Hårdkodad svenska i engelskt läge (alla engelska användare)

Mätt efter att engelska valts i UI:t (se mätfel B). Återkommande och egna fynd, med källa:

| Rutt | Svensk text i engelskt läge | Källa |
|---|---|---|
| alla sidor | Skip-länken "Hoppa till huvudinnehåll" | `components/SkipLinks.tsx:30` |
| alla sidor | `aria-label="Notifikationer (15 olästa)"` | `components/notifications/NotificationBell.tsx:313` |
| alla sidor (skärmläsare) | "You are now on Jobin — verktyg och stöd för dig som söker jobb" | `hooks/usePageTitle.ts:26` (`DEFAULT_TITLE`) |
| `/wellness/crisis` | "En enkel andningsövning kan lugna…", "Om du mår dåligt kan det vara värdefullt…", "Kom ihåg: Det är helt okej att inte må bra…" — **krissidan** | `pages/wellness/CrisisTab.tsx:268, 364, 392` |
| `/cv` | Mallbeskrivningar och taggar ("Tidlös", "Mörk sidopanel"…), `alt="Förhandsvisning av mallen …"` | `pages/CVBuilder.tsx:116-125, 883` |
| `/cv` | Onboardingdialogen "Välkommen till CV-byggaren!", "Hoppa över", "Nästa" | `components/cv/CVOnboarding.tsx:41` m.fl. |
| `/cv` | Tre artikeltips ("Så skriver du en sammanfattning…") | `components/workflow/ContextualKnowledgeWidget.tsx:64-65` |
| `/cover-letter` | Fyra mallbeskrivningar | `components/cover-letter/templates/index.ts:26` m.fl. |
| `/interest-guide` | Introskärmen: "Detta får du", "frågor", "Vad det här är, och inte är", "Det är ingen psykologisk testning…" | `components/interest-guide/IntroScreen.tsx:66, 194` m.fl. |
| `/profile` | "Inga önskade yrken tillagda än.", "Lägg till upp till …", "Lägg till yrke (", "Inga tillagda ännu" | `components/occupation/DesiredJobsList.tsx:181, 184, 228`; `components/profile/forms/TagInput.tsx:249` |
| `/job-search` | Etikett "Lägg till yrke", "Strukturerad matchning mot Arbetsförmedlingens taxonomi…" | `pages/JobSearch.tsx:615, 620` |
| `/exercises` | Kategoriknapparna ("Självkännedom", "Jobbsökning"…) — kortens kategori översätts, filterraden inte | `pages/Exercises.tsx:504` (`{cat}` rått; jfr rad 571 som gör `t('exercises.categories.…')`) |
| `/career/credentials` | Certifikatlistan ("HLR och första hjälpen", "B-körkort"…) | `pages/career/CredentialsTab.tsx:36` m.fl. |
| `/career/relocation` | Kötider "5–15 år" | `data/flyttdata.ts:45-` (`uppskattadKotid` är fri text) |
| `/interview-simulator` | Fyra artikeltitlar — och i engelskt läge filtreras listan på `/intervju/i` mot titeln | `pages/InterviewSimulator.tsx:980-983, 1174` |

**Relaterat (medel):** `useArticles` har `queryKey: [ARTICLES_KEY]` utan språk
(`hooks/knowledge-base/useArticles.ts:47`) och `dbArticleToEnhanced` läser språket vid
konvertering (`services/contentApi.ts:161-169`). Byter man språk mitt i sessionen ligger
artiklarna kvar på det gamla språket i upp till 5 min (staleTime).

**Brus, inte fel:** jobbannonser från AF, yrkesområden och län ur AF-taxonomin, arbetsgivarnamn,
konsulentens egna passnamn ("Jobbsökarverkstad"), myndighetsnamn med parentesförklaring.

### 6. VIKTIGT — Konsulentens "Min dag" visar ett pass för en deltagare som heter "okänd" (konsulenter med org-roll)

- **Var:** `/consultant`, sektionen Dagens pass (2): ett pass för "Dana Deltagare" och ett för
  **"okänd"**, båda med närvaroknappar. Deltagarlistan har en deltagare. Skärmdump
  `skarmdumpar/konsulent-mork-consultant.jpg`.
- **Källa:** `lib/dagensPass.ts:55-62` hämtar `activity_sessions` för dagens datum **utan filter
  på konsulentens deltagare** — RLS avgör. `pages/consultant/OverviewTab.tsx:306-310` slår upp
  namnet i konsulentens egen deltagarlista och faller tillbaka på `t('common.unknown')`.
  Konsulenten (chef i Testkommun) ser alltså passen men inte vem de gäller, och kan markera
  närvaro för någon hon inte kan identifiera. Hänger troligen ihop med "RLS-obalans chef/admin i
  aktivitetskravet" (ROADMAP ST, städpasset). Jag frågade inte databasen vem passet tillhör
  (persondata).

### 7. MEDEL — Profilsidan: välkomstguiden blockerar hela sidan i varje ny webbläsare

- `/profile` öppnar modalen "Välkommen!" över sidan; flikarna bakom kan inte klickas (fem
  klick fick timeout). Modalens överkant är dessutom avklippt under undermenyn
  (`skarmdumpar/deltagare-profile.jpg`). Samma mönster på `/cv` ("Välkommen till CV-byggaren!").
  Jag stängde dem inte (kan skriva till profilen), så jag vet inte om valet sparas per konto
  eller per enhet — lärdomen i minnet säger per webbläsarkontext.

### 8. LÅG

- **Mobil, deltagare `/oversikt`:** sökikonen ritas ovanpå ordbilden "jobin.se" (mätt: loggans
  länk 12–65 px, sökknappen börjar på 65 px; texten fortsätter under knappen).
  `Layout.tsx:644-648` + samma 48 px-regel. `skarmdumpar/mobil-sidhuvud-deltagare.jpg`.
- **Konsulent mobil:** logglänken i sidhuvudet har inget tillgängligt namn när tillbakaknappen
  visas (uppmätt `aria-label`/text tom) — `OptimizedImage alt="Jobin"` når inte fram.
- **`/consultant`:** datumet står "Tisdag 22 September" — `capitalize` versaliserar varje ord,
  också månaden (`components/consultant/MinDagSection.tsx:100`).
- **`/consultant` Senaste aktivitet:** "Profilen ändrades senast 23:17" för Dana — tiden var
  min egen testinloggning. Raden bygger på `profiles.updated_at` (`OverviewTab.tsx:546-560`,
  medvetet omdöpt i KV6-S), men visar i praktiken "loggade in" för konsulenten.
- **`/consultant` Målöversikt:** "0 avklarade / 0 försenade" i stor grön/röd siffra när inga mål
  finns — bryter regeln "ett tomt fält är inte en nolla" (konsulentvy, lägre krav).
- **Kvarstående "Laddar"** efter networkidle + 1,5 s: `/profile`, `/my-consultant`, `/career`
  (mobil), `/resources` (engelska). Inte undersökt vidare.

### Brus och förväntat

- `/print/cv` är 794 px bred på mobil — A4-sidan, avsiktligt.
- Omdirigeringar `/job-search/applications|crm|culture` → `/applications…` och
  `/wellness/energy` → `/wellness` är avsiktliga (`JobSearch.tsx:1357-1359`, `Wellness.tsx:70`).
- `/admin` och `/consultant` som deltagare → `/oversikt` (rollskydd fungerar).
- Inga tredjepartsfel, inga 401 före inloggning, inga Sentry-/analysfel observerades.

## Totaler

| | |
|---|---|
| Sidbesök | 373 (inkl. 10 inloggningar, 40 flikbyten) |
| Unika rutter | 113 (deltagare 73, konsulent 8 inkl. deltagardetalj, företag 2, publika SPA 9, statiska/guider 24 — 14 guider) |
| Ohanterade JS-fel (`pageerror`) | 0 |
| Konsolfel | 2 (båda `/invite`, desktop + mobil) |
| HTTP ≥ 400 mot Supabase/API | 2 (samma, PGRST202) |
| Nätverksfel | 0 |
| Råa i18n-nycklar i DOM/attribut | 0 |
| `undefined`/`NaN`/`Invalid Date`/`null` | 0 |
| Oersatta `{{…}}` | 1 fynd, 3 lägen (`/cover-letter`) |
| Mobil overflow 375 px | 65/76 deltagarrutter, 8/8 konsulentrutter, 0/33 publika |
| Svenska textnoder i engelskt läge | 404 på 74 rutter (varav ~69+68 skip-länk/aria-label; resten per tabell ovan + AF-data) |
| Mörkt läge | 13 skärmdumpar, inga uppenbara kontrastbrott vid okulär kontroll (`mork-*`, `konsulent-mork-*`) |

## Två mätfel i min egen första körning (rättade i skriptet)

**A. Overflow med `isMobile: true`.** Första mobilpasset rapporterade noll overflow. Med
`isMobile` växer layoutviewporten när innehållet är för brett — `innerWidth` blev 406, så
`scrollWidth > innerWidth` var aldrig sant. Skriptet jämför nu mot den nominella bredden 375.

**B. Engelska via localStorage.** Första engelskpasset satte `language=en` före inloggning och
fick svenska överallt (sv≈40–380 per sida). Det var inte ett mätfel utan fynd 2 — men för att
kunna mäta översättningen väljs engelska nu i UI:t efter inloggningen, och sidbyten görs som
hash-navigering inom samma dokument.
