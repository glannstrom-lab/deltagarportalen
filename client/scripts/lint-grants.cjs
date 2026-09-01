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
 */
const AUTH_TAK = 26

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const fel = []

const anonOppna = snapshot.definerFunctions.filter((f) => f.anon && !(f.name in ANON_TILLATNA))
for (const f of anonOppna) {
  fel.push(
    `anon kan köra SECURITY DEFINER-funktionen ${f.signature}\n` +
      `    Åtgärd: REVOKE EXECUTE ... FROM PUBLIC (inte bara FROM anon) och GRANT explicit,\n` +
      `    eller lägg till funktionen i ANON_TILLATNA med ett verifierat anropsställe.`
  )
}

const utanRls = snapshot.tables.filter((t) => !t.rls && !(t.name in RLS_UNDANTAG))
for (const t of utanRls) {
  fel.push(`Tabellen ${t.name} saknar RLS (relrowsecurity = false)`)
}

const authAntal = snapshot.definerFunctions.filter((f) => f.authenticated).length
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
  `lint:grants: ${snapshot.definerFunctions.length} definer-funktioner ` +
    `(${Object.keys(ANON_TILLATNA).length} öppna för anon, alla motiverade; ` +
    `${authAntal} för authenticated, under taket ${AUTH_TAK}), ` +
    `${snapshot.tables.length} tabeller med RLS. Snapshot ${alder} dygn gammal.`
)
