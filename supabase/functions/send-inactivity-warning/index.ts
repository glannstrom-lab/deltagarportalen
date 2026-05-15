// Edge Function: Skicka 18-månaders inaktivitetsvarning
//
// GDPR Art 5.1.e (storage limitation). När ett konto varit inaktivt i 18 månader
// får användaren en varning om att kontot raderas vid 24 månader om de inte loggar in.
//
// Anropas av cron-jobbet `retention-inactive-accounts` (se 20260515_retention_cron.sql)
// som lägger jobb i `email_queue`-tabellen. Den här edge function kan triggas via
// pg_cron eller manuellt: SELECT process_inactivity_emails();
//
// Mall finns nedan. Sändning sker via Supabase Auth-email (Resend backend) eller
// extern provider beroende på vad som är konfigurerat.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'

const getInactivityWarningTemplate = (data: {
  firstName: string
  lastSignInAt: string
  daysUntilDeletion: number
  loginUrl: string
  exportUrl: string
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ditt Jobin-konto raderas snart</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #fffbeb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 8px 20px 0; }
    .button-secondary { display: inline-block; background: #ffffff; color: #4f46e5; border: 1px solid #4f46e5; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .info-box { background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Vi saknar dig på Jobin</h1>
  </div>

  <div class="content">
    <p>Hej ${data.firstName || 'du'},</p>

    <p>Vi noterar att du inte loggat in på Jobin sedan ${data.lastSignInAt}.</p>

    <div class="info-box">
      <strong>Varför detta mejl?</strong><br>
      Enligt GDPR ska vi inte spara personuppgifter längre än nödvändigt. Om du inte loggar in inom <strong>${data.daysUntilDeletion} dagar</strong> kommer ditt konto och all data raderas automatiskt.
    </div>

    <p><strong>Vill du behålla ditt konto?</strong> Logga in nedan så fortsätter allt som vanligt:</p>

    <a href="${data.loginUrl}" class="button">Logga in på Jobin</a>

    <p style="margin-top: 32px;"><strong>Vill du spara din data först?</strong> Du kan exportera allt (CV, brev, profil) som JSON:</p>

    <a href="${data.exportUrl}" class="button-secondary">Exportera mina data</a>

    <p style="margin-top: 32px;"><strong>Vill du radera kontot direkt?</strong> Logga in och välj "Radera konto" i Inställningar.</p>

    <p>Du kan alltid kontakta oss om du har frågor: <a href="mailto:dpo@jobin.se">dpo@jobin.se</a></p>

    <p style="margin-top: 32px;">Vänliga hälsningar,<br><strong>Jobin-teamet</strong></p>

    <div class="footer">
      <p>Detta mejl skickas enligt GDPR Art 5.1.e (lagringsbegränsning). Det är inte marknadsföring och kan inte avregistreras.</p>
      <p>Jobin · <a href="https://jobin.se/privacy">Integritetspolicy</a> · <a href="mailto:dpo@jobin.se">DPO</a></p>
    </div>
  </div>
</body>
</html>
`

serve(async (req) => {
  const preflight = handleCorsPreflightOrNull(req)
  if (preflight) return preflight

  const origin = req.headers.get('Origin')

  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, 405, origin)
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

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('first_name')
          .eq('id', job.user_id)
          .single()

        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : new Date()
        const lastSignInStr = lastSignIn.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })
        const daysSince = Math.floor((Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24))
        const daysUntilDeletion = Math.max(0, 730 - daysSince) // 24 mån = 730d

        const html = getInactivityWarningTemplate({
          firstName: profile?.first_name || 'du',
          lastSignInAt: lastSignInStr,
          daysUntilDeletion,
          loginUrl: 'https://jobin.se/login',
          exportUrl: 'https://jobin.se/settings?tab=privacy',
        })

        // Skicka via Resend om RESEND_API_KEY finns, annars via Supabase Auth
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (resendKey) {
          const res = await fetch('https://api.resend.com/emails', {
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
          })
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

        // Markera som skickad
        await supabaseAdmin
          .from('email_queue')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', job.id)

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
      errors: errors.slice(0, 10),
    }, 200, origin)
  } catch (err) {
    console.error('[inactivity] Unexpected error:', err)
    return createCorsResponse({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, 500, origin)
  }
})
