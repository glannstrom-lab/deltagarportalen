# UX17 — språkgranskning (kod + webbläsare), 2026-08-04

**Premissen för UX17 håller — men den är ofullständig, och en av dess två positiva slutsatser är fel.**

Tre av fyra delpåståenden (a, c, d) stämmer ordagrant. Delpåstående (b) stämmer i riktning men
underskattar omfattningen kraftigt. Och radens tröstesats — *"bara **en** rå i18n-nyckel i hela
svepet över 34 sidor × 2 språk"* — **håller inte**: `/#/my-consultant` visar **13 råa nycklar plus
3 i18next-felmeddelanden** i UI, **i båda språken**, och i koden finns **83 anropsställen** som
saknar nyckel helt.

Två saker som roadmapen inte visste, och som ändrar hur punkten ska planeras:

1. **en.json är komplett på nyckelnivå.** 7 163 nycklar i sv.json, 7 163 i en.json, **0 saknade i
   någon riktning**. Problemet är alltså *inte* en halvfärdig översättningsfil — det är att
   ~4 000 strängar aldrig går genom `t()`. Det gör arbetet mätbart och avgränsat i stället för
   "översätt allt igen".
2. **De publika sidorna är redan översatta.** Tvingar man `localStorage.language='en'` renderar
   landning/login/register/privacy/terms/ai-policy på engelska (2,9–24 % oöversatt). Det som saknas
   är *vägen in* — väljaren, `navigator.language`, `<html lang>`. Delpåstående (a) är alltså
   **billigast att laga av allt i punkten** och ger störst effekt för målgruppen.

Mätmetod: Playwright-svep, `locale: 'en-US'`, dev-server på :5173, testkontot i prod. Varje sida
lästes i **både** svenskt och engelskt läge och texten diffades nod för nod — "andel otextat" =
andelen synliga textnoder som är **ordagrant identiska** mellan sv och en. Egennamn, siffror och
varumärken ("Jobin", "LinkedIn", "CV") gör att en helt översatt sida landar på 10–20 %; det är
brusgolvet. Allt över ~30 % är genuint oöversatt.

---

## (a) Publika sidor: ingen väljare, `lang="sv"`, ingen språkdetektion — **HÅLLER, ordagrant**

Sju sidor, browser-context med `locale: 'en-US'`, tomt localStorage:

| Sida | `<html lang>` | språkväljare | h1 |
|------|---------------|--------------|-----|
| `/` (landning) | `sv` | **ingen** | "Stärk dina deltagare mot jobb" |
| `/#/login` | `sv` | **ingen** | "Jobin" — "Välkommen tillbaka!" |
| `/#/register` | `sv` | **ingen** | "Din väg till nytt jobb börjar här" |
| `/#/privacy` | `sv` | **ingen** | "Integritetspolicy" |
| `/#/terms` | `sv` | **ingen** | "Användarvillkor" |
| `/#/ai-policy` | `sv` | **ingen** | "AI-transparens" |
| `/#/accessibility` | `sv` | **ingen** | "Tillgänglighetsredogörelse" |

Sökningen efter väljare (`select|button|a` med `språk|language|svenska|english|translate|i18n` i
text, aria-label eller klass) gav **noll träffar** på alla sju sidorna. Enda träffen var
`BUTTON:Visa lösenord`, en falsk positiv.

**Orsak, fil:rad:**
- `client/src/i18n/config.ts:10` — `const savedLanguage = localStorage.getItem('language') || 'sv'`.
  `navigator.language` finns inte i filen. En browser satt till `en-US` får svenska.
- `client/index.html:2` — `<html lang="sv">` hårdkodat. `config.ts:60` skriver om det, men bara till
  det som redan låg i localStorage — för en förstagångsbesökare alltid `sv`.
- `client/index.html:29` — `<title>Deltagarportalen - Stöd för arbetssökande</title>` byts **aldrig**,
  inte ens efter språkbyte. Fliktiteln är svensk även för en inloggad engelsk användare.
- `LanguageSwitcher` monteras på exakt **ett** ställe: `client/src/components/layout/TopBar.tsx:110`
  (+ `GoogleTranslate` på rad 115). TopBar renderas bara i den inloggade layouten. Cirkeln som
  raden beskriver är verifierad: väljaren finns bakom inloggningen, inloggningen finns bara på svenska.

**Det roadmapen inte visste — och som gör (a) billig:** kör man om samma svep med
`localStorage.language='en'` satt via `addInitScript` blir sidorna engelska:

| Sida | otextat (sv==en, nod för nod) |
|------|-------------------------------|
| `/#/register` | 2,9 % |
| `/#/login` | 5,3 % |
| `/` (landning) | 12,4 % |
| `/#/ai-policy` | 13,0 % |
| `/#/privacy` | 15,7 % |
| `/#/terms` | 24,0 % |
| **`/#/accessibility`** | **90,8 %** |

`/#/accessibility` är undantaget: `client/src/pages/Accessibility.tsx` har **0 `t()`-anrop på 132
rader** — hela sidan är hårdkodad svenska. Jämför `Privacy.tsx` (102 `t()`), `AiPolicy.tsx` (52),
`Terms.tsx` (41).

---

## (b) 14 sidor med engelsk ram och svenskt innehåll — **HÅLLER i riktning, underskattar i storlek**

Svepet omfattar **37 sidor** (35 nav-sidor + två underflikar). **21 av 37 ligger över 30 % otextat**,
inte 14. Totalt över hela svepet: **1 715 av 3 289 synliga textnoder är identiska mellan sv och en —
52,1 %.**

Radens två utpekade sidor bekräftas:

- **`/#/interest-guide`** — "rubriken står på båda språken" stämmer bokstavligt. Sidhuvudet säger
  *"Interest Guide / Discover occupations that suit you…"*, flikarna *"The Test | Results |
  Occupations | Explore | History"* — och direkt under står kortet *"Intresseguide / Upptäck vilka
  yrken som passar just din profil"* med hela testbeskrivningen på svenska: *"4 delar att besvara"*,
  *"Vilka typer av arbete tilltalar dig?"*, *"~10 minuter"*, *"34 frågor totalt"*. 56,7 % otextat.
- **`/#/international`** — guiden **för** nyanlända. Ram och flikar engelska
  (*"Visa & Work Permits | Integration | Language"*), allt innehåll svenskt: *"Viktigt att veta"*,
  *"Du måste ansöka om arbetstillstånd INNAN du reser till Sverige. Ansökan görs hos Migrationsverket."*,
  *"Arbetstillstånd — Standard arbetsvisum för anställning i Sverige. Kräver jobboffert från svensk
  arbetsgivare."*, *"1-4 månader"*, *"Max 2 år, kan förlängas"*, *"13 000 kr/mån"*, *"Ja, efter 4 år"*,
  hela tidslinjen *"År 0: Arbetstillstånd → År 2: Förläng tillståndet → År 4: Ansök om PUT → År 5+:
  Medborgarskap"*. **61,3 % otextat**, identiskt på `/#/international/visa`.

Fyra sidor som är värre än de två raden nämner och som raden inte tar upp:

- **`/#/exercises` — 95,7 % otextat** (616 av 644 textnoder identiska). Endast ramen är översatt:
  "Exercises", "Total exercises", "Started", "Not started". Underrubriken är svensk
  (*"Praktiska övningar för att utveckla dina jobbsökar-skills"*), alla 10 kategorier är svenska
  (*Självkännedom, Jobbsökning, Nätverkande, Digital närvaro, Arbetsrätt, Karriärutveckling,
  Välmående, Arbetslivskunskap, Arbetssökande, Rehabilitering*), alla 119 övningstitlar och
  -beskrivningar är svenska, svårighetsgraderna är svenska (*Lätt / Medel / Utmanande*).
  Källa: `client/src/data/exercises.ts` — 1 932 rader hårdkodad svenska.
- **`/#/externa-resurser` — 78,7 %.** h1 är svensk: *"Externa resurser"*, *"323 användbara länkar för
  jobbsökande"*. Källa: `client/src/pages/ExternalResources.tsx`, 523 rader.
- **`/#/knowledge-base` — 76,2 %.** Hälsningen är svensk (*"Hej Claude"*) i engelskt läge; alla 13
  kategorier och 100+ artikelrubriker är svenska. Källa: `client/src/services/articleData.ts`, 1 416 rader.
- **`/#/personal-brand` — 71,3 %**, **`/#/cv` — 70,3 %**, **`/#/cover-letter` — 65,3 %**,
  **`/#/print-resources` — 63,0 %** (h1 svensk: *"Skriv ut resurser"*).

---

## (c) Hårdkodade svenska valideringsfel — **HÅLLER, och gäller fler formulär än registreringen**

Registreringsformuläret i engelskt läge (`localStorage.language='en'`, `locale: 'en-US'`,
`<html lang="en">` verifierat). Alla etiketter engelska: *"First name", "Last name", "Email address",
"Password", "Confirm password", "I have read and accept the terms of service *", "Register"*.

Fyller man i `inte-en-epost` + lösenordet `abc` och trycker Register:

> **"Ogiltig e-postadress"**
> **"Lösenordet måste vara minst 12 tecken"**

Formulär 2 — `/#/login`, ogiltig e-postform:

> **"Ogiltig e-postadress"**

Formulär 3 — `/#/login`, korrekt e-post + fel lösenord (svaret kommer i `role="alert"`, dvs.
skärmläsaren läser upp det):

> **"Fel e-post eller lösenord"**

**Orsak, fil:rad:** `client/src/lib/validations/index.ts` — Zod-scheman med svenska
felmeddelanden som strängliterals, aldrig genom `t()`. Rad 22–38 (`strongPasswordSchema`):
`'Lösenord är obligatoriskt'`, `'Lösenordet måste vara minst 12 tecken'`, `'Lösenordet måste
innehålla minst en stor bokstav (A-Z)'`, `'Lösenordet får inte innehålla samma tecken 3+ gånger i
rad'`. Rad 45–52 (`loginSchema`): `'E-postadress är obligatorisk'`, `'Ogiltig e-postadress'`.
Filen ligger på plats 20 i `report:i18n`-listan med **55 rader** hårdkodad svenska.

Sidoiakttagelse: `HTML5`-validationMessage är tom på alla åtta fälten, så det finns ingen
webbläsarnativ (och därmed lokaliserad) fallback att luta sig mot.

---

## (d) Oöversatt UI-krom på alla sidor — **HÅLLER**

Mätt i engelskt läge, inloggad.

**Skip-links — på varje sida, första tab-stoppet:**
`"Hoppa till huvudinnehåll"`, `"Hoppa till navigation"`, `"Hoppa till sök"`.
Fil: `client/src/components/SkipLinks.tsx:16-18` (literala strängar i `DEFAULT_LINKS`), plus
`client/src/pages/Landing.tsx:214` som skickar in sin egen svenska literal, plus
`client/src/hooks/useAccessibility.tsx:225`.

**aria-labels i headern (skärmläsaren läser svenska i ett engelskt UI):**
`"Vanliga frågor"`, `"Notifikationer"`, `"Minimera"`, `"Öppna coachtips från 2 coacher"`.
Blandat med engelska i samma rad: `"Select language"`, `"Translate page"`, `"Turn on focus mode"`,
`"Dark mode"`, `"Log out"`, `"Visit your profile"`, `"Choose a hub"`, `"Open my collections"`.
`report:i18n` räknar **46 literala aria-label på 21 filer**.

**Mobilmenyn (390×844):** 42 länkar, hubbnamnen översatta, men botten svensk —
`"Minimera"`, `"Mina samlingar"`, `"Tips"`, rolletiketten `"Deltagare"` under användarnamnet.

**Tomtillstånd:** `/#/profile` i engelskt läge: *"Inga önskade yrken tillagda än."*,
*"Lägg till upp till 10 yrken i prioriteringsordning."*, *"Inga tillagda ännu"*, *"Lägg till"*,
*"0 av 5"*, *"Sparad"*, *"Profilstatus"*, *"Telefon"* — mitt bland engelska
*"Contact Information"*, *"Desired Jobs"*, *"Interests"*.

**Datum/tid — det enda som faktiskt fungerar.** `/#/calendar` i engelskt läge visar
*"August 2026"* och *"Mon Tue Wed Thu Fri Sat Sun"*; `/#/applications` visar *"7d ago"*.
Undantag: `client/src/components/diary/MoodTab.tsx:282` hårdkodar
`const days = ['Mån','Tis','Ons','Tor','Fre','Lör','Sön']`, så humörgrafen har svenska veckodagar
i engelskt läge.

**Pluralformer:** infrastrukturen finns (70 `_one`/`_other`-nycklar i **båda** filerna), men
används inte överallt. `/#/diary` visar *"1 days"* — `client/src/pages/Diary.tsx:84` anropar
`t('diary.streak.days')` (värde `"days"`/`"dagar"`) utan `count`, så singularformen finns inte.

---

# Fynd

### I1 — `/#/my-consultant` renderar 13 råa nycklar och 3 i18next-felmeddelanden, i BÅDA språken
**Allvarlighet: HÖG.** Detta motbevisar UX17:s positiva slutsats ("bara en rå nyckel i hela svepet")
och är inte ett språkfel — sidan är trasig på svenska också.

**Bevis** (skärmbild: `my-consultant-en.png`; identiskt utfall i svenskt läge):
råa nycklar synliga i UI: `myConsultant.yourConsultant`, `myConsultant.contactInfo`,
`myConsultant.noMeetingScheduled`, `myConsultant.writeTo`, `myConsultant.noMessagesYet`,
`myConsultant.sendToStart`, `myConsultant.writeMessage`, `myConsultant.pressEnterToSend`,
`myConsultant.categories.progress`, `myConsultant.categories.cv`,
`myConsultant.categories.wellbeing`, `myConsultant.sendEmail`, `myConsultant.bookMeeting`.
Dessutom tre felsträngar rakt i gränssnittet:

> `key 'myConsultant.nextMeeting (sv)' returned an object instead of string.`
> `key 'myConsultant.messages (sv)' returned an object instead of string.`
> `key 'myConsultant.quickActions (sv)' returned an object instead of string.`

**Orsak:** översättningarna finns — de ligger bara en nivå ned. `sv.json` har
`myConsultant.consultant.yourConsultant = "Din arbetskonsulent"`, `myConsultant.nextMeeting.title =
"Nästa möte"`, `myConsultant.messages.title = "Meddelanden"`, `myConsultant.quickActions.title =
"Snabbåtgärder"`. Komponenten anropar de platta namnen: `client/src/pages/MyConsultant.tsx:154`
(`t('myConsultant.yourConsultant')`), `:162` (`t('myConsultant.contactInfo')`), `:462`
(`t('myConsultant.noMessagesYet')`) — 27 anropsställen totalt i filen.
**Exakt samma familj som UX3:s `interviewSimulator.summary`-bugg** (nyckeln nästad fel, komponenten
platt). Den lagades 2026-07-27; den här slapp igenom.

**Åtgärd:** peka om de 27 anropen mot de nästade nycklarna (eller platta ut JSON-grenen). Lägg ett
test som renderar sidan och failar på `/^[a-z][a-zA-Z]*\.[a-zA-Z.]+$/` i synlig text.
**Storlek: S** (en fil, ~1 h).

### I2 — 83 `t()`-anrop utan nyckel i vare sig sv.json eller en.json → rå nyckel i UI
**Allvarlighet: HÖG.** Latent i övrigt — koden bakom de flesta renderas bara i vissa tillstånd.

**Bevis** (statisk analys av alla `t('ns.key')` i `client/src/`, 4 270 anrop):
259 nycklar saknas i båda filerna. Av dem har **154** ett andra argument (svensk fallback → visas
som svenska i engelskt läge, se I3); **83 har inget alls → nyckeln renderas rå.**

| Fil | råa anrop |
|-----|-----------|
| `pages/MyConsultant.tsx` | 27 (= I1) |
| `components/dashboard/NextStepCard.tsx` | 17 |
| `components/profile/SettingsSections.tsx` | 16 |
| `pages/CVBuilder.tsx` | 6 |
| `components/consent/WellnessConsentGate.tsx` | 5 |
| `pages/Education.tsx` | 4 |
| `pages/JobSearch.tsx` | 3 |
| `hooks/useVoiceInput.ts` | 2 |
| `pages/Exercises.tsx`, `hooks/useVoiceOutput.ts`, `components/dashboard/QuickActions.tsx` | 1 var |

Bland dem: `common.start`, `common.continue`, `common.minimize`
(`NextStepCard.tsx:264`, `aria-label={t('common.minimize')}` — det är källan till "Minimera" som
UX17(d) pekar ut).

**Åtgärd:** lägg till de 83 nycklarna i båda filerna. **Storlek: S–M** (halvdag).

### I3 — `t('nyckel') || 'svensk fallback'` — fallbacken kan aldrig utlösas
**Allvarlighet: MEDEL.** Ett mönster som ser säkert ut men inte är det.

**Bevis:** 90 förekomster i 8 filer. `i18next.t()` returnerar **nyckelsträngen** när nyckeln saknas —
den är truthy, så `||`-grenen är död kod. `client/src/components/consent/WellnessConsentGate.tsx:89`:
```
{t('wellness.consent.requiredTitle') || 'Samtycke krävs'}
```
Användaren ser `wellness.consent.requiredTitle`, aldrig "Samtycke krävs".
Värst: `HealthConsentGate.tsx` (26), `WellnessConsentGate.tsx` (25), `DataSharingSettings.tsx` (23),
`pages/interest-guide/OccupationsTab.tsx` (6), `knowledge-base/tabs/TopicsTab.tsx` (4),
`interest-guide/ResultsTab.tsx` (4). **Det här är art. 9-samtyckesgrindarna från UX11/UX18.**

**Åtgärd:** ersätt med `t('key', 'fallback')` (i18next-signaturen) eller lägg in nycklarna.
Lägg en eslint-regel som förbjuder `t(...) ||`. **Storlek: S.**

### I4 — 9 166 rader hårdkodad svenska i 359 filer — det verkliga arbetet
**Allvarlighet: HÖG (för målgruppen), men delbar.**

**Bevis** (`npm run report:i18n`, kategoriserat per katalog):

| Kategori | rader | filer |
|----------|-------|-------|
| Innehållsdata (övningar, artiklar, guider, coachtexter) | **5 355** | 20 |
| Deltagarkomponenter (`components/`) | 1 162 | 163 |
| Deltagarsidor (`pages/`, exkl. sta/consultant) | 1 109 | 47 |
| Konsulent/STA/admin — **svensk ton är OK enligt DESIGN.md §2** | 797 | 58 |
| services/lib/utils/hooks | 743 | 71 |
| **Totalt** | **9 166** | **359** |

Plus **46 literala `aria-label` på 21 filer**.

Nyckelinsikten: **58 % av all hårdkodad svenska ligger i 20 datafiler**, inte utspritt i
komponentträdet. `data/exercises.ts` (1 932), `services/articleData.ts` (1 416),
`services/interestGuideData.ts` (834), `pages/ExternalResources.tsx` (523), `data/helpContent.ts` (286),
`services/arbetsformedlingenApi.ts` (240), `data/coaches.ts` (179). Det är ett eget beslut med egen
lösningsform (parallell `en`-datafil eller `labelSv/labelEn`-fält, som redan finns som mönster och
undantas av rapportskriptet) — inte samma arbete som att sprida `t()` i JSX.

Om man drar bort innehållsdata och konsulentytan är den **rena `t()`-skulden i deltagarnära
kod 3 014 rader i 281 filer**.

### I5 — 787 nycklar i sv.json utan statisk träff i koden
**Allvarlighet: LÅG.** Städning, ingen användarpåverkan.

**Bevis:** 7 163 nycklar i sv.json; 4 270 statiska `t()`-anrop; efter avdrag för prefixträffar och
40 dynamiska `t(\`ns.${x}\`)`-prefix återstår **787** utan träff. Största namespaces: `sta.*`
(avaktiverad modul), `consultant.*`, `widgets.*` (arkiverat system). Notera att en.json bär exakt
samma 787 — filerna är nyckelsynkade.

### I6 — `<title>` och `document.title` är alltid svenska
**Allvarlighet: LÅG–MEDEL.** `client/index.html:29`, aldrig omskriven av någon route. Fliken säger
"Deltagarportalen - Stöd för arbetssökande" även för en engelsk användare på `/#/register`.
**Storlek: S.**

### I7 — sv/en-värden som är identiska i locale-filerna
**Allvarlighet: LÅG.** 177 av 7 163 delade nycklar har exakt samma sträng i sv.json och en.json,
varav 7 är entydigt svenska texter som ligger kvar oöversatta i en.json
(`spontaneous.tips.*`, `career.companies.*`, `international.visa.*`, `international.tabs.*`,
`landing.audience.*`, `focus.salary.*`, `resurserHub.features.*`). Resten är legitima
(egennamn, "OK", "CV", "LinkedIn"). **Storlek: XS.**

---

# Sida × andel otextat × råa nycklar

Otextat = andel synliga textnoder som är ordagrant identiska mellan svenskt och engelskt läge.
Brusgolv för en helt översatt sida: 10–20 %.

| Sida | textnoder | otextat | råa nycklar |
|------|-----------|---------|-------------|
| /#/exercises | 644 | **95,7 %** | 0 |
| /#/externa-resurser | 94 | **78,7 %** | 0 |
| /#/knowledge-base | 84 | **76,2 %** | 0 |
| /#/personal-brand | 87 | **71,3 %** | 0 |
| /#/cv | 145 | **70,3 %** | 0 |
| /#/diary?tab=mood | 79 | **65,8 %** | 0 |
| /#/cover-letter | 75 | **65,3 %** | 0 |
| /#/print-resources | 54 | **63,0 %** | 0 |
| **/#/international** | 75 | **61,3 %** | 0 |
| /#/international/visa | 75 | **61,3 %** | 0 |
| /#/interest-guide | 60 | **56,7 %** | 0 |
| /#/job-search | 215 | **54,4 %** | 0 |
| /#/resources | 65 | 47,7 % | 0 |
| **/#/my-consultant** | 67 | 46,3 % | **13** |
| /#/interview-simulator | 63 | 42,9 % | 0 |
| /#/settings | 71 | 42,3 % | 0 |
| /#/diary | 45 | 40,0 % | 0 |
| /#/profile | 65 | 40,0 % | 0 |
| /#/career | 64 | 39,1 % | 0 |
| /#/skills-gap-analysis | 40 | 32,5 % | 0 |
| /#/applications | 72 | 31,9 % | 0 |
| /#/linkedin-optimizer | 46 | 28,3 % | 0 |
| /#/nätverk | 48 | 25,0 % | 0 |
| /#/oversikt | 45 | 24,4 % | 0 |
| /#/calendar | 45 | 24,4 % | 0 |
| /#/job-alerts | 45 | 24,4 % | 0 |
| /#/wellness | 64 | 21,9 % | 0 |
| /#/spontanansökan | 47 | 21,3 % | 0 |
| /#/salary | 59 | 20,3 % | 0 |
| /#/ai-team | 75 | 20,0 % | 0 |
| /#/education | 51 | 19,6 % | 0 |
| /#/jobb | 58 | 19,0 % | 0 |
| /#/karriar | 48 | 18,8 % | 0 |
| /#/resurser | 56 | 17,9 % | 0 |
| /#/min-vardag | 53 | 17,0 % | 0 |
| /#/settings?section=privacy | 96 | 12,5 % | 0 |
| /#/cv/ats | 130 | 12,3 % | 0 |
| /#/help | 84 | 10,7 % | 0 |
| **Totalt inloggat** | **3 289** | **52,1 %** | **13** |

Publika sidor (`localStorage.language='en'` tvingat):

| Sida | textnoder | otextat |
|------|-----------|---------|
| /#/register | 35 | 2,9 % |
| /#/login | 19 | 5,3 % |
| / (landning) | 186 | 12,4 % |
| /#/ai-policy | 69 | 13,0 % |
| /#/privacy | 153 | 15,7 % |
| /#/terms | 50 | 24,0 % |
| **/#/accessibility** | 76 | **90,8 %** |

---

# Prioritering för målgruppen "nyanländ med svaga svenskkunskaper"

Personan kan inte svenska, kommer till jobin.se med en engelskspråkig telefon, och behöver först
*ta sig in*, sedan *förstå vad hen ska göra*, och specifikt läsa **`/#/international`** — portalens
enda sida som är skriven **för** hens situation och som i dag är 61 % svensk.

## Etapp 1 — "Kom in och förstå att portalen talar engelska" (S, ~1 dag)
Utan detta spelar allt annat ingen roll: en engelsk användare möter en svensk vägg och registrerar
sig aldrig. Innehållet finns redan översatt — det är bara vägen dit som saknas.

1. `navigator.language`-detektion i `i18n/config.ts:10` (localStorage vinner när användaren valt själv).
2. `LanguageSwitcher` på de publika sidorna — den finns redan, monteras bara i `TopBar`.
3. `<html lang>` följer aktivt språk även före första språkbytet; `document.title` via `t()` (I6).
4. Zod-felmeddelandena genom `t()` (delpåstående c) — `lib/validations/index.ts`.
5. `SkipLinks.tsx:16-18` + de fyra svenska aria-labels i headern (delpåstående d).
6. **`Accessibility.tsx`** — 132 rader, 0 `t()`. Sidan är dessutom lagkrav enligt tillgänglighetsdirektivet.

*Leverabel för sig.* Efter etapp 1 kan en engelskspråkig person registrera sig och navigera portalen
utan att möta svenska i ramen.

## Etapp 2 — "Sidorna ljuger inte" (S, ~1 dag)
Buggar som drabbar **båda** språken, inte översättningsarbete:
7. **I1** — `/#/my-consultant` (13 råa nycklar + 3 felsträngar).
8. **I2** — de 83 nyckellösa `t()`-anropen.
9. **I3** — `t(x) || 'fallback'` i samtyckesgrindarna (art. 9-ytorna från UX11/UX18).
10. Regressionsvakt: ett Playwright-test som failar om synlig text matchar `ns.key.subkey`, plus en
    eslint-regel mot `t(...) ||`. Utan grind kommer skulden tillbaka — samma logik som `lint:schema`.

## Etapp 3 — "Sidan som finns för den här personen" (M, ~2 dagar)
11. **`/#/international`** + `/#/international/visa` — 61,3 % otextat, ~46 strängar. Högst
    nytta-per-krona i hela punkten: det är den enda sidan vars **hela existensberättigande** är
    målgruppen, och den är i dag oläsbar för dem.
12. `/#/interest-guide` (56,7 %, och den enda sidan som visar båda språken samtidigt — den ser
    trasig ut, inte bara oöversatt).

## Etapp 4 — Verktygssidorna i den ordning personan möter dem (M–L, ~4 dagar)
13. `/#/cv` (70,3 %) → `/#/cover-letter` (65,3 %) → `/#/job-search` (54,4 %) →
    `/#/profile` (40 %) → `/#/settings` (42,3 %) → `/#/applications` (31,9 %).
    Det är kedjan "skapa CV → skriv brev → sök jobb → följ upp" — utan den kan personen inte söka jobb.
14. `/#/diary?tab=mood` (65,8 %) inkl. de svenska veckodagarna i `MoodTab.tsx:282`, och `/#/personal-brand` (71,3 %).

## Etapp 5 — Innehållsdata: eget beslut, inte samma arbete (L, kräver ställningstagande)
15. `data/exercises.ts` (1 932 rader / 119 övningar), `services/articleData.ts` (1 416 / 100+ artiklar),
    `services/interestGuideData.ts` (834), `pages/ExternalResources.tsx` (523), `data/helpContent.ts` (286),
    `data/coaches.ts` (179) — **5 355 rader, 58 % av all hårdkodad svenska, 20 filer.**

    Detta är redaktionellt innehåll, inte UI-strängar. Formen bör vara `labelSv/labelEn`-fält i
    datafilerna (mönstret finns redan och undantas av `report:i18n`) eller parallella `*.en.ts`-filer.
    **Innan arbetet påbörjas behövs ett beslut:** översätta allt, översätta ett kuraterat urval
    (t.ex. de 20 mest lästa artiklarna + 20 övningar), eller acceptera svenskt innehåll med en tydlig
    markering i UI:t. Att blint översätta 119 övningar är sannolikt fel prioritering — men att låta
    `/#/exercises` visa 95,7 % svenska utan att säga något är också fel.

## Etapp 6 — Städning (XS–S)
16. I5 (787 nycklar utan träff), I7 (7 svenska värden i en.json), pluralformen i `Diary.tsx:84`
    ("1 days"), de 46 literala aria-labels.

---

## Metodanmärkningar och begränsningar

- Svepet kördes mot **dev-servern på :5173** med **testkontot i prod**. Ingen data skapades eller togs bort.
- "Andel otextat" mäter *identiska strängar*, inte *svenska strängar*. Egennamn och siffror ger ett
  brusgolv på 10–20 %. Metoden **underskattar** när en svensk sträng råkar innehålla ett engelskt ord
  som översätts, och **överskattar** för sidor med mycket data (jobbtitlar, företagsnamn).
- Nyckelanalysen fångar bara **statiska** `t('...')`-anrop. 40 dynamiska prefix (`t(\`ns.${x}\`)`)
  är undantagna från oanvänd-analysen men kan dölja ytterligare saknade nycklar.
- Pages med tillståndsberoende UI (modaler, felvyer, AI-svar) mättes bara i sitt vilotillstånd. De
  83 nyckellösa anropen i I2 ligger till stor del i sådana grenar och syns därför inte i sidtabellen.
- Skärmbilder i scratchpad: `my-consultant-en.png` (I1, tydligast), `international-en.png`,
  `exercises-en.png`, `register-en.png`, `interest-guide-en.png`, `profile-en.png`, `diary-en.png`,
  `calendar-en.png`, `oversikt-en.png`, `mobilmeny-en.png`.
