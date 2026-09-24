/**
 * Edge-funktionernas mejlmallar och ett påhittat lönefält (2026-09-24).
 *
 * Tre fynd i supabase/functions, vart och ett bevisat innan det rättades:
 *
 * 1. send-inactivity-warning — länkarna saknade `#`. Portalen kör HashRouter,
 *    så `https://jobin.se/login` landar på startsidan (mätt: 307 → www, 200,
 *    startsidans <title>). Exportlänken hade `?tab=privacy`, men Settings.tsx
 *    läser `?section=` — den hade öppnat profilfliken även med rätt värd.
 *    Dessutom fick den som loggat in EFTER att raden köades ändå "du har inte
 *    loggat in sedan …". Mall + beslut bor nu i send-inactivity-warning/mall.ts.
 *
 * 2. send-invite-email — deltagarmallarna satte konsulentens namn, förnamnet
 *    och det personliga meddelandet oeskaperat i HTML:en, och meddelandets
 *    radbrytningar försvann. Mallarna bor nu i send-invite-email/mallar.ts.
 *
 * 3. af-historical — `byExperience` var fyra påhittade tal (p25, median×0,95,
 *    median×1,1, p75) under etiketten "JobSearch API".
 *
 * Modulerna är fria från Deno- och URL-importer och laddas här på riktigt;
 * index.ts anropar serve() vid import och kan inte laddas i vitest.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  LOGIN_URL,
  EXPORT_URL,
  PRIVACY_URL,
  beslutaVarning,
  getInactivityWarningTemplate,
} from '../../../supabase/functions/send-inactivity-warning/mall.ts'
import * as inbjudningsmallar from '../../../supabase/functions/send-invite-email/mallar.ts'
import {
  getGenericInviteEmailTemplate,
  getEmployerInviteEmailTemplate,
  meddelandeHtml,
} from '../../../supabase/functions/send-invite-email/mallar.ts'

function las(rel: string): string {
  return readFileSync(resolve(__dirname, rel), 'utf8').replace(/\r\n/g, '\n')
}

describe('send-inactivity-warning — länkarna når rätt vy i en HashRouter-app', () => {
  it('alla portallänkar går via #/ på www.jobin.se', () => {
    for (const url of [LOGIN_URL, EXPORT_URL, PRIVACY_URL]) {
      expect(url.startsWith('https://www.jobin.se/#/')).toBe(true)
    }
  })

  it('exportlänken använder parametern Settings.tsx faktiskt läser', () => {
    const settings = las('../pages/Settings.tsx')
    expect(settings).toContain("searchParams.get('section')")
    expect(EXPORT_URL).toContain('#/settings?section=privacy')
  })

  it('den renderade mallen bär länkarna — och ingen hash-lös portallänk', () => {
    const html = getInactivityWarningTemplate({ firstName: 'Anna', lastSignInAt: 'mars 2025', daysUntilDeletion: 150 })
    expect(html).toContain(`href="${LOGIN_URL}"`)
    expect(html).toContain(`href="${EXPORT_URL}"`)
    expect(html).toContain(`href="${PRIVACY_URL}"`)
    expect(html).not.toMatch(/href="https:\/\/(www\.)?jobin\.se\/(?!#)/)
  })

  it('förnamnet eskaperas', () => {
    const html = getInactivityWarningTemplate({ firstName: '<img src=x>', lastSignInAt: 'mars 2025', daysUntilDeletion: 1 })
    expect(html).not.toContain('<img src=x>')
    expect(html).toContain('&lt;img src=x&gt;')
  })
})

describe('send-inactivity-warning — varningen går bara till den som fortfarande är inaktiv', () => {
  const nu = new Date('2026-09-24T10:00:00Z')

  it('inloggad efter att raden köades → skickas inte', () => {
    expect(beslutaVarning('2026-09-20T08:00:00Z', nu)).toEqual({ skicka: false, skal: 'aktiv_igen' })
  })

  it('aldrig inloggad → skickas inte (retention-jobbet rör inte sådana konton)', () => {
    expect(beslutaVarning(null, nu)).toEqual({ skicka: false, skal: 'aldrig_inloggad' })
  })

  it('inaktiv i 18+ månader → skickas, med dagar kvar till 730', () => {
    const b = beslutaVarning('2025-03-20T10:00:00Z', nu)
    expect(b.skicka).toBe(true)
    if (b.skicka) {
      expect(b.daysUntilDeletion).toBeGreaterThan(0)
      expect(b.daysUntilDeletion).toBeLessThan(730 - 540)
    }
  })

  it('index.ts fattar beslutet innan mejlet byggs, och tar bort den inaktuella raden', () => {
    const kod = las('../../../supabase/functions/send-inactivity-warning/index.ts')
    const beslut = kod.indexOf('beslutaVarning(user.last_sign_in_at)')
    const skicka = kod.indexOf("fetchMedTimeout('https://api.resend.com/emails'")
    expect(beslut).toBeGreaterThan(0)
    expect(beslut).toBeLessThan(skicka)
    expect(kod).toMatch(/if \(!beslut\.skicka\) \{[\s\S]*?\.from\('email_queue'\)\s*\.delete\(\)/)
    // Den gamla inbäddade mallen med hash-lösa länkar får inte komma tillbaka.
    expect(kod).not.toContain("'https://jobin.se/login'")
  })
})

describe('send-invite-email — allt som interpoleras eskaperas', () => {
  const farligt = '<a href="https://evil.example">Klicka</a> & <b>fet'
  const bas = {
    firstName: '<i>Anna</i>',
    consultantName: farligt,
    consultantEmail: 'k@x.se"><script>',
    inviteUrl: 'https://www.jobin.se/#/invite/abc?x=1&y=2',
    message: 'Hej!\nVi ses på måndag <3\n\nMvh',
    expiresAt: '1 oktober 2026',
  }

  it('den generella mallen: ingen rå HTML från konsulent eller deltagare', () => {
    const html = getGenericInviteEmailTemplate(bas)
    expect(html).not.toContain('<a href="https://evil.example">')
    expect(html).not.toContain('<b>fet')
    expect(html).not.toContain('<i>Anna</i>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;')
    // Radbrytningarna i meddelandet överlever som <br>.
    expect(html).toContain('Hej!<br>')
    expect(html).toContain('måndag &lt;3<br>')
    // Länken är korrekt attributkodad (& → &amp;), fortfarande samma URL för klienten.
    expect(html).toContain('href="https://www.jobin.se/#/invite/abc?x=1&amp;y=2"')
  })

  it('företagsmallen eskaperar länken också', () => {
    const html = getEmployerInviteEmailTemplate({
      firstName: 'Per',
      companyName: 'A & B <AB>',
      invitedByName: farligt,
      invitedByKind: 'konsulent',
      existingAccount: false,
      actionUrl: 'https://x.supabase.co/auth/v1/verify?token=t&type=invite',
      expiresAt: '1 oktober 2026',
    })
    expect(html).toContain('A &amp; B &lt;AB&gt;')
    expect(html).not.toContain('<a href="https://evil.example">')
    expect(html).toContain('verify?token=t&amp;type=invite')
  })

  it('meddelandeHtml: CRLF och tomt värde', () => {
    expect(meddelandeHtml('a\r\nb')).toBe('a<br>\n      b')
    expect(meddelandeHtml(undefined)).toBe('')
  })
})

describe('af-historical — inga påhittade tal', () => {
  it('skickar ingen erfarenhetsfördelning härledd ur medianen', () => {
    const kod = las('../../../supabase/functions/af-historical/index.ts')
    // Kodformen, inte ordet — ordet står kvar i förklaringskommentaren.
    expect(kod).not.toMatch(/byExperience\s*[=,]/)
    expect(kod).not.toMatch(/median\s*\*\s*(0\.95|1\.1)/)
  })
})

// STA arkiverades 2026-09-12. Inbjudningsmejlet hade kvar en egen STA-mall som
// valdes när invitations.metadata.program = 'steg_till_arbete' och lovade att
// "Steg till arbete är aktiverat direkt". Ingen kod skapar sådana inbjudningar
// (0 rader i prod 2026-09-24, sta_bulk_invite ej körbar för authenticated).
describe('send-invite-email — ingen STA-gren kvar', () => {
  it('mallar.ts exporterar ingen STA-mall', () => {
    expect(inbjudningsmallar).not.toHaveProperty('getStaInviteEmailTemplate')
  })

  it('index.ts väljer inte mall eller ämnesrad efter programmet', () => {
    const kod = las('../../../supabase/functions/send-invite-email/index.ts')
    expect(kod).not.toContain("'steg_till_arbete'")
    expect(kod).not.toContain('Steg till arbete')
    expect(kod).not.toContain('sta_enrollment_id')
  })
})
