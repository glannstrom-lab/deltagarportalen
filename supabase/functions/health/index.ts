/**
 * Health Check Edge Function
 * Monitors service health for uptime tracking and alerting
 *
 * DE6 (2026-09-08). Funktionen har alltid varit skriven utan egen auth, för
 * övervakare — men plattformens JWT-grind svarade 401
 * (`UNAUTHORIZED_NO_AUTH_HEADER`, mätt mot prod) innan en rad här kördes.
 * En uptime-tjänst utan apikey såg alltså alltid "nere".
 * `[functions.health] verify_jwt = false` i supabase/config.toml öppnar den.
 *
 * Eftersom svaret då är publikt är det NEDSKALAT. Tidigare gick råa
 * felsträngar ur Postgres och Storage rakt ut, plus version, instansens
 * uptime och databaslatens. Nu: status, tidsstämpel och ok/error per
 * kontroll. Felen loggas i stället (console.error → Supabase-loggarna).
 *
 * `auth.getSession()`-kontrollen är borttagen: med service role och
 * `persistSession: false` finns ingen session att hämta, så den kunde
 * aldrig bli annat än "ok" — ett påhittat värde, inte en kontroll.
 *
 * HEAD stöds, eftersom många uptime-tjänster pingar så.
 *
 * Verifiera efter deploy:
 *   curl -sS -o /dev/null -w "%{http_code}" https://<ref>.supabase.co/functions/v1/health
 *   → 200 (utan apikey)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { medFelrapport } from '../_shared/sentry.ts'

type CheckStatus = 'ok' | 'error'

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: CheckStatus
    storage: CheckStatus
  }
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  // Övervakare anropar från vilken origin som helst
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD',
}

function svara(body: unknown, status: number, method: string): Response {
  return new Response(method === 'HEAD' ? null : JSON.stringify(body), { status, headers: HEADERS })
}

serve(medFelrapport('health', async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return svara({ error: 'Method not allowed' }, 405, req.method)
  }

  const timestamp = new Date().toISOString()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[health] SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY saknas')
    return svara({ status: 'unhealthy', timestamp }, 503, req.method)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const checks: HealthResponse['checks'] = { database: 'ok', storage: 'ok' }

  // Databas: en läsning med LIMIT 1. Svaret säger bara ok/error.
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    if (error) {
      console.error('[health] database:', error.message)
      checks.database = 'error'
    }
  } catch (e) {
    console.error('[health] database:', e instanceof Error ? e.message : e)
    checks.database = 'error'
  }

  // Storage: listBuckets med service role. Bucketnamnen lämnar aldrig funktionen.
  try {
    const { error } = await supabase.storage.listBuckets()
    if (error) {
      console.error('[health] storage:', error.message)
      checks.storage = 'error'
    }
  } catch (e) {
    console.error('[health] storage:', e instanceof Error ? e.message : e)
    checks.storage = 'error'
  }

  // Utan databas är portalen nere → 503. Utan storage är den försämrad → 200,
  // så en övervakare skiljer på "nere" och "haltar".
  const status: HealthResponse['status'] =
    checks.database === 'error' ? 'unhealthy'
    : checks.storage === 'error' ? 'degraded'
    : 'healthy'

  const body: HealthResponse = { status, timestamp, checks }
  return svara(body, status === 'unhealthy' ? 503 : 200, req.method)
}))
