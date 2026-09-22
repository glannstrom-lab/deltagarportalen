/**
 * Jobbevakningens mejl stoppade in bevakningsnamnet och Arbetsförmedlingens
 * annonsfält oeskaperade i HTML:en (2026-09-22).
 *
 * `alert.name` skriver användaren själv, och annonsrubrik, arbetsgivarnamn och
 * ort kommer från en extern källa som vi inte styr. De två andra mejl-cronerna
 * (`aktivitet-mejl.js`, `pass-paminnelse.js`) har `esc()` sedan DE1 — den här
 * hade det aldrig. Ett `<` i en rubrik ("Lagerarbetare <heltid>") räckte för
 * att sväljas som tagg; ett `"` i annons-id:t bröt ut ur href-attributet.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { templates } = require(resolve(__dirname, '../../api/job-alerts.js')) as {
  templates: {
    newJobsAlert: (n: string, jobs: unknown[], e: string) => { html: string; text: string; subject: string }
    dailyDigest: (alerts: unknown[], e: string) => { html: string; text: string }
  }
}

const ELAK = '<img src=x onerror="alert(1)">'
const JOBB = {
  id: '123"><script>alert(2)</script>',
  headline: 'Lagerarbetare <heltid> & natt',
  employer: { name: `Bolag ${ELAK}` },
  workplace_address: { municipality: '<b>Solna</b>' },
  publication_date: '2026-09-20T08:00:00Z',
}

describe('job-alerts: mejlmallarna eskaperar allt som inte är vårt', () => {
  it('newJobsAlert: bevakningsnamn och annonsfält hamnar inte som HTML', () => {
    const { html } = templates.newJobsAlert(ELAK, [JOBB], 'a@b.se')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<heltid>')
    expect(html).not.toContain('<b>Solna')
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    expect(html).toContain('Lagerarbetare &lt;heltid&gt; &amp; natt')
    // Annons-id:t är en del av en URL — det ska procentkodas, inte bryta ut ur href.
    expect(html).toContain('annonser/123%22%3E%3Cscript%3Ealert(2)%3C%2Fscript%3E"')
  })

  it('dailyDigest: samma sak för sammanfattningen', () => {
    const { html } = templates.dailyDigest([{ name: ELAK, newJobs: [JOBB] }], 'a@b.se')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<heltid>')
    expect(html).toContain('🔔 &lt;img')
  })

  it('texten (text/plain) lämnas oeskaperad — där finns ingen HTML att tolka', () => {
    const { text } = templates.newJobsAlert('Lager & truck', [JOBB], 'a@b.se')
    expect(text).toContain('"Lager & truck"')
  })
})
