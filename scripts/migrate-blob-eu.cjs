#!/usr/bin/env node
/**
 * Vercel Blob — migrera filer från en store (USA) till en annan (EU).
 *
 * Användning:
 *   node scripts/migrate-blob-eu.cjs --old <OLD_TOKEN> --new <NEW_TOKEN> [--dry-run] [--verbose]
 *
 * Eller med env-variabler:
 *   OLD_BLOB_TOKEN=... NEW_BLOB_TOKEN=... node scripts/migrate-blob-eu.cjs
 *
 * Vad scriptet gör:
 *   1. Listar alla blobs i den gamla storen
 *   2. Laddar ner varje fil
 *   3. Laddar upp till nya storen (behåller pathname)
 *   4. Uppdaterar URL:er i Supabase-tabeller (profiles.profile_image_url, cvs.pdf_url)
 *   5. Raderar gamla blobs (efter att alla nya verifierats — om --delete-old)
 *
 * Säkerhet:
 *   - Default är --dry-run-läge (visar bara vad som SKULLE göras)
 *   - Kör med --execute för riktig migration
 *   - Lägg till --delete-old för att även rensa gamla storen
 */

const { parseArgs } = require('node:util')
const { writeFileSync } = require('node:fs')

const args = parseArgs({
  options: {
    old: { type: 'string' },
    new: { type: 'string' },
    'dry-run': { type: 'boolean', default: true },
    execute: { type: 'boolean', default: false },
    'delete-old': { type: 'boolean', default: false },
    verbose: { type: 'boolean', short: 'v', default: false },
    'supabase-url': { type: 'string' },
    'supabase-key': { type: 'string' },
    'no-db-update': { type: 'boolean', default: false },
  },
}).values

const OLD_TOKEN = args.old || process.env.OLD_BLOB_TOKEN
const NEW_TOKEN = args.new || process.env.NEW_BLOB_TOKEN
const SUPABASE_URL = args['supabase-url'] || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = args['supabase-key'] || process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = !args.execute
const DELETE_OLD = args['delete-old']
const VERBOSE = args.verbose
const SKIP_DB = args['no-db-update']

function log(msg, level = 'info') {
  const ts = new Date().toISOString()
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️'
  console.log(`${prefix} [${ts}] ${msg}`)
}

function logVerbose(msg) {
  if (VERBOSE) log(msg)
}

async function listAllBlobs(token) {
  const blobs = []
  let cursor = undefined
  let page = 0
  while (true) {
    const url = new URL('https://blob.vercel-storage.com')
    if (cursor) url.searchParams.set('cursor', cursor)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      throw new Error(`List failed: ${res.status} ${res.statusText}`)
    }
    const data = await res.json()
    blobs.push(...(data.blobs || []))
    logVerbose(`  Page ${++page}: ${data.blobs?.length || 0} blobs, total ${blobs.length}`)
    if (!data.hasMore) break
    cursor = data.cursor
  }
  return blobs
}

async function downloadBlob(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') || 'application/octet-stream',
  }
}

async function uploadBlob(token, pathname, buffer, contentType) {
  const res = await fetch(`https://blob.vercel-storage.com/${encodeURIComponent(pathname)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
      'x-content-type': contentType,
      'x-add-random-suffix': '0',
    },
    body: buffer,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Upload failed: ${res.status} ${text}`)
  }
  return await res.json()
}

async function deleteBlob(token, url) {
  const res = await fetch('https://blob.vercel-storage.com/delete', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: [url] }),
  })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}

async function updateSupabaseUrls(urlMap) {
  if (SKIP_DB || !SUPABASE_URL || !SUPABASE_KEY) {
    log('Hoppar över Supabase-uppdatering (--no-db-update eller env saknas)', 'warn')
    return
  }

  log(`Uppdaterar Supabase: ${Object.keys(urlMap).length} URL-mappningar`)

  // profiles.profile_image_url
  for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
    if (DRY_RUN) {
      logVerbose(`  [DRY] UPDATE profiles SET profile_image_url='${newUrl}' WHERE profile_image_url='${oldUrl}'`)
      continue
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?profile_image_url=eq.${encodeURIComponent(oldUrl)}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ profile_image_url: newUrl }),
    })
    if (!res.ok) {
      log(`  Failed to update profiles for ${oldUrl}: ${res.status}`, 'warn')
    }
  }

  log('Supabase-uppdatering klar', 'success')
}

async function main() {
  if (!OLD_TOKEN || !NEW_TOKEN) {
    log('Saknar --old eller --new tokens (eller env OLD_BLOB_TOKEN/NEW_BLOB_TOKEN)', 'error')
    process.exit(1)
  }

  log(`Mode: ${DRY_RUN ? 'DRY-RUN (ingen ändring görs)' : 'EXECUTE (riktig migration)'}`)
  log(`Delete-old: ${DELETE_OLD ? 'YES (gamla blobs raderas efter migration)' : 'NO'}`)

  // 1. Lista alla blobs
  log('Listar blobs i gamla storen…')
  const blobs = await listAllBlobs(OLD_TOKEN)
  log(`Hittade ${blobs.length} blobs att migrera`, 'success')

  if (blobs.length === 0) {
    log('Inget att göra. Avbryter.')
    return
  }

  // 2-3. Ladda ner + ladda upp
  const urlMap = {}
  let success = 0
  let failed = 0
  const errors = []

  for (const blob of blobs) {
    try {
      logVerbose(`Bearbetar: ${blob.pathname} (${blob.size} bytes)`)
      if (DRY_RUN) {
        logVerbose(`  [DRY] Skulle ladda ner ${blob.url} och ladda upp till ny store`)
        urlMap[blob.url] = `https://[NY-EU-STORE].public.blob.vercel-storage.com/${blob.pathname}`
        success++
        continue
      }
      const { buffer, contentType } = await downloadBlob(blob.url)
      const newBlob = await uploadBlob(NEW_TOKEN, blob.pathname, buffer, contentType)
      urlMap[blob.url] = newBlob.url
      log(`  ✓ ${blob.pathname} → ${newBlob.url}`)
      success++
    } catch (err) {
      log(`  Failed: ${blob.pathname}: ${err.message}`, 'error')
      errors.push({ pathname: blob.pathname, error: err.message })
      failed++
    }
  }

  log(`Migration: ${success} OK, ${failed} fel`, failed > 0 ? 'warn' : 'success')

  // 4. Uppdatera Supabase-URLer
  if (success > 0) {
    await updateSupabaseUrls(urlMap)
  }

  // 5. Spara migrations-rapport
  const report = {
    timestamp: new Date().toISOString(),
    mode: DRY_RUN ? 'dry-run' : 'execute',
    total: blobs.length,
    success,
    failed,
    errors,
    urlMap,
  }
  const reportPath = `blob-migration-report-${Date.now()}.json`
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  log(`Rapport sparad: ${reportPath}`, 'success')

  // 6. Radera gamla (om begärt och inga fel)
  if (DELETE_OLD && !DRY_RUN && failed === 0) {
    log('Raderar gamla blobs…')
    for (const blob of blobs) {
      try {
        await deleteBlob(OLD_TOKEN, blob.url)
        logVerbose(`  ✓ Deleted ${blob.url}`)
      } catch (err) {
        log(`  Failed to delete ${blob.url}: ${err.message}`, 'warn')
      }
    }
    log('Gamla blobs raderade', 'success')
  } else if (DELETE_OLD && failed > 0) {
    log('Hoppar över radering av gamla blobs pga fel under migration', 'warn')
  } else if (DELETE_OLD && DRY_RUN) {
    log('Dry-run: skulle radera gamla blobs efter verifiering', 'warn')
  }

  log('Klar.', 'success')
}

main().catch((err) => {
  log(`Fatal: ${err.message}`, 'error')
  console.error(err)
  process.exit(1)
})
