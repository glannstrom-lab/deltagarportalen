// Mejlmallarna för send-invite-email.
//
// Egen modul utan Deno- eller URL-importer så att den kan renderingstestas från
// vitest (client/src/test/inbjudan-mallar.test.ts) — index.ts anropar serve()
// vid import och går inte att ladda i ett test.
//
// 2026-09-24: ALLT som interpoleras eskaperas. Deltagarmallarna satte tidigare
// konsulentens namn, deltagarens förnamn och det personliga meddelandet rakt in
// i HTML:en ("de får bara konsulentens egen text"). Två följder:
//   1. Ett meddelande med `<`, `&` eller en rad som började med `<b` bröt eller
//      svalde text i mejlet — och radbrytningarna försvann helt, så ett
//      meddelande i tre stycken kom fram som en enda rad.
//   2. Konsulentens text kunde bära godtycklig HTML (länkar, formulär) i ett mejl
//      som är DKIM-signerat av jobin.se — en fiskeväg med vår avsändare.
// Meddelandet eskaperas och radbrytningar blir <br>.

export const escapeHtml = (s: string | null | undefined): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Konsulentens fritext → säker HTML med bevarade radbrytningar. */
export const meddelandeHtml = (s: string | null | undefined): string =>
  escapeHtml(String(s ?? '').replace(/\r\n?/g, '\n').trim()).replace(/\n/g, '<br>\n      ')

// =============================================================================
// E-MAIL-TEMPLATES
// =============================================================================
// DE1 (2026-09-12): knappen och huvudet bär sina färger INLINE, inte bara via
// <style>-blocket. Första riktiga mejlet via Resend kom fram till Gmail med en
// knapp vars text knappt syntes — klienten hade kastat/ignorerat klassreglerna
// och länken föll tillbaka på länkfärg mot pastellen. Inline-stil är det enda
// som alla mejlklienter respekterar; klasserna står kvar som förstärkning.
//
// Tre template-funktioner: STA-specifik, generell och företagskonto (AG6,
// 2026-09-13 — se avsnittet FÖRETAGSKONTO nedan). STA-mailet nämner
// arbetskonsulentens namn, Steg till arbete och samtycke direkt — så det inte
// ser ut som ett generiskt onboarding-mail.

export interface TemplateData {
  firstName: string
  consultantName: string
  consultantEmail?: string
  inviteUrl: string
  message?: string
  expiresAt: string
}

export const SHARED_STYLES = `
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
export const getStaInviteEmailTemplate = (data: TemplateData) => `
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
  <div class="header" style="padding:32px 30px;border-radius:12px 12px 0 0;background:#d8efe5;color:#14532d;">
    <div class="eyebrow">Steg till arbete</div>
    <h1>Hej ${escapeHtml(data.firstName || 'du')} — välkommen till Jobin</h1>
  </div>

  <div class="content">
    <p style="font-size: 16px;">
      Du har av arbetskonsulent <strong>${escapeHtml(data.consultantName)}</strong> blivit inbjuden
      till arbetssökarportalen <strong>jobin.se</strong> som är din digitala vägledare
      i Steg till arbete.
    </p>

    <p>
      Fortsätt här för att skapa ett konto och koppla ihop dig med din arbetskonsulent.
    </p>

    <center>
      <a href="${escapeHtml(data.inviteUrl)}" class="button" style="display:inline-block;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#16a34a;color:#ffffff;"><span style="color:#ffffff;">Skapa konto &amp; koppla ihop</span></a>
    </center>

    ${data.message ? `
    <div class="message-box">
      <strong>Personligt meddelande från ${escapeHtml(data.consultantName)}:</strong><br>
      ${meddelandeHtml(data.message)}
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

    <p class="expiry">Inbjudan är giltig till: ${escapeHtml(data.expiresAt)}</p>

    <p class="small">
      Om knappen inte fungerar, kopiera denna länk till din webbläsare:<br>
      <span class="fallback-link">${escapeHtml(data.inviteUrl)}</span>
    </p>
  </div>

  <div class="footer">
    <p>Har du frågor? Kontakta ${escapeHtml(data.consultantName)}${data.consultantEmail ? ` på <a href="mailto:${escapeHtml(data.consultantEmail)}" style="color: #15803d;">${escapeHtml(data.consultantEmail)}</a>` : ''}.</p>
    <p>&copy; ${new Date().getFullYear()} Jobin · jobin.se</p>
  </div>
</body>
</html>
`

// Generellt mail — för inbjudningar utan STA-program
export const getGenericInviteEmailTemplate = (data: TemplateData) => `
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
  <div class="header" style="padding:32px 30px;border-radius:12px 12px 0 0;background:#e0e7ff;color:#312e81;">
    <div class="eyebrow">Inbjudan</div>
    <h1>Hej ${escapeHtml(data.firstName || 'du')} — välkommen till Jobin</h1>
  </div>

  <div class="content">
    <p><strong>${escapeHtml(data.consultantName)}</strong> har bjudit in dig till Jobin — en plattform
    som hjälper dig att hitta vägen tillbaka till arbetsmarknaden.</p>

    ${data.message ? `
    <div class="message-box">
      <strong>Personligt meddelande:</strong><br>
      ${meddelandeHtml(data.message)}
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
      <a href="${escapeHtml(data.inviteUrl)}" class="button" style="display:inline-block;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#4f46e5;color:#ffffff;"><span style="color:#ffffff;">Skapa ditt konto</span></a>
    </center>

    <p class="expiry">Inbjudan är giltig till: ${escapeHtml(data.expiresAt)}</p>

    <p class="small">
      Om knappen inte fungerar, kopiera denna länk till din webbläsare:<br>
      <span class="fallback-link">${escapeHtml(data.inviteUrl)}</span>
    </p>
  </div>

  <div class="footer">
    <p>Har du frågor? Kontakta din handledare eller svara på detta email.</p>
    <p>&copy; ${new Date().getFullYear()} Jobin · jobin.se</p>
  </div>
</body>
</html>
`

// =============================================================================
// FÖRETAGSKONTO (AG6, 2026-09-13)
// =============================================================================
// Inbjudan till ett företag skapas av triggern employer_invitations_insert
// (20260913100000_ag6_foretagskonto.sql) som en rad i `invitations` med
// role 'USER', consultant_id NULL, invited_by = den som bjöd in och
// metadata { kind: 'arbetsgivare', employer_org_id, company_name, org_number,
// contact_name, first_name, existing_account, invited_by_name, invited_by_kind }.
//
// Två fall, avgjorda av metadata.existing_account:
//   · false → personen saknar konto: samma generateLink-flöde som deltagar-
//     inbjudan, knappen "Skapa ert konto". Medlemskapet i företagskontot
//     läggs av triggern employer_invitation_membership när profilen skapas.
//   · true  → personen har redan ett konto (triggern har redan lagt
//     medlemsraden och markerat inbjudan använd). INGEN generateLink — den
//     skulle skapa en pending-användare för en adress som redan finns.
//     Knappen "Logga in" pekar på /#/login.
//
// Mejlet säger vad kontot är — och EN mening om vad det inte är. Villkoren
// (terms.noScreening.*, AG4) säger samma sak med fler ord.

export interface EmployerTemplateData {
  firstName: string
  companyName: string
  invitedByName: string
  invitedByKind: 'konsulent' | 'foretag'
  existingAccount: boolean
  actionUrl: string
  expiresAt: string
}

// Företagsnamn och inbjudarnamn kommer från fritextfält (org-namn via
// Bolagsverket eller konsulentens tangentbord) och eskaperas som allt annat.

export const getEmployerInviteEmailTemplate = (data: EmployerTemplateData) => {
  const firstName = escapeHtml(data.firstName || 'du')
  const company = escapeHtml(data.companyName || 'Ert företag')
  const inviter = escapeHtml(data.invitedByName || '')
  const inviterText = data.invitedByKind === 'konsulent'
    ? `arbetskonsulent <strong>${inviter || 'på Jobin'}</strong>`
    : `din kollega <strong>${inviter || 'på företaget'}</strong>`
  const buttonText = data.existingAccount ? 'Logga in' : 'Skapa ert konto'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${company} — företagskonto på Jobin</title>
  <style>
    ${SHARED_STYLES}
    .header { background: #fde7d4; color: #7c2d12; }
    .button { background: #c2410c; color: #ffffff; }
    .button:hover { background: #9a3412; }
  </style>
</head>
<body>
  <div class="header" style="padding:32px 30px;border-radius:12px 12px 0 0;background:#fde7d4;color:#7c2d12;">
    <div class="eyebrow">Företagskonto</div>
    <h1>Hej ${firstName} — ${company} har fått ett företagskonto på Jobin</h1>
  </div>

  <div class="content">
    <p style="font-size: 16px;">
      Du har blivit inbjuden av ${inviterText} som kontaktperson för
      <strong>${company}</strong> på <strong>jobin.se</strong>.
    </p>

    <div class="info-list">
      <strong>Med företagskontot kan ni:</strong>
      <ul>
        <li>Ta emot förslag om praktik eller arbetsträning — en konsulent föreslår en namngiven person, efter att personen själv har godkänt vad som delas med er</li>
        <li>Registrera platser ni kan erbjuda</li>
        <li>Hålla kontakt med konsulenten om ett förslag eller en pågående placering</li>
      </ul>
    </div>

    <p>Det finns ingen sökfunktion bland personer — det är ett medvetet val.</p>

    ${data.existingAccount ? `
    <p>
      Du har redan ett konto på Jobin med den här e-postadressen. Logga in som
      vanligt, så finns företagskontot där.
    </p>
    ` : ''}

    <center>
      <a href="${escapeHtml(data.actionUrl)}" class="button" style="display:inline-block;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#c2410c;color:#ffffff;"><span style="color:#ffffff;">${buttonText}</span></a>
    </center>

    ${data.existingAccount ? '' : `
    <p class="expiry">Inbjudan är giltig till: ${escapeHtml(data.expiresAt)}</p>

    <p class="small">
      Om knappen inte fungerar, kopiera denna länk till din webbläsare:<br>
      <span class="fallback-link">${escapeHtml(data.actionUrl)}</span>
    </p>
    `}
  </div>

  <div class="footer">
    <p>Har du frågor? ${inviter ? `Kontakta ${inviter}.` : 'Svara på detta mejl.'}</p>
    <p>&copy; ${new Date().getFullYear()} Jobin · jobin.se</p>
  </div>
</body>
</html>
`
}
