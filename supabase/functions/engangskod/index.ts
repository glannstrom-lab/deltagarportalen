// Edge Function: Logga in med engångskod via e-post (KC6, 2026-10-21).
//
// Carriera loggar in med engångskod i stället för lösenord. Många i målgruppen
// tappar bort lösenord; en kod i mejlet är en tröskel mindre. Samma mönster som
// losenord-aterstall: generateLink med service role → mejl via Resend med en
// sifferkod (email_otp, 8 siffror i prod) och en länk med token_hash. Klienten loggar in med
// verifyOtp({ email, token, type: 'email' }) eller verifyOtp({ token_hash,
// type: 'magiclink' }). Fungerar på vilken enhet som helst, till skillnad från
// signInWithOtp, som med PKCE bara löser in länken i samma webbläsare.
//
// SKAPAR ALDRIG ETT KONTO. generateLink({ type: 'magiclink' }) registrerar en
// okänd adress som ny användare, så funktionen kontrollerar först att adressen
// har en profil. Konton skapas bara genom registreringen, där samtyckena ges.
//
// Svaret är ALLTID detsamma ({ ok: true }) — oavsett om adressen har ett konto.
// Tvåstegsinloggningen gäller fortfarande: sessionen blir aal1 och MfaGrind
// kräver koden från appen för den som slagit på tvåsteg.
//
// Rate limit: 10/timme per IP och 3/timme per adress (_shared/rateLimit.ts).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse, validateOriginOrReject } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'
import { getTrustedClientIp } from '../_shared/proxyGuard.ts'
import { fetchMedTimeout, TIDSGRANS_TJANST_MS } from '../_shared/fetchMedTimeout.ts'
import { medFelrapport } from '../_shared/sentry.ts'
import { AMNE, getEngangskodEmailTemplate } from './mall.ts'

const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

serve(medFelrapport('engangskod', async (req: Request) => {
  const preflight = handleCorsPreflightOrNull(req)
  if (preflight) return preflight
  const avvisad = validateOriginOrReject(req)
  if (avvisad) return avvisad

  const origin = req.headers.get('origin')
  const ok = () => createCorsResponse({ ok: true }, 200, origin)

  if (req.method !== 'POST') return createCorsResponse({ error: 'Method not allowed' }, 405, origin)

  let epost = ''
  try {
    const body = await req.json()
    epost = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    return createCorsResponse({ error: 'Ogiltig begäran' }, 400, origin)
  }
  if (!EPOST.test(epost) || epost.length > 254) {
    return createCorsResponse({ error: 'Skriv en giltig e-postadress' }, 400, origin)
  }

  const ip = getTrustedClientIp(req)
  const [perIp, perAdress] = await Promise.all([
    checkRateLimit(ip, 'engangskod-ip'),
    checkRateLimit(epost, 'engangskod-epost'),
  ])
  if (!perIp.allowed) {
    return createCorsResponse({ error: 'För många försök. Vänta en stund och försök igen.' }, 429, origin)
  }
  // Per adress: svara som vanligt — ett 429 här skulle avslöja att adressen används.
  if (!perAdress.allowed) return ok()

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const emailFrom = Deno.env.get('EMAIL_FROM')
  if (!resendApiKey || !emailFrom) {
    console.error('[engangskod] RESEND_API_KEY eller EMAIL_FROM saknas')
    return createCorsResponse({ error: 'Inloggning med kod är inte tillgänglig just nu. Logga in med lösenord.' }, 503, origin)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  // Finns kontot? profiles.email är lika med auth.users.email för alla konton
  // och lagras med gemener (mätt 2026-10-21: 156 av 156). Ett uppslagsfel
  // skickar inget mejl — hellre ingen kod än ett nytt konto.
  const { data: profil, error: profilFel } = await admin
    .from('profiles').select('id').eq('email', epost).maybeSingle()
  if (profilFel) throw new Error(`profiluppslag: ${profilFel.message}`)
  if (!profil) return ok()

  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: epost })
  const hash = data?.properties?.hashed_token
  const kod = data?.properties?.email_otp
  if (error || !hash || !kod) return ok()

  const siteUrl = (Deno.env.get('SITE_URL') || 'https://www.jobin.se').replace(/\/+$/, '')
  const actionUrl = `${siteUrl}/#/logga-in-med-kod?th=${encodeURIComponent(hash)}`

  const svar = await fetchMedTimeout('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: emailFrom, to: [epost], subject: AMNE, html: getEngangskodEmailTemplate({ kod, actionUrl }) }),
  }, TIDSGRANS_TJANST_MS)
  if (!svar.ok) {
    const text = await svar.text().catch(() => '')
    throw new Error(`Resend ${svar.status}: ${text.slice(0, 200)}`)
  }
  return ok()
}))
