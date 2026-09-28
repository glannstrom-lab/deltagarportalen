/**
 * Regressionsprov för de kritiska fynden i rollspelet 2026-09-28
 * (docs/review-2026-09-28-rollspel/). Varje prov ska kunna falla — se
 * kommentaren vid respektive block för vilken mutation det fäller.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { planOmfang, deltagarEtikett } from '@/components/consultant/rapportOmfang'
import { startaSparadOversattning } from '@/services/sidoversattning'

const SRC = join(__dirname, '..')

function allaFiler(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return n === 'node_modules' ? [] : allaFiler(p)
    return /\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : []
  })
}

describe('CH1: Rapporter säger vilket omfång som gäller', () => {
  it('chef och admin räknar hela enheten, alla andra sina egna', () => {
    expect(planOmfang(['chef'])).toBe('enheten')
    expect(planOmfang(['konsulent', 'admin'])).toBe('enheten')
    expect(planOmfang(['konsulent'])).toBe('egna')
    expect(planOmfang(['handlaggare'])).toBe('egna')
    expect(planOmfang([])).toBe('egna')
  })

  it('en kollegas deltagare får konsulentens namn, inte ett id-fragment', () => {
    const egna = new Map([['p-egen', 'Anna Exempel']])
    const kollegor = [{ user_id: 'k-1', first_name: 'Kim', last_name: 'Kollega' }]
    expect(deltagarEtikett({ participant_id: 'p-egen', consultant_id: 'jag' }, egna, kollegor)).toBe('Anna Exempel')
    expect(deltagarEtikett({ participant_id: 'abcd1234-x', consultant_id: 'k-1' }, egna, kollegor)).toBe('Deltagare hos Kim Kollega (abcd)')
    expect(deltagarEtikett({ participant_id: 'abcd1234-x', consultant_id: 'okand' }, egna, kollegor)).toBe('Deltagare abcd1234')
  })
})

describe('NY1: Översätt sidan startar oberoende av layout', () => {
  beforeEach(() => {
    document.head.querySelectorAll('script[src*="translate.google.com"]').forEach((s) => s.remove())
    localStorage.clear()
  })

  it('laddar Googles skript vid start när ett språk är valt', () => {
    localStorage.setItem('googleTranslateLanguage', 'ar')
    startaSparadOversattning()
    expect(document.head.querySelector('script[src*="translate.google.com/translate_a/element.js"]')).not.toBeNull()
  })

  it('skickar ingenting till Google när inget språk är valt', () => {
    startaSparadOversattning()
    expect(document.head.querySelector('script[src*="translate.google.com"]')).toBeNull()
  })

  it('anropas från main.tsx, inte bara från toppnavens komponent (som saknas på mobil)', () => {
    const main = readFileSync(join(SRC, 'main.tsx'), 'utf8')
    expect(main).toMatch(/^startaSparadOversattning\(\)/m)
  })
})

describe('UT1 och EG1: inga låtsade AI-anrop, inga delade fält-id:n', () => {
  const filer = allaFiler(SRC)

  it('ingen komponent simulerar en AI-väntan', () => {
    const traffar = filer.filter((f) => /Simulate AI|simulera(r)? AI/i.test(readFileSync(f, 'utf8')))
    expect(traffar).toEqual([])
  })

  it('CV-byggarens fält har inget hårdkodat id', () => {
    const cv = readFileSync(join(SRC, 'pages', 'CVBuilder.tsx'), 'utf8')
    expect(cv).not.toMatch(/id="cvbuilder-f\d+"/)
    expect(cv).not.toMatch(/htmlFor="cvbuilder-f\d+"/)
  })
})
