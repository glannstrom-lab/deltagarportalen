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
import { handleCorsPreflightOrNull, createCorsResponse, validateOriginOrReject } from '../_shared/cors.ts'
// BL6 (2026-09-12): sanerad felrapport till Sentry — se _shared/sentry.ts
import { medFelrapport } from '../_shared/sentry.ts'
import { fetchMedTimeout, TIDSGRANS_TJANST_MS } from '../_shared/fetchMedTimeout.ts'
import { svensktDatum } from '../_shared/datum.ts'
import {
  getGenericInviteEmailTemplate,
  getEmployerInviteEmailTemplate,
} from './mallar.ts'

// Mallarna (deltagare, företagskonto) bor i mallar.ts — se motiveringen där.


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
  //
  // AG6: företagsinbjudningar har consultant_id NULL och bär inbjudaren i
  // invited_by — konsulent eller företagskollega, triggern sätter caller där.
  // `null !== callerId` är alltid sant, så villkoret faller på invited_by;
  // ingen av grenarna kräver att consultant_id är satt. En kollega som INTE
  // skapade inbjudan kan inte skicka om den — med flit, samma som för deltagare.
  if (
    !callerIsAdmin &&
    invitation.consultant_id !== callerId &&
    invitation.invited_by !== callerId
  ) {
    return { invitationId, success: false, error: 'Forbidden: not your invitation' }
  }

  const inviteUrl = `${siteUrl}/#/invite/${invitation.token}`
  // Svenskt dygn, inte runtimens UTC: `expires_at = now() + 7 days`, så en
  // inbjudan skapad 00–02 svensk tid fick tidigare ett datum en dag för tidigt.
  const expiresAtFormatted = svensktDatum(new Date(invitation.expires_at))

  const consultantName = invitation.inviter
    ? `${invitation.inviter.first_name || ''} ${invitation.inviter.last_name || ''}`.trim()
    : 'Din handledare'

  // AG6: företagsinbjudan. existing_account skrivs av triggern som boolean;
  // jämförs strikt så att ett saknat fält räknas som "nytt konto".
  const isEmployerInvite = invitation.metadata?.kind === 'arbetsgivare'
  const employerHasAccount = isEmployerInvite && invitation.metadata?.existing_account === true
  const companyName: string = invitation.metadata?.company_name || ''
  const invitedByName: string = invitation.metadata?.invited_by_name || consultantName
  const invitedByKind: 'konsulent' | 'foretag' =
    invitation.metadata?.invited_by_kind === 'foretag' ? 'foretag' : 'konsulent'

  // De användarmetadata som följer med generateLink/inviteUserByEmail. För
  // företag: first_name ur kontaktnamnet, last_name tomt (triggern delar inte
  // upp namnet), inget program och ingen konsulentkoppling — kontot ska bli
  // en vanlig USER som triggern employer_invitation_membership gör till medlem.
  const userMetadata = isEmployerInvite
    ? {
        first_name: invitation.metadata?.first_name,
        last_name: '',
        invitation_id: invitation.id,
        kind: 'arbetsgivare',
        employer_org_id: invitation.metadata?.employer_org_id,
        company_name: companyName,
      }
    : {
        first_name: invitation.metadata?.first_name,
        last_name: invitation.metadata?.last_name,
        consultant_name: consultantName,
        consultant_id: invitation.consultant_id,
        invitation_id: invitation.id,
        message: invitation.metadata?.message,
      }

  let emailErrorMessage: string | null = null

  if (resendApiKey) {
    // RESEND-LÄGE
    try {
      let actionLink: string
      if (employerHasAccount) {
        // Kontot finns: ingen generateLink (den skulle skapa en pending-
        // användare för en adress som redan har ett konto). Knappen är "Logga in".
        actionLink = `${siteUrl}/#/login`
      } else {
        const { data: linkData, error: linkError } = await client.auth.admin.generateLink({
          type: 'invite',
          email: invitation.email,
          options: {
            data: userMetadata,
            redirectTo: inviteUrl,
          },
        })

        if (linkError || !linkData) {
          throw new Error(linkError?.message ?? 'generateLink returned no data')
        }

        actionLink =
          (linkData as { properties?: { action_link?: string } })?.properties?.action_link ||
          inviteUrl
      }

      const html = isEmployerInvite
        ? getEmployerInviteEmailTemplate({
            firstName: invitation.metadata?.first_name,
            companyName,
            invitedByName,
            invitedByKind,
            existingAccount: employerHasAccount,
            actionUrl: actionLink,
            expiresAt: expiresAtFormatted,
          })
        : getGenericInviteEmailTemplate({
            firstName: invitation.metadata?.first_name,
            consultantName,
            consultantEmail: invitation.metadata?.consultant_email,
            inviteUrl: actionLink,
            message: invitation.metadata?.message,
            expiresAt: expiresAtFormatted,
          })

      const subject = isEmployerInvite
        ? `${companyName || 'Ert företag'} — företagskonto på Jobin`
        : 'Inbjudan till Jobin'

      const resendResponse = await fetchMedTimeout('https://api.resend.com/emails', {
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
      }, TIDSGRANS_TJANST_MS)

      if (!resendResponse.ok) {
        const errBody = await resendResponse.text().catch(() => 'unknown')
        throw new Error(`Resend ${resendResponse.status}: ${errBody}`)
      }
    } catch (err) {
      emailErrorMessage = err instanceof Error ? err.message : 'Unknown Resend error'
    }
  } else if (employerHasAccount) {
    // FALLBACK-LÄGE utan Resend: Supabase kan bara skicka ett invite-mejl,
    // och det går inte till en adress som redan har ett konto. Hellre ett
    // synligt fel än en rad märkt "skickad" utan mejl (DE2-lärdomen).
    emailErrorMessage =
      'Företagsinbjudan till ett befintligt konto kräver Resend (RESEND_API_KEY saknas). Personen är redan medlem och kan logga in.'
  } else {
    // FALLBACK-LÄGE: Supabase native invite
    const { error: inviteErr } = await client.auth.admin.inviteUserByEmail(
      invitation.email,
      {
        data: userMetadata,
        redirectTo: inviteUrl,
      },
    )
    if (inviteErr) emailErrorMessage = inviteErr.message
  }

  if (emailErrorMessage) {
    const { error: markeraFel } = await client
      .from('invitations')
      .update({
        email_sent: false,
        email_error: emailErrorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
    if (markeraFel) {
      console.error(`[send-invite-email] kunde inte spara mejlfelet på inbjudan ${invitationId}:`, markeraFel.message)
    }
    return { invitationId, success: false, to: invitation.email, error: emailErrorMessage }
  }

  // Mejlet ÄR skickat här. Går markeringen fel visar konsulentvyn "inte
  // skickad" och inbjudan riskerar att skickas igen — felet ska synas i loggen,
  // inte sväljas (supabase-js kastar inte, det returnerar `error`).
  const { error: markeraSkickad } = await client
    .from('invitations')
    .update({
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
  if (markeraSkickad) {
    console.error(`[send-invite-email] mejlet skickades men inbjudan ${invitationId} kunde inte markeras som skickad:`, markeraSkickad.message)
  }

  return { invitationId, success: true, to: invitation.email }
}

serve(medFelrapport('send-invite-email', async (req) => {
  const preflightResponse = handleCorsPreflightOrNull(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')

  // A29: origin måste avvisas HÄR — innan mejlet skickas eller databasen
  // skrivs. `createCorsResponse` gör samma kontroll, men bara när svaret
  // byggs, dvs efter att sidoeffekterna (Resend-anrop, invitations-update)
  // redan hunnit ske. En kontroll efter arbetet är ingen kontroll.
  const originRejection = validateOriginOrReject(req)
  if (originRejection) return originRejection

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

    // KM12 (8), 2026-09-12: medlemmar i en demoorganisation (organizations.is_demo)
    // får inte skicka mejl — demokontot delas öppet på B2B-sidan och ska aldrig
    // kunna nå en riktig inkorg. Kontrolleras med service role (RLS förbigås),
    // fail closed: går uppslaget fel skickas inget.
    const { data: demoMedlemskap, error: demoError } = await supabaseClient
      .from('organization_members')
      .select('org_id, organizations!inner(is_demo)')
      .eq('user_id', user.id)
    const arDemo =
      demoError != null ||
      (demoMedlemskap ?? []).some((m) => {
        const o = (m as { organizations?: { is_demo?: boolean } | { is_demo?: boolean }[] }).organizations
        const rader = Array.isArray(o) ? o : o ? [o] : []
        return rader.some((r) => r.is_demo === true)
      })
    if (arDemo) {
      return createCorsResponse(
        { error: 'Demokontot kan inte skicka inbjudningar. Personerna i demot är påhittade.' },
        403,
        origin,
      )
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
    const emailFrom = Deno.env.get('EMAIL_FROM')

    // DE2 (2026-09-08): EMAIL_FROM föll tidigare tillbaka på
    // `onboarding@resend.dev` — Resends sandlåda, som bara levererar till
    // kontoägaren. Inbjudan såg skickad ut och nådde aldrig deltagaren.
    // Saknas adressen medan Resend-nyckeln finns är det ett fel som ska
    // synas. Utan nyckel går fallback-läget (Supabase native invite) som
    // förut — det använder ingen avsändaradress.
    if (resendApiKey && !emailFrom) {
      console.error('[send-invite-email] EMAIL_FROM saknas i miljön — RESEND_API_KEY är satt men ingen avsändaradress. Sätt EMAIL_FROM (t.ex. "Jobin <noreply@jobin.se>") med `supabase secrets set`.')
      return createCorsResponse(
        { error: 'E-postavsändare saknas (EMAIL_FROM). Inbjudan skickades inte.' },
        500, origin,
      )
    }

    // DE2: reservvärdet var `http://localhost:5173` — en inbjudningslänk dit
    // är död för alla utom den som kör dev-servern. Systerfunktionerna
    // faller på jobin.se; här produktionsdomänen med www, som `jobin.se`
    // svarar 307 till.
    const siteUrl = (Deno.env.get('SITE_URL') || 'https://www.jobin.se').replace(/\/+$/, '')

    const results = await Promise.all(
      invitationIds.map((id) =>
        processInvitation(supabaseClient, id, resendApiKey, emailFrom ?? '', siteUrl, user.id, callerIsAdmin)
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
}))
