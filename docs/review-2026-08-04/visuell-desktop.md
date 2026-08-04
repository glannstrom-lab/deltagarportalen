# Visuell granskning — Jobin/Deltagarportalen, desktop 1440×900

**Datum:** 2026-08-04 · **Miljö:** localhost:5173 (dev), HashRouter · **Konto:** claude-playwright-test@jobin.se (deltagare, har tilldelad konsulent, 4 aktiva ansökningar, 1 CV, 1 dagboksinlägg)
**Metod:** Playwright/Chromium, inloggad, cookiebanner avfärdad ("Endast nödvändiga"), 34 sidor besökta, fullPage-skärmbild per sida + DOM-sond (bakgrundsfärger, border-left, gradienter, pastellinventering, ikon-tile-hue, råa i18n-nycklar, overflow, fixed-overlay-täckning, konsolfel + HTTP≥400).
**Skärmbilder:** `<scratchpad>/shots-desktop/<namn>.png`
**Rådata:** `results.json` (pass 1), `results2.json` (pass 2), `tiles.json`, `overlap.json`

> **Not om ett falskt fynd jag förkastade:** I `ai-team.png` (fullPage) syns topbar + sidomeny renderade två gånger mitt på sidan. Det är en *stitching-artefakt* från Playwright fullPage när ett element är `position: sticky` (verifierat: topbaren är `sticky; top:0; z-40`, och en viewport-skärmbild `ai-team-viewport.png` visar ingen dubblering). Rapporteras inte som bugg.

---

## Vad som är bra (och som inte ska röras)

Innan felen: **två-lägessystemet i DESIGN.md §3 är genomfört med ovanlig disciplin.** Mätt på 34 sidor:

- Alla fem hub-landningar har full pastell-hero i rätt hub-färg: `/oversikt` `rgb(236,247,241)` mint, `/jobb` `rgb(252,241,230)` persika, `/karriar` `rgb(251,238,239)` rosa, `/resurser` `rgb(236,244,250)` sky, `/min-vardag` `rgb(242,237,248)` lavendel — exakt DESIGN.md §3-tabellens soft-bg-värden.
- 27 av 29 verktygssidor har neutral grå hero `rgb(245,244,240)` (= `--header-bg` `#F5F4F0`) med **4 px vänsterkant i moderhubbens solid-färg** — persika `rgb(168,93,36)`, rosa `rgb(184,83,99)`, sky `rgb(38,109,160)`, lavendel `rgb(112,88,168)`. Ingen enda verktygssida har hub-färgad full hero.
- **Noll gradienter** utanför de fem tillåtna hub-hero-glow:arna (`radial-gradient(circle, <hub-accent> 0%, transparent 70%)`, 320×320 px, dekorativ) — som §3 uttryckligen tillåter. **Inga gradient-knappar någonstans.** De lägen DESIGN.md §6 pekar ut (Intresseguide, Skills Gap, Profile-modal) är åtgärdade — `/interest-guide`:s CTA "Starta Intresseguiden" är nu solid rosa.
- **Noll horisontell overflow** på samtliga 34 sidor (`documentElement.scrollWidth === clientWidth === 1440`). Inga dubbla scrollbars utom en avsiktlig chattlista.
- **Noll konsolfel och noll pageerrors på 33 av 34 sidor.** Laddtiderna är jämna (2,7–3,0 s till stabil DOM); ingen sida fastnar i spinner, inga skelett som aldrig löser ut.
- Tonen på hubbarna är genomgående rätt: *"God kväll, Claude"*, *"Vad vill du göra idag?"*, *"Fyll i när du orkar"*, *"Hela din aktivitet i portalen"*.

Felen nedan sitter alltså i innehållet och i enstaka sidor — inte i systemet.

---

# FYND

## D1 — `/my-consultant` renderar 17 råa i18n-nycklar och i18next-felmeddelanden som rubriker

**Sida:** `http://localhost:5173/#/my-consultant`
**Allvarlighet:** **KRITISK** — sidan är obrukbar och ser trasig ut för användaren
**Bevis:** `shots-desktop/my-consultant.png`

Sidan visar bland annat, ordagrant som synlig text:

- `myConsultant.yourConsultant` (under konsulentens namn i det lila hjältekortet)
- `myConsultant.contactInfo`
- `myConsultant.noMeetingScheduled`
- `myConsultant.writeTo`, `myConsultant.noMessagesYet`, `myConsultant.sendToStart`, `myConsultant.pressEnterToSend`
- `myConsultant.categories.progress`, `myConsultant.categories.cv`, `myConsultant.categories.wellbeing` (som sektionsrubriker)
- `myConsultant.sendEmail`, `myConsultant.bookMeeting` (som **knapptexter**, den senare på den solida lila primärknappen)
- `myConsultant.messagePlaceholder` (avklippt mitt i ordet i inputfältet: `myConsultant.messagePla / ceholder`)

Värre: tre platser renderar i18next **felmeddelanden** som rubriker i H2/H3-position:

> `key 'myConsultant.messages (sv)' returned an object instead of string.`
> `key 'myConsultant.nextMeeting (sv)' returned an object instead of string.`
> `key 'myConsultant.quickActions (sv)' returned an object instead of string.`

**Orsak (verifierad i koden):** `client/src/pages/MyConsultant.tsx` anropar **platta** nycklar medan `client/src/i18n/locales/sv.json` har dem **nästlade** — eller inte alls.

| Kod | Rad | Finns i sv.json? |
|---|---|---|
| `t('myConsultant.yourConsultant')` | `MyConsultant.tsx:154` | Nej — ligger på `myConsultant.consultant.yourConsultant` |
| `t('myConsultant.nextMeeting')` | `MyConsultant.tsx:191` | Finns men är ett **objekt** (`.title`, `.noMeetings`, `.bookMeeting`, `.meetingTypes`) |
| `t('myConsultant.messages')` | `MyConsultant.tsx:439` | Finns men är ett **objekt** |
| `t('myConsultant.quickActions')` | `MyConsultant.tsx:643` | Finns men är ett **objekt** |
| `t('myConsultant.categories.progress'\|`.cv`\|`.wellbeing`)` | `MyConsultant.tsx:267–271` | Nej — ligger på `myConsultant.sharedInfo.categories.*` |
| `t('myConsultant.contactInfo'\|`noMeetingScheduled`\|`writeTo`\|`noMessagesYet`\|`sendToStart`\|`messagePlaceholder`\|`pressEnterToSend`\|`sendEmail`\|`bookMeeting`)` | `MyConsultant.tsx:162,237,443,462,463,515,535,655,679` | **Finns inte alls** |

**Bryter:** DESIGN.md §7 ("❌ Oöversatta i18n-keys — `myConsultant.noConsultantFullDesc` får aldrig läcka till UI") — nyckeln i den förbudsformuleringen ligger i *exakt samma namespace*. Även §2 (all copy) och §1 ("lugn, kunnig vän").

**Varför det inte upptäckts tidigare:** vyn renderas bara när kontot **har** en tilldelad konsulent. Utan konsulent visas `noConsultant`-tomtillståndet, som använder nycklar som faktiskt finns. Testkontot fick en konsulent nyligen — och då blev hela sidan synlig för första gången.

**Åtgärd:** rätta de 18 anropen i `MyConsultant.tsx` mot den faktiska nästlingen i `sv.json`, och lägg till de nio nycklar som saknas (både `sv.json` och `en.json`). Verifiera med ett prod-likt konto **som har konsulent**.
**Storlek:** M (halvdag). Ett par timmar för rättningen, resten för att få ett test som faktiskt går rött — jfr projektets egen lärdom 2026-08-04 om att tomma mockar döljer detta.

---

## D2 — Min vardag-hubben säger "Inte tilldelad" fast konsulent finns — kod går den väg som koden själv förbjuder

**Sida:** `http://localhost:5173/#/min-vardag`
**Allvarlighet:** **HÖG** — deltagaren får veta att hon inte har någon konsulent, vilket är falskt
**Bevis:** `shots-desktop/min-vardag.png` vs `shots-desktop/my-consultant.png`

På hubben står, i funktionskortet "Min konsulent":

> **Min konsulent** — Kontakta din arbetskonsulent och se anteckningar. — statuschip: **`Inte tilldelad`**

På `/my-consultant` samtidigt, samma session, samma konto:

> **Claude Test** — `claude-playwright-consultant@jobin.test` — och en sektion "Det här ser din konsulent".

**Orsak (verifierad):** `client/src/hooks/useMinVardagHubSummary.ts:59-60` läser konsulenten med en direkt join mot `profiles`:

```
.from('consultant_participants')
.select('consultant_id, profiles:consultant_id(id, full_name, avatar_url)')
```

Den vägen ger 0 rader eftersom `profiles` medvetet saknar SELECT-policy för deltagare. Det står ordagrant i `client/src/services/myConsultantApi.ts:10-12`:

> *"Alla deltagarvända ytor som behöver konsulentens namn ska gå via den här funktionen. En direkt `.from('profiles').eq('id', consultant_id)` ger 0 rader — den vägen såg ut som 'ingen konsulent tilldelad' i UI:t i månader."*

`MinVardagHub.tsx:139-140` gör därför `consultant?.full_name` → `undefined` → `status: 'Inte tilldelad'`, `isActive: false`. `/my-consultant` migrerades till RPC:n `get_my_consultant()` (UX12); hubben blev kvar på den gamla vägen.

**Bryter:** inte en designregel utan sanningskravet bakom §2 ("Rubriker/status ska vara sanna") och §7 (tomtillstånd som ljuger). Detta är samma buggfamilj som projektets lärdom 2026-07-27 om fantomtabeller.

**Åtgärd:** låt `useMinVardagHubSummary` anropa `myConsultantApi` / `get_my_consultant()` och läsa `first_name`+`last_name` (RPC:n returnerar inte `full_name` — se `supabase/migrations/20260803100000_get_my_consultant.sql:55-56`). Sök samtidigt efter fler direkt-joins mot `profiles:consultant_id`.
**Storlek:** S (2–3 h).

---

## D3 — Två flytande widgets täcker sidinnehåll på 29 av 34 sidor

**Sida:** alla utom `/oversikt`, `/jobb`, `/karriar`, `/resurser`, `/min-vardag` (hubbarna har luft nere till höger)
**Allvarlighet:** **HÖG** — systemiskt, träffar nästan hela portalen
**Bevis:** `shots-desktop/applications.png`, `wellness.png`, `personal-brand.png`, `settings.png`, `knowledge-base.png`, `my-consultant.png`, m.fl. Mätning i `overlap.json` (elementsFromPoint under varje widgets mittpunkt).

Två `position: fixed`-piller ligger staplade nere till höger och ockluderar det som råkar ligga under. Uppmätta träffar (urval, texten är den som ligger *bakom* pillret):

| Sida | Widget | Täcker |
|---|---|---|
| `/applications` | Tips | `Inga ansökningar` (kolumnen "Erbjudande") |
| `/wellness` | Tips | `Meditation 10 min` (aktivitetsrad) |
| `/personal-brand` | Tips | `Digital närvaro 0%` (sektionsrubrik + procentbadge) |
| `/settings` | Tips | `Profilinställningar … Byt profilbild` |
| `/knowledge-base` | Tips | kategorikortet `Digital närvaro — Optimera din online-profil och syn[lighet]` |
| `/interview-simulator` | Tips | `A Action – Vad gjorde du specifikt?` (STAR-instruktion) |
| `/calendar` | Tips | dagrutan `30` |
| `/skills-gap-analysis` | Tips | `Din nuvarande profil … Namn: Sa[ra]` |
| `/my-consultant` | Tips | i18next-felmeddelandet i D1 |

**Orsak:** `client/src/components/Layout.tsx:143-146` monterar `<GlobalCoachWidget />` ("Tips") och `<SamlingarFab />` ("Mina samlingar") globalt. `client/src/components/SamlingarFab.tsx:153-155`:

```
'group fixed z-40',
'bottom-36 right-4 sm:bottom-[88px] sm:right-6',
```

Ingen sida kompenserar med padding-right/padding-bottom för de ~170×110 px som widgetarna permanent äter ur nedre högra hörnet.

**Bryter:** DESIGN.md §1 konsekvens 1 ("Lugn före information") och §1 konsekvens 5 ("Ett centrum per skärm" — här ligger två persistenta sekundära CTA:er ovanpå det primära innehållet på varje sida). Två flytande piller är också "tools-SaaS"-signalen §1 varnar för.

**Åtgärd:** välj en av tre — (a) slå ihop till **en** FAB med två val, (b) låt widgetarna auto-döljas när de överlappar innehåll (IntersectionObserver) eller vid scroll nedåt, (c) reservera plats globalt (`main { padding-right: 96px; padding-bottom: 96px }` på ≥sm). (a) är mest i linje med §1.
**Storlek:** M (1 dag).

---

## D4 — Två onboarding-modaler öppnar sig av sig själva, i samma session, med olika komponenter

**Sida:** `http://localhost:5173/#/cv` och `http://localhost:5173/#/profile`
**Allvarlighet:** **HÖG** — bryter tre punkter i DESIGN.md §12 och §10 samtidigt
**Bevis:** `shots-desktop/cv.png`, `shots-desktop/profile.png`. Verifierat programmatiskt: `CV modal auto-opened: true`; efter "Hoppa över" på /cv och navigering till /profile: `PROFILE modal in same session: "Välkommen! Det här är din profil - ett verktyg som hjälper dig framåt…"`.

**`/cv`:** orange modal, header `Steg 1 av 7`, rubrik *"Välkommen till CV-byggaren!"*, inuti en gul ruta *"Tips! Allt sparas automatiskt, så du kan alltid fortsätta senare."*, sju stegprickar.
**`/profile`:** grön modal, rubrik *"Välkommen!"*, brödtext *"Det här är din profil - ett verktyg som hjälper dig framåt i din jobbsökning. Ta det i din egen takt."*, understruken uppmaning *"Varje steg räknas!"*, fyra stegprickar.

Fyra brott:

1. **§10:** *"Inga obetonade overlays. Modaler ska aldrig öppna utan användarens explicita klick."* Båda öppnar på ren navigering.
2. **§12:** *"Visas högst en gång per session, även om användaren besöker flera nya sektioner."* Här öppnade två olika modaler i **samma** session.
3. **§12:** *"Maximalt 3 steg."* CV-touren har **7**, profil-touren **4**.
4. **§12:** *"`<OnboardingFlow>` är den enda accepterade onboarding-komponenten."* CV använder en egen: `client/src/components/cv/CVOnboarding.tsx`, importerad i `client/src/pages/CVBuilder.tsx:34` (`CVOnboarding, shouldShowOnboarding`) och renderad på rad `1300`. Profilen har en tredje variant. De ser dessutom olika ut (orange header-bar vs grönt header-block) — samma användare möter två olika designspråk för samma sak.

Bonus: `/cv` visar samtidigt **två motstridiga stegräknare** — modalen säger `Steg 1 av 7`, CV-wizarden bakom säger `Steg 1 av 6`.

Sidoanmärkning i tonen: *"Varje steg räknas!"* är precis den gamification-uppmuntran §1 avvisar ("Aldrig som en gamification-app").

**Åtgärd:** konvergera båda till `<OnboardingFlow>`, kapa till max 3 steg, en gång per session globalt (inte per sida), och flytta resten till inline-tips enligt §12 ("Hellre inline-tips än modal").
**Storlek:** M–L (1–2 dagar).

---

## D5 — "0" i hjälteposition: fyra sidor visar nollor som primär information

**Allvarlighet:** MEDEL–HÖG (fyra separata sidor, samma regelbrott)
**Bryter:** DESIGN.md §7 ("❌ '0' som primär information") + §2 Regel 3 ("Aldrig prestationsspråk i hjälteposition för deltagare").

### D5a — `/exercises`: fyra KPI-kort, två nollor, fyra olika färger
**Bevis:** `shots-desktop/exercises-viewport.png`

KPI-raden överst lyder, i KPI-siffra-storlek:

> **119** Övningar totalt   ·   **0** Påbörjade   ·   **0** Aktiva   ·   **119** Ej påbörjade

Två nollor i hjälteposition för en användare som inte börjat. Och korten har **fyra olika bakgrundsfärger** — mint, blek mint, **amber/gul**, lavendel — på en sida vars hub är Min vardag (lavendel). DESIGN.md §6: *"Fyra KPI-kort på samma sida ska ha samma färg. Differentieringen kommer från ikon och text."* Bara det sista kortet har rätt hub-färg. Amber är dessutom reserverat för varningar (§4).

Samma sida bryter också §8:s explicita instruktion om just Övningar (*"överst en kuraterad rad: 'För dig idag: 3 övningar som passar din situation'. Resten kategoriserat och kollapsbart"*). Sidan är i stället **12 274 px hög** med 14 filterchips och 119 kort utlagda platt.

**Föreslagen copy:** ersätt de fyra korten med en mening + en CTA — *"119 övningar väntar. Vi har valt ut tre som passar där du är nu."* + tre kort.

### D5b — `/resources` (Dina sparade resurser): tre nollor och fyra knappfärger
**Bevis:** `shots-desktop/resources.png`

> **4** Sparade jobb · **0** Dokument · **0** Bokmärken · **0** Filer

Tre av fyra KPI-kort är nollor. Dessutom har CV-raden tre knappar i tre olika färger på samma rad — `Redigera` (amber outline), `Exportera PDF` (**grön solid**), `Word` (**blå solid**) — plus `Skapa nytt dokument` (mörkblå solid) ovanför. Fyra knappfärger, ingen av dem hubbens sky-solid `#2F7DB5`. Grönt = emerald, som §4 reserverar för "completed/success". §6: *"Mer än en primär CTA per vy"* är förbjudet.

### D5c — `/personal-brand`: fyra "0%" som sektionsrubriker
**Bevis:** `shots-desktop/personal-brand.png`

Fyra sektioner i rad, var och en med ett rött/rosa `0%`-badge till höger om rubriken: `Digital närvaro 0%`, `Innehåll 0%`, `Nätverk 0%`, `Konsekvens 0%`. För en användare som inte fyllt i något är det fyra nollor staplade. Sidan har dessutom 16 upprepade `Visa tips`-länkar och en trippelstaplad header (PageHeader → banner *"Bygg ett tydligt personligt varumärke som visar vad du kan."* → kort *"Varumärkesaudit"*) innan innehållet börjar — §8 "max 5-7 saker synliga".

### D5d — `/profile`: `0 av 5`
**Bevis:** `shots-desktop/profile.png` — under fältet "Vad intresserar dig i arbetslivet?" står `0 av 5`.

**Åtgärd (alla fyra):** byt nollor mot inbjudande text enligt §2-tabellen. Sammanfoga `/exercises` och `/resources` KPI-rader till en färg (hubbens). Ersätt `0%` med "Inte börjat än" eller dölj tills första svaret finns.
**Storlek:** M per sida, S om man gör en gemensam `<KpiCard>`-genomgång.

---

## D6 — Ikon-tiles blandar flera hub-färger på samma sida

**Allvarlighet:** MEDEL
**Bryter:** DESIGN.md §4 — *"En sida = en hub-färg. Alla pastell-element på en sida (KPI-kort, sektionsbakgrunder, **ikon-tiles**, badges) använder samma hub-färg."*

### D6a — `/knowledge-base`: 13 kategorikort i 5 hub-färger (värst)
**Bevis:** `shots-desktop/knowledge-base.png` — tydligt synligt: grön raket (Komma igång), rosa (Självkännedom), amber (Jobbsökning), röd-orange (Intervju), rosa (Nätverkande), blå (Digital närvaro), blå (Arbetsrätt), rosa (Karriärutveckling), lila (Välmående), blå (Tillgänglighet), amber (Arbetsmarknaden), blå (Praktiska verktyg), blå (Lätt svenska).

**Orsak, ordagrant i koden:** `client/src/pages/KnowledgeBase.tsx:73-79`

```
const DOMAIN_BG: Record<CategoryDomain, string> = {
  action:    'bg-emerald-100 text-emerald-700 …',
  activity:  'bg-orange-100  text-orange-700  …',
  coaching:  'bg-pink-100    text-pink-700    …',
  info:      'bg-sky-100     text-sky-700     …',
  wellbeing: 'bg-violet-100  text-violet-700  …',
}
```

applicerat på rad `240` (`<div className={... ${DOMAIN_BG[cat.domain]}}>`) med `domain` satt per kategori på rad `57-69`. Sidan själv är `domain="info"` (rad `139`). Det är exakt den "färg-confetti" §4 säger att regeln finns för att förhindra.

### D6b — `/wellness`: fyra tipskort i tre färger
**Bevis:** `shots-desktop/wellness.png` — "Mindfulness för arbetssökande" lavendel (rätt), "Rör på dig regelbundet" **blå**, "Prioritera din sömn" **blå**, "Behåll sociala kontakter" **amber**.

### D6c — `/interest-guide`: fyra deltest-ikoner i fyra färger
**Bevis:** `shots-desktop/interest-guide.png` — Arbetsintressen **blå**, Personlighet **violett**, Intresseområden **magenta**, Dina förutsättningar **grön**. Sidan är coaching/rosa. Även den stora sparkle-tilen överst är violett.

### D6d — `/ai-team`: mint/teal genomgående på en sky-sida
**Bevis:** `shots-desktop/ai-team-viewport.png` — agent-tilen, chattavataren och "Tips"-boxen är mint/teal medan sidan tillhör Resurser (sky).

### D6e — `/diary`: amber "Dagens skrivtips"-kort på lavendelsida
**Bevis:** `shots-desktop/diary.png` — hela kortet är gult/amber med solid lila knapp inuti. Amber är §4-reserverat för varning.

### D6f — `/cover-letter`: en cyan/teal tile bland persika (uppmätt, hue 180° på en 30°-sida)

**Åtgärd:** ersätt hårdkodade `bg-<färg>-100`-kartor med `bg-[var(--c-bg)]` / `text-[var(--c-text)]`. Differentiera med ikon, inte färg. Börja med `KnowledgeBase.tsx` (störst effekt, en enda konstant).
**Storlek:** S per sida, M totalt.

---

## D7 — Streak-räknare med brandemoji på Dagbok — och grammatiskt fel

**Sida:** `http://localhost:5173/#/diary`
**Allvarlighet:** MEDEL
**Bevis:** `shots-desktop/diary.png` — chip uppe till höger om flikraden: **`🔥 1 dagar`**

**Bryter:** DESIGN.md §1 — *"Aldrig som en gamification-app. Inga konfettiexplosioner, **inga streak-counters**, inga 'Nivå upp!'."* Och §2 Regel 3:s tabell listar *"Streak: 0 dagar" → (ta bort)*.

Dessutom är svenskan fel: `1 dagar` ska vara `1 dag` (saknad pluralform i i18next-nyckeln).

Samma mönster återkommer mildare på `/min-vardag` (`1 dag i rad` på Mående-kortet) och i `useMinVardagHubSummary`s `streakDays()`. Där är formuleringen mjukare och utan emoji, men det är samma mekanik.

**Åtgärd:** ta bort brandemoji-chipet på `/diary`. Om kontinuitet ska visas alls: gör det till en lugn mening utan siffra i hjälteposition.
**Storlek:** S (1 h).

---

## D8 — Prestationsspråk i deltagarvyer

**Allvarlighet:** MEDEL
**Bryter:** DESIGN.md §2 Regel 3.

| Sida | Citerad text | Kommentar |
|---|---|---|
| `/wellness` | *"Dagens aktiviteter — **1 av 4 avklarade**"* | Formatet `X av Y` är just det §2 listar som förbjudet ("12 av 50 mål uppnådda"). Sektionsrubrik, inte wizard-progress. |
| `/wellness` | *"God sömn är avgörande för **din prestation**. Sikta på 7-9 timmar."* | Prestationsspråk i ett välmåendetips, till en målgrupp där utmattning är vanlig. §1: "Skammen över att stå utanför arbetslivet är reell." |
| `/profile` | *"**Varje steg räknas!**"* (i onboarding-modalen) | Gamification-uppmuntran, §1. |
| `/job-search` | *"Visar 20 av 47 jobb"* | OK — det är ett resultaträkneverk, inte en prestationsmätning. Ingen åtgärd. |

**Åtgärd:** *"1 av 4 avklarade"* → *"Du har gjort en av dagens fyra saker"* eller ta bort siffran. *"din prestation"* → *"din energi"*.
**Storlek:** S.

---

## D9 — Administrationsspråk och etikettrubriker

**Allvarlighet:** LÅG–MEDEL
**Bryter:** DESIGN.md §2 Regel 1 (inviter, inte etiketter) och Regel 2 (aldrig administrationsspråk).

**Regel 2-brott (ordagrant citerat ur UI):**

| Sida | Text | §2 säger |
|---|---|---|
| `/jobb` | *"**Generera** anpassade brev med AI-stöd."* | "Generera" → "Skapa" — står i tabellen |
| `/nätverk` | *"**Synkronisera** med LinkedIn"* + knappen *"**Anslut**"* | rent systemspråk |
| `/career` | knappen *"**Uppdatera**"* bredvid "Svensk arbetsmarknad" | → "Hämta färska siffror" |
| `/exercises` | badge *"Synkad med molnet"* | tekniskt implementationsspråk i deltagarvy |
| `/settings` | *"**Roll och behörigheter**"*, *"Aktiv roll"*, *"Dina **rättigheter** är en kombination av alla dina roller"* | ren admin-vokabulär i en deltagarvy |
| `/settings` | *"Ändra lösenord och **tvåfaktorsauth**"* | avhugget jargongord |

**Regel 1-brott — H1 som är etiketter, inte inviter.** DESIGN.md §3:s egen illustration av en verktygssida är *"Skapa ditt CV / Bygg ett CV som öppnar dörrar."* Verkligheten:

`CV` · `Karriär` · `Hälsa` · `Dagbok` · `Kalender` · `Övningar` · `Nätverk` · `Utbildningar` · `Intervju-simulator` · `Lön & Förhandling` · `Kompetensgap-analys` · `Personligt Varumärke` · `Internationell Guide` · `Spontanansökan` · `Intresseguide`

Underrubrikerna är däremot ofta rätt (*"Bygg och underhåll ditt professionella kontaktnät"*), så det är bara H1-raden som ska bytas.

**Två positiva undantag som visar att det går:** `/applications` heter *"Dina jobbansökningar"* och `/resurser` *"Dina sparade resurser"* — exakt §2:s tabell.

**Inkonsekvens Mina/Dina:** `/jobb`-hubbens funktionskort säger *"**Mina** ansökningar"* medan sidomenyn och målsidan säger *"**Dina** jobbansökningar"*. §2-tabellen är explicit: "Mina ansökningar" → "Dina jobbansökningar". Samma på `/resurser` (*"Mina dokument"* i kortet, *"Dina dokument"* i menyn).

**Åtgärd:** en copy-genomgång av 15 H1 + de sex Regel 2-strängarna. Rent i18n-arbete.
**Storlek:** M (1 dag), noll risk.

---

## D10 — `/knowledge-base` saknar helt verktygssidans header — bryter mot sina egna syskonsidor

**Sida:** `http://localhost:5173/#/knowledge-base`
**Allvarlighet:** MEDEL
**Bevis:** `shots-desktop/knowledge-base.png` + uppmätt: sidan är den enda verktygssidan under Resurser utan `--header-bg`-bakgrund och utan 4 px vänsterkant (`bg=none, borderLeft=-`). Syskonsidorna `/resources`, `/print-resources`, `/externa-resurser`, `/ai-team`, `/nätverk` har alla `rgb(245,244,240)` + `4px rgb(38,109,160)`.

I stället börjar sidan direkt med en stor rubrik **"Hej Claude"** på canvas — en hub-landnings-hälsning på en verktygssida.

**Orsak:** `client/src/pages/KnowledgeBase.tsx:139` — `<PageLayout title="" domain="info" …>`. Tom titel ⇒ ingen PageHeader ⇒ ingen grå hero, ingen hub-kant.

**Bryter:** DESIGN.md §3 "Vad som ALDRIG händer": *"Olika hero-stil mellan två sidor i samma hub (det förvirrar tillhörigheten)."*

**Åtgärd:** ge sidan `title="Kunskapsbank"` (eller en invit: *"Sök svar på det du undrar"*) så PageHeader renderas, och flytta "Hej Claude" till underrubriken eller ta bort den.
**Storlek:** S (1 h).

---

## D11 — `/profile` får mint fast Profil hör till Min vardag (lavendel)

**Sida:** `http://localhost:5173/#/profile`
**Allvarlighet:** LÅG–MEDEL (dokument vs kod motsäger varandra)
**Bevis:** `shots-desktop/profile.png` — profilkortet, "Välkommen"-modalen och ikon-tiles är gröna/mint (uppmätt hue 150°). Sidan saknar dessutom grå hero + hub-kant, precis som D10.

**Orsak:** `client/src/pages/Profile.tsx:146` sätter `domain="action"`. `client/src/lib/domains.ts:67` kommenterar `/profile` som en "system"-sida under ACTION. Och `client/src/components/layout/navigation.ts:292-297` listar min-vardags `memberPaths` som `['/wellness','/diary','/calendar','/exercises','/my-consultant']` — **`/profile` saknas**.

**Konflikten:** DESIGN.md §3:s hub-tabell säger uttryckligen *"**Min vardag** | Wellness, Diary, Calendar, Exercises, My Consultant, **Profile**"*, och `/min-vardag`-hubben visar faktiskt ett kort "Din profil" som länkar dit. Syskonsidan `/my-consultant` är korrekt mappad till `wellbeing` (`domains.ts:54`). Profil är alltså den enda medlemmen som hoppar färg.

**Relaterat:** DESIGN.md §3 säger också *"Sidor utanför hubbarna (Help, Settings, Login) använder neutral grå **utan hub-accent**."* Uppmätt får `/settings` mint-kant `4px rgb(26,119,87)` och `/help` sky-kant `4px rgb(38,109,160)` (`domains.ts:56` mappar `/help` → `info`). Tre sidor, tre avvikelser från §3.

**Åtgärd:** beslut först — hör Profil till Min vardag eller är den en systemsida? Rätta sedan **antingen** koden (`Profile.tsx:146` → `wellbeing`, lägg `/profile` i `memberPaths`) **eller** DESIGN.md §3-tabellen. Idag är båda sanningar samtidigt.
**Storlek:** S (beslut + 1 h).

---

## D12 — `/applications`: åtta pipelinekolumner, fem tomma, fem "0"-badges

**Sida:** `http://localhost:5173/#/applications`
**Allvarlighet:** LÅG–MEDEL
**Bevis:** `shots-desktop/applications.png`

Pipelinen visar åtta kolumner: `Intresserad 2`, `Sparad 1`, `Ansökt 1`, `Screening 0`, `Telefonintervju 0`, `Intervju 0`, `Arbetsprov 0`, `Erbjudande 0`. De fem sista är tomma och visar var sitt eget lilla tomtillstånd (ikon + texten *"Inga ansökningar"*) — fem staplade tomtillstånd i rad.

**Bryter:** §8 (*"Max 5-7 saker synliga utan att användaren har valt en avdelning"* — här åtta) och §7 (*"❌ Staplade tomtillstånd"*, samt "0" som information). §7:s exempel handlar just om Mina ansökningar.

Notera att §8:s specialregel för sidan (*"när 0 ansökningar, dölj pipeline-skelettet"*) **är** implementerad — problemet uppstår i mellanläget: några ansökningar finns, men merparten av kolumnerna är tomma.

**Åtgärd:** kollapsa tomma sena stadier bakom en "Visa fler steg"-toggle, eller visa dem som tunna platshållarremsor utan eget tomtillstånd och utan `0`-badge.
**Storlek:** S–M.

---

## D13 — `/career`: tre staplade headers och en banner vars innehåll kolliderar med nästa rubrik

**Sida:** `http://localhost:5173/#/career`
**Allvarlighet:** LÅG
**Bevis:** `shots-desktop/career.png`

Sidan har tre rubriknivåer före första innehållet: PageHeader *"Karriär / Utforska yrken och planera din framtid"* med fem flikar → rosa banner *"Utforska arbetsmarknaden och bygg din plan steg för steg."* → rubrik *"Svensk arbetsmarknad / Realtidsdata från Arbetsförmedlingen"* med knappen "Uppdatera". Rubriken "Svensk arbetsmarknad" ligger visuellt ovanpå bannerns nederkant — bannern och rubriken delar samma yta utan mellanrum.

Positivt: själva innehållet nedanför följer §8:s Career-instruktion väl (en huvudsiffra `38 058 lediga jobb just nu — 4 566 nya denna vecka`, topp-5-yrken som chips, topp-3-städer). Alla pasteller är rosa. Det är bara headerstapeln som är för tung.

Samma trippelstapling finns på `/personal-brand` (se D5c).

**Åtgärd:** slå ihop bannern med PageHeaders undertitel; ge "Svensk arbetsmarknad" egen `gap-6`-marginal.
**Storlek:** S.

---

## D14 — `/ai-team` öppnar redan nedscrollad

**Sida:** `http://localhost:5173/#/ai-team`
**Allvarlighet:** LÅG
**Bevis:** `shots-desktop/ai-team-viewport.png` (viewport, inte fullPage) — vid ankomst är sidan redan scrollad ~240 px: PageHeadern *"Ditt AI-team"*, informationsbannern och rubriken "Välj din agent" ligger ovanför synfältet, och agentkorten är avklippta upptill.

Sannolik orsak: en `scrollIntoView` på chattcontainern som körs vid mount. (Chattlistan är för övrigt den enda legitima nästlade scroll-containern jag hittade: `div.flex-1.overflow-y-auto` 418/446 px.)

**Åtgärd:** kör inte `scrollIntoView` vid första render, bara när ett nytt meddelande tillkommer.
**Storlek:** S.

---

## D15 — Fokusringen är hårdkodad violett i stället för hubbens färg

**Sida:** `/oversikt` (första tabbstoppet, sannolikt skip-länken) — troligen global
**Allvarlighet:** LÅG (funktionellt synlig, men fel enligt kontraktet)
**Bevis:** uppmätt vid `Tab` på `/oversikt`: `box-shadow: rgba(124, 58, 237, 0.2) 0px 0px 0px 4px`, `outline: rgb(31, 26, 30) solid 3px`.

`rgb(124,58,237)` är violet-600 — en hårdkodad färg, på en sida vars hub är mint. DESIGN.md §6 anger `box-shadow: 0 0 0 3px var(--c-bg), 0 0 0 4px var(--c-solid)` och §10 säger *"Fokusring synlig på alla hubbar. **Aldrig hårdkodad färg.**"*

Ringen **är** synlig och har god kontrast, så detta är ett konsekvensfel, inte ett tillgänglighetsfel.

**Åtgärd:** byt till token-varianten.
**Storlek:** S (30 min).

---

## D16 — `/settings` erbjuder projektet "Steg till arbete" som inte gör något

**Sida:** `http://localhost:5173/#/settings`
**Allvarlighet:** LÅG (men förvirrande)
**Bevis:** `shots-desktop/settings.png` — under "Projekt" listas tre valbara radioalternativ: `Inget projekt (Valt)`, `Steg till arbete — Förberedande insats för personer som behöver mer tid och stöd innan reguljär jobbsökning.`, `Rusta och Matcha — Arbetsförmedlingens matchningstjänst…`. Under listan står i grå småtext:

> *"Sidor för projektet kommer i en kommande uppdatering."*

Väljer man alltså ett projekt händer ingenting synligt. STA-modulen är avaktiverad sedan 2026-08-03 (`MODULES.STA`, av som default), men valet exponeras fortfarande för deltagaren.

**Åtgärd:** dölj projektvalet bakom samma flagga som modulen, alternativt behåll det men skriv ut vad som faktiskt händer.
**Storlek:** S.

---

## D17 — HTTP 406 mot `consultant_meetings` (två anrop per sidladdning)

**Sida:** `http://localhost:5173/#/my-consultant`
**Allvarlighet:** LÅG–MEDEL (enda sidan i portalen med nätverksfel)
**Bevis:** de enda konsolfelen i hela genomgången:

```
406  https://odcvrdkvzyrbdzvdrhkz.supabase.co/rest/v1/consultant_meetings
     ?select=*&participant_id=eq.5b0904ac-…&status=eq.scheduled
     &scheduled_at=gte.2026-08-04T19:21:54.719Z&o…
Failed to load resource: the server responded with a status of 406 ()
```

Två identiska anrop per laddning (dubbelfetch). 406 från PostgREST betyder normalt `.single()`/`.maybeSingle()` mot 0 rader med fel `Accept`-header — dvs. felet inträffar just när användaren *inte* har något inbokat möte, vilket är normalfallet. Det maskeras i UI:t av D1:s i18n-haveri, men skulle annars ge en tyst felväg.

**Åtgärd:** byt till `.maybeSingle()` (eller `.limit(1)` + arrayläsning) och avdubblera anropet.
**Storlek:** S.

---

# Sida-för-sida

Konsolfel = `console.error` + `pageerror` + HTTP ≥ 400, räknat per sidladdning (två oberoende körningar; siffran är pass 2, som även räknar HTTP-fel).

| # | URL | Helhetsintryck | Konsolfel | Not |
|---|---|---|---|---|
| 1 | `/#/oversikt` | **OK** | 0 | Full mint-hero, "God kväll, Claude", 4 hub-kort (tillåtet undantag §4) |
| 2 | `/#/jobb` | **OK** | 0 | Persika-hero, alla tiles persika. D9 ("Mina ansökningar", "Generera") |
| 3 | `/#/karriar` | **OK** | 0 | Rosa-hero, konsekvent |
| 4 | `/#/resurser` | **OK** | 0 | Sky-hero, konsekvent. D9 ("Mina dokument") |
| 5 | `/#/min-vardag` | **Anmärkning** | 0 | Vacker hub, men **D2** — "Inte tilldelad" är falskt |
| 6 | `/#/cv` | **Anmärkning** | 0 | **D4** automodal 7 steg; "Steg 1 av 7" vs "Steg 1 av 6" |
| 7 | `/#/cover-letter` | **OK** | 0 | D6f (en teal tile bland persika) |
| 8 | `/#/job-search` | **OK** | 0 | 21 persika-element, konsekvent. D3 |
| 9 | `/#/applications` | **Anmärkning** | 0 | **D12** åtta kolumner / fem tomma / fem "0". D3 |
| 10 | `/#/interview-simulator` | **OK** | 0 | D3 täcker STAR-instruktionen |
| 11 | `/#/salary` | **OK** | 0 | D3 täcker samtyckesrutan |
| 12 | `/#/linkedin-optimizer` | **OK** | 0 | D3 täcker sidrubriken |
| 13 | `/#/international` | **OK** | 0 | 7 persika-tiles, konsekvent. D3 |
| 14 | `/#/spontanansökan` | **OK** | 0 | Ren |
| 15 | `/#/career` | **Anmärkning** | 0 | **D13** trippel-header + kollision. Innehållet följer §8 väl |
| 16 | `/#/interest-guide` | **Anmärkning** | 0 | **D6c** fyra tile-färger. Gradient-CTA borta — bra |
| 17 | `/#/skills-gap-analysis` | **OK** | 0 | Ren, inga pasteller. D3 |
| 18 | `/#/personal-brand` | **Anmärkning** | 0 | **D5c** fyra "0%" + 16 "Visa tips" + trippel-header |
| 19 | `/#/education` | **OK** | 0 | 7 rosa tiles, konsekvent |
| 20 | `/#/knowledge-base` | **Anmärkning** | 0 | **D10** ingen hero + **D6a** 13 kort i 5 färger |
| 21 | `/#/resources` | **Anmärkning** | 0 | **D5b** tre "0" + fyra knappfärger. Titel dubblerar `/resurser` |
| 22 | `/#/print-resources` | **OK** | 0 | "0 av 133 valda" är ett urvalsräkneverk — acceptabelt |
| 23 | `/#/externa-resurser` | **OK** | 0 | Lång (3 266 px) men konsekvent sky |
| 24 | `/#/ai-team` | **Anmärkning** | 0 | **D14** öppnar nedscrollad + **D6d** mint på sky-sida |
| 25 | `/#/nätverk` | **OK** | 0 | Korrekt `<EmptyState>` (illustration + mänsklig rubrik + CTA). Två CTA:er, D9 |
| 26 | `/#/wellness` | **Anmärkning** | 0 | **D6b** tre tile-färger + **D8** "1 av 4 avklarade", "din prestation" |
| 27 | `/#/diary` | **Anmärkning** | 0 | **D7** `🔥 1 dagar` + **D6e** amber-kort |
| 28 | `/#/calendar` | **OK** | 0 | Ren lavendel. Tom månad utan välkomnande — mindre §7-lucka |
| 29 | `/#/exercises` | **Anmärkning** | 0 | **D5a** två "0" + fyra KPI-färger + 12 274 px platt lista (§8) |
| 30 | `/#/my-consultant` | **TRASIG** | **4** | **D1** 17 råa nycklar + 3 i18next-fel som rubriker. **D17** 2× HTTP 406 |
| 31 | `/#/profile` | **Anmärkning** | 0 | **D4** automodal + **D11** mint fast Min vardag + "0 av 5" |
| 32 | `/#/settings` | **Anmärkning** | 0 | **D16** dött projektval + **D9** admin-språk + mint-kant (§3) |
| 33 | `/#/help` | **OK** | 0 | 9 sky-element, konsekvent. Sky-kant fast §3 säger neutral |
| 34 | `/#/oversikt/historik` | **OK** | 0 | Bäst tonen i portalen: "Du uppdaterade ditt CV", "Du skrev i dagboken" |

**Summering:** 1 trasig · 15 med anmärkning · 18 OK · **4 konsolfel totalt, alla på samma sida**

---

# Prioritering

| Prio | Fynd | Varför först | Storlek |
|---|---|---|---|
| 1 | **D1** `/my-consultant` i18n-haveri | Sidan är obrukbar och exponerar felmeddelanden som UI | M |
| 2 | **D2** "Inte tilldelad" är falskt | Portalen ljuger om något som betyder mycket för deltagaren | S |
| 3 | **D3** Flytande widgets täcker innehåll | 29 sidor, en kodrad | M |
| 4 | **D4** Auto-modaler | Bryter §10 + §12 på tre sätt; träffar varje ny användare | M–L |
| 5 | **D5** Nollor i hjälteposition (4 sidor) | Ren §7/§2-skuld, ren copy+CSS | M |
| 6 | **D6** Färgblandade ikon-tiles (6 sidor) | `KnowledgeBase.tsx` ensam ger störst effekt | M |
| 7 | **D7–D9** Streak, prestations- och adminspråk | i18n-only, noll risk | M |
| 8 | **D10–D17** Enskilda sidfel | Var för sig små | S/st |

## Laddningsupplevelse

Ingen sida visade spinner efter 3 s, och ingen sida visade skelett vid mättillfället — laddningen är helt enkelt snabb nog i dev att båda hinner försvinna. Långsammast till stabil DOM i pass 1 (kall cache, lazy chunks): `/personal-brand` 8,2 s, `/cv` 7,5 s, `/career` 6,1 s, `/job-search` 4,9 s. I pass 2 (varm) låg alla på 2,7–3,0 s. Ingen sida använde spinner *som* tomtillstånd (§7-förbudet), och inget skelett fastnade.
