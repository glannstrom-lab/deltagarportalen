/**
 * Edge Function: superadmin-visa-som (2026-09-27)
 *
 * Låter SUPERADMIN se portalen som ett DEMO- eller TESTKONTO — för demonstration
 * för kunder och för att kontrollera vad varje roll ser. Aldrig riktiga användare.
 *
 * Tillåtna konton avgörs HÄR, inte i klienten:
 *   - medlemmar i en organisation med is_demo = true (t.ex. demo@jobin.se)
 *   - deltagare kopplade till en sådan medlem (Demokommunens fem fiktiva)
 *   - adresser på @example.com eller @jobin.test (fiktiva per definition)
 *
 * { action: 'lista' }            → kontona, grupperade av klienten
 * { action: 'oppna', userId }    → token_hash för supabase.auth.verifyOtp
 *                                  (type 'magiclink'); engångs, går ut efter 1 h
 *
 * Varje öppning skrivs till audit_logs (action 'superadmin_visa_som').
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse, validateOriginOrReject } from '../_shared/cors.ts'
import { medFelrapport } from '../_shared/sentry.ts'

const FIKTIV_DOMAN = /@(example\.com|jobin\.test)$/i

type Konto = {
  id: string
  email: string
  namn: string | null
  roll: string | null
  organisation: string | null
  orgTyp: string | null
  orgRoll: string | null
  grupp: 'demo' | 'test' | 'ovrigt'
}

serve(medFelrapport('superadmin-visa-som', async (req) => {
  const preflight = handleCorsPreflightOrNull(req)
  if (preflight) return preflight
  const origin = req.headers.get('Origin')
  const avvisad = validateOriginOrReject(req)
  if (avvisad) return avvisad
  if (req.method !== 'POST') return createCorsResponse({ error: 'Method not allowed' }, 405, origin)

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!token) return createCorsResponse({ error: 'Missing authorization header' }, 401, origin)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )

  const { data: { user }, error: userFel } = await admin.auth.getUser(token)
  if (userFel || !user) return createCorsResponse({ error: 'Invalid or expired token' }, 401, origin)

  // Fail closed: bara SUPERADMIN, läst ur profilen (role eller roles).
  const { data: jag, error: jagFel } = await admin
    .from('profiles').select('role, roles').eq('id', user.id).maybeSingle()
  const roller: string[] = [jag?.role, ...((jag?.roles as string[] | null) ?? [])].filter(Boolean) as string[]
  if (jagFel || !roller.includes('SUPERADMIN')) {
    return createCorsResponse({ error: 'Endast superadmin' }, 403, origin)
  }

  let body: { action?: string; userId?: string } = {}
  try { body = await req.json() } catch { /* tom kropp = fel nedan */ }

  const konton = await tillatnaKonton(admin)
  if (konton instanceof Error) return createCorsResponse({ error: konton.message }, 500, origin)

  if (body.action === 'lista') {
    return createCorsResponse({ konton }, 200, origin)
  }

  if (body.action === 'oppna') {
    const mal = konton.find((k) => k.id === body.userId)
    if (!mal) return createCorsResponse({ error: 'Kontot är inget demo- eller testkonto' }, 403, origin)

    const { data: lank, error: lankFel } = await admin.auth.admin.generateLink({ type: 'magiclink', email: mal.email })
    const tokenHash = (lank as { properties?: { hashed_token?: string } } | null)?.properties?.hashed_token
    if (lankFel || !tokenHash) return createCorsResponse({ error: 'Kunde inte skapa inloggning' }, 500, origin)

    const { error: loggFel } = await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'superadmin_visa_som',
      resource_type: 'profile',
      resource_id: mal.id,
      new_value: { email: mal.email, grupp: mal.grupp },
    })
    // Ingen spårbarhet = ingen inloggning.
    if (loggFel) return createCorsResponse({ error: 'Kunde inte logga öppningen' }, 500, origin)

    return createCorsResponse({ tokenHash, email: mal.email, landning: landning(mal) }, 200, origin)
  }

  return createCorsResponse({ error: 'Okänd action' }, 400, origin)
}))

function landning(k: Konto): string {
  if (k.orgRoll === 'arbetsgivare') return '/foretag'
  if (k.roll === 'CONSULTANT' || k.roll === 'ADMIN') return '/consultant'
  return '/'
}

// deno-lint-ignore no-explicit-any
async function tillatnaKonton(admin: any): Promise<Konto[] | Error> {
  const { data: demoMedlemmar, error: e1 } = await admin
    .from('organization_members')
    .select('user_id, role, organizations!inner(name, kind, is_demo)')
    .eq('organizations.is_demo', true)
  if (e1) return new Error('Kunde inte läsa demoorganisationerna')

  const medlemInfo = new Map<string, { organisation: string; orgTyp: string; orgRoll: string }>()
  for (const m of demoMedlemmar ?? []) {
    medlemInfo.set(m.user_id, { organisation: m.organizations.name, orgTyp: m.organizations.kind, orgRoll: m.role })
  }

  const konsulentIds = [...medlemInfo.keys()]
  const kopplade = new Map<string, string>()
  if (konsulentIds.length > 0) {
    const { data: cp, error: e2 } = await admin
      .from('consultant_participants').select('participant_id, consultant_id').in('consultant_id', konsulentIds)
    if (e2) return new Error('Kunde inte läsa demodeltagarna')
    for (const r of cp ?? []) kopplade.set(r.participant_id, medlemInfo.get(r.consultant_id)?.organisation ?? '')
  }

  const demoMedlemIds = new Set(medlemInfo.keys())
  const ids = [...new Set([...medlemInfo.keys(), ...kopplade.keys()])]
  const { data: profiler, error: e3 } = await admin
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .or(`email.ilike.%@example.com,email.ilike.%@jobin.test${ids.length ? `,id.in.(${ids.join(',')})` : ''}`)
  if (e3) return new Error('Kunde inte läsa profilerna')

  // Testkontonas egna organisationer (t.ex. km-konsulent i Testkommun) — bara för etiketten.
  const ovrigaIds = (profiler ?? []).map((p: { id: string }) => p.id).filter((id: string) => !medlemInfo.has(id))
  if (ovrigaIds.length > 0) {
    const { data: ovriga } = await admin
      .from('organization_members').select('user_id, role, organizations(name, kind)').in('user_id', ovrigaIds)
    for (const m of ovriga ?? []) {
      if (m.organizations) medlemInfo.set(m.user_id, { organisation: m.organizations.name, orgTyp: m.organizations.kind, orgRoll: m.role })
    }
  }

  const konton: Konto[] = []
  for (const p of profiler ?? []) {
    if (!p.email) continue
    const medlem = medlemInfo.get(p.id)
    const deltagarOrg = kopplade.get(p.id)
    const iDemo = demoMedlemIds.has(p.id) || kopplade.has(p.id)
    if (!iDemo && !FIKTIV_DOMAN.test(p.email)) continue
    konton.push({
      id: p.id,
      email: p.email,
      namn: [p.first_name, p.last_name].filter(Boolean).join(' ') || null,
      roll: p.role ?? null,
      organisation: medlem?.organisation ?? deltagarOrg ?? null,
      orgTyp: medlem?.orgTyp ?? null,
      orgRoll: medlem?.orgRoll ?? null,
      grupp: iDemo ? 'demo' : /@jobin\.test$/i.test(p.email) ? 'test' : 'ovrigt',
    })
  }
  const ordning = { demo: 0, test: 1, ovrigt: 2 }
  return konton.sort((a, b) => ordning[a.grupp] - ordning[b.grupp] || a.email.localeCompare(b.email))
}
