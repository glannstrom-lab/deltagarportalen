/**
 * Grind: `.single()` kräver EXAKT en rad — annars 406 PGRST116.
 *
 * VARFÖR: en läsgenomgång 2026-09-22 klassade 163 `.single()`-anrop i
 * portalen; 37 kunde strukturellt ge 0 rader (borttagen post, race vid
 * inloggning/registrering, återkallad konsulentkoppling, utgången
 * delningslänk). Flera av dem svalde felet helt (`error` destrukturerades
 * aldrig ur svaret) — ett äkta läsfel såg då identiskt ut som "0 rader",
 * och det farligaste fallet (`authStore.signIn`) satte tyst `profile: null`
 * för en användare appen just sagt "du är inloggad" till.
 *
 * Den här grinden läser källtexten (inte en körtidsmock) och hittar varje
 * `.single()`-anrop i `client/src`, `client/api` och `supabase/functions`.
 * Den känner tre lägen:
 *
 * 1. **Auto-godkänt** — kedjan innehåller `.insert(`, `.upsert(` eller
 *    `.update(`. En just skapad/uppdaterad rad returneras i samma anrop;
 *    PostgREST kan här strukturellt inte ge 0 rader utan att frågan redan
 *    har fel (fångas av den vanliga `if (error)`-kontrollen).
 * 2. **Hård regel — fäller alltid** — kedjan innehåller ett filter som gör
 *    0-träffar till det NORMALA utfallet: `.limit(`, `.gt(`, `.gte(`,
 *    `.lt(`, `.lte(`, `.order(` eller `.eq('status'`, eller `.ilike(`
 *    (fritextmatchning). Ett sådant `.single()` ska aldrig finnas —
 *    `.maybeSingle()` med explicit felkontroll, alltid.
 * 3. **Allt annat** — ett rent läsfilter (oftast `id`/`user_id`) som ÄNDÅ
 *    kan ge 0 rader (borttagen rad, återkallad koppling, race). Kräver en
 *    post i ALLOWLIST nedan, nyckel `fil::tabell`, med en motivering som
 *    går att verifiera — annars fäller testet.
 *
 * Mutationstest (körs manuellt, inte i CI): byt tillfälligt ett granskat
 * `.maybeSingle()` (t.ex. `careerApi.ts` `toggleAttending`) till `.single()`
 * med `.limit(1)` tillagt i kedjan → testet ska fälla på den hårda regeln.
 * Ta sedan bort ändringen. Se rapporten i uppdrag A för hur det verifierades.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, type Dirent } from 'node:fs'
import { join, resolve, relative } from 'node:path'

const REPO_ROOT = resolve(__dirname, '../../..')
const ROOTS: Array<{ dir: string; exts: string[] }> = [
  { dir: resolve(__dirname, '..'), exts: ['.ts', '.tsx'] }, // client/src
  { dir: resolve(__dirname, '../../api'), exts: ['.js'] }, // client/api
  { dir: resolve(REPO_ROOT, 'supabase/functions'), exts: ['.ts'] },
]
const EXCLUDE_PATH_PARTS = ['node_modules', `${join('archive', '')}`, '__tests__']

const HARD_FAIL_MARKERS = [
  '.limit(',
  '.gt(',
  '.gte(',
  '.lt(',
  '.lte(',
  '.order(',
  '.ilike(',
  ".eq('status'",
  '.eq("status"',
]
const AUTO_APPROVE_MARKERS = ['.insert(', '.upsert(', '.update(']

interface SingleCall {
  relPath: string
  line: number
  table: string
  chain: string
  hardFail: boolean
  autoApproved: boolean
}

function isExcluded(path: string): boolean {
  return EXCLUDE_PATH_PARTS.some((part) => path.includes(part))
}

function walk(dir: string, exts: string[], out: string[]): string[] {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true }) as Dirent[]
  } catch {
    return out
  }
  for (const entry of entries) {
    const p = join(dir, entry.name)
    if (isExcluded(p)) continue
    if (entry.isDirectory()) {
      walk(p, exts, out)
    } else if (
      exts.some((ext) => entry.name.endsWith(ext)) &&
      !entry.name.includes('.test.') &&
      !entry.name.includes('.spec.')
    ) {
      out.push(p)
    }
  }
  return out
}

/**
 * Blankar kommentarer (rad + block) men bevarar strängar orörda, så
 * `.from('tabell')` fortfarande går att läsa ut. Radbrytningar bevaras så
 * radnummer stämmer mot originalfilen.
 */
function stripComments(code: string): string {
  let out = ''
  let i = 0
  const n = code.length
  type State = 'code' | 'sl-comment' | 'ml-comment' | 'str-single' | 'str-double' | 'str-template'
  let state: State = 'code'
  const BACKSLASH = String.fromCharCode(92)
  while (i < n) {
    const c = code[i]
    const c2 = code[i + 1]
    if (state === 'code') {
      if (c === '/' && c2 === '/') {
        state = 'sl-comment'
        out += '  '
        i += 2
        continue
      }
      if (c === '/' && c2 === '*') {
        state = 'ml-comment'
        out += '  '
        i += 2
        continue
      }
      if (c === "'") {
        state = 'str-single'
        out += c
        i++
        continue
      }
      if (c === '"') {
        state = 'str-double'
        out += c
        i++
        continue
      }
      if (c === '`') {
        state = 'str-template'
        out += c
        i++
        continue
      }
      out += c
      i++
      continue
    }
    if (state === 'sl-comment') {
      if (c === '\n') {
        state = 'code'
        out += c
        i++
        continue
      }
      out += ' '
      i++
      continue
    }
    if (state === 'ml-comment') {
      if (c === '*' && c2 === '/') {
        state = 'code'
        out += '  '
        i += 2
        continue
      }
      out += c === '\n' ? '\n' : ' '
      i++
      continue
    }
    if (state === 'str-single' || state === 'str-double') {
      const q = state === 'str-single' ? "'" : '"'
      if (c === BACKSLASH) {
        out += c + (c2 ?? '')
        i += 2
        continue
      }
      if (c === q) {
        state = 'code'
        out += c
        i++
        continue
      }
      out += c
      i++
      continue
    }
    if (state === 'str-template') {
      if (c === BACKSLASH) {
        out += c + (c2 ?? '')
        i += 2
        continue
      }
      if (c === '`') {
        state = 'code'
        out += c
        i++
        continue
      }
      out += c
      i++
      continue
    }
  }
  return out
}

/** Löpande parentesdjup per teckenindex — används för att hitta statement-gränser. */
function depthArray(code: string): Int32Array {
  const depths = new Int32Array(code.length)
  let d = 0
  for (let i = 0; i < code.length; i++) {
    depths[i] = d
    const c = code[i]
    if (c === '(' || c === '[' || c === '{') d++
    else if (c === ')' || c === ']' || c === '}') d--
  }
  return depths
}

function lineOf(code: string, idx: number): number {
  let line = 1
  for (let i = 0; i < idx; i++) if (code[i] === '\n') line++
  return line
}

function analyzeFile(absPath: string): SingleCall[] {
  const raw = readFileSync(absPath, 'utf8')
  const clean = stripComments(raw)
  const depths = depthArray(clean)
  const results: SingleCall[] = []
  const re = /\.single\(\s*\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(clean))) {
    const pos = m.index
    const baseDepth = depths[pos]
    // Sök bakåt efter en statement-gräns (';', '{' eller '}') på SAMMA
    // parentesdjup som .single()-anropet — det avgränsar den här kedjan
    // från en tidigare, orelaterad sats utan att kräva en full parser.
    let start = 0
    for (let i = pos - 1; i >= 0; i--) {
      const c = clean[i]
      if ((c === ';' || c === '{' || c === '}') && depths[i] === baseDepth) {
        start = i + 1
        break
      }
    }
    const chain = clean.slice(start, pos + m[0].length)
    const fromMatches = chain.match(/\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g)
    let table = '?'
    if (fromMatches && fromMatches.length > 0) {
      const last = fromMatches[fromMatches.length - 1]
      const tm = last.match(/['"]([a-zA-Z0-9_]+)['"]/)
      table = tm ? tm[1] : '?'
    }
    const hardFail = HARD_FAIL_MARKERS.some((marker) => chain.includes(marker))
    const autoApproved = AUTO_APPROVE_MARKERS.some((marker) => chain.includes(marker))
    results.push({
      relPath: relative(REPO_ROOT, absPath).split('\\').join('/'),
      line: lineOf(clean, pos),
      table,
      chain: chain.replace(/\s+/g, ' ').trim().slice(-200),
      hardFail,
      autoApproved,
    })
  }
  return results
}

function collectAll(): SingleCall[] {
  let all: SingleCall[] = []
  for (const { dir, exts } of ROOTS) {
    let exists = true
    try {
      statSync(dir)
    } catch {
      exists = false
    }
    if (!exists) continue
    const files = walk(dir, exts, [])
    for (const f of files) all = all.concat(analyzeFile(f))
  }
  return all
}

/**
 * Allowlist för `.single()`-anrop som ÄR ett rent läsfilter (ingen
 * insert/upsert/update i kedjan) men som ändå är granskade och säkra.
 * Nyckel: `fil::tabell` — filsökväg relativ repo-roten (med `/`), sedan
 * tabellnamnet ur `.from('...')`.
 *
 * Lägg ALDRIG till en post bara för att få grinden grön. Varje motivering
 * ska gå att verifiera mot koden på raden: antingen (a) `error` läses och
 * hanteras explicit (PGRST116 särskiljs eller fail-closed), (b) raden är en
 * DB-garanterad singelrad (t.ex. `profiles` via `handle_new_user`-triggern,
 * verifierat i prod 2026-08-04: auth.users-räkning = profiles-räkning), eller
 * (c) anroparen redan hanterar `null`/fel korrekt och konsekvensen av ett
 * svalt fel är dokumenterat ofarlig.
 */
const ALLOWLIST: Record<string, string> = {
  // ---- Uppdrag A (2026-09-22): granskade och medvetet lämnade `.single()` ----
  'client/src/services/consultantService.ts::profiles':
    'KS10 (2026-08-31): .single() används MED FLIT för att göra RLS-luckan på profiles.UPDATE ' +
    'högljudd — en 0-rads-uppdatering (RLS filtrerar bort raden tyst) ska kasta PGRST116, inte ' +
    'se ut som en lyckad no-op. Rör inte till maybeSingle(). Redundant med auto-godkännandet ' +
    '(kedjan har .update(), se AUTO_APPROVE_MARKERS) men listad explicit per uppdraget.',

  'client/src/stores/authStore.ts::profiles':
    'initializeAuth (rad ~199): explicit `if (profileError && profileError.code !== \'PGRST116\')` ' +
    '— 0 rader tolereras uttryckligen (racet mellan session och profilrad), andra fel loggas. ' +
    'Detta ÄR mallen som signIn/signUp (fixade 2026-09-22) nu speglar.',

  // ---- profiles: rad garanterad av handle_new_user-triggern ----
  // Verifierat i prod 2026-08-04 (portal-review): auth.users-räkning = profiles-räkning,
  // 0 saknade, triggern aktiverad (tgenabled='O'). En inloggad användare har alltid exakt
  // en profils-rad. Kvarstående risk är ett transient läsfel, inte 0 rader.
  'client/src/services/userApi.ts::profiles':
    'profiles-raden garanteras av handle_new_user-triggern (verifierat i prod). getProfile/ ' +
    'getPreferences/getOnboardingProgress m.fl. — samma garanti på alla fyra träffar i filen.',
  'client/src/services/profileEnhancementsApi.ts::profiles':
    'profiles-raden garanteras av triggern (samma verifiering som userApi.ts). Fem träffar i ' +
    'filen (avatar-URL, ai_summary, export×2, aiSummaryApi.generate) — alla läser en garanterad rad.',
  'client/src/services/unifiedProfileApi.ts::profiles':
    'profiles-raden garanteras av triggern. getProfile (Promise.all, rad ~135) har dessutom ett ' +
    'extra skyddsnät nedanför (isNoRowsError); career_goals-läsningen inför en merge (rad ~341) ' +
    'litar på samma garanti som resten av filen.',
  'client/src/lib/supabase.ts::profiles':
    'getProfile-hjälparen returnerar { data, error } ORÖRT till anroparen — 0-radsrisken är ' +
    'medvetet flyttad till callern. Ingen aktiv anropare i client/src 2026-09-22 (grep verifierad); ' +
    'flagga om någon börjar använda helpern direkt.',
  'client/api/ai.js::profiles':
    'checkArt9Consent + checkAiEnabled: fail CLOSED redan — `if (error || !data) return { allowed: ' +
    'false, reason: \'lookup_failed\' }`. Ett läsfel nekar AI-anrop, precis den policyn CLAUDE.md ' +
    'kräver för art. 9-grindar. Två träffar i filen, samma mönster.',
  'supabase/functions/send-invite-email/index.ts::profiles':
    'callerIsAdmin-uppslaget: `callerProfile?.role === \'ADMIN\'` blir `false` på varje läsfel — ' +
    'fail-safe (färre rättigheter vid fel, aldrig fler). Ett svalt fel kan bara BEGRÄNSA vem som ' +
    'får skicka mejl, aldrig vidga det.',

  // ---- cvs: rad kan legitimt saknas (skapas lazy) ----
  'client/src/lib/supabase.ts::cvs':
    'getCV-hjälparen returnerar { data, error } ORÖRT till anroparen. Ingen aktiv anropare i ' +
    'client/src 2026-09-22 (grep verifierad).',

  // ---- Redan väl hanterade (explicit PGRST116/null-hantering) ----
  'client/src/services/applicationsApi.ts::saved_jobs':
    'getById: `if (error) { if (error.code === \'PGRST116\') return null; handleError(error) }` — ' +
    'skiljer redan explicit 0 rader (retur null) från ett äkta fel (kastas). Fungerar som ' +
    'maybeSingle() redan, via manuell felkodsparsning.',
  'client/src/services/coverLetterApi.ts::cover_letters':
    'getById: samma explicita PGRST116→null-mönster som applicationsApi.getById.',
  'client/src/services/supabaseApi.ts::spontaneous_companies':
    'getById: `if (error && error.code !== \'PGRST116\') handleError(error)` följt av ' +
    '`return data as SpontaneousCompany | null` — 0 rader ger uttryckligen null, inte ett kastat fel.',
  'client/src/services/unifiedProfileApi.ts::unified_profiles':
    'syncToCV: `if (readError) { if (isNoRowsError(readError)) return; ...throw readError }` — ' +
    'PGRST116 är ett dokumenterat legitimt no-op (D11, 2026-07-23), andra fel kastas.',
  'client/src/pages/consultant/ParticipantDetailPage.tsx::consultant_dashboard_participants':
    '`if (participantError || !participantData) { console.error(...); setError(t(...)) }` — ett ' +
    'synligt, översatt fel visas för konsulenten, sväljs inte.',
  'client/src/components/consent/DataSharingSettings.tsx::participant_data_sharing':
    '`if (sharingError && sharingError.code !== \'PGRST116\')` — samma explicita mönster, med ' +
    'kommentar som citerar den unika nyckeln (participant_id, consultant_id) som gör 0 rader normalt.',
  'supabase/functions/send-invite-email/index.ts::invitations':
    '`if (inviteError || !invitation) return { success: false, error: \'Invitation not found\' }` — ' +
    'ett tydligt, hanterat "hittades inte" till anroparen, inget sväljs.',

  // ---- Granskade 2026-09-22, INTE i uppdragets B-lista (medvetet lämnade) ----
  'client/src/services/cvApi.ts::cv_versions':
    'restoreVersion: `if (error) handleError(error)` — PGRST116 (borttagen version) blir ett ' +
    'kastat fel via handleError, som anroparen redan visar. Läge: samma risknivå som ' +
    'applicationsApi-mönstren INNAN de fixades, men inte i uppdragets lista — flaggas här, ej ' +
    'ändrad denna omgång.',
  'client/src/services/diaryApi.ts::diary_entries':
    'toggleFavorite (rad ~239): läser nuvarande state för en post som just renderats. `error` ' +
    'läses inte ut — ett transient fel ger `current: null` → `return false` (no-op, ingen ' +
    'krasch), samma svaga mönster som careerApi.toggleAttending hade FÖRE fixen 2026-09-22. ' +
    'Inte i uppdragets B-lista denna omgång — flaggas, ej ändrad.',
  'client/src/services/diaryApi.ts::weekly_goals':
    'toggleComplete: samma mönster och samma motivering som diary_entries ovan i samma fil.',
  'client/api/job-alerts.js::profiles':
    'checkUserAlerts + veckosammanfattningen: `profile?.email` läses med optional chaining — ett ' +
    'svalt läsfel degraderar till "inget mejl skickas" (rad ~721 har en explicit ' +
    '`if (!profile?.email) return false`), inte ett krasch eller ett felaktigt utskick. Inte i ' +
    'uppdragets B-lista denna omgång.',
}

describe('single-krav-en-rad: .single() kan bara användas där 0 rader strukturellt inte kan hända', () => {
  const alla = collectAll()

  it('hittade minst ett .single()-anrop att granska (grinden är inte av misstag tom)', () => {
    expect(alla.length).toBeGreaterThan(50)
  })

  it('inget .single()-anrop har ett filter som gör 0 rader till det normala utfallet', () => {
    const fall = alla.filter((c) => c.hardFail)
    const meddelande = fall
      .map(
        (c) =>
          `${c.relPath}:${c.line} (tabell "${c.table}") — kedjan innehåller ett filter ` +
          `(.limit/.gt/.gte/.lt/.lte/.order/.ilike/.eq('status')) som gör 0 träffar normalt. ` +
          `Byt till .maybeSingle() + explicit felkontroll.\n    …${c.chain}`
      )
      .join('\n\n')
    expect(fall, meddelande).toEqual([])
  })

  it('varje .single()-anrop som varken skapar/uppdaterar en rad eller matchar hårdregeln finns i ALLOWLIST', () => {
    const behoverAllowlist = alla.filter((c) => !c.autoApproved && !c.hardFail)
    const saknas = behoverAllowlist.filter((c) => !(`${c.relPath}::${c.table}` in ALLOWLIST))
    const meddelande = saknas
      .map(
        (c) =>
          `${c.relPath}:${c.line} — nyckel "${c.relPath}::${c.table}" saknas i ALLOWLIST. ` +
          `Antingen: (a) byt till .maybeSingle() + explicit felkontroll, eller (b) lägg till en ` +
          `verifierbar motivering i ALLOWLIST.\n    …${c.chain}`
      )
      .join('\n\n')
    expect(saknas, meddelande).toEqual([])
  })

  it('ALLOWLIST har inga döda poster (nyckel som inte längre matchar någon fil::tabell)', () => {
    const levandeNycklar = new Set(alla.map((c) => `${c.relPath}::${c.table}`))
    const dodaPoster = Object.keys(ALLOWLIST).filter((nyckel) => !levandeNycklar.has(nyckel))
    expect(
      dodaPoster,
      `Städa ALLOWLIST — dessa nycklar matchar ingen kvarvarande .single()-kedja:\n${dodaPoster.join('\n')}`
    ).toEqual([])
  })
})
