/**
 * CH3 (rollspelet 2026-09-28) — Caseload-tabellen på mobil: scrollsignal + tangentbordsnåbar
 * scrollyta. Jsdom har ingen layout, så provet vaktar markeringen som gör att signalen finns
 * (synlig <sm-text, fokuserbar region, minsta tabellbredd) — inte pixlarna.
 * Motprov: ta bort hint-stycket eller tabIndex/min-w i OrganisationSektion → provet faller.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const kalla = readFileSync(resolve(__dirname, 'OrganisationSektion.tsx'), 'utf-8')

describe('caseload-tabellen på smal skärm (CH3)', () => {
  it('har en synlig scrollhint som bara visas under sm', () => {
    expect(kalla).toMatch(/data-testid="caseload-scrollhint" className="sm:hidden/)
  })
  it('scrollytan är en fokuserbar, namngiven region med minsta tabellbredd', () => {
    expect(kalla).toMatch(/role="region"\s+aria-label="Caseload per konsulent"\s+tabIndex=\{0\}/)
    expect(kalla).toMatch(/<table className="w-full min-w-\[34rem\]/)
  })
})
