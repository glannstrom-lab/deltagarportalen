// Mejlmallen och beslutet "ska varningen gå ut?" för send-inactivity-warning.
//
// Egen modul utan Deno- eller URL-importer så att den kan testas från vitest
// (client/src/test/inaktivitetsvarning-mall.test.ts) — index.ts anropar serve()
// vid import och går inte att ladda i ett test.
//
// Två fel rättade 2026-09-24:
//   1. Länkarna saknade `#`. Portalen kör HashRouter, så `https://jobin.se/login`
//      landar på startsidan — inte på inloggningen. Exportlänken pekade dessutom
//      på `?tab=privacy`, men Inställningar läser `?section=` (Settings.tsx), så
//      även med `#` hade den öppnat profilfliken. Och `jobin.se` svarar 307 till
//      www; länkarna går direkt dit.
//   2. Ett konto som loggat in EFTER att raden köades fick ändå "du har inte
//      loggat in sedan …" — med ett datum från förra veckan och "inom 725
//      dagar". Varningen ska bara gå till den som fortfarande är inaktiv.

export const APP_URL = 'https://www.jobin.se'
export const LOGIN_URL = `${APP_URL}/#/login`
// Dataexporten ("Ladda ner mina uppgifter") ligger under Integritet i Inställningar.
export const EXPORT_URL = `${APP_URL}/#/settings?section=privacy`
export const PRIVACY_URL = `${APP_URL}/#/privacy`

/** Varningen gäller konton som varit inaktiva minst så här länge (samma som cron-jobbet). */
export const VARNING_EFTER_MANADER = 18
/** Kontot raderas efter så här många dagar utan inloggning (24 mån ≈ 730 d). */
export const RADERING_EFTER_DAGAR = 730

const DAG_MS = 24 * 60 * 60 * 1000

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type Beslut =
  | { skicka: true; daysUntilDeletion: number }
  | { skicka: false; skal: 'aktiv_igen' | 'aldrig_inloggad' }

/**
 * Avgör om varningen ska skickas. `nu` är injicerbar för test.
 *
 * - Aldrig inloggad: retention-jobbet rör inte sådana konton (last_sign_in_at
 *   IS NULL), så en varning om radering vore osann.
 * - Inloggad efter gränsen: personen är aktiv igen — raden är inaktuell.
 */
export function beslutaVarning(lastSignInAt: string | null | undefined, nu: Date = new Date()): Beslut {
  if (!lastSignInAt) return { skicka: false, skal: 'aldrig_inloggad' }
  const senast = new Date(lastSignInAt)
  if (Number.isNaN(senast.getTime())) return { skicka: false, skal: 'aldrig_inloggad' }

  const grans = new Date(nu)
  grans.setMonth(grans.getMonth() - VARNING_EFTER_MANADER)
  if (senast.getTime() > grans.getTime()) return { skicka: false, skal: 'aktiv_igen' }

  const dagarSedan = Math.floor((nu.getTime() - senast.getTime()) / DAG_MS)
  return { skicka: true, daysUntilDeletion: Math.max(0, RADERING_EFTER_DAGAR - dagarSedan) }
}

export const getInactivityWarningTemplate = (data: {
  firstName: string
  lastSignInAt: string
  daysUntilDeletion: number
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
    <p>Hej ${escapeHtml(data.firstName || 'du')},</p>

    <p>Vi noterar att du inte loggat in på Jobin sedan ${escapeHtml(data.lastSignInAt)}.</p>

    <div class="info-box">
      <strong>Varför detta mejl?</strong><br>
      Enligt GDPR ska vi inte spara personuppgifter längre än nödvändigt. Om du inte loggar in inom <strong>${data.daysUntilDeletion} dagar</strong> kommer ditt konto och all data raderas automatiskt.
    </div>

    <p><strong>Vill du behålla ditt konto?</strong> Logga in nedan så fortsätter allt som vanligt:</p>

    <a href="${LOGIN_URL}" class="button" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;"><span style="color:#ffffff;">Logga in på Jobin</span></a>

    <p style="margin-top: 32px;"><strong>Vill du spara din data först?</strong> Logga in och välj Inställningar → Integritet, där du kan ladda ner allt (CV, brev, profil) som en fil:</p>

    <a href="${EXPORT_URL}" class="button-secondary" style="display:inline-block;background:#ffffff;color:#4f46e5;border:1px solid #4f46e5;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">Exportera mina data</a>

    <p style="margin-top: 32px;"><strong>Vill du radera kontot direkt?</strong> Logga in och välj "Radera konto" i Inställningar.</p>

    <p>Du kan alltid kontakta oss om du har frågor: <a href="mailto:dpo@jobin.se">dpo@jobin.se</a></p>

    <p style="margin-top: 32px;">Vänliga hälsningar,<br><strong>Jobin-teamet</strong></p>

    <div class="footer">
      <p>Detta mejl skickas enligt GDPR Art 5.1.e (lagringsbegränsning). Det är inte marknadsföring och kan inte avregistreras.</p>
      <p>Jobin · <a href="${PRIVACY_URL}">Integritetspolicy</a> · <a href="mailto:dpo@jobin.se">DPO</a></p>
    </div>
  </div>
</body>
</html>
`
