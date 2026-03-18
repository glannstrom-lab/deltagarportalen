// Edge Function: Skicka email-inbjudan till nya deltagare
// Anropas när en konsulent bjuder in en deltagare

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'

// Email template
const getInviteEmailTemplate = (data: {
  firstName: string
  consultantName: string
  inviteUrl: string
  message?: string
  expiresAt: string
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
  </style>
</head>
<body>
  <div class="header">
    <h1>Välkommen till Jobin!</h1>
  </div>

  <div class="content">
    <p>Hej ${data.firstName || 'du'}!</p>

    <p><strong>${data.consultantName}</strong> har bjudit in dig till Jobin - en plattform som hjälper dig att hitta vägen tillbaka till arbetsmarknaden.</p>

    ${data.message ? `
    <div class="message-box">
      <strong>Personligt meddelande:</strong><br>
      ${data.message}
    </div>
    ` : ''}

    <p>Med Jobin kan du:</p>
    <ul>
      <li>Bygga ett professionellt CV</li>
      <li>Upptäcka yrken som passar dig</li>
      <li>Söka jobb från Arbetsförmedlingen</li>
      <li>Få stöd i din jobbsökning</li>
    </ul>

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

serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightOrNull(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')

  try {
    // Verifiera JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createCorsResponse({ error: 'Missing authorization header' }, 401, origin)
    }

    // Skapa Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Verifiera användaren
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return createCorsResponse({ error: 'Invalid token' }, 401, origin)
    }

    // Parse request body
    const { invitationId } = await req.json()

    if (!invitationId) {
      return createCorsResponse({ error: 'Invitation ID required' }, 400, origin)
    }

    // Hämta inbjudan
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('invitations')
      .select('*, invited_by:profiles!invited_by(first_name, last_name)')
      .eq('id', invitationId)
      .single()

    if (inviteError || !invitation) {
      return createCorsResponse({ error: 'Invitation not found' }, 404, origin)
    }

    // Bygg inbjudnings-URL
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const inviteUrl = `${siteUrl}/#/invite/${invitation.token}`

    // Formatera utgångsdatum
    const expiresAt = new Date(invitation.expires_at)
    const expiresAtFormatted = expiresAt.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Hämta konsultens namn
    const consultantName = invitation.invited_by
      ? `${invitation.invited_by.first_name || ''} ${invitation.invited_by.last_name || ''}`.trim()
      : 'Din handledare'

    // Skapa email-innehåll
    const emailHtml = getInviteEmailTemplate({
      firstName: invitation.metadata?.first_name,
      consultantName,
      inviteUrl,
      message: invitation.metadata?.message,
      expiresAt: expiresAtFormatted
    })

    // Skicka email via Supabase
    const { error: emailError } = await supabaseClient.auth.admin.sendRawEmail({
      to: invitation.email,
      subject: 'Inbjudan till Jobin',
      html: emailHtml,
    })

    if (emailError) {
      console.error('Email error:', emailError)

      // Fallback: logga att email behöver skickas manuellt
      await supabaseClient
        .from('invitations')
        .update({
          email_sent: false,
          email_error: emailError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      return createCorsResponse({
        error: 'Could not send email automatically',
        details: emailError.message,
        fallback: 'Email logged for manual sending'
      }, 500, origin)
    }

    // Uppdatera inbjudan som skickad
    await supabaseClient
      .from('invitations')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    return createCorsResponse({
      success: true,
      message: 'Invitation email sent',
      to: invitation.email
    }, 200, origin)

  } catch (error) {
    console.error('Error:', error)
    return createCorsResponse({ error: 'Internal server error' }, 500, origin)
  }
})
