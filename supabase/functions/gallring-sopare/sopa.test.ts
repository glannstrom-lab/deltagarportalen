/**
 * Kör: npx -y deno@2.9.6 test supabase/functions/gallring-sopare/sopa.test.ts
 */
import { sopaKo, type KoLager, type Stadare } from './sopa.ts'
import { cleanupUserBlobs } from '../_shared/blobCleanup.ts'

function lika(fick: unknown, vantat: unknown, ml = '') {
  if (JSON.stringify(fick) !== JSON.stringify(vantat)) {
    throw new Error(`${ml} fick ${JSON.stringify(fick)}, väntade ${JSON.stringify(vantat)}`)
  }
}

function kolager(poster: { user_id: string; forsok: number }[], kvittoFel = false) {
  const borttagna: string[] = []
  const fel: Record<string, { forsok: number; fel: string }> = {}
  const ko: KoLager = {
    hamta: (max) => Promise.resolve(poster.slice(0, max)),
    tabort: (id) => {
      if (kvittoFel) return Promise.reject(new Error('db nere'))
      borttagna.push(id)
      return Promise.resolve()
    },
    markeraFel: (id, forsok, f) => {
      fel[id] = { forsok, fel: f }
      return Promise.resolve()
    },
  }
  return { ko, borttagna, fel }
}

const okStorage = () => Promise.resolve([{ bucket: 'profile-documents', deleted: 1 }])
const okBlob = () => Promise.resolve({ ok: true, status: 'deleted 1' })

Deno.test('allt städat: raden tas bort', async () => {
  const k = kolager([{ user_id: 'a', forsok: 0 }])
  const st: Stadare = { storage: okStorage, blob: okBlob }
  const r = await sopaKo(k.ko, st, 25)
  lika(r, { hittade: 1, stadade: 1, misslyckade: 0, fel: [] })
  lika(k.borttagna, ['a'])
})

Deno.test('Storage-fel: raden står kvar, försök räknas upp, Blob städas ändå', async () => {
  const k = kolager([{ user_id: 'a', forsok: 2 }])
  let blobAnrop = 0
  const st: Stadare = {
    storage: () => Promise.resolve([{ bucket: 'profile-documents', deleted: 0, error: 'list(a) misslyckades: x' }]),
    blob: () => { blobAnrop++; return okBlob() },
  }
  const r = await sopaKo(k.ko, st, 25)
  lika(r.misslyckade, 1); lika(r.stadade, 0); lika(k.borttagna, []); lika(blobAnrop, 1)
  lika(k.fel['a'].forsok, 3)
  if (!k.fel['a'].fel.includes('storage profile-documents')) throw new Error('felet nämner inte storage')
})

Deno.test('Blob-fel (token saknas): raden står kvar även om Storage lyckades', async () => {
  const k = kolager([{ user_id: 'a', forsok: 0 }])
  const st: Stadare = { storage: okStorage, blob: () => Promise.resolve({ ok: false, status: 'skipped' }) }
  const r = await sopaKo(k.ko, st, 25)
  lika(r.misslyckade, 1); lika(k.borttagna, [])
  if (!k.fel['a'].fel.includes('blob: skipped')) throw new Error('felet nämner inte blob')
})

Deno.test('kastande städare: fångas, en trasig post stoppar inte nästa', async () => {
  const k = kolager([{ user_id: 'a', forsok: 0 }, { user_id: 'b', forsok: 0 }])
  const st: Stadare = {
    storage: (id) => id === 'a' ? Promise.reject(new Error('boom')) : okStorage(),
    blob: okBlob,
  }
  const r = await sopaKo(k.ko, st, 25)
  lika(r.stadade, 1); lika(r.misslyckade, 1); lika(k.borttagna, ['b'])
})

Deno.test('kvittering misslyckas: räknas som misslyckad, ingen krasch', async () => {
  const k = kolager([{ user_id: 'a', forsok: 0 }], true)
  const r = await sopaKo(k.ko, { storage: okStorage, blob: okBlob }, 25)
  lika(r.misslyckade, 1); lika(r.stadade, 0)
})

Deno.test('max begränsar antalet poster', async () => {
  const k = kolager([{ user_id: 'a', forsok: 0 }, { user_id: 'b', forsok: 0 }, { user_id: 'c', forsok: 0 }])
  const r = await sopaKo(k.ko, { storage: okStorage, blob: okBlob }, 2)
  lika(r.hittade, 2)
})

// --- Blob (delat med delete-account) ---
const svar = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

Deno.test('blob: token saknas är inte ok', async () => {
  lika(await cleanupUserBlobs(undefined, 'u'), { ok: false, status: 'skipped' })
})

Deno.test('blob: inga filer är ok', async () => {
  const f = () => Promise.resolve(svar(200, { blobs: [], hasMore: false }))
  lika(await cleanupUserBlobs('t', 'u', f), { ok: true, status: 'no blobs found' })
})

Deno.test('blob: sidbrytning följs och alla url:er raderas', async () => {
  const anrop: string[] = []
  let deleteBody = ''
  const f = (url: string, init: RequestInit) => {
    anrop.push(url)
    if (url.endsWith('/delete')) { deleteBody = String(init.body); return Promise.resolve(svar(200, {})) }
    return Promise.resolve(url.includes('cursor=c1')
      ? svar(200, { blobs: [{ url: 'u2' }], hasMore: false })
      : svar(200, { blobs: [{ url: 'u1' }], hasMore: true, cursor: 'c1' }))
  }
  lika(await cleanupUserBlobs('t', 'u', f), { ok: true, status: 'deleted 2' })
  lika(JSON.parse(deleteBody), { urls: ['u1', 'u2'] })
})

Deno.test('blob: listfel och raderingsfel är inte ok', async () => {
  lika((await cleanupUserBlobs('t', 'u', () => Promise.resolve(svar(500, {})))).ok, false)
  const f = (url: string) => Promise.resolve(url.endsWith('/delete') ? svar(403, {}) : svar(200, { blobs: [{ url: 'x' }] }))
  lika(await cleanupUserBlobs('t', 'u', f), { ok: false, status: 'failed (403)' })
})

Deno.test('blob: nätfel kastar inte', async () => {
  lika(await cleanupUserBlobs('t', 'u', () => Promise.reject(new Error('nät'))), { ok: false, status: 'error' })
})
