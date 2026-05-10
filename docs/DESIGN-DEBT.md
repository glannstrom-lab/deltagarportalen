# Designskuld — kända överträdelser mot DESIGN.md v3.0

> **Senast uppdaterad:** 2026-05-10 (efter Fas 4-pass 1)
> **Källa:** ESLint-regler från Fas 0 (`client/eslint.config.js`) + i18n-detektor (`scripts/i18n-leak-detector.cjs`).
> **Tas bort när:** Fas 4-7 i `docs/DESIGN-ROADMAP.md` är genomförda.
> **Status nu:** ESLint-reglerna håller `warn`-nivå. Höjs till `error` när gradient-warnings ≤ 50.

### Framsteg

| Fas | Datum | Gradient-warnings | i18n-läckor | Sidor med en-färg-violation |
|-----|-------|-------------------|--------------|------------------------------|
| Fas 0 baseline | 2026-05-10 | **443** | 5 | ≥4 |
| Efter Fas 1 | 2026-05-10 | 443 | **0** | ≥4 |
| Efter Fas 2 | 2026-05-10 | **437** (-6) | 0 | ≥4 |
| Efter Fas 4-pass 1 | 2026-05-10 | **426** (-17 totalt) | 0 | färre |

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

## 4. Övriga kända designöverträdelser från audit 2026-05-10

Dessa fångas inte av ESLint utan av visuell audit (`audit-2026-05-10/RAPPORT.md` + `DESIGN-GRANSKNING.md`). Listas här för spårbarhet.

### Två-läges-systemet (DESIGN.md §3)

| Sida | Avvikelse | Fas |
|------|-----------|-----|
| `/jobb`, `/karriar`, `/resurser`, `/min-vardag` | Hub-landningar har full pastell-hero — *konformt med v3.0, men tidigare DESIGN.md krävde neutral grå*. Verifiera att de följer §3 exakt efter Fas 3. | Fas 3 |
| `/skills-gap-analysis` | Saknar PageHeader helt — bara centrerad hero utan border. Inkonsistent med övriga verktygssidor. | Fas 4.B |
| Verktygssidor under hubbarna | Många sidor har inte 4 px hub-vänsterkant på sin neutral-header. | Fas 4 (alla) |

### En-färg-per-sida-regeln (DESIGN.md §4)

| Sida | Avvikelse | Fas |
|------|-----------|-----|
| `/career` | 4 olika pastellfärger på KPI-kort på samma vy (mint, grön, persika, lavendel). | Fas 4.B / 5.1 |
| `/help` | Solid mörkblå sektionsbanderoller — bryter mot "pasteller bor i innehållet, inte i banners". | Fas 4 (Resurser-domänen) |
| `/wellness` | "Spara reflektion"-knapp är pastell istället för solid `--c-solid` — knappt synlig. | Fas 4.D |

### Tomtillstånd (DESIGN.md §7)

| Sida | Avvikelse | Status |
|------|-----------|--------|
| `/applications` | Dubbla tomtillstånd (pipeline-skelett + empty-state) | ✅ Fixad 2026-05-10 (B13) |
| `/nätverk` | Tre staplade tomtillstånd (KPI med "0", tom kontakt-lista, tom event-lista) | Fas 4.C |
| `/oversikt/historik` | Stor blank yta med en enda rad — ingen kontextualiserad förslagslista | Fas 5.6 |

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

| Sida | Avvikelse | Fas |
|------|-----------|-----|
| `/cv` mobil | 6356 px lång scroll med 11 mall-kort vertikalt staplade | Fas 7.2 |
| Verktygssidor mobil | Sub-tabs är gömda i meny — inte synliga som horisontell scroll-bar | Fas 7.4 |
| Hub-landningar mobil | Saknar kort intro-mening överst | Fas 7.1 |

### Personalisering (DESIGN.md §2)

| Plats | Status | Fas |
|-------|--------|-----|
| Översikt-hero ("Hej {namn}") | ⏳ Saknas — visar bara "Välkommen tillbaka" | Fas 1.3 |
| Övriga hub-headers | ⏳ Saknas | Fas 1.4 |
| Notiser | ⏳ Generiska — använder inte namn | Fas 1 (löpande) |
| Empty-state-copy | ⏳ Inkonsistent — vissa använder "Du", inga använder namn | Fas 1.6 |

### Voice & Tone (DESIGN.md §2)

| Sträng | Plats | Förslag | Fas |
|--------|-------|---------|-----|
| "Hantera resurser" | Resurser-hub-titel | "Dina sparade resurser" | Fas 1.5 |
| "Mina vardagliga rutiner" | Min vardag-hub-titel | "Din vardag" | Fas 1.5 |
| "Sök företag" | Spontanansökan-tab | "Hitta företag att kontakta" | Fas 1.5 |
| "0 aktiva ansökningar" | Mina ansökningar | "Du har inte börjat söka jobb än" | Fas 1.5 / 5.4 |
| "Aktivera notiser" | Settings | "Slå på notiser" | Fas 1.5 |
| (uppskattat 30+ till) | sv.json | Genomgång enligt §2-tabellen | Fas 1.5 |

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
- `audit-2026-05-10/data/baseline.json` — frusen baseline för regression-mätning
