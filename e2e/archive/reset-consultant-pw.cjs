/**
 * Engångsskript: nollställ testkonsulentens lösenord via Supabase Admin API
 * inför lokal e2e-verifiering. Läser SUPABASE_SERVICE_ROLE_KEY ur
 * client/.env.production.local och skriver E2E_CONS_* till .env.test.local.
 * Inga hemligheter hårdkodas eller loggas.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const root = path.join(__dirname, '..')
const prodEnv = fs.readFileSync(path.join(root, 'client', '.env.production.local'), 'utf8')
const get = (name, src) => {
  const m = src.match(new RegExp(`^${name}="?([^"\\r\\n]+)"?`, 'm'))
  return m ? m[1] : null
}
const SERVICE_KEY = get('SUPABASE_SERVICE_ROLE_KEY', prodEnv)
const SUPABASE_URL = get('VITE_SUPABASE_URL', prodEnv) || get('VITE_SUPABASE_URL', fs.readFileSync(path.join(root, 'client', '.env'), 'utf8'))
if (!SERVICE_KEY || !SUPABASE_URL) { console.error('Hittar inte service key/url'); process.exit(2) }

const EMAIL = 'claude-playwright-consultant@jobin.test'
const NEW_PW = crypto.randomBytes(18).toString('base64url')

async function main() {
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
  // Hitta user-id via admin users-listning med e-postfilter
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1&filter=${encodeURIComponent(EMAIL)}`, { headers })
  if (!res.ok) { console.error('List users failed:', res.status, await res.text()); process.exit(1) }
  const body = await res.json()
  const user = (body.users || []).find(u => u.email === EMAIL)
  if (!user) { console.error('Testkonsulenten hittades inte:', EMAIL); process.exit(1) }

  const upd = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ password: NEW_PW }),
  })
  if (!upd.ok) { console.error('Password update failed:', upd.status, await upd.text()); process.exit(1) }

  // Spara i .env.test.local (git-ignorerad)
  const envPath = path.join(root, '.env.test.local')
  let envContent = fs.readFileSync(envPath, 'utf8')
  envContent = envContent.replace(/^E2E_CONS_EMAIL=.*\r?\n?/m, '').replace(/^E2E_CONS_PASSWORD=.*\r?\n?/m, '')
  if (!envContent.endsWith('\n')) envContent += '\n'
  envContent += `E2E_CONS_EMAIL=${EMAIL}\nE2E_CONS_PASSWORD=${NEW_PW}\n`
  fs.writeFileSync(envPath, envContent)
  console.log('OK — lösenord nollställt och sparat i .env.test.local')
}
main().catch(e => { console.error(e); process.exit(1) })
