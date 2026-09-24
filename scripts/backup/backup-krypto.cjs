#!/usr/bin/env node
/**
 * Kryptering av databasbackupen — ren Node, inga beroenden.
 *
 * Används av .github/workflows/backup.yml. Dumpen strömmas från
 * `supabase db dump` via stdin och krypteras i minnet: klartexten rör
 * aldrig disken, varken i CI eller lokalt.
 *
 *   supabase db dump --linked | node backup-krypto.cjs kryptera > schema.sql.enc
 *   node backup-krypto.cjs dekryptera < schema.sql.enc > schema.sql
 *   node backup-krypto.cjs inventera < data.sql.enc      # tabeller + radantal, ingen data
 *
 * Lösenordet läses ur miljövariabeln BACKUP_LOSENORD (minst 32 tecken).
 *
 * Format: "JOBINBK1" | salt (16) | iv (12) | tagg (16) | chiffertext
 * AES-256-GCM med nyckel ur scrypt. GCM och inte CBC: en manipulerad eller
 * trasig fil faller vid dekrypteringen i stället för att ge SQL som körs
 * rakt in i databasen vid en återställning.
 *
 * Varje fil bär sitt eget salt och är självbeskrivande — ett byte av lösenord
 * gör gamla filer oläsbara med det nya, så spara det gamla tills de gallrats.
 */
'use strict'

const crypto = require('node:crypto')

const MAGI = Buffer.from('JOBINBK1', 'ascii')
const SALT_LEN = 16
const IV_LEN = 12
const TAGG_LEN = 16
const HUVUD_LEN = MAGI.length + SALT_LEN + IV_LEN + TAGG_LEN
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const MIN_LOSENORD = 32

function fel(meddelande) {
  process.stderr.write(`backup-krypto: ${meddelande}\n`)
  process.exit(1)
}

function losenord() {
  const l = process.env.BACKUP_LOSENORD
  if (!l) fel('BACKUP_LOSENORD saknas i miljön.')
  if (l.length < MIN_LOSENORD) {
    fel(`BACKUP_LOSENORD är ${l.length} tecken — minst ${MIN_LOSENORD} krävs.`)
  }
  return l
}

function nyckel(l, salt) {
  return crypto.scryptSync(l, salt, 32, SCRYPT)
}

function kryptera(klartext, l) {
  const salt = crypto.randomBytes(SALT_LEN)
  const iv = crypto.randomBytes(IV_LEN)
  const c = crypto.createCipheriv('aes-256-gcm', nyckel(l, salt), iv)
  const chiffer = Buffer.concat([c.update(klartext), c.final()])
  return Buffer.concat([MAGI, salt, iv, c.getAuthTag(), chiffer])
}

function dekryptera(fil, l) {
  if (fil.length < HUVUD_LEN || !fil.subarray(0, MAGI.length).equals(MAGI)) {
    throw new Error('inte en JOBINBK1-fil (fel format eller okrypterad).')
  }
  let o = MAGI.length
  const salt = fil.subarray(o, (o += SALT_LEN))
  const iv = fil.subarray(o, (o += IV_LEN))
  const tagg = fil.subarray(o, (o += TAGG_LEN))
  const d = crypto.createDecipheriv('aes-256-gcm', nyckel(l, salt), iv)
  d.setAuthTag(tagg)
  try {
    return Buffer.concat([d.update(fil.subarray(o)), d.final()])
  } catch {
    throw new Error('dekrypteringen föll — fel lösenord eller skadad fil.')
  }
}

/**
 * Räknar rader per COPY-block i en data-dump (`--use-copy`). Skriver bara ut
 * tabellnamn och antal — aldrig innehåll — så utdatan kan stå i en publik
 * CI-logg.
 */
function inventera(sql) {
  const rader = sql.split('\n')
  const tabeller = new Map()
  let aktuell = null
  for (const rad of rader) {
    if (aktuell) {
      if (rad === '\\.') aktuell = null
      else tabeller.set(aktuell, tabeller.get(aktuell) + 1)
      continue
    }
    const m = /^COPY\s+("?[\w]+"?\."?[\w]+"?)\s/.exec(rad)
    if (m) {
      aktuell = m[1].replace(/"/g, '')
      tabeller.set(aktuell, 0)
    }
  }
  return tabeller
}

function lasStdin() {
  return require('node:fs').readFileSync(0)
}

function main() {
  const lage = process.argv[2]
  if (!['kryptera', 'dekryptera', 'inventera'].includes(lage)) {
    fel('användning: backup-krypto.cjs kryptera|dekryptera|inventera  (stdin → stdout)')
  }
  const l = losenord()
  const indata = lasStdin()

  if (lage === 'kryptera') {
    if (indata.length === 0) fel('tom indata — dumpen gav ingenting, vägrar skriva en tom backup.')
    const ut = kryptera(indata, l)
    // Läs tillbaka i minnet innan något skrivs: en kopia som inte går att
    // dekryptera ska upptäckas nu, inte den dag den behövs.
    if (!dekryptera(ut, l).equals(indata)) fel('återläsningen gav inte samma bytes.')
    process.stdout.write(ut)
    process.stderr.write(`backup-krypto: ${indata.length} byte klartext → ${ut.length} byte krypterat, återläst OK\n`)
    return
  }

  let klartext
  try {
    klartext = dekryptera(indata, l)
  } catch (e) {
    fel(e.message)
  }

  if (lage === 'dekryptera') {
    process.stdout.write(klartext)
    return
  }

  const tabeller = inventera(klartext.toString('utf8'))
  let summa = 0
  for (const [namn, antal] of [...tabeller].sort()) {
    process.stdout.write(`${String(antal).padStart(8)}  ${namn}\n`)
    summa += antal
  }
  process.stdout.write(`${String(summa).padStart(8)}  rader i ${tabeller.size} tabeller\n`)
}

if (require.main === module) main()

module.exports = { kryptera, dekryptera, inventera, MAGI }
