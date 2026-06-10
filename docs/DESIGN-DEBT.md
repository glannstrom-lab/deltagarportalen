# Designskuld — kända överträdelser mot DESIGN.md v3.0

> **Senast uppdaterad:** 2026-05-14 (90-min designskuld-loop avslutad)
> **Källa:** ESLint-regler från Fas 0 (`client/eslint.config.js`) + i18n-detektor (`scripts/i18n-leak-detector.cjs`).
> **Status nu:** ✅ ESLint-reglerna på `error`-nivå. **0 design-errors, 0 design-warnings** i kodbasen.
> Stale `eslint-disable next-line no-restricted-syntax`-kommentarer rensade — fil-nivå whitelist i `eslint.config.js` täcker dem redan.

### Framsteg

| Fas | Datum | Gradient-warnings | i18n-läckor | Sidor med en-färg-violation |
|-----|-------|-------------------|--------------|------------------------------|
| Fas 0 baseline | 2026-05-10 | **443** | 5 | ≥4 |
| Efter Fas 1 | 2026-05-10 | 443 | **0** | ≥4 |
| Efter Fas 2 | 2026-05-10 | **437** (-6) | 0 | ≥4 |
| Efter Fas 4-pass 1 | 2026-05-10 | **426** (-17 totalt) | 0 | färre |
| Efter Fas 4-pass 2 | 2026-05-10 | **388** (-55 totalt) | 0 | 4 hub-domäner ren |
| Efter Fas 4-pass 3 | 2026-05-10 | **295** (-148 totalt, -33%) | 0 | de flesta verktygssidor |
| Efter Fas 8 | 2026-05-10 | **250** (-193 totalt, -44%) | 0 | inga utöver legacy |
| **2026-05-14 session** | 2026-05-14 | **68** (-241 totalt, -78%) | 0 | inga |
| **ESLint höjd → error** | 2026-05-14 | 68 men 0 errors (whitelistade) | 0 | inga |

### 2026-05-14-sessionen — sammanfattning

Sex commits (5 iterationer) städade 309 → 68 gradient-användningar (-78%):
- Career-tabs, AI-team-relaterat, journey/gamification, onboarding,
  knowledge-base, dashboard widgets, alla publika sidor (Login/Privacy/Terms/AiPolicy)
- Sex sed-pass över ~50 filer för vanliga from-X-50 to-Y-50-mönster
- Riktade edits för dynamiska gradient-funktioner (getBarColor, getMatchBarColor,
  riasecColors, skillColors, achievement.color, nextStep.gradient)
- ESLint höjd från `warn` till `error` med 7 whitelistade filer:
  CVTemplates (CV-mall-thumbnails), ResultsView (RIASEC), Landing (hero),
  design-system.ts (tokens), WellnessQuickCard (decorative glow),
  StaParticipant (två-domän-sida för reflection+aktivitet)

### Fas 4 pass 3 — sammanfattning
- CVTemplates.tsx (43) whitelistade som "dekorativa CV-mall-thumbnails" enligt DESIGN.md §6
- ResultsView.tsx (13) whitelistad som "semantiskt distinkta RIASEC-typer"
- AI-team MarkdownRenderer + MessageBubble (-7): self-gradients och blandningar borta
- 15 dashboard widgets mass-replaced (-37): emerald/amber/blue self-gradients och hub-blandningar borta
- CoverLetterWidget (-11): full sweep av rose/orange/amber-gradients

Det här dokumentet listar varje känd överträdelse mot DESIGN.md v3.0 som finns i kodbasen idag, samt vilken fas i roadmapen som tar hand om den. Inga av punkterna nedan är blockers för CI — alla loggas som varningar och får leva tills sin fas städar dem.

---

## 1. Gradient-överträdelser (DESIGN.md §6)

### Mätvärde

| Mått | Värde |
|------|-------|
| Antal `bg-gradient-to-`-användningar | **443** |
| Antal filer som innehåller minst en | **165** |
| ESLint-regel | `no-restricted-syntax` (Literal + TemplateElement matcher) |
| Nuvarande nivå | `warn` |
| Mål | `error` efter Fas 4 |

### Tolkning

DESIGN.md §6 förbjuder gradient-knappar och gradient i återkommande UI (KPI-kort, sektionsheaders, knappar). Dekorativa gradient-bakgrunder i hjältebilder (t.ex. Översiktens radial-glow) är tillåtna men implementeras via direkt CSS, inte Tailwind `bg-gradient-to-*`.

443 är högt och beror på att gradient-uses är spridda över hela portalen — inte koncentrerade i några få komponenter. Kategorier (uppskattning från snabb sweep):

| Plats | Andel | Exempel |
|-------|-------|---------|
| AI-team-modaler och chat-bubblor | ~40 % | `MessageBubble.tsx`, `OnboardingModal.tsx`, `AIAssistant.tsx` |
| KPI-kort och stat-banderoller | ~20 % | `MarketStats.tsx`, `Resources.tsx` (gradient-banner) |
| Onboarding/welcome-modaler | ~10 % | `Profile`, `Onboarding`, `BreakReminder` |
| Knappar med gradient-CTA | ~5 % | Intresseguide, Skills Gap, LinkedIn-optimerare |
| Dekorativa hero-block | ~15 % | Wellness-hero, Career-hero, kort-headers |
| Övrigt (badges, ikoner, divider-overlays) | ~10 % | Diverse |

Den första prioriteten i Fas 4 är **knapparna** (kategori 4 ovan, ~22 användningar). De är de mest synliga och bryter Manifestet tydligast.

### Plan

| Fas | Vad |
|-----|-----|
| **Fas 2** (designsystem-kärna) | Sweep-fix av kända gradient-knappar: Intresseguide, Skills Gap, Profile-onboarding-modal-header. Solid `--c-solid` som ersättare. |
| **Fas 4** (verktygssidor) | Per sida: ta bort gradient i KPI-kort, sektionsheaders, banners. Behåll bara dekorativa hero-gradienter där de är medvetna designval. |
| **Slutet av Fas 4** | Höj ESLint-regeln från `warn` till `error`. Kvarvarande dekorativa gradient-uses whitelist:as inline med `// eslint-disable-next-line no-restricted-syntax` + en kommentar som motiverar. |

### Inline-undantag (whitelist-mönster)

När en gradient verkligen är medveten dekorativ design (t.ex. Översiktens radial-glow), använd:

```tsx
// eslint-disable-next-line no-restricted-syntax -- DESIGN.md §3 dekorativ hero-glow
<div className="absolute inset-0 bg-gradient-to-br from-[var(--c-accent)]/20 to-transparent" />
```

Inga undantag utan kommentar. Inga undantag på `<button>`-element.

---

## 2. Hårdkodade hub-tokens (DESIGN.md §14)

### Mätvärde

| Mått | Värde |
|------|-------|
| Antal direkt-referenser till `--{action,activity,coaching,info,wellbeing}-{bg,accent,solid,text}` | **0 efter undantag** |
| Whitelistade filer | `src/pages/hubs/HubOverview*.tsx` |

### Tolkning

DESIGN.md §14: komponenter ska konsumera `--c-bg`, `--c-accent`, `--c-solid`, `--c-text` — aldrig en specifik hubs token. Tokens sätts av `PageLayout` via `data-domain`-attributet.

**Enda legitima undantaget:** Hub-landningssidor som visar 4 hub-färger samtidigt (HubOverview + HubOverviewHistory). Dessa whitelistas i `client/eslint.config.js`.

### Plan

Inga åtgärder krävs. Reglerna håller redan `warn`-nivå utan brott. Höj till `error` i samma takt som gradient-regeln (slutet av Fas 4) för att vara säkra.

---

## 3. i18n-läckande keys (DESIGN.md §7 — empty states)

### Mätvärde

Senaste sweep med `scripts/i18n-leak-detector.cjs` (2026-05-10):

| Mått | Värde |
|------|-------|
| Rutter som scannades | 63 |
| Rutter med läcka | 3 |
| Unika läckande keys | **5** |
| Detektor-skript | `scripts/i18n-leak-detector.cjs` |
| Senaste rapport | `scripts/i18n-leak-report.json` |

### Kända läckor

| Key | Plats | Trolig orsak |
|-----|-------|--------------|
| `myConsultant.noConsultantFullDesc` | `/my-consultant` | Saknar översättning i `sv.json` — empty-state-beskrivning |
| `jobSearch.municipality` | `/job-search` | Filter-label, saknar översättning |
| `jobSearch.region` | `/job-search` | Filter-label |
| `jobSearch.employmentType` | `/job-search` | Filter-label |
| `jobSearch.publishedWithin` | `/job-search` | Filter-label |

### Plan

**Fas 1.1 — i18n-läckage-sweep** (vecka 2 i roadmapen). Lägg till de 5 keys i `client/src/i18n/locales/sv.json`. Verifiera att detektorn rapporterar 0 läckor efteråt.

Veckovis sweep i Fas 8 — Polish.

---

## 3.5. WCAG 2.1 AA color-contrast

✅ **Fixad 2026-05-14** — färsk axe-core-audit på 9 huvudsidor.

**Status:** 24 → 0 violations.

**Fix tredelat:**

1. **Hub-token-färger för svaga mot vit text** (systemiskt):
   - `--action-solid` #1F8A66 → #1A7757 (4.29 → 5.61)
   - `--info-solid` #2F7DB5 → #266DA0 (4.44 → 5.77)
   - `--activity-solid` #C97A2E → #A85D24 (3.32 → 4.91)
   - `--wellbeing-solid` #7058A8 redan OK (5.9)
   - `--coaching-solid` #B85363 redan OK (4.65)

2. **Text-färger på vit/pastell-bakgrund** (lokala):
   - HubOverview activity-feed `var(--stone-500)` → `var(--stone-700)`
   - Sidebar roll-tagg `text-stone-400` → `text-stone-600`
   - ProfileHeader sync `text-emerald-600` → `text-emerald-700`
   - CVBuilder stepper `text-emerald-600` → `text-emerald-700`
   - OverviewSection tip `text-amber-600` → `text-amber-800`
   - JobSearch "Rensa alla" `text-red-500` → `text-red-700`
   - ContextualKnowledgeWidget level-taggar `-600` → `-700`

3. **Mörk bakgrund** (Landing-footer):
   - `text-stone-400` → `text-stone-300` (3.64 → 6.06)

Verifierat via `e2e/axe-contrast.cjs` på Landing, Login, Översikt, Profil, CV, JobSearch, Karriär, Min vardag, Wellness.

---

## 4. Övriga kända designöverträdelser från audit 2026-05-10

Dessa fångas inte av ESLint utan av visuell audit (`archive/2026-06-dokkonsolidering/audit-2026-05-10/RAPPORT.md` + `DESIGN-GRANSKNING.md`). Listas här för spårbarhet.

### Två-läges-systemet (DESIGN.md §3)

| Sida | Avvikelse | Status |
|------|-----------|--------|
| `/jobb`, `/karriar`, `/resurser`, `/min-vardag` | Hub-landningar har full pastell-hero — *konformt med v3.0, men tidigare DESIGN.md krävde neutral grå*. Verifiera att de följer §3 exakt efter Fas 3. | Fas 3 |
| `/skills-gap-analysis` | Saknar PageHeader helt — bara centrerad hero utan border. Inkonsistent med övriga verktygssidor. | ✅ Fixad 2026-05-14 (commit 0a0ba16) — alla 4 return-paths wrappar nu PageLayout med coaching-domain |
| Verktygssidor under hubbarna | Många sidor har inte 4 px hub-vänsterkant på sin neutral-header. | Fas 4 (alla) |

### En-färg-per-sida-regeln (DESIGN.md §4)

| Sida | Avvikelse | Status |
|------|-----------|--------|
| `/career` | 4 olika pastellfärger på KPI-kort på samma vy (mint, grön, persika, lavendel). | ✅ Delvis fixad 2026-05-14 (commit e1d432e) — RelocationTab + PlanTab använder coaching-tokens, behåller röd/amber/stone för semantisk urgens |
| `/help` | ✅ Verifierat 2026-05-14 — använder redan `var(--c-bg)` konsekvent, inga mörkblå banderoller kvar |
| `/wellness` | ✅ Verifierat 2026-05-14 — "Spara reflektion" är `rgb(112,88,168)` (wellbeing-solid) med vit text |

### Tomtillstånd (DESIGN.md §7)

| Sida | Avvikelse | Status |
|------|-----------|--------|
| `/applications` | Dubbla tomtillstånd (pipeline-skelett + empty-state) | ✅ Fixad 2026-05-10 (B13) |
| `/nätverk` | Tre staplade tomtillstånd (KPI med "0", tom kontakt-lista, tom event-lista) | ✅ Fixad 2026-05-14 (commit 00ecf2f) — EmptyState med EN tydlig CTA |
| `/oversikt/historik` | Stor blank yta med en enda rad — ingen kontextualiserad förslagslista | ✅ Verifierat 2026-05-14 — items.length < 3 → 3 launch-cards (Sök jobb / Karriärmål / Logga mående) |

### Onboarding (DESIGN.md §12)

| Komponent | Avvikelse | Fas |
|-----------|-----------|-----|
| `OnboardingFlow` (global) | Visas potentiellt parallellt med sido-specifika onboardings | Fas 6 |
| `OnboardingModal` (AI-team) | Egen modal-stil (cyan→mint gradient-bg) | Fas 6 |
| CV-tour-overlay | Egen orange "Steg 1 av 7"-overlay, separat komponent | Fas 6 |
| Profile welcome-modal | Egen turkos→blå→lila→rosa-gradient-header | Fas 6 |

**Mål Fas 6:** Konsolidera till en enda `<OnboardingFlow>`-komponent. Övriga tas bort eller migreras.

### Logotyp (DESIGN.md §13)

| Plats | Status |
|-------|--------|
| `/login` | ✅ `/logo-icon.svg` (rätt) |
| `/register` | ✅ `/logo-icon.svg` (fixad 2026-05-10, B10) |
| App-topbar | ✅ `/logo-icon.svg` |
| Landing-footer | ⏳ `/logo-jobin-new.webp` — white-version på mörk bakgrund (legitim variant) |
| Övriga refs till `/logo-jobin.png` | ✅ Inga kvar i `client/src` |

### Mobil (DESIGN.md §9)

| Sida | Avvikelse | Status |
|------|-----------|--------|
| `/cv` mobil | 6356 px lång scroll med 11 mall-kort vertikalt staplade | ✅ Fixad 2026-05-14 (commit 727caf1) — grid-cols-2 + h-40 = ~3200 px |
| Verktygssidor mobil | Sub-tabs är gömda i meny — inte synliga som horisontell scroll-bar | ✅ Fixad i Fas 7 (audit 2026-05-11 bekräftar) |
| Hub-landningar mobil | Saknar kort intro-mening överst | ✅ Verifierat 2026-05-14 — alla 4 hubbar har hubDescription som visas via PageHero |

### Personalisering (DESIGN.md §2)

| Plats | Status |
|-------|--------|
| Översikt-hero ("Hej {namn}") | ✅ "God morgon/kväll, {firstName}" via timeOfDayGreeting() |
| Hub-headers (Jobb/Karriär/Resurser/Min vardag) | ✅ Verifierat 2026-05-14 — alla 4 hubbar passar firstName-prop till HubPage som visar "Hej {firstName}" som greeting-rad |
| Notiser | ⏳ Generiska — använder inte namn |
| Empty-state-copy | ⏳ Inkonsistent — vissa använder "Du", inga använder namn |

### Voice & Tone (DESIGN.md §2)

✅ **Fixad 2026-05-14** — Voice & Tone-pass över sv.json + en.json (~55 strängar):

**Regel 1 (Rubriker är inviter):**
- ✅ "Sök företag" → "Hitta företag att kontakta"
- ✅ "Mina ansökningar" (nav) → "Dina jobbansökningar"
- ✅ "Min vardag" (hub) → "Din vardag"
- ✅ "Mina resurser" → "Dina sparade resurser"
- ✅ "Mitt CV" (6×) → "Ditt CV"
- ✅ "Mina CV" / "Mina sparade CV" → "Dina CV" / "Dina sparade CV"
- ✅ "Mina brev" → "Dina brev"
- ✅ "Mitt nätverk" → "Ditt nätverk"
- ✅ "Mina Credentials" / "Mina credentials" → "Dina meriter"
- ✅ "Mina kompetenser" → "Dina kompetenser"
- ✅ "Mina Intressen (RIASEC)" → "Dina intressen (RIASEC)"
- ✅ "Mina Quests" → "Dina utmaningar"
- ✅ "Mitt AI Team" / "Mitt AI-team" → "Ditt AI-team"
- ✅ "Min konsulent" (nav) → "Din konsulent"
- ✅ "Mina dokument" (nav) → "Dina dokument"
- ✅ "Mina företag" (spontanansökan) → "Dina sparade företag"

**Regel 2 (Aldrig administrationsspråk):**
- ✅ "Hantera dina inställningar..." (Settings desc) → "Dina inställningar..."
- ✅ "Hantera dina personuppgifter" → "Dina personuppgifter"
- ✅ "Hantera dina sekretessinställningar" → "Dina sekretessinställningar"
- ✅ "Hantera lösenord..." → "Lösenord och säkerhetsinställningar"
- ✅ "Hantera i inställningar" (3×) → "Ändra i inställningar"
- ✅ "Anpassa portalens utseende" → "Hur portalen ser ut"
- ✅ "Generera" (8×) → "Skapa"
- ✅ "Genererar..." → "Skapar..."
- ✅ "Generera ny" → "Skapa ny"
- ✅ "Validera kunskaper" → "Kolla dina kunskaper"
- ✅ "Vänligen korrigera följande" → "Det här behöver justeras"

**Regel 3 (Aldrig prestationsspråk):**
- ✅ "Inga aktiva ansökningar" → "Du har inte börjat söka jobb än"
- ✅ "X aktiva ansökningar" → "X ansökningar pågår" (subtilare än siffer-fokuserat)
- ✅ "Hantera" / "Spåra ansökningar" → "Öppna" / "Följ upp"

**Lämnat avsiktligt:**
- Konsulent-vyer behåller "Hantera" / "Generera PDF-rapport" — DESIGN.md §2
  tillåter mer effektiv ton för konsulent/admin.
- "Validera" i interest-guide-context där det är psykometrisk term, inte UI-action.
- Streak-strängar visas bara när streak > 0 (inte 0-prestationsspråk).

Inga obesvarade strängar i sv.json som matchar admin-språk-mönstret kvar.

---

## Hur dokumentet underhålls

- **Veckovis i Fas 8 (Polish):** Kör `npx eslint .` + `node scripts/i18n-leak-detector.cjs`. Uppdatera mätvärdena i avsnitt 1-3.
- **Per fas:** När en fas är genomförd, markera relaterade rader som ✅ Fixad och flytta till en arkivsektion.
- **När alla rader är ✅:** Dokumentet kan slopas. Tills dess är det den levande sanningen om vad vi ännu inte hunnit.
- **Vid tillägg:** Nya regler som upptäcks genom audit eller code review läggs in här innan de fixas, inte istället för att fixas.

---

## Filer som ändrats för att aktivera detta

- `client/eslint.config.js` — design-regler (gradient + hub-tokens) på `warn`-nivå
- `client/src/components/ui/EmptyState.tsx` — JSDoc-kontrakt enligt DESIGN.md §7
- `scripts/i18n-leak-detector.cjs` — Playwright-baserad sweep
- `.github/PULL_REQUEST_TEMPLATE.md` — designcheck i varje PR
- `archive/2026-06-dokkonsolidering/audit-2026-05-10/data/baseline.json` — frusen baseline för regression-mätning
