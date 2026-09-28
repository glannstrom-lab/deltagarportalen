// Edge Function: Glömt lösenord (PUB-1, skarpt test 2026-09-28).
//
// Portalen hade ingen väg alls tillbaka för den som glömt sitt lösenord — ingen
// länk, ingen sida, inget anrop till resetPasswordForEmail.
//
// Varför inte resetPasswordForEmail? Klienten kör PKCE, så Supabases egen
// återställningslänk fungerar bara i SAMMA webbläsare som begärde den (koden
// verifieras mot en kod-verifierare i localStorage). Den som begär på datorn och
// öppnar mejlet i mobilen hade fått ett fel. Samma mönster som inbjudningarna
// (send-invite-email): generateLink med service role → engångskoden (token_hash)
// i länken → klienten loggar in med verifyOtp({ type: 'recovery' }) och väljer
// ett nytt lösenord med updateUser. Fungerar på vilken enhet som helst.
//
// Svaret är ALLTID detsamma ({ ok: true }) — oavsett om adressen har ett konto.
// Annars kan vem som helst ta reda på vilka adresser som finns i portalen.
// Anropas med anon-nyckeln (verify_jwt behålls på): supabase.functions.invoke
// från en utloggad klient skickar den.
//
// Rate limit: 10/timme per IP och 3/timme per adress (_shared/rateLimit.ts).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse, validateOriginOrReject } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'
import { getTrustedClientIp } from '../_shared/proxyGuard.ts'
import { fetchMedTimeout, TIDSGRANS_TJANST_MS } from '../_shared/fetchMedTimeout.ts'
import { medFelrapport } from '../_shared/sentry.ts'
import { AMNE, getAterstallEmailTemplate } from './mall.ts'

const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

serve(medFelrapport('losenord-aterstall', async (req: Request) => {
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
    checkRateLimit(ip, 'losenord-aterstall-ip'),
    checkRateLimit(epost, 'losenord-aterstall-epost'),
  ])
  if (!perIp.allowed) {
    return createCorsResponse({ error: 'För många försök. Vänta en stund och försök igen.' }, 429, origin)
  }
  // Per adress: svara som vanligt — ett 429 här skulle avslöja att adressen används.
  if (!perAdress.allowed) return ok()

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const emailFrom = Deno.env.get('EMAIL_FROM')
  if (!resendApiKey || !emailFrom) {
    console.error('[losenord-aterstall] RESEND_API_KEY eller EMAIL_FROM saknas')
    return createCorsResponse({ error: 'Återställningen är inte tillgänglig just nu. Kontakta support@jobin.se.' }, 503, origin)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  // generateLink(recovery) skapar INGET konto för en okänd adress — den svarar fel.
  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: epost })
  const hash = data?.properties?.hashed_token
  if (error || !hash) return ok()

  const siteUrl = (Deno.env.get('SITE_URL') || 'https://www.jobin.se').replace(/\/+$/, '')
  const actionUrl = `${siteUrl}/#/nytt-losenord?th=${encodeURIComponent(hash)}`

  const svar = await fetchMedTimeout('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: emailFrom, to: [epost], subject: AMNE, html: getAterstallEmailTemplate({ actionUrl }) }),
  }, TIDSGRANS_TJANST_MS)
  if (!svar.ok) {
    const text = await svar.text().catch(() => '')
    throw new Error(`Resend ${svar.status}: ${text.slice(0, 200)}`)
  }
  return ok()
}))
