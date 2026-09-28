// Mejlmallen för losenord-aterstall. Egen modul utan Deno-importer så att den kan
// renderingstestas från vitest (samma skäl som send-invite-email/mallar.ts).
import { escapeHtml, SHARED_STYLES } from '../send-invite-email/mallar.ts'

export interface AterstallMallData {
  actionUrl: string
}

export const AMNE = 'Välj ett nytt lösenord till Jobin'

export const getAterstallEmailTemplate = (data: AterstallMallData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${AMNE}</title>
  <style>
    ${SHARED_STYLES}
  </style>
</head>
<body>
  <div class="header" style="padding:32px 30px;border-radius:12px 12px 0 0;background:#d7efe6;color:#134e4a;">
    <h1>Välj ett nytt lösenord</h1>
  </div>

  <div class="content">
    <p style="font-size: 16px;">
      Någon bad om ett nytt lösenord till ditt konto på <strong>jobin.se</strong>.
      Tryck på knappen och välj ett nytt lösenord.
    </p>

    <center>
      <a href="${escapeHtml(data.actionUrl)}" class="button" style="display:inline-block;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f766e;color:#ffffff;"><span style="color:#ffffff;">Välj nytt lösenord</span></a>
    </center>

    <p class="expiry">Länken fungerar en gång och bara en kort tid.</p>

    <p class="small">
      Om knappen inte fungerar, kopiera den här länken till webbläsaren:<br>
      <span class="fallback-link">${escapeHtml(data.actionUrl)}</span>
    </p>

    <p class="small">Bad du inte om det här? Då kan du strunta i mejlet. Ditt lösenord ändras inte förrän någon väljer ett nytt via länken.</p>
  </div>

  <div class="footer">
    <p>Svar till den här adressen läses inte.</p>
    <p>&copy; ${new Date().getFullYear()} Jobin · jobin.se</p>
  </div>
</body>
</html>
`
