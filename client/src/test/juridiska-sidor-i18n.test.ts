/**
 * Varje i18n-nyckel på de juridiska sidorna måste finnas i BÅDA språkfilerna.
 *
 * VARFÖR EN EGEN VAKT. `sprakparitet.test.ts` jämför `sv.json` mot `en.json` och hittar
 * nycklar som finns i den ena men inte den andra. En nyckel som saknas i **båda** är
 * osynlig för den — och det var precis läget: 10 av 41 nycklar i `Terms.tsx` fanns i
 * ingen av filerna. Sidan renderade i stället `t()`-anropens svenska fallback-argument,
 * så den såg rätt ut på svenska och var oöversatt på engelska, utan att någon grind
 * kunde säga det.
 *
 * Det gällde inte vilka strängar som helst: hela **screening-förbudet** (den namngivna
 * mitigeringen som håller fyra AI-funktioner utanför högriskklassning), hela
 * **AI-ansvarsfriskrivningen**, och hela avsnittet om att **wellness-funktionerna inte
 * är vård** — det som bär 1177, 112 och Mind Självmordslinjen. Portalens engelska läsare
 * är enligt `CLAUDE.md` oftast nyanländ och har varken svenska eller engelska som
 * modersmål. Krisnumren på fel språk är inte en översättningsmiss.
 *
 * VAKTEN KRÄVER ATT NYCKELN LÖSER UT, inte att `t()` returnerar något — `t()` returnerar
 * ju nyckeln själv när den saknas, vilket är exakt det tysta beteendet som gömde felet.
 *
 * AVGRÄNSNING MED AVSIKT. Mätt 2026-09-01 saknas **286 nycklar i 72 filer** i hela
 * `client/src`. Att svepa dem här hade brutit mot lärdomen från 9 augusti: ett mekaniskt
 * svep över "hela src/" betalar för dödkod (flera av filerna ligger i den onåbara
 * `components/dashboard/`) och blockerar dessutom städningen av den. Den här vakten
 * täcker de sidor där en oöversatt sträng är ett juridiskt eller säkerhetsmässigt
 * problem. Resten ligger som egen post i planen.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SIDOR = ['Terms.tsx', 'Privacy.tsx', 'AiPolicy.tsx'] as const

const sv = JSON.parse(
  readFileSync(resolve(__dirname, '../i18n/locales/sv.json'), 'utf8')
) as Record<string, unknown>
const en = JSON.parse(
  readFileSync(resolve(__dirname, '../i18n/locales/en.json'), 'utf8')
) as Record<string, unknown>

function loserUt(trad: Record<string, unknown>, nyckel: string): boolean {
  let nod: unknown = trad
  for (const del of nyckel.split('.')) {
    if (typeof nod !== 'object' || nod === null || !(del in (nod as object))) return false
    nod = (nod as Record<string, unknown>)[del]
  }
  return typeof nod === 'string' || Array.isArray(nod)
}

function nycklarI(sida: string): string[] {
  const kod = readFileSync(resolve(__dirname, '../pages', sida), 'utf8')
  const funna = [...kod.matchAll(/t\(\s*'([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)'/g)].map((m) => m[1])
  return [...new Set(funna)].sort()
}

describe.each(SIDOR)('%s — varje nyckel finns på båda språken', (sida) => {
  const nycklar = nycklarI(sida)

  it('sidan använder i18n över huvud taget', () => {
    // Positiv kontroll: utan den kan hela sviten bli grön av att regexen slutat matcha.
    expect(nycklar.length).toBeGreaterThan(5)
  })

  it('alla nycklar löser ut i sv.json', () => {
    expect(nycklar.filter((n) => !loserUt(sv, n))).toEqual([])
  })

  it('alla nycklar löser ut i en.json', () => {
    expect(nycklar.filter((n) => !loserUt(en, n))).toEqual([])
  })
})

describe('Terms — förbudet och krisstödet får inte tunnas ut', () => {
  it('screening-förbudet nämner sökning, rangordning och jämförelse', () => {
    // AG4: lydelsen är den namngivna mitigeringen i AI-ACT-CLASSIFICATION.md och bär
    // DPIA:ns R9. Skrivs den om måste båda dokumenten uppdateras i samma ändring.
    const text = JSON.stringify((sv as { terms: { noScreening: unknown } }).terms.noScreening)
    for (const ord of ['söka', 'rangordna', 'jämföra', 'kandidatdatabas']) {
      expect(text).toContain(ord)
    }
  })

  it('ingen AI väljer person åt en arbetsgivare — gränsen som håller lågrisk', () => {
    const text = JSON.stringify((sv as { terms: { noScreening: unknown } }).terms.noScreening)
    expect(text).toMatch(/Ingen AI rangordnar, poängsätter eller väljer ut personer/)
  })

  it('krisstödet bär de nummer någon faktiskt kan ringa, på båda språken', () => {
    for (const trad of [sv, en]) {
      const text = JSON.stringify((trad as { terms: { notHealthcare: unknown } }).terms.notHealthcare)
      expect(text).toContain('1177')
      expect(text).toContain('112')
      expect(text).toContain('90101')
    }
  })
})
