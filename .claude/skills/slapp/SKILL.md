---
name: slapp
description: Släpp kod till produktion — grindar, commit, push och verifiering av deployen, samt migrationer mot prod. Använd när Mikael säger "commit", "push", "deploy", "släpp", "lägg upp", "kör igång det", eller när en ändring är klar och ska ut. Gäller också varje migration mot prod-databasen, eftersom snapshoten måste committas i samma commit.
---

# Släpp — en procedur, hitta aldrig på en ny

**Push till `main` ÄR deployen.** `.github/workflows/deploy.yml` triggar på push →
`vercel build` → `vercel deploy --prod` → Supabase edge functions → smoke-test.
Det finns inget separat deploykommando och inget att klicka i Vercel.

Allt går direkt på `main`. Inga feature-grenar.

> **En push är en produktionsändring.** Behandla den därefter.

---

## Steg 0 — kräver den här ändringen Mikaels ja först?

Fråga **innan** push, inte efter:

- `client/vercel.json`
- `.github/workflows/`
- RLS-policyer
- migrationer mot prod

Allt annat följer proceduren rakt av.

---

## Steg 1 — kör grindarna själv

```bash
cd client && npm run verify
```

`verify` kör tio grindar i den här ordningen:

`lint:vercel` → `lint:schema` → `lint:grants` → `typecheck:critical` →
`typecheck:api` → `typecheck:ceiling` → `lint:ci` → `lint:design` →
`lint:links` → `test:coverage`

### ⚠️ Pre-push-hooken är inte det skyddsnät den ser ut att vara

Verifierat i `.husky/pre-push`. Den kör **fem** av tio:

| Kör | Kör INTE |
|---|---|
| `lint:vercel` | `lint:grants` |
| `lint:schema` | `typecheck:api` |
| `typecheck:critical` | `typecheck:ceiling` |
| `lint:ci` | `lint:links` |
| `lint:design` | `test:coverage` — **inga tester alls** |

Plus ett **fullt bygge**, men bara när `client/vercel.json`, `package.json`,
`vite.config`, `index.html`, `tsconfig`, `scripts/` eller `.github/workflows/`
ändrats.

**CI kör `test:coverage`, inte `test:run`.** Kör det kommando CI kör, inte det
som liknar det.

### Tre frysta tak — sänk dem, höj dem aldrig

| Grind | Tak |
|---|---|
| `lint:ci` | 122 warnings |
| `typecheck:ceiling` | 356 typfel |
| `lint:design` | 52 gradienter |

Taken finns för att skulden ska kunna minska men inte växa. **Höj aldrig ett tak
för att bli grön** — laga felet eller fråga. `typecheck:api` har inget tak och
ska vara noll.

### Om en grind faller på något du inte rört

Titta efter innan du antar att det är brus. Två färska exempel:

- `lint:links` kände inte till en ny prerenderad sidtyp, för dess sidlista
  härleds ur `publish-list`, `KATEGORIER`, `tools.json` och `b2b.json`.
- Coverage-sviten föll på två `t()`-anrop vars i18n-nycklar aldrig lagts in.
  Den grinden (`i18n/nycklar-finns.test.ts`) finns **inte** i `lint:ci`.

---

## Steg 2 — migrationer mot prod (om ändringen rör databasen)

**Använd aldrig `npx supabase db push`** — den försöker köra alla migrationer och
failar på konflikter.

```bash
# Kör migrationen
npx supabase db query --linked -f supabase/migrations/<fil>.sql

# Verifiera utfallet, inte att kommandot gick igenom
npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='<tabell>';" --output table
```

Därefter, **i samma commit som migrationen**:

```bash
cd client
npm run schema:refresh    # rör migrationen tabeller/kolumner
npm run grants:refresh    # rör den GRANT/REVOKE eller RLS
```

Utan uppdaterad snapshot blir grinden falskt röd; utan grinden återkommer
fantomtabellerna.

### Två fällor som gjort migrationer verkningslösa

**`REVOKE … FROM anon` gör ingenting när PUBLIC har EXECUTE.** Kommandot lyckas
tyst. Mät utfallet:

```bash
npx supabase db query --linked "select proname, proacl::text, has_function_privilege('anon', oid, 'EXECUTE') as anon_exec from pg_proc where proname = '<funktion>';" --output table
```

Ska `anon` aldrig nå funktionen: `REVOKE EXECUTE ON FUNCTION … FROM PUBLIC;`
följt av explicita `GRANT` till de roller som ska ha den.

**Permissiva dubblettpolicyer OR:as.** En extra policy som ser harmlös ut kan
upphäva den strängare bredvid. Läs hela uppsättningen, inte den du just skrev:

```bash
npx supabase db query --linked "select policyname, cmd, permissive, qual, with_check from pg_policies where tablename='<tabell>' order by cmd;" --output table
```

Fråga för varje par: *finns det en policy här som ensam räcker för att godkänna
operationen?* Om ja är den svagaste den som gäller.

**En REVOKE är aldrig klar, för koden runt omkring rör sig.** A17 revokade
`grant_consent`/`withdraw_consent` när de hade noll anropare — korrekt då. Två
veckor senare byggdes `consentApi.ts` som portalens enda väg till samtycken, och
ingen gav tillbaka rättigheten. Ingen användare kunde ge eller återkalla ett
samtycke på tre veckor.

---

## Steg 3 — commit

Beskriv **vad och varför**, inte bara vad.

```bash
git add <filer>
git commit -F - <<'EOF'
<typ>(<scope>): <rubrik>

<varför ändringen finns, vad som mättes, vad som medvetet lämnades>
EOF
```

Lägg till attributionsraderna som sessionens instruktioner anger.

---

## Steg 4 — push

```bash
git push origin main
```

`git push --no-verify` finns som nödutgång. **Använd den inte för att komma runt
en röd grind** — laga grinden eller fråga.

---

## Steg 5 — verifiera utfallet. Pushad ≠ levererat.

`gh` CLI saknas på den här maskinen. Repot är publikt, så använd API:t:

```bash
curl -sS "https://api.github.com/repos/glannstrom-lab/deltagarportalen/actions/runs?per_page=1&branch=main"
```

Läs `status` och `conclusion` på den översta körningen. Failar den: hämta
jobbstegen och åtgärda.

**Rapportera aldrig "pushad" som om det vore "levererat".**

### När loggen är oläsbar

Jobbloggar kräver admin-behörighet via API:t, men **annotationer går att läsa
publikt** via `/check-runs`. Ett CI-fel vars logg kräver behörighet du inte har
är ett osynligt fel — skriv diagnostik som `::error::` så kan vem som helst läsa
den. Det gjorde ett fem månader gammalt Lighthouse-fel läsbart på en körning.

---

## Efter deploy — verifiera i drift, inte i koden

**En fix som inte är verifierad i drift är en avsikt, inte en åtgärd.**

- Rör ändringen CV-PDF: `node e2e/cv-pdf-prod-rok.cjs` (mot skarp drift).
  `cv-pdf-puppeteer-rok.cjs` kör mot din lokala Node och Chrome och bevisar
  ingenting om Vercels runtime.
- Rör den en AI-funktion: testa mot `https://www.jobin.se`. Dev-servern svarar
  **501** för allt utom STA-mocken.
- Kräver punkten en dashboardåtgärd (miljövariabel, cron): skriv en
  verifieringsrad med kommando och **förväntat svar** (`→ HTTP 200`, inte
  `→ HTTP 503`) och kör den innan punkten stängs. A18:s vakt var korrekt byggd,
  deployad och fail closed — och svarade 503 för alla, eftersom `CRON_SECRET`
  aldrig sattes.

---

## Två saker som inte är sanna trots att de låter så

- **Grön CI är ingen spärr.** `main` saknar branch protection och push är
  deployen — det finns mekaniskt ingenting mellan en trasig commit och prod.
- **`engines` i `package.json` styr inte Vercels runtime.** Fältet sa `22.x`
  medan funktionen körde Node 24. Runtimen sätts i Vercels projektinställningar.
