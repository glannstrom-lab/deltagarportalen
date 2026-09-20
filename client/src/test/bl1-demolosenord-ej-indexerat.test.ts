/**
 * BL1 (2026-09-20) — grind: demokontonas lösenord får inte hamna på en
 * sökbar sida.
 *
 * `demo@jobin.se`/`visa-jobin-2026` och `anna.exempel@example.com`/
 * `prova-anna-2026` är riktiga lösenord mot portalens riktiga auth-system.
 * De låg i `content/b2b.json` och renderades rakt ut på B2B-sidorna, som
 * sätter `<meta name="robots" content="index, follow">` med flit. Google,
 * Wayback Machine och automatiska secret-scanners hittar och BEHÅLLER en
 * sådan sida — hos precis den GDPR-medvetna kommunkund sidorna vänder sig
 * till. Att datan är sandboxad och återställs varje natt ändrar inte att
 * lösenordet aldrig byts.
 *
 * Grinden renderar ur mallen i stället för att läsa `dist/`. En grind som
 * läser byggkatalogen kan bli falskt grön på förra byggets utdata — filer
 * städas inte bort för borttagna källor (lärdomen
 * `grind-som-laser-dist-kan-ge-falskt-gront`).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderB2B, renderDemo } = require('../../scripts/lib/guide-template.cjs') as {
  renderB2B: (b: Record<string, unknown>, guider: unknown[]) => string
  renderDemo: (d: Record<string, unknown>) => string
}

const b2b = JSON.parse(
  readFileSync(resolve(__dirname, '../../content/b2b.json'), 'utf-8'),
) as { sidor: Record<string, unknown>[]; demoSida?: Record<string, unknown> }

/** Alla lösenord som finns i datan — härledda, inte hårdkodade. */
const losenord: string[] = ((b2b.demoSida?.konton as Array<{ losenord: string }>) ?? []).map(
  (k) => k.losenord,
)

describe('BL1: lösenorden bara på den icke-sökbara sidan', () => {
  it('det finns demokonton att skydda (annars provar grinden ingenting)', () => {
    expect(losenord.length).toBeGreaterThan(0)
    for (const l of losenord) expect(l.length).toBeGreaterThan(4)
  })

  it.each(b2b.sidor.map((s) => [s.slug as string, s] as const))(
    'B2B-sidan /%s/ bär inget lösenord',
    (_slug, sida) => {
      const html = renderB2B(sida, [])
      // Sidan ska fortfarande vara sökbar — det är hela poängen med den.
      expect(html).toContain('<meta name="robots" content="index, follow">')
      for (const l of losenord) expect(html).not.toContain(l)
    },
  )

  it('/demo/ är noindex och bär uppgifterna', () => {
    expect(b2b.demoSida, 'demoSida saknas i b2b.json').toBeTruthy()
    const html = renderDemo(b2b.demoSida!)
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">')
    expect(html).not.toContain('content="index, follow"')
    for (const l of losenord) expect(html).toContain(l)
  })

  it('demouppgifterna står inte i någon indexerad texts löpande innehåll', () => {
    // FAQ-svaren bar samma lösenord i klartext, utanför kontoblocket — en
    // andra förekomst som en grind mot bara kontoblocket hade missat.
    const rå = readFileSync(resolve(__dirname, '../../content/b2b.json'), 'utf-8')
    const forekomster = losenord.flatMap((l) => rå.split(l).slice(1).map(() => l))
    // Exakt en förekomst per lösenord: raden i demoSida.konton.
    expect(forekomster.length).toBe(losenord.length)
  })

  it('sitemapen listar inte /demo/', () => {
    const generator = readFileSync(resolve(__dirname, '../../scripts/generate-sitemap.cjs'), 'utf-8')
    expect(generator).not.toContain('demoSida')
  })
})
