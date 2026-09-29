/**
 * Edge Function: gallring-sopare (GA1, 2026-09-29)
 *
 * Tömmer public.storage_gallring_ko: uid:n vars konton raderats av gallrings-
 * cronen (execute_inactive_account_retention / execute_scheduled_account_deletions).
 * Cronen kan bara radera raderna i databasen — filerna i Supabase Storage och
 * Vercel Blob ligger kvar tills den här funktionen städat dem, med SAMMA logik
 * som den manuella art. 17-vägen (delete-account/storageCleanup.ts och
 * _shared/blobCleanup.ts).
 *
 * ÅTKOMST: bara schemaläggaren. verify_jwt = false i config.toml (GitHub Actions
 * har ingen användar-JWT), i stället kräver funktionen CRON_SECRET via
 * _shared/cronAuth.ts — fail closed (503 om hemligheten saknas). Anropas med
 * headern `x-cron-secret`. Se .github/workflows/gallring-sopare.yml.
 *
 * Svar: { hittade, stadade, misslyckade, fel[] }. HTTP 200 även om enstaka poster
 * misslyckas (posterna står kvar och tas om); workflowen läser `misslyckade`.
 * HTTP 503 om BLOB_READ_WRITE_TOKEN saknas — utan den kan Blob inte städas och
 * ingen post får kvitteras.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'
import { verifyCronSecret } from '../_shared/cronAuth.ts'
import { medFelrapport } from '../_shared/sentry.ts'
import { cleanupUserBlobs } from '../_shared/blobCleanup.ts'
import { cleanupUserStorage } from '../delete-account/storageCleanup.ts'
import { sopaKo, type KoLager } from './sopa.ts'

/** Tak per körning: varje uid kostar några få anrop; resten tas nästa natt. */
const MAX_PER_KORNING = 25

serve(medFelrapport('gallring-sopare', async (req) => {
  const preflight = handleCorsPreflightOrNull(req)
  if (preflight) return preflight
  const origin = req.headers.get('Origin')

  if (req.method !== 'POST') return createCorsResponse({ error: 'Method not allowed' }, 405, origin)

  const auth = verifyCronSecret(req)
  if (!auth.ok) return createCorsResponse({ error: auth.error }, auth.status, origin)

  const blobToken = Deno.env.get('BLOB_READ_WRITE_TOKEN')
  if (!blobToken) {
    console.error('[gallring-sopare] BLOB_READ_WRITE_TOKEN saknas — kan inte städa Blob, kvitterar inget')
    return createCorsResponse({ error: 'BLOB_READ_WRITE_TOKEN saknas' }, 503, origin)
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    )

    const ko: KoLager = {
      async hamta(max) {
        const { data, error } = await admin
          .from('storage_gallring_ko')
          .select('user_id, forsok')
          .order('senaste_forsok', { ascending: true, nullsFirst: true })
          .order('queued_at', { ascending: true })
          .limit(max)
        if (error) throw new Error(`kön kunde inte läsas: ${error.message}`)
        return data ?? []
      },
      async tabort(userId) {
        const { error } = await admin.from('storage_gallring_ko').delete().eq('user_id', userId)
        if (error) throw new Error(error.message)
      },
      async markeraFel(userId, forsok, fel) {
        const { error } = await admin
          .from('storage_gallring_ko')
          .update({ forsok, senaste_fel: fel, senaste_forsok: new Date().toISOString() })
          .eq('user_id', userId)
        if (error) throw new Error(error.message)
      },
    }

    const resultat = await sopaKo(
      ko,
      {
        storage: (uid) => cleanupUserStorage(admin.storage, uid),
        blob: (uid) => cleanupUserBlobs(blobToken, uid),
      },
      MAX_PER_KORNING,
    )

    console.log(`[gallring-sopare] hittade ${resultat.hittade}, städade ${resultat.stadade}, misslyckade ${resultat.misslyckade}`)
    return createCorsResponse(resultat, 200, origin)
  } catch (error) {
    console.error('[gallring-sopare] Unexpected error:', error)
    return createCorsResponse({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500, origin)
  }
}))
