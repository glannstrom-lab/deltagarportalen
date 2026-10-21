// Mejlmallen för engangskod (KC6). Egen modul utan Deno-importer så att den kan
// renderingstestas från vitest (samma skäl som losenord-aterstall/mall.ts).
import { escapeHtml, SHARED_STYLES } from '../send-invite-email/mallar.ts'

export interface EngangskodMallData {
  /** Sexsiffrig kod att skriva in på inloggningssidan. */
  kod: string
  /** Länk som loggar in direkt (token_hash), för den som öppnar mejlet på samma enhet. */
  actionUrl: string
}

export const AMNE = 'Din kod för att logga in på Jobin'

export const getEngangskodEmailTemplate = (data: EngangskodMallData) => `
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
    <h1>Din kod för att logga in</h1>
  </div>

  <div class="content">
    <p style="font-size: 16px;">
      Skriv in den här koden på <strong>jobin.se</strong> för att logga in:
    </p>

    <p style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;margin:20px 0;font-family:ui-monospace,Menlo,Consolas,monospace;color:#134e4a;">${escapeHtml(data.kod)}</p>

    <p style="font-size: 16px;">Eller tryck på knappen:</p>

    <center>
      <a href="${escapeHtml(data.actionUrl)}" class="button" style="display:inline-block;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f766e;color:#ffffff;"><span style="color:#ffffff;">Logga in</span></a>
    </center>

    <p class="expiry">Koden och länken fungerar en gång och bara en kort tid.</p>

    <p class="small">
      Om knappen inte fungerar, kopiera den här länken till webbläsaren:<br>
      <span class="fallback-link">${escapeHtml(data.actionUrl)}</span>
    </p>

    <p class="small">Bad du inte om en kod? Då kan du strunta i mejlet. Ingen kan logga in utan koden.</p>
  </div>

  <div class="footer">
    <p>Svar till den här adressen läses inte.</p>
    <p>&copy; ${new Date().getFullYear()} Jobin · jobin.se</p>
  </div>
</body>
</html>
`
