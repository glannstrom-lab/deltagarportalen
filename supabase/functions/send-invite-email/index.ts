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

// Email template
const getInviteEmailTemplate = (data: {
  firstName: string
  consultantName: string
  inviteUrl: string
  message?: string
  expiresAt: string
  program?: string
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inbjudan till Jobin</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #4338ca; }
    .message-box { background: white; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center; }
    .expiry { color: #dc2626; font-weight: 600; }
    .program-tag { display: inline-block; background: #ede9fe; color: #5b21b6; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Välkommen till Jobin!</h1>
    ${data.program === 'steg_till_arbete' ? '<div class="program-tag" style="background: rgba(255,255,255,0.2); color: white;">Steg till arbete</div>' : ''}
  </div>

  <div class="content">
    <p>Hej ${data.firstName || 'du'}!</p>

    <p><strong>${data.consultantName}</strong> har bjudit in dig till Jobin${data.program === 'steg_till_arbete' ? ' för att delta i <strong>Steg till arbete</strong>' : ''}.</p>

    ${data.message ? `
    <div class="message-box">
      <strong>Personligt meddelande:</strong><br>
      ${data.message}
    </div>
    ` : ''}

    ${data.program === 'steg_till_arbete' ? `
    <p>När du skapar ditt konto kommer du att:</p>
    <ul>
      <li>Få tillgång till Steg till arbete-modulen direkt</li>
      <li>Se vilken information som delas med din konsulent</li>
      <li>Kunna säga upp kopplingen när du vill</li>
    </ul>
    ` : `
    <p>Med Jobin kan du:</p>
    <ul>
      <li>Bygga ett professionellt CV</li>
      <li>Upptäcka yrken som passar dig</li>
      <li>Söka jobb från Arbetsförmedlingen</li>
      <li>Få stöd i din jobbsökning</li>
    </ul>
    `}

    <center>
      <a href="${data.inviteUrl}" class="button">Skapa ditt konto</a>
    </center>

    <p class="expiry">Inbjudan är giltig till: ${data.expiresAt}</p>

    <p style="font-size: 14px; color: #6b7280;">
      Om knappen inte fungerar, kopiera denna länk till din webbläsare:<br>
      <a href="${data.inviteUrl}" style="color: #4f46e5;">${data.inviteUrl}</a>
    </p>
  </div>

  <div class="footer">
    <p>Har du frågor? Kontakta din handledare eller svara på detta email.</p>
    <p>&copy; ${new Date().getFullYear()} Jobin</p>
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
): Promise<ProcessResult> {
  // Hämta inbjudan
  const { data: invitation, error: inviteError } = await client
    .from('invitations')
    .select('*, invited_by:profiles!invited_by(first_name, last_name)')
    .eq('id', invitationId)
    .single()

  if (inviteError || !invitation) {
    return { invitationId, success: false, error: 'Invitation not found' }
  }

  const inviteUrl = `${siteUrl}/#/invite/${invitation.token}`
  const expiresAt = new Date(invitation.expires_at)
  const expiresAtFormatted = expiresAt.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const consultantName = invitation.invited_by
    ? `${invitation.invited_by.first_name || ''} ${invitation.invited_by.last_name || ''}`.trim()
    : 'Din handledare'

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

      const html = getInviteEmailTemplate({
        firstName: invitation.metadata?.first_name,
        consultantName,
        inviteUrl: actionLink,
        message: invitation.metadata?.message,
        expiresAt: expiresAtFormatted,
        program: invitation.metadata?.program,
      })

      const subject = invitation.metadata?.program === 'steg_till_arbete'
        ? 'Inbjudan till Steg till arbete · Jobin'
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
        processInvitation(supabaseClient, id, resendApiKey, emailFrom, siteUrl)
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
