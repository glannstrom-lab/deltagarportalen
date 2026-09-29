/**
 * GA1 (2026-09-29): radera en användares filer i Vercel Blob (prefix `user-<uid>/`).
 *
 * Flyttad ur delete-account/index.ts så att gallring-sopare kan göra EXAKT samma
 * sak. Beteendet och statussträngarna är oförändrade, med ett tillägg: listningen
 * följer nu `cursor`/`hasMore` (Blob returnerar max 1000 per sida — en användare
 * med fler hade tidigare fått en ofullständig radering utan att det syntes).
 *
 * Kastar aldrig. `ok` är sant först när listningen lyckats OCH alla funna blobbar
 * raderats (eller inga fanns) — `skipped` (token saknas) är ALDRIG ok: en sopare
 * får inte kvittera en kö-post för något som inte gjorts.
 */

import { fetchMedTimeout, TIDSGRANS_TJANST_MS } from './fetchMedTimeout.ts'

export interface BlobCleanupResult {
  ok: boolean
  /** Samma strängar som delete-account alltid loggat: 'skipped', 'no blobs found', 'deleted N', 'failed (S)', ... */
  status: string
}

export type BlobFetch = (url: string, init: RequestInit, ms: number) => Promise<Response>

const SIDOR_MAX = 50 // skydd mot en cursor som aldrig tar slut

export async function cleanupUserBlobs(
  token: string | undefined,
  userId: string,
  fetcher: BlobFetch = fetchMedTimeout,
): Promise<BlobCleanupResult> {
  if (!token) return { ok: false, status: 'skipped' }
  try {
    const urls: string[] = []
    let cursor: string | undefined
    for (let sida = 0; sida < SIDOR_MAX; sida++) {
      const q = `prefix=user-${userId}/${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
      const list = await fetcher(
        `https://blob.vercel-storage.com?${q}`,
        { headers: { Authorization: `Bearer ${token}` } },
        TIDSGRANS_TJANST_MS,
      )
      if (!list.ok) return { ok: false, status: `list failed (${list.status})` }
      const body = await list.json()
      const blobs = Array.isArray(body?.blobs) ? body.blobs : []
      for (const b of blobs) urls.push((b as { url: string }).url)
      if (body?.hasMore && body?.cursor) cursor = body.cursor
      else { cursor = undefined; break }
    }
    if (cursor) return { ok: false, status: 'list incomplete (too many pages)' }
    if (urls.length === 0) return { ok: true, status: 'no blobs found' }

    const del = await fetcher(
      'https://blob.vercel-storage.com/delete',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      },
      TIDSGRANS_TJANST_MS,
    )
    return del.ok
      ? { ok: true, status: `deleted ${urls.length}` }
      : { ok: false, status: `failed (${del.status})` }
  } catch (err) {
    console.error('[blobCleanup] error:', err)
    return { ok: false, status: 'error' }
  }
}
