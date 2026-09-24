// Edge Function: Skicka 18-månaders inaktivitetsvarning
//
// GDPR Art 5.1.e (storage limitation). När ett konto varit inaktivt i 18 månader
// får användaren en varning om att kontot raderas vid 24 månader om de inte loggar in.
//
// Raderna läggs i `email_queue` av pg_cron-jobbet `retention-inactive-accounts`
// (funktionen execute_inactive_account_retention). Den här edge-funktionen
// skickar dem — men OBS (mätt 2026-09-24): INGET cron-jobb anropar den. Det
// finns inget `net.http_post` i cron.job och ingen `process_inactivity_emails()`
// i databasen (kommentaren här påstod det tidigare). Kön fylls, raderingen vid
// 24 månader körs, men varningen vid 18 månader går aldrig ut förrän ett
// anropande jobb finns. Anropet kräver `x-cron-secret` (se _shared/cronAuth.ts).
//
// Mallen och beslutet om att skicka bor i mall.ts (testbara från vitest).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'
import { verifyCronSecret } from '../_shared/cronAuth.ts'
import { medFelrapport } from '../_shared/sentry.ts'
import { fetchMedTimeout, TIDSGRANS_TJANST_MS } from '../_shared/fetchMedTimeout.ts'
import { svensktDatum } from '../_shared/datum.ts'
import { beslutaVarning, getInactivityWarningTemplate } from './mall.ts'

serve(medFelrapport('send-inactivity-warning', async (req) => {
  const preflight = handleCorsPreflightOrNull(req)
  if (preflight) return preflight

  const origin = req.headers.get('Origin')

  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, 405, origin)
  }

  // A18: den här funktionen skickar mejl med service role. Utan grind är den en
  // oautentiserad utskickstrigger så fort `email_queue` börjar fyllas (A6).
  // Fail closed: saknas CRON_SECRET nekas anropet.
  const cronAuth = verifyCronSecret(req)
  if (!cronAuth.ok) {
    return createCorsResponse({ error: cronAuth.error }, cronAuth.status, origin)
  }

  try {
    // Service role för att kunna läsa email_queue + skicka via Supabase Auth
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Hämta pending jobs från email_queue
    const { data: pending, error: queueError } = await supabaseAdmin
      .from('email_queue')
      .select('id, user_id, scheduled_at')
      .eq('template', 'inactivity_warning_18m')
      .is('sent_at', null)
      .lte('scheduled_at', new Date().toISOString())
      .limit(100)

    if (queueError) {
      console.error('[inactivity] Queue read failed:', queueError)
      return createCorsResponse({ error: 'Queue read failed' }, 500, origin)
    }

    if (!pending || pending.length === 0) {
      return createCorsResponse({ processed: 0, message: 'No pending emails' }, 200, origin)
    }

    let sent = 0
    let failed = 0
    let skipped = 0
    const errors: string[] = []

    for (const job of pending) {
      try {
        // Hämta profil + email
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(job.user_id)
        if (!user?.email) {
          errors.push(`User ${job.user_id}: no email`)
          failed++
          continue
        }

        // maybeSingle(): profilraden garanteras normalt av triggern på
        // auth.users, men den här jobben-loopen ska inte krascha hela
        // körningen för en enskild rads lässtrul — logga och gå vidare med
        // ett fallback-namn i stället för att tyst anta att felet inte finns.
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('first_name')
          .eq('id', job.user_id)
          .maybeSingle()
        if (profileError) {
          console.error(`send-inactivity-warning: kunde inte läsa profil för ${job.user_id}`, profileError)
        }

        // Beslut + mall bor i mall.ts (testbara). Har personen loggat in sedan
        // raden köades är varningen inaktuell: raden tas bort, så att
        // retention-jobbet kan köa en ny om kontot blir inaktivt igen (det
        // köar bara konton som saknar rad för mallen).
        const beslut = beslutaVarning(user.last_sign_in_at)
        if (!beslut.skicka) {
          const { error: rensaFel } = await supabaseAdmin
            .from('email_queue')
            .delete()
            .eq('id', job.id)
          if (rensaFel) {
            console.error(`[inactivity] inaktuell rad ${job.id} (${beslut.skal}) kunde inte tas bort:`, rensaFel.message)
            errors.push(`Job ${job.id}: inaktuell (${beslut.skal}) men ej borttagen`)
          }
          skipped++
          continue
        }

        const lastSignInStr = svensktDatum(new Date(user.last_sign_in_at as string), { year: 'numeric', month: 'long' })

        const html = getInactivityWarningTemplate({
          firstName: profile?.first_name || 'du',
          lastSignInAt: lastSignInStr,
          daysUntilDeletion: beslut.daysUntilDeletion,
        })

        // Skicka via Resend om RESEND_API_KEY finns, annars via Supabase Auth
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (resendKey) {
          const res = await fetchMedTimeout('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Jobin <noreply@jobin.se>',
              to: user.email,
              subject: 'Ditt Jobin-konto raderas snart',
              html,
            }),
          }, TIDSGRANS_TJANST_MS)
          if (!res.ok) {
            const text = await res.text()
            errors.push(`Resend ${user.email}: ${text}`)
            failed++
            continue
          }
        } else {
          // Fallback: Supabase Auth-email räcker inte för custom html — logga och hoppa
          console.warn(`[inactivity] No email provider configured. Skipping ${user.email}`)
          errors.push(`No email provider — user ${user.email}`)
          failed++
          continue
        }

        // Markera som skickad. supabase-js kastar inte vid fel — utan
        // kontrollen blev raden kvar som osänd och personen fick samma
        // "ditt konto raderas snart" vid nästa körning.
        const { error: markeraFel } = await supabaseAdmin
          .from('email_queue')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', job.id)
        if (markeraFel) {
          console.error(`[inactivity] mejl skickat men jobb ${job.id} kunde inte markeras:`, markeraFel.message)
          errors.push(`Job ${job.id}: skickat men ej markerat — risk för dubbelutskick`)
        }

        sent++
      } catch (err) {
        errors.push(`Job ${job.id}: ${err instanceof Error ? err.message : String(err)}`)
        failed++
      }
    }

    return createCorsResponse({
      processed: pending.length,
      sent,
      failed,
      skipped,
      errors: errors.slice(0, 10),
    }, 200, origin)
  } catch (err) {
    console.error('[inactivity] Unexpected error:', err)
    return createCorsResponse({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, 500, origin)
  }
}))
