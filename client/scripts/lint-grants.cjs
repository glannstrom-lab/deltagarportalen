#!/usr/bin/env node
/**
 * lint:grants — A36. Grinden som gör A17 och A22 till ett tillstånd i stället för
 * två städningar.
 *
 * BAKGRUND: A17 stängde 18 av 53 SECURITY DEFINER-funktioner för `anon` den 4 augusti.
 * Mätt den 1 september var siffran 36 av 65 — både totalen och den öppna mängden hade
 * vuxit under mellantiden, utan att någonting larmade. Samma insikt som födde
 * `lint:schema` den 27 juli: en granskning hittar ett läge, en grind håller det.
 *
 * VAD DEN LÄSER: `supabase/grants-snapshot.json`, skriven av `npm run grants:refresh`
 * ur prod. Snapshoten bär `has_function_privilege`-utfallet — alltså vad som FAKTISKT
 * gäller, inte vad ett REVOKE-kommando svarade. (Ett `REVOKE ... FROM anon` lyckas
 * tyst utan att ändra något när PUBLIC har EXECUTE; det kostade A17 en extra migration.)
 *
 * VAD DEN INTE KAN: se drift i prod som skett efter den senaste `grants:refresh`.
 * Kör refreshen efter varje migration som rör GRANT/REVOKE eller RLS. Grinden är
 * deterministisk och kräver inga DB-hemligheter i CI — det är hela poängen med
 * snapshot-mönstret, och priset är att färskheten ligger på den som kör migrationen.
 */

const fs = require('node:fs')
const path = require('node:path')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const SNAPSHOT = path.join(REPO_ROOT, 'supabase', 'grants-snapshot.json')

/**
 * De enda definer-funktioner `anon` får köra. Varje rad har ett verifierat anropsställe
 * — står det inget skäl här hör funktionen inte hemma i listan.
 */
const ANON_TILLATNA = {
  check_rate_limit:
    'api/_utils/rate-limiter.js:19 och supabase/functions/_shared/rateLimit.ts:54 bygger ' +
    'sin klient med ANON-nyckeln, och båda faller tillbaka på en in-memory-limiter vid ' +
    'fel utan att larma. Utan anon degraderas rate-limiten tyst till per-instans-minne.',
  get_invitation_by_token:
    'Inbjudningslänken öppnas innan kontot finns (A10). Tokenmatchad, returnerar bara ' +
    'id/email/role/metadata.',
  get_shared_profile:
    'Publik delningslänk (A7). Validerar länken server-side och filtrerar profilen ' +
    'enligt deltagarens opt-in per fält.',
}

/** Tabeller som medvetet saknar RLS. Tom lista = alla tabeller ska ha RLS. */
const RLS_UNDANTAG = {}

/**
 * Fryst tak för hur många definer-funktioner `authenticated` får nå. Sänk när du betalar
 * av; höj bara med ett medvetet beslut, aldrig för att bli grön. En definer-funktion som
 * tar ett `p_user_id`-argument är en IDOR om den saknar `auth.uid()`-kontroll i kroppen —
 * det är precis vad A17 hittade — och taket är det enda som gör tillväxten synlig.
 *
 * Höjningar, med skäl:
 *   26 → 28  2026-09-01, A30: `grant_consent`/`withdraw_consent` fick tillbaka EXECUTE.
 *            De hade tappat den i A17 och var därmed trasiga i drift sedan 21 augusti.
 *   28 → 29  2026-09-01, KS3: `grant_consultant_consent`. Tar varken deltagar- eller
 *            konsulent-id som argument — båda härleds ur `auth.uid()` och
 *            `profiles.consultant_id` — så den kan strukturellt inte användas för
 *            någon annans räkning. Det är villkoret för att en definer-funktion ska
 *            få nå authenticated.
 */
const AUTH_TAK = 29

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const definerFunktioner = snapshot.functions.filter((f) => f.definer)
const fel = []

// ── Regel 1: anon-ytan ────────────────────────────────────────────────────────
for (const f of definerFunktioner.filter((f) => f.anon && !(f.name in ANON_TILLATNA))) {
  fel.push(
    `anon kan köra SECURITY DEFINER-funktionen ${f.signature}\n` +
      `    Åtgärd: REVOKE EXECUTE ... FROM PUBLIC (inte bara FROM anon) och GRANT explicit,\n` +
      `    eller lägg till funktionen i ANON_TILLATNA med ett verifierat anropsställe.`
  )
}

// ── Regel 2: RLS per tabell ───────────────────────────────────────────────────
for (const t of snapshot.tables.filter((t) => !t.rls && !(t.name in RLS_UNDANTAG))) {
  fel.push(`Tabellen ${t.name} saknar RLS (relrowsecurity = false)`)
}

/**
 * ── Regel 3: åt andra hållet ─────────────────────────────────────────────────
 * Varje `.rpc('...')` i webbläsarkoden måste peka på en funktion som `authenticated`
 * faktiskt kan köra.
 *
 * Regeln finns för att A17 den 4 augusti revokade EXECUTE från 15 definer-funktioner som
 * *då* hade noll anropare. Det var korrekt just då. Sjutton dagar senare byggdes
 * `consentApi.ts` som portalens enda väg till samtycken — den anropar två av de revokade
 * funktionerna (`grant_consent`, `withdraw_consent`), och ingen gav tillbaka rättigheten.
 * Följden i drift: från 2026-08-21 kunde ingen användare ge eller återkalla ett samtycke.
 * `consent_history` slutade växa 2026-07-23, alltså fyra veckor innan "den enda vägen in"
 * ens byggdes — och ingen grind kunde se det.
 *
 * En REVOKE är alltså aldrig klar: koden runt omkring rör sig. Bara den här riktningen
 * fångar det.
 *
 * Bara `client/src` skannas — den koden körs i webbläsaren som `authenticated`.
 * `client/api` och `supabase/functions` använder service role eller anon-nyckeln och
 * lyder andra regler.
 */
function samlaRpcAnrop(dir, traffar = new Map()) {
  for (const post of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, post.name)
    if (post.isDirectory()) {
      if (post.name === 'node_modules' || post.name === '__tests__') continue
      samlaRpcAnrop(full, traffar)
    } else if (/\.tsx?$/.test(post.name) && !/\.test\.tsx?$/.test(post.name)) {
      const kod = fs.readFileSync(full, 'utf8')
      for (const m of kod.matchAll(/\.rpc\(\s*['"`]([a-z0-9_]+)['"`]/gi)) {
        if (!traffar.has(m[1])) traffar.set(m[1], path.relative(REPO_ROOT, full))
      }
    }
  }
  return traffar
}

const rpcAnrop = samlaRpcAnrop(path.join(REPO_ROOT, 'client', 'src'))
for (const [namn, fil] of rpcAnrop) {
  const traffar = snapshot.functions.filter((f) => f.name === namn)
  if (traffar.length === 0) {
    fel.push(
      `${fil} anropar .rpc('${namn}') — funktionen finns inte i schemat\n` +
        `    (kan också betyda att snapshoten är gammal: npm run grants:refresh)`
    )
  } else if (!traffar.some((f) => f.authenticated)) {
    fel.push(
      `${fil} anropar .rpc('${namn}') men authenticated saknar EXECUTE\n` +
        `    Webbläsarens anrop kör som authenticated och får 42501 permission denied.\n` +
        `    Åtgärd: GRANT EXECUTE ON FUNCTION public.${namn}(...) TO authenticated;`
    )
  }
}

// ── Regel 4: taket för authenticated ──────────────────────────────────────────
const authAntal = definerFunktioner.filter((f) => f.authenticated).length
if (authAntal > AUTH_TAK) {
  fel.push(
    `${authAntal} definer-funktioner är nåbara för authenticated, mot taket ${AUTH_TAK}.\n` +
      `    Varje ny sådan funktion som tar ett användar-id som argument måste kontrollera\n` +
      `    auth.uid() i kroppen (se A17), annars är den en IDOR.`
  )
}

const alder = Math.floor((Date.now() - Date.parse(snapshot.generatedAt)) / 86400000)

if (fel.length > 0) {
  console.error(`\nlint:grants — ${fel.length} problem (snapshot ${alder} dygn gammal):\n`)
  for (const f of fel) console.error(`  ✗ ${f}`)
  console.error(`\n  Snapshoten uppdateras med: cd client && npm run grants:refresh\n`)
  process.exit(1)
}

console.log(
  `lint:grants: ${definerFunktioner.length} definer-funktioner ` +
    `(${Object.keys(ANON_TILLATNA).length} öppna för anon, alla motiverade; ` +
    `${authAntal} för authenticated, under taket ${AUTH_TAK}), ` +
    `${snapshot.tables.length} tabeller med RLS, ` +
    `${rpcAnrop.size} .rpc()-anrop i klientkoden nåbara. ` +
    `Snapshot ${alder} dygn gammal.`
)
