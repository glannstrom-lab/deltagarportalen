// Edge Function: Skicka email-inbjudan till deltagare
// Anropas när en konsulent bjuder in en eller flera deltagare
//
// Två lägen:
//   - { invitationId: string }       → singel-inbjudan (bakåtkomp)
//   - { invitationIds: string[] }    → bulk-läge, parallella utskick
//
// Svar:
//   singel → { success, message, to }
//   bulk   → { results: [{ invitationId, success, to?, error? }] }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'

// =============================================================================
// E-MAIL-TEMPLATES
// =============================================================================
// Två separata template-funktioner: STA-specifik och generell. STA-mailet
// nämner arbetskonsulentens namn, Steg till arbete och samtycke direkt — så
// det inte ser ut som ett generiskt onboarding-mail.

interface TemplateData {
  firstName: string
  consultantName: string
  consultantEmail?: string
  inviteUrl: string
  message?: string
  expiresAt: string
}

const SHARED_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafaf9; }
  .header { padding: 32px 30px; border-radius: 12px 12px 0 0; }
  .header h1 { margin: 0; font-size: 24px; line-height: 1.3; }
  .header .eyebrow { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; opacity: 0.85; }
  .content { background: #ffffff; padding: 32px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e7e5e4; border-top: none; }
  .button { display: inline-block; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
  .message-box { background: #f5f5f4; border-left: 4px solid #57534e; padding: 14px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 14px; }
  .info-list { background: #f5f5f4; padding: 18px 20px; margin: 20px 0; border-radius: 8px; }
  .info-list strong { display: block; margin-bottom: 10px; color: #1c1917; }
  .info-list ul { margin: 0; padding-left: 20px; color: #44403c; font-size: 14px; }
  .info-list li { margin: 4px 0; }
  .footer { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e7e5e4; color: #78716c; font-size: 13px; text-align: center; }
  .expiry { color: #b45309; font-weight: 600; font-size: 14px; }
  .small { font-size: 13px; color: #78716c; }
  .fallback-link { font-size: 12px; color: #57534e; word-break: break-all; }
`

// STA-specifikt mail — för inbjudningar med metadata.program = 'steg_till_arbete'
const getStaInviteEmailTemplate = (data: TemplateData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inbjudan till Steg till arbete · Jobin</title>
  <style>
    ${SHARED_STYLES}
    .header { background: #d8efe5; color: #14532d; }
    .button { background: #16a34a; color: #ffffff; }
    .button:hover { background: #15803d; }
  </style>
</head>
<body>
  <div class="header">
    <div class="eyebrow">Steg till arbete</div>
    <h1>Hej ${data.firstName || 'du'} — välkommen till Jobin</h1>
  </div>

  <div class="content">
    <p style="font-size: 16px;">
      Du har av arbetskonsulent <strong>${data.consultantName}</strong> blivit inbjuden
      till arbetssökarportalen <strong>jobin.se</strong> som är din digitala vägledare
      i Steg till arbete.
    </p>

    <p>
      Fortsätt här för att skapa ett konto och koppla ihop dig med din arbetskonsulent.
    </p>

    <center>
      <a href="${data.inviteUrl}" class="button">Skapa konto &amp; koppla ihop</a>
    </center>

    ${data.message ? `
    <div class="message-box">
      <strong>Personligt meddelande från ${data.consultantName}:</strong><br>
      ${data.message}
    </div>
    ` : ''}

    <div class="info-list">
      <strong>När du har skapat ditt konto:</strong>
      <ul>
        <li>Steg till arbete är aktiverat direkt — du behöver inte göra något extra</li>
        <li>Du ser tydligt vilken information som delas med din konsulent</li>
        <li>Du kan när som helst säga upp kopplingen från "Min konsulent"-sidan</li>
      </ul>
    </div>

    <p class="small">
      Innan kontot skapas får du läsa och godkänna ett samtycke om vilken data
      din konsulent får tillgång till. Den rättsliga grunden är ditt samtycke
      (GDPR art. 6.1.a) och du kan återkalla det när du vill.
    </p>

    <p class="expiry">Inbjudan är giltig till: ${data.expiresAt}</p>

    <p class="small">
      Om knappen inte fungerar, kopiera denna länk till din webbläsare:<br>
      <span class="fallback-link">${data.inviteUrl}</span>
    </p>
  </div>

  <div class="footer">
    <p>Har du frågor? Kontakta ${data.consultantName}${data.consultantEmail ? ` på <a href="mailto:${data.consultantEmail}" style="color: #15803d;">${data.consultantEmail}</a>` : ''}.</p>
    <p>&copy; ${new Date().getFullYear()} Jobin · jobin.se</p>
  </div>
</body>
</html>
`

// Generellt mail — för inbjudningar utan STA-program
const getGenericInviteEmailTemplate = (data: TemplateData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inbjudan till Jobin</title>
  <style>
    ${SHARED_STYLES}
    .header { background: #e0e7ff; color: #312e81; }
    .button { background: #4f46e5; color: #ffffff; }
    .button:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="header">
    <div class="eyebrow">Inbjudan</div>
    <h1>Hej ${data.firstName || 'du'} — välkommen till Jobin</h1>
  </div>

  <div class="content">
    <p><strong>${data.consultantName}</strong> har bjudit in dig till Jobin — en plattform
    som hjälper dig att hitta vägen tillbaka till arbetsmarknaden.</p>

    ${data.message ? `
    <div class="message-box">
      <strong>Personligt meddelande:</strong><br>
      ${data.message}
    </div>
    ` : ''}

    <div class="info-list">
      <strong>Med Jobin kan du:</strong>
      <ul>
        <li>Bygga ett professionellt CV</li>
        <li>Upptäcka yrken som passar dig</li>
        <li>Söka jobb från Arbetsförmedlingen</li>
        <li>Få stöd i din jobbsökning</li>
      </ul>
    </div>

    <center>
      <a href="${data.inviteUrl}" class="button">Skapa ditt konto</a>
    </center>

    <p class="expiry">Inbjudan är giltig till: ${data.expiresAt}</p>

    <p class="small">
      Om knappen inte fungerar, kopiera denna länk till din webbläsare:<br>
      <span class="fallback-link">${data.inviteUrl}</span>
    </p>
  </div>

  <div class="footer">
    <p>Har du frågor? Kontakta din handledare eller svara på detta email.</p>
    <p>&copy; ${new Date().getFullYear()} Jobin · jobin.se</p>
  </div>
</body>
</html>
`

interface ProcessResult {
  invitationId: string
  success: boolean
  to?: string
  error?: string
}

async function processInvitation(
  client: SupabaseClient,
  invitationId: string,
  resendApiKey: string | undefined,
  emailFrom: string,
  siteUrl: string,
  callerId: string,
  callerIsAdmin: boolean,
): Promise<ProcessResult> {
  // Hämta inbjudan (inviter aliasad så råa invited_by-UUID:t bevaras för auktorisering)
  const { data: invitation, error: inviteError } = await client
    .from('invitations')
    .select('*, inviter:profiles!invited_by(first_name, last_name)')
    .eq('id', invitationId)
    .single()

  if (inviteError || !invitation) {
    return { invitationId, success: false, error: 'Invitation not found' }
  }

  // AUKTORISERING: anroparen måste äga inbjudan (vara dess konsulent eller
  // skapare) eller vara admin. Annars kan vilken inloggad användare som helst
  // trigga inbjudningsmail för godtyckliga invitation-IDs (service-role
  // förbigår RLS här).
  if (
    !callerIsAdmin &&
    invitation.consultant_id !== callerId &&
    invitation.invited_by !== callerId
  ) {
    return { invitationId, success: false, error: 'Forbidden: not your invitation' }
  }

  const inviteUrl = `${siteUrl}/#/invite/${invitation.token}`
  const expiresAt = new Date(invitation.expires_at)
  const expiresAtFormatted = expiresAt.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const consultantName = invitation.inviter
    ? `${invitation.inviter.first_name || ''} ${invitation.inviter.last_name || ''}`.trim()
    : 'Din handledare'

  const isStaInvite = invitation.metadata?.program === 'steg_till_arbete'
  const renderTemplate = isStaInvite ? getStaInviteEmailTemplate : getGenericInviteEmailTemplate

  let emailErrorMessage: string | null = null

  if (resendApiKey) {
    // RESEND-LÄGE
    try {
      const { data: linkData, error: linkError } = await client.auth.admin.generateLink({
        type: 'invite',
        email: invitation.email,
        options: {
          data: {
            first_name: invitation.metadata?.first_name,
            last_name: invitation.metadata?.last_name,
            consultant_name: consultantName,
            consultant_id: invitation.consultant_id,
            invitation_id: invitation.id,
            message: invitation.metadata?.message,
            program: invitation.metadata?.program,
            sta_enrollment_id: invitation.metadata?.sta_enrollment_id,
          },
          redirectTo: inviteUrl,
        },
      })

      if (linkError || !linkData) {
        throw new Error(linkError?.message ?? 'generateLink returned no data')
      }

      const actionLink =
        (linkData as { properties?: { action_link?: string } })?.properties?.action_link ||
        inviteUrl

      const html = renderTemplate({
        firstName: invitation.metadata?.first_name,
        consultantName,
        consultantEmail: invitation.metadata?.consultant_email,
        inviteUrl: actionLink,
        message: invitation.metadata?.message,
        expiresAt: expiresAtFormatted,
      })

      const subject = isStaInvite
        ? `Inbjudan till Steg till arbete från ${consultantName} · Jobin`
        : 'Inbjudan till Jobin'

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [invitation.email],
          subject,
          html,
        }),
      })

      if (!resendResponse.ok) {
        const errBody = await resendResponse.text().catch(() => 'unknown')
        throw new Error(`Resend ${resendResponse.status}: ${errBody}`)
      }
    } catch (err) {
      emailErrorMessage = err instanceof Error ? err.message : 'Unknown Resend error'
    }
  } else {
    // FALLBACK-LÄGE: Supabase native invite
    const { error: inviteErr } = await client.auth.admin.inviteUserByEmail(
      invitation.email,
      {
        data: {
          first_name: invitation.metadata?.first_name,
          last_name: invitation.metadata?.last_name,
          consultant_name: consultantName,
          consultant_id: invitation.consultant_id,
          invitation_id: invitation.id,
          message: invitation.metadata?.message,
          program: invitation.metadata?.program,
          sta_enrollment_id: invitation.metadata?.sta_enrollment_id,
        },
        redirectTo: inviteUrl,
      },
    )
    if (inviteErr) emailErrorMessage = inviteErr.message
  }

  if (emailErrorMessage) {
    await client
      .from('invitations')
      .update({
        email_sent: false,
        email_error: emailErrorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
    return { invitationId, success: false, to: invitation.email, error: emailErrorMessage }
  }

  await client
    .from('invitations')
    .update({
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitationId)

  return { invitationId, success: true, to: invitation.email }
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightOrNull(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createCorsResponse({ error: 'Missing authorization header' }, 401, origin)
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (userError || !user) {
      return createCorsResponse({ error: 'Invalid token' }, 401, origin)
    }

    // Hämta anroparens roll en gång — admins får skicka för valfri inbjudan,
    // övriga endast för sina egna (kontroll i processInvitation).
    const { data: callerProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const callerIsAdmin =
      callerProfile?.role === 'ADMIN' || callerProfile?.role === 'SUPERADMIN'

    const body = await req.json()
    const invitationIds: string[] = Array.isArray(body.invitationIds)
      ? body.invitationIds
      : body.invitationId
        ? [body.invitationId]
        : []

    if (invitationIds.length === 0) {
      return createCorsResponse({ error: 'Invitation ID(s) required' }, 400, origin)
    }

    if (invitationIds.length > 50) {
      return createCorsResponse({ error: 'Max 50 invitations per call' }, 400, origin)
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'Jobin <onboarding@resend.dev>'
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    const results = await Promise.all(
      invitationIds.map((id) =>
        processInvitation(supabaseClient, id, resendApiKey, emailFrom, siteUrl, user.id, callerIsAdmin)
          .catch((err) => ({
            invitationId: id,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          } as ProcessResult)),
      ),
    )

    // Singel-läge: behåll legacy-svarsform för bakåtkompatibilitet
    if (!Array.isArray(body.invitationIds) && body.invitationId) {
      const r = results[0]
      if (r.success) {
        return createCorsResponse({ success: true, message: 'Invitation email sent', to: r.to }, 200, origin)
      }
      return createCorsResponse(
        { error: 'Could not send email automatically', details: r.error, fallback: 'Email logged for manual sending' },
        500, origin,
      )
    }

    // Bulk-läge
    const sentCount = results.filter((r) => r.success).length
    return createCorsResponse(
      {
        success: sentCount > 0,
        sent: sentCount,
        total: results.length,
        results,
      },
      200,
      origin,
    )
  } catch (error) {
    console.error('Error:', error)
    return createCorsResponse({ error: 'Internal server error' }, 500, origin)
  }
})
