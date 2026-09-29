/**
 * GA1: logiken för gallring-sopare, fri från Deno-/URL-importer så att den kan
 * provas med `deno test` utan nätverk. index.ts kopplar in Supabase och Blob.
 *
 * Regel: en köpost tas bort FÖRST när både Storage och Vercel Blob är städade.
 * Allt annat (Storage-fel, Blob-fel, Blob-token saknas, undantag) lämnar posten
 * kvar med räknat försök och felmeddelande, så nästa natt tar den igen och
 * ingenting glöms.
 */

import type { BucketCleanupResult } from '../delete-account/storageCleanup.ts'

export interface KoPost {
  user_id: string
  forsok: number
}

export interface KoLager {
  /** Äldst obehandlade först (senaste_forsok NULLS FIRST), högst `max` poster. */
  hamta(max: number): Promise<KoPost[]>
  tabort(userId: string): Promise<void>
  markeraFel(userId: string, forsok: number, fel: string): Promise<void>
}

export interface Stadare {
  storage(userId: string): Promise<BucketCleanupResult[]>
  blob(userId: string): Promise<{ ok: boolean; status: string }>
}

export interface SopResultat {
  hittade: number
  stadade: number
  misslyckade: number
  fel: { user_id: string; fel: string }[]
}

export async function sopaKo(ko: KoLager, stadare: Stadare, max: number): Promise<SopResultat> {
  const poster = await ko.hamta(max)
  const res: SopResultat = { hittade: poster.length, stadade: 0, misslyckade: 0, fel: [] }

  for (const p of poster) {
    const problem: string[] = []
    try {
      const s = await stadare.storage(p.user_id)
      for (const r of s) if (r.error) problem.push(`storage ${r.bucket}: ${r.error}`)
    } catch (e) {
      problem.push(`storage: ${e instanceof Error ? e.message : String(e)}`)
    }
    // Blob städas även om Storage föll — de är oberoende, och färre kvarglömda filer är bättre.
    try {
      const b = await stadare.blob(p.user_id)
      if (!b.ok) problem.push(`blob: ${b.status}`)
    } catch (e) {
      problem.push(`blob: ${e instanceof Error ? e.message : String(e)}`)
    }

    try {
      if (problem.length === 0) {
        await ko.tabort(p.user_id)
        res.stadade++
      } else {
        const fel = problem.join('; ').slice(0, 500)
        await ko.markeraFel(p.user_id, p.forsok + 1, fel)
        res.misslyckade++
        res.fel.push({ user_id: p.user_id, fel })
      }
    } catch (e) {
      // Kunde inte ens skriva kvittot: posten står kvar orörd, räknas som misslyckad.
      const fel = `kökvittering: ${e instanceof Error ? e.message : String(e)}`
      res.misslyckade++
      res.fel.push({ user_id: p.user_id, fel })
    }
  }
  return res
}
